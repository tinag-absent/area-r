/**
 * POST /api/users/me/secret-question
 *
 * 認証済みユーザーが秘密の質問を変更する。
 * body: { question, answer, currentPassword }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import type { DbUser } from "@/lib/auth";

const ALLOWED_QUESTIONS = [
  "子供の頃に住んでいた街の名前は？",
  "最初に飼ったペットの名前は？",
  "母親の旧姓は？",
  "初めて通った学校の名前は？",
  "好きな映画のタイトルは？",
];

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    question?: string; answer?: string; currentPassword?: string;
  };
  const { question, answer, currentPassword } = body;

  if (!question || !ALLOWED_QUESTIONS.includes(question)) {
    throw Errors.validation("無効な質問です");
  }
  if (!answer || typeof answer !== "string" || answer.trim().length < 2) {
    throw Errors.validation("回答は2文字以上で入力してください");
  }
  if (!currentPassword || typeof currentPassword !== "string") {
    throw Errors.validation("現在のパスキーが必要です");
  }

  const db   = getDb();
  await db.execute("PRAGMA foreign_keys = ON");
  const user = await queryOne<DbUser>(db, "SELECT * FROM users WHERE id = ?", [auth.user.id]);
  if (!user) throw Errors.notFound("ユーザー");

  const ok = await comparePassword(currentPassword, user.password_hash);
  if (!ok) throw Errors.badRequest("現在のパスキーが正しくありません");

  const answerHash = await hashPassword(answer.trim());
  await execute(db,
    "UPDATE users SET secret_question = ?, secret_answer_hash = ? WHERE id = ?",
    [question, answerHash, user.id]
  );

  return NextResponse.json({ ok: true });
});
