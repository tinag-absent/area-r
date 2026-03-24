/**
 * GET /api/personnel — 人員一覧（Turso DB から取得）
 * Updated: 2026-03-24 — fs/promises 依存を廃止し DB 直接参照に移行（Vercel 対応）
 *
 * db_personnel テーブルのフィールドを area13 JSON 形式にマッピングして返す。
 */
import { NextResponse } from "next/server";
import { createRoute }  from "@/lib/api/handler";
import { queryAll }     from "@/lib/db";

interface DbPersonnel {
  id: string; codename: string; real_name: string;
  role: string; division: string; clearance: number;
  status: string; joined: string; last_seen: string; specialization: string;
}

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, query }) => {
    const division = query.get("division");
    const q        = query.get("q")?.toLowerCase();

    let sql = `SELECT id, codename, real_name, role, division, clearance,
                      status, joined, last_seen, specialization
               FROM db_personnel`;
    const params: string[] = [];

    if (division) {
      sql += " WHERE division LIKE ?";
      params.push(`%${division}%`);
    }
    sql += " ORDER BY id ASC";

    const rows = await queryAll<DbPersonnel>(db, sql, params);

    // area13 JSON 形式にマッピング
    let list = rows.map(p => ({
      id:             p.id,
      name:           p.codename,   // codename を name として返す
      division:       p.division,
      rank:           p.role,
      age:            0,            // DB には age カラムなし
      joinDate:       p.joined,
      specialization: p.specialization,
    }));

    if (q) {
      list = list.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.division.toLowerCase().includes(q),
      );
    }

    return NextResponse.json(list);
  },
});
