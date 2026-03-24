/**
 * GET    /api/admin/achievements              — 実績マスター一覧＋取得人数
 * POST   /api/admin/achievements              — 特定ユーザーに実績を付与
 * DELETE /api/admin/achievements?userId=&key= — 実績を取り消し
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute, queryOne } from "@/lib/db";
import { randomUUID }                from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db  = getDb();
  const ach = await queryAll<{
    id: string; key: string; title: string; description: string;
    icon: string | null; xp_reward: number; is_secret: number;
  }>(db, `SELECT id, key, title, description, icon, xp_reward, is_secret
          FROM achievements ORDER BY is_secret ASC, key ASC`);

  // 各実績の取得人数
  const withCounts = await Promise.all(ach.map(async a => {
    const row = await queryOne<{ cnt: number }>(db,
      `SELECT COUNT(*) as cnt FROM user_achievements WHERE achievement_id = ?`, [a.id]
    );
    return { ...a, earnedCount: row?.cnt ?? 0 };
  }));

  return NextResponse.json(withCounts);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as { userId: string; achievementKey: string };
  if (!body.userId || !body.achievementKey)
    throw Errors.validation("userId と achievementKey が必要です");

  const db  = getDb();
  const ach = await queryOne<{ id: string; xp_reward: number; title: string }>(db,
    `SELECT id, xp_reward, title FROM achievements WHERE key = ?`, [body.achievementKey]
  );
  if (!ach) throw Errors.notFound("実績");

  const user = await queryOne<{ id: string }>(db,
    `SELECT id FROM users WHERE id = ?`, [body.userId]
  );
  if (!user) throw Errors.notFound("ユーザー");

  // 既取得チェック
  const existing = await queryOne(db,
    `SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?`,
    [body.userId, ach.id]
  );
  if (existing) return NextResponse.json({ ok: true, skipped: true, reason: "already_earned" });

  await execute(db,
    `INSERT INTO user_achievements (id, user_id, achievement_id) VALUES (?, ?, ?)`,
    [randomUUID(), body.userId, ach.id]
  );

  // XP付与
  if (ach.xp_reward > 0) {
    await execute(db,
      `UPDATE users SET xp_total = xp_total + ? WHERE id = ?`, [ach.xp_reward, body.userId]
    );
    await execute(db,
      `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'achievement', ?)`,
      [randomUUID(), body.userId, ach.xp_reward]
    );
  }

  // 通知
  await execute(db,
    `INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, 'achievement', ?, ?)`,
    [randomUUID(), body.userId, `実績解除: ${ach.title}`, `管理者により実績が付与されました。`]
  );

  return NextResponse.json({ ok: true, xpGranted: ach.xp_reward });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const key    = searchParams.get("key");
  if (!userId || !key) throw Errors.validation("userId と key が必要です");

  const db  = getDb();
  const ach = await queryOne<{ id: string }>(db,
    `SELECT id FROM achievements WHERE key = ?`, [key]
  );
  if (!ach) throw Errors.notFound("実績");

  await execute(db,
    `DELETE FROM user_achievements WHERE user_id = ? AND achievement_id = ?`,
    [userId, ach.id]
  );
  return NextResponse.json({ ok: true });
});
