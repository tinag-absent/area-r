"use client";
import { Icon } from "@/components/ui/Icon";

export type ButtonVariant = "primary" | "secondary" | "danger" | "warning";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  isLoading?: boolean;
  size?:      "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<string, string> = {
  sm: "btn-sm", md: "", lg: "btn-lg",
};

export function Button({
  variant = "primary", isLoading = false, disabled,
  children, className = "", size = "md", style, ...props
}: ButtonProps) {
  const cls = ["btn", `btn-${variant}`, SIZE_CLASS[size], className]
    .filter(Boolean).join(" ");

  return (
    <button {...props} disabled={disabled || isLoading}
      aria-busy={isLoading || undefined} className={cls} style={style}>
      {isLoading ? (
        <><Icon name="dashboard" size={13} style={{ animation: "blink 0.8s step-end infinite" }} aria-hidden /> 処理中…</>
      ) : children}
    </button>
  );
}
