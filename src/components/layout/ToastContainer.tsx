"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useBoundStore } from "@/store";
import type { ToastType } from "@/store";
import { Icon, NavIcon } from "@/components/ui/Icon";

const TOAST_CONFIG: Record<ToastType, { accent: string; icon: string; label: string }> = {
  xp:          { accent: "#3ecf6a", icon: "entity", label: "XP ACQUIRED" },
  levelup:     { accent: "#00c8ff", icon: "★", label: "CLEARANCE UP" },
  login:       { accent: "#00c8ff", icon: "dashboard", label: "ACCESS LOG" },
  unlock:      { accent: "#00c8ff", icon: "database", label: "UNLOCKED" },
  mission:     { accent: "#ffb43c", icon: "mission", label: "MISSION" },
  info:        { accent: "#00c8ff", icon: "chat", label: "INFO" },
  achievement: { accent: "#3ecf6a", icon: "entity", label: "ACHIEVEMENT" },
  warning:     { accent: "#ffb43c", icon: "warning", label: "WARNING" },
  system:      { accent: "#4a6878", icon: "hex", label: "SYSTEM" },
  error:       { accent: "#ff4444", icon: "✕", label: "ERROR" },
  story:       { accent: "#ce93d8", icon: "mission", label: "TRANSMISSION" },
};
const DEFAULT_CONFIG = { accent: "#00c8ff", icon: "chat", label: "NOTICE" };

function ToastItem({ t, onRemove }: { t: { id: string; type: ToastType; title: string; body?: string; duration?: number }; onRemove: () => void }) {
  const cfg = TOAST_CONFIG[t.type] ?? DEFAULT_CONFIG;
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const duration   = useRef(t.duration ?? 5000);
  const startedAt  = useRef(Date.now());
  const remaining  = useRef(duration.current);
  const raf        = useRef<number>(0);

  useEffect(() => {
    const tid = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(tid);
  }, []);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startedAt.current;
    const pct = Math.max(0, ((remaining.current - elapsed) / duration.current) * 100);
    setProgress(pct);
    if (pct > 0) { raf.current = requestAnimationFrame(tick); }
    else { onRemove(); }
  }, [onRemove]);

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [paused, tick]);

  return (
    <div
      role={t.type === "error" || t.type === "warning" ? "alert" : "status"}
      aria-atomic="true"
      onMouseEnter={() => { cancelAnimationFrame(raf.current); remaining.current -= Date.now() - startedAt.current; setPaused(true); }}
      onMouseLeave={() => setPaused(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 0.15s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
        background: "#080f18",
        border: `1px solid ${cfg.accent}33`,
        borderLeft: `2px solid ${cfg.accent}`,
        boxShadow: `0 4px 32px rgba(0,0,0,0.8), 0 0 20px ${cfg.accent}14, inset 0 0 20px rgba(0,0,0,0.4)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* スキャンライン */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
      }} />
      {/* ヘッダーバー */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px", borderBottom: `1px solid ${cfg.accent}1a`, background: `${cfg.accent}09`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <NavIcon icon={cfg.icon} size={11} color={cfg.accent} />
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: cfg.accent, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            {cfg.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: `${cfg.accent}55`, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            {new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button onClick={onRemove} aria-label={`通知「${t.title}」を閉じる`}
            style={{ background: "none", border: "none", color: `${cfg.accent}55`, fontSize: 11, padding: 0, lineHeight: 1, cursor: "pointer", fontFamily: "var(--font-mono)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = cfg.accent)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = `${cfg.accent}55`)}>
            ✕
          </button>
        </div>
      </div>
      {/* 本文 */}
      <div style={{ padding: "8px 10px 6px" }}>
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#a8c8de", lineHeight: 1.4, marginBottom: t.body ? 4 : 0, fontFamily: "var(--font-mono)" }}>
          {t.title}
        </div>
        {t.body && (
          <div style={{ fontSize: 11, color: "#4a6878", lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>{t.body}</div>
        )}
      </div>
      {/* プログレスバー */}
      <div style={{ height: 2, background: `${cfg.accent}18` }}>
        <div style={{ height: "100%", width: `${progress}%`, background: cfg.accent, boxShadow: `0 0 6px ${cfg.accent}`, transition: paused ? "none" : undefined }} />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts      = useBoundStore(s => s.toasts);
  const removeToast = useBoundStore(s => s.removeToast);
  if (!toasts.length) return null;
  return (
    <div aria-label="通知" className="toast-container" style={{
      position: "fixed", bottom: 20, right: 20,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9000, width: "min(320px, calc(100vw - 2.5rem))",
    }}>
      {toasts.map(t => <ToastItem key={t.id} t={t} onRemove={() => removeToast(t.id)} />)}
    </div>
  );
}
