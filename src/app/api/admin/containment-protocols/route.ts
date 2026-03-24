/**
 * CRUD /api/admin/containment-protocols
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM containment_protocols ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM containment_protocols WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO containment_protocols (id, codename, title, division_ref, status, threat_class, summary, warnings, clearance_req, steps_json) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["codename"] != null ? String(b["codename"]) : null,
    b["title"] != null ? String(b["title"]) : null,
    b["division_ref"] != null ? String(b["division_ref"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["threat_class"] != null ? String(b["threat_class"]) : null,
    b["summary"] != null ? String(b["summary"]) : null,
    b["warnings"] != null ? String(b["warnings"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    JSON.stringify(Array.isArray(b["steps_json"]) ? b["steps_json"] : []),
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
  if (!await queryOne(db, `SELECT id FROM containment_protocols WHERE id = ?`, [b.id]))
    throw Errors.notFound("containment_protocols");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("codename" in b) { sets.push("codename = ?"); args.push(b["codename"] != null ? String(b["codename"]) : null); }
  if ("title" in b) { sets.push("title = ?"); args.push(b["title"] != null ? String(b["title"]) : null); }
  if ("division_ref" in b) { sets.push("division_ref = ?"); args.push(b["division_ref"] != null ? String(b["division_ref"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("threat_class" in b) { sets.push("threat_class = ?"); args.push(b["threat_class"] != null ? String(b["threat_class"]) : null); }
  if ("summary" in b) { sets.push("summary = ?"); args.push(b["summary"] != null ? String(b["summary"]) : null); }
  if ("warnings" in b) { sets.push("warnings = ?"); args.push(b["warnings"] != null ? String(b["warnings"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("steps_json" in b) { sets.push("steps_json = ?"); args.push(JSON.stringify(Array.isArray(b["steps_json"]) ? b["steps_json"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE containment_protocols SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM containment_protocols WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
