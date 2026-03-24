/**
 * GET /api/divisions — 部門一覧（プレイヤー向け・公開）
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }        from "next/server";
import { createRoute }         from "@/lib/api/handler";
import { queryAll }            from "@/lib/db";
import type { DbDivision }     from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db }) => {
    const rows = await queryAll<DbDivision>(db,
      `SELECT id, name, name_en, description, color FROM divisions ORDER BY id`
    );
    return NextResponse.json(rows);
  },
});
