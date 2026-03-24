/**
 * GET /api/audio          — 音声記録一覧（クリアランスフィルタ済み）
 * GET /api/audio?id=AUD-1 — 単一レコード（transcript_json 含む）
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }           from "next/server";
import { createRoute }            from "@/lib/api/handler";
import { queryAll, queryOne }     from "@/lib/db";
import { Errors }                 from "@/lib/api-error";
import type { DbAudioRecord }     from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const userLevel = user.level ?? 0;
    const id        = query.get("id");

    if (id) {
      const row = await queryOne<DbAudioRecord>(db,
        `SELECT * FROM audio_records WHERE id = ? AND clearance_req <= ?`,
        [id, userLevel]
      );
      if (!row) throw Errors.notFound("音声記録");

      return NextResponse.json({
        ...row,
        transcript_json: (() => {
          try { return JSON.parse(row.transcript_json); } catch { return []; }
        })(),
      });
    }

    const rows = await queryAll<Pick<DbAudioRecord,
      "id"|"title"|"filename"|"duration_sec"|"recorded_at"|"recorded_by"|
      "classification"|"clearance_req"|"voice_detected"|"integrity"|
      "gsi_value"|"entity_ref"|"location_ref"
    >>(db,
      `SELECT id, title, filename, duration_sec, recorded_at, recorded_by,
              classification, clearance_req, voice_detected, integrity,
              gsi_value, entity_ref, location_ref
       FROM audio_records
       WHERE clearance_req <= ?
       ORDER BY recorded_at DESC`,
      [userLevel]
    );

    return NextResponse.json(rows);
  },
});
