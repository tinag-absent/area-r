/**
 * ストーリーイベント・トリガーシステム
 *
 * ユーザーの状態（LV・XP・ストリーク・異常スコア・フラグ）を評価し、
 * 条件を満たしたトリガーを発火してフラグ設定・XP付与・通知送信を行う。
 *
 * 発火制御の三重ロック:
 *   1. DB の fired_events テーブル（UNIQUE制約）─ 永続的な重複防止
 *   2. rate_limit_attempts（key_type='trigger'）─ 30秒以内の重複呼び出し防止
 *   3. ループ内の firedSet（メモリ）─ 同一リクエスト内の二重発火防止
 */

import { getDb, execute, queryOne, queryAll } from "./db";
import { randomUUID } from "crypto";
import { calculateLevel } from "./auth";
import type { NotificationType, ProgressFlagKey, ProgressFlags } from "./types";

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

/** トリガー評価時に渡されるユーザーのスナップショット */
export interface TriggerUser {
  id: string;
  level: number;
  xp: number;
  streak: number;
  anomalyScore: number;
  /** progress_flags テーブルの内容をキー/バリューで格納したもの */
  flags: ProgressFlags;
  /** story_variables テーブルの数値変数 */
  variables: Record<string, number>;
}

/** トリガー発火時に適用する効果 */
interface TriggerEffect {
  /** セットするフラグのキー */
  flag?: ProgressFlagKey;
  /** インクリメントする story_variable のキー */
  varKey?: string;
  /** インクリメント量（デフォルト 1） */
  varDelta?: number;
  /** フラグの値（省略時は "true"） */
  flagValue?: string;
  /** 付与するXP */
  xp?: number;
  /** 送信する通知 */
  notification?: {
    type: NotificationType;
    title: string;
    body: string;
  };
}

/** トリガー定義 */
interface Trigger {
  /** 一意なトリガーID（fired_events テーブルのキーにもなる） */
  id: string;
  /** 発火条件を判定する関数 */
  conditions: (user: TriggerUser) => boolean;
  /** 静的な効果（条件分岐が不要な場合） */
  effects: TriggerEffect;
  /** 動的な効果（ユーザー状態に応じてメッセージ等を変えたい場合） */
  getEffects?: (user: TriggerUser) => TriggerEffect;
}

// ─────────────────────────────────────────────────────────────────────
// トリガー定義
// ─────────────────────────────────────────────────────────────────────

export const TRIGGERS: Trigger[] = [
  // ── システム系 ────────────────────────────────────────────────────
  {
    id: "first_login_complete",
    conditions: (u) => !u.flags["first_login_done"],
    effects: {
      flag: "first_login_done",
      notification: {
        type: "system",
        title: "機関へようこそ",
        body: "海蝕機関への着任を確認しました。あなたのIDが正式に登録されました。",
      },
    },
  },

  // ── レベルアップ系 ─────────────────────────────────────────────────
  {
    id: "level2_unlocked",
    conditions: (u) => u.level >= 2 && !u.flags["level2_unlocked"],
    effects: {
      flag: "level2_unlocked",
      notification: {
        type: "info",
        title: "クリアランスレベル 2 解放",
        body: "ミッション閲覧権限が付与されました。/missions にアクセス可能になりました。",
      },
    },
  },
  {
    id: "level3_unlocked",
    conditions: (u) => u.level >= 3 && !u.flags["level3_unlocked"],
    effects: {
      flag: "level3_unlocked",
      notification: {
        type: "info",
        title: "クリアランスレベル 3 解放",
        body: "コンソールアクセス権限が付与されました。深層観測データへのアクセスが可能です。",
      },
    },
  },

  // ── 異常スコア系（動的メッセージ） ───────────────────────────────
  {
    id: "anomaly_detected",
    conditions: (u) => u.anomalyScore > 30 && !u.flags["anomaly_detected"],
    effects: {},
    getEffects: (u) => ({
      flag: "anomaly_detected",
      notification: {
        type: "warning",
        title: "異常スコア警告",
        body: `あなたの異常スコアが閾値を超えました（現在: ${u.anomalyScore}）。機関が監視を開始しました。`,
      },
    }),
  },
  {
    id: "observer_warning",
    conditions: (u) => u.anomalyScore > 60 && !u.flags["observer_warned"],
    effects: {},
    getEffects: (u) => ({
      flag: "observer_warned",
      notification: {
        type: "warning",
        title: "【警告】観測者の注目",
        body: `異常スコア ${u.anomalyScore} — 観測者があなたの活動を記録しています。`,
      },
    }),
  },

  // ── ストリーク実績系 ───────────────────────────────────────────────
  {
    id: "streak_3days",
    conditions: (u) => u.streak >= 3 && !u.flags["streak_3days_done"],
    effects: {
      flag: "streak_3days_done",
      xp: 50,
      notification: {
        type: "achievement",
        title: "3日連続ログイン達成",
        body: "継続的な活動が認められました。+50 XP を付与します。",
      },
    },
  },
  {
    id: "streak_7days",
    conditions: (u) => u.streak >= 7 && !u.flags["streak_7days_done"],
    effects: {
      flag: "streak_7days_done",
      xp: 150,
      notification: {
        type: "achievement",
        title: "7日連続ログイン達成",
        body: "あなたの献身は機関に認められました。+150 XP を付与します。",
      },
    },
  },

  // ── ストーリー系 ───────────────────────────────────────────────────
  {
    id: "phase1_unlocked",
    conditions: (u) =>
      u.flags["first_login_done"] === "true" &&
      u.level >= 1 &&
      !u.flags["phase1_unlocked"],
    effects: {
      flag: "phase1_unlocked",
      notification: {
        type: "story",
        title: "フェーズ1 開始",
        body: "海蝕現象の初期観測データへのアクセスが承認されました。収束部門からの報告を確認してください。",
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────
// DBトリガーローダー（DB優先・コードフォールバック）
// ─────────────────────────────────────────────────────────────────────

interface TriggerCache {
  triggers: Trigger[];
  loadedAt: number;
}

let triggerCache: TriggerCache | null = null;
const TRIGGER_CACHE_TTL_MS = 60_000; // 1分

/** story_triggers テーブルからアクティブなトリガーを読み込む */
async function loadTriggersFromDb(): Promise<Trigger[]> {
  const db = getDb();
  try {
    const rows = await queryAll<{
      id: string;
      trigger_type: string;
      conditions_json: string;
      effects_json: string;
    }>(db,
      `SELECT id, trigger_type, conditions_json, effects_json
       FROM story_triggers
       WHERE active = 1
       ORDER BY priority DESC`
    );

    if (rows.length === 0) return TRIGGERS;

    return rows.map(row => {
      const cond    = JSON.parse(row.conditions_json) as Record<string, unknown>;
      const effects = JSON.parse(row.effects_json)    as TriggerEffect;

      // conditions_json から conditions 関数を生成
      const conditions = (u: TriggerUser): boolean => {
        // not_flag: このフラグが立っていないことが条件
        if (typeof cond.not_flag === "string") {
          if (u.flags[cond.not_flag as ProgressFlagKey] !== undefined) return false;
        }
        // required_flag: このフラグが立っていることが条件
        if (typeof cond.required_flag === "string") {
          if (u.flags[cond.required_flag as ProgressFlagKey] === undefined) return false;
        }
        // min_level
        if (typeof cond.min_level === "number" && u.level < cond.min_level) return false;
        // min_xp
        if (typeof cond.min_xp === "number" && u.xp < cond.min_xp) return false;
        // min_streak
        if (typeof cond.min_streak === "number" && u.streak < cond.min_streak) return false;
        // min_anomaly
        if (typeof cond.min_anomaly === "number" && u.anomalyScore < cond.min_anomaly) return false;
        // max_anomaly
        if (typeof cond.max_anomaly === "number" && u.anomalyScore > cond.max_anomaly) return false;
        return true;
      };

      return { id: row.id, conditions, effects } satisfies Trigger;
    });
  } catch {
    // DBエラー時はハードコードにフォールバック
    return TRIGGERS;
  }
}

/** キャッシュ付きトリガー取得 */
async function getActiveTriggers(): Promise<Trigger[]> {
  const now = Date.now();
  if (triggerCache && now - triggerCache.loadedAt < TRIGGER_CACHE_TTL_MS) {
    return triggerCache.triggers;
  }
  const triggers = await loadTriggersFromDb();
  triggerCache = { triggers, loadedAt: now };
  return triggers;
}

/** 管理者がトリガーを更新したときにキャッシュを即時無効化する */
export function invalidateTriggerCache(): void {
  triggerCache = null;
}

// ─────────────────────────────────────────────────────────────────────
// トリガー実行エンジン
// ─────────────────────────────────────────────────────────────────────

/**
 * ユーザーの現在状態をすべてのトリガーと照合し、条件を満たしたものを発火する。
 *
 * - 30秒以内に同じユーザーで呼び出された場合はスキップ（連打対策）
 * - fired_events に記録済みのトリガーはスキップ（一生に一度だけ発火）
 * - フラグ更新はDBとメモリ両方に即反映（ループ後半のトリガーが参照できるように）
 */
export async function checkAndFireTriggers(user: TriggerUser): Promise<void> {
  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // ── レート制限: 30秒以内の重複呼び出しを防ぐ ────────────────────
  const rateLimitKey = `trigger:${user.id}`;
  const recentCall = await queryOne<{ id: string }>(
    db,
    `SELECT id FROM rate_limit_attempts
     WHERE key_value = ? AND key_type = 'trigger'
       AND attempted_at > datetime('now', '-30 seconds')
     LIMIT 1`,
    [rateLimitKey]
  );
  if (recentCall) return;

  await execute(
    db,
    `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, attempted_at, expires_at)
     VALUES (?, 'trigger', ?, 1, datetime('now'), datetime('now', '+1 hour'))`,
    [randomUUID(), rateLimitKey]
  );

  // ── メモリ内の発火セットとフラグ（ループ内でインクリメンタルに更新） ──
  const firedSet = new Set<string>();
  const flags: ProgressFlags = { ...user.flags };

  // DB優先・コードフォールバックでアクティブトリガーを取得
  const activeTriggers = await getActiveTriggers();

  for (const trigger of activeTriggers) {
    if (firedSet.has(trigger.id)) continue;

    // DB確認：過去に発火済みか
    const alreadyFired = await queryOne<{ id: string }>(
      db,
      "SELECT id FROM fired_events WHERE user_id = ? AND event_id = ?",
      [user.id, trigger.id]
    );
    if (alreadyFired) continue;

    // 最新フラグを反映したユーザーオブジェクトで条件を判定
    if (!trigger.conditions({ ...user, flags })) continue;

    // 効果を解決（動的 getEffects が優先）
    const effects = trigger.getEffects
      ? trigger.getEffects({ ...user, flags })
      : trigger.effects;

    // 発火済みとしてDBとメモリに記録
    await execute(
      db,
      `INSERT INTO fired_events (id, user_id, event_id, fired_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT DO NOTHING`,
      [randomUUID(), user.id, trigger.id]
    );
    firedSet.add(trigger.id);

    // フラグを設定（DBとメモリを同時更新）
    if (effects.flag) {
      await execute(
        db,
        `INSERT INTO progress_flags (id, user_id, flag_key, flag_value, set_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT (user_id, flag_key) DO UPDATE SET flag_value = excluded.flag_value`,
        [randomUUID(), user.id, effects.flag, effects.flagValue ?? "true"]
      );
      flags[effects.flag] = effects.flagValue ?? "true";
    }

    // XPを付与（レベルも再計算）
    if (effects.xp && effects.xp > 0) {
      const current = await queryOne<{ xp_total: number }>(
        db,
        "SELECT xp_total FROM users WHERE id = ?",
        [user.id]
      );
      const newXp = (Number(current?.xp_total) || 0) + effects.xp;
      await execute(
        db,
        "UPDATE users SET xp_total = ?, clearance_level = ? WHERE id = ?",
        [newXp, calculateLevel(newXp), user.id]
      );
    }

    // story_variable をインクリメント
    if (effects.varKey) {
      const delta = effects.varDelta ?? 1;
      await execute(db,
        `INSERT INTO story_variables (id, user_id, var_key, var_value)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, var_key) DO UPDATE SET var_value = var_value + ?`,
        [randomUUID(), user.id, effects.varKey, delta, delta]
      );
    }

    // 通知を送信（24時間以内に同タイトルの通知がある場合はスキップ）
    if (effects.notification) {
      const duplicate = await queryOne<{ id: string }>(
        db,
        `SELECT id FROM notifications
         WHERE user_id = ? AND title = ?
           AND created_at > datetime('now', '-1 day')`,
        [user.id, effects.notification.title]
      );
      if (!duplicate) {
        await execute(
          db,
          `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
          [
            randomUUID(),
            user.id,
            effects.notification.type,
            effects.notification.title,
            effects.notification.body,
          ]
        );
      }
    }
  }
}
