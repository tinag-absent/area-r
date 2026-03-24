/**
 * POST /api/admin/notifications
 * 管理者からの一括通知送信。
 * body: { target, userIds?, type, title, body, expiresInDays? }
 * target: "all" | "specific" | "division"
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    target:       "all" | "specific" | "division";
    userIds?:     string[];
    divisionId?:  string;
    type?:        string;
    title:        string;
    body:         string;
    expiresInDays?: number;
  };

  const { target, userIds, divisionId, type = "system", title, expiresInDays } = body;

  if (!title?.trim()) throw Errors.validation("title が必要です");
  if (!body.body?.trim()) throw Errors.validation("body が必要です");
  if (title.length > 100) throw Errors.validation("title は100文字以内です");
  if (body.body.length > 500) throw Errors.validation("body は500文字以内です");

  const db = getDb();

  // 送信対象ユーザーを取得
  let targetUsers: { id: string }[] = [];
  if (target === "all") {
    targetUsers = await queryAll<{ id: string }>(
      db, "SELECT id FROM users WHERE role = 'player' AND status = 'active'"
    );
  } else if (target === "specific" && userIds?.length) {
    const placeholders = userIds.map(() => "?").join(",");
    targetUsers = await queryAll<{ id: string }>(
      db, `SELECT id FROM users WHERE id IN (${placeholders})`, userIds
    );
  } else if (target === "division" && divisionId) {
    targetUsers = await queryAll<{ id: string }>(
      db, "SELECT id FROM users WHERE division_id = ? AND status = 'active'", [divisionId]
    );
  } else {
    throw Errors.validation("有効な target と対象情報が必要です");
  }

  if (targetUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "対象ユーザーがいません" });
  }

  // expires_at の計算
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400_000).toISOString().replace("T", " ").slice(0, 19)
    : null;

  // バルクINSERT（SQLiteはトランザクション内でループが最速）
  let sent = 0;
  for (const user of targetUsers) {
    await execute(db,
      `INSERT INTO notifications (id, user_id, type, title, body, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), user.id, type, title, body.body, expiresAt]
    );
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const db = getDb();
  const rows = await queryAll<{
    title: string; type: string; created_at: string; cnt: number;
  }>(db,
    `SELECT title, type, created_at, COUNT(*) as cnt
     FROM notifications
     WHERE created_at > datetime('now', '-30 days')
     GROUP BY title, type, created_at
     ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );

  return NextResponse.json(rows);
});
