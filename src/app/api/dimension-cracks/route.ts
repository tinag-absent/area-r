/**
 * GET /api/dimension-cracks — 一覧
 * GET /api/dimension-cracks?id=xxx — 単一取得
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
        `SELECT * FROM dimension_cracks WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("次元裂孔");
      const parsed = { ...row } as Record<string, unknown>;
      if (typeof parsed["entity_emerged"] === "string") { try { parsed["entity_emerged"] = JSON.parse(parsed["entity_emerged"] as string); } catch { parsed["entity_emerged"] = []; } }
      return NextResponse.json(parsed);
    }

    const rows = await queryAll(db,
      `SELECT * FROM dimension_cracks WHERE clearance_req <= ? ORDER BY severity DESC, id`,
      [userLevel]
    );
    const parsed = rows.map(r => {
      const row = { ...r } as Record<string, unknown>;
      if (typeof row["entity_emerged"] === "string") { try { row["entity_emerged"] = JSON.parse(row["entity_emerged"] as string); } catch { row["entity_emerged"] = []; } }
      return row;
    });
    return NextResponse.json(parsed);
  },
});
