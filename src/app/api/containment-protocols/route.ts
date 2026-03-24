/**
 * GET /api/containment-protocols — 一覧
 * GET /api/containment-protocols?id=xxx — 単一取得
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
        `SELECT * FROM containment_protocols WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("封印プロトコル");
      const parsed = { ...row } as Record<string, unknown>;
      if (typeof parsed["steps_json"] === "string") { try { parsed["steps_json"] = JSON.parse(parsed["steps_json"] as string); } catch { parsed["steps_json"] = []; } }
      return NextResponse.json(parsed);
    }

    const rows = await queryAll(db,
      `SELECT * FROM containment_protocols WHERE clearance_req <= ? ORDER BY codename`,
      [userLevel]
    );
    const parsed = rows.map(r => {
      const row = { ...r } as Record<string, unknown>;
      if (typeof row["steps_json"] === "string") { try { row["steps_json"] = JSON.parse(row["steps_json"] as string); } catch { row["steps_json"] = []; } }
      return row;
    });
    return NextResponse.json(parsed);
  },
});
