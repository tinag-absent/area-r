/**
 * CRUD /api/admin/dimension-cracks
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM dimension_cracks ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM dimension_cracks WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO dimension_cracks (id, name, location, status, severity, first_detected, sealed_at, description, notes, lon, lat, clearance_req, gsi_peak, entity_emerged) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["name"] != null ? String(b["name"]) : null,
    b["location"] != null ? String(b["location"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["severity"] != null ? String(b["severity"]) : null,
    b["first_detected"] != null ? String(b["first_detected"]) : null,
    b["sealed_at"] != null ? String(b["sealed_at"]) : null,
    b["description"] != null ? String(b["description"]) : null,
    b["notes"] != null ? String(b["notes"]) : null,
    b["lon"] != null ? Number(b["lon"]) : null,
    b["lat"] != null ? Number(b["lat"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    b["gsi_peak"] != null ? Number(b["gsi_peak"]) : null,
    JSON.stringify(Array.isArray(b["entity_emerged"]) ? b["entity_emerged"] : []),
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
  if (!await queryOne(db, `SELECT id FROM dimension_cracks WHERE id = ?`, [b.id]))
    throw Errors.notFound("dimension_cracks");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("name" in b) { sets.push("name = ?"); args.push(b["name"] != null ? String(b["name"]) : null); }
  if ("location" in b) { sets.push("location = ?"); args.push(b["location"] != null ? String(b["location"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("severity" in b) { sets.push("severity = ?"); args.push(b["severity"] != null ? String(b["severity"]) : null); }
  if ("first_detected" in b) { sets.push("first_detected = ?"); args.push(b["first_detected"] != null ? String(b["first_detected"]) : null); }
  if ("sealed_at" in b) { sets.push("sealed_at = ?"); args.push(b["sealed_at"] != null ? String(b["sealed_at"]) : null); }
  if ("description" in b) { sets.push("description = ?"); args.push(b["description"] != null ? String(b["description"]) : null); }
  if ("notes" in b) { sets.push("notes = ?"); args.push(b["notes"] != null ? String(b["notes"]) : null); }
  if ("lon" in b) { sets.push("lon = ?"); args.push(b["lon"] != null ? Number(b["lon"]) : null); }
  if ("lat" in b) { sets.push("lat = ?"); args.push(b["lat"] != null ? Number(b["lat"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("gsi_peak" in b) { sets.push("gsi_peak = ?"); args.push(b["gsi_peak"] != null ? Number(b["gsi_peak"]) : null); }
  if ("entity_emerged" in b) { sets.push("entity_emerged = ?"); args.push(JSON.stringify(Array.isArray(b["entity_emerged"]) ? b["entity_emerged"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE dimension_cracks SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM dimension_cracks WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
