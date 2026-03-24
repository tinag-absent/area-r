/**
 * GET /api/db-data?type=entities|facilities|equipment|personnel
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }    from "next/server";
import { createRoute }     from "@/lib/api/handler";
import { queryAll }        from "@/lib/db";
import { Errors }          from "@/lib/api-error";

const TABLE_MAP: Record<string, string> = {
  entities:   "db_entities",
  facilities: "db_facilities",
  equipment:  "db_equipment",
  personnel:  "db_personnel",
};

const ARRAY_FIELDS: Record<string, string[]> = {
  entities:   ["observed_abilities", "related_entities"],
  facilities: ["equipment_installed", "divisions_present"],
  equipment:  [],
  personnel:  ["commendations", "incident_flags"],
};

const OBJ_FIELDS: Record<string, string[]> = {
  equipment: ["specifications"],
};

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const type  = query.get("type") ?? "entities";
    const table = TABLE_MAP[type];
    if (!table) throw Errors.validation(`不明なtype: ${type}`);

    const rows = await queryAll<Record<string, unknown>>(db,
      `SELECT * FROM ${table} WHERE clearance <= ? ORDER BY code ASC, id ASC`,
      [user.level ?? 0]
    );

    const parsed = rows.map(row => {
      const r = { ...row };
      for (const f of ARRAY_FIELDS[type] ?? []) {
        if (typeof r[f] === "string") { try { r[f] = JSON.parse(r[f] as string); } catch { r[f] = []; } }
      }
      for (const f of OBJ_FIELDS[type] ?? []) {
        if (typeof r[f] === "string") { try { r[f] = JSON.parse(r[f] as string); } catch { r[f] = {}; } }
      }
      return r;
    });

    return NextResponse.json(parsed);
  },
});
