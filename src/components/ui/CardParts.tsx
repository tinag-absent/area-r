/**
 * CardSection / CardField / CardBody
 * Server Component互換（use client 不要）
 */

interface CardSectionProps {
  title:    string;
  children: React.ReactNode;
  variant?: "default" | "warning";
}

export function CardSection({ title, children, variant = "default" }: CardSectionProps) {
  const headerBg    = variant === "warning" ? "rgba(255,180,60,0.03)"  : "rgba(0,200,255,0.03)";
  const borderColor = variant === "warning" ? "rgba(255,180,60,0.08)"  : "rgba(0,200,255,0.06)";
  const labelColor  = variant === "warning" ? "var(--color-warning)"   : "var(--color-fg-muted)";

  return (
    <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      <div
        className="px-4 py-2"
        style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}
      >
        <span className="hud-label" style={{ color: labelColor }}>{title}</span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-2.5" style={{ background: "var(--color-bg-surface)" }}>
        {children}
      </div>
    </div>
  );
}

export function CardField({
  label,
  value,
  labelWidth = "130px",
}: {
  label:       string;
  value:       React.ReactNode;
  labelWidth?: string;
}) {
  return (
    <div className="flex gap-3 text-[12px]">
      <span className="shrink-0" style={{ color: "var(--color-fg-muted)", minWidth: labelWidth }}>
        {label}
      </span>
      <span style={{ color: "var(--color-foreground)" }}>{value}</span>
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="m-0 text-[12px] leading-relaxed"
      style={{
        color:       "var(--color-fg-dim)",
        borderLeft:  "2px solid rgba(0,200,255,0.12)",
        paddingLeft: "12px",
      }}
    >
      {children}
    </p>
  );
}
