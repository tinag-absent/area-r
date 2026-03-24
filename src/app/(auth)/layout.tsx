export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center p-4 safe-top safe-bottom"
      style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse at 50% 40%, rgba(0,200,255,0.04) 0%, var(--color-bg) 70%)",
      }}
    >
      {/* Decorative grid */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}
