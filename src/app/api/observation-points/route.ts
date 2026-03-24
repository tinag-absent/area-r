/**
 * GET /api/observation-points — 一覧
 * GET /api/observation-points?id=xxx — 単一取得
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }        from "next/server";
import { createRoute }         from "@/lib/api/handler";
import { queryAll, queryOne }  from "@/lib/db";
import { Errors }              from "@/lib/api-error";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const userLevel = user.level ?? 0;
    const id = query.get("id");

    if (id) {
      const row = await queryOne(db,
        `SELECT * FROM observation_points WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("観測地点");
      return NextResponse.json(row);
    }

    const rows = await queryAll(db,
      `SELECT * FROM observation_points WHERE clearance_req <= ? ORDER BY type, id`,
      [userLevel]
    );

    return NextResponse.json(rows);
  },
});
