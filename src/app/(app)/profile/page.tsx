import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDb, queryOne, queryAll } from "@/lib/db";
import { DIVISIONS, LEVEL_THRESHOLDS } from "@/lib/constants";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "エージェントプロフィール — 海蝕機関" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const h      = await headers();
  const userId = h.get("x-user-id") ?? "";
  const level  = Number(h.get("x-user-level") ?? 0);

  const db = getDb();

  // ── エージェント基本情報 ───────────────────────────────────────
  const row = await queryOne<{
    id: string; agent_id: string; username: string; display_name: string | null;
    division_id: string | null; clearance_level: number; xp_total: number;
    consecutive_login_days: number; anomaly_score: number; observer_load: number;
    login_count: number; created_at: string; secret_question: string | null;
  }>(db,
    `SELECT id, agent_id, username, display_name, division_id, clearance_level,
            xp_total, consecutive_login_days, anomaly_score, observer_load,
            login_count, created_at, secret_question
     FROM users WHERE id = ?`,
    [userId]
  );
  if (!row) return null;

  const division     = DIVISIONS.find(d => d.id === row.division_id) ?? null;
  const xp           = Number(row.xp_total);
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? null;
  const curThreshold  = LEVEL_THRESHOLDS[level] ?? 0;
  const xpPct = nextThreshold
    ? Math.min(((xp - curThreshold) / (nextThreshold - curThreshold)) * 100, 100)
    : 100;

  // ── 統計データ（サーバー側で一括取得） ────────────────────────
  const xpLogs = await queryAll<{ activity: string; xp_gained: number; created_at: string }>(
    db,
    `SELECT activity, xp_gained, created_at FROM xp_logs
     WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
    [userId]
  );
  const xpByActivity: Record<string, number> = {};
  for (const log of xpLogs) {
    xpByActivity[log.activity] = (xpByActivity[log.activity] ?? 0) + log.xp_gained;
  }

  let globalStats: {
    totalUsers: number; activeUsers: number;
    divisionCounts: Array<{ division_id: string; cnt: number }>;
    levelCounts: Array<{ clearance_level: number; cnt: number }>;
    missionStats: { active: number; completed: number; total: number };
  } | null = null;

  if (level >= 2) {
    const [totalRow, activeRow, divRows, levelRows, missionRows] = await Promise.all([
      queryOne<{ cnt: number }>(db, "SELECT COUNT(*) AS cnt FROM users WHERE role = 'player'"),
      queryOne<{ cnt: number }>(db,
        `SELECT COUNT(*) AS cnt FROM users WHERE role = 'player'
         AND status = 'active' AND last_login_at > datetime('now', '-7 days')`),
      queryAll<{ division_id: string; cnt: number }>(db,
        `SELECT division_id, COUNT(*) AS cnt FROM users
         WHERE role = 'player' AND division_id IS NOT NULL GROUP BY division_id`),
      queryAll<{ clearance_level: number; cnt: number }>(db,
        `SELECT clearance_level, COUNT(*) AS cnt FROM users
         WHERE role = 'player' GROUP BY clearance_level ORDER BY clearance_level`),
      queryOne<{ active: number; completed: number; total: number }>(db,
        `SELECT SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
                COUNT(*) AS total FROM missions`),
    ]);
    globalStats = {
      totalUsers:     Number(totalRow?.cnt ?? 0),
      activeUsers:    Number(activeRow?.cnt ?? 0),
      divisionCounts: divRows,
      levelCounts:    levelRows,
      missionStats:   {
        active:    Number(missionRows?.active    ?? 0),
        completed: Number(missionRows?.completed ?? 0),
        total:     Number(missionRows?.total     ?? 0),
      },
    };
  }

  const { tab } = await searchParams;
  const VALID_TABS = ["overview", "history", "discovered", "stats", "transfer"] as const;
  type ProfileTab = typeof VALID_TABS[number];
  const initialTab: ProfileTab = VALID_TABS.includes(tab as ProfileTab)
    ? (tab as ProfileTab)
    : "overview";

  return (
    <ProfileClient
      initialTab={initialTab}
      agentId={row.agent_id}
      username={row.username}
      displayName={row.display_name}
      divisionId={row.division_id}
      division={division}
      level={level}
      xp={xp}
      xpPct={xpPct}
      nextThreshold={nextThreshold}
      streak={Number(row.consecutive_login_days)}
      loginCount={Number(row.login_count)}
      anomalyScore={Number(row.anomaly_score)}
      observerLoad={Number(row.observer_load)}
      secretQuestion={row.secret_question}
      createdAt={row.created_at}
      xpByActivity={xpByActivity}
      globalStats={globalStats}
    />
  );
}
