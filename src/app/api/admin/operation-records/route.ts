/**
 * CRUD /api/admin/operation-records
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { randomUUID } from "crypto";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM operation_records ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM operation_records WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO operation_records (id, codename, title, op_date, end_date, status, commander_ref, target_ref, location_ref, outcome, description, clearance_req, casualties, division_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["codename"] != null ? String(b["codename"]) : null,
    b["title"] != null ? String(b["title"]) : null,
    b["op_date"] != null ? String(b["op_date"]) : null,
    b["end_date"] != null ? String(b["end_date"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["commander_ref"] != null ? String(b["commander_ref"]) : null,
    b["target_ref"] != null ? String(b["target_ref"]) : null,
    b["location_ref"] != null ? String(b["location_ref"]) : null,
    b["outcome"] != null ? String(b["outcome"]) : null,
    b["description"] != null ? String(b["description"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    b["casualties"] != null ? Number(b["casualties"]) : null,
    JSON.stringify(Array.isArray(b["division_json"]) ? b["division_json"] : []),
    ]
  );
  // operation_divisions テーブルへの正規化書き込み
  if (Array.isArray(b["division_json"])) {
    for (const divId of b["division_json"] as string[]) {
      if (typeof divId === "string" && divId.trim()) {
        await execute(db,
          `INSERT OR IGNORE INTO operation_divisions (id, operation_id, division_id, role)
           VALUES (?, ?, ?, 'participant')`,
          [randomUUID(), String(b.id), divId.trim()]
        );
      }
    }
  }
  return NextResponse.json({ ok: true, id: b.id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM operation_records WHERE id = ?`, [b.id]))
    throw Errors.notFound("operation_records");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("codename" in b) { sets.push("codename = ?"); args.push(b["codename"] != null ? String(b["codename"]) : null); }
  if ("title" in b) { sets.push("title = ?"); args.push(b["title"] != null ? String(b["title"]) : null); }
  if ("op_date" in b) { sets.push("op_date = ?"); args.push(b["op_date"] != null ? String(b["op_date"]) : null); }
  if ("end_date" in b) { sets.push("end_date = ?"); args.push(b["end_date"] != null ? String(b["end_date"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("commander_ref" in b) { sets.push("commander_ref = ?"); args.push(b["commander_ref"] != null ? String(b["commander_ref"]) : null); }
  if ("target_ref" in b) { sets.push("target_ref = ?"); args.push(b["target_ref"] != null ? String(b["target_ref"]) : null); }
  if ("location_ref" in b) { sets.push("location_ref = ?"); args.push(b["location_ref"] != null ? String(b["location_ref"]) : null); }
  if ("outcome" in b) { sets.push("outcome = ?"); args.push(b["outcome"] != null ? String(b["outcome"]) : null); }
  if ("description" in b) { sets.push("description = ?"); args.push(b["description"] != null ? String(b["description"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("casualties" in b) { sets.push("casualties = ?"); args.push(b["casualties"] != null ? Number(b["casualties"]) : null); }
  if ("division_json" in b) { sets.push("division_json = ?"); args.push(JSON.stringify(Array.isArray(b["division_json"]) ? b["division_json"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE operation_records SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM operation_records WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
