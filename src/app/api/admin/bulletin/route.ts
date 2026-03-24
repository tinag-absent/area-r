/**
 * GET    /api/admin/bulletin          — 投稿一覧
 * PATCH  /api/admin/bulletin          — ピン留め切替・削除
 * DELETE /api/admin/bulletin?id=...   — 強制削除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute, queryOne } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const q        = searchParams.get("q") ?? "";
  const limit    = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const db = getDb();
  let sql  = `SELECT p.id, p.title, p.body, p.category, p.is_pinned, p.is_deleted,
                     p.created_at, u.agent_id, u.username
              FROM posts p JOIN users u ON u.id = p.user_id
              WHERE 1=1`;
  const args: (string | number)[] = [];

  if (category) { sql += ` AND p.category = ?`; args.push(category); }
  if (q)        { sql += ` AND (p.title LIKE ? OR p.body LIKE ?)`; args.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ?`;
  args.push(limit);

  const rows = await queryAll(db, sql, args);
  return NextResponse.json(rows);
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    id:     string;
    action: "pin" | "unpin" | "delete" | "restore";
  };
  if (!body.id || !body.action) throw Errors.validation("id と action が必要です");

  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM posts WHERE id = ?`, [body.id]))
    throw Errors.notFound("投稿");

  const updates: Record<string, string> = {
    pin:     "UPDATE posts SET is_pinned = 1 WHERE id = ?",
    unpin:   "UPDATE posts SET is_pinned = 0 WHERE id = ?",
    delete:  "UPDATE posts SET is_deleted = 1 WHERE id = ?",
    restore: "UPDATE posts SET is_deleted = 0 WHERE id = ?",
  };
  const sql = updates[body.action];
  if (!sql) throw Errors.validation(`未知のアクション: ${body.action}`);

  await execute(db, sql, [body.id]);
  return NextResponse.json({ ok: true, action: body.action });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  await execute(db, `DELETE FROM posts WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
