/**
 * GET /api/observation-logs — 一覧
 * GET /api/observation-logs?id=xxx — 単一取得
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
        `SELECT * FROM observation_logs WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("観測ログ");
      const parsed = { ...row } as Record<string, unknown>;
      if (typeof parsed["findings_json"] === "string") { try { parsed["findings_json"] = JSON.parse(parsed["findings_json"] as string); } catch { parsed["findings_json"] = []; } }
      return NextResponse.json(parsed);
    }

    const rows = await queryAll(db,
      `SELECT * FROM observation_logs WHERE clearance_req <= ? ORDER BY observed_at DESC`,
      [userLevel]
    );
    const parsed = rows.map(r => {
      const row = { ...r } as Record<string, unknown>;
      if (typeof row["findings_json"] === "string") { try { row["findings_json"] = JSON.parse(row["findings_json"] as string); } catch { row["findings_json"] = []; } }
      return row;
    });
    return NextResponse.json(parsed);
  },
});
