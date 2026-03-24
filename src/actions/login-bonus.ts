"use server";
/**
 * Server Action: ログインボーナス処理
 *
 * DashboardPageのServer Componentから呼び出す。
 * useEffect + fetchの2往復をなくしてレンダリング時に同期処理する。
 */
import { cookies } from "next/headers";
import { getDb, queryOne, execute, queryProgressFlags } from "@/lib/db";
import { DAILY_LOGIN_REWARDS, XP_ONLY_FIRST } from "@/lib/constants";
import { utcDaysDiff, toSqliteUtc } from "@/lib/date";
import { COOKIE_NAME, verifyToken, calculateLevel, signToken } from "@/lib/auth";
import { randomUUID } from "crypto";
import type { DbUser } from "@/lib/auth";

export interface LoginBonusResult {
  xp:        number;
  level:     number;
  streak:    number;
  xpGained:  number;
  leveledUp: boolean;
  newLevel:  number;
}

export async function processLoginBonus(): Promise<LoginBonusResult | null> {
  try {
  const jar   = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const user = await queryOne<DbUser>(db, `SELECT * FROM users WHERE id = ?`, [payload.id]);
  if (!user) return null;

  const now        = new Date();
  const nowUtcDate = now.toISOString().slice(0, 10);

  // ── ストリーク計算 ───────────────────────────────────────────────
  let isNewDay  = true;
  let newStreak = 1;

  if (user.last_login_at) {
    const lastUtcDate = user.last_login_at.slice(0, 10);
    const daysDiff    = utcDaysDiff(nowUtcDate, lastUtcDate);
    if (daysDiff === 0) {
      isNewDay  = false;
      newStreak = Number(user.consecutive_login_days);
    } else {
      newStreak = daysDiff === 1 ? Number(user.consecutive_login_days) + 1 : 1;
    }
  }

  // ── XP 計算 ────────────────────────────────────────────────────
  let xpBonus = 0;
  if (isNewDay) {
    const isFirstEver = !(await queryOne(
      db,
      `SELECT id FROM xp_logs WHERE user_id = ? AND activity = 'first_login'`,
      [user.id]
    ));
    if (isFirstEver && XP_ONLY_FIRST.has("first_login")) xpBonus += 50;

    const cappedStreak = Math.min(newStreak, 7);
    const streakIdx    = ((cappedStreak - 1) % 7) + 1;
    xpBonus += DAILY_LOGIN_REWARDS[streakIdx] ?? 25;
  }

  // ── DB 更新 ────────────────────────────────────────────────────
  const oldXp     = Number(user.xp_total ?? 0);
  const newXp     = oldXp + xpBonus;
  const oldLevel  = Number(user.clearance_level ?? 0);
  const newLevel  = calculateLevel(newXp);
  const leveledUp = newLevel > oldLevel;

  await execute(
    db,
    `UPDATE users SET
       xp_total               = COALESCE(xp_total, 0) + ?,
       clearance_level        = ?,
       consecutive_login_days = ?,
       last_login_at          = ?
     WHERE id = ?`,
    [xpBonus, newLevel, newStreak, toSqliteUtc(now), user.id]
  );

  if (xpBonus > 0) {
    await execute(db,
      `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'daily_login', ?)`,
      [randomUUID(), user.id, xpBonus]
    );
  }

  // ── レベルアップ時はJWTを再発行 ────────────────────────────────
  // SEC-4: Server ActionではNextResponseが使えないため cookies().set で直接Cookieを更新する
  if (leveledUp) {
    const newToken = await signToken({
      id:      user.id,
      agentId: user.agent_id,
      role:    user.role,
      level:   newLevel,
    });
    jar.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });
  }

  return {
    xp:       newXp,
    level:    newLevel,
    streak:   newStreak,
    xpGained: xpBonus,
    leveledUp,
    newLevel,
  };
  } catch (err) {
    // DB エラー・JWT検証失敗などはログのみ記録してnullを返す（ページをクラッシュさせない）
    console.error("[processLoginBonus] error:", err instanceof Error ? err.message : err);
    return null;
  }
}
