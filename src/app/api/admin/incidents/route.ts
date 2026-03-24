/**
 * GET    /api/admin/incidents        — 全インシデント
 * POST   /api/admin/incidents        — 新規作成（Zodバリデーション）
 * PATCH  /api/admin/incidents        — 更新
 * DELETE /api/admin/incidents?id=... — 削除
 * Updated: 2026-03-23 — createRoute + Zod に移行
 */
import { NextResponse }                  from "next/server";
import { createRoute }                   from "@/lib/api/handler";
import { queryAll, queryOne, execute }   from "@/lib/db";
import { Errors }                        from "@/lib/api-error";
import { randomUUID }                    from "crypto";
import { IncidentPostSchema }            from "@/lib/api/schemas";
import { z }                             from "zod";

const IncidentPatchSchema = IncidentPostSchema.partial().extend({ id: z.string().min(1) });

export const GET = createRoute({
  auth: "admin",
  handler: async ({ db }) => {
    const rows = await queryAll(db, `SELECT * FROM field_incidents ORDER BY time DESC`);
    return NextResponse.json(rows);
  },
});

export const POST = createRoute({
  auth: "admin",
  bodySchema: IncidentPostSchema,
  handler: async ({ db, body }) => {
    const id = body.id ?? randomUUID();
    await execute(db,
      `INSERT INTO field_incidents
         (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, body.severity, body.status, body.name.trim(),
       body.lon, body.lat, body.location, body.entity, body.gsi,
       body.division, body.desc,
       new Date().toISOString().slice(0,16).replace("T"," "),
       body.city_code ?? null, body.city_name ?? null]
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  },
});

export const PATCH = createRoute({
  auth: "admin",
  bodySchema: IncidentPatchSchema,
  handler: async ({ db, body }) => {
    if (!await queryOne(db, `SELECT id FROM field_incidents WHERE id = ?`, [body.id]))
      throw Errors.notFound("インシデント");

    const sets: string[] = ["updated_at = datetime('now')"];
    const args: unknown[] = [];

    const strCols = ["severity","status","name","location","entity","division","desc","city_code","city_name"] as const;
    const numCols = ["lon","lat","gsi"] as const;
    const b = body as Record<string, unknown>;

    for (const c of strCols) {
      if (c in b && b[c] !== undefined) { sets.push(`${c} = ?`); args.push(b[c] ?? null); }
    }
    for (const c of numCols) {
      if (c in b && b[c] !== undefined) { sets.push(`${c} = ?`); args.push(b[c]); }
    }
    if ("time" in b && b["time"] !== undefined) { sets.push("time = ?"); args.push(b["time"]); }
    if (sets.length === 1) throw Errors.validation("更新フィールドがありません");

    args.push(body.id);
    await execute(db, `UPDATE field_incidents SET ${sets.join(",")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  },
});

export const DELETE = createRoute({
  auth: "admin",
  handler: async ({ db, query }) => {
    const id = query.get("id");
    if (!id) throw Errors.validation("id が必要です");
    await execute(db, `DELETE FROM field_incidents WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  },
});
