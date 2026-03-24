/**
 * GET /api/agent-memos?id=xxx — 機関員メモ単一取得（MEMO- タグ用）
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
    if (!id) throw Errors.validation("id が必要です");

    const row = await queryOne(db,
      `SELECT * FROM agent_memos WHERE id = ? AND clearance_req <= ?`,
      [id, userLevel]
    );
    if (!row) throw Errors.notFound("機関員メモ");
      const parsed = { ...row } as Record<string, unknown>;
      if (typeof parsed["tags_json"] === "string") { try { parsed["tags_json"] = JSON.parse(parsed["tags_json"] as string); } catch { parsed["tags_json"] = []; } }
      return NextResponse.json(parsed);
  },
});
