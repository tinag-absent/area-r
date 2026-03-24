/**
 * GET /api/cron/cleanup
 *
 * Vercel Cron から毎日 04:00 JST (19:00 UTC) に実行。
 * 期限切れレコードを削除してDBの肥大化を防ぐ。
 *
 * 削除対象:
 *   - rate_limit_attempts: expires_at が現在時刻より過去のレコード
 *   - rate_limit_attempts: (fallback) attempted_at が 7日以上前のレコード（expires_at未設定の旧データ）
 *   - access_logs: 30日以上前のレコード
 *   - email_verifications: expires_at が過去のレコード（使用済み/期限切れOTP）
 *
 * vercel.json: { "path": "/api/cron/cleanup", "schedule": "0 19 * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler }          from "@/lib/api-error";
import { getDb, execute, queryOne }  from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  // Vercel Cron の認証ヘッダーを確認
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db  = getDb();
  const now = new Date().toISOString();
  const results: Record<string, number> = {};

  // ── rate_limit_attempts: TTL期限切れを削除 ────────────────────────
  await execute(db,
    `DELETE FROM rate_limit_attempts WHERE expires_at <= datetime('now')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.rate_limit_ttl = row?.changes ?? 0;
  }

  // ── rate_limit_attempts: fallback — expires_at 未設定の旧データ（7日超） ──
  await execute(db,
    `DELETE FROM rate_limit_attempts
     WHERE expires_at IS NULL AND attempted_at < datetime('now', '-7 days')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.rate_limit_old = row?.changes ?? 0;
  }

  // ── access_logs: 30日以上前のレコードを削除 ──────────────────────
  await execute(db,
    `DELETE FROM access_logs WHERE created_at < datetime('now', '-30 days')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.access_logs = row?.changes ?? 0;
  }

  // ── email_verifications: 期限切れOTPを削除 ────────────────────────
  await execute(db,
    `DELETE FROM email_verifications WHERE expires_at <= datetime('now')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.email_verifications = row?.changes ?? 0;
  }

  // ── notifications: 既読 + 90日以上前のレコードを削除 ─────────────
  await execute(db,
    `DELETE FROM notifications
     WHERE is_read = 1 AND created_at < datetime('now', '-90 days')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.notifications_old = row?.changes ?? 0;
  }

  // ── notifications: expires_at が設定されており期限切れのもの ───────
  await execute(db,
    `DELETE FROM notifications
     WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.notifications_expired = row?.changes ?? 0;
  }

  // ── xp_logs: 1年以上前のレコードを削除（古い集計は users.xp_total に集約済み） ──
  await execute(db,
    `DELETE FROM xp_logs WHERE created_at < datetime('now', '-365 days')`
  );
  {
    const row = await queryOne<{ changes: number }>(db, `SELECT changes() AS changes`);
    results.xp_logs_old = row?.changes ?? 0;
  }

  const total = Object.values(results).reduce((s, n) => s + n, 0);

  console.log(`[cron/cleanup] ${now} — deleted ${total} rows:`, results);

  return NextResponse.json({
    ok:      true,
    deleted: total,
    detail:  results,
    ran_at:  now,
  });
});
