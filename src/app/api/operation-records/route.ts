/**
 * GET /api/operation-records — 一覧
 * GET /api/operation-records?id=xxx — 単一取得
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
        `SELECT * FROM operation_records WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("作戦記録");
      const parsed = { ...row } as Record<string, unknown>;
      if (typeof parsed["division_json"] === "string") { try { parsed["division_json"] = JSON.parse(parsed["division_json"] as string); } catch { parsed["division_json"] = []; } }
      return NextResponse.json(parsed);
    }

    const rows = await queryAll(db,
      `SELECT * FROM operation_records WHERE clearance_req <= ? ORDER BY op_date DESC`,
      [userLevel]
    );
    const parsed = rows.map(r => {
      const row = { ...r } as Record<string, unknown>;
      if (typeof row["division_json"] === "string") { try { row["division_json"] = JSON.parse(row["division_json"] as string); } catch { row["division_json"] = []; } }
      return row;
    });
    return NextResponse.json(parsed);
  },
});
