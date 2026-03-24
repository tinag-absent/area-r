/**
 * GET /api/admin/analytics
 * 管理者向け集計統計。7つのクエリを並列実行して返す。
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, queryAll } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();

  const [
    userStats,
    dailyLogins,
    xpByActivity,
    chatByChannel,
    missionStats,
    levelDist,
    recentUsers,
  ] = await Promise.all([
    // 1. ユーザー全体サマリ
    queryOne<{
      total: number; active: number; suspended: number; banned: number;
      avg_xp: number; avg_level: number;
    }>(db, `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='active'    THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status='suspended' THEN 1 ELSE 0 END) AS suspended,
        SUM(CASE WHEN status='banned'    THEN 1 ELSE 0 END) AS banned,
        ROUND(AVG(COALESCE(xp_total,0)), 1) AS avg_xp,
        ROUND(AVG(clearance_level), 2)      AS avg_level
      FROM users WHERE role = 'player'`),

    // 2. 直近7日の日別ログイン数
    queryAll<{ day: string; cnt: number }>(db, `
      SELECT strftime('%Y-%m-%d', last_login_at) AS day, COUNT(*) AS cnt
      FROM users
      WHERE last_login_at > datetime('now', '-7 days') AND role = 'player'
      GROUP BY day ORDER BY day`),

    // 3. アクティビティ別XP付与合計（直近30日）
    queryAll<{ activity: string; total_xp: number; cnt: number }>(db, `
      SELECT activity, SUM(xp_gained) AS total_xp, COUNT(*) AS cnt
      FROM xp_logs
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY activity ORDER BY total_xp DESC`),

    // 4. チャンネル別メッセージ数（直近7日）
    queryAll<{ chat_id: string; cnt: number }>(db, `
      SELECT chat_id, COUNT(*) AS cnt FROM chat_messages
      WHERE created_at > datetime('now', '-7 days') AND type = 'user'
      GROUP BY chat_id ORDER BY cnt DESC`),

    // 5. ミッション統計
    queryOne<{ total: number; active: number; monitoring: number; completed: number }>(db, `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='active'     THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status='monitoring' THEN 1 ELSE 0 END) AS monitoring,
        SUM(CASE WHEN status='completed'  THEN 1 ELSE 0 END) AS completed
      FROM missions`),

    // 6. クリアランスレベル分布
    queryAll<{ level: number; cnt: number }>(db, `
      SELECT clearance_level AS level, COUNT(*) AS cnt
      FROM users WHERE role = 'player'
      GROUP BY clearance_level ORDER BY clearance_level`),

    // 7. 直近登録10人
    queryAll<{ id: string; agent_id: string; username: string; created_at: string; clearance_level: number }>(db, `
      SELECT id, agent_id, username, created_at, clearance_level
      FROM users WHERE role = 'player'
      ORDER BY created_at DESC LIMIT 10`),
  ]);

  return NextResponse.json({
    userStats,
    dailyLogins,
    xpByActivity,
    chatByChannel,
    missionStats,
    levelDist,
    recentUsers,
    generatedAt: new Date().toISOString(),
  });
});
