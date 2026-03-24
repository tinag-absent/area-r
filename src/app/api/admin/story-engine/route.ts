/**
 * GET    /api/admin/story-engine?userId=...  — ユーザーのフラグ一覧
 * POST   /api/admin/story-engine             — フラグを手動セット
 * DELETE /api/admin/story-engine             — フラグを削除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute, queryOne } from "@/lib/db";
import { randomUUID } from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) throw Errors.validation("userId が必要です");

  const db = getDb();

  const [flags, firedEvents, user] = await Promise.all([
    queryAll<{ flag_key: string; flag_value: string; set_at: string }>(
      db,
      "SELECT flag_key, flag_value, set_at FROM progress_flags WHERE user_id = ? ORDER BY set_at DESC",
      [userId]
    ),
    queryAll<{ event_id: string; fired_at: string }>(
      db,
      "SELECT event_id, fired_at FROM fired_events WHERE user_id = ? ORDER BY fired_at DESC",
      [userId]
    ),
    queryOne<{ agent_id: string; username: string; clearance_level: number; xp_total: number }>(
      db,
      "SELECT agent_id, username, clearance_level, xp_total FROM users WHERE id = ?",
      [userId]
    ),
  ]);

  return NextResponse.json({ flags, firedEvents, user });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    userId?:    string;
    action:     "set_flag" | "delete_flag" | "add_xp" | "reset_fired_event";
    flagKey?:   string;
    flagValue?: string;
    eventId?:   string;
    xp?:        number;
  };

  const { userId, action } = body;
  if (!userId)  throw Errors.validation("userId が必要です");
  if (!action)  throw Errors.validation("action が必要です");

  const db = getDb();

  const targetUser = await queryOne<{ id: string }>(db, "SELECT id FROM users WHERE id = ?", [userId]);
  if (!targetUser) throw Errors.notFound("ユーザー");

  if (action === "set_flag") {
    const { flagKey, flagValue = "true" } = body;
    if (!flagKey) throw Errors.validation("flagKey が必要です");
    await execute(db,
      `INSERT INTO progress_flags (user_id, flag_key, flag_value, set_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (user_id, flag_key) DO UPDATE SET flag_value = excluded.flag_value, set_at = excluded.set_at`,
      [userId, flagKey, flagValue]
    );
    return NextResponse.json({ ok: true, action, flagKey, flagValue });
  }

  if (action === "delete_flag") {
    const { flagKey } = body;
    if (!flagKey) throw Errors.validation("flagKey が必要です");
    await execute(db,
      "DELETE FROM progress_flags WHERE user_id = ? AND flag_key = ?",
      [userId, flagKey]
    );
    return NextResponse.json({ ok: true, action, flagKey });
  }

  if (action === "add_xp") {
    const xp = Number(body.xp ?? 0);
    if (!Number.isInteger(xp) || xp === 0 || Math.abs(xp) > 100_000)
      throw Errors.validation("xp は ±100,000 以内の整数が必要です");
    await execute(db,
      "UPDATE users SET xp_total = MAX(0, COALESCE(xp_total,0) + ?) WHERE id = ?",
      [xp, userId]
    );
    await execute(db,
      "INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'admin_adjust', ?)",
      [randomUUID(), userId, xp]
    );
    return NextResponse.json({ ok: true, action, xp });
  }

  if (action === "reset_fired_event") {
    const { eventId } = body;
    if (!eventId) throw Errors.validation("eventId が必要です");
    await execute(db,
      "DELETE FROM fired_events WHERE user_id = ? AND event_id = ?",
      [userId, eventId]
    );
    return NextResponse.json({ ok: true, action, eventId });
  }

  throw Errors.validation(`未知のアクション: ${action}`);
});
