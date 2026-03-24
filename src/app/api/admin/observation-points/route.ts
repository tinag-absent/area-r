/**
 * CRUD /api/admin/observation-points
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM observation_points ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM observation_points WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO observation_points (id, type, name, name_short, city_code, city_name, status, description, notes, location_ref, lon, lat, clearance_req, gsi_current) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["type"] != null ? String(b["type"]) : null,
    b["name"] != null ? String(b["name"]) : null,
    b["name_short"] != null ? String(b["name_short"]) : null,
    b["city_code"] != null ? String(b["city_code"]) : null,
    b["city_name"] != null ? String(b["city_name"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["description"] != null ? String(b["description"]) : null,
    b["notes"] != null ? String(b["notes"]) : null,
    b["location_ref"] != null ? String(b["location_ref"]) : null,
    b["lon"] != null ? Number(b["lon"]) : null,
    b["lat"] != null ? Number(b["lat"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    b["gsi_current"] != null ? Number(b["gsi_current"]) : null,
    ]
  );
  return NextResponse.json({ ok: true, id: b.id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM observation_points WHERE id = ?`, [b.id]))
    throw Errors.notFound("observation_points");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("type" in b) { sets.push("type = ?"); args.push(b["type"] != null ? String(b["type"]) : null); }
  if ("name" in b) { sets.push("name = ?"); args.push(b["name"] != null ? String(b["name"]) : null); }
  if ("name_short" in b) { sets.push("name_short = ?"); args.push(b["name_short"] != null ? String(b["name_short"]) : null); }
  if ("city_code" in b) { sets.push("city_code = ?"); args.push(b["city_code"] != null ? String(b["city_code"]) : null); }
  if ("city_name" in b) { sets.push("city_name = ?"); args.push(b["city_name"] != null ? String(b["city_name"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("description" in b) { sets.push("description = ?"); args.push(b["description"] != null ? String(b["description"]) : null); }
  if ("notes" in b) { sets.push("notes = ?"); args.push(b["notes"] != null ? String(b["notes"]) : null); }
  if ("location_ref" in b) { sets.push("location_ref = ?"); args.push(b["location_ref"] != null ? String(b["location_ref"]) : null); }
  if ("lon" in b) { sets.push("lon = ?"); args.push(b["lon"] != null ? Number(b["lon"]) : null); }
  if ("lat" in b) { sets.push("lat = ?"); args.push(b["lat"] != null ? Number(b["lat"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("gsi_current" in b) { sets.push("gsi_current = ?"); args.push(b["gsi_current"] != null ? Number(b["gsi_current"]) : null); }

  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE observation_points SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM observation_points WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
