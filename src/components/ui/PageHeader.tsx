type EyebrowColor = "warning" | "primary" | "muted" | "danger";

interface PageHeaderProps {
  eyebrow?:      string;
  title:         string;
  eyebrowColor?: EyebrowColor;
}

const EYEBROW_COLOR: Record<EyebrowColor, string> = {
  warning: "var(--color-warning)",
  primary: "var(--color-primary)",
  muted:   "var(--color-fg-muted)",
  danger:  "var(--color-danger)",
};

export function PageHeader({ eyebrow, title, eyebrowColor = "muted" }: PageHeaderProps) {
  return (
    <div className="page-header">
      {eyebrow && (
        <div className="hud-label mb-1"
          style={{ color: EYEBROW_COLOR[eyebrowColor] }}
          aria-hidden="true">{eyebrow}</div>
      )}
      <h1 className="page-title">{title}</h1>
    </div>
  );
}

export function HudLabel({
  children, color, className = "", decorative = false,
}: {
  children: React.ReactNode;
  color?:   string;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span className={["hud-label", className].join(" ")}
      style={color ? { color } : undefined}
      aria-hidden={decorative || undefined}>
      {children}
    </span>
  );
}
