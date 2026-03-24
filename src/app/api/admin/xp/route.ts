/**
 * GET  /api/admin/xp          — XPランキング＋最近の付与ログ
 * POST /api/admin/xp          — 特定ユーザーにXPを一括付与
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();

  const [ranking, recentLogs, activityStats] = await Promise.all([
    queryAll<{ agent_id: string; username: string; xp_total: number; clearance_level: number; division_id: string | null }>(db,
      `SELECT agent_id, username, xp_total, clearance_level, division_id
       FROM users WHERE role = 'player' AND status = 'active'
       ORDER BY xp_total DESC LIMIT 20`
    ),
    queryAll<{ agent_id: string; activity: string; xp_gained: number; created_at: string }>(db,
      `SELECT u.agent_id, xl.activity, xl.xp_gained, xl.created_at
       FROM xp_logs xl JOIN users u ON u.id = xl.user_id
       ORDER BY xl.created_at DESC LIMIT 50`
    ),
    queryAll<{ activity: string; total_xp: number; cnt: number }>(db,
      `SELECT activity, SUM(xp_gained) AS total_xp, COUNT(*) AS cnt
       FROM xp_logs
       WHERE created_at > datetime('now','-30 days')
       GROUP BY activity ORDER BY total_xp DESC`
    ),
  ]);

  return NextResponse.json({ ranking, recentLogs, activityStats });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    target:    "user" | "all" | "division";
    userId?:   string;
    divisionId?: string;
    xp:        number;
    reason?:   string;
  };

  if (!Number.isInteger(body.xp) || body.xp === 0 || Math.abs(body.xp) > 100_000)
    throw Errors.validation("xp は ±100,000 以内の整数が必要です");

  const db = getDb();
  let targetUsers: { id: string }[] = [];

  if (body.target === "user" && body.userId) {
    const u = await queryOne<{ id: string }>(db,
      `SELECT id FROM users WHERE id = ? AND role = 'player'`, [body.userId]
    );
    if (!u) throw Errors.notFound("ユーザー");
    targetUsers = [u];
  } else if (body.target === "all") {
    targetUsers = await queryAll<{ id: string }>(db,
      `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
    );
  } else if (body.target === "division" && body.divisionId) {
    targetUsers = await queryAll<{ id: string }>(db,
      `SELECT id FROM users WHERE division_id = ? AND status = 'active' AND role = 'player'`,
      [body.divisionId]
    );
  } else {
    throw Errors.validation("有効な target が必要です");
  }

  if (targetUsers.length === 0)
    return NextResponse.json({ ok: true, applied: 0 });

  const activity = body.reason?.trim() || "admin_grant";

  for (const u of targetUsers) {
    await execute(db,
      `UPDATE users SET xp_total = MAX(0, xp_total + ?) WHERE id = ?`, [body.xp, u.id]
    );
    await execute(db,
      `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, ?, ?)`,
      [randomUUID(), u.id, activity, body.xp]
    );
  }

  return NextResponse.json({ ok: true, applied: targetUsers.length, xp: body.xp });
});
