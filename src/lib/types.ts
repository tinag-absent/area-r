/**
 * プロジェクト共通のリテラル型定義
 *
 * TYPE-1 〜 TYPE-8 の修正として、曖昧な string 型を
 * 許容値のみのユニオン型に強化する。
 */

// ─── ユーザーロール / ステータス ─────────────────────────────────────

/** ユーザーが持ちうるロールの全列挙 */
export type UserRole =
  | "player"
  | "observer"
  | "admin"
  | "super_admin";

/** ユーザーアカウントのステータスの全列挙 */
export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "banned"
  | "pending_verification";

// ─── チャット ─────────────────────────────────────────────────────────

/** TYPE-5: 許可されたチャットチャンネルIDのリテラル型 */
export type ChatChannel =
  | "global"    // 全員参加グローバルチャット（旧: "general"）
  | "npc_group"
  | "secure"
  | "classified";

// ─── ストーリーフラグ ────────────────────────────────────────────────

/** TYPE-8: progress_flags テーブルで使用する全フラグキーの列挙 */
export type ProgressFlagKey =
  | "first_login_done"
  | "level2_unlocked"
  | "level3_unlocked"
  | "anomaly_detected"
  | "observer_warned"
  | "streak_3days_done"
  | "streak_7days_done"
  | "phase1_unlocked"
  | "tutorial_complete";

/** フラグキー → 値 のマップ型 */
export type ProgressFlags = Partial<Record<ProgressFlagKey, string>>;

// ─── 通知タイプ ───────────────────────────────────────────────────────

/** TYPE-4: Toast およびDBの通知レコードで使用する通知タイプ */
export type NotificationType =
  // ── ARG演出用 ────────────────────────────────────────────────
  | "xp"          // XP獲得 (+N XP)
  | "levelup"     // レベルアップ（特別演出）
  | "login"       // ログインボーナス（streak/XP表示）
  | "unlock"      // コンテンツ解放通知
  | "mission"     // ミッション更新
  // ── システム用 ───────────────────────────────────────────────
  | "info"
  | "warning"
  | "achievement"
  | "system"
  | "error"
  | "story";

// ─── 管理者が更新可能なユーザーフィールド ─────────────────────────────

/** SEC-2 / SEC-3: PATCH /api/admin/users で更新を許可するフィールドの列挙 */
export type AdminEditableField =
  | "status"
  | "role"
  | "clearance_level"
  | "xp_total"
  | "anomaly_score";

/** SEC-3: フィールドごとに許容する値の型マップ */
export type AdminFieldValueMap = {
  status:          UserStatus;
  role:            Exclude<UserRole, "super_admin">; // SEC-2: adminはsuper_adminに昇格不可
  clearance_level: 0 | 1 | 2 | 3 | 4 | 5;
  xp_total:        number;
  anomaly_score:   number;
};

// ─── ルールエンジン ───────────────────────────────────────────────────

/** SEC-6: rule_engine_entries に登録できる type の列挙 */
export type RuleEngineType =
  | "xp_rule"
  | "anomaly_rule"
  | "arg_keyword"
  | "known_flag"
  | "schedule";
