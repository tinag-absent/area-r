import { Icon, NavIcon } from "@/components/ui/Icon";
/**
 * EmptyState / LockedState コンポーネント
 *
 * EmptyState  — 0件・未取得の状態表示
 * LockedState — クリアランス不足でアクセス不可な状態
 */

// ─────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?:    string;
  message:  string;
  sub?:     string;
  /** "dashed" (デフォルト) | "solid" */
  border?:  "dashed" | "solid";
}

export function EmptyState({
  icon = "dashboard",
  message,
  sub,
  border = "dashed",
}: EmptyStateProps) {
  return (
    <div
      className="rounded-sm p-10 text-center"
      style={{
        background:  "var(--color-bg-surface)",
        border:      `1px ${border} rgba(0,200,255,0.08)`,
      }}
    >
      <div
        className="text-[24px] mb-3"
        style={{ color: "var(--color-fg-decorative)" }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div
        className="text-[13px]"
        style={{ color: "var(--color-fg-dim)" }}
      >
        {message}
      </div>
      {sub && (
        <div className="hud-label mt-1.5">{sub}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LockedState
// ─────────────────────────────────────────────────────────────────────

interface LockedStateProps {
  requiredLevel: number;
  message?:      string;
}

export function LockedState({ requiredLevel, message }: LockedStateProps) {
  return (
    <div
      className="rounded-sm p-8 text-center"
      style={{
        background: "var(--color-bg-surface)",
        border:     "1px dashed rgba(0,200,255,0.08)",
      }}
    >
      <div
        className="text-[20px] mb-2"
        style={{ color: "var(--color-fg-decorative)" }}
        aria-hidden="true"
      >
        <Icon name="lock" size={20} aria-hidden />
      </div>
      <div className="hud-label mb-1" style={{ color: "var(--color-primary)" }}>
        CLEARANCE LV{requiredLevel}+ REQUIRED
      </div>
      <div
        className="text-[12px]"
        style={{ color: "var(--color-fg-muted)" }}
      >
        {message ?? `クリアランスレベル ${requiredLevel} 以上が必要です。`}
      </div>
    </div>
  );
}
