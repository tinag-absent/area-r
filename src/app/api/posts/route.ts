/**
 * GET  /api/posts           — 投稿一覧（?category=general&limit=50）
 * GET  /api/posts?id=xxx    — 単一投稿取得（タグ解決用）
 * POST /api/posts           — 新規投稿
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }                  from "next/server";
import { createRoute }                   from "@/lib/api/handler";
import { queryAll, queryOne, execute }   from "@/lib/db";
import { Errors }                        from "@/lib/api-error";
import { sanitizeText as sanitize }      from "@/lib/sanitize";
import { randomUUID }                    from "crypto";

const ALLOWED_CATEGORIES = ["general", "report", "request"] as const;
type Category = typeof ALLOWED_CATEGORIES[number];

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const id = query.get("id");

    // 単一投稿取得（BUL- タグクリック用）
    if (id) {
      const row = await queryOne<{
        id: string; title: string; body: string; category: string;
        is_pinned: number; created_at: string;
        poster_agent_id: string; poster_username: string;
      }>(db,
        `SELECT p.id, p.title, p.body, p.category, p.is_pinned, p.created_at,
                u.agent_id AS poster_agent_id, u.username AS poster_username
         FROM posts p JOIN users u ON p.user_id = u.id
         WHERE p.id = ? AND p.is_deleted = 0`,
        [id]
      );
      if (!row) throw Errors.notFound("投稿");
      return NextResponse.json(row);
    }

    const category = (query.get("category") ?? "general") as Category;
    const limit    = Math.min(Number(query.get("limit") ?? "50"), 100);

    if (!ALLOWED_CATEGORIES.includes(category))
      throw Errors.validation("不正なカテゴリ");

    const rows = await queryAll<{
      id: string; title: string; body: string; category: string;
      is_pinned: number; created_at: string;
      poster_agent_id: string; poster_username: string;
    }>(db,
      `SELECT p.id, p.title, p.body, p.category, p.is_pinned, p.created_at,
              u.agent_id AS poster_agent_id, u.username AS poster_username
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.category = ? AND p.is_deleted = 0
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT ?`,
      [category, limit]
    );
    return NextResponse.json(rows);
  },
});

export const POST = createRoute<{ title: string; body: string; category?: string }>({
  auth: "player",
  handler: async ({ db, user, body }) => {
    const title    = sanitize(String(body.title    ?? "")).trim();
    const bodyText = sanitize(String(body.body     ?? "")).trim();
    const category = (body.category ?? "general") as Category;

    if (!title)    throw Errors.validation("title が必要です");
    if (!bodyText) throw Errors.validation("body が必要です");
    if (!ALLOWED_CATEGORIES.includes(category))
      throw Errors.validation("不正なカテゴリ");

    const id = randomUUID();
    await execute(db,
      `INSERT INTO posts (id, user_id, title, body, category) VALUES (?, ?, ?, ?, ?)`,
      [id, user.id, title, bodyText, category]
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  },
});
