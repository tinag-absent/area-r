/**
 * POST /api/users/me/login
 *
 * ログインボーナス処理エンドポイント。認証後に毎回呼び出す。
 * - 連続ログインストリークを計算・更新
 * - 初回ログインボーナスと連続ログインXPを付与
 * - レベルアップ時はJWTを再発行してCookieを更新
 * - 最新のユーザー状態（フラグ含む）を返す
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute, queryProgressFlags } from "@/lib/db";
import { signToken, setAuthCookie, calculateLevel } from "@/lib/auth";
import type { DbUser } from "@/lib/auth";
import { DAILY_LOGIN_REWARDS, XP_ONLY_FIRST } from "@/lib/constants";
import { utcDaysDiff, toSqliteUtc } from "@/lib/date";
import { randomUUID } from "crypto";

export const POST = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const user = await queryOne<DbUser>(db, `SELECT * FROM users WHERE id = ?`, [auth.user.id]);
  if (!user) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  const now        = new Date();
  const nowUtcDate = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // ── ストリーク計算 ───────────────────────────────────────────────
  let isNewDay = true;
  let newStreak = 1;

  if (user.last_login_at) {
    // SQLite の datetime は "YYYY-MM-DD HH:MM:SS"（UTC）
    const lastUtcDate = user.last_login_at.slice(0, 10);
    // utcDaysDiff でカレンダー日付を正確に比較
    const daysDiff = utcDaysDiff(nowUtcDate, lastUtcDate);

    if (daysDiff === 0) {
      // 同日2回目: ストリーク・XP変化なし
      isNewDay  = false;
      newStreak = Number(user.consecutive_login_days);
    } else {
      // 翌日: streak+1、2日以上空いた: リセット
      newStreak = daysDiff === 1 ? Number(user.consecutive_login_days) + 1 : 1;
    }
  }

  // ── XP 計算 ────────────────────────────────────────────────────
  let xpBonus = 0;

  if (isNewDay) {
    const isFirstEver = !!(await queryOne(
      db,
      `SELECT id FROM xp_logs WHERE user_id = ? AND activity = 'first_login'`,
      [user.id]
    )) === false;

    if (isFirstEver && XP_ONLY_FIRST.has("first_login")) xpBonus += 50;

    const cappedStreak = Math.min(newStreak, 7);
    const streakIdx    = ((cappedStreak - 1) % 7) + 1;
    xpBonus += DAILY_LOGIN_REWARDS[streakIdx] ?? 25;
  }

  // ── DB 更新 ────────────────────────────────────────────────────
  const oldXp    = Number(user.xp_total ?? 0);
  const newXp    = oldXp + xpBonus;
  const oldLevel = Number(user.clearance_level ?? 0);
  const newLevel = calculateLevel(newXp);
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

  // ── フラグ取得（TYPE-6/8: as string キャスト不要） ─────────────
  const flags = await queryProgressFlags(db, user.id);

  // ── レベルアップ時は JWT を再発行 ──────────────────────────────
  const res = NextResponse.json({
    id:          user.id,
    agentId:     user.agent_id,
    username:    user.username,
    displayName: user.display_name,
    divisionId:  user.division_id,
    role:        user.role,
    status:      user.status,
    level:       newLevel,
    xp:          newXp,
    anomalyScore: Number(user.anomaly_score ?? 0),
    observerLoad: Number(user.observer_load ?? 0),
    streak:      newStreak,
    flags,
    loginBonus:  { xpGained: xpBonus, streak: newStreak, leveledUp, newLevel },
  });

  if (leveledUp) {
    const token = await signToken({
      id:      user.id,
      agentId: user.agent_id,
      role:    user.role,
      level:   newLevel,
    });
    setAuthCookie(res, token);
  }

  return res;
}
);
