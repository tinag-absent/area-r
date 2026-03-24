/**
 * GET    /api/admin/audio          — 全件一覧
 * POST   /api/admin/audio          — 新規作成
 * PATCH  /api/admin/audio          — 更新
 * DELETE /api/admin/audio?id=...   — 削除
 *
 * Updated: 2026-03-22
 */
import { NextRequest, NextResponse }         from "next/server";
import { withErrorHandler, Errors }          from "@/lib/api-error";
import { requireAdmin, isAuthError }         from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const rows = await queryAll(getDb(),
    `SELECT * FROM audio_records ORDER BY recorded_at DESC`
  );
  return NextResponse.json(rows.map(r => ({
    ...r,
    transcript_json: (() => {
      try { return JSON.parse(r.transcript_json as string); } catch { return []; }
    })(),
  })));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const b = await req.json() as Record<string, unknown>;
  if (!String(b.id   || "").trim()) throw Errors.validation("id が必要です");
  if (!String(b.title|| "").trim()) throw Errors.validation("title が必要です");

  const db = getDb();
  if (await queryOne(db, `SELECT id FROM audio_records WHERE id = ?`, [b.id]))
    throw Errors.validation(`ID ${b.id} はすでに存在します`);

  await execute(db,
    `INSERT INTO audio_records
       (id, title, filename, duration_sec, recorded_at, recorded_by,
        location_ref, classification, clearance_req, voice_detected,
        integrity, transcript_json, gsi_value, entity_ref, notes, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.id).trim(),
      String(b.title).trim(),
      String(b.filename || b.id).trim(),
      Number(b.duration_sec  || 0),
      String(b.recorded_at   || ""),
      String(b.recorded_by   || ""),
      b.location_ref  ? String(b.location_ref)  : null,
      String(b.classification || "safe"),
      Number(b.clearance_req  || 0),
      Number(b.voice_detected ?? 1),
      Number(b.integrity      ?? 100),
      JSON.stringify(Array.isArray(b.transcript_json) ? b.transcript_json : []),
      b.gsi_value  != null ? Number(b.gsi_value)  : null,
      b.entity_ref ? String(b.entity_ref) : null,
      b.notes      ? String(b.notes)      : null,
      auth.user.agentId || "admin",
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
  if (!await queryOne(db, `SELECT id FROM audio_records WHERE id = ?`, [b.id]))
    throw Errors.notFound("音声記録");

  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];

  const strCols = ["title","filename","recorded_at","recorded_by",
                   "location_ref","classification","entity_ref","notes"];
  const numCols = ["duration_sec","clearance_req","voice_detected","integrity","gsi_value"];

  for (const c of strCols) {
    if (c in b) { sets.push(`${c} = ?`); args.push(b[c] != null ? String(b[c]) : null); }
  }
  for (const c of numCols) {
    if (c in b) { sets.push(`${c} = ?`); args.push(b[c] != null ? Number(b[c]) : null); }
  }
  if ("transcript_json" in b) {
    sets.push("transcript_json = ?");
    args.push(JSON.stringify(Array.isArray(b.transcript_json) ? b.transcript_json : []));
  }

  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE audio_records SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");
  await execute(getDb(), `DELETE FROM audio_records WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
});
