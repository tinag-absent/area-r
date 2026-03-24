import { Icon } from "@/components/ui/Icon";

interface LoadingStatusProps {
  label?:     string;
  className?: string;
}

export function LoadingStatus({ label = "読み込み中", className = "" }: LoadingStatusProps) {
  return (
    <div role="status" aria-live="polite"
      className={["state-loading", className].join(" ")}>
      <Icon name="dashboard" size={13} className="state-loading-dot" aria-hidden />
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{label}…</span>
    </div>
  );
}
