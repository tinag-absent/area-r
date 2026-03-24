import type { ChatChannel } from "./types";
import type { NpcName } from "./npc-config";

// ─── レベル閾値 ──────────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1200, 2500];

// ─── XP 報酬 ─────────────────────────────────────────────────────────
export const XP_REWARDS: Record<string, number> = {
  first_login:           50,
  daily_login:           25,
  send_chat_message:      5,
  complete_mission:      50,
  discover_keyword:      15,
  report_anomaly:        30,
  division_activity:     10,
  view_classified:      100,
};

// ─── XP レート制限（24時間あたり） ───────────────────────────────────
export const XP_RATE_LIMITS: Record<string, number> = {
  first_login:            1, // 初回のみ
  daily_login:            1,
  send_chat_message:     20,
  complete_mission:       5,
  discover_keyword:      10,
  report_anomaly:         3,
  division_activity:     10,
  view_classified:        1,
};

/** 全期間で1回だけ付与するアクティビティ（xp_logs 全件で重複チェック） */
export const XP_ONLY_FIRST = new Set(["first_login"]);

// ─── 連続ログインボーナス ────────────────────────────────────────────
export const DAILY_LOGIN_REWARDS: Record<number, number> = {
  1: 25, 2: 30, 3: 35, 4: 40, 5: 45, 6: 50, 7: 100,
};

// ─── チャット ────────────────────────────────────────────────────────
/** TYPE-5: as const でリテラル型のタプルに — ChatChannel型が自動導出される */
export const ALLOWED_CHAT_CHANNELS = ["global", "npc_group", "secure", "classified"] as const satisfies readonly ChatChannel[];
export const NPC_DM_PREFIX = "npc-dm-" as const;
export const MAX_CHAT_MESSAGE_LENGTH = 1000;
export const CHAT_RATE_WINDOW_SECS = 10;
export const CHAT_RATE_MAX_MSGS = 5;

// ─── 部門 ─────────────────────────────────────────────────────────────
export const DIVISIONS = [
  {
    id: "DIV-01",
    name: "観測部門",
    name_en: "OBSERVATION DIVISION",
    description: "海蝕現象の発生源を特定・記録する。機関の目となる存在。",
    color: "#00C8FF",
  },
  {
    id: "DIV-02",
    name: "収束部門",
    name_en: "CONVERGENCE DIVISION",
    description: "侵食を中和し、次元の歪みを収束させる最前線部隊。",
    color: "#A064FF",
  },
  {
    id: "DIV-03",
    name: "記録部門",
    name_en: "ARCHIVE DIVISION",
    description: "全ての現象・事例を記録・分類・保管する機関の記憶。",
    color: "#50DC78",
  },
  {
    id: "DIV-04",
    name: "技術部門",
    name_en: "ENGINEERING DIVISION",
    description: "観測・収束機器の開発・保守を担う。機関のインフラを支える。",
    color: "#FFB43C",
  },
  {
    id: "DIV-05",
    name: "封印部門",
    name_en: "CONTAINMENT DIVISION",
    description: "次元裂孔を封印し、侵食源を隔離する。機密度最高の部門。",
    color: "#FF6B6B",
  },
];

// ─── NPC ─────────────────────────────────────────────────────────────
export const NPC_USERNAMES = new Set([
  "K-ECHO", "N-VEIL", "L-RIFT", "A-PHOS", "G-MIST",
]);

export const NPC_IDS: Record<NpcName, string> = {
  "K-ECHO": "npc-00000001-echo-0000-0000-000000000000",
  "N-VEIL": "npc-00000002-veil-0000-0000-000000000000",
  "L-RIFT": "npc-00000003-rift-0000-0000-000000000000",
  "A-PHOS": "npc-00000004-phos-0000-0000-000000000000",
  "G-MIST": "npc-00000005-mist-0000-0000-000000000000",
};

// ─── エージェントID生成 ───────────────────────────────────────────────
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // 紛らわしい文字（I・O）を除外

export function generateAgentId(): string {
  const prefix = "K";
  const alpha = Array.from({ length: 3 }, () =>
    ALPHA[Math.floor(Math.random() * ALPHA.length)]
  ).join("");
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${alpha}-${num}`;
}
