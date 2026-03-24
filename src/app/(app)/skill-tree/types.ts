/**
 * src/app/(app)/skill-tree/types.ts
 *
 * スキルツリーモジュール内で共有する型定義。
 * SkillTreeClient.tsx から分離 (2026-03-23)。
 */

import type { Skill } from "./data";

/** SVGキャンバス上のノード座標 */
export interface NodePos {
  id:    string;
  x:     number;
  y:     number;
  skill: Skill;
}

/** エッジ（スキル間の接続線） */
export interface Edge {
  from:  string;
  to:    string;
  fromX: number;
  fromY: number;
  toX:   number;
  toY:   number;
  color: string;
}

/** 試験結果キャッシュエントリ */
export interface ExamResult {
  score:    number;
  total:    number;
  passed:   boolean;
  taken_at: string;
}

export type ExamResultCache = Record<string, ExamResult | null>;
