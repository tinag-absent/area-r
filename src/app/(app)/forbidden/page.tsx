import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Icon, NavIcon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "アクセス拒否 — 海蝕機関" };

export default async function ForbiddenPage() {
  const level = Number((await headers()).get("x-user-level") ?? 0);

  return (
    <div
      className="animate-[fadeIn_0.4s_ease_both] flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 0px)" }}
    >
      <div className="px-6 py-10 w-full max-w-[480px] text-center">

        <div
          className="text-[96px] font-bold leading-none mb-1 select-none"
          style={{ color: "var(--color-danger)", opacity: 0.1, letterSpacing: "-0.04em" }}
          aria-hidden="true"
        >
          403
        </div>

        <div className="hud-label mb-2" style={{ color: "var(--color-danger)" }}>
          ACCESS DENIED
        </div>

        <h1
          className="m-0 text-[18px] font-bold mb-3"
          style={{ color: "var(--color-foreground)", letterSpacing: "0.02em" }}
        >
          アクセスが拒否されました
        </h1>

        <p
          className="text-[12px] leading-relaxed mb-6 m-0"
          style={{ color: "var(--color-fg-dim)" }}
        >
          このリソースへのアクセスに必要なクリアランスレベルが不足しています。
        </p>

        <div
          className="rounded-sm p-4 mb-6"
          style={{
            background: "rgba(255,68,68,0.04)",
            border: "1px solid rgba(255,68,68,0.15)",
          }}
        >
          <div className="hud-label mb-2" style={{ color: "var(--color-danger)" }}>
            現在のクリアランス
          </div>
          <div className="text-[28px] font-bold" style={{ color: "var(--color-foreground)" }}>
            LV {level}
          </div>
          <div className="hud-label mt-1">
            XPを獲得してレベルアップするとアクセス可能になります
          </div>
        </div>

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
        </div>

        <div className="hud-label mt-8">
          KAISHOKU AGENCY — ERROR CODE 403
        </div>
      </div>
    </div>
  );
}
