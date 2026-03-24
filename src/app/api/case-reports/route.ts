/**
 * GET /api/case-reports — case_reports一覧（クリアランスフィルタ）
 * GET /api/case-reports?id=xxx — 単一取得
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
        `SELECT * FROM case_reports WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("事案記録");
      const parsed = { ...row } as Record<string, unknown>;
      if (typeof parsed["personnel_json"] === "string") { try { parsed["personnel_json"] = JSON.parse(parsed["personnel_json"] as string); } catch { parsed["personnel_json"] = []; } }
      return NextResponse.json(parsed);
    }

    const rows = await queryAll(db,
      `SELECT * FROM case_reports WHERE clearance_req <= ? ORDER BY case_date DESC`,
      [userLevel]
    );
    const parsed = rows.map(r => {
      const row = { ...r } as Record<string, unknown>;
      if (typeof row["personnel_json"] === "string") { try { row["personnel_json"] = JSON.parse(row["personnel_json"] as string); } catch { row["personnel_json"] = []; } }
      return row;
    });
    return NextResponse.json(parsed);
  },
});
