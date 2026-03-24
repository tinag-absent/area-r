/**
 * GET    /api/admin/npc-engine          — NPCルール一覧
 * POST   /api/admin/npc-engine          — ルール追加
 * PATCH  /api/admin/npc-engine          — 有効/無効切替
 * DELETE /api/admin/npc-engine?id=...  — 削除
 *
 * npc_engine_rules テーブル（既存）を使用。
 * data_json: { keywords, npc, responses, chainNpc?, chainChance?, chainResponses?, delayMin, delayMax }
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                from "crypto";
import { invalidateNpcRuleCache }    from "@/lib/npc-engine";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const rows = await queryAll<{
    id: string; active: number; priority: number; data_json: string; created_at: string;
  }>(db,
    `SELECT id, active, priority, data_json, created_at
     FROM npc_engine_rules ORDER BY priority DESC, created_at DESC`
  );

  return NextResponse.json(rows.map(r => {
    let data = {};
    try { data = JSON.parse(r.data_json); } catch { /* noop */ }
    return { ...r, data };
  }));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    keywords:       string[];
    npc:            string;
    responses:      string[];
    chainNpc?:      string;
    chainChance?:   number;
    chainResponses?: string[];
    delayMin?:      number;
    delayMax?:      number;
    priority?:      number;
  };

  if (!body.keywords?.length)  throw Errors.validation("keywords が必要です");
  if (!body.npc?.trim())       throw Errors.validation("npc が必要です");
  if (!body.responses?.length) throw Errors.validation("responses が必要です");

  const db = getDb();
  const id = randomUUID();
  await execute(db,
    `INSERT INTO npc_engine_rules (id, active, priority, data_json)
     VALUES (?, 1, ?, ?)`,
    [id, body.priority ?? 0, JSON.stringify(body)]
  );

  invalidateNpcRuleCache();
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as { id: string; active?: boolean; priority?: number };
  if (!body.id) throw Errors.validation("id が必要です");

  const db   = getDb();
  const item = await queryOne<{ active: number }>(db,
    `SELECT active FROM npc_engine_rules WHERE id = ?`, [body.id]
  );
  if (!item) throw Errors.notFound("ルール");

  if (body.active !== undefined) {
    await execute(db, `UPDATE npc_engine_rules SET active = ? WHERE id = ?`,
      [body.active ? 1 : 0, body.id]
    );
  }
  if (body.priority !== undefined) {
    await execute(db, `UPDATE npc_engine_rules SET priority = ? WHERE id = ?`,
      [body.priority, body.id]
    );
  }

  invalidateNpcRuleCache();
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  await execute(db, `DELETE FROM npc_engine_rules WHERE id = ?`, [id]);
  invalidateNpcRuleCache();
  return NextResponse.json({ ok: true });
});
