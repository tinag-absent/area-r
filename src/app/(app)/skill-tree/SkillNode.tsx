/**
 * src/app/(app)/skill-tree/SkillNode.tsx
 *
 * SVGスキルノードコンポーネント。
 * SkillTreeClient.tsx から分離 (2026-03-23)。
 */
"use client";

import { getBranchColor } from "./data";
import type { NodePos } from "./types";

const NODE_R = 22;

export function SkillNode({
  pos, unlocked, available, selected, onSelect, examPassed, examRequired,
}: {
  pos:           NodePos;
  unlocked:      boolean;
  available:     boolean;
  selected:      boolean;
  onSelect:      (id: string) => void;
  examPassed?:   boolean;
  examRequired?: boolean;
}) {
  const { skill, x, y } = pos;
  const color  = getBranchColor(skill.branch);
  const isCore = skill.id === "core-init";

  const fillColor = unlocked
    ? color
    : available
    ? "rgba(0,0,0,0.6)"
    : "#060b10";

  const strokeColor = unlocked
    ? color
    : available
    ? `${color}88`
    : `${color}22`;

  const strokeW = selected ? 3 : unlocked ? 2 : 1;
  const opacity = unlocked ? 1 : available ? 0.8 : 0.35;
  const r = isCore ? NODE_R + 8 : NODE_R;

  return (
    <g
      onClick={() => onSelect(skill.id)}
      style={{ cursor: "pointer" }}
      opacity={opacity}
      role="button"
      aria-label={skill.label}
      aria-pressed={unlocked}
    >
      {/* グロー */}
      {(unlocked || selected) && (
        <circle
          cx={x} cy={y} r={r + 8}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.2}
          style={{ filter: `blur(4px)` }}
        />
      )}

      {/* 選択リング */}
      {selected && (
        <circle
          cx={x} cy={y} r={r + 6}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.7}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${x} ${y}`}
            to={`360 ${x} ${y}`}
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* メイン円 */}
      <circle
        cx={x} cy={y} r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeW}
        style={{
          filter: unlocked ? `drop-shadow(0 0 6px ${color}66)` : "none",
          transition: "all 0.2s",
        }}
      />

      {/* アイコン */}
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isCore ? 16 : 12}
        fill={unlocked ? "#060b10" : available ? color : `${color}55`}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {skill.icon}
      </text>

      {/* ラベル */}
      <text
        x={x} y={y + r + 11}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8.5}
        fill={unlocked ? color : available ? `${color}bb` : `${color}44`}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          fontFamily: "var(--font-mono, monospace)",
          letterSpacing: "0.04em",
        }}
      >
        {skill.label.length > 7 ? skill.label.slice(0, 7) + "…" : skill.label}
      </text>

      {/* テスト必須バッジ */}
      {examRequired && !unlocked && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={x + r - 2} cy={y - r + 2} r={6}
            fill={examPassed ? "rgba(62,207,106,0.9)" : "rgba(255,180,60,0.9)"}
            stroke="#060b10" strokeWidth={1.5}
          />
          <text
            x={x + r - 2} y={y - r + 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={7}
            fill="#060b10"
          >
            {examPassed ? "✓" : "!"}
          </text>
        </g>
      )}
    </g>
  );
}
