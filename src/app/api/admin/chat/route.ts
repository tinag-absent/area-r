/**
 * GET /api/admin/chat
 * チャンネル・ユーザー・キーワードで絞り込んでメッセージを返す。
 * query: channel, userId, q, limit, before
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") ?? "";
  const userId  = searchParams.get("userId")  ?? "";
  const q       = searchParams.get("q")       ?? "";
  const limit   = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const before  = searchParams.get("before")  ?? "";

  const db = getDb();

  let sql = `
    SELECT m.id, m.chat_id, m.sender_id, m.sender_name, m.text, m.type, m.created_at,
           u.agent_id, u.clearance_level
    FROM chat_messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (channel) { sql += " AND m.chat_id = ?";          args.push(channel); }
  if (userId)  { sql += " AND m.sender_id = ?";         args.push(userId); }
  if (q)       { sql += " AND m.text LIKE ?";           args.push(`%${q}%`); }
  if (before)  { sql += " AND m.created_at < ?";        args.push(before); }

  sql += " ORDER BY m.created_at DESC LIMIT ?";
  args.push(limit);

  const messages = await queryAll<{
    id: string; chat_id: string; sender_id: string; sender_name: string;
    text: string; type: string; created_at: string;
    agent_id: string | null; clearance_level: number | null;
  }>(db, sql, args);

  return NextResponse.json({ messages, count: messages.length });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const db = getDb();
  await db.execute({ sql: "DELETE FROM chat_messages WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
});
