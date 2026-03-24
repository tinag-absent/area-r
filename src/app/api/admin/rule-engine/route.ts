/**
 * GET   /api/admin/rule-engine  — ルールエントリ一覧取得
 * POST  /api/admin/rule-engine  — ルールエントリ追加
 * PATCH /api/admin/rule-engine  — ルールエントリの有効/無効切り替え
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute } from "@/lib/db";
import { randomUUID } from "crypto";
import type { RuleEngineType } from "@/lib/types";

export const GET = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const db = getDb();
  const rules = await queryAll(db,
    `SELECT id, type, active, priority, data_json, created_at FROM rule_engine_entries ORDER BY type, priority DESC, created_at DESC`
  );
  return NextResponse.json(rules);
}
);

export const POST = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  let body: { type?: string; data?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 }); }
  if (!body.type || !body.data) return NextResponse.json({ error: "type と data が必要です" }, { status: 400 });

  // SEC-6: typeをホワイトリストで検証
  const ALLOWED_TYPES: RuleEngineType[] = ["xp_rule", "anomaly_rule", "arg_keyword", "known_flag", "schedule"];
  if (!ALLOWED_TYPES.includes(body.type as RuleEngineType))
    return NextResponse.json({ error: `type は ${ALLOWED_TYPES.join(" | ")} のいずれかである必要があります` }, { status: 400 });
  const db = getDb();
  await execute(db,
    `INSERT INTO rule_engine_entries (id, type, active, priority, data_json) VALUES (?,?,1,0,?)`,
    [randomUUID(), body.type, JSON.stringify(body.data)]
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
);

export const PATCH = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  let body: { id?: string; active?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });
  const db = getDb();
  await execute(db, `UPDATE rule_engine_entries SET active=? WHERE id=?`, [body.active ?? 0, body.id]);
  return NextResponse.json({ ok: true });
}
);
