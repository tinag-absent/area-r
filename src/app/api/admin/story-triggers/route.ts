/**
 * GET    /api/admin/story-triggers         — トリガー一覧
 * POST   /api/admin/story-triggers         — 新規作成
 * PATCH  /api/admin/story-triggers         — 更新（active/priority/conditions/effects）
 * DELETE /api/admin/story-triggers?id=...  — 削除
 *
 * story_triggers テーブルを管理する。
 * 更新後は invalidateTriggerCache() を呼び出し、次回 checkAndFireTriggers() から
 * 即座に新しいルールが適用される。
 */
import { NextRequest, NextResponse }            from "next/server";
import { withErrorHandler, Errors }             from "@/lib/api-error";
import { requireAdmin, isAuthError }            from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute }   from "@/lib/db";
import { randomUUID }                           from "crypto";
import { invalidateTriggerCache }               from "@/lib/event-triggers";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const rows = await queryAll(db,
    `SELECT id, title, trigger_type, active, priority, once_per_user,
            conditions_json, effects_json, description, created_at, updated_at
     FROM story_triggers
     ORDER BY priority DESC, created_at ASC`
  );
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const b = await req.json() as Record<string, unknown>;
  if (!String(b.title ?? "").trim()) throw Errors.validation("title が必要です");
  if (!b.conditions_json)           throw Errors.validation("conditions_json が必要です");
  if (!b.effects_json)              throw Errors.validation("effects_json が必要です");

  // JSON文字列のバリデーション
  try { JSON.parse(String(b.conditions_json)); } catch { throw Errors.validation("conditions_json が不正なJSONです"); }
  try { JSON.parse(String(b.effects_json));    } catch { throw Errors.validation("effects_json が不正なJSONです"); }

  const db = getDb();
  const id = String(b.id || randomUUID());

  if (await queryOne(db, `SELECT id FROM story_triggers WHERE id = ?`, [id])) {
    throw Errors.conflict(`ID ${id} は既に存在します`);
  }

  await execute(db,
    `INSERT INTO story_triggers
       (id, title, trigger_type, active, priority, once_per_user,
        conditions_json, effects_json, description, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      String(b.title).trim(),
      String(b.trigger_type ?? "composite"),
      b.active !== false ? 1 : 0,
      Number(b.priority ?? 0),
      b.once_per_user !== false ? 1 : 0,
      String(b.conditions_json),
      String(b.effects_json),
      b.description ? String(b.description) : null,
      auth.user.id,
    ]
  );

  invalidateTriggerCache();
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const b = await req.json() as Record<string, unknown>;
  if (!b.id) throw Errors.validation("id が必要です");

  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM story_triggers WHERE id = ?`, [b.id])) {
    throw Errors.notFound("トリガー");
  }

  const sets: string[] = [`updated_at = datetime('now')`];
  const args: unknown[] = [];

  const fields = [
    ["title",           "title"],
    ["trigger_type",    "trigger_type"],
    ["description",     "description"],
  ] as const;

  for (const [key, col] of fields) {
    if (key in b) { sets.push(`${col} = ?`); args.push(b[key] ?? null); }
  }
  if ("active" in b)         { sets.push("active = ?");         args.push(b.active ? 1 : 0); }
  if ("once_per_user" in b)  { sets.push("once_per_user = ?");  args.push(b.once_per_user ? 1 : 0); }
  if ("priority" in b)       { sets.push("priority = ?");       args.push(Number(b.priority)); }
  if ("conditions_json" in b) {
    try { JSON.parse(String(b.conditions_json)); } catch { throw Errors.validation("conditions_json が不正なJSONです"); }
    sets.push("conditions_json = ?"); args.push(String(b.conditions_json));
  }
  if ("effects_json" in b) {
    try { JSON.parse(String(b.effects_json)); } catch { throw Errors.validation("effects_json が不正なJSONです"); }
    sets.push("effects_json = ?"); args.push(String(b.effects_json));
  }

  args.push(b.id);
  await execute(db, `UPDATE story_triggers SET ${sets.join(", ")} WHERE id = ?`, args);

  invalidateTriggerCache();
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  await execute(getDb(), `DELETE FROM story_triggers WHERE id = ?`, [id]);
  invalidateTriggerCache();
  return NextResponse.json({ ok: true });
});
