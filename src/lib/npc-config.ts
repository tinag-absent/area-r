/**
 * NPCスタイル設定
 *
 * 各NPCの表示色・アイコン・役職名を定義する。
 * チャット画面でのメッセージ装飾に使用する。
 */

// Updated: 2026-03-23 — description / chatId を追加（NPC タグ用）
export type NpcName = "K-ECHO" | "N-VEIL" | "L-RIFT" | "A-PHOS" | "G-MIST";

export interface NpcStyle {
  border: string;
  bg: string;
  glow: string;
  name: string;
  dot: string;
}

export const NPC_COLORS: Record<NpcName, NpcStyle> = {
  "K-ECHO": {
    border: "rgba(0,200,255,0.4)",
    bg:     "rgba(0,200,255,0.07)",
    glow:   "rgba(0,200,255,0.25)",
    name:   "#00c8ff",
    dot:    "#00c8ff",
  },
  "N-VEIL": {
    border: "rgba(160,100,255,0.4)",
    bg:     "rgba(160,100,255,0.07)",
    glow:   "rgba(160,100,255,0.25)",
    name:   "#a064ff",
    dot:    "#a064ff",
  },
  "L-RIFT": {
    border: "rgba(80,220,120,0.4)",
    bg:     "rgba(80,220,120,0.07)",
    glow:   "rgba(80,220,120,0.25)",
    name:   "#50dc78",
    dot:    "#50dc78",
  },
  "A-PHOS": {
    border: "rgba(255,180,60,0.4)",
    bg:     "rgba(255,180,60,0.07)",
    glow:   "rgba(255,180,60,0.25)",
    name:   "#ffb43c",
    dot:    "#ffb43c",
  },
  "G-MIST": {
    border: "rgba(160,160,160,0.35)",
    bg:     "rgba(160,160,160,0.06)",
    glow:   "rgba(160,160,160,0.15)",
    name:   "#a0a0a0",
    dot:    "#a0a0a0",
  },
};

export const NPC_ICONS: Record<NpcName, string> = {
  "K-ECHO": "◈",
  "N-VEIL": "◉",
  "L-RIFT": "⬡",
  "A-PHOS": "♡",
  "G-MIST": "〜",
};

export const NPC_TITLES: Record<NpcName, string> = {
  "K-ECHO": "観測分析官",
  "N-VEIL": "次元研究者",
  "L-RIFT": "システム管理官",
  "A-PHOS": "支援調整官",
  "G-MIST": "不明",
};

export const NPC_DESCRIPTIONS: Record<NpcName, string> = {
  "K-ECHO": "観測部門所属の分析官。次元物理・収束技術の第一人者。感情を排した短文で応答し、データと事実のみを語る。機関内でも特に高いクリアランスを持つ。",
  "N-VEIL": "次元研究部門の研究者。自らをAI補助体と称するが、その本質は不明。哲学的・詩的な長文で応答し、観測者SIGMAとの接触を示唆する発言を繰り返す。",
  "L-RIFT": "技術部門のシステム管理官。モジュール開発・機器保守を担当。専門用語多用の簡潔な文体。システムログを読むように現実を解析する。",
  "A-PHOS": "支援調整部門。機関員のメンタルケアと日常的サポートを担う。温かく気遣いのある口調。機関内で最も人間的な存在とされる。",
  "G-MIST": "所属部門不明。機関の公式記録に存在を確認できない。意味深な断片的発言で真実を示唆するが、決して明言しない。",
};

export const NPC_CHAT_IDS: Record<NpcName, string> = {
  "K-ECHO": "k-echo",
  "N-VEIL": "n-veil",
  "L-RIFT": "l-rift",
  "A-PHOS": "a-phos",
  "G-MIST": "g-mist",
};
