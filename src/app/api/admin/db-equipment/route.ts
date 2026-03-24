import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

function pj(v: unknown, f: unknown) { try { return JSON.parse(v as string); } catch { return f; } }

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM db_equipment ORDER BY code ASC`);
  return NextResponse.json(rows.map((r: Record<string,unknown>) => ({ ...r, specifications: pj(r.specifications, {}) })));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.name || !b.code) throw Errors.validation("name と code が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM db_equipment WHERE code = ?`, [b.code])) throw Errors.conflict("code重複");
  const id = (b.id as string) || randomUUID();
  await execute(db,
    `INSERT INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.name, b.code, b.category||"", b.status||"IN_SERVICE", Number(b.clearance||1),
     b.quantity != null ? Number(b.quantity) : null, b.description||"", b.weight||"", b.issued_by||"",
     JSON.stringify(typeof b.specifications === "object" && b.specifications ? b.specifications : {}),
     b.maintenance_cycle||""]
  );
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM db_equipment WHERE id = ?`, [b.id])) throw Errors.notFound("装備");
  const sets: string[] = ["updated_at = datetime('now')"]; const args: unknown[] = [];
  for (const col of ["name","code","category","status","clearance","quantity","description","weight","issued_by","maintenance_cycle"]) {
    if (col in b) { sets.push(`${col} = ?`); args.push(b[col] != null ? b[col] : null); }
  }
  if ("specifications" in b) { sets.push("specifications = ?"); args.push(JSON.stringify(b.specifications || {})); }
  args.push(b.id);
  await execute(db, `UPDATE db_equipment SET ${sets.join(",")} WHERE id = ?`, args as (string|number|null)[]);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM db_equipment WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
