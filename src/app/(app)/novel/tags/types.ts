/**
 * tags/types.ts — タグシステムの型定義・リゾルバ基盤
 *
 * 新規タグを追加する場合:
 *   1. TagKind にユニオン型を追加
 *   2. tags/resolvers.ts に resolveXxx() 関数を追加
 *   3. TAG_RESOLVERS テーブルに { prefix, resolve } を追記
 *   4. tags/modals.tsx の TagModalContent に if (kind === "xxx") ブロックを追加
 *   5. dbCacheStore.ts の DbCache にフィールド追加（DBフェッチが必要な場合）
 *
 * 詳細は docs/tag-system.md を参照。
 */

import type { DbCache } from "@/store/dbCacheStore";

// ─────────────────────────────────────────────────────────────────────
// TagKind — 全タグ種別
// ─────────────────────────────────────────────────────────────────────

export type TagKind =
  // DB参照タグ（Phase 1–4）
  | "missions" | "facilities" | "entities" | "equipment" | "personnel"
  | "divisions" | "incidents" | "modules" | "codex" | "audio"
  // DB参照タグ（Phase 5A）
  | "skills" | "achievements" | "events" | "puzzles" | "bulletin" | "npc"
  // DB参照タグ（Phase 5B — 新規テーブル）
  | "location" | "rift_point"
  | "gsi_log" | "signal_log" | "scan_log"
  | "crack" | "memo" | "case_report" | "operation" | "protocol" | "theory"
  | "sigma"
  // 静的定義タグ
  | "phase" | "layer" | "cert" | "cipher"
  // 4th wall 演出
  | "observer";

// ─────────────────────────────────────────────────────────────────────
// TagMeta — インラインカードの表示情報
// ─────────────────────────────────────────────────────────────────────

export interface TagMeta {
  kind:   TagKind;
  color:  string;
  icon:   string;
  label:  string;
  sub?:   string;   // 2行目（種別・ステータスなど）
  code?:  string;   // 右端の小さいコード
  locked: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// ResolverFn / TagResolver — プラグイン型
// ─────────────────────────────────────────────────────────────────────

export type ResolverFn = (id: string, db: DbCache) => TagMeta | null;

export interface TagResolver {
  prefix:  string;
  resolve: ResolverFn;
}

// ─────────────────────────────────────────────────────────────────────
// Segment — パーサー出力型
// ─────────────────────────────────────────────────────────────────────

export type Segment =
  | { type: "text";       value: string }
  | { type: "card";       id: string; label?: string }
  | { type: "redacted";   reason?: string }
  | { type: "void" }
  | { type: "corrupted";  label?: string }
  | { type: "timestamp";  iso: string }
  | { type: "anomaly";    value: string }
  | { type: "user_tag" }
  | { type: "unknown";    hint?: string }
  | { type: "classified"; level: number; label?: string };

// ─────────────────────────────────────────────────────────────────────
// ModalState — モーダル開閉状態
// ─────────────────────────────────────────────────────────────────────

import type { AudioModalData } from "@/components/ui/AudioModal";

export type ModalState =
  | { type: "generic";  kind: TagKind; id: string; meta: TagMeta }
  | { type: "audio";    data: AudioModalData }
  | { type: "bulletin"; id: string; meta: TagMeta }
  | { type: "memo";     id: string; meta: TagMeta }
  | { type: "observer" }
  | null;

// ─────────────────────────────────────────────────────────────────────
// 静的定義データ（PHASE / LAYER / CERT）
// ─────────────────────────────────────────────────────────────────────

export const PHASE_DEFS: Record<number, { label: string; sub: string; color: string; desc: string }> = {
  1: { label: "フェーズ1", sub: "初期接触・観測確立", color: "var(--color-primary)",  desc: "海蝕現象の初観測と機関の初動対応期。基礎観測網の整備と最初の実体記録。" },
  2: { label: "フェーズ2", sub: "拡大・深部調査",     color: "var(--color-warning)", desc: "侵食エリアの拡大と深部裂孔の発生。機関の総力を結集した収束作戦の開始。" },
  3: { label: "フェーズ3", sub: "臨界・核心接触",     color: "var(--color-danger)",  desc: "海蝕の源との直接接触フェーズ。詳細はLV3以上のみ閲覧可能。" },
};

export const LAYER_DEFS: Record<number, { label: string; sub: string; color: string; desc: string }> = {
  1: { label: "第一層", sub: "表層現実",    color: "var(--color-primary)",  desc: "通常の物理空間。私たちの住む現実層。海蝕侵食の最前線。" },
  2: { label: "第二層", sub: "境界薄化域",  color: "var(--color-primary)",  desc: "第一層と階宙次元の境界が不安定化した空間。GSI値が恒常的に上昇。" },
  3: { label: "第三層", sub: "次元裂孔帯",  color: "var(--color-warning)", desc: "裂孔が安定的に存在する空間。実体の往来が確認される。CLR LV2必須。" },
  4: { label: "第四層", sub: "階宙接触域",  color: "var(--color-warning)", desc: "階宙次元との直接接触が可能な領域。精神的防護装備が必須。CLR LV3必須。" },
  5: { label: "第五層", sub: "【機密】",     color: "var(--color-danger)",  desc: "████████████" },
  6: { label: "第六層", sub: "【機密】",     color: "var(--color-danger)",  desc: "████████████" },
  7: { label: "第七層", sub: "【最高機密】", color: "var(--color-danger)",  desc: "████████████" },
};

export const CERT_DEFS: Record<number, { label: string; sub: string; color: string }> = {
  0: { label: "基本認定",       sub: "新規機関員",        color: "rgba(255,255,255,0.4)" },
  1: { label: "一般機密取扱",   sub: "観測・支援任務",    color: "var(--color-primary)"  },
  2: { label: "制限機密取扱",   sub: "現場収束任務",      color: "var(--color-success)"  },
  3: { label: "機密取扱",       sub: "深部調査・裂孔接近", color: "var(--color-warning)"  },
  4: { label: "高度機密取扱",   sub: "核心部接触任務",    color: "var(--color-danger)"   },
  5: { label: "最高機密取扱",   sub: "蒼海計画参加資格",  color: "var(--color-danger)"   },
};
