/**
 * GET  /api/admin/mission-participants — 一覧
 * PATCH /api/admin/mission-participants — 承認/却下
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

function isAdmin(role: string) {
  return role === "admin" || role === "super_admin";
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;
  if (!isAdmin(auth.user.role)) throw Errors.forbidden();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const missionId = searchParams.get("missionId");

  const db = getDb();
  let sql = `
    SELECT mp.id, mp.mission_id, mp.user_id, mp.status, mp.applied_at,
           mp.reviewed_at, mp.completed_at, mp.note,
           u.agent_id, u.display_name, u.clearance_level,
           m.title AS mission_title
    FROM mission_participants mp
    JOIN users u ON u.id = mp.user_id
    JOIN missions m ON m.id = mp.mission_id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];
  if (status !== "all") { sql += " AND mp.status = ?"; args.push(status); }
  if (missionId) { sql += " AND mp.mission_id = ?"; args.push(missionId); }
  sql += " ORDER BY mp.applied_at DESC LIMIT 100";

  const rows = await queryAll(db, sql, args);
  return NextResponse.json(rows);
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;
  if (!isAdmin(auth.user.role)) throw Errors.forbidden();

  const body = await req.json() as { participantId?: string; status?: string; note?: string };
  const { participantId, status, note } = body;

  if (!participantId) throw Errors.validation("participantId が必要です");
  if (!status || !["approved", "rejected"].includes(status))
    throw Errors.validation("status は approved または rejected");

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const mp = await queryOne<{ id: string; user_id: string; mission_id: string; status: string }>(db,
    `SELECT id, user_id, mission_id, status FROM mission_participants WHERE id = ?`,
    [participantId]
  );
  if (!mp) throw Errors.notFound("申請が見つかりません");
  if (mp.status !== "pending") throw Errors.badRequest("pending 状態の申請のみ操作できます");

  await execute(db,
    `UPDATE mission_participants SET status = ?, reviewed_at = datetime('now'), note = ? WHERE id = ?`,
    [status, note ?? null, participantId]
  );

  const mission = await queryOne<{ title: string }>(db, `SELECT title FROM missions WHERE id = ?`, [mp.mission_id]);
  const notifBody = status === "approved"
    ? `ミッション「${mission?.title}」への参加が承認されました。`
    : `ミッション「${mission?.title}」への参加申請が却下されました。${note ? `理由: ${note}` : ""}`;

  await execute(db,
    `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
     VALUES (?, ?, 'mission', ?, ?, 0, datetime('now'))`,
    [randomUUID(), mp.user_id, status === "approved" ? "参加申請が承認されました" : "参加申請が却下されました", notifBody]
  );

  return NextResponse.json({ ok: true });
});
