/**
 * Admin CRUD — db_entities
 * GET / POST / PATCH / DELETE
 */
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
  const rows = await queryAll(db, `SELECT * FROM db_entities ORDER BY code ASC`);
  return NextResponse.json(rows.map((r: Record<string,unknown>) => ({
    ...r,
    observed_abilities: parseJson(r.observed_abilities, []),
    related_entities:   parseJson(r.related_entities, []),
  })));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.designation || !b.code) throw Errors.validation("designation と code が必要です");
  const db = getDb();
  if (await queryOne(db, `SELECT id FROM db_entities WHERE code = ?`, [b.code]))
    throw Errors.conflict("このcodeは既に使用されています");
  const id = b.id as string || randomUUID();
  const entityCode = String(b.code);
  await execute(db,
    `INSERT INTO db_entities (id,designation,code,threat,clearance,status,classification,
     description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.designation, b.code, b.threat||"UNKNOWN", Number(b.clearance||1), b.status||"OBSERVED",
     b.classification||"unknown", b.description||"", b.first_detected||"",
     b.neutralized != null ? Number(b.neutralized) : null,
     b.containment_protocol||"",
     JSON.stringify(Array.isArray(b.observed_abilities) ? b.observed_abilities : []),
     JSON.stringify(Array.isArray(b.related_entities) ? b.related_entities : [])]
  );
  // entity_relations テーブルへの正規化書き込み
  if (Array.isArray(b.related_entities)) {
    for (const rel of b.related_entities as string[]) {
      if (typeof rel === "string" && rel.trim()) {
        await execute(db,
          `INSERT OR IGNORE INTO entity_relations (id, from_entity, to_entity, relation_type)
           VALUES (?, ?, ?, 'related')`,
          [randomUUID(), entityCode, rel.trim()]
        );
      }
    }
  }
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const b = await req.json() as Record<string,unknown>;
  if (!b.id) throw Errors.validation("id が必要です");
  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM db_entities WHERE id = ?`, [b.id]))
    throw Errors.notFound("実体");
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: unknown[] = [];
  const fields: [string, string][] = [
    ["designation","designation"],["code","code"],["threat","threat"],
    ["clearance","clearance"],["status","status"],["classification","classification"],
    ["description","description"],["first_detected","first_detected"],
    ["neutralized","neutralized"],["containment_protocol","containment_protocol"],
  ];
  for (const [bk, col] of fields) {
    if (bk in b) { sets.push(`${col} = ?`); args.push(b[bk] != null ? b[bk] : null); }
  }
  if ("observed_abilities" in b) {
    sets.push("observed_abilities = ?");
    args.push(JSON.stringify(Array.isArray(b.observed_abilities) ? b.observed_abilities : []));
  }
  if ("related_entities" in b) {
    sets.push("related_entities = ?");
    args.push(JSON.stringify(Array.isArray(b.related_entities) ? b.related_entities : []));
  }
  args.push(b.id);
  await execute(db, `UPDATE db_entities SET ${sets.join(",")} WHERE id = ?`, args as (string|number|null)[]);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  const db = getDb();
  await execute(db, `DELETE FROM db_entities WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
