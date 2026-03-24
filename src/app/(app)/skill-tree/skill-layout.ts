// Renamed from layout.ts to skill-layout.ts to avoid Next.js App Router convention conflict (2026-03-24)
/**
 * src/app/(app)/skill-tree/layout.ts
 *
 * スキルツリーのSVVGレイアウト計算（純粋関数）。
 * SkillTreeClient.tsx から分離 (2026-03-23)。
 *
 * 依存なし（React不要）。単体テスト可能。
 */

import { SKILLS, BRANCHES, getBranchColor, type BranchId } from "./data";
import type { NodePos, Edge } from "./types";

// ─────────────────────────────────────────────────────────────────────
// SVGキャンバス定数
// ─────────────────────────────────────────────────────────────────────

export const CX = 600;  // SVGキャンバス中心X
export const CY = 600;  // SVGキャンバス中心Y

/** Tier別半径 */
export const TIER_R: Record<number, number> = { 0: 0, 1: 130, 2: 240, 3: 370, 4: 510 };

/** 分野ごとの基準角度（度） */
export const BRANCH_ANGLES: Record<BranchId, number> = {
  core:     0,
  observe:  90,
  combat:   30,
  engineer: 330,
  archive:  270,
  psych:    210,
  covert:   150,
  liaison:  345,
  ritual:   225,
  adapt:    255,
};

/** 分野内スキルの角度ファン幅（度） */
export const FAN_WIDTH = 52;

// ─────────────────────────────────────────────────────────────────────
// 計算ユーティリティ
// ─────────────────────────────────────────────────────────────────────

export function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function polarToXY(
  centerX: number,
  centerY: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = deg2rad(angleDeg - 90); // 上が0度
  return {
    x: centerX + r * Math.cos(rad),
    y: centerY + r * Math.sin(rad),
  };
}

// ─────────────────────────────────────────────────────────────────────
// レイアウト計算
// ─────────────────────────────────────────────────────────────────────

/** 全スキルのSVG座標を計算する */
export function computeLayout(): NodePos[] {
  const positions: NodePos[] = [];

  // 中心ノード
  const coreSkill = SKILLS.find(s => s.id === "core-init")!;
  positions.push({ id: "core-init", x: CX, y: CY, skill: coreSkill });

  const branches: BranchId[] = [
    "observe", "combat", "engineer", "archive",
    "psych", "covert", "liaison", "ritual", "adapt",
  ];

  for (const branchId of branches) {
    const baseAngle  = BRANCH_ANGLES[branchId];
    const branchSkills = SKILLS.filter(s => s.branch === branchId);

    const byTier: Record<number, typeof branchSkills> = { 1: [], 2: [], 3: [], 4: [] };
    for (const s of branchSkills) {
      byTier[s.tier]?.push(s);
    }

    for (const tierStr of ["1", "2", "3", "4"]) {
      const tier       = Number(tierStr);
      const tierSkills = byTier[tier] ?? [];
      const r          = TIER_R[tier]!;
      const count      = tierSkills.length;

      tierSkills.forEach((skill, i) => {
        const angle =
          count === 1
            ? baseAngle
            : baseAngle - FAN_WIDTH / 2 + (FAN_WIDTH / (count - 1)) * i;
        const pos = polarToXY(CX, CY, r, angle);
        positions.push({ id: skill.id, x: pos.x, y: pos.y, skill });
      });
    }
  }

  return positions;
}

// ─────────────────────────────────────────────────────────────────────
// エッジ計算
// ─────────────────────────────────────────────────────────────────────

/** 全スキル間の接続エッジを計算する */
export function computeEdges(posMap: Map<string, NodePos>): Edge[] {
  const edges: Edge[] = [];
  for (const skill of SKILLS) {
    const toPos = posMap.get(skill.id);
    if (!toPos) continue;
    const color = getBranchColor(skill.branch);
    for (const reqId of skill.requires) {
      const fromPos = posMap.get(reqId);
      if (!fromPos) continue;
      edges.push({
        from: reqId, to: skill.id,
        fromX: fromPos.x, fromY: fromPos.y,
        toX:   toPos.x,   toY:   toPos.y,
        color,
      });
    }
  }
  return edges;
}

// ─────────────────────────────────────────────────────────────────────
// モジュールレベルキャッシュ（参照型 — 再計算不要）
// ─────────────────────────────────────────────────────────────────────

export const NODE_POSITIONS = computeLayout();
export const POS_MAP        = new Map(NODE_POSITIONS.map(p => [p.id, p]));
export const ALL_EDGES      = computeEdges(POS_MAP);

// ブランチラベル用のラベル座標
export const BRANCH_LABEL_POSITIONS = BRANCHES
  .filter(b => b.id !== "core")
  .map(branch => ({
    branch,
    ...polarToXY(CX, CY, TIER_R[4]! + 55, BRANCH_ANGLES[branch.id]),
  }));
