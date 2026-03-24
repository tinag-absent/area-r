/**
 * CRUD /api/admin/research-theories
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM research_theories ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM research_theories WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO research_theories (id, title, author_ref, division_ref, proposed_at, status, abstract, confidence, clearance_req, evidence_json, related_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["title"] != null ? String(b["title"]) : null,
    b["author_ref"] != null ? String(b["author_ref"]) : null,
    b["division_ref"] != null ? String(b["division_ref"]) : null,
    b["proposed_at"] != null ? String(b["proposed_at"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["abstract"] != null ? String(b["abstract"]) : null,
    b["confidence"] != null ? Number(b["confidence"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    JSON.stringify(Array.isArray(b["evidence_json"]) ? b["evidence_json"] : []),
    JSON.stringify(Array.isArray(b["related_json"]) ? b["related_json"] : []),
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
  if (!await queryOne(db, `SELECT id FROM research_theories WHERE id = ?`, [b.id]))
    throw Errors.notFound("research_theories");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("title" in b) { sets.push("title = ?"); args.push(b["title"] != null ? String(b["title"]) : null); }
  if ("author_ref" in b) { sets.push("author_ref = ?"); args.push(b["author_ref"] != null ? String(b["author_ref"]) : null); }
  if ("division_ref" in b) { sets.push("division_ref = ?"); args.push(b["division_ref"] != null ? String(b["division_ref"]) : null); }
  if ("proposed_at" in b) { sets.push("proposed_at = ?"); args.push(b["proposed_at"] != null ? String(b["proposed_at"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("abstract" in b) { sets.push("abstract = ?"); args.push(b["abstract"] != null ? String(b["abstract"]) : null); }
  if ("confidence" in b) { sets.push("confidence = ?"); args.push(b["confidence"] != null ? Number(b["confidence"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("evidence_json" in b) { sets.push("evidence_json = ?"); args.push(JSON.stringify(Array.isArray(b["evidence_json"]) ? b["evidence_json"] : [])); }
  if ("related_json" in b) { sets.push("related_json = ?"); args.push(JSON.stringify(Array.isArray(b["related_json"]) ? b["related_json"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE research_theories SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM research_theories WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
