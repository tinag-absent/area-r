/**
 * CRUD /api/admin/sigma-messages
 * Updated: 2026-03-23
 */
import { NextRequest, NextResponse }          from "next/server";
import { withErrorHandler, Errors }           from "@/lib/api-error";
import { requireAdmin, isAuthError }          from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(),
    `SELECT * FROM sigma_messages ORDER BY number ASC`
  );
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b  = await req.json() as Record<string, unknown>;
  if (!b.id)     throw Errors.validation("id が必要です");
  if (!b.number) throw Errors.validation("number が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM sigma_messages WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} は既に存在します`);
  await execute(db,
    `INSERT INTO sigma_messages
       (id, number, received_at, medium, integrity, clearance_req, content, context_ref)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      String(b.id),
      Number(b.number),
      b.received_at  ? String(b.received_at)  : "",
      b.medium       ? String(b.medium)       : "N-VEIL 通信補助体経由",
      b.integrity    != null ? Number(b.integrity)    : 100,
      b.clearance_req != null ? Number(b.clearance_req) : 1,
      b.content      ? String(b.content)      : "",
      b.context_ref  ? String(b.context_ref)  : null,
    ]
  );
  return NextResponse.json({ ok: true, id: b.id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b  = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM sigma_messages WHERE id = ?`, [b.id]))
    throw Errors.notFound("SIGMAメッセージ");
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  const strCols = ["received_at","medium","content","context_ref"];
  const numCols = ["number","integrity","clearance_req"];
  for (const c of strCols) if (c in b) { sets.push(`${c} = ?`); args.push(b[c] != null ? String(b[c]) : null); }
  for (const c of numCols) if (c in b) { sets.push(`${c} = ?`); args.push(b[c] != null ? Number(b[c]) : null); }
  if (sets.length === 0) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE sigma_messages SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM sigma_messages WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
