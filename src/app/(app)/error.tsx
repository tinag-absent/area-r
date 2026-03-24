"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon, NavIcon } from "@/components/ui/Icon";

// HTTPステータスコードに応じた表示設定
const ERROR_CONFIG: Record<number, {
  code: string;
  title: string;
  message: string;
  accent: string;
  accentRgb: string;
}> = {
  400: {
    code: "400",
    title: "不正なリクエスト",
    message: "リクエストの形式が正しくありません。入力内容を確認してください。",
    accent: "var(--color-warning)",
    accentRgb: "255,180,60",
  },
  401: {
    code: "401",
    title: "認証が必要です",
    message: "このリソースにアクセスするにはログインが必要です。",
    accent: "var(--color-primary)",
    accentRgb: "0,200,255",
  },
  403: {
    code: "403",
    title: "アクセスが拒否されました",
    message: "このリソースへのアクセス権限がありません。クリアランスレベルが不足している可能性があります。",
    accent: "var(--color-danger)",
    accentRgb: "255,68,68",
  },
  404: {
    code: "404",
    title: "ページが見つかりません",
    message: "アクセスしようとしたリソースは削除されたか、URLが正しくない可能性があります。",
    accent: "var(--color-primary)",
    accentRgb: "0,200,255",
  },
  409: {
    code: "409",
    title: "競合が発生しました",
    message: "リクエストが現在のリソースの状態と競合しています。",
    accent: "var(--color-warning)",
    accentRgb: "255,180,60",
  },
  429: {
    code: "429",
    title: "リクエストが多すぎます",
    message: "短時間に多くのリクエストが送信されました。しばらく待ってから再試行してください。",
    accent: "var(--color-warning)",
    accentRgb: "255,180,60",
  },
};

const DEFAULT_CONFIG = {
  code: "500",
  title: "システムエラーが発生しました",
  message: "予期しないエラーが検出されました。問題が続く場合は管理者に報告してください。",
  accent: "var(--color-danger)",
  accentRgb: "255,68,68",
};

function getStatusCode(error: Error & { digest?: string; status?: number }): number | null {
  if (error.status) return error.status;
  // digest からステータスコードを推測（Next.js は "NEXT_HTTP_ERROR_FALLBACK;404" のような形式）
  if (error.digest) {
    const m = error.digest.match(/(\d{3})/);
    if (m?.[1]) return parseInt(m[1], 10);
  }
  // エラーメッセージからステータスを推測
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("404") || msg.includes("not found")) return 404;
  if (msg.includes("403") || msg.includes("forbidden")) return 403;
  if (msg.includes("401") || msg.includes("unauthorized")) return 401;
  if (msg.includes("400") || msg.includes("bad request")) return 400;
  if (msg.includes("429") || msg.includes("rate limit")) return 429;
  return null;
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  const statusCode = getStatusCode(error);
  const cfg: typeof DEFAULT_CONFIG =
    (statusCode !== null ? ERROR_CONFIG[statusCode] : undefined) ?? DEFAULT_CONFIG;
  const is4xx = statusCode !== null && statusCode >= 400 && statusCode < 500;

  return (
    <div
      className="animate-[fadeIn_0.4s_ease_both] flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 0px)" }}
    >
      <div className="px-6 py-10 w-full max-w-[480px] text-center">

        {/* ステータスコード（大）*/}
        <div
          className="text-[96px] font-bold leading-none mb-1 select-none"
          style={{
            color: cfg.accent,
            opacity: 0.1,
            letterSpacing: "-0.04em",
          }}
          aria-hidden="true"
        >
          {cfg.code}
        </div>

        <div className="hud-label mb-2" style={{ color: cfg.accent }}>
          {is4xx ? "CLIENT ERROR" : "SYSTEM ERROR"} — {cfg.code}
        </div>

        <h1
          className="m-0 text-[18px] font-bold mb-3"
          style={{ color: "var(--color-foreground)", letterSpacing: "0.02em" }}
        >
          {cfg.title}
        </h1>

        <p
          className="text-[12px] leading-relaxed mb-6 m-0"
          style={{ color: "var(--color-fg-dim)" }}
        >
          {cfg.message}
        </p>

        {/* エラー詳細（開発時・5xx時のみ表示）*/}
        {!is4xx && error.message && (
          <div
            className="rounded-sm p-3 mb-6 text-left"
            style={{
              background: `rgba(${cfg.accentRgb},0.04)`,
              border: `1px solid rgba(${cfg.accentRgb},0.15)`,
            }}
          >
            <div className="hud-label mb-1" style={{ color: cfg.accent }}>
              ERROR DETAILS
            </div>
            <p
              className="m-0 text-[11px] font-mono break-all"
              style={{ color: "var(--color-fg-dim)" }}
            >
              {error.message.slice(0, 200)}
            </p>
            {error.digest && (
              <p className="m-0 mt-1 text-[10px]" style={{ color: "var(--color-fg-muted)" }}>
                digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* アクション */}
        <div className="flex flex-col gap-2">
          {statusCode === 401 ? (
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
          ) : (
            <Button
              onClick={reset}
              className="w-full justify-center"
            >
              <Icon name="play" size={11} style={{ marginRight: 4 }} aria-hidden />再試行
            </Button>
          )}
          <Link
            href="/dashboard"
            className="block py-2 px-4 rounded-sm text-[11px] no-underline"
            style={{
              border: "1px solid rgba(0,200,255,0.1)",
              color: "var(--color-fg-muted)",
            }}
          >
            ダッシュボードへ戻る
          </Link>
        </div>

        <div className="hud-label mt-8">
          KAISHOKU AGENCY — ERROR CODE {cfg.code}
        </div>
      </div>
    </div>
  );
}
