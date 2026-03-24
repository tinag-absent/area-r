/**
 * src/app/(app)/skill-tree/useSkillTree.ts
 *
 * スキルツリーのデータ取得・状態管理カスタムフック。
 * SkillTreeClient.tsx から分離 (2026-03-23)。
 *
 * 責務:
 *   - 試験結果のフェッチ・キャッシュ
 *   - スキル習得状態の管理
 *   - XP計算
 *   - 習得ルートの計算（computePath）
 *   - anomalyDelta の計算
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { SKILLS, canUnlock, type Skill, type BranchId } from "./data";
import { EXAM_REQUIRED_SKILL_IDS } from "./examData";
import type { ExamResultCache } from "./types";

// ─────────────────────────────────────────────────────────────────────
// フックの戻り値型
// ─────────────────────────────────────────────────────────────────────

export interface UseSkillTreeReturn {
  // 状態
  unlockedIds:   Set<string>;
  selectedId:    string | null;
  spentXp:       number;
  examResults:   ExamResultCache;
  filterBranch:  BranchId | "all";
  showUnlockedOnly:  boolean;
  showExamRequired:  boolean;
  showAffordable:    boolean;
  highlightPath:  Set<string>;
  anomalyWarning: string | null;
  compareId:      string | null;
  compareMode:    boolean;

  // 派生値
  totalXp:       number;
  selectedSkill: Skill | null;

  // アクション
  setSelectedId:      (id: string | null) => void;
  setFilterBranch:    (b: BranchId | "all") => void;
  setShowUnlockedOnly:(v: boolean) => void;
  setShowExamRequired:(v: boolean) => void;
  setShowAffordable:  (v: boolean) => void;
  setHighlightPath:   (p: Set<string>) => void;
  setAnomalyWarning:  (id: string | null) => void;
  setCompareId:       (id: string | null) => void;
  setCompareMode:     (v: boolean) => void;
  handleUnlock:       (skillIdOverride?: string) => void;
  handleSelect:       (id: string) => void;
  getAnomalyDelta:    (skill: Skill) => number;
  computePath:        (targetId: string) => Set<string>;
}

// ─────────────────────────────────────────────────────────────────────
// フック本体
// ─────────────────────────────────────────────────────────────────────

export function useSkillTree(userXp: number): UseSkillTreeReturn {
  const [unlockedIds,  setUnlockedIds]  = useState<Set<string>>(new Set(["core-init"]));
  const [selectedId,   setSelectedId]   = useState<string | null>("core-init");
  const [spentXp,      setSpentXp]      = useState(0);
  const [filterBranch, setFilterBranch] = useState<BranchId | "all">("all");
  const [examResults,  setExamResults]  = useState<ExamResultCache>({});
  const [showUnlockedOnly,  setShowUnlockedOnly]  = useState(false);
  const [showExamRequired,  setShowExamRequired]  = useState(false);
  const [showAffordable,    setShowAffordable]    = useState(false);
  const [highlightPath,  setHighlightPath]  = useState<Set<string>>(new Set());
  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);
  const [compareId,    setCompareId]    = useState<string | null>(null);
  const [compareMode,  setCompareMode]  = useState(false);

  const totalXp      = userXp - spentXp;
  const selectedSkill = selectedId ? SKILLS.find(s => s.id === selectedId) ?? null : null;

  // ── データフェッチ: 試験結果の全取得 ─────────────────────────────
  useEffect(() => {
    fetch("/api/skill-exam")
      .then(r => r.json())
      .then((rows: {
        skill_id: string; score: number; total: number; passed: number; taken_at: string;
      }[]) => {
        const cache: ExamResultCache = {};
        for (const row of rows) {
          cache[row.skill_id] = {
            score:    row.score,
            total:    row.total,
            passed:   !!row.passed,
            taken_at: row.taken_at,
          };
        }
        setExamResults(cache);
      })
      .catch(() => {});
  }, []);

  // ── ユーティリティ ────────────────────────────────────────────────

  /** adaptブランチスキルの anomaly 増加量を取得 */
  const getAnomalyDelta = useCallback((skill: Skill): number => {
    if (skill.branch !== "adapt") return 0;
    const match = skill.description.match(/anomaly \+([0-9.]+)/);
    return match ? parseFloat(match[1] ?? "0") : 0;
  }, []);

  /** 習得ルートの計算（Tier4スキル選択時のパスハイライト） */
  const computePath = useCallback((targetId: string): Set<string> => {
    const path  = new Set<string>();
    const queue = [targetId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      path.add(id);
      const skill = SKILLS.find(s => s.id === id);
      if (skill) {
        for (const req of skill.requires) {
          if (!path.has(req)) queue.push(req);
        }
      }
    }
    return path;
  }, []);

  // ── 選択ハンドラ（Tier4でパスをハイライト） ─────────────────────

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const skill = SKILLS.find(s => s.id === id);
    if (skill && skill.tier === 4) {
      setHighlightPath(computePath(id));
    } else {
      setHighlightPath(new Set());
    }
  }, [computePath]);

  // ── 習得ハンドラ ──────────────────────────────────────────────────

  const handleUnlock = useCallback((skillIdOverride?: string) => {
    const targetId = skillIdOverride ?? selectedId;
    if (!targetId) return;
    const skill = SKILLS.find(s => s.id === targetId);
    if (!skill) return;
    if (!canUnlock(targetId, unlockedIds)) return;
    if (totalXp < skill.xpCost && skill.xpCost > 0) return;

    // 試験必須スキルの合格チェック
    if (EXAM_REQUIRED_SKILL_IDS.has(targetId) && !examResults[targetId]?.passed) return;

    // adaptブランチ: anomaly警告（skillIdOverride=確認済みのためスキップ）
    const delta = getAnomalyDelta(skill);
    if (delta > 0 && !skillIdOverride) {
      setAnomalyWarning(targetId);
      return;
    }

    setUnlockedIds(prev => new Set([...prev, targetId]));
    setSpentXp(prev => prev + skill.xpCost);
    setAnomalyWarning(null);
  }, [selectedId, unlockedIds, totalXp, examResults, getAnomalyDelta]);

  return {
    unlockedIds,
    selectedId,
    spentXp,
    examResults,
    filterBranch,
    showUnlockedOnly,
    showExamRequired,
    showAffordable,
    highlightPath,
    anomalyWarning,
    compareId,
    compareMode,
    totalXp,
    selectedSkill,
    setSelectedId,
    setFilterBranch,
    setShowUnlockedOnly,
    setShowExamRequired,
    setShowAffordable,
    setHighlightPath,
    setAnomalyWarning,
    setCompareId,
    setCompareMode,
    handleUnlock,
    handleSelect,
    getAnomalyDelta,
    computePath,
  };
}
