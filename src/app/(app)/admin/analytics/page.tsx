import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { DIVISIONS } from "@/lib/constants";

export const metadata: Metadata = { title: "分析 — 管理者 — 海蝕機関" };
export const revalidate = 30;

async function fetchAnalytics() {
  // Server Componentなのでヘッダー付きfetchではなくDB直読み
  const { getDb, queryOne, queryAll } = await import("@/lib/db");
  const db = getDb();
  const [userStats, xpByActivity, chatByChannel, missionStats, levelDist, recentUsers] = await Promise.all([
    queryOne<{ total: number; active: number; suspended: number; avg_xp: number; avg_level: number }>(
      db, `SELECT COUNT(*) AS total,
        SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status='suspended' THEN 1 ELSE 0 END) AS suspended,
        ROUND(AVG(COALESCE(xp_total,0)),1) AS avg_xp,
        ROUND(AVG(clearance_level),2) AS avg_level
      FROM users WHERE role='player'`),
    queryAll<{ activity: string; total_xp: number; cnt: number }>(
      db, `SELECT activity, SUM(xp_gained) AS total_xp, COUNT(*) AS cnt
        FROM xp_logs WHERE created_at > datetime('now','-30 days')
        GROUP BY activity ORDER BY total_xp DESC`),
    queryAll<{ chat_id: string; cnt: number }>(
      db, `SELECT chat_id, COUNT(*) AS cnt FROM chat_messages
        WHERE created_at > datetime('now','-7 days') AND type='user'
        GROUP BY chat_id ORDER BY cnt DESC`),
    queryOne<{ total: number; active: number; completed: number }>(
      db, `SELECT COUNT(*) AS total,
        SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed
        FROM missions`),
    queryAll<{ level: number; cnt: number }>(
      db, `SELECT clearance_level AS level, COUNT(*) AS cnt
        FROM users WHERE role='player' GROUP BY clearance_level ORDER BY clearance_level`),
    queryAll<{ agent_id: string; username: string; created_at: string; clearance_level: number }>(
      db, `SELECT agent_id, username, created_at, clearance_level
        FROM users WHERE role='player' ORDER BY created_at DESC LIMIT 8`),
  ]);
  const dau = await queryOne<{dau:number;wau:number;mau:number}>(db,
    `SELECT
      SUM(CASE WHEN last_login_at > datetime('now','-1 day')  THEN 1 ELSE 0 END) AS dau,
      SUM(CASE WHEN last_login_at > datetime('now','-7 days') THEN 1 ELSE 0 END) AS wau,
      SUM(CASE WHEN last_login_at > datetime('now','-30 days')THEN 1 ELSE 0 END) AS mau
    FROM users WHERE role='player'`);
  return { userStats, xpByActivity, chatByChannel, missionStats, levelDist, recentUsers, dau };
}

const ACTIVITY_LABEL: Record<string, string> = {
  first_login: "初回ログイン", daily_login: "ログイン", send_chat_message: "チャット",
  complete_mission: "ミッション完了", discover_keyword: "KW発見", admin_adjust: "管理調整",
  division_transfer: "部門移動",
};

export default async function AnalyticsPage() {
  const { userStats, xpByActivity, chatByChannel, missionStats, levelDist, recentUsers, dau } = await fetchAnalytics();

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — ANALYTICS" title="分析ダッシュボード" eyebrowColor="warning" />

      {/* DAU / WAU / MAU */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "DAU（24h）",  value: dau?.dau ?? 0, color: "var(--color-success)" },
          { label: "WAU（7日）",  value: dau?.wau ?? 0, color: "var(--color-primary)" },
          { label: "MAU（30日）", value: dau?.mau ?? 0, color: "var(--color-warning)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 text-center rounded-sm"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
            <div className="text-[22px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
            <div className="hud-label mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ユーザー全体 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "総機関員",    value: userStats?.total     ?? 0, color: "var(--color-primary)" },
          { label: "アクティブ",  value: userStats?.active    ?? 0, color: "var(--color-success)" },
          { label: "停止中",      value: userStats?.suspended ?? 0, color: "var(--color-warning)" },
          { label: "平均LV",      value: Number(userStats?.avg_level ?? 0).toFixed(2), color: "var(--color-fg-dim)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 text-center rounded-sm"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
            <div className="text-[22px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
            <div className="hud-label mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* XP by activity */}
        <div className="rounded-sm p-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
          <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>XP付与（直近30日）</div>
          {xpByActivity.length === 0
            ? <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>データなし</div>
            : xpByActivity.map(r => (
              <div key={r.activity} className="flex justify-between items-center py-1.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>
                  {ACTIVITY_LABEL[r.activity] ?? r.activity}
                </span>
                <div className="text-right">
                  <span className="text-[12px] font-bold" style={{ color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                    +{Number(r.total_xp).toLocaleString()} XP
                  </span>
                  <span className="ml-2 hud-label" style={{ color: "var(--color-fg-muted)" }}>
                    {r.cnt}回
                  </span>
                </div>
              </div>
            ))
          }
        </div>

        {/* Chat by channel */}
        <div className="rounded-sm p-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
          <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>チャット（直近7日）</div>
          {chatByChannel.length === 0
            ? <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>データなし</div>
            : chatByChannel.map(r => (
              <div key={r.chat_id} className="flex justify-between items-center py-1.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>{r.chat_id}</span>
                <span className="text-[12px] font-bold" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                  {Number(r.cnt).toLocaleString()}件
                </span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* Mission stats */}
        <div className="rounded-sm p-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
          <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>ミッション統計</div>
          {[
            { label: "総数",    value: missionStats?.total     ?? 0, color: "var(--color-primary)" },
            { label: "対応中",  value: missionStats?.active    ?? 0, color: "var(--color-danger)" },
            { label: "収束済み",value: missionStats?.completed ?? 0, color: "var(--color-success)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>{label}</span>
              <span className="text-[13px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Level distribution */}
        <div className="rounded-sm p-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
          <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>LV分布</div>
          <div className="flex gap-2">
            {[0,1,2,3,4,5].map(lv => {
              const cnt = Number(levelDist.find(r => Number(r.level) === lv)?.cnt ?? 0);
              const col = lv >= 5 ? "var(--color-danger)" : lv >= 3 ? "var(--color-warning)" : "var(--color-primary)";
              return (
                <div key={lv} className="flex-1 text-center p-2 rounded-sm"
                  style={{ background: `${col}0f`, border: `1px solid ${col}33` }}>
                  <div className="text-[16px] font-bold" style={{ color: col, fontFamily: "var(--font-mono)" }}>{cnt}</div>
                  <div className="hud-label" style={{ color: col }}>LV{lv}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 直近登録 */}
      <div className="rounded-sm p-4"
        style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
        <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>直近登録機関員</div>
        <div className="flex flex-col gap-1">
          {recentUsers.map(u => (
            <div key={u.agent_id} className="flex items-center gap-3 py-1.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="hud-label w-24 shrink-0" style={{ color: "var(--color-primary)" }}>{u.agent_id}</span>
              <span className="text-[12px] flex-1" style={{ color: "var(--color-foreground)" }}>{u.username}</span>
              <span className="hud-label" style={{ color: "var(--color-warning)" }}>LV{u.clearance_level}</span>
              <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                {u.created_at.slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
