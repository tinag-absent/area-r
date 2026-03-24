import { NextRequest, NextResponse }   from "next/server";
import { withErrorHandler, Errors }    from "@/lib/api-error";
import { requireAdmin, isAuthError }   from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

function parseJson(v: unknown, fallback: unknown) {
  if (typeof v !== "string") return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const db = getDb();
  const rows = await queryAll(db, `SELECT * FROM db_facilities ORDER BY code ASC`);
  return NextResponse.json(rows.map((r: Record<string,unknown>) => ({
    ...r,
    equipment_installed: parseJson(r.equipment_installed, []),
    divisions_present:   parseJson(r.divisions_present, []),
  })));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.name || !b.code) throw Errors.validation("name と code が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM db_facilities WHERE code = ?`, [b.code]))
    throw Errors.conflict("このcodeは既に使用されています");
  const id = b.id as string || randomUUID();
  await execute(db,
    `INSERT INTO db_facilities (id,name,code,location,status,clearance,type,description,
     staff,established,equipment_installed,divisions_present,notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.name, b.code, b.location||"", b.status||"OPERATIONAL", Number(b.clearance||1),
     b.type||"", b.description||"", b.staff != null ? Number(b.staff) : null,
     b.established||"",
     JSON.stringify(Array.isArray(b.equipment_installed) ? b.equipment_installed : []),
     JSON.stringify(Array.isArray(b.divisions_present) ? b.divisions_present : []),
     b.notes||""]
  );
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM db_facilities WHERE id = ?`, [b.id]))
    throw Errors.notFound("施設");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: unknown[] = [];
  for (const col of ["name","code","location","status","clearance","type","description","staff","established","notes"]) {
    if (col in b) { sets.push(`${col} = ?`); args.push(b[col] != null ? b[col] : null); }
  }
  if ("equipment_installed" in b) { sets.push("equipment_installed = ?"); args.push(JSON.stringify(b.equipment_installed)); }
  if ("divisions_present"   in b) { sets.push("divisions_present = ?");   args.push(JSON.stringify(b.divisions_present)); }
  args.push(b.id);
  await execute(db, `UPDATE db_facilities SET ${sets.join(",")} WHERE id = ?`, args as (string|number|null)[]);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM db_facilities WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
