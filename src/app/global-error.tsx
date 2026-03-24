/**
 * global-error.tsx — グローバルエラーページ（500）
 * Updated: 2026-03-19 04:10 JST — bodyにcolorScheme:darkを追加しOSライトモード時の文字色崩れを修正
 */
"use client";

import { useEffect } from "react";
import { Icon, NavIcon } from "@/components/ui/Icon";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#060b10",
          color: "#b8d0e4",
          fontFamily: "'Share Tech Mono', 'Courier New', monospace",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          colorScheme: "dark",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2.5rem",
            maxWidth: "420px",
            width: "100%",
          }}
        >
          {/* ステータスコード */}
          <div
            style={{
              fontSize: "80px",
              fontWeight: "bold",
              color: "#ff4444",
              opacity: 0.12,
              lineHeight: 1,
              marginBottom: "8px",
              letterSpacing: "-0.04em",
            }}
            aria-hidden="true"
          >
            500
          </div>

          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: "#ff4444",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            CRITICAL SYSTEM ERROR
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "17px",
              fontWeight: "bold",
              color: "#b8d0e4",
              letterSpacing: "0.02em",
            }}
          >
            重大なエラーが発生しました
          </h1>

          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.7,
              color: "#527080",
              marginBottom: "24px",
            }}
          >
            アプリケーションの最上位でエラーが検出されました。
            <br />
            問題が続く場合は管理者に報告してください。
          </p>

          {error.digest && (
            <div
              style={{
                fontSize: "10px",
                color: "#3d5a6e",
                marginBottom: "20px",
                padding: "8px 12px",
                background: "rgba(255,68,68,0.04)",
                border: "1px solid rgba(255,68,68,0.12)",
                borderRadius: "2px",
                textAlign: "left",
                fontFamily: "monospace",
              }}
            >
              digest: {error.digest}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 16px",
                background: "rgba(255,68,68,0.08)",
                border: "1px solid rgba(255,68,68,0.3)",
                borderRadius: "2px",
                color: "#ff4444",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              <Icon name="play" size={11} style={{ marginRight: 4 }} aria-hidden />再試行
            </button>
            <a
              href="/dashboard"
              style={{
                display: "block",
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid rgba(0,200,255,0.1)",
                borderRadius: "2px",
                color: "#3d5a6e",
                fontSize: "11px",
                textDecoration: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ダッシュボードへ戻る
            </a>
          </div>

          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: "#243848",
              marginTop: "24px",
              textTransform: "uppercase",
            }}
          >
            KAISHOKU AGENCY — ERROR CODE 500
          </div>
        </div>
      </body>
    </html>
  );
}
