/**
 * GET /api/cron/publish-queue
 *
 * Vercel Cron から毎時実行。以下の2つを処理する：
 *   A) publish_queue   — 公開時刻が過ぎたコンテンツを published_content に登録
 *   B) event_schedule  — trigger_at が過ぎたイベントを発火（通知・フラグ付与）
 *
 * vercel.json: { "path": "/api/cron/publish-queue", "schedule": "0 * * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }   from "@/lib/api-error";
import { getDb, queryAll, execute }    from "@/lib/db";
import { randomUUID }                  from "crypto";

async function resolveNotifyTarget(
  db: ReturnType<typeof getDb>,
  target: string
): Promise<{ id: string }[]> {
  if (target === "all") {
    return queryAll<{ id: string }>(db,
      `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
    );
  }
  if (target.startsWith("division:")) {
    const divId = target.split(":")[1] ?? "";
    return queryAll<{ id: string }>(db,
      `SELECT id FROM users WHERE division_id = ? AND status = 'active'`,
      [divId]
    );
  }
  return [];
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw Errors.unauthorized("Unauthorized");
  }

  const db = getDb();
  const results = { publishQueue: 0, eventSchedule: 0 };

  // ── A) publish_queue ─────────────────────────────────────────────────

  const duePublish = await queryAll<{
    id: string; content_type: string; content_id: string;
    notify_target: string | null; notify_title: string | null;
    notify_body: string | null; flag_key: string | null; flag_value: string;
  }>(db,
    `SELECT id, content_type, content_id, notify_target, notify_title, notify_body, flag_key, flag_value
     FROM publish_queue
     WHERE status = 'scheduled' AND publish_at <= datetime('now')
     ORDER BY publish_at ASC LIMIT 50`
  );

  for (const item of duePublish) {
    await execute(db,
      `INSERT OR REPLACE INTO published_content (content_type, content_id, published_at)
       VALUES (?, ?, datetime('now'))`,
      [item.content_type, item.content_id]
    );

    if (item.flag_key) {
      const players = await queryAll<{ id: string }>(db,
        `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
      );
      for (const p of players) {
        await execute(db,
          `INSERT INTO progress_flags (id, user_id, flag_key, flag_value, set_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT (user_id, flag_key)
           DO UPDATE SET flag_value = excluded.flag_value, set_at = excluded.set_at`,
          [randomUUID(), p.id, item.flag_key, item.flag_value]
        );
      }
    }

    if (item.notify_title && item.notify_body && item.notify_target) {
      const targetUsers = await resolveNotifyTarget(db, item.notify_target);
      for (const user of targetUsers) {
        await execute(db,
          `INSERT INTO notifications (id, user_id, type, title, body)
           VALUES (?, ?, 'unlock', ?, ?)`,
          [randomUUID(), user.id, item.notify_title, item.notify_body]
        );
      }
    }

    await execute(db,
      `UPDATE publish_queue SET status = 'published', published_at = datetime('now') WHERE id = ?`,
      [item.id]
    );
    results.publishQueue++;
  }

  // ── B) event_schedule ────────────────────────────────────────────────

  const dueEvents = await queryAll<{
    id: string; title: string; actions_json: string;
  }>(db,
    `SELECT id, title, actions_json
     FROM event_schedule
     WHERE status = 'scheduled' AND trigger_at <= datetime('now')
     ORDER BY trigger_at ASC LIMIT 30`
  );

  for (const ev of dueEvents) {
    let actions: Array<{
      type?: string; notify_target?: string; notify_title?: string;
      notify_body?: string; flag_key?: string; flag_value?: string;
    }> = [];
    try { actions = JSON.parse(ev.actions_json); } catch { /* noop */ }

    for (const action of actions) {
      if (action.type === "notify" && action.notify_title && action.notify_body) {
        const targetUsers = await resolveNotifyTarget(db, action.notify_target ?? "all");
        for (const u of targetUsers) {
          await execute(db,
            `INSERT INTO notifications (id, user_id, type, title, body)
             VALUES (?, ?, 'system', ?, ?)`,
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
      `UPDATE event_schedule SET status = 'published', fired_at = datetime('now') WHERE id = ?`,
      [ev.id]
    );
    results.eventSchedule++;
  }

  return NextResponse.json({
    ok: true,
    publishQueue: results.publishQueue,
    eventSchedule: results.eventSchedule,
    total: results.publishQueue + results.eventSchedule,
  });
});
