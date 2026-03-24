/**
 * GET /api/novel — プレイヤー向け記録文書一覧
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }         from "next/server";
import { createRoute }          from "@/lib/api/handler";
import { queryAll }             from "@/lib/db";
import type { DbNovelDocument } from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user }) => {
    const rows = await queryAll<Pick<
      DbNovelDocument,
      "id" | "title" | "subtitle" | "clearance" | "category" | "date" | "author" | "content" | "sort_order"
    >>(db,
      `SELECT id, title, subtitle, clearance, category, date, author, content, sort_order
       FROM novel_documents
       WHERE clearance <= ? AND is_published = 1
       ORDER BY sort_order ASC, clearance ASC`,
      [user.level]
    );
    return NextResponse.json(rows);
  },
});
