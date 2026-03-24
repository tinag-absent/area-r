/**
 * GET /api/users/me/activity
 *
 * 認証済みユーザーの活動履歴（XPログ）を返す。
 * クエリパラメータ: limit (default: 50, max: 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit      = Math.min(Number(limitParam ?? 50), 200);
  if (isNaN(limit) || limit <= 0) throw Errors.badRequest("limit は正の整数で指定してください");

  const db   = getDb();
  const rows = await queryAll<{
    id: string; activity: string; xp_gained: number; created_at: string;
  }>(db,
    `SELECT id, activity, xp_gained, created_at
     FROM xp_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [auth.user.id, limit]
  );

  return NextResponse.json(rows);
});
