/**
 * GET /api/search?id=<recordId>
 * DB全テーブル（missions / db_entities / db_facilities / db_equipment / db_personnel）を
 * ID完全一致で横断検索し、最初にヒットしたレコードを返す。
 * DatabaseClient の SearchTab から呼び出される。
 */

import { NextResponse }  from "next/server";
import { createRoute }   from "@/lib/api/handler";
import { queryOne }      from "@/lib/db";
import { Errors }        from "@/lib/api-error";

const ARRAY_FIELDS: Record<string, string[]> = {
  db_entities:   ["observed_abilities", "related_entities"],
  db_facilities: ["equipment_installed", "divisions_present"],
  db_equipment:  [],
  db_personnel:  ["commendations", "incident_flags"],
};

const OBJ_FIELDS: Record<string, string[]> = {
  db_equipment: ["specifications"],
};

function parseRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const r = { ...row };
  for (const f of ARRAY_FIELDS[table] ?? []) {
    if (typeof r[f] === "string") { try { r[f] = JSON.parse(r[f] as string); } catch { r[f] = []; } }
  }
  for (const f of OBJ_FIELDS[table] ?? []) {
    if (typeof r[f] === "string") { try { r[f] = JSON.parse(r[f] as string); } catch { r[f] = {}; } }
  }
  return r;
}

const SOURCES: { table: string; tab: string; idCol?: string }[] = [
  { table: "missions",      tab: "missions"   },
  { table: "db_entities",   tab: "entities"   },
  { table: "db_facilities", tab: "facilities" },
  { table: "db_equipment",  tab: "equipment"  },
  { table: "db_personnel",  tab: "personnel"  },
];

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const id = query.get("id")?.trim().toUpperCase();
    if (!id) throw Errors.validation("id パラメータが必要です");

    const level = user.level ?? 0;

    for (const { table, tab, idCol = "id" } of SOURCES) {
      // missions はクリアランスカラムが required_level
      const clearanceCol = table === "missions" ? "required_level" : "clearance";

      const row = await queryOne<Record<string, unknown>>(
        db,
        `SELECT * FROM ${table} WHERE UPPER(${idCol}) = ? AND ${clearanceCol} <= ?`,
        [id, level],
      );

      if (row) {
        const parsed = parseRow(table, row);
        return NextResponse.json({ tab, record: parsed });
      }
    }

    throw Errors.notFound(`ID: ${id}`);
  },
});
