import Link from "next/link";
import { Icon, NavIcon } from "@/components/ui/Icon";

export default function AuthNotFound() {
  return (
    <div className="w-full max-w-[380px] text-center animate-[fadeIn_0.4s_ease_both]">
      <div
        className="text-[64px] font-bold leading-none mb-2 select-none"
        style={{ color: "var(--color-primary)", opacity: 0.12, letterSpacing: "-0.04em" }}
        aria-hidden="true"
      >
        404
      </div>
      <div className="hud-label mb-2" style={{ color: "var(--color-primary)" }}>
        PAGE NOT FOUND
      </div>
      <h1 className="m-0 text-[16px] font-bold mb-3" style={{ color: "var(--color-foreground)" }}>
        このページは存在しません
      </h1>
      <div className="flex flex-col gap-2 mt-5">
        <Link
          href="/login"
          className="block py-2.5 px-4 rounded-sm text-[12px] font-bold tracking-[0.06em] no-underline"
          style={{
            background: "rgba(0,200,255,0.08)",
            border: "1px solid rgba(0,200,255,0.3)",
            color: "var(--color-primary)",
          }}
        >
          <Icon name="play" size={11} style={{ marginRight: 4 }} aria-hidden />ログインページへ
        </Link>
      </div>
      <div className="hud-label mt-6">KAISHOKU AGENCY — ERROR CODE 404</div>
    </div>
  );
}
