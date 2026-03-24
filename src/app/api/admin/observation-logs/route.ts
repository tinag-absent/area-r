/**
 * CRUD /api/admin/observation-logs
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM observation_logs ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM observation_logs WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO observation_logs (id, type, title, observed_at, location_ref, entity_ref, freq_band, pattern_match, scan_area, severity, description, clearance_req, gsi_value, gsi_baseline, amplitude_db, duration_sec, findings_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["type"] != null ? String(b["type"]) : null,
    b["title"] != null ? String(b["title"]) : null,
    b["observed_at"] != null ? String(b["observed_at"]) : null,
    b["location_ref"] != null ? String(b["location_ref"]) : null,
    b["entity_ref"] != null ? String(b["entity_ref"]) : null,
    b["freq_band"] != null ? String(b["freq_band"]) : null,
    b["pattern_match"] != null ? String(b["pattern_match"]) : null,
    b["scan_area"] != null ? String(b["scan_area"]) : null,
    b["severity"] != null ? String(b["severity"]) : null,
    b["description"] != null ? String(b["description"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    b["gsi_value"] != null ? Number(b["gsi_value"]) : null,
    b["gsi_baseline"] != null ? Number(b["gsi_baseline"]) : null,
    b["amplitude_db"] != null ? Number(b["amplitude_db"]) : null,
    b["duration_sec"] != null ? Number(b["duration_sec"]) : null,
    JSON.stringify(Array.isArray(b["findings_json"]) ? b["findings_json"] : []),
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
  if (!await queryOne(db, `SELECT id FROM observation_logs WHERE id = ?`, [b.id]))
    throw Errors.notFound("observation_logs");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("type" in b) { sets.push("type = ?"); args.push(b["type"] != null ? String(b["type"]) : null); }
  if ("title" in b) { sets.push("title = ?"); args.push(b["title"] != null ? String(b["title"]) : null); }
  if ("observed_at" in b) { sets.push("observed_at = ?"); args.push(b["observed_at"] != null ? String(b["observed_at"]) : null); }
  if ("location_ref" in b) { sets.push("location_ref = ?"); args.push(b["location_ref"] != null ? String(b["location_ref"]) : null); }
  if ("entity_ref" in b) { sets.push("entity_ref = ?"); args.push(b["entity_ref"] != null ? String(b["entity_ref"]) : null); }
  if ("freq_band" in b) { sets.push("freq_band = ?"); args.push(b["freq_band"] != null ? String(b["freq_band"]) : null); }
  if ("pattern_match" in b) { sets.push("pattern_match = ?"); args.push(b["pattern_match"] != null ? String(b["pattern_match"]) : null); }
  if ("scan_area" in b) { sets.push("scan_area = ?"); args.push(b["scan_area"] != null ? String(b["scan_area"]) : null); }
  if ("severity" in b) { sets.push("severity = ?"); args.push(b["severity"] != null ? String(b["severity"]) : null); }
  if ("description" in b) { sets.push("description = ?"); args.push(b["description"] != null ? String(b["description"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("gsi_value" in b) { sets.push("gsi_value = ?"); args.push(b["gsi_value"] != null ? Number(b["gsi_value"]) : null); }
  if ("gsi_baseline" in b) { sets.push("gsi_baseline = ?"); args.push(b["gsi_baseline"] != null ? Number(b["gsi_baseline"]) : null); }
  if ("amplitude_db" in b) { sets.push("amplitude_db = ?"); args.push(b["amplitude_db"] != null ? Number(b["amplitude_db"]) : null); }
  if ("duration_sec" in b) { sets.push("duration_sec = ?"); args.push(b["duration_sec"] != null ? Number(b["duration_sec"]) : null); }
  if ("findings_json" in b) { sets.push("findings_json = ?"); args.push(JSON.stringify(Array.isArray(b["findings_json"]) ? b["findings_json"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE observation_logs SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM observation_logs WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
