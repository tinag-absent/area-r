/**
 * GET /api/research-theories          — 一覧（クリアランスフィルタ）
 * GET /api/research-theories?id=xxx   — 単一取得
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }        from "next/server";
import { createRoute }         from "@/lib/api/handler";
import { queryAll, queryOne }  from "@/lib/db";
import { Errors }              from "@/lib/api-error";

function parseJsonFields(r: Record<string, unknown>) {
  const row = { ...r };
  for (const key of ["evidence_json", "related_json"]) {
    if (typeof row[key] === "string") {
      try { row[key] = JSON.parse(row[key] as string); } catch { row[key] = []; }
    }
  }
  return row;
}

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const userLevel = user.level ?? 0;
    const id = query.get("id");

    if (id) {
      const row = await queryOne<Record<string, unknown>>(db,
        `SELECT * FROM research_theories WHERE id = ? AND clearance_req <= ?`, [id, userLevel]
      );
      if (!row) throw Errors.notFound("研究仮説");
      return NextResponse.json(parseJsonFields(row));
    }

    const rows = await queryAll<Record<string, unknown>>(db,
      `SELECT * FROM research_theories WHERE clearance_req <= ? ORDER BY proposed_at DESC`, [userLevel]
    );
    return NextResponse.json(rows.map(parseJsonFields));
  },
});
