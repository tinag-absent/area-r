/**
 * POST /api/auth/logout
 *
 * 認証Cookieを削除してログアウトする。
 */
import { NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { clearAuthCookie } from "@/lib/auth";

export const POST = withErrorHandler(
  async () => {
  const res = NextResponse.json({ ok: true });
  return clearAuthCookie(res);
}
);
