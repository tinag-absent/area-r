import { AdminNavGrouped, AdminNavTabLink } from "@/components/admin/AdminNavLink";
import type { AdminNavGroup, AdminNavItem } from "@/components/admin/AdminNavLink";
import { Icon } from "@/components/ui/Icon";

// ── ナビグループ定義 ──────────────────────────────────────────────────
const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin",           label: "ダッシュボード", icon: "dashboard" },
      { href: "/admin/analytics", label: "分析",           icon: "analytics" },
      { href: "/admin/security",  label: "セキュリティ",   icon: "security" },
    ],
  },
  {
    label: "Players",
    items: [
      { href: "/admin/users",         label: "ユーザー管理",  icon: "profile" },
      { href: "/admin/xp",            label: "XP管理",        icon: "xp" },
      { href: "/admin/achievements",  label: "実績管理",      icon: "star" },
      { href: "/admin/skill-tree",    label: "スキルツリー",  icon: "skill" },
      { href: "/admin/story-engine",  label: "ストーリー",    icon: "story" },
      { href: "/admin/divisions",     label: "部門管理",      icon: "hex" },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/dm",            label: "DM送信",        icon: "npc" },
      { href: "/admin/announcements", label: "通知送信",      icon: "notify" },
      { href: "/admin/bulletin",      label: "掲示板管理",    icon: "bulletin" },
      { href: "/admin/chat-viewer",   label: "チャットログ",  icon: "chat" },
    ],
  },
  {
    label: "World Data",
    items: [
      { href: "/admin/db-entities",   label: "実体カタログ",     icon: "entity" },
      { href: "/admin/db-facilities", label: "施設DB",           icon: "hex" },
      { href: "/admin/db-equipment",  label: "装備DB",           icon: "database" },
      { href: "/admin/db-personnel",  label: "人事DB",           icon: "personnel" },
      { href: "/admin/incidents",     label: "インシデント",     icon: "warning" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/novel",         label: "記録文書",         icon: "novel" },
      { href: "/admin/codex",         label: "コーデックス",     icon: "story" },
      { href: "/admin/audio",         label: "音声記録",         icon: "cipher" },
      { href: "/admin/world-data",    label: "世界観データ",     icon: "database" },
      { href: "/admin/sigma-messages",label: "SIGMAメッセージ",  icon: "entity" },
      { href: "/admin/publish-queue", label: "公開スケジュール", icon: "event" },
      { href: "/admin/puzzles",       label: "謎コンテンツ",     icon: "cipher" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/missions",        label: "ミッション",       icon: "mission" },
      { href: "/admin/event-schedule",  label: "イベント",         icon: "event" },
      { href: "/admin/npc-engine",      label: "NPCエンジン",      icon: "npc" },
      { href: "/admin/story-triggers",  label: "ストーリートリガー", icon: "story" },
      { href: "/admin/npc-scripts",     label: "NPCスクリプト",    icon: "console" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/rule-engine", label: "ルールエンジン", icon: "rule" },
    ],
  },
];

// モバイルタブ用フラットリスト
const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(g => g.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">

      {/* ── Desktop サイドナビ ── */}
      <aside
        className="hidden sm:flex flex-col shrink-0"
        style={{
          width:       220,
          background:  "#06080e",
          borderRight: "1px solid rgba(255,180,60,0.1)",
          overflowY:   "auto",
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding:     "14px 14px 10px",
          borderBottom:"1px solid rgba(255,180,60,0.08)",
          flexShrink:  0,
        }}>
          <div style={{
            fontSize:      10,
            fontFamily:    "var(--font-mono)",
            letterSpacing: "0.22em",
            color:         "#ffb43c",
            marginBottom:  2,
            display:       "flex",
            alignItems:    "center",
            gap:           6,
          }}>
            <Icon name="settings" size={12} color="#ffb43c" /> ADMIN CONSOLE
          </div>
          <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.18)" }}>
            海蝕機関 管理システム
          </div>
        </div>

        {/* グループナビ */}
        <div style={{ flex: 1, paddingTop: 4, paddingBottom: 12 }}>
          <AdminNavGrouped groups={ADMIN_NAV_GROUPS} />
        </div>

        {/* フッター — サイトへ戻るリンク */}
        <div style={{
          padding:    "8px 14px",
          borderTop:  "1px solid rgba(255,180,60,0.06)",
          flexShrink: 0,
        }}>
          <a
            href="/dashboard"
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        6,
              fontSize:   11,
              fontFamily: "var(--font-mono)",
              color:      "rgba(255,255,255,0.2)",
              textDecoration: "none",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"}
          >
            <span aria-hidden="true">←</span>
            サイトに戻る
          </a>
        </div>
      </aside>

      {/* ── Mobile スクロールタブ ── */}
      <div
        className="sm:hidden fixed top-12 left-0 right-0 z-30 flex overflow-x-auto"
        style={{
          background:   "#06080e",
          borderBottom: "1px solid rgba(255,180,60,0.12)",
        }}
      >
        {ADMIN_NAV_FLAT.map(item => (
          <AdminNavTabLink key={item.href} item={item} />
        ))}
      </div>

      {/* ── コンテンツ ── */}
      <div className="flex-1 overflow-auto sm:pt-0 pt-10">
        {children}
      </div>
    </div>
  );
}
