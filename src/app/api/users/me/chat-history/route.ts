/**
 * GET /api/users/me/chat-history
 *
 * 認証済みユーザー自身のチャット送信履歴を返す。
 * クエリパラメータ: limit (default: 100, max: 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit      = Math.min(Number(limitParam ?? 100), 200);
  if (isNaN(limit) || limit <= 0) throw Errors.badRequest("limit は正の整数で指定してください");

  const db   = getDb();
  const rows = await queryAll<{
    id: string; chat_id: string; text: string; created_at: string;
  }>(db,
    `SELECT id, chat_id, text, created_at
     FROM chat_messages
     WHERE sender_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [auth.user.id, limit]
  );

  return NextResponse.json(rows);
});
