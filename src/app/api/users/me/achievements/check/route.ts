/**
 * POST /api/users/me/achievements/check
 * ログイン後などに呼び出し、実績を自動付与する
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { checkAndGrantAchievements } from "@/lib/achievements";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const granted = await checkAndGrantAchievements(auth.user.id);
  return NextResponse.json({ granted });
});
