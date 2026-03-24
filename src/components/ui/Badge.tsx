import { Icon } from "@/components/ui/Icon";
/**
 * Badge / Tag 系コンポーネント
 *
 * Badge      — ステータス文字列に対応した色付きバッジ
 * StatusBadge — STATUS_COLORS マップから自動的に色を解決
 * ThreatBadge — 脅威レベル表示
 * Tag         — ラベル一枚
 * TagList     — Tag の集合
 */

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

export type BadgeStatus =
  | "ACTIVE" | "OPERATIONAL" | "IN_SERVICE" | "CONTAINED" | "OBSERVED"
  | "PENDING" | "DEGRADED" | "LIMITED"
  | "MISSING" | "LOCKED" | "RESTRICTED" | "CLASSIFIED";

export type ThreatLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";

// ─────────────────────────────────────────────────────────────────────
// 色マップ
// ─────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { border: string; color: string }> = {
  ACTIVE:       { border: "rgba(62,207,106,0.4)",  color: "var(--color-success)" },
  OPERATIONAL:  { border: "rgba(62,207,106,0.4)",  color: "var(--color-success)" },
  IN_SERVICE:   { border: "rgba(62,207,106,0.4)",  color: "var(--color-success)" },
  CONTAINED:    { border: "rgba(62,207,106,0.4)",  color: "var(--color-success)" },
  OBSERVED:     { border: "rgba(0,200,255,0.4)",   color: "var(--color-primary)" },
  PENDING:      { border: "rgba(255,180,60,0.4)",  color: "var(--color-warning)" },
  DEGRADED:     { border: "rgba(255,180,60,0.4)",  color: "var(--color-warning)" },
  LIMITED:      { border: "rgba(255,180,60,0.4)",  color: "var(--color-warning)" },
  MISSING:      { border: "rgba(255,68,68,0.4)",   color: "var(--color-danger)"  },
  LOCKED:       { border: "rgba(0,200,255,0.1)",   color: "var(--color-fg-muted)" },
  RESTRICTED:   { border: "rgba(0,200,255,0.1)",   color: "var(--color-fg-muted)" },
  CLASSIFIED:   { border: "rgba(0,200,255,0.1)",   color: "var(--color-fg-muted)" },
} satisfies Record<string, { border: string; color: string }>;

const THREAT_STYLES: Record<ThreatLevel, { color: string }> = {
  LOW:      { color: "var(--color-success)" },
  MODERATE: { color: "var(--color-warning)" },
  HIGH:     { color: "var(--color-danger)"  },
  CRITICAL: { color: "var(--color-danger)"  },
  UNKNOWN:  { color: "var(--color-fg-muted)" },
};

// ─────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label:     string;
  /** STATUS_STYLES から色を解決するキー。未登録の値はデフォルトスタイル */
  status?:   string;
  className?: string;
}

export function Badge({ label, status, className = "" }: BadgeProps) {
  const s: { border: string; color: string } = STATUS_STYLES[status ?? ""] ?? {
    border: "rgba(0,200,255,0.1)",
    color:  "var(--color-fg-muted)",
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-px rounded-sm tracking-[0.08em] ${className}`}
      style={{
        border:  `1px solid ${s.border}`,
        color:   s.color,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </span>
  );
}

/** ステータス文字列をラベルと status の両方に使う簡易版 */
export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status} status={status} />;
}

// ─────────────────────────────────────────────────────────────────────
// ThreatBadge
// ─────────────────────────────────────────────────────────────────────

export function ThreatBadge({ level }: { level: ThreatLevel }) {
  const { color } = THREAT_STYLES[level] ?? THREAT_STYLES.UNKNOWN;
  return (
    <span
      className="text-[11px] font-bold"
      style={{ color }}
    >
      <Icon name="warning" size={10} style={{ marginRight: 3 }} aria-hidden />{level}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tag / TagList
// ─────────────────────────────────────────────────────────────────────

interface TagProps {
  children: React.ReactNode;
  /** タグのアクセントカラー（CSS変数または16進数） */
  accentColor?: string;
}

export function Tag({ children, accentColor }: TagProps) {
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-sm"
      style={{
        border:  accentColor ? `1px solid ${accentColor}44` : "1px solid rgba(0,200,255,0.1)",
        color:   accentColor ?? "var(--color-fg-dim)",
        background: "rgba(0,200,255,0.02)",
      }}
    >
      {children}
    </span>
  );
}

export function TagList({ items, accentColor }: { items: string[]; accentColor?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Tag key={i} accentColor={accentColor}>{item}</Tag>
      ))}
    </div>
  );
}
