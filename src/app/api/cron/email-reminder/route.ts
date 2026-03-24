/**
 * GET /api/cron/email-reminder
 *
 * Vercel Cron から毎週月曜 09:00 UTC に呼び出される。
 * 7日以上ログインしていない active プレイヤーに機関からの通知を送る。
 * vercel.json: { "path": "/api/cron/email-reminder", "schedule": "0 9 * * 1" }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { getDb, queryAll, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  // Vercel Cron 認証
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw Errors.unauthorized("Unauthorized");
  }

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const inactiveUsers = await queryAll<{ id: string; username: string }>(db,
    `SELECT id, username FROM users
     WHERE last_login_at < datetime('now', '-7 days')
       AND status = 'active'
       AND role = 'player'
     LIMIT 100`
  );

  let notified = 0;
  for (const user of inactiveUsers) {
    await execute(db,
      `INSERT OR IGNORE INTO notifications (id, user_id, type, title, body)
       VALUES (?, ?, 'system', '機関からの連絡', 'あなたの不在中も海蝕活動は続いています。戻ってきてください。')`,
      [randomUUID(), user.id]
    );
    notified++;
  }

  return NextResponse.json({ ok: true, notified });
});
