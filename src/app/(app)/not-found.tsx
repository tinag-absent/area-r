"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, NavIcon } from "@/components/ui/Icon";

const GLITCH_CHARS = "◈◆◎⬡◐◉▣░▒▓ΨΩΛΞΠΣΦω";
const ERROR_MSGS = [
  "RECORD_NOT_FOUND :: index 0x4E4F_464F_554E44",
  "次元データの取得に失敗しました。座標が存在しません。",
  "ACCESS_LOG: UNKNOWN_PATH — 記録されていません",
  "該当リソースは削除されたか、あなたのクリアランスでは存在しないかもしれません。",
];

export default function AppNotFound() {
  const [glitch, setGlitch] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // スキャンアニメーション
    let pct = 0;
    const scanIv = setInterval(() => {
      pct = Math.min(pct + 3, 100);
      setScanPct(pct);
      if (pct >= 100) { clearInterval(scanIv); setDone(true); }
    }, 30);

    // グリッチ文字
    const glitchIv = setInterval(() => {
      const len = Math.floor(Math.random() * 16) + 6;
      setGlitch(Array.from({ length: len }, () =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join(""));
    }, 100);

    // メッセージローテーション
    const msgIv = setInterval(() => {
      setMsgIdx(i => (i + 1) % ERROR_MSGS.length);
    }, 1800);

    return () => { clearInterval(scanIv); clearInterval(glitchIv); clearInterval(msgIv); };
  }, []);

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 0px)" }}>
      <div className="px-6 py-10 w-full max-w-[520px]">

        {/* ステータスコード */}
        <div style={{ fontSize: 96, fontWeight: "bold", lineHeight: 1, marginBottom: 4,
          color: "var(--color-primary)", opacity: 0.07, letterSpacing: "-0.04em",
          fontFamily: "var(--font-mono)", textAlign: "center" }} aria-hidden="true">
          404
        </div>

        {/* グリッチヘッダー */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="hud-label" style={{ color: "var(--color-danger)", marginBottom: 6 }}>
            DIMENSIONAL ANCHOR LOST
          </div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "var(--color-foreground)",
            letterSpacing: "0.02em", marginBottom: 4 }}>
            座標が存在しません
          </div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-primary)",
            minHeight: 18, letterSpacing: "0.08em" }}>
            {done ? "SCAN COMPLETE — NO SIGNAL" : glitch}
          </div>
        </div>

        {/* スキャンバー */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
              {done ? "DEEP SCAN" : "SCANNING"}
            </span>
            <span className="hud-label" style={{ color: done ? "var(--color-danger)" : "var(--color-primary)" }}>
              {done ? "ERROR" : `${scanPct}%`}
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(0,200,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${scanPct}%`,
              background: done ? "var(--color-danger)" : "var(--color-primary)",
              transition: "background 0.3s",
              boxShadow: `0 0 6px ${done ? "var(--color-danger)" : "var(--color-primary)"}`,
            }} />
          </div>
        </div>

        {/* ターミナルログ */}
        <div style={{
          background: "#030a12", border: "1px solid rgba(0,200,255,0.1)",
          borderRadius: 2, padding: "12px 14px", marginBottom: 20,
          minHeight: 80,
        }}>
          <div className="hud-label" style={{ color: "var(--color-primary)", marginBottom: 6 }}>
            <Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />SYSTEM LOG
          </div>
          {ERROR_MSGS.slice(0, msgIdx + 1).map((m, i) => (
            <div key={i} style={{
              fontSize: 11, fontFamily: "var(--font-mono)", lineHeight: 1.7,
              color: i === msgIdx ? "var(--color-fg-dim)" : "rgba(0,200,255,0.3)",
              transition: "color 0.3s",
            }}>
              {i === msgIdx && <span style={{ color: "var(--color-primary)" }}>›</span>} {m}
            </div>
          ))}
        </div>

        {/* アクション */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link href="/dashboard"
            style={{
              display: "block", padding: "10px 16px", borderRadius: 2, textDecoration: "none",
              textAlign: "center", fontSize: 12, fontWeight: "bold", letterSpacing: "0.08em",
              fontFamily: "var(--font-mono)",
              background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.3)",
              color: "var(--color-primary)",
            }}>
            <Icon name="play" size={11} style={{ marginRight: 4 }} aria-hidden />ダッシュボードに帰還
          </Link>
          <Link href="/map"
            style={{
              display: "block", padding: "8px 16px", borderRadius: 2, textDecoration: "none",
              textAlign: "center", fontSize: 11,
              border: "1px solid rgba(0,200,255,0.1)", color: "var(--color-fg-muted)",
            }}>
            海蝕マップで位置を確認する
          </Link>
        </div>

        <div className="hud-label" style={{ textAlign: "center", marginTop: 24,
          color: "var(--color-fg-decorative)" }}>
          KAISHOKU AGENCY — ERROR CODE 404
        </div>
      </div>
    </div>
  );
}
