import Link from "next/link";
import { Icon, NavIcon } from "@/components/ui/Icon";

export default function GlobalNotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, rgba(0,200,255,0.04) 0%, var(--color-bg) 70%)",
      }}
    >
      {/* デコレーティブグリッド */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        className="relative bracket rounded-sm p-8 w-full max-w-[420px] text-center animate-[fadeIn_0.4s_ease_both]"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid rgba(0,200,255,0.12)",
        }}
      >
        {/* ステータスコード */}
        <div
          className="text-[72px] font-bold leading-none mb-2"
          style={{
            color: "var(--color-primary)",
            opacity: 0.18,
            letterSpacing: "-0.02em",
          }}
          aria-hidden="true"
        >
          404
        </div>

        <div className="hud-label mb-2" style={{ color: "var(--color-primary)" }}>
          FILE NOT FOUND
        </div>

        <h1
          className="m-0 text-[17px] font-bold mb-3"
          style={{ color: "var(--color-foreground)" }}
        >
          このページは存在しません
        </h1>

        <p
          className="text-[12px] leading-relaxed mb-6 m-0"
          style={{ color: "var(--color-fg-dim)" }}
        >
          アクセスしようとしたリソースは削除されたか、
          URLが正しくない可能性があります。
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="block py-2.5 px-4 rounded-sm text-[12px] font-bold tracking-[0.06em] no-underline transition-all duration-150"
            style={{
              background: "rgba(0,200,255,0.08)",
              border: "1px solid rgba(0,200,255,0.3)",
              color: "var(--color-primary)",
            }}
          >
            <Icon name="play" size={11} style={{ marginRight: 4 }} aria-hidden />ダッシュボードへ戻る
          </Link>
          <Link
            href="/login"
            className="block py-2 px-4 rounded-sm text-[11px] no-underline transition-all duration-150"
            style={{
              border: "1px solid rgba(0,200,255,0.1)",
              color: "var(--color-fg-muted)",
            }}
          >
            ログインページへ
          </Link>
        </div>

        <div className="hud-label mt-6">
          KAISHOKU AGENCY — ERROR CODE 404
        </div>
      </div>
    </div>
  );
}
