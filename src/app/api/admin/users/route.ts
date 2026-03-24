/**
 * GET   /api/admin/users  — ユーザー一覧取得（検索対応）
 * PATCH /api/admin/users  — ユーザー情報の管理者更新（status・role・XP・異常スコアなど）
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { requireAdmin, requireSuperAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute, queryOne } from "@/lib/db";
import type {
  AdminEditableField,
  AdminFieldValueMap,
  UserRole,
  UserStatus,
} from "@/lib/types";

export const GET = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const q  = searchParams.get("q") ?? "";
  const db = getDb();

  const users = await queryAll(db,
    `SELECT id, agent_id, username, display_name, role, status, clearance_level, xp_total,
            anomaly_score, consecutive_login_days, last_login_at, created_at, division_id
     FROM users
     WHERE username LIKE ? OR agent_id LIKE ?
     ORDER BY created_at DESC LIMIT 100`,
    [`%${q}%`, `%${q}%`]
  );
  return NextResponse.json(users);
}
);

// ─── SEC-3: フィールドごとの value バリデーション ──────────────────────

const VALID_STATUSES: UserStatus[]             = ["active", "inactive", "suspended", "banned", "pending_verification"];
// SEC-2: adminが設定できるroleからsuper_adminを除外
const VALID_ROLES_FOR_ADMIN: Exclude<UserRole, "super_admin">[] = ["player", "observer", "admin"];
const VALID_ROLES_FOR_SUPER:  UserRole[]                        = ["player", "observer", "admin", "super_admin"];
const CLEARANCE_LEVELS = [0, 1, 2, 3, 4, 5] as const;

function validateValue(
  field: AdminEditableField,
  value: unknown,
  callerRole: UserRole
): { ok: true; value: AdminFieldValueMap[typeof field] } | { ok: false; error: string } {

  switch (field) {
    case "status": {
      if (!VALID_STATUSES.includes(value as UserStatus))
        return { ok: false, error: `status は ${VALID_STATUSES.join(" | ")} のいずれかである必要があります` };
      return { ok: true, value: value as UserStatus };
    }
    case "role": {
      // SEC-2: admin ロールは super_admin への昇格が不可
      const allowed = callerRole === "super_admin" ? VALID_ROLES_FOR_SUPER : VALID_ROLES_FOR_ADMIN;
      if (!allowed.includes(value as UserRole))
        return { ok: false, error: `あなたの権限で設定できる role は ${allowed.join(" | ")} です` };
      return { ok: true, value: value as AdminFieldValueMap["role"] };
    }
    case "clearance_level": {
      const n = Number(value);
      if (!Number.isInteger(n) || !(CLEARANCE_LEVELS as readonly number[]).includes(n))
        return { ok: false, error: "clearance_level は 0〜5 の整数である必要があります" };
      return { ok: true, value: n as AdminFieldValueMap["clearance_level"] };
    }
    case "xp_total": {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 9_999_999)
        return { ok: false, error: "xp_total は 0〜9,999,999 の整数である必要があります" };
      return { ok: true, value: n };
    }
    case "anomaly_score": {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 100)
        return { ok: false, error: "anomaly_score は 0〜100 の数値である必要があります" };
      return { ok: true, value: n };
    }
  }
}

export const PATCH = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  let body: { userId?: string; field?: string; value?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { userId, field, value } = body;
  if (!userId || typeof userId !== "string") return NextResponse.json({ error: "userId が必要です" }, { status: 400 });
  if (!field  || typeof field  !== "string") return NextResponse.json({ error: "field が必要です" },  { status: 400 });

  const ALLOWED_FIELDS: AdminEditableField[] = ["status", "role", "clearance_level", "xp_total", "anomaly_score"];
  if (!ALLOWED_FIELDS.includes(field as AdminEditableField))
    return NextResponse.json({ error: "変更できないフィールドです" }, { status: 400 });

  // SEC-3: value のバリデーション
  const validated = validateValue(field as AdminEditableField, value, auth.user.role);
  if (!validated.ok)
    return NextResponse.json({ error: validated.error }, { status: 400 });

  const db = getDb();

  // SEC-7: 更新対象ユーザーが存在するか確認
  const target = await queryOne<{ id: string }>(db, "SELECT id FROM users WHERE id = ?", [userId]);
  if (!target)
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  await execute(db, `UPDATE users SET ${field}=? WHERE id=?`, [validated.value, userId]);
  return NextResponse.json({ ok: true });
}
);
