/**
 * CRUD /api/admin/agent-memos
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM agent_memos ORDER BY id`);
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM agent_memos WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO agent_memos (id, title, author_ref, location_ref, written_at, found_at, found_by, status, content, clearance_req, tags_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
    b["title"] != null ? String(b["title"]) : null,
    b["author_ref"] != null ? String(b["author_ref"]) : null,
    b["location_ref"] != null ? String(b["location_ref"]) : null,
    b["written_at"] != null ? String(b["written_at"]) : null,
    b["found_at"] != null ? String(b["found_at"]) : null,
    b["found_by"] != null ? String(b["found_by"]) : null,
    b["status"] != null ? String(b["status"]) : null,
    b["content"] != null ? String(b["content"]) : null,
    b["clearance_req"] != null ? Number(b["clearance_req"]) : null,
    JSON.stringify(Array.isArray(b["tags_json"]) ? b["tags_json"] : []),
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
  if (!await queryOne(db, `SELECT id FROM agent_memos WHERE id = ?`, [b.id]))
    throw Errors.notFound("agent_memos");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];
  if ("title" in b) { sets.push("title = ?"); args.push(b["title"] != null ? String(b["title"]) : null); }
  if ("author_ref" in b) { sets.push("author_ref = ?"); args.push(b["author_ref"] != null ? String(b["author_ref"]) : null); }
  if ("location_ref" in b) { sets.push("location_ref = ?"); args.push(b["location_ref"] != null ? String(b["location_ref"]) : null); }
  if ("written_at" in b) { sets.push("written_at = ?"); args.push(b["written_at"] != null ? String(b["written_at"]) : null); }
  if ("found_at" in b) { sets.push("found_at = ?"); args.push(b["found_at"] != null ? String(b["found_at"]) : null); }
  if ("found_by" in b) { sets.push("found_by = ?"); args.push(b["found_by"] != null ? String(b["found_by"]) : null); }
  if ("status" in b) { sets.push("status = ?"); args.push(b["status"] != null ? String(b["status"]) : null); }
  if ("content" in b) { sets.push("content = ?"); args.push(b["content"] != null ? String(b["content"]) : null); }
  if ("clearance_req" in b) { sets.push("clearance_req = ?"); args.push(b["clearance_req"] != null ? Number(b["clearance_req"]) : null); }
  if ("tags_json" in b) { sets.push("tags_json = ?"); args.push(JSON.stringify(Array.isArray(b["tags_json"]) ? b["tags_json"] : [])); }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE agent_memos SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM agent_memos WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
