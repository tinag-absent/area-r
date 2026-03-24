/**
 * 実績サーバーロジック（DB操作 / Node.js API 使用 — Server Components 専用）
 * クライアントコンポーネントは @/lib/achievements-data を import すること
 */
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";
import { calculateLevel } from "@/lib/auth";
import { ACHIEVEMENTS_MASTER } from "./achievements-data";
import type { AchievementStats } from "./achievements-data";

export type { AchievementDef, AchievementStats } from "./achievements-data";
export { ACHIEVEMENTS_MASTER } from "./achievements-data";

/** DBの achievements テーブルにマスターデータを投入する（べき等） */
export async function seedAchievements(): Promise<void> {
  const db = getDb();
  for (const a of ACHIEVEMENTS_MASTER) {
    const id = `ach-${a.key}`;
    await execute(db,
      `INSERT OR IGNORE INTO achievements (id, key, title, description, icon, xp_reward, is_secret)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, a.key, a.title, a.description, a.icon, a.xp_reward, a.is_secret]
    );
  }
}

/** ユーザーの統計を収集して未取得の実績を付与する */
export async function checkAndGrantAchievements(userId: string): Promise<string[]> {
  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const user = await queryOne<{
    login_count: number; consecutive_login_days: number;
    xp_total: number; clearance_level: number; anomaly_score: number;
  }>(db, `SELECT login_count, consecutive_login_days, xp_total, clearance_level, anomaly_score FROM users WHERE id = ?`, [userId]);
  if (!user) return [];

  const missionRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) as cnt FROM mission_participants WHERE user_id = ? AND status = 'completed'`, [userId]
  );
  const chatRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) as cnt FROM chat_messages WHERE sender_id = ? AND type = 'user'`, [userId]
  );
  // [Fix] division_transfer_requests テーブルは存在しない。
  // 部門移動は xp_logs の activity='division_transfer' で記録される。
  const transferRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) as cnt FROM xp_logs WHERE user_id = ? AND activity = 'division_transfer'`, [userId]
  );
  const bookmarkRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) as cnt FROM bookmarks WHERE user_id = ?`, [userId]
  );
  // [Fix] 'view_entity' は XP_REWARDS に存在せず xp_logs に記録されない。
  // entity閲覧は view_classified で記録されるため、そちらを参照する。
  const entityRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) as cnt FROM xp_logs WHERE user_id = ? AND activity = 'view_classified'`, [userId]
  );

  const stats: AchievementStats = {
    loginCount:          Number(user.login_count),
    streak:              Number(user.consecutive_login_days),
    xpTotal:             Number(user.xp_total),
    level:               calculateLevel(Number(user.xp_total)),
    missionCompleted:    Number(missionRow?.cnt ?? 0),
    chatMessageCount:    Number(chatRow?.cnt ?? 0),
    anomalyScore:        Number(user.anomaly_score),
    divisionTransferred: (transferRow?.cnt ?? 0) > 0,
    bookmarkCount:       Number(bookmarkRow?.cnt ?? 0),
    entityViewed:        Number(entityRow?.cnt ?? 0),
  };

  const earned = await queryAll<{ key: string }>(db,
    `SELECT a.key FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = ?`,
    [userId]
  );
  const earnedSet = new Set(earned.map(r => r.key));

  const granted: string[] = [];
  for (const def of ACHIEVEMENTS_MASTER) {
    if (earnedSet.has(def.key)) continue;
    if (!def.check(stats)) continue;

    let achRow = await queryOne<{ id: string }>(db, `SELECT id FROM achievements WHERE key = ?`, [def.key]);
    if (!achRow) {
      const newId = `ach-${def.key}`;
      await execute(db,
        `INSERT OR IGNORE INTO achievements (id, key, title, description, icon, xp_reward, is_secret)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId, def.key, def.title, def.description, def.icon, def.xp_reward, def.is_secret]
      );
      achRow = { id: newId };
    }

    await execute(db,
      `INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id, earned_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [randomUUID(), userId, achRow.id]
    );

    if (def.xp_reward > 0) {
      await execute(db,
        `UPDATE users SET xp_total = xp_total + ? WHERE id = ?`, [def.xp_reward, userId]
      );
      await execute(db,
        `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'achievement', ?)`,
        [randomUUID(), userId, def.xp_reward]
      );
    }

    await execute(db,
      `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
       VALUES (?, ?, 'achievement', ?, ?, 0, datetime('now'))`,
      [
        randomUUID(), userId,
        `実績解除: ${def.title}`,
        `${def.description}${def.xp_reward > 0 ? ` (+${def.xp_reward} XP)` : ""}`,
      ]
    );

    granted.push(def.key);
    earnedSet.add(def.key);
  }

  return granted;
}
