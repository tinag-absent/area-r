/**
 * HudLabel — hud-label の React コンポーネント版
 * Breadcrumb — パンくずリスト
 */

import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────
// HudLabel
// ─────────────────────────────────────────────────────────────────────

interface HudLabelProps {
  children:   React.ReactNode;
  color?:     string;
  className?: string;
  /** aria-hidden にするか（純装飾の場合 true） */
  decorative?: boolean;
}

export function HudLabel({
  children,
  color = "var(--color-fg-muted)",
  className = "",
  decorative = false,
}: HudLabelProps) {
  return (
    <span
      className={["hud-label", className].join(" ")}
      style={{ color }}
      aria-hidden={decorative || undefined}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Breadcrumb
// ─────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-2 mb-6"
      style={{ fontSize: "11px", color: "var(--color-fg-muted)" }}
      aria-label="パンくずリスト"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span
              aria-hidden="true"
              style={{ color: "var(--color-fg-decorative)" }}
            >
              ›
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="no-underline transition-colors"
              style={{ color: "var(--color-fg-muted)" }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.color = "var(--color-primary)")
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)")
              }
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--color-fg-dim)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
