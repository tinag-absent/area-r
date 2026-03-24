/**
 * GET /api/missions — ミッション一覧（プレイヤー向け）
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }       from "next/server";
import { createRoute }        from "@/lib/api/handler";
import { queryAll }           from "@/lib/db";
import type { DbMission }     from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const status   = query.get("status")   ?? "all";
    const category = query.get("category") ?? "all";
    const level    = user.level ?? 0;

    let sql = `
      SELECT id, title, description, category, status,
             required_level, xp_reward, phase,
             assigned_division, issued_by, issued_at, deadline_at
      FROM missions
      WHERE required_level <= ?
    `;
    const args: unknown[] = [level];

    if (status !== "all")   { sql += " AND status = ?";   args.push(status); }
    if (category !== "all") { sql += " AND category = ?"; args.push(category); }

    sql += " ORDER BY issued_at DESC";

    const rows = await queryAll<Pick<DbMission,
      "id"|"title"|"description"|"category"|"status"|"required_level"|
      "xp_reward"|"phase"|"assigned_division"|"issued_by"|"issued_at"|"deadline_at"
    >>(db, sql, args);

    return NextResponse.json(rows);
  },
});
