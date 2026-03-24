/**
 * GET    /api/users/me/bookmarks            — 一覧取得
 * POST   /api/users/me/bookmarks            — 追加
 * DELETE /api/users/me/bookmarks?id=...     — 削除
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const rows = await queryAll<{
    id: string; target_type: string; target_id: string; created_at: string;
  }>(db,
    `SELECT id, target_type, target_id, created_at
     FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC`,
    [auth.user.id]
  );
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as { targetType?: string; targetId?: string };
  if (!body.targetType || typeof body.targetType !== "string") throw Errors.validation("targetType が必要です");
  if (!body.targetId   || typeof body.targetId   !== "string") throw Errors.validation("targetId が必要です");

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");
  const id = randomUUID();
  await execute(db,
    "INSERT OR IGNORE INTO bookmarks (id, user_id, target_type, target_id) VALUES (?, ?, ?, ?)",
    [id, auth.user.id, body.targetType, body.targetId]
  );
  const row = await queryOne<{ id: string }>(db,
    "SELECT id FROM bookmarks WHERE user_id = ? AND target_type = ? AND target_id = ?",
    [auth.user.id, body.targetType, body.targetId]
  );
  return NextResponse.json({ id: row?.id ?? id }, { status: 201 });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const bookmarkId = req.nextUrl.searchParams.get("id");
  if (!bookmarkId) throw Errors.badRequest("id が必要です");

  const db = getDb();
  await execute(db,
    "DELETE FROM bookmarks WHERE id = ? AND user_id = ?",
    [bookmarkId, auth.user.id]
  );
  return NextResponse.json({ ok: true });
});
