/**
 * src/app/(app)/skill-tree/SkillNodeCard.tsx
 *
 * スキル詳細パネル（DetailPanel）と分野ラベル（BranchLabels）コンポーネント。
 * SkillTreeClient.tsx から分離 (2026-03-23)。
 */
"use client";

import { useRouter }                       from "next/navigation";
import { SKILLS, BRANCHES, getBranchColor, type Skill } from "./data";
import { EXAM_REQUIRED_SKILL_IDS }         from "./examData";
import { BRANCH_ANGLES, CX, CY, TIER_R, polarToXY } from "./skill-layout";
import type { ExamResult }                 from "./types";

// ─────────────────────────────────────────────────────────────────────
// DetailPanel — 選択されたスキルの詳細パネル
// ─────────────────────────────────────────────────────────────────────

export function DetailPanel({
  skill, unlocked, available, onUnlock, totalXp, examResult,
}: {
  skill:       Skill;
  unlocked:    boolean;
  available:   boolean;
  onUnlock:    () => void;
  totalXp:     number;
  examResult?: ExamResult | null;
}) {
  const router    = useRouter();
  const color     = getBranchColor(skill.branch);
  const branch    = BRANCHES.find(b => b.id === skill.branch)!;
  const canAfford = totalXp >= skill.xpCost;
  const examReq   = EXAM_REQUIRED_SKILL_IDS.has(skill.id);
  const examPassed = examResult?.passed ?? false;
  const canActuallyUnlock =
    available && (canAfford || skill.xpCost === 0) && (!examReq || examPassed);

  const reqSkills = skill.requires
    .map(id => SKILLS.find(s => s.id === id))
    .filter(Boolean) as Skill[];

  return (
    <div
      className="rounded-sm overflow-hidden transition-all duration-200"
      style={{
        background: "var(--color-bg-raised)",
        border:     `1px solid ${color}44`,
        borderLeft: `3px solid ${color}`,
        boxShadow:  `0 0 20px ${color}11`,
      }}
    >
      {/* ヘッダー */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: `1px solid ${color}22`, background: `${color}08` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color, fontSize: "14px" }}>{skill.icon}</span>
          <span className="text-[11px] font-bold" style={{ color, letterSpacing: "0.06em" }}>
            {branch.label}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm ml-auto"
            style={{ color, background: `${color}15`, border: `1px solid ${color}33` }}>
            TIER {skill.tier}
          </span>
          {examReq && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold"
              style={{
                color:      examPassed ? "var(--color-success)" : "var(--color-warning)",
                background: examPassed ? "rgba(62,207,106,0.1)" : "rgba(255,180,60,0.1)",
                border:     `1px solid ${examPassed ? "rgba(62,207,106,0.3)" : "rgba(255,180,60,0.3)"}`,
              }}>
              {examPassed ? "✓ 認定済" : "📋 試験必須"}
            </span>
          )}
        </div>
        <div className="text-[15px] font-bold" style={{ color: "var(--color-foreground)" }}>
          {skill.label}
        </div>
      </div>

      {/* 本文 */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <p className="text-[12px] leading-relaxed m-0" style={{ color: "var(--color-fg-dim)" }}>
          {skill.description}
        </p>

        {/* 前提スキル */}
        {reqSkills.length > 0 && (
          <div>
            <div className="hud-label mb-1.5">前提スキル</div>
            <div className="flex flex-wrap gap-1.5">
              {reqSkills.map(req => {
                const rc = getBranchColor(req.branch);
                return (
                  <span
                    key={req.id}
                    className="text-[10px] px-2 py-0.5 rounded-sm"
                    style={{ color: rc, background: `${rc}15`, border: `1px solid ${rc}33` }}
                  >
                    {req.icon} {req.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 試験ブロック */}
        {examReq && (
          <div className="rounded-sm overflow-hidden"
            style={{ border: `1px solid ${examPassed ? "rgba(62,207,106,0.2)" : "rgba(255,180,60,0.2)"}` }}>
            {examResult && (
              <div className="px-3 py-2.5"
                style={{ background: examPassed ? "rgba(62,207,106,0.05)" : "rgba(255,68,68,0.05)" }}>
                <div className="hud-label mb-0.5">前回のテスト結果</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-bold"
                    style={{ color: examPassed ? "var(--color-success)" : "var(--color-danger)" }}>
                    {examPassed ? "合格" : "不合格"}
                  </span>
                  <span className="text-[11px]" style={{ color }}>
                    {examResult.score}/{examResult.total}問
                    （{Math.round((examResult.score / examResult.total) * 100)}%）
                  </span>
                  <span className="hud-label">
                    {new Date(examResult.taken_at.replace(" ", "T") + "Z")
                      .toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })} 受験
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => router.push(`/skill-tree/exam/${skill.id}`)}
              className="w-full px-3 py-2.5 text-left flex items-center justify-between cursor-pointer transition-all"
              style={{ background: "transparent", border: "none",
                borderTop: examResult ? `1px solid ${examPassed ? "rgba(62,207,106,0.15)" : "rgba(255,68,68,0.15)"}` : "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}08`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="text-[11px] font-bold"
                style={{ color: examPassed ? "var(--color-success)" : "var(--color-warning)" }}>
                {examResult
                  ? (examPassed ? "✓ テストを再受験する" : "📋 テストに再挑戦する")
                  : "📋 認定テストを受験する（必須）"}
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-fg-muted)" }}>→</span>
            </button>
          </div>
        )}

        {/* XPコスト */}
        <div className="flex items-center justify-between pt-2"
          style={{ borderTop: `1px solid ${color}18` }}>
          <div>
            <div className="hud-label mb-0.5">習得コスト</div>
            <div className="text-[16px] font-bold"
              style={{ color: skill.xpCost === 0 ? "var(--color-success)" : canAfford ? color : "var(--color-fg-muted)" }}>
              {skill.xpCost === 0 ? "無償" : `${skill.xpCost} XP`}
            </div>
          </div>
          {!unlocked ? (
            <button
              onClick={onUnlock}
              disabled={!canActuallyUnlock}
              className="px-4 py-2 rounded-sm text-[11px] font-bold tracking-[0.06em] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border:     `1px solid ${canActuallyUnlock ? color : color + "44"}`,
                color:      canActuallyUnlock ? color : `${color}55`,
                background: canActuallyUnlock ? `${color}15` : "transparent",
              }}
            >
              {!available               ? "前提未達"
               : examReq && !examPassed ? "📋 試験合格が必要"
               : !canAfford && skill.xpCost > 0 ? "XP不足"
               : "習得"}
            </button>
          ) : (
            <div className="px-4 py-2 rounded-sm text-[11px] font-bold tracking-[0.06em]"
              style={{ color: "var(--color-success)", background: "rgba(62,207,106,0.1)", border: "1px solid rgba(62,207,106,0.3)" }}>
              ✓ 習得済み
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BranchLabels — SVG外に重ねる分野ラベル
// ─────────────────────────────────────────────────────────────────────

export function BranchLabels({
  scale, offsetX, offsetY,
}: {
  scale:   number;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <>
      {BRANCHES.filter(b => b.id !== "core").map(branch => {
        const pos = polarToXY(CX, CY, TIER_R[4]! + 55, BRANCH_ANGLES[branch.id]);
        const sx  = (pos.x * scale) + offsetX;
        const sy  = (pos.y * scale) + offsetY;
        return (
          <div
            key={branch.id}
            className="absolute pointer-events-none select-none"
            style={{ left: sx, top: sy, transform: "translate(-50%, -50%)", textAlign: "center" }}
          >
            <div className="text-[9px] font-bold tracking-[0.1em]"
              style={{ color: branch.color, opacity: 0.5 }}>
              {branch.icon} {branch.label}
            </div>
          </div>
        );
      })}
    </>
  );
}
