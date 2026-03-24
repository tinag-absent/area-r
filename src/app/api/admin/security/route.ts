/**
 * GET /api/admin/security
 *
 * セキュリティ監視データを返す:
 * - レートリミット上位 (直近1時間・24時間)
 * - アクセスログ直近50件
 * - 異常スコア上位ユーザー
 * - 失敗ログイン上位IP
 *
 * DELETE /api/admin/security?type=rate_limits — レートリミット履歴を削除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler }          from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute }  from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();

  const [rateLimits1h, rateLimits24h, accessLogs, anomalyUsers, failedLogins] = await Promise.all([
    // レートリミット TOP 20（1h）
    queryAll<{ key_type: string; key_value: string; attempts: number; last_at: string }>(db,
      `SELECT key_type, key_value, COUNT(*) AS attempts, MAX(attempted_at) AS last_at
       FROM rate_limit_attempts
       WHERE attempted_at > datetime('now','-1 hour')
       GROUP BY key_type, key_value
       ORDER BY attempts DESC LIMIT 20`
    ),
    // レートリミット TOP 20（24h）
    queryAll<{ key_type: string; key_value: string; attempts: number; last_at: string }>(db,
      `SELECT key_type, key_value, COUNT(*) AS attempts, MAX(attempted_at) AS last_at
       FROM rate_limit_attempts
       WHERE attempted_at > datetime('now','-24 hours') AND success = 0
       GROUP BY key_type, key_value
       ORDER BY attempts DESC LIMIT 20`
    ),
    // アクセスログ直近50件
    queryAll<{ id: string; method: string; path: string; status_code: number | null; created_at: string; agent_id: string | null }>(db,
      `SELECT al.id, al.method, al.path, al.status_code, al.created_at,
              u.agent_id
       FROM access_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC LIMIT 50`
    ),
    // 異常スコア上位10
    queryAll<{ agent_id: string; anomaly_score: number; observer_load: number; status: string }>(db,
      `SELECT agent_id, anomaly_score, observer_load, status
       FROM users WHERE deleted_at IS NULL AND anomaly_score > 5
       ORDER BY anomaly_score DESC LIMIT 10`
    ),
    // ログイン失敗 上位IP（24h）
    queryAll<{ key_value: string; fails: number }>(db,
      `SELECT key_value, COUNT(*) AS fails
       FROM rate_limit_attempts
       WHERE key_type = 'ip_login' AND success = 0
         AND attempted_at > datetime('now','-24 hours')
       GROUP BY key_value
       ORDER BY fails DESC LIMIT 10`
    ),
  ]);

  return NextResponse.json({ rateLimits1h, rateLimits24h, accessLogs, anomalyUsers, failedLogins });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const db = getDb();
  if (type === "rate_limits") {
    // expires_at 期限切れ + fallback（旧データ 7日超）をまとめて削除
    await execute(db, `DELETE FROM rate_limit_attempts WHERE expires_at <= datetime('now')`);
    await execute(db, `DELETE FROM rate_limit_attempts WHERE expires_at IS NULL AND attempted_at < datetime('now','-7 days')`);
    return NextResponse.json({ ok: true, action: "cleared_old_rate_limits" });
  }
  if (type === "access_logs") {
    await execute(db, `DELETE FROM access_logs WHERE created_at < datetime('now','-30 days')`);
    return NextResponse.json({ ok: true, action: "cleared_old_access_logs" });
  }

  return NextResponse.json({ ok: false, error: "type が不正です" }, { status: 400 });
});
