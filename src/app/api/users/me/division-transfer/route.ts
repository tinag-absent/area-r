/**
 * POST /api/users/me/division-transfer
 *
 * 部門移動申請。LV2以上が条件。
 * 直近30日以内に移動済みの場合は拒否。
 * body: { divisionId, reason? }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";
import { DIVISIONS } from "@/lib/constants";
import { randomUUID } from "crypto";
import { toSqliteUtc } from "@/lib/date";

const TRANSFER_COOLDOWN_DAYS = 30;
const MIN_LEVEL_FOR_TRANSFER = 2;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  if (auth.user.level < MIN_LEVEL_FOR_TRANSFER) {
    throw Errors.forbidden(`部門移動はLV${MIN_LEVEL_FOR_TRANSFER}以上が必要です`);
  }

  const body = await req.json() as { divisionId?: string; reason?: string };
  const { divisionId, reason } = body;

  if (!divisionId || typeof divisionId !== "string") {
    throw Errors.validation("divisionId が必要です");
  }

  const validDiv = DIVISIONS.find(d => d.id === divisionId);
  if (!validDiv) throw Errors.validation("無効な部門IDです");

  const db   = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // 現在の所属確認
  const user = await queryOne<{ division_id: string | null }>(
    db, "SELECT division_id FROM users WHERE id = ?", [auth.user.id]
  );
  if (!user) throw Errors.notFound("ユーザー");
  if (user.division_id === divisionId) {
    throw Errors.badRequest("すでにその部門に所属しています");
  }

  // クールダウン確認（XPログで移動履歴を代用）
  const since  = toSqliteUtc(new Date(Date.now() - TRANSFER_COOLDOWN_DAYS * 86400_000));
  const recent = await queryOne<{ cnt: number }>(
    db,
    `SELECT COUNT(*) AS cnt FROM xp_logs
     WHERE user_id = ? AND activity = 'division_transfer' AND created_at > ?`,
    [auth.user.id, since]
  );
  if ((recent?.cnt ?? 0) > 0) {
    throw Errors.badRequest(`部門移動は${TRANSFER_COOLDOWN_DAYS}日に1回のみ申請できます`);
  }

  // 移動実行
  const prevDivisionId = user.division_id;
  await execute(db,
    "UPDATE users SET division_id = ? WHERE id = ?",
    [divisionId, auth.user.id]
  );

  // XPログに記録（クールダウン判定に利用）
  await execute(db,
    "INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'division_transfer', 0)",
    [randomUUID(), auth.user.id]
  );

  // 通知を作成
  await execute(db,
    `INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, 'system', ?, ?)`,
    [
      randomUUID(),
      auth.user.id,
      "部門移動完了",
      `${validDiv.name}（${validDiv.name_en}）への移動が完了しました。`,
    ]
  );

  return NextResponse.json({
    ok:            true,
    divisionId,
    prevDivisionId,
    division:      validDiv,
  });
});
