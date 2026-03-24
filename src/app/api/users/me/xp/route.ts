/**
 * POST /api/users/me/xp
 *
 * XP付与エンドポイント。
 * - activityに対応するXP報酬を付与する
 * - 初回限定アクティビティと24時間レート制限をチェック
 * - レベルアップした場合はJWTを再発行してCookieを更新する
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ApiError, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";
import { signToken, setAuthCookie, calculateLevel } from "@/lib/auth";
import { XP_REWARDS, XP_RATE_LIMITS, XP_ONLY_FIRST } from "@/lib/constants";
import { randomUUID } from "crypto";
import { toSqliteUtc } from "@/lib/date";

export const POST = withErrorHandler(
  async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  let body: { activity?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 }); }

  const { activity } = body;
  if (!activity || typeof activity !== "string" || activity.length > 64)
    return NextResponse.json({ error: "activityが不正です" }, { status: 400 });

  const db = getDb();
  const xp = XP_REWARDS[activity] ?? 0;
  if (xp <= 0) return NextResponse.json({ xpGained: 0 });

  // 初回限定チェック
  if (XP_ONLY_FIRST.has(activity)) {
    const exists = await queryOne(db, `SELECT id FROM xp_logs WHERE user_id=? AND activity=?`, [auth.user.id, activity]);
    if (exists) return NextResponse.json({ xpGained: 0, rateLimit: 1 });
  }

  // 24時間レート制限チェック
  const limit = XP_RATE_LIMITS[activity] ?? 999;
  const since = toSqliteUtc(new Date(Date.now() - 86_400_000));
  const cnt = await queryOne<{ c: number }>(db,
    `SELECT COUNT(*) as c FROM xp_logs WHERE user_id=? AND activity=? AND created_at > ?`,
    [auth.user.id, activity, since]
  );
  if ((cnt?.c ?? 0) >= limit) return NextResponse.json({ xpGained: 0, rateLimit: 1 });

  await execute(db,
    `UPDATE users SET xp_total = COALESCE(xp_total,0) + ? WHERE id = ?`,
    [xp, auth.user.id]
  );
  await execute(db,
    `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?,?,?,?)`,
    [randomUUID(), auth.user.id, activity, xp]
  );

  const updated = await queryOne<{ xp_total: number; clearance_level: number }>(db,
    `SELECT xp_total, clearance_level FROM users WHERE id=?`, [auth.user.id]
  );
  const newXp = Number(updated?.xp_total ?? 0);
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > auth.user.level;

  if (leveledUp) {
    await execute(db, `UPDATE users SET clearance_level=? WHERE id=?`, [newLevel, auth.user.id]);
  }

  const res = NextResponse.json({ xpGained: xp, newXp, newLevel, leveledUp });

  // レベルアップ時はJWTを再発行してCookieを更新
  if (leveledUp) {
    const user = await queryOne<{ agent_id: string; role: import('@/lib/types').UserRole }>(db,
      `SELECT agent_id, role FROM users WHERE id=?`, [auth.user.id]
    );
    if (user) {
      const token = await signToken({ id: auth.user.id, agentId: user.agent_id, role: user.role, level: newLevel });
      setAuthCookie(res, token);
    }
  }
  return res;
}
);
