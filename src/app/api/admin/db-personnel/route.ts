import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

function pj(v: unknown, f: unknown) { try { return JSON.parse(v as string); } catch { return f; } }

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const rows = await queryAll(getDb(), `SELECT * FROM db_personnel ORDER BY id ASC`);
  return NextResponse.json(rows.map((r: Record<string,unknown>) => ({
    ...r, commendations: pj(r.commendations, []), incident_flags: pj(r.incident_flags, []),
  })));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.codename) throw Errors.validation("codename が必要です");
  const db = getDb();
  const id = (b.id as string) || randomUUID();
  await execute(db,
    `INSERT INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.codename, b.real_name||"", b.role||"", b.division||"", Number(b.clearance||1),
     b.status||"ACTIVE", b.joined||"", b.last_seen||"—", b.specialization||"", b.notes||"",
     b.anomaly_score != null ? Number(b.anomaly_score) : null,
     b.missions_completed != null ? Number(b.missions_completed) : null,
     JSON.stringify(Array.isArray(b.commendations) ? b.commendations : []),
     JSON.stringify(Array.isArray(b.incident_flags) ? b.incident_flags : [])]
  );
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM db_personnel WHERE id = ?`, [b.id])) throw Errors.notFound("人事");
  const sets: string[] = ["updated_at = datetime('now')"]; const args: unknown[] = [];
  for (const col of ["codename","real_name","role","division","clearance","status","joined","last_seen","specialization","notes","anomaly_score","missions_completed"]) {
    if (col in b) { sets.push(`${col} = ?`); args.push(b[col] != null ? b[col] : null); }
  }
  if ("commendations"  in b) { sets.push("commendations = ?");  args.push(JSON.stringify(b.commendations  || [])); }
  if ("incident_flags" in b) { sets.push("incident_flags = ?"); args.push(JSON.stringify(b.incident_flags || [])); }
  args.push(b.id);
  await execute(db, `UPDATE db_personnel SET ${sets.join(",")} WHERE id = ?`, args as (string|number|null)[]);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req); if (isAuthError(auth)) return auth;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM db_personnel WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
