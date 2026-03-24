/**
 * POST /api/missions/[missionId]/complete — ミッション完了報告（自己申告）
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";
import { calculateLevel } from "@/lib/auth";

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { missionId } = await params;
  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const participation = await queryOne<{ id: string; status: string }>(db,
    `SELECT id, status FROM mission_participants WHERE mission_id = ? AND user_id = ?`,
    [missionId, auth.user.id]
  );
  if (!participation) throw Errors.notFound("参加申請が見つかりません");
  if (participation.status !== "approved") throw Errors.badRequest("承認済みの参加のみ完了報告できます");

  const mission = await queryOne<{ xp_reward: number; title: string }>(db,
    `SELECT xp_reward, title FROM missions WHERE id = ?`, [missionId]
  );
  if (!mission) throw Errors.notFound("ミッションが見つかりません");

  // 完了に更新
  await execute(db,
    `UPDATE mission_participants SET status = 'completed', completed_at = datetime('now') WHERE id = ?`,
    [participation.id]
  );

  // XP付与
  const current = await queryOne<{ xp_total: number }>(db,
    `SELECT xp_total FROM users WHERE id = ?`, [auth.user.id]
  );
  const newXp = (Number(current?.xp_total) || 0) + mission.xp_reward;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > (auth.user.level ?? 0);

  await execute(db,
    `UPDATE users SET xp_total = ?, clearance_level = ? WHERE id = ?`,
    [newXp, newLevel, auth.user.id]
  );
  await execute(db,
    `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'complete_mission', ?)`,
    [randomUUID(), auth.user.id, mission.xp_reward]
  );

  // 通知
  await execute(db,
    `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
     VALUES (?, ?, 'xp', 'ミッション完了', ?, 0, datetime('now'))`,
    [
      randomUUID(), auth.user.id,
      `「${mission.title}」を完了しました。+${mission.xp_reward} XP を獲得しました。`,
    ]
  );

  return NextResponse.json({ ok: true, xpGained: mission.xp_reward, newXp, newLevel, leveledUp });
});
