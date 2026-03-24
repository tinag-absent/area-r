// Edited: import path updated layout.ts → skill-layout.ts (2026-03-24)
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { EXAM_REQUIRED_SKILL_IDS } from "./examData";
import { Icon } from "@/components/ui/Icon";
import {
  SKILLS, BRANCHES, canUnlock, getBranchColor,
  type Skill, type BranchId,
} from "./data";
import { SkillNode }                              from "./SkillNode";
import { DetailPanel, BranchLabels }              from "./SkillNodeCard";
import { NODE_POSITIONS, POS_MAP, ALL_EDGES,
         CX, CY, TIER_R, BRANCH_ANGLES, FAN_WIDTH,
         polarToXY, BRANCH_LABEL_POSITIONS }      from "./skill-layout";
import type { NodePos, Edge, ExamResultCache }    from "./types";
import { useSkillTree }                           from "./useSkillTree";


// (layout computation moved to skill-layout.ts)

// ─────────────────────────────────────────────────────────────────────
// 詳細パネル
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────────────────────────────

const INITIAL_XP = 800; // デモ用の初期XP

export function SkillTreeClient({ userXp = INITIAL_XP }: { userXp?: number }) {
  const {
    unlockedIds, selectedId, spentXp, examResults,
    filterBranch, showUnlockedOnly, showExamRequired, showAffordable,
    highlightPath, anomalyWarning, compareId, compareMode,
    totalXp, selectedSkill,
    setSelectedId, setFilterBranch,
    setShowUnlockedOnly, setShowExamRequired, setShowAffordable,
    setHighlightPath, setAnomalyWarning, setCompareId, setCompareMode,
    handleUnlock, handleSelect, getAnomalyDelta, computePath,
  } = useSkillTree(userXp);

  // パン・ズーム（コンポーネント固有のUI状態）
  const [scale, setScale]       = useState(0.72);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const svgRef    = useRef<SVGSVGElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

    // ズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.35, Math.min(1.6, prev - e.deltaY * 0.001)));
  }, []);

  // パン
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest("[role='button']")) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  // フィルタ時に表示するノード
  const visibleNodes = useMemo(() => {
    let nodes = NODE_POSITIONS;
    // ブランチフィルター
    if (filterBranch !== "all") {
      nodes = nodes.filter(p =>
        p.skill.branch === filterBranch ||
        p.skill.id === "core-init" ||
        p.skill.requires.some(reqId => {
          const req = SKILLS.find(s => s.id === reqId);
          return req?.branch === filterBranch;
        })
      );
    }
    // 習得済みのみ
    if (showUnlockedOnly) {
      nodes = nodes.filter(p => unlockedIds.has(p.id) || p.id === "core-init");
    }
    // 試験必須のみ
    if (showExamRequired) {
      nodes = nodes.filter(p => EXAM_REQUIRED_SKILL_IDS.has(p.id) || p.id === "core-init");
    }
    // XP手が届くもののみ（totalXp以下のコスト）
    if (showAffordable) {
      nodes = nodes.filter(p => p.skill.xpCost <= totalXp || unlockedIds.has(p.id) || p.id === "core-init");
    }
    return nodes;
  }, [filterBranch, showUnlockedOnly, showExamRequired, showAffordable, unlockedIds, totalXp]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map(p => p.id)), [visibleNodes]);

  const visibleEdges = useMemo(() =>
    ALL_EDGES.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to)),
    [visibleIds]
  );

  const svgSize = 1200;
  const viewBox = `0 0 ${svgSize} ${svgSize}`;

  const unlockedCount   = unlockedIds.size - 1; // core-init を除く
  const availableCount  = SKILLS.filter(s =>
    !unlockedIds.has(s.id) && canUnlock(s.id, unlockedIds)
  ).length;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", background: "var(--color-bg)" }}>

      {/* ─── ヘッダー ─── */}
      <div
        className="shrink-0 flex flex-wrap items-center gap-4 px-5 py-3"
        style={{ borderBottom: "1px solid rgba(0,200,255,0.1)", background: "var(--color-bg-surface)" }}
      >
        <div>
          <div className="hud-label">SKILL NETWORK</div>
          <div className="text-[15px] font-bold" style={{ color: "var(--color-foreground)" }}>スキルツリー</div>
        </div>

        {/* ステータス */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: "習得済み", value: unlockedCount, color: "var(--color-success)" },
            { label: "習得可能", value: availableCount, color: "var(--color-primary)" },
            { label: "残りXP",  value: totalXp.toLocaleString(), color: "var(--color-warning)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="hud-label">{label}</div>
              <div className="text-[14px] font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 分野フィルター */}
        <div className="flex gap-1 flex-wrap ml-auto">
          <button
            onClick={() => setFilterBranch("all")}
            className="px-2.5 py-1 text-[11px] font-bold rounded-sm cursor-pointer transition-all"
            style={{
              background: filterBranch === "all" ? "rgba(0,200,255,0.12)" : "transparent",
              border: `1px solid ${filterBranch === "all" ? "var(--color-fg-dim)" : "rgba(0,200,255,0.1)"}`,
              color: filterBranch === "all" ? "var(--color-primary)" : "var(--color-fg-muted)",
            }}
          >
            ALL
          </button>
          {BRANCHES.filter(b => b.id !== "core").map(branch => (
            <button
              key={branch.id}
              onClick={() => setFilterBranch(branch.id)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-sm cursor-pointer transition-all"
              title={branch.label}
              style={{
                background: filterBranch === branch.id ? `${branch.color}18` : "transparent",
                border: `1px solid ${filterBranch === branch.id ? `${branch.color}55` : `${branch.color}22`}`,
                color: filterBranch === branch.id ? branch.color : `${branch.color}88`,
              }}
            >
              {branch.icon}
            </button>
          ))}
          {/* 区切り */}
          <span style={{ width: 1, background: "rgba(0,200,255,0.1)", margin: "2px 2px" }} />
          {/* 拡張フィルター */}
          {([
            { label: "習得済", state: showUnlockedOnly, toggle: () => setShowUnlockedOnly(!showUnlockedOnly), title: "習得済みスキルのみ表示" },
            { label: "試験", state: showExamRequired, toggle: () => setShowExamRequired(!showExamRequired), title: "試験必須スキルのみ" },
            { label: "手が届く", state: showAffordable, toggle: () => setShowAffordable(!showAffordable), title: `XP ${totalXp}以下のスキルのみ` },
            { label: "比較", state: compareMode, toggle: () => { setCompareMode(!compareMode); if (compareMode) setCompareId(null); }, title: "スキル比較モード" },
          ] as { label: string; state: boolean; toggle: () => void; title: string }[]).map(({ label, state, toggle, title }) => (
            <button key={label} onClick={toggle} title={title}
              className="px-2.5 py-1 text-[11px] font-bold rounded-sm cursor-pointer transition-all"
              style={{
                background: state ? "rgba(255,180,60,0.12)" : "transparent",
                border: `1px solid ${state ? "rgba(255,180,60,0.4)" : "rgba(255,180,60,0.15)"}`,
                color: state ? "var(--color-warning)" : "rgba(255,180,60,0.4)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ズームコントロール */}
        <div className="flex gap-1">
          {[
            { label: "−", action: () => setScale(s => Math.max(0.35, s - 0.1)) },
            { label: "⊙", action: () => { setScale(0.72); setOffset({ x: 0, y: 0 }); } },
            { label: "+", action: () => setScale(s => Math.min(1.6, s + 0.1)) },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-7 h-7 text-[12px] font-bold rounded-sm cursor-pointer transition-all"
              style={{
                border: "1px solid rgba(0,200,255,0.15)",
                color: "var(--color-fg-dim)",
                background: "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── メインエリア ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* SVGキャンバス */}
        <div
          ref={wrapRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* グリッド背景 */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: "radial-gradient(rgba(0,200,255,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              backgroundPosition: `${offset.x % 32}px ${offset.y % 32}px`,
            }}
          />

          <svg
            ref={svgRef}
            viewBox={viewBox}
            style={{
              width:  svgSize * scale,
              height: svgSize * scale,
              display: "block",
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              overflow: "visible",
              userSelect: "none",
            }}
          >
            <defs>
              {/* グロー用フィルター */}
              <filter id="glow-p">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-s">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 分野の放射ガイドライン */}
            {BRANCHES.filter(b => b.id !== "core").map(branch => {
              const end = polarToXY(CX, CY, TIER_R[4]! + 30, BRANCH_ANGLES[branch.id]);
              return (
                <line
                  key={branch.id}
                  x1={CX} y1={CY} x2={end.x} y2={end.y}
                  stroke={branch.color}
                  strokeWidth={0.5}
                  opacity={0.06}
                  strokeDasharray="4 8"
                />
              );
            })}

            {/* Tier同心円 */}
            {[1, 2, 3, 4].map(tier => (
              <circle
                key={tier}
                cx={CX} cy={CY}
                r={TIER_R[tier]}
                fill="none"
                stroke="rgba(0,200,255,0.05)"
                strokeWidth={1}
                strokeDasharray="3 9"
              />
            ))}

            {/* エッジ */}
            {visibleEdges.map((edge, i) => {
              const fromUnlocked = unlockedIds.has(edge.from);
              const toUnlocked   = unlockedIds.has(edge.to);
              const active  = fromUnlocked && toUnlocked;
              const partial = fromUnlocked && !toUnlocked;
              const onPath  = highlightPath.size > 0 && highlightPath.has(edge.from) && highlightPath.has(edge.to);
              return (
                <line
                  key={i}
                  x1={edge.fromX} y1={edge.fromY}
                  x2={edge.toX}   y2={edge.toY}
                  stroke={
                    onPath && !active
                      ? `${edge.color}cc`
                      : active ? edge.color
                      : partial ? `${edge.color}55`
                      : `${edge.color}18`
                  }
                  strokeWidth={onPath ? 2.5 : active ? 1.5 : 1}
                  strokeDasharray={onPath && !active ? "6 3" : undefined}
                  opacity={1}
                  style={{
                    filter: active ? `drop-shadow(0 0 3px ${edge.color}55)` : onPath ? `drop-shadow(0 0 5px ${edge.color}88)` : "none",
                  }}
                />
              );
            })}

            {/* ノード */}
            {visibleNodes.map(pos => {
              const unlocked     = unlockedIds.has(pos.id);
              const available    = canUnlock(pos.id, unlockedIds);
              const selected     = selectedId === pos.id;
              const examRequired = EXAM_REQUIRED_SKILL_IDS.has(pos.id);
              const examPassed   = !!examResults[pos.id]?.passed;
              return (
                <SkillNode
                  key={pos.id}
                  pos={pos}
                  unlocked={unlocked}
                  available={available}
                  selected={selected}
                  onSelect={handleSelect}
                  examRequired={examRequired}
                  examPassed={examPassed}
                />
              );
            })}
          </svg>

          {/* 操作ヒント */}
          <div
            className="absolute bottom-3 left-3 hud-label"
            style={{ color: "var(--color-fg-muted)", pointerEvents: "none" }}
          >
            スクロール: ズーム ／ ドラッグ: 移動 ／ クリック: スキル選択
          </div>
        </div>

        {/* 詳細パネル */}
        <div
          className="w-[280px] shrink-0 flex flex-col overflow-y-auto"
          style={{
            borderLeft: "1px solid rgba(0,200,255,0.08)",
            background: "var(--color-bg-surface)",
          }}
        >
          {selectedSkill ? (
            <div className="p-4">
              <DetailPanel
                skill={selectedSkill}
                unlocked={unlockedIds.has(selectedSkill.id)}
                available={canUnlock(selectedSkill.id, unlockedIds)}
                onUnlock={handleUnlock}
                totalXp={totalXp}
                examResult={examResults[selectedSkill.id]}
              />

              {/* 分野説明 */}
              <div className="mt-4 px-3 py-2 rounded-sm"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px dashed rgba(0,200,255,0.08)" }}>
                <div className="hud-label mb-1">
                  {BRANCHES.find(b => b.id === selectedSkill.branch)?.icon}
                  {" "}{BRANCHES.find(b => b.id === selectedSkill.branch)?.label}
                </div>
                <p className="text-[10px] m-0 leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
                  {BRANCHES.find(b => b.id === selectedSkill.branch)?.description}
                </p>
              </div>

              {/* adaptブランチ：anomaly副作用警告 */}
              {selectedSkill.branch === "adapt" && (() => {
                const match = selectedSkill.description.match(/anomaly \+([0-9.]+)/);
                const delta = match ? parseFloat(match[1] ?? "0") : 0;
                if (delta <= 0) return null;
                return (
                  <div className="mt-3 px-3 py-2 rounded-sm"
                    style={{ background: "rgba(255,64,96,0.06)", border: "1px solid rgba(255,64,96,0.3)" }}>
                    <div className="text-[11px] font-bold mb-1" style={{ color: "#ff4060", letterSpacing: "0.06em" }}>
                      ⚠ 副作用: anomaly_score +{delta}
                    </div>
                    <p className="text-[10px] m-0" style={{ color: "rgba(255,64,96,0.7)" }}>
                      このスキルの習得により異常スコアが上昇します。閾値を超えると機関の特別対応が発動する場合があります。
                    </p>
                  </div>
                );
              })()}

              {/* ルート可視化コスト表示（Tier4/s5選択時） */}
              {highlightPath.size > 0 && (() => {
                const pathCost = Array.from(highlightPath).reduce((sum, id) => {
                  const s = SKILLS.find(sk => sk.id === id);
                  return sum + (s?.xpCost ?? 0);
                }, 0);
                const pathUnlocked = Array.from(highlightPath).filter(id => unlockedIds.has(id)).length;
                const pathTotal = highlightPath.size;
                return (
                  <div className="mt-3 px-3 py-2 rounded-sm"
                    style={{ background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.15)" }}>
                    <div className="hud-label mb-1">習得ルート</div>
                    <div className="text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
                      合計 {pathCost.toLocaleString()} XP
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
                      {pathUnlocked}/{pathTotal} スキル習得済み ·
                      残り {(pathCost - Array.from(highlightPath).filter(id => unlockedIds.has(id)).reduce((sum, id) => sum + (SKILLS.find(sk => sk.id === id)?.xpCost ?? 0), 0)).toLocaleString()} XP
                    </div>
                    <p className="text-[11px] m-0 mt-1" style={{ color: "var(--color-fg-dim)" }}>
                      破線がこのスキルへの最短ルートです
                    </p>
                  </div>
                );
              })()}

              {/* 比較モード */}
              {compareMode && compareId && compareId !== selectedSkill.id && (() => {
                const cmp = SKILLS.find(s => s.id === compareId);
                if (!cmp) return null;
                const cmpColor = getBranchColor(cmp.branch);
                return (
                  <div className="mt-3 rounded-sm overflow-hidden"
                    style={{ border: `1px solid ${cmpColor}33` }}>
                    <div className="px-3 py-2 text-[10px] font-bold"
                      style={{ background: `${cmpColor}10`, color: cmpColor, borderBottom: `1px solid ${cmpColor}22` }}>
                      比較: {cmp.icon} {cmp.label}
                    </div>
                    <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1" style={{ fontSize: 10 }}>
                      {[
                        ["ブランチ", BRANCHES.find(b=>b.id===selectedSkill.branch)?.label ?? "", BRANCHES.find(b=>b.id===cmp.branch)?.label ?? ""],
                        ["Tier", `${selectedSkill.tier}`, `${cmp.tier}`],
                        ["XPコスト", `${selectedSkill.xpCost}`, `${cmp.xpCost}`],
                        ["前提数", `${selectedSkill.requires.length}`, `${cmp.requires.length}`],
                      ].map(([label, v1, v2]) => (
                        <div key={label} className="col-span-2 flex gap-2">
                          <span style={{ color: "var(--color-fg-muted)", minWidth: 60 }}>{label}</span>
                          <span style={{ color: "var(--color-primary)" }}>{v1}</span>
                          <span style={{ color: "var(--color-fg-dim)" }}>vs</span>
                          <span style={{ color: cmpColor }}>{v2}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="mb-3 opacity-15"><Icon name="skill" size={28} aria-hidden /></div>
                <div className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>スキルを選択してください</div>
                <div className="hud-label mt-1">CLICK A NODE</div>
              </div>
            </div>
          )}

          {/* 分野一覧 */}
          <div className="p-4 border-t" style={{ borderColor: "rgba(0,200,255,0.08)" }}>
            <div className="hud-label mb-3">分野別進捗</div>
            <div className="flex flex-col gap-2">
              {BRANCHES.filter(b => b.id !== "core").map(branch => {
                const branchSkills = SKILLS.filter(s => s.branch === branch.id);
                const done = branchSkills.filter(s => unlockedIds.has(s.id)).length;
                const total = branchSkills.length;
                const pct = total > 0 ? (done / total) * 100 : 0;
                return (
                  <div key={branch.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px]" style={{ color: branch.color }}>
                        {branch.icon} {branch.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--color-fg-muted)" }}>
                        {done}/{total}
                      </span>
                    </div>
                    <div style={{ height: "2px", background: "rgba(0,200,255,0.06)", borderRadius: "1px" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: branch.color,
                        borderRadius: "1px",
                        boxShadow: pct > 0 ? `0 0 4px ${branch.color}88` : "none",
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 部門認定試験バナー */}
          <div className="p-4 border-t" style={{ borderColor: "rgba(0,200,255,0.08)" }}>
            <div className="hud-label mb-3">部門認定試験</div>
            <div className="flex flex-col gap-2">
              {BRANCHES.filter(b => b.id !== "core").map(branch => {
                const branchSkills = SKILLS.filter(s => s.branch === branch.id);
                const tier3done = branchSkills.filter(s => s.tier >= 3 && unlockedIds.has(s.id)).length;
                const eligible = tier3done >= 2;
                const examPassed = branchSkills.filter(s => s.tier >= 3 && unlockedIds.has(s.id)).length >= 4;
                return (
                  <div key={branch.id}
                    className="flex items-center justify-between px-2.5 py-2 rounded-sm"
                    style={{
                      background: eligible ? `${branch.color}08` : "transparent",
                      border: `1px solid ${eligible ? `${branch.color}22` : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: eligible ? branch.color : "var(--color-fg-muted)" }}>
                      {branch.icon} {branch.label}
                    </span>
                    {examPassed ? (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-sm font-bold"
                        style={{ color: "var(--color-success)", background: "rgba(62,207,106,0.1)", border: "1px solid rgba(62,207,106,0.25)" }}>
                        ✓ 認定
                      </span>
                    ) : eligible ? (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-sm"
                        style={{ color: branch.color, background: `${branch.color}10`, border: `1px solid ${branch.color}33` }}>
                        受験可
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                        Tier3×2
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] mt-2 m-0" style={{ color: "var(--color-fg-dim)", lineHeight: 1.6 }}>
              各分野でTier3スキルを2つ以上習得すると部門認定試験の受験資格を得ます
            </p>
          </div>

          {/* ガイドモード — 次のおすすめスキル */}
          {(() => {
            const recommended = SKILLS.filter(s =>
              !unlockedIds.has(s.id) &&
              canUnlock(s.id, unlockedIds) &&
              totalXp >= s.xpCost
            ).sort((a, b) => a.xpCost - b.xpCost).slice(0, 3);
            if (recommended.length === 0) return null;
            return (
              <div className="p-4 border-t" style={{ borderColor: "rgba(0,200,255,0.08)" }}>
                <div className="hud-label mb-3">◉ 次のおすすめ</div>
                <div className="flex flex-col gap-1.5">
                  {recommended.map(skill => {
                    const color = getBranchColor(skill.branch);
                    return (
                      <button
                        key={skill.id}
                        onClick={() => handleSelect(skill.id)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-left w-full cursor-pointer transition-all"
                        style={{
                          background: "transparent",
                          border: `1px solid ${color}22`,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}08`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span style={{ color, fontSize: 12 }}>{skill.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold truncate" style={{ color }}>{skill.label}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
                            {BRANCHES.find(b => b.id === skill.branch)?.label} · {skill.xpCost} XP
                          </div>
                        </div>
                        <span className="text-[11px]" style={{ color: "var(--color-success)", flexShrink: 0 }}>→</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      {/* anomaly副作用確認モーダル */}
      {anomalyWarning && (() => {
        const skill = SKILLS.find(s => s.id === anomalyWarning);
        if (!skill) return null;
        const match = skill.description.match(/anomaly \+([0-9.]+)/);
        const delta = match ? parseFloat(match[1] ?? "0") : 0;
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
            onClick={() => setAnomalyWarning(null)}
          >
            <div
              style={{ width: "min(420px, 94vw)", background: "rgba(8,0,4,0.99)", border: "1px solid rgba(255,64,96,0.4)", borderRadius: 4, overflow: "hidden" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,64,96,0.2)", background: "rgba(255,64,96,0.06)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,64,96,0.6)", letterSpacing: "0.1em", marginBottom: 4 }}>
                  ⚠ ANOMALY SCORE WARNING
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "#ff4060" }}>
                  {skill.icon} {skill.label}
                </div>
              </div>
              <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
                このスキルを習得すると <span style={{ color: "#ff4060", fontWeight: 700 }}>anomaly_score が +{delta} 上昇</span> します。
                <br />
                スコアが閾値を超えると機関からの特別対応プロトコルが発動する場合があります。
                <br /><br />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>
                  それでも習得しますか？この変容は元に戻せません。
                </span>
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,64,96,0.15)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setAnomalyWarning(null)}
                  style={{ padding: "6px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    const tid = anomalyWarning;
                    setAnomalyWarning(null);
                    handleUnlock(tid ?? undefined);
                  }}
                  style={{ padding: "6px 16px", background: "rgba(255,64,96,0.12)", border: "1px solid rgba(255,64,96,0.5)", color: "#ff4060", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: "pointer" }}
                >
                  習得する — +{delta} anomaly
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}