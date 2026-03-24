/**
 * POST /api/missions/[missionId]/apply  — 参加申請
 * DELETE /api/missions/[missionId]/apply — 申請取り消し
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { missionId } = await params;
  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const mission = await queryOne<{ id: string; required_level: number; status: string }>(db,
    `SELECT id, required_level, status FROM missions WHERE id = ?`, [missionId]
  );
  if (!mission) throw Errors.notFound("ミッションが見つかりません");
  if (mission.status === "completed") throw Errors.badRequest("このミッションは収束済みです");
  if ((auth.user.level ?? 0) < mission.required_level) {
    throw Errors.forbidden(`クリアランス LV${mission.required_level} 以上が必要です`);
  }

  const existing = await queryOne<{ id: string; status: string }>(db,
    `SELECT id, status FROM mission_participants WHERE mission_id = ? AND user_id = ?`,
    [missionId, auth.user.id]
  );
  if (existing) throw Errors.badRequest("すでに申請済みです");

  const id = randomUUID();
  await execute(db,
    `INSERT INTO mission_participants (id, mission_id, user_id, status, applied_at)
     VALUES (?, ?, ?, 'pending', datetime('now'))`,
    [id, missionId, auth.user.id]
  );

  // 通知
  await execute(db,
    `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
     VALUES (?, ?, 'mission', '参加申請を送信しました', ?, 0, datetime('now'))`,
    [randomUUID(), auth.user.id, `ミッション「${mission.id}」への参加申請を送信しました。承認をお待ちください。`]
  );

  return NextResponse.json({ ok: true, participationId: id });
});

export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { missionId } = await params;
  const db = getDb();

  const existing = await queryOne<{ id: string; status: string }>(db,
    `SELECT id, status FROM mission_participants WHERE mission_id = ? AND user_id = ?`,
    [missionId, auth.user.id]
  );
  if (!existing) throw Errors.notFound("申請が見つかりません");
  if (existing.status === "completed") throw Errors.badRequest("完了済みのミッションは取り消せません");

  await execute(db,
    `DELETE FROM mission_participants WHERE mission_id = ? AND user_id = ?`,
    [missionId, auth.user.id]
  );

  return NextResponse.json({ ok: true });
});
