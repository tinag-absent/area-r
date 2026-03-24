/**
 * GET /api/users/me/achievements
 *
 * 認証済みユーザーの獲得済み実績一覧を返す。
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const rows = await queryAll<{
    key: string; title: string; description: string;
    icon: string | null; xp_reward: number; earned_at: string;
  }>(db,
    `SELECT a.key, a.title, a.description, a.icon, a.xp_reward, ua.earned_at
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = ?
     ORDER BY ua.earned_at DESC`,
    [auth.user.id]
  );

  return NextResponse.json(rows);
});
