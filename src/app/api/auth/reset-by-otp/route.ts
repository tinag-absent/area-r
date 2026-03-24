/**
 * POST /api/auth/reset-by-otp
 *
 * OTP（メール認証コード）によるパスワードリセット。未認証で呼び出し可能。
 *
 * フロー:
 *   1. action: "request"  → OTPトークンを発行してDBに保存、クライアントへ返す
 *      （クライアントはこのトークンをEmailJSで自分でメール送信する）
 *   2. action: "verify"   → OTPトークン検証のみ（有効なら resetToken を返す）
 *   3. action: "reset"    → resetToken + newPassword でパスワード更新
 *
 * rate_limit_attempts テーブルを再利用してレート制限を適用。
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors, makeRateLimitResponse } from "@/lib/api-error";
import { getDb, queryOne, execute } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { randomUUID } from "crypto";
import { toSqliteUtc } from "@/lib/date";

const OTP_WINDOW_SECS  = 600;  // OTP有効期限: 10分
const RESET_WINDOW_SECS = 1800; // resetToken有効期限: 30分
const MAX_OTP_FAILS    = 5;    // 10分間の失敗上限

/** OTPトークンの一時テーブル代わりに rate_limit_attempts を流用する代わりに
 *  progress_flags テーブルを使う（user_id, flag_key = "otp_reset:{agentId}"）
 *  ※ progress_flags は外部キー users(id) を参照するため、user_id が必要
 *  → otp_reset_tokens テーブルがないので rule_engine_entries を一時ストアとして使う
 *  → 最もシンプルな方法: rate_limit_attempts の key_value に otp値を含めて保存 */

// OTPをDBに保存（key_type='otp_reset', key_value='{agentId}:{otp}:{resetToken}:{expiry}'）
async function storeOtp(
  db: ReturnType<typeof getDb>,
  agentId: string,
  otp: string,
  resetToken: string
): Promise<void> {
  const expiry = Date.now() + OTP_WINDOW_SECS * 1000;
  const value  = `${agentId}:${otp}:${resetToken}:${expiry}`;
  // 古いOTPを削除してから新規保存
  await execute(db,
    `DELETE FROM rate_limit_attempts WHERE key_type = 'otp_reset' AND key_value LIKE ?`,
    [`${agentId}:%`]
  );
  await execute(db,
    `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, attempted_at, expires_at)
     VALUES (?, 'otp_reset', ?, 1, datetime('now', datetime('now', '+24 hours')))`,
    [randomUUID(), value]
  );
}

// OTPを検証して resetToken を返す
async function verifyOtp(
  db: ReturnType<typeof getDb>,
  agentId: string,
  otp: string
): Promise<{ valid: boolean; resetToken?: string; reason?: string }> {
  const row = await queryOne<{ id: string; key_value: string }>(db,
    `SELECT id, key_value FROM rate_limit_attempts
     WHERE key_type = 'otp_reset' AND key_value LIKE ? ORDER BY attempted_at DESC LIMIT 1`,
    [`${agentId}:%`]
  );
  if (!row) return { valid: false, reason: "OTPが見つかりません。もう一度送信してください。" };

  const parts = row.key_value.split(":");
  if (parts.length < 4) return { valid: false, reason: "OTPが無効です。" };

  const [storedAgent, storedOtp, storedToken, expiryStr] = parts;
  if (storedAgent !== agentId) return { valid: false, reason: "OTPが無効です。" };
  if (Date.now() > Number(expiryStr)) {
    await execute(db, `DELETE FROM rate_limit_attempts WHERE id = ?`, [row.id]);
    return { valid: false, reason: "認証コードの有効期限が切れました。もう一度送信してください。" };
  }
  if (storedOtp !== otp) return { valid: false, reason: "認証コードが正しくありません。" };

  // 検証成功: OTPを消費してリセットトークンを発行
  await execute(db, `DELETE FROM rate_limit_attempts WHERE id = ?`, [row.id]);

  // resetToken を保存（有効期限30分）
  const resetExpiry = Date.now() + RESET_WINDOW_SECS * 1000;
  await execute(db,
    `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, attempted_at, expires_at)
     VALUES (?, 'otp_reset_token', ?, 1, datetime('now', datetime('now', '+24 hours')))`,
    [randomUUID(), `${agentId}:${storedToken}:${resetExpiry}`]
  );

  return { valid: true, resetToken: storedToken };
}

// resetToken を検証してパスワードを更新
async function resetWithToken(
  db: ReturnType<typeof getDb>,
  agentId: string,
  resetToken: string,
  newPassword: string
): Promise<{ ok: boolean; reason?: string }> {
  const row = await queryOne<{ id: string; key_value: string }>(db,
    `SELECT id, key_value FROM rate_limit_attempts
     WHERE key_type = 'otp_reset_token' AND key_value LIKE ? ORDER BY attempted_at DESC LIMIT 1`,
    [`${agentId}:%`]
  );
  if (!row) return { ok: false, reason: "リセットトークンが見つかりません。最初からやり直してください。" };

  const parts = row.key_value.split(":");
  if (parts.length < 3) return { ok: false, reason: "リセットトークンが無効です。" };

  const [storedAgent, storedToken, expiryStr] = parts;
  if (storedAgent !== agentId || storedToken !== resetToken) {
    return { ok: false, reason: "リセットトークンが正しくありません。" };
  }
  if (Date.now() > Number(expiryStr)) {
    await execute(db, `DELETE FROM rate_limit_attempts WHERE id = ?`, [row.id]);
    return { ok: false, reason: "リセットトークンの有効期限が切れました。最初からやり直してください。" };
  }

  // パスワード更新
  const user = await queryOne<{ id: string }>(db,
    `SELECT id FROM users WHERE LOWER(agent_id) = LOWER(?)`, [agentId]
  );
  if (!user) return { ok: false, reason: "ユーザーが見つかりません。" };

  const hash = await hashPassword(newPassword);
  await execute(db,
    `UPDATE users SET password_hash = ?, password_changed_at = datetime('now') WHERE id = ?`,
    [hash, user.id]
  );

  // 使用済みトークンを削除
  await execute(db, `DELETE FROM rate_limit_attempts WHERE id = ?`, [row.id]);

  return { ok: true };
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json() as {
    action?: string;
    agentId?: string;
    otp?: string;
    resetToken?: string;
    newPassword?: string;
  };
  const { action, agentId, otp, resetToken, newPassword } = body;

  if (!agentId || typeof agentId !== "string" || agentId.length > 32) {
    throw Errors.validation("agentId が必要です");
  }

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // ── レート制限（失敗試行） ────────────────────────────────────────
  const since = toSqliteUtc(new Date(Date.now() - OTP_WINDOW_SECS * 1000));
  const failRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) AS cnt FROM rate_limit_attempts
     WHERE key_type = 'otp_fail' AND key_value = ? AND success = 0 AND attempted_at > ?`,
    [agentId, since]
  );
  if ((failRow?.cnt ?? 0) >= MAX_OTP_FAILS) {
    return makeRateLimitResponse(OTP_WINDOW_SECS);
  }

  // ── action: request ───────────────────────────────────────────────
  if (action === "request") {
    // ユーザー存在確認（列挙対策: 成功/失敗で応答時間を統一）
    const user = await queryOne<{ id: string }>(db,
      `SELECT id FROM users WHERE LOWER(agent_id) = LOWER(?)`, [agentId]
    );
    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
    const newResetToken = randomUUID().replace(/-/g, "");

    if (user) {
      await storeOtp(db, agentId, newOtp, newResetToken);
    }
    // ユーザーが存在しない場合も同じレスポンスを返す（列挙対策）
    return NextResponse.json({ ok: true, otp: newOtp, resetToken: newResetToken });
  }

  // ── action: verify ────────────────────────────────────────────────
  if (action === "verify") {
    if (!otp || typeof otp !== "string") throw Errors.validation("otp が必要です");

    const result = await verifyOtp(db, agentId, otp);
    if (!result.valid) {
      await execute(db,
        `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, attempted_at, expires_at)
         VALUES (?, 'otp_fail', ?, 0, datetime('now', datetime('now', '+24 hours')))`,
        [randomUUID(), agentId]
      );
      throw Errors.badRequest(result.reason ?? "認証コードが正しくありません。");
    }
    return NextResponse.json({ ok: true, resetToken: result.resetToken });
  }

  // ── action: reset ─────────────────────────────────────────────────
  if (action === "reset") {
    if (!resetToken || typeof resetToken !== "string") throw Errors.validation("resetToken が必要です");
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 256) {
      throw Errors.validation("新しいパスキーは 8〜256 文字で入力してください");
    }

    const result = await resetWithToken(db, agentId, resetToken, newPassword);
    if (!result.ok) {
      throw Errors.badRequest(result.reason ?? "パスワードのリセットに失敗しました。");
    }
    return NextResponse.json({ ok: true });
  }

  throw Errors.validation("action は request / verify / reset のいずれかを指定してください");
});
