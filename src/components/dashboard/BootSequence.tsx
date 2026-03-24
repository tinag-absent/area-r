/*
 * BootSequence.tsx — 起動演出コンポーネント
 * Updated: 2026-03-19 04:25 JST — KAISHOKUロゴにIgyouMincho、ブートラインにIsego適用・ロゴ文字拡大
 */
"use client";
import { useState, useEffect } from "react";
import { Icon, NavIcon } from "@/components/ui/Icon";

const BOOT_LINES = [
  { text: "KAISHOKU AGENCY TERMINAL v4.1", color: "#00c8ff", delay: 0 },
  { text: "DIMENSIONAL OBSERVATION SYSTEM — INITIALIZING", color: "#4a6878", delay: 80 },
  { text: "CHECKING CLEARANCE TOKEN ................... OK", color: "#4a6878", delay: 160 },
  { text: "ESTABLISHING DIMENSIONAL LINK .............. OK", color: "#4a6878", delay: 240 },
  { text: "LOADING ANOMALY MONITORING MODULES ......... OK", color: "#4a6878", delay: 320 },
  { text: "SYNCHRONIZING OBSERVER NETWORK ............. OK", color: "#4a6878", delay: 400 },
  { text: "ALL SYSTEMS NOMINAL — WELCOME, AGENT", color: "#3ecf6a", delay: 500 },
];

export function BootSequence({ onComplete }: { onComplete?: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "kaishoku_boot_shown";
    if (sessionStorage.getItem(key)) { setDone(true); onComplete?.(); return; }

    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), _.delay));
    });
    timers.push(setTimeout(() => {
      setDone(true);
      sessionStorage.setItem(key, "1");
      onComplete?.();
    }, 700));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (done) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "#02050a",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* スキャンライン */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)",
      }} />
      {/* ビネット */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 90%)",
      }} />

      <div style={{ width: "min(600px, 90vw)", fontFamily: "var(--font-mono)", position: "relative" }}>
        {/* ロゴ */}
        <div style={{
          fontSize: 18, letterSpacing: "0.3em", color: "rgba(0,200,255,0.7)",
          marginBottom: 24, textAlign: "center",
          fontFamily: "var(--font-display)",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textShadow: "0 0 20px rgba(0,200,255,0.4)",
        }}>
          <><Icon name="dashboard" size={16} aria-hidden /> K A I S H O K U <Icon name="dashboard" size={16} aria-hidden /></>
        </div>

        {/* ブートライン */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} style={{
              fontSize: 11, color: line.color, letterSpacing: "0.06em",
              animation: "boot-line 0.15s ease both",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-hud)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}>
              <span style={{ color: "rgba(0,200,255,0.25)", flexShrink: 0 }}>›</span>
              <span>{line.text}</span>
            </div>
          ))}
          {/* カーソル */}
          {visibleLines < BOOT_LINES.length && (
            <div style={{ fontSize: 11, color: "#00c8ff", display: "flex", gap: 8 }}>
              <span style={{ color: "rgba(0,200,255,0.25)" }}>›</span>
              <span style={{ animation: "blink 1s step-end infinite" }}>█</span>
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={{ marginTop: 32, fontSize: 9, color: "rgba(0,200,255,0.15)", letterSpacing: "0.15em", textAlign: "center" }}>
          CLASSIFIED SYSTEM — UNAUTHORIZED ACCESS PROHIBITED
        </div>
      </div>
    </div>
  );
}
