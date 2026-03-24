/**
 * GET /api/chat/unread
 *
 * 各チャンネルの未読数を返す。
 * - 通常チャンネル: NPCメッセージの未読数
 * - NPC DM チャンネル: 全メッセージの未読数（自分以外の送信者）
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler }          from "@/lib/api-error";
import { requireAuth, isAuthError }  from "@/lib/server-auth";
import { getDb, queryAll, queryOne } from "@/lib/db";
import { ALLOWED_CHAT_CHANNELS }     from "@/lib/constants";
import type { ChatChannel }          from "@/lib/types";

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === "string" ? v : String(v);
}
function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();

  // ── 通常チャンネル ──────────────────────────────────────────────
  const unread: Record<string, number> = {
    global: 0, npc_group: 0, secure: 0, classified: 0,
  };

  for (const ch of ALLOWED_CHAT_CHANNELS) {
    const marker = await db.execute({
      sql:  `SELECT last_read_msg_id FROM chat_read_markers WHERE user_id=? AND chat_id=?`,
      args: [auth.user.id, ch],
    });
    const lastId = toStr(marker.rows[0]?.last_read_msg_id);

    let sql  = `SELECT COUNT(*) as c FROM chat_messages WHERE chat_id=? AND type='npc'`;
    const args: (string | number | null)[] = [ch];

    if (lastId) {
      const ts = await db.execute({
        sql:  `SELECT created_at FROM chat_messages WHERE id=?`,
        args: [lastId],
      });
      const lastTs = toStr(ts.rows[0]?.created_at);
      if (lastTs) { sql += ` AND created_at > ?`; args.push(lastTs); }
    }

    const row = await db.execute({ sql, args });
    unread[ch] = toNum(row.rows[0]?.c);
  }

  // ── NPC DM チャンネル ───────────────────────────────────────────
  const dmChannels = await queryAll<{ npc_name: string }>(db,
    `SELECT npc_name FROM npc_dm_channels WHERE user_id = ?`,
    [auth.user.id]
  );

  for (const { npc_name } of dmChannels) {
    const chatId  = `npc-dm-${npc_name.toLowerCase()}`;
    const readMark = await queryOne<{ updated_at: string }>(db,
      `SELECT updated_at FROM chat_read_markers WHERE user_id = ? AND chat_id = ?`,
      [auth.user.id, chatId]
    );

    const row = await db.execute({
      sql: readMark
        ? `SELECT COUNT(*) as c FROM chat_messages WHERE chat_id=? AND created_at > ? AND sender_id != ?`
        : `SELECT COUNT(*) as c FROM chat_messages WHERE chat_id=? AND sender_id != ?`,
      args: readMark
        ? [chatId, readMark.updated_at, auth.user.id]
        : [chatId, auth.user.id],
    });
    unread[chatId] = toNum(row.rows[0]?.c);
  }

  return NextResponse.json(unread);
});
