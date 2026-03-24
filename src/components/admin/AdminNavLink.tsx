/**
 * AdminNavLink.tsx — 管理者ナビゲーションリンクコンポーネント
 * Updated: 2026-03-19 03:55 JST — 重複 import { NavIcon } を1行に修正
 */
"use client";
import Link        from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/ui/Icon";

export interface AdminNavItem {
  href:    string;
  label:   string;
  icon:    string;
  badge?:  string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const C = {
  active:   "rgba(255,180,60,0.1)",
  text:     "rgba(255,220,140,0.85)",
  dim:      "rgba(255,255,255,0.28)",
  muted:    "rgba(255,255,255,0.12)",
  accent:   "#ffb43c",
} as const;

export function AdminNavLink({ item }: { item: AdminNavItem }) {
  const pathname = usePathname();
  const active   = item.href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(item.href + "/") || pathname === item.href;

  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 no-underline transition-colors duration-100"
      style={{
        padding:    "6px 14px 6px 12px",
        fontSize:   12,
        fontFamily: "var(--font-mono)",
        borderLeft: `2px solid ${active ? C.accent : "transparent"}`,
        color:      active ? C.accent : C.dim,
        background: active ? C.active : "transparent",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color      = C.text;
          (e.currentTarget as HTMLElement).style.background = "rgba(255,180,60,0.04)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color      = C.dim;
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      <span aria-hidden="true" style={{ width: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NavIcon icon={item.icon} size={14} color={active ? C.accent : C.dim} />
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          fontSize: 9, padding: "1px 5px", borderRadius: 3,
          background: "rgba(255,68,68,0.25)",
          border: "1px solid rgba(255,68,68,0.4)",
          color: "#ff7070",
        }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function AdminNavGrouped({ groups }: { groups: AdminNavGroup[] }) {
  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 4 }}>
          <div style={{
            padding:       "8px 14px 3px",
            fontSize:      9,
            fontFamily:    "var(--font-mono)",
            letterSpacing: "0.18em",
            color:         C.muted,
            textTransform: "uppercase" as const,
          }}>
            {group.label}
          </div>
          {group.items.map(item => (
            <AdminNavLink key={item.href} item={item} />
          ))}
        </div>
      ))}
    </>
  );
}

export function AdminNavTabLink({ item }: { item: AdminNavItem }) {
  const pathname = usePathname();
  const active   = item.href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(item.href + "/") || pathname === item.href;

  return (
    <Link
      href={item.href}
      className="flex items-center gap-1.5 px-3 py-2.5 text-[11px] no-underline whitespace-nowrap transition-all duration-150"
      style={{
        borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
        color:        active ? C.accent : C.dim,
      }}
    >
      <NavIcon icon={item.icon} size={13} color={active ? C.accent : C.dim} />
      <span>{item.label}</span>
    </Link>
  );
}
