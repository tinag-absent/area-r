/**
 * POST /api/users/me/check-triggers
 *
 * ストーリートリガーを評価して発火するエンドポイント。
 * UserProvider のマウント時に fire & forget で呼び出される。
 */
import { NextRequest, NextResponse }     from "next/server";
import { withErrorHandler }              from "@/lib/api-error";
import { requireAuth, isAuthError }      from "@/lib/server-auth";
import { getDb, queryOne, queryAll, queryProgressFlags } from "@/lib/db";
import { checkAndFireTriggers }          from "@/lib/event-triggers";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const user = await queryOne<{
    xp_total: number; clearance_level: number;
    consecutive_login_days: number; anomaly_score: number;
  }>(db,
    `SELECT xp_total, clearance_level, consecutive_login_days, anomaly_score FROM users WHERE id=?`,
    [auth.user.id]
  );
  if (!user) return NextResponse.json({ fired: [] });

  const [flags, vars] = await Promise.all([
    queryProgressFlags(db, auth.user.id),
    queryAll<{ var_key: string; var_value: number }>(db,
      "SELECT var_key, var_value FROM story_variables WHERE user_id = ?",
      [auth.user.id]
    ),
  ]);

  const variables = Object.fromEntries(vars.map(r => [r.var_key, Number(r.var_value)]));

  await checkAndFireTriggers({
    id:           auth.user.id,
    level:        Number(user.clearance_level),
    xp:           Number(user.xp_total ?? 0),
    streak:       Number(user.consecutive_login_days),
    anomalyScore: Number(user.anomaly_score ?? 0),
    flags,
    variables,
  });

  return NextResponse.json({ ok: true });
});
