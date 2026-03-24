"use client";

/**
 * Card — インタラクティブコンテナ（Client Component）
 *
 * ホバー状態を持つ汎用カード。
 * ラベル付きセクション・フィールド行には CardSection / CardField / CardBody (CardParts.tsx) を使用してください。
 */

import { useState } from "react";

interface CardProps {
  children:     React.ReactNode;
  className?:   string;
  interactive?: boolean;
  locked?:      boolean;
  accent?:      string;
  onClick?:     () => void;
}

export function Card({
  children,
  className = "",
  interactive = false,
  locked = false,
  accent,
  onClick,
}: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={["rounded-sm p-4", className].join(" ")}
      style={{
        background:   hovered && interactive && !locked ? "var(--color-bg-raised)" : "var(--color-bg-surface)",
        border:       `1px solid ${hovered && interactive && !locked ? "rgba(0,200,255,0.25)" : accent ? `${accent}22` : "rgba(0,200,255,0.08)"}`,
        borderLeft:   accent ? `3px solid ${accent}55` : undefined,
        opacity:      locked ? 0.4 : 1,
        cursor:       locked ? "not-allowed" : interactive ? "pointer" : "default",
        transition:   "background 0.15s, border 0.15s",
        borderRadius: "2px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={locked ? undefined : onClick}
    >
      {children}
    </div>
  );
}
