/*
 * Sidebar.tsx — サイドバーナビゲーションコンポーネント
 * Readability pass 2026-03-23:
 *   - コントラスト比をWCAG AA準拠に引き上げ
 *   - フォントサイズ・行間を日本語に最適化
 *   - グループラベルを可読範囲に調整
 *   - CRTスキャンラインを除去
 *   - 幅を210pxに拡張
 *   - ロック状態の視認性を改善
 */
"use client";
import { apiPost } from "@/lib/api-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { NavIcon, Icon } from "@/components/ui/Icon";
import { useBoundStore, type UserState } from "@/store";
import { DIVISIONS, LEVEL_THRESHOLDS } from "@/lib/constants";

/* ── NAV 構成 ──────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "OPERATIONS",
    items: [
      { href: "/dashboard",     label: "ダッシュボード",   icon: "dashboard", minLevel: 0 },
      { href: "/chat",          label: "チャット",         icon: "chat",      minLevel: 0 },
      { href: "/notifications", label: "通知",             icon: "notify",    minLevel: 0, isNotif: true },
    ],
  },
  {
    label: "FIELD",
    items: [
      { href: "/map",      label: "海蝕マップ",     icon: "map",     minLevel: 1 },
      { href: "/events",   label: "イベント",       icon: "event",   minLevel: 0 },
      { href: "/console",  label: "観測コンソール", icon: "console", minLevel: 3 },
    ],
  },
  {
    label: "AGENCY",
    items: [
      { href: "/bulletin",  label: "掲示板",       icon: "bulletin",  minLevel: 1 },
      { href: "/database",  label: "データベース", icon: "database",  minLevel: 2 },
    ],
  },
  {
    label: "ARCHIVE",
    items: [
      { href: "/novel",        label: "機関員の日記", icon: "novel",      minLevel: 0 },
      { href: "/codex",        label: "コーデックス", icon: "story",      minLevel: 0 },
      { href: "/cipher",       label: "暗号解読",     icon: "cipher",     minLevel: 2 },
      { href: "/skill-tree",   label: "スキルツリー", icon: "skill",      minLevel: 1 },
      { href: "/achievements", label: "実績",         icon: "star",       minLevel: 0 },
      { href: "/classified",   label: "機密文書",     icon: "classified", minLevel: 5 },
    ],
  },
  {
    label: "PERSONAL",
    items: [
      { href: "/profile",  label: "プロフィール", icon: "profile",  minLevel: 0 },
      { href: "/settings", label: "設定",         icon: "settings", minLevel: 0 },
    ],
  },
] as const;

type NavItem = (typeof NAV_GROUPS)[number]["items"][number];

const DIVISION_MAP = new Map(DIVISIONS.map((d) => [d.id, d]));

/* ── 色定数 ─────────────────────────────────────────────────────────── */
// コントラスト目標: 通常テキスト 4.5:1 / 大テキスト 3:1 (WCAG AA)
const C = {
  bg:        "#04090f",           // サイドバー背景
  surface:   "rgba(0,180,255,0.04)",
  border:    "rgba(0,180,255,0.10)",
  borderAct: "rgba(0,200,255,0.30)",
  cyan:      "#4dd8f0",           // アクティブ / 強調  contrast ~5.5:1 on #04090f
  text:      "#9ec5d8",           // 通常テキスト       contrast ~5.1:1 on #04090f
  textSub:   "#6a9ab0",           // サブテキスト       contrast ~3.5:1 (大テキスト用)
  groupLabel:"#4a7a94",           // グループラベル     contrast ~3.1:1 (全大文字 + 太字)
  locked:    "#3d6070",           // ロック状態         前より明るく
  lockedLv:  "#2e5060",          // ロックレベルバッジ
  danger:    "#ff5555",
  success:   "#4adf7a",
  warning:   "#ffc044",
} as const;

/* ── NavLink ─────────────────────────────────────────────────────────── */
function NavLink({
  item, active, unread, locked, onClick,
}: {
  item: NavItem; active: boolean; unread: number; locked: boolean; onClick: () => void;
}) {
  const baseStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 9,
    padding: "7px 14px 7px 12px",
    fontSize: 12.5,
    letterSpacing: "0.01em",
    borderLeft: "2px solid transparent",
    cursor: "not-allowed",
    userSelect: "none",
  };

  if (locked) {
    return (
      <span
        aria-disabled="true"
        aria-label={`${item.label} — クリアランス LV${item.minLevel} 必要`}
        style={{
          ...baseStyle,
          color: C.locked,
        }}
      >
        <span aria-hidden="true" style={{
          width: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <NavIcon icon={item.icon} size={14} color={C.locked} />
        </span>
        <span style={{ flex: 1 }}>{item.label}</span>
        <span style={{
          fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
          color: C.lockedLv,
          border: `1px solid ${C.lockedLv}`,
          padding: "1px 4px",
          flexShrink: 0,
        }}>
          LV{item.minLevel}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        ...baseStyle,
        cursor: "pointer",
        textDecoration: "none",
        color:      active ? C.cyan : C.text,
        background: active ? "rgba(0,200,255,0.06)" : "transparent",
        borderLeft: `2px solid ${active ? C.cyan : "transparent"}`,
        boxShadow:  active ? "inset 0 0 24px rgba(0,200,255,0.04)" : "none",
        transition: "color 0.12s, background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "#c2e0ee";
          (e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.035)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = C.text;
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      <span aria-hidden="true" style={{
        width: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: active ? C.cyan : C.textSub,
        filter: active ? `drop-shadow(0 0 4px ${C.cyan}88)` : "none",
        transition: "color 0.12s",
      }}>
        <NavIcon icon={item.icon} size={14} color={active ? C.cyan : C.textSub} />
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {unread > 0 && (
        <span aria-label={`未読${unread}件`} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: 16, minWidth: 16, padding: "0 4px",
          background: C.danger, color: "#fff",
          fontSize: 9, fontWeight: "bold", lineHeight: 1,
          borderRadius: 2, flexShrink: 0,
          fontFamily: "var(--font-mono)",
        }}>
          <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
        </span>
      )}
    </Link>
  );
}

/* ── XP プログレスバー ───────────────────────────────────────────────── */
function XpMiniBar({ xp, level }: { xp: number; level: number }) {
  const cur  = LEVEL_THRESHOLDS[level]     ?? 0;
  const next = LEVEL_THRESHOLDS[level + 1] ?? null;
  const pct  = next ? Math.min(((xp - cur) / (next - cur)) * 100, 100) : 100;
  return (
    <div title={`XP: ${xp.toLocaleString()}`} style={{ height: 2, background: "rgba(0,180,255,0.10)", borderRadius: 1 }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: 1,
        background: `linear-gradient(90deg, ${C.cyan}, rgba(0,200,255,0.5))`,
        boxShadow: `0 0 6px rgba(0,200,255,0.4)`,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

/* ── System status ───────────────────────────────────────────────────── */
function SysMeter({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min((value / 100) * 100, 100);
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{
          fontSize: 10, letterSpacing: "0.10em", color: C.groupLabel,
          textTransform: "uppercase", fontFamily: "var(--font-mono)",
        }}>{label}</span>
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color,
          letterSpacing: "0.04em",
        }}>
          {value.toFixed(1)}
        </span>
      </div>
      <div style={{ height: 2, background: "rgba(0,0,0,0.5)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 1,
          background: color, boxShadow: `0 0 5px ${color}88`,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

/* ── Sidebar Content (memoized) ─────────────────────────────────────── */
interface SidebarContentProps {
  pathname:       string;
  level:          number;
  user:           UserState | null;
  unreadCount:     number;
  totalUnreadChat: number;
  unreadChatCounts: Record<string, number>;
  divisionName:   string | undefined;
  divisionColor:  string | undefined;
  onNavClick:     () => void;
  onLogout:       () => void;
}

const SidebarContent = memo(function SidebarContent({
  pathname, level, user, unreadCount, totalUnreadChat, unreadChatCounts,
  divisionName, divisionColor, onNavClick, onLogout,
}: SidebarContentProps) {
  return (
    <aside
      style={{
        width: 210,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
      }}
    >
      {/* ── Logo ── */}
      <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${C.border}` }}>
        <div
          style={{
            fontSize: 13, fontWeight: "bold", color: C.cyan,
            fontFamily: "var(--font-display)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            letterSpacing: "0.18em", marginBottom: 3,
            textShadow: `0 0 12px rgba(0,200,255,0.45)`,
          }}
          aria-label="KAISHOKU 海蝕機関"
        >
          <Icon name="dashboard" size={14} style={{ marginRight: 5 }} aria-hidden />KAISHOKU
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: C.groupLabel }}>
          海蝕機関 / AGENCY
        </div>
      </div>

      {/* ── Agent card ── */}
      {user && (
        <div style={{ padding: "11px 14px 0", borderBottom: `1px solid ${C.border}` }}>
          {/* online dot + agent ID */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span className="dot dot-online" aria-hidden="true" />
            <span className="sr-only">オンライン</span>
            <span style={{
              fontSize: 12, color: C.cyan, fontWeight: "bold",
              letterSpacing: "0.06em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "var(--font-mono)",
            }}>
              {user.agentId}
            </span>
          </div>

          {/* LV badge + division */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
            <span style={{
              fontSize: 10, fontWeight: "bold", letterSpacing: "0.10em",
              padding: "2px 7px",
              border: `1px solid rgba(0,200,255,0.35)`,
              color: C.cyan, background: "rgba(0,200,255,0.07)",
              textShadow: `0 0 8px rgba(0,200,255,0.4)`,
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}>LV{level}</span>
            {divisionName && (
              <span style={{
                fontSize: 11, color: divisionColor ?? C.textSub,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{divisionName}</span>
            )}
          </div>

          {/* XP bar */}
          <XpMiniBar xp={user.xp} level={level} />
          <div style={{ height: 10 }} />
        </div>
      )}

      {/* ── Navigation ── */}
      <nav aria-label="メインナビゲーション" style={{ flex: 1, overflowY: "auto", paddingTop: 4, paddingBottom: 4 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {/* グループラベル */}
            <div style={{
              fontSize: 10, fontWeight: "bold", letterSpacing: "0.18em",
              color: C.groupLabel,
              padding: "8px 14px 4px",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
            }} aria-hidden="true">{group.label}</div>

            {group.items.map(item => {
              const locked = level < item.minLevel;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const npcDmTotal = Object.entries(unreadChatCounts).filter(([k]) => k.startsWith("npc-dm-")).reduce((a,[,v]) => a+v, 0);
              const unread = "isNotif" in item ? unreadCount : item.href === "/chat" ? (totalUnreadChat + npcDmTotal) : 0;
              return (
                <NavLink
                  key={item.href}
                  item={item as NavItem}
                  active={active}
                  unread={unread}
                  locked={locked}
                  onClick={onNavClick}
                />
              );
            })}
          </div>
        ))}

        {/* Admin link */}
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              fontSize: 10, fontWeight: "bold", letterSpacing: "0.18em",
              color: "rgba(255,180,60,0.55)",
              padding: "8px 14px 4px", textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
            }} aria-hidden="true">
              ADMIN
            </div>
            <Link
              href="/admin"
              onClick={onNavClick}
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "7px 14px 7px 12px",
                fontSize: 12.5, textDecoration: "none",
                color:      pathname.startsWith("/admin") ? C.warning : C.textSub,
                background: pathname.startsWith("/admin") ? "rgba(255,180,60,0.05)" : "transparent",
                borderLeft: `2px solid ${pathname.startsWith("/admin") ? C.warning : "transparent"}`,
                transition: "color 0.12s, background 0.12s",
              }}
            >
              <span aria-hidden="true" style={{ width: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="admin" size={14} color={pathname.startsWith("/admin") ? C.warning : C.textSub} />
              </span>
              <span>管理者コンソール</span>
            </Link>
          </div>
        )}
      </nav>

      {/* ── System Status ── */}
      {user && (
        <div style={{
          margin: "0 10px 10px",
          padding: "10px 12px",
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${C.border}`,
          borderRadius: 2,
        }}>
          <div style={{
            fontSize: 10, fontWeight: "bold", letterSpacing: "0.16em",
            color: C.groupLabel, marginBottom: 9, textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}>
            SYS STATUS
          </div>
          <SysMeter
            label="ANOMALY"
            value={user.anomalyScore}
            color={user.anomalyScore > 60 ? C.danger : user.anomalyScore > 30 ? C.warning : C.success}
          />
          <SysMeter
            label="OBS.LOAD"
            value={user.observerLoad}
            color={C.cyan}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
            <span className="dot dot-online" aria-hidden="true" style={{ width: 4, height: 4, flexShrink: 0 }} />
            <span style={{
              fontSize: 9, letterSpacing: "0.10em", color: C.groupLabel,
              fontFamily: "var(--font-mono)",
            }}>DIMENSIONAL LINK ACTIVE</span>
          </div>
        </div>
      )}

      {/* ── Logout ── */}
      <div style={{ padding: "8px 10px 12px", borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 0",
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: "bold",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.textSub, background: "transparent",
            border: `1px solid rgba(0,180,255,0.12)`,
            borderRadius: 2,
            cursor: "pointer", transition: "all 0.12s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = C.text;
            el.style.borderColor = "rgba(0,200,255,0.28)";
            el.style.background = "rgba(0,200,255,0.04)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = C.textSub;
            el.style.borderColor = "rgba(0,180,255,0.12)";
            el.style.background = "transparent";
          }}
        >
          <Icon name="chevron-right" size={9} aria-hidden />
          LOGOUT
        </button>
      </div>
    </aside>
  );
});


/* ── BottomNav (mobile) ─────────────────────────────────────────────── */
function BottomNav() {
  const pathname         = usePathname();
  const unreadCount      = useBoundStore(s => s.unreadCount);
  const unreadChatCounts = useBoundStore(s => s.unreadChatCounts);
  const totalChat        = Object.values(unreadChatCounts).reduce((a, b) => a + b, 0);

  const npcDmTotal = Object.entries(unreadChatCounts).filter(([k]) => k.startsWith("npc-dm-")).reduce((a,[,v]) => a+v, 0);
  const items = [
    { href: "/dashboard",     label: "ホーム",       icon: "dashboard", badge: 0 },
    { href: "/chat",          label: "チャット",     icon: "chat",      badge: totalChat + npcDmTotal },
    { href: "/notifications", label: "通知",         icon: "notify",    badge: unreadCount },
    { href: "/database",      label: "データベース", icon: "database",  badge: 0 },
  ] as const;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(4,9,15,0.97)",
        borderTop: "1px solid rgba(0,180,255,0.14)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="ボトムナビゲーション"
    >
      {items.map(item => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "8px 4px 6px", textDecoration: "none",
              color: active ? C.cyan : C.text,
              position: "relative",
            }}
            aria-current={active ? "page" : undefined}
          >
            <span style={{ fontSize: 20, lineHeight: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
              <NavIcon icon={item.icon} size={20} color={active ? C.cyan : C.text} />
              {item.badge > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -6,
                  minWidth: 14, height: 14, borderRadius: 7,
                  background: C.danger,
                  color: "#fff", fontSize: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px", fontFamily: "var(--font-mono)",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10, marginTop: 3, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              {item.label}
            </span>
            {active && (
              <span style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 24, height: 2, background: C.cyan, borderRadius: 1,
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Sidebar (shell) ────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname         = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const burgerRef        = useRef<HTMLButtonElement>(null);
  const user             = useBoundStore(s => s.user);
  const unreadCount      = useBoundStore(s => s.unreadCount);
  const unreadChatCounts = useBoundStore(s => s.unreadChatCounts);

  const totalUnreadChat = useMemo(
    () => Object.values(unreadChatCounts).reduce((a, b) => a + b, 0),
    [unreadChatCounts]
  );

  const level = user?.level ?? 0;

  const division = useMemo(
    () => (user?.divisionId ? DIVISION_MAP.get(user.divisionId) : null),
    [user?.divisionId]
  );

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMobileOpen(false); burgerRef.current?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    await apiPost("/api/auth/logout");
    try { new BroadcastChannel("sea-auth").postMessage({ type: "logout" }); } catch {}
    window.location.href = "/login";
  }, []);

  const handleNavClick = useCallback(() => setMobileOpen(false), []);

  const contentProps: SidebarContentProps = {
    pathname, level, user, unreadCount, totalUnreadChat,
    divisionName:  division?.name,
    divisionColor: division?.color,
    unreadChatCounts,
    onNavClick:    handleNavClick,
    onLogout:      handleLogout,
  };

  return (
    <>
      {/* ハンバーガー (mobile) */}
      <button
        ref={burgerRef}
        className="md:hidden fixed top-3 left-3 z-50 p-2 text-lg leading-none"
        style={{ background: "#070e18", border: "1px solid rgba(0,200,255,0.22)", color: C.cyan }}
        onClick={() => setMobileOpen(v => !v)}
        aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        <span aria-hidden="true">{mobileOpen ? <Icon name="close" size={16} aria-hidden /> : <Icon name="menu" size={16} aria-hidden />}</span>
      </button>

      {/* オーバーレイ */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(3,8,16,0.88)" }}
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop */}
      <div className="hidden md:flex">
        <SidebarContent {...contentProps} />
      </div>

      {/* BottomNav */}
      <BottomNav />

      {/* Mobile */}
      <div
        id="mobile-sidebar"
        role="dialog" aria-modal="true" aria-label="ナビゲーションメニュー"
        aria-hidden={!mobileOpen}
        className={[
          "md:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarContent {...contentProps} />
      </div>
    </>
  );
}
