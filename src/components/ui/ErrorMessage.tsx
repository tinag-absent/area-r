interface ErrorMessageProps {
  id?:        string;
  message:    string;
  className?: string;
}

export function ErrorMessage({ id, message, className = "" }: ErrorMessageProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className={["rounded-sm px-3.5 py-2.5 text-[12px] mb-4", className].join(" ")}
      style={{
        background: "rgba(255,68,68,0.06)",
        border: "1px solid rgba(255,68,68,0.25)",
        color: "var(--color-danger)",
      }}
    >
      {message}
    </div>
  );
}
