/**
 * Icon.tsx — 海蝕機関 SVGアイコンコンポーネント（Material Symbols CDN版）
 * Updated: 2026-03-19 03:55 JST — カスタムSVGパスをGoogle Fonts Material Symbols Rounded CDN版に全面置換
 *
 * Google Fonts Material Symbols を CDN 経由で使用。
 * フォントは layout.tsx / _document で一度だけロードすれば全ページで有効。
 *
 * 使い方:
 *   <Icon name="dashboard" size={12} />
 *   <Icon name="chat" size={14} color="var(--color-primary)" />
 *
 * CDN link タグ（layout.tsx の <head> に追加が必要）:
 *   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
 */

import type { CSSProperties } from "react";

export type IconName =
  | "dashboard"        // スペースダッシュボード
  | "chat"             // チャット
  | "mission"          // ターゲット（ミッション）
  | "entity"           // 六角形（エンティティ）
  | "personnel"        // 人物（人事）
  | "hex"              // ハニカム（モジュール/施設）
  | "notify"           // 通知ベル
  | "database"         // データベース
  | "search"           // 検索
  | "heart"            // ハート（A-PHOS）
  | "wave"             // 波（G-MIST）
  | "warning"          // 警告
  | "chevron-up"       // 上矢印
  | "chevron-down"     // 下矢印
  | "chevron-right"    // 右矢印
  | "dot"              // ドット（アクティブ）
  | "star"             // 星
  | "menu"             // ハンバーガーメニュー
  | "close"            // 閉じる
  | "bolt"             // 雷（エネルギー）
  | "external"         // 外部リンク
  | "reset"            // リセット
  | "play"             // 実行
  | "lock"             // ロック
  | "settings"         // 設定
  | "map"              // マップ
  | "classified"       // 機密
  | "npc"              // NPC通信
  | "skill"            // スキルツリー
  | "cipher"           // 暗号解読
  | "console"          // コンソール/ターミナル
  | "novel"            // 小説/日記
  | "event"            // イベント
  | "bulletin"         // 掲示板
  | "transfer"         // 部門移動
  | "discovered"       // 発見記録
  | "profile"          // プロフィール
  | "admin"            // 管理者
  | "security"         // セキュリティ
  | "xp"               // XP/経験値
  | "rule"             // ルールエンジン
  | "story"            // ストーリー
  | "analytics"        // 分析
  | "check"            // チェック（成功）
  | "error"            // エラー
  | "eye"              // 表示（パスワード表示）
  | "eye-off";         // 非表示（パスワード隠す）

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
  /** Material Symbols の FILL 値: 0=アウトライン, 1=塗りつぶし */
  fill?: 0 | 1;
  /** Material Symbols の wght 値 (100–700) */
  weight?: number;
}

/**
 * IconName → Material Symbols のリガチャ文字列マッピング
 * https://fonts.google.com/icons?icon.style=Rounded
 */
const LIGATURES: Record<IconName, string> = {
  dashboard:      "space_dashboard",      // グリッド状のダッシュボード
  chat:           "forum",                // 吹き出し2つ（チャット/観測）
  mission:        "my_location",          // ターゲット照準（ミッション遂行）
  entity:         "category",             // 円＋四角の分類アイコン（エンティティ種別）
  personnel:      "badge",                // IDバッジ（人事/エージェント）
  hex:            "hub",                  // ハブ接続（モジュール/施設/部門）
  notify:         "notifications",        // ベル（通知）
  database:       "storage",              // サーバーラック（データベース）
  search:         "manage_search",        // 虫眼鏡＋テキスト（検索/履歴）
  heart:          "favorite",             // ハート（A-PHOS 感情パラメータ）
  wave:           "water",                // 波（G-MIST 霧散指数）
  warning:        "warning",              // 三角警告（脅威レベル）
  "chevron-up":   "expand_less",          // 上矢印（折りたたみ）
  "chevron-down": "expand_more",          // 下矢印（展開）
  "chevron-right":"chevron_right",        // 右矢印（リスト項目）
  dot:            "radio_button_checked", // 塗り丸（アクティブ状態）
  star:           "grade",                // 星（レベル/評価）
  menu:           "menu",                 // ハンバーガー（モバイルメニュー）
  close:          "close",                // ✕（閉じる）
  bolt:           "electric_bolt",        // 雷（エネルギー/XPボーナス）
  external:       "open_in_new",          // 外部リンク矢印
  reset:          "refresh",              // 更新（ズームリセット）
  play:           "play_arrow",           // 再生矢印（実行）
  lock:           "lock",                 // 南京錠（閲覧制限）
  settings:       "tune",                 // スライダー調整（設定）
  map:            "explore",              // コンパス（インシデントマップ）
  classified:     "visibility_off",       // 目に斜線（機密/閲覧不可）
  npc:            "support_agent",        // ヘッドセット人物（NPC通信）
  skill:          "account_tree",         // ブランチツリー（スキルツリー）
  cipher:         "key",                  // 鍵（暗号解読パズル）
  console:        "terminal",             // >_ ターミナル（コンソール操作）
  novel:          "auto_stories",         // 開いた本＋スパークル（物語/日記）
  event:          "event",                // カレンダー（イベントスケジュール）
  bulletin:       "push_pin",             // 画鋲（掲示板ピン留め）
  transfer:       "swap_horiz",           // 左右矢印（部門移動）
  discovered:     "travel_explore",       // 地球儀＋虫眼鏡（発見記録）
  profile:        "account_circle",       // 人物アイコン（プロフィール）
  admin:          "admin_panel_settings", // シールド＋人物（管理者）
  security:       "verified_user",        // チェック入りシールド（セキュリティ）
  xp:             "trending_up",          // 上昇グラフ（XP獲得）
  rule:           "rule_settings",        // ギア＋チェック（ルールエンジン）
  story:          "menu_book",            // 開いた本（ストーリーエンジン）
  analytics:      "bar_chart",            // 棒グラフ（分析ダッシュボード）
  check:          "check_circle",         // チェック丸（成功/完了）
  error:          "error",                // 感嘆符丸（エラー）
  eye:            "visibility",           // 目（パスワード表示）
  "eye-off":      "visibility_off",       // 目に斜線（パスワード隠す）
};

export function Icon({
  name,
  size = 14,
  color = "currentColor",
  className,
  style,
  "aria-hidden": ariaHidden = true,
  fill = 0,
  weight = 300,
}: IconProps) {
  const ligature = LIGATURES[name];

  return (
    <span
      className={`material-symbols-rounded${className ? ` ${className}` : ""}`}
      aria-hidden={ariaHidden}
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        color,
        // Material Symbols 可変フォント軸
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${Math.max(20, Math.min(48, size))}`,
        userSelect: "none",
        ...style,
      }}
    >
      {ligature}
    </span>
  );
}

/** Sidebar / AdminNav の icon フィールド（文字列）を Icon コンポーネントに変換するヘルパー */
export function NavIcon({ icon, size = 13, color }: { icon: string; size?: number; color?: string }) {
  const nameMap: Record<string, IconName> = {
    "◈": "dashboard",   "◎": "chat",        "◉": "mission",     "◆": "entity",
    "◇": "personnel",   "⬡": "hex",         "◐": "notify",      "▣": "database",
    "◫": "search",      "♡": "heart",       "〜": "wave",        "⚠": "warning",
    "▲": "chevron-up",  "▼": "chevron-down", "›": "chevron-right",
    "●": "dot",         "★": "star",        "☰": "menu",        "✕": "close",
    "⚡": "bolt",       "↗": "external",    "⊙": "reset",       "▶": "play",
    "⚙": "settings",
    // 文字列キー（Sidebar / admin/page.tsx で使用）
    // OPERATIONS
    "dashboard":  "dashboard",   "chat":      "chat",      "notify":    "notify",
    // FIELD
    "map":        "map",         "event":     "event",     "console":   "console",
    // AGENCY
    "bulletin":   "bulletin",    "database":  "database",
    // ARCHIVE
    "novel":      "novel",       "story":     "story",     "cipher":    "cipher",
    "skill":      "skill",       "star":      "star",      "classified":"classified",
    // PERSONAL
    "profile":    "profile",     "settings":  "settings",
    // ADMIN / MISC
    "mission":    "mission",     "entity":    "entity",    "hex":       "hex",
    "analytics":  "analytics",   "security":  "security",  "npc":       "npc",
    "transfer":   "transfer",    "discovered":"discovered", "personnel": "personnel",
    "search":     "search",      "lock":      "lock",      "play":      "play",
  };
  const resolved = nameMap[icon] as IconName | undefined;
  if (!resolved) {
    // マップにない場合はそのまま表示（フォールバック）
    return <span aria-hidden="true" style={{ fontSize: size * 0.85 }}>{icon}</span>;
  }
  return <Icon name={resolved} size={size} color={color} />;
}
