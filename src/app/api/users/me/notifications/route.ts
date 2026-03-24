/**
 * GET   /api/users/me/notifications  — 未期限の通知一覧を取得（最新50件）
 * PATCH /api/users/me/notifications  — 通知を既読にする（ids指定 or all=true）
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, execute, queryAll } from "@/lib/db";

export const GET = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();
  const notifications = await queryAll(db,
    `SELECT id, type, title, body, is_read, created_at FROM notifications
     WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
     ORDER BY created_at DESC LIMIT 50`,
    [auth.user.id]
  );
  return NextResponse.json(notifications);
}
);

export const PATCH = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  let body: { ids?: string[]; all?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 }); }

  const db = getDb();
  if (body.all) {
    await execute(db, `UPDATE notifications SET is_read=1 WHERE user_id=?`, [auth.user.id]);
  } else if (body.ids?.length) {
    for (const id of body.ids) {
      await execute(db, `UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?`, [id, auth.user.id]);
    }
  }
  return NextResponse.json({ ok: true });
}
);
