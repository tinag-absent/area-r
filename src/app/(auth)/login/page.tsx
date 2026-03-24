/*
 * login/page.tsx — ログインページ
 * Updated: 2026-03-19 04:25 JST — KAISHOKUロゴにIgyouMincho適用
 * Updated: 2026-03-24 — パスワード表示トグルボタンを追加
 */
"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiPost, safeRedirectPath, parseResponse, getErrorMessage } from "@/lib/api-client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon, NavIcon } from "@/components/ui/Icon";

function LoginForm() {
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const expired = params.get("expired");
  const from = params.get("from") ?? "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await apiPost("/api/auth/login", { username, password })
        .then(res => parseResponse(res));
      try { new BroadcastChannel("sea-auth").postMessage({ type: "login" }); } catch {}
      window.location.href = safeRedirectPath(from);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="animate-[fadeIn_0.4s_ease_both] w-full max-w-[380px]"
      style={{ position: "relative" }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="text-[26px] font-bold tracking-[0.14em] mb-1"
          style={{
            color: "var(--color-primary)",
            fontFamily: "var(--font-display)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            animation: "var(--animate-flicker)",
          }}
        >
          <Icon name="dashboard" size={22} style={{ marginRight: 6 }} aria-hidden />KAISHOKU
        </div>
        <div className="hud-label">海蝕機関 — 機関員認証システム</div>
      </div>

      {expired && (
        <div
          className="text-[12px] mb-4 px-3.5 py-2.5 rounded-sm"
          style={{
            background: "rgba(255,180,60,0.06)",
            border: "1px solid rgba(255,180,60,0.25)",
            color: "var(--color-warning)",
          }}
        >
          <Icon name="warning" size={12} style={{ marginRight: 4 }} aria-hidden />セッションが期限切れです。再度認証してください。
        </div>
      )}

      <div
        className="bracket rounded-sm p-5"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid rgba(0,200,255,0.1)",
        }}
      >
        <div className="hud-label mb-5">— 身元確認プロトコル —</div>

        {error && <ErrorMessage id="login-error" message={error} />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-username" className="hud-label mb-1.5 block">
              機関員ID / LOGIN
            </label>
            <input
              id="login-username"
              className="input-base"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="例: agent_001"
              autoComplete="username"
              aria-required="true"
              aria-describedby={error ? "login-error" : undefined}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="hud-label mb-1.5 block">
              パスキー / PASSKEY
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                className="input-base"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-required="true"
                aria-describedby={error ? "login-error" : undefined}
                style={{ paddingRight: "2.4rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "パスキーを隠す" : "パスキーを表示"}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
                  color: "var(--color-fg-dim)", display: "flex", alignItems: "center",
                }}
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={14} aria-hidden />
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} isLoading={loading} className="w-full mt-1">
            {loading ? "認証中…" : <><Icon name="play" size={11} aria-hidden /> 認証開始</>}
          </Button>
        </form>

        <div
          className="mt-4 pt-4 text-center text-[12px]"
          style={{
            borderTop: "1px solid rgba(0,200,255,0.07)",
            color: "var(--color-fg-dim)",
          }}
        >
          機関員登録がお済みでない方 →{" "}
          <Link href="/register" className="no-underline hover:underline" style={{ color: "var(--color-primary)" }}>
            新規着任申請
          </Link>
        </div>
        <div className="mt-2 text-center text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
          パスキーを忘れた方 →{" "}
          <Link href="/reset-password" className="no-underline hover:underline" style={{ color: "var(--color-fg-dim)" }}>
            パスキー再設定
          </Link>
        </div>
      </div>

      <div className="mt-4 text-center hud-label">
        CLASSIFIED SYSTEM — UNAUTHORIZED ACCESS PROHIBITED
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="animate-pulse w-full max-w-[380px]">
      <div className="text-center mb-8">
        <div className="h-7 w-36 rounded mx-auto mb-2" style={{ background: "rgba(0,200,255,0.08)" }} />
        <div className="h-3 w-44 rounded mx-auto" style={{ background: "rgba(0,200,255,0.05)" }} />
      </div>
      <div className="rounded-sm p-5" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}>
        <div className="h-3 w-32 rounded mb-5" style={{ background: "rgba(0,200,255,0.05)" }} />
        <div className="h-9 w-full rounded mb-3" style={{ background: "rgba(0,200,255,0.05)" }} />
        <div className="h-9 w-full rounded mb-3" style={{ background: "rgba(0,200,255,0.05)" }} />
        <div className="h-9 w-full rounded" style={{ background: "rgba(0,200,255,0.05)" }} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
