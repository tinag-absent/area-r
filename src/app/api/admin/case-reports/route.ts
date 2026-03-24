/**
 * CRUD /api/admin/case-reports
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
  const rows = await queryAll(getDb(), `SELECT * FROM case_reports ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM case_reports WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO case_reports (id, title, case_date, closed_date, status, division_ref, entity_ref, location_ref, summary, full_report, casualties, clearance_req, personnel_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["title"] != null ? String(b["title"]) : null,
    b["case_date"] != null ? String(b["case_date"]) : null,
    b["closed_date"] != null ? String(b["closed_date"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["division_ref"] != null ? String(b["division_ref"]) : null,
    b["entity_ref"] != null ? String(b["entity_ref"]) : null,
    b["location_ref"] != null ? String(b["location_ref"]) : null,
    b["summary"] != null ? String(b["summary"]) : null,
    b["full_report"] != null ? String(b["full_report"]) : null,
    b["casualties"] != null ? Number(b["casualties"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    JSON.stringify(Array.isArray(b["personnel_json"]) ? b["personnel_json"] : []),
    ]
  );
  // case_personnel テーブルへの正規化書き込み
  if (Array.isArray(b["personnel_json"])) {
    for (const ref of b["personnel_json"] as string[]) {
      if (typeof ref === "string" && ref.trim()) {
        await execute(db,
          `INSERT OR IGNORE INTO case_personnel (id, case_id, personnel_ref, role)
           VALUES (?, ?, ?, 'member')`,
          [randomUUID(), String(b.id), ref.trim()]
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
  if (!await queryOne(db, `SELECT id FROM case_reports WHERE id = ?`, [b.id]))
    throw Errors.notFound("case_reports");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("title" in b) { sets.push("title = ?"); args.push(b["title"] != null ? String(b["title"]) : null); }
  if ("case_date" in b) { sets.push("case_date = ?"); args.push(b["case_date"] != null ? String(b["case_date"]) : null); }
  if ("closed_date" in b) { sets.push("closed_date = ?"); args.push(b["closed_date"] != null ? String(b["closed_date"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("division_ref" in b) { sets.push("division_ref = ?"); args.push(b["division_ref"] != null ? String(b["division_ref"]) : null); }
  if ("entity_ref" in b) { sets.push("entity_ref = ?"); args.push(b["entity_ref"] != null ? String(b["entity_ref"]) : null); }
  if ("location_ref" in b) { sets.push("location_ref = ?"); args.push(b["location_ref"] != null ? String(b["location_ref"]) : null); }
  if ("summary" in b) { sets.push("summary = ?"); args.push(b["summary"] != null ? String(b["summary"]) : null); }
  if ("full_report" in b) { sets.push("full_report = ?"); args.push(b["full_report"] != null ? String(b["full_report"]) : null); }
  if ("casualties" in b) { sets.push("casualties = ?"); args.push(b["casualties"] != null ? Number(b["casualties"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("personnel_json" in b) { sets.push("personnel_json = ?"); args.push(JSON.stringify(Array.isArray(b["personnel_json"]) ? b["personnel_json"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE case_reports SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM case_reports WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
