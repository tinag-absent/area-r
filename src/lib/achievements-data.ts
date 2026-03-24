/**
 * 実績マスターデータ（クライアント・サーバー両方から import 可）
 * サーバー専用ロジック（DB 操作等）は @/lib/achievements を使うこと
 */


export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  is_secret: number; // 0=通常 1=秘密
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  loginCount: number;
  streak: number;
  xpTotal: number;
  level: number;
  missionCompleted: number;
  chatMessageCount: number;
  anomalyScore: number;
  divisionTransferred: boolean;
  bookmarkCount: number;
  entityViewed: number;
}

export const ACHIEVEMENTS_MASTER: AchievementDef[] = [
  // ── ログイン系 ──────────────────────────────────────────────────
  {
    key: "first_login",
    title: "初期認証完了",
    description: "海蝕機関へようこそ。初回ログインを完了した。",
    icon: "◈", xp_reward: 50, is_secret: 0,
    check: s => s.loginCount >= 1,
  },
  {
    key: "streak_3days",
    title: "3日連続ログイン",
    description: "3日連続でシステムにアクセスした。",
    icon: "◉", xp_reward: 75, is_secret: 0,
    check: s => s.streak >= 3,
  },
  {
    key: "streak_7days",
    title: "週間任務継続",
    description: "7日間連続でシステムに接続した。献身的な機関員。",
    icon: "◉", xp_reward: 200, is_secret: 0,
    check: s => s.streak >= 7,
  },
  {
    key: "streak_30days",
    title: "鉄の意志",
    description: "30日間連続ログイン。機関への揺るぎない忠誠。",
    icon: "◆", xp_reward: 1000, is_secret: 1,
    check: s => s.streak >= 30,
  },
  // ── レベル系 ────────────────────────────────────────────────────
  {
    key: "level2_reached",
    title: "クリアランス LV2",
    description: "クリアランスレベル2に到達した。",
    icon: "▣", xp_reward: 0, is_secret: 0,
    check: s => s.level >= 2,
  },
  {
    key: "level3_reached",
    title: "クリアランス LV3",
    description: "クリアランスレベル3に到達した。機密情報へのアクセスが拡大する。",
    icon: "▣", xp_reward: 0, is_secret: 0,
    check: s => s.level >= 3,
  },
  {
    key: "level5_reached",
    title: "最高機密取扱許可",
    description: "クリアランスレベル5に到達した。蒼海計画へのアクセスが解放された。",
    icon: "◆", xp_reward: 500, is_secret: 1,
    check: s => s.level >= 5,
  },
  // ── XP系 ────────────────────────────────────────────────────────
  {
    key: "xp_1000",
    title: "1000XP到達",
    description: "累計1000XPを獲得した。",
    icon: "⬡", xp_reward: 50, is_secret: 0,
    check: s => s.xpTotal >= 1000,
  },
  {
    key: "xp_5000",
    title: "熟練機関員",
    description: "累計5000XPを獲得した。",
    icon: "⬡", xp_reward: 200, is_secret: 0,
    check: s => s.xpTotal >= 5000,
  },
  // ── ミッション系 ─────────────────────────────────────────────────
  {
    key: "first_mission",
    title: "初任務完了",
    description: "初めてのミッションを完了した。",
    icon: "◈", xp_reward: 100, is_secret: 0,
    check: s => s.missionCompleted >= 1,
  },
  {
    key: "mission_5",
    title: "ベテラン収束員",
    description: "5件のミッションを完了した。",
    icon: "◉", xp_reward: 250, is_secret: 0,
    check: s => s.missionCompleted >= 5,
  },
  // ── チャット系 ───────────────────────────────────────────────────
  {
    key: "chat_50",
    title: "情報伝達者",
    description: "50通のメッセージを送信した。",
    icon: "◎", xp_reward: 75, is_secret: 0,
    check: s => s.chatMessageCount >= 50,
  },
  {
    key: "chat_500",
    title: "機関の声",
    description: "500通のメッセージを送信した。",
    icon: "◎", xp_reward: 300, is_secret: 1,
    check: s => s.chatMessageCount >= 500,
  },
  // ── その他 ──────────────────────────────────────────────────────
  {
    key: "division_transfer",
    title: "部門異動",
    description: "部門移動を申請・承認された。",
    icon: "◇", xp_reward: 100, is_secret: 0,
    check: s => s.divisionTransferred,
  },
  {
    key: "entity_researcher",
    title: "実体研究者",
    description: "10件以上の実体情報を閲覧した。",
    icon: "◆", xp_reward: 150, is_secret: 0,
    check: s => s.entityViewed >= 10,
  },
  {
    key: "high_anomaly",
    title: "観測負荷：警戒",
    description: "異常スコアが50を超えた。観測される側になりつつある。",
    icon: "〜", xp_reward: 0, is_secret: 1,
    check: s => s.anomalyScore >= 50,
  },
];

/** DBの achievements テーブルにマスターデータを投入する（べき等） */
