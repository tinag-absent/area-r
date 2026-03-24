/**
 * tags/ui.tsx — タグシステム共通UIプリミティブ
 *
 * row / badge / mono / カラーマップを一箇所に集約。
 * NovelRenderer 本体・各モーダルから import して使う。
 */

import React from "react";

// ─────────────────────────────────────────────────────────────────────
// スタイル定数
// ─────────────────────────────────────────────────────────────────────

export const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
};

// ─────────────────────────────────────────────────────────────────────
// 共通カラーマップ（resolver / modal 両方で参照）
// ─────────────────────────────────────────────────────────────────────

export const THREAT_COLOR: Record<string, string> = {
  LOW:      "var(--color-success)",
  MODERATE: "var(--color-warning)",
  HIGH:     "var(--color-danger)",
  CRITICAL: "var(--color-danger)",
  UNKNOWN:  "var(--color-primary)",
};

export const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--color-danger)",
  warning:  "var(--color-warning)",
  safe:     "var(--color-success)",
  elevated: "var(--color-warning)",
  normal:   "var(--color-fg-muted)",
};

export const ENERGY_COLOR: Record<string, string> = {
  低:  "var(--color-primary)",
  中:  "var(--color-primary)",
  高:  "var(--color-warning)",
  超高: "var(--color-warning)",
  極高: "var(--color-danger)",
};

export const OUTCOME_COLOR: Record<string, string> = {
  success:    "var(--color-success)",
  partial:    "var(--color-warning)",
  failure:    "var(--color-danger)",
  classified: "var(--color-fg-muted)",
};

export const EVENT_STATUS_COLOR: Record<string, string> = {
  scheduled: "var(--color-primary)",
  published: "var(--color-success)",
  fired:     "var(--color-fg-muted)",
};

export const MEMO_STATUS_COLOR: Record<string, string> = {
  recovered:  "var(--color-success)",
  partial:    "var(--color-warning)",
  corrupted:  "var(--color-danger)",
  classified: "rgba(255,255,255,0.55)",
};

export const CATEGORY_COLOR: Record<string, string> = {
  general: "rgba(255,255,255,0.4)",
  report:  "var(--color-primary)",
  request: "var(--color-warning)",
};

// ─────────────────────────────────────────────────────────────────────
// row — キー/値の1行（モーダル内共通レイアウト）
// ─────────────────────────────────────────────────────────────────────

export function Row({
  label,
  value,
  highlight = false,
  accentColor,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  accentColor?: string;
}) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "baseline",
      padding: "5px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{
        ...MONO, fontSize: 11, letterSpacing: "0.1em",
        color: accentColor ? `${accentColor}55` : "rgba(255,255,255,0.55)",
        minWidth: 110, flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        ...MONO, fontSize: 11,
        color: highlight && accentColor ? accentColor : "rgba(255,255,255,0.7)",
        fontWeight: highlight ? 700 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Badge — ステータス・種別バッジ
// ─────────────────────────────────────────────────────────────────────

export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      ...MONO, fontSize: 10, letterSpacing: "0.1em",
      padding: "1px 6px", borderRadius: 2,
      border:     `1px solid ${color}55`,
      background: `${color}14`,
      color,
    }}>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ModalShell — モーダル共通シェル（背景・外枠・ヘッダー・IDストリップ）
// ─────────────────────────────────────────────────────────────────────

interface ModalShellProps {
  icon:      string;
  title:     string;
  subtitle?: string;
  code?:     string;
  color:     string;
  idLabel:   string;
  onClose:   () => void;
  width?:    string;
  children:  React.ReactNode;
  accentBg?: string; // ヘッダー背景色（OBSERVERなど特殊演出用）
}

export function ModalShell({
  icon, title, subtitle, code, color, idLabel, onClose,
  width = "min(520px, 94vw)", children, accentBg,
}: ModalShellProps) {
  const headerBg = accentBg ?? "transparent";
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width, maxHeight: "80vh",
        background: "rgba(8,10,14,0.98)",
        border: `1px solid ${color}33`,
        borderRadius: 4,
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: `0 0 40px ${color}08`,
      }}>
        {/* ヘッダー */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          borderBottom: `1px solid ${color}18`,
          background: headerBg,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              ...MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
              color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          {code && (
            <span style={{
              ...MONO, fontSize: 11,
              color: `${color}88`,
              border: `1px solid ${color}33`,
              padding: "1px 6px", borderRadius: 2, flexShrink: 0,
            }}>
              {code}
            </span>
          )}
          <span
            onClick={onClose}
            style={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}
          >
            ✕
          </span>
        </div>

        {/* ID ストリップ */}
        <div style={{
          ...MONO, fontSize: 11, letterSpacing: "0.12em",
          color: `${color}40`,
          padding: "4px 14px 5px",
          borderBottom: `1px solid ${color}0a`,
          flexShrink: 0,
        }}>
          {idLabel}
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BadgeRow — バッジを横並びにするコンテナ
// ─────────────────────────────────────────────────────────────────────

export function BadgeRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DescBlock — 説明文ブロック
// ─────────────────────────────────────────────────────────────────────

export function DescBlock({ text, color, fontFamily }: { text: string; color?: string; fontFamily?: string }) {
  return (
    <div style={{
      marginTop: 12,
      ...MONO,
      fontFamily: fontFamily ?? "var(--font-mono, monospace)",
      fontSize: 11,
      color: color ?? "rgba(255,255,255,0.5)",
      lineHeight: 1.8,
    }}>
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SectionHeader — FINDINGS / OBJECTIVES 等の小見出し
// ─────────────────────────────────────────────────────────────────────

export function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      ...MONO, fontSize: 11, letterSpacing: "0.1em",
      color: "rgba(255,255,255,0.55)",
      marginBottom: 6,
    }}>
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WarningBox — ⚠ 警告ボックス
// ─────────────────────────────────────────────────────────────────────

export function WarningBox({ text }: { text: string }) {
  return (
    <div style={{
      marginTop: 10, ...MONO, fontSize: 10,
      color: "var(--color-warning)",
      padding: "6px 10px",
      background: "rgba(255,180,60,0.06)",
      border: "1px solid rgba(255,180,60,0.2)",
      borderRadius: 2,
    }}>
      ⚠ {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ListItem — FINDINGS / PROCEDURE 等のリストアイテム
// ─────────────────────────────────────────────────────────────────────

export function ListItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{
      ...MONO, fontSize: 10,
      color: "rgba(255,255,255,0.45)",
      padding: "3px 0 3px 10px",
      borderLeft: `2px solid ${color}44`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LoadingPlaceholder / ErrorPlaceholder
// ─────────────────────────────────────────────────────────────────────

export function LoadingPlaceholder() {
  return (
    <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
      読み込み中…
    </div>
  );
}

export function ErrorPlaceholder({ message }: { message: string }) {
  return (
    <div style={{ ...MONO, fontSize: 11, color: "var(--color-danger)" }}>
      {message}
    </div>
  );
}
