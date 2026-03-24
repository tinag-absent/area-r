/**
 * POST /api/users/me/password
 *
 * 認証済みユーザーのパスワード変更。
 * body: { currentPassword, newPassword }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import type { DbUser } from "@/lib/auth";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    currentPassword?: string;
    newPassword?:     string;
  };
  const { currentPassword, newPassword } = body;

  if (!currentPassword || typeof currentPassword !== "string") {
    throw Errors.validation("現在のパスキーが必要です");
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 256) {
    throw Errors.validation("新しいパスキーは 8〜256 文字で入力してください");
  }
  if (currentPassword === newPassword) {
    throw Errors.validation("新しいパスキーは現在と異なるものにしてください");
  }

  const db   = getDb();
  await db.execute("PRAGMA foreign_keys = ON");
  const user = await queryOne<DbUser>(db, "SELECT * FROM users WHERE id = ?", [auth.user.id]);
  if (!user) throw Errors.notFound("ユーザー");

  const ok = await comparePassword(currentPassword, user.password_hash);
  if (!ok) throw Errors.badRequest("現在のパスキーが正しくありません");

  const newHash = await hashPassword(newPassword);
  await execute(db,
    "UPDATE users SET password_hash = ?, password_changed_at = datetime('now') WHERE id = ?",
    [newHash, user.id]
  );

  return NextResponse.json({ ok: true });
});
