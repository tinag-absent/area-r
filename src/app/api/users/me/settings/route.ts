/**
 * GET   /api/users/me/settings — 設定取得
 * PATCH /api/users/me/settings — 設定更新
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne, execute } from "@/lib/db";

interface UserSettings {
  notify_xp:             number;
  notify_levelup:        number;
  notify_mission:        number;
  notify_chat:           number;
  notify_system:         number;
  privacy_show_activity: number;
  privacy_show_division: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  notify_xp:             1,
  notify_levelup:        1,
  notify_mission:        1,
  notify_chat:           1,
  notify_system:         1,
  privacy_show_activity: 1,
  privacy_show_division: 1,
};

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db  = getDb();
  const row = await queryOne<UserSettings>(
    db,
    "SELECT notify_xp, notify_levelup, notify_mission, notify_chat, notify_system, privacy_show_activity, privacy_show_division FROM user_settings WHERE user_id = ?",
    [auth.user.id]
  );

  return NextResponse.json(row ?? DEFAULT_SETTINGS);
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as Record<string, unknown>;

  // 許可キーのみフィルタリング
  const updates: Record<string, number> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (typeof v !== "boolean" && typeof v !== "number") continue;
    updates[k] = v ? 1 : 0;
  }
  if (Object.keys(updates).length === 0) throw Errors.badRequest("更新する設定がありません");

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // UPSERT（初回はinsert、以降はupdate）
  const existing = await queryOne<{ user_id: string }>(
    db, "SELECT user_id FROM user_settings WHERE user_id = ?", [auth.user.id]
  );

  if (!existing) {
    // 初回: デフォルト値 + 更新値でINSERT
    const merged = { ...DEFAULT_SETTINGS, ...updates };
    await execute(db,
      `INSERT INTO user_settings
         (user_id, notify_xp, notify_levelup, notify_mission, notify_chat, notify_system,
          privacy_show_activity, privacy_show_division)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auth.user.id,
        merged.notify_xp, merged.notify_levelup, merged.notify_mission,
        merged.notify_chat, merged.notify_system,
        merged.privacy_show_activity, merged.privacy_show_division,
      ]
    );
  } else {
    // 以降: 指定キーのみUPDATE
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(", ");
    const values     = [...Object.values(updates), auth.user.id];
    await execute(db,
      `UPDATE user_settings SET ${setClauses}, updated_at = datetime('now') WHERE user_id = ?`,
      values
    );
  }

  // 最新設定を返す
  const row = await queryOne<UserSettings>(
    db,
    "SELECT notify_xp, notify_levelup, notify_mission, notify_chat, notify_system, privacy_show_activity, privacy_show_division FROM user_settings WHERE user_id = ?",
    [auth.user.id]
  );
  return NextResponse.json(row ?? DEFAULT_SETTINGS);
});
