/**
 * admin/page.tsx — 管理者ダッシュボード
 * Updated: 2026-03-19 03:55 JST — NavIcon を import し QuickAction のアイコン表示を <span> から <NavIcon> に変更
 */
import type { Metadata } from "next";
export const metadata: Metadata = { title: "管理者ダッシュボード — 海蝕機関" };
export const revalidate = 30;

import { getDb, queryOne, queryAll } from "@/lib/db";
import Link from "next/link";
import { NavIcon } from "@/components/ui/Icon";

// ── データ取得 ───────────────────────────────────────────────────────
async function fetchDashboard() {
  const db = getDb();
  const [
    totals, activity, pendingMissions,
    recentUsers, recentNotifs, scheduledQueue,
    levelDist, chatActivity,
  ] = await Promise.all([
    // 主要カウント
    queryOne<{
      users: number; active_users: number; msgs: number; notifs: number;
      missions: number; pending_parts: number; puzzles: number; events: number;
    }>(db, `SELECT
      (SELECT COUNT(*) FROM users WHERE role='player')                        AS users,
      (SELECT COUNT(*) FROM users WHERE role='player'
         AND last_login_at > datetime('now','-7 days'))                       AS active_users,
      (SELECT COUNT(*) FROM chat_messages)                                    AS msgs,
      (SELECT COUNT(*) FROM notifications WHERE is_read=0)                   AS notifs,
      (SELECT COUNT(*) FROM missions WHERE status='active')                  AS missions,
      (SELECT COUNT(*) FROM mission_participants WHERE status='pending')      AS pending_parts,
      (SELECT COUNT(*) FROM puzzle_entries WHERE is_active=1)                AS puzzles,
      (SELECT COUNT(*) FROM event_schedule WHERE status='scheduled')         AS events
    `),

    // 直近24h XP付与
    queryOne<{ xp: number; cnt: number }>(db,
      `SELECT COALESCE(SUM(xp_gained),0) AS xp, COUNT(*) AS cnt FROM xp_logs
       WHERE created_at > datetime('now','-1 day')`
    ),

    // 承認待ちミッション
    queryAll<{ id: string; mission_id: string; user_id: string; applied_at: string }>(db,
      `SELECT id, mission_id, user_id, applied_at FROM mission_participants
       WHERE status='pending' ORDER BY applied_at ASC LIMIT 5`
    ),

    // 直近登録
    queryAll<{
      agent_id: string; username: string; clearance_level: number; created_at: string;
    }>(db,
      `SELECT agent_id, username, clearance_level, created_at FROM users
       WHERE role='player' ORDER BY created_at DESC LIMIT 6`
    ),

    // 未読通知上位
    queryAll<{ title: string; type: string; cnt: number }>(db,
      `SELECT title, type, COUNT(*) AS cnt FROM notifications
       WHERE is_read=0 AND created_at > datetime('now','-3 days')
       GROUP BY title, type ORDER BY cnt DESC LIMIT 5`
    ),

    // 公開スケジュール予定
    queryAll<{ title: string; publish_at: string; content_type: string }>(db,
      `SELECT title, publish_at, content_type FROM publish_queue
       WHERE status='scheduled' ORDER BY publish_at ASC LIMIT 4`
    ),

    // LV分布
    queryAll<{ level: number; cnt: number }>(db,
      `SELECT clearance_level AS level, COUNT(*) AS cnt FROM users
       WHERE role='player' GROUP BY clearance_level ORDER BY clearance_level`
    ),

    // チャンネル別メッセージ（24h）
    queryAll<{ chat_id: string; cnt: number }>(db,
      `SELECT chat_id, COUNT(*) AS cnt FROM chat_messages
       WHERE created_at > datetime('now','-1 day') AND type='user'
       GROUP BY chat_id ORDER BY cnt DESC LIMIT 5`
    ),
  ]);

  return {
    totals, activity, pendingMissions,
    recentUsers, recentNotifs, scheduledQueue,
    levelDist, chatActivity,
  };
}

// ── 共通スタイル ──────────────────────────────────────────────────────
const S = {
  card:    { background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)", borderRadius: 2, padding: "14px 16px" },
  label:   { fontSize: 10, fontFamily: "var(--font-mono)" as const, color: "rgba(255,180,60,0.7)", letterSpacing: "0.12em" },
  mono:    { fontFamily: "var(--font-mono)" as const },
  divider: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
} as const;

function StatCard({ label, value, sub, color, href }: {
  label: string; value: string | number; sub?: string; color: string; href?: string;
}) {
  const inner = (
    <div style={{ ...S.card, position: "relative", overflow: "hidden" }}>
      <div style={{ ...S.label, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", color, ...S.mono, lineHeight: 1 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontSize: 10, marginTop: 5, color: "rgba(255,255,255,0.3)", ...S.mono }}>{sub}</div>}
      {href && (
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.15 }}>→</div>
      )}
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return <>{inner}</>;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...S.label, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,180,60,0.08)" }}>
      {children}
    </div>
  );
}

function QuickAction({ href, icon, label, desc }: { href: string; icon: string; label: string; desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        ...S.card,
        display: "flex", alignItems: "flex-start", gap: 10,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,180,60,0.3)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,180,60,0.1)"}
      >
        <NavIcon icon={icon} size={18} color="rgba(255,180,60,0.85)" />
        <div>
          <div style={{ fontSize: 12, fontWeight: "bold", color: "var(--color-foreground)", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{desc}</div>
        </div>
      </div>
    </Link>
  );
}

// ── ページ ────────────────────────────────────────────────────────────
export default async function AdminPage() {
  const {
    totals, activity, pendingMissions,
    recentUsers, recentNotifs, scheduledQueue,
    levelDist, chatActivity,
  } = await fetchDashboard();

  const t = totals;
  const maxLvCnt = Math.max(...levelDist.map(r => Number(r.cnt)), 1);

  function fmtDate(raw: string) {
    return new Date(raw.replace(" ", "T") + "Z")
      .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ padding: "24px 24px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── ページタイトル ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.label, marginBottom: 4 }}>ADMIN CONSOLE — OVERVIEW</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: "bold", color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          管理者ダッシュボード
        </h1>
      </div>

      {/* ── KPI カード 上段 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
        <StatCard label="登録機関員"    value={t?.users        ?? 0} sub={`週間アクティブ ${t?.active_users ?? 0} 名`} color="#00c8ff" href="/admin/users" />
        <StatCard label="対応中ミッション" value={t?.missions     ?? 0} sub={`承認待ち ${t?.pending_parts ?? 0} 件`} color="#ff6b6b" href="/admin/missions" />
        <StatCard label="未読通知（全体）" value={t?.notifs        ?? 0} sub="直近3日以内" color="#ffb43c" href="/admin/announcements" />
        <StatCard label="24h XP付与"    value={`${(Number(activity?.xp ?? 0) / 1000).toFixed(1)}k`} sub={`${activity?.cnt ?? 0}件のアクティビティ`} color="#50dc78" />
      </div>

      {/* KPI カード 下段 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        <StatCard label="アクティブパズル" value={t?.puzzles ?? 0} color="#a064ff" href="/admin/puzzles" />
        <StatCard label="予約イベント"      value={t?.events  ?? 0} color="#ffb43c" href="/admin/event-schedule" />
        <StatCard label="チャット総数"       value={t?.msgs    ?? 0} color="#00c8ff" href="/admin/chat-viewer" />
        <StatCard label="公開スケジュール"   value={scheduledQueue.length} sub="直近4件" color="#50dc78" href="/admin/publish-queue" />
      </div>

      {/* ── メイングリッド ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 14 }}>

        {/* 左列: クイックアクション + LV分布 + チャット */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* クイックアクション */}
          <div style={S.card}>
            <SectionHeader>QUICK ACTIONS</SectionHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <QuickAction href="/admin/dm"            icon="dashboard" label="NPC DM送信"      desc="特定ユーザーにNPCとしてDMを送る" />
              <QuickAction href="/admin/announcements" icon="notify" label="全員通知"          desc="全機関員に一斉通知を送信" />
              <QuickAction href="/admin/xp"            icon="mission" label="XP付与"            desc="個人・部門・全員にXPを付与" />
              <QuickAction href="/admin/achievements"  icon="entity" label="実績付与"          desc="プレイヤーに実績を手動付与" />
              <QuickAction href="/admin/publish-queue" icon="◷" label="コンテンツ公開"    desc="予約済みコンテンツを即時公開" />
              <QuickAction href="/admin/event-schedule"icon="hex" label="イベント発火"      desc="ARGイベントをスケジュール登録" />
              <QuickAction href="/admin/npc-engine"    icon="mission" label="NPCルール追加"     desc="デプロイなしでNPC返答を更新" />
              <QuickAction href="/admin/security"      icon="hex" label="セキュリティ確認" desc="レートリミット・異常スコア監視" />
            </div>
          </div>

          {/* クリアランスLV分布 */}
          <div style={S.card}>
            <SectionHeader>クリアランス LV 分布</SectionHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[0,1,2,3,4,5].map(lv => {
                const cnt = Number(levelDist.find(r => Number(r.level) === lv)?.cnt ?? 0);
                const pct = Math.round(cnt / maxLvCnt * 100);
                const col = lv >= 5 ? "#ff6b6b" : lv >= 3 ? "#ffb43c" : lv >= 1 ? "#00c8ff" : "rgba(255,255,255,0.25)";
                return (
                  <div key={lv} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, width: 28, flexShrink: 0, color: col, ...S.mono }}>LV{lv}</span>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 3, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 10, width: 28, textAlign: "right", color: "rgba(255,255,255,0.4)", ...S.mono }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* チャット活動（24h） */}
          <div style={S.card}>
            <SectionHeader>チャンネル活動（24h）</SectionHeader>
            {chatActivity.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>データなし</div>
            ) : chatActivity.map(r => (
              <div key={r.chat_id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", ...S.divider }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", ...S.mono }}>{r.chat_id}</span>
                <span style={{ fontSize: 11, color: "#00c8ff", ...S.mono }}>{Number(r.cnt)}件</span>
              </div>
            ))}
          </div>
        </div>

        {/* 中列: 承認待ち + 直近登録 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 承認待ちミッション */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={S.label}>承認待ちミッション申請</div>
              {pendingMissions.length > 0 && (
                <Link href="/admin/missions" style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 2, textDecoration: "none",
                  background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)",
                  color: "#ff6b6b", ...S.mono,
                }}>
                  全て見る
                </Link>
              )}
            </div>
            {pendingMissions.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", padding: "8px 0" }}>
                承認待ちの申請はありません
              </div>
            ) : pendingMissions.map(p => (
              <div key={p.id} style={{ padding: "7px 0", ...S.divider }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", ...S.mono }}>
                    {p.mission_id.slice(0, 20)}
                  </span>
                  <span style={{ fontSize: 9, color: "rgba(255,180,60,0.7)" }}>
                    {fmtDate(p.applied_at)}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", ...S.mono }}>
                  {p.user_id.slice(0, 16)}…
                </div>
              </div>
            ))}
          </div>

          {/* 直近登録機関員 */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={S.label}>直近登録機関員</div>
              <Link href="/admin/users" style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 2, textDecoration: "none",
                background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.2)",
                color: "#00c8ff", ...S.mono,
              }}>全て</Link>
            </div>
            {recentUsers.map(u => (
              <div key={u.agent_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", ...S.divider }}>
                <span style={{ fontSize: 11, color: "#00c8ff", width: 90, flexShrink: 0, ...S.mono }}>{u.agent_id}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</span>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 2, background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.2)", color: "#ffb43c", ...S.mono, flexShrink: 0 }}>
                  LV{u.clearance_level}
                </span>
              </div>
            ))}
          </div>

          {/* 未読通知ランキング */}
          <div style={S.card}>
            <SectionHeader>未読通知（直近3日・多い順）</SectionHeader>
            {recentNotifs.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>未読通知なし</div>
            ) : recentNotifs.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", ...S.divider }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 2, background: "rgba(255,180,60,0.08)", border: "1px solid rgba(255,180,60,0.18)", color: "#ffb43c", ...S.mono, flexShrink: 0 }}>
                  {n.type}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
                <span style={{ fontSize: 11, color: "#ff6b6b", ...S.mono, flexShrink: 0 }}>{Number(n.cnt)}人</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右列: 公開スケジュール + 全管理画面リンク */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 公開スケジュール直近 */}
          <div style={S.card}>
            <SectionHeader>公開スケジュール（直近）</SectionHeader>
            {scheduledQueue.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>予定なし</div>
            ) : scheduledQueue.map((q, i) => (
              <div key={i} style={{ padding: "6px 0", ...S.divider }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: "rgba(255,180,60,0.6)", ...S.mono }}>{q.content_type}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", ...S.mono }}>{fmtDate(q.publish_at)}</span>
                </div>
              </div>
            ))}
            <Link href="/admin/publish-queue" style={{
              display: "block", marginTop: 10, padding: "5px 0",
              fontSize: 10, textAlign: "center", textDecoration: "none",
              color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
              スケジュール管理 →
            </Link>
          </div>

          {/* 全管理画面リンク集 */}
          <div style={S.card}>
            <SectionHeader>全管理画面</SectionHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { href: "/admin/analytics",     label: "分析",             icon: "analytics" },
                { href: "/admin/security",      label: "セキュリティ",     icon: "security" },
                { href: "/admin/users",         label: "ユーザー管理",     icon: "profile" },
                { href: "/admin/xp",            label: "XP管理",           icon: "xp" },
                { href: "/admin/achievements",  label: "実績管理",         icon: "star" },
                { href: "/admin/skill-tree",    label: "スキルツリー",     icon: "skill" },
                { href: "/admin/story-engine",  label: "ストーリー",       icon: "story" },
                { href: "/admin/divisions",     label: "部門管理",         icon: "hex" },
                { href: "/admin/missions",      label: "ミッション",       icon: "mission" },
                { href: "/admin/dm",            label: "DM送信",           icon: "npc" },
                { href: "/admin/announcements", label: "通知送信",         icon: "notify" },
                { href: "/admin/bulletin",      label: "掲示板管理",       icon: "bulletin" },
                { href: "/admin/chat-viewer",   label: "チャットログ",     icon: "chat" },
                { href: "/admin/content",        label: "コンテンツ編集",   icon: "novel" },
                { href: "/admin/audio",          label: "音声記録",         icon: "cipher" },
                { href: "/admin/world-data",     label: "世界観データ",     icon: "database" },
                { href: "/admin/sigma-messages", label: "SIGMAメッセージ",  icon: "entity" },
                { href: "/admin/publish-queue", label: "公開スケジュール", icon: "event" },
                { href: "/admin/event-schedule",label: "イベント",         icon: "event" },
                { href: "/admin/puzzles",       label: "謎コンテンツ",     icon: "cipher" },
                { href: "/admin/npc-engine",    label: "NPCエンジン",      icon: "npc" },
                { href: "/admin/npc-scripts",   label: "NPCスクリプト",    icon: "console" },
                { href: "/admin/rule-engine",   label: "ルールエンジン",   icon: "rule" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 6px", borderRadius: 2, textDecoration: "none",
                  fontSize: 11, color: "rgba(255,255,255,0.35)",
                  transition: "background 0.1s, color 0.1s",
                  fontFamily: "var(--font-mono)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,180,60,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,220,140,0.9)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
                }}>
                  <NavIcon icon={l.icon} size={12} />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
