/**
 * POST /api/auth/tutorial-complete
 *
 * チュートリアル完了フラグをセットする。
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, execute, queryOne } from "@/lib/db";
import { randomUUID } from "crypto";

export const POST = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();
  await execute(db,
    `INSERT INTO progress_flags (id, user_id, flag_key, flag_value)
     VALUES (?,?,'tutorial_complete','true')
     ON CONFLICT (user_id, flag_key) DO UPDATE SET flag_value='true'`,
    [randomUUID(), auth.user.id]
  );
  return NextResponse.json({ ok: true });
}
);
