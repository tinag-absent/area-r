/**
 * GET /api/sigma-messages          — 一覧（CLRフィルタ）
 * GET /api/sigma-messages?id=xxx   — 単一取得
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }           from "next/server";
import { createRoute }            from "@/lib/api/handler";
import { queryAll, queryOne }     from "@/lib/db";
import { Errors }                 from "@/lib/api-error";
import type { DbSigmaMessage }    from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const userLevel = user.level ?? 0;
    const id        = query.get("id");

    if (id) {
      const row = await queryOne<DbSigmaMessage>(db,
        `SELECT * FROM sigma_messages WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("SIGMAメッセージ");
      return NextResponse.json(row);
    }

    const rows = await queryAll<DbSigmaMessage>(db,
      `SELECT * FROM sigma_messages WHERE clearance_req <= ? ORDER BY number ASC`,
      [userLevel]
    );
    return NextResponse.json(rows);
  },
});
