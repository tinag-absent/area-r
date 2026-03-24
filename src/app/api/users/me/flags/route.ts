/**
 * GET /api/users/me/flags
 *
 * 認証済みユーザーのストーリーフラグ一覧を返す。
 * レスポンス形式: { flagKey: flagValue, ... }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll } from "@/lib/db";
import type { ProgressFlagKey } from "@/lib/types";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const rows = await queryAll<{ flag_key: ProgressFlagKey; flag_value: string }>(
    db,
    "SELECT flag_key, flag_value FROM progress_flags WHERE user_id = ?",
    [auth.user.id]
  );

  const flags = Object.fromEntries(rows.map(r => [r.flag_key, r.flag_value]));
  return NextResponse.json(flags);
});
