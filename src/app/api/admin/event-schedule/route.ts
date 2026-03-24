/**
 * GET    /api/admin/event-schedule          — イベント一覧
 * POST   /api/admin/event-schedule          — イベント登録
 * PATCH  /api/admin/event-schedule          — fire_now / cancel
 * DELETE /api/admin/event-schedule?id=...  — 削除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                from "crypto";

// ── GET ──────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "scheduled";

  const db   = getDb();
  const rows = await queryAll<{
    id: string; title: string; description: string | null;
    trigger_at: string; status: string; actions_json: string;
    created_by: string; created_at: string; fired_at: string | null;
  }>(db,
    `SELECT id, title, description, trigger_at, status,
            actions_json, created_by, created_at, fired_at
     FROM event_schedule
     WHERE status = ?
     ORDER BY trigger_at ASC
     LIMIT 100`,
    [status]
  );

  return NextResponse.json(rows);
});

// ── POST ─────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    title:       string;
    description?: string;
    triggerAt:   string;
    actions:     unknown[];
  };

  if (!body.title?.trim()) throw Errors.validation("title が必要です");
  if (!body.triggerAt)     throw Errors.validation("triggerAt が必要です");
  if (!Array.isArray(body.actions) || body.actions.length === 0)
    throw Errors.validation("actions が必要です");

  const triggerDate = new Date(body.triggerAt);
  if (isNaN(triggerDate.getTime())) throw Errors.validation("triggerAt の形式が不正です");

  const triggerAtSql = triggerDate.toISOString().replace("T", " ").slice(0, 19);

  const db = getDb();
  const id = randomUUID();

  await execute(db,
    `INSERT INTO event_schedule
       (id, title, description, trigger_at, actions_json, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, body.title.trim(), body.description ?? null,
     triggerAtSql, JSON.stringify(body.actions), auth.user.id]
  );

  return NextResponse.json({ ok: true, id }, { status: 201 });
});

// ── PATCH ────────────────────────────────────────────────────────────

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as { id: string; action: "fire_now" | "cancel" };
  if (!body.id)     throw Errors.validation("id が必要です");
  if (!body.action) throw Errors.validation("action が必要です");

  const db   = getDb();
  const item = await queryOne<{
    status: string; actions_json: string;
  }>(db, `SELECT status, actions_json FROM event_schedule WHERE id = ?`, [body.id]);

  if (!item) throw Errors.notFound("イベント");
  if (item.status !== "scheduled")
    throw Errors.validation("scheduled ステータスのイベントのみ操作可能です");

  if (body.action === "cancel") {
    await execute(db,
      `UPDATE event_schedule SET status = 'cancelled' WHERE id = ?`, [body.id]
    );
    return NextResponse.json({ ok: true, action: "cancel" });
  }

  if (body.action === "fire_now") {
    // アクションを実行
    let actions: Array<{
      type?: string;
      notify_target?: string;
      notify_title?: string;
      notify_body?: string;
      flag_key?: string;
      flag_value?: string;
    }> = [];
    try { actions = JSON.parse(item.actions_json); } catch { actions = []; }

    for (const action of actions) {
      if (action.type === "notify" && action.notify_title && action.notify_body) {
        let targetUsers: { id: string }[] = [];
        const target = action.notify_target ?? "all";
        if (target === "all") {
          targetUsers = await queryAll<{ id: string }>(db,
            `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
          );
        } else if (target.startsWith("division:")) {
          const divId = target.split(":")[1] ?? "";
          targetUsers = await queryAll<{ id: string }>(db,
            `SELECT id FROM users WHERE division_id = ? AND status = 'active'`, [divId]
          );
        }
        for (const u of targetUsers) {
          await execute(db,
            `INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, 'system', ?, ?)`,
            [randomUUID(), u.id, action.notify_title, action.notify_body]
          );
        }
      }
      if (action.type === "flag" && action.flag_key) {
        const players = await queryAll<{ id: string }>(db,
          `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
        );
        for (const p of players) {
          await execute(db,
            `INSERT INTO progress_flags (id, user_id, flag_key, flag_value, set_at)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT (user_id, flag_key)
             DO UPDATE SET flag_value = excluded.flag_value, set_at = excluded.set_at`,
            [randomUUID(), p.id, action.flag_key, action.flag_value ?? "true"]
          );
        }
      }
    }

    await execute(db,
      `UPDATE event_schedule
       SET status = 'published', fired_at = datetime('now')
       WHERE id = ?`, [body.id]
    );
    return NextResponse.json({ ok: true, action: "fire_now" });
  }

  throw Errors.validation(`未知のアクション: ${body.action}`);
});

// ── DELETE ───────────────────────────────────────────────────────────

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  await execute(db,
    `DELETE FROM event_schedule WHERE id = ? AND status IN ('cancelled', 'published')`, [id]
  );
  return NextResponse.json({ ok: true });
});
