/**
 * POST /api/auth/login
 *
 * 機関員認証エンドポイント。
 * - IPとアカウント単位の二重レート制限
 * - bcrypt.compare によるパスワード検証
 * - pending_verification ユーザーはパスワード確認後に active へ昇格
 * - JWT を HttpOnly Cookie に設定して返す
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors, makeRateLimitResponse } from "@/lib/api-error";
import { getDb, queryOne, execute } from "@/lib/db";
import {
  comparePassword,
  signToken,
  setAuthCookie,
  calculateLevel,
} from "@/lib/auth";
import type { DbUser } from "@/lib/auth";
import type { UserStatus } from "@/lib/types";
import { randomUUID } from "crypto";
import { toSqliteUtc } from "@/lib/date";
import { checkAndGrantAchievements } from "@/lib/achievements";

// ─────────────────────────────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────────────────────────────

/** レート制限の計測ウィンドウ（秒） */
const RATE_WINDOW_SECS = 600; // 10分

/** 1ウィンドウ内でIPが失敗できる最大回数 */
const MAX_IP_FAILS = 20;

/** 1ウィンドウ内でアカウントが失敗できる最大回数 */
const MAX_ACCT_FAILS = 10;

/** ログインを拒否するステータス一覧 */
const BLOCKED_STATUSES: UserStatus[] = ["banned", "suspended", "inactive"];

// ─────────────────────────────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────────────────────────────

/** 指定ウィンドウ内の失敗回数が上限に達しているか確認する */
async function isRateLimited(
  db: ReturnType<typeof getDb>,
  keyType: string,
  keyValue: string,
  max: number
): Promise<boolean> {
  const since = toSqliteUtc(new Date(Date.now() - RATE_WINDOW_SECS * 1000));
  const row = await queryOne<{ cnt: number }>(
    db,
    `SELECT COUNT(*) AS cnt FROM rate_limit_attempts
     WHERE key_type = ? AND key_value = ? AND success = 0 AND attempted_at > ?`,
    [keyType, keyValue, since]
  );
  return (row?.cnt ?? 0) >= max;
}

/** ログイン試行を rate_limit_attempts テーブルに記録する */
async function recordAttempt(
  db: ReturnType<typeof getDb>,
  keyType: string,
  keyValue: string,
  success: boolean
): Promise<void> {
  await execute(
    db,
    `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+24 hours'))`,
    [randomUUID(), keyType, keyValue, success ? 1 : 0]
  );
}

/**
 * リクエスト元のIPアドレスを取得する。
 * Cloudflare → Nginx → x-forwarded-for の優先順で読む。
 * x-forwarded-for はカンマ区切りの先頭のみ使用（スプーフィング対策）。
 */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// ─────────────────────────────────────────────────────────────────────
// ルートハンドラ
// ─────────────────────────────────────────────────────────────────────

export const POST = withErrorHandler(
  async (req: NextRequest) => {
  // CSRF ガード（middleware でも確認済みだが API 単体でも保護）
  if (!req.headers.get("X-Requested-With")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { username, password } = body;

  // エラーメッセージは成功/失敗を区別しない（ユーザー列挙攻撃対策）
  if (!username || typeof username !== "string" || username.length > 32) {
    return NextResponse.json(
      { error: "IDまたはパスキーが正しくありません。" },
      { status: 401 }
    );
  }
  // bcrypt DoS 対策: 256文字超のパスワードを事前に弾く
  if (!password || typeof password !== "string" || password.length > 256) {
    return NextResponse.json(
      { error: "IDまたはパスキーが正しくありません。" },
      { status: 401 }
    );
  }

  const ip = getClientIp(req);
  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // IP 単位のレート制限チェック
  if (await isRateLimited(db, "ip_login", ip, MAX_IP_FAILS)) {
    return makeRateLimitResponse(RATE_WINDOW_SECS);
  }

  // ユーザーを取得（username または agent_id どちらでも可、大文字小文字無視）
  const dbUser = await queryOne<DbUser>(
    db,
    "SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(agent_id) = LOWER(?)",
    [username, username]
  );

  if (!dbUser) {
    await recordAttempt(db, "ip_login", ip, false);
    return NextResponse.json(
      { error: "IDまたはパスキーが正しくありません。" },
      { status: 401 }
    );
  }

  // アカウント単位のレート制限チェック
  if (await isRateLimited(db, "acct_login", dbUser.id, MAX_ACCT_FAILS)) {
    return makeRateLimitResponse(RATE_WINDOW_SECS);
  }

  // ステータス確認（banned / suspended / inactive は即時拒否）
  if (BLOCKED_STATUSES.includes(dbUser.status)) {
    return NextResponse.json(
      { error: "このアカウントはアクセスできません。" },
      { status: 403 }
    );
  }

  // パスワード検証
  const isPasswordCorrect = await comparePassword(password, dbUser.password_hash);
  if (!isPasswordCorrect) {
    await recordAttempt(db, "ip_login", ip, false);
    await recordAttempt(db, "acct_login", dbUser.id, false);
    return NextResponse.json(
      { error: "IDまたはパスキーが正しくありません。" },
      { status: 401 }
    );
  }

  // ── 認証成功 ─────────────────────────────────────────────────────

  await recordAttempt(db, "ip_login", ip, true);
  await recordAttempt(db, "acct_login", dbUser.id, true);

  // pending_verification はパスワード確認後に active へ昇格
  const newStatus =
    dbUser.status === "pending_verification" ? "active" : dbUser.status;

  // XP から現在のレベルを再計算（DB と JWT の乖離を防ぐ）
  const currentLevel = calculateLevel(Number(dbUser.xp_total ?? 0));

  await execute(
    db,
    "UPDATE users SET login_count = login_count + 1, status = ?, clearance_level = ? WHERE id = ?",
    [newStatus, currentLevel, dbUser.id]
  );

  // アクセスログ（fire & forget — 失敗しても認証処理を止めない）
  execute(
    db,
    "INSERT INTO access_logs (id, user_id, method, path, status_code) VALUES (?, ?, ?, ?, ?)",
    [randomUUID(), dbUser.id, "POST", "/api/auth/login", 200]
  ).catch(() => {});

  // JWT を発行して HttpOnly Cookie にセット
  const token = await signToken({
    id:      dbUser.id,
    agentId: dbUser.agent_id,
    role:    dbUser.role,
    level:   currentLevel,
  });

  // [Fix] 実績チェックは login_count UPDATE の後に await で実行する。
  // fire & forget だと login_count が DB に反映される前に SELECT が走り、
  // first_login (loginCount >= 1) が永遠に解除されない。
  await checkAndGrantAchievements(dbUser.id).catch(() => {});

  return setAuthCookie(NextResponse.json({ ok: true }), token);
}
);
