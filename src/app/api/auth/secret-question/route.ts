/**
 * POST /api/auth/secret-question
 *
 * 秘密の質問によるパスワードリセット。未認証で呼び出し可能。
 *
 * body: { agentId, answer, newPassword }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors, makeRateLimitResponse } from "@/lib/api-error";
import { getDb, queryOne, execute } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import type { DbUser } from "@/lib/auth";
import { randomUUID } from "crypto";
import { toSqliteUtc } from "@/lib/date";

const RATE_WINDOW_SECS = 600; // 10分
const MAX_FAILS        = 5;

async function isRateLimited(
  db: ReturnType<typeof getDb>,
  keyValue: string
): Promise<boolean> {
  const since = toSqliteUtc(new Date(Date.now() - RATE_WINDOW_SECS * 1000));
  const row   = await queryOne<{ cnt: number }>(
    db,
    `SELECT COUNT(*) AS cnt FROM rate_limit_attempts
     WHERE key_type = 'secret_question' AND key_value = ? AND success = 0 AND attempted_at > ?`,
    [keyValue, since]
  );
  return (row?.cnt ?? 0) >= MAX_FAILS;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json() as {
    agentId?: string;
    answer?:  string;
    newPassword?: string;
  };
  const { agentId, answer, newPassword } = body;

  if (!agentId || typeof agentId !== "string") throw Errors.validation("agentId が必要です");
  if (!answer  || typeof answer  !== "string") throw Errors.validation("answer が必要です");
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 256) {
    throw Errors.validation("新しいパスキーは 8〜256 文字で入力してください");
  }

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  if (await isRateLimited(db, agentId)) {
    return makeRateLimitResponse(RATE_WINDOW_SECS);
  }

  const user = await queryOne<DbUser>(
    db,
    "SELECT * FROM users WHERE LOWER(agent_id) = LOWER(?)",
    [agentId]
  );

  // ユーザー不在でも同じエラーを返す（列挙攻撃対策）
  if (!user || !user.secret_answer_hash) {
    await execute(db,
      "INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at) VALUES (?, 'secret_question', ?, 0, datetime('now', '+24 hours'))",
      [randomUUID(), agentId]
    );
    throw Errors.badRequest("エージェントIDまたは回答が正しくありません");
  }

  const ok = await comparePassword(answer, user.secret_answer_hash);
  if (!ok) {
    await execute(db,
      "INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at) VALUES (?, 'secret_question', ?, 0, datetime('now', '+24 hours'))",
      [randomUUID(), agentId]
    );
    throw Errors.badRequest("エージェントIDまたは回答が正しくありません");
  }

  // 回答正解 — パスワード更新
  await execute(db,
    "INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at) VALUES (?, 'secret_question', ?, 1, datetime('now', '+24 hours'))",
    [randomUUID(), agentId]
  );
  const newHash = await hashPassword(newPassword);
  await execute(db,
    "UPDATE users SET password_hash = ?, password_changed_at = datetime('now') WHERE id = ?",
    [newHash, user.id]
  );

  return NextResponse.json({ ok: true });
});
