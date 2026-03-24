/**
 * PATCH /api/users/me — 自分のプロフィール更新（表示名）
 * ProfileClient の「表示名を更新」から呼び出される。
 */

import { NextResponse }  from "next/server";
import { createRoute }   from "@/lib/api/handler";
import { execute }       from "@/lib/db";
import { Errors }        from "@/lib/api-error";
import { sanitizeText }  from "@/lib/sanitize";

export const PATCH = createRoute({
  auth: "player",
  handler: async ({ req, db, user }) => {
    const body = await req.json() as { displayName?: string | null };

    // null は表示名リセット（エージェントIDにフォールバック）
    let displayName: string | null = null;
    if (body.displayName !== null && body.displayName !== undefined) {
      const raw = String(body.displayName).trim();
      if (raw.length > 32) throw Errors.validation("表示名は32文字以内にしてください");
      displayName = raw.length > 0 ? sanitizeText(raw) : null;
    }

    await execute(
      db,
      "UPDATE users SET display_name = ?, updated_at = datetime('now') WHERE id = ?",
      [displayName, user.id],
    );

    return NextResponse.json({ ok: true, displayName });
  },
});
