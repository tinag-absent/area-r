/**
 * GET  /api/npc-dm  — 自分のDMチャンネル一覧
 * POST /api/npc-dm  — DMチャンネル開始（npcName 指定）
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }                from "next/server";
import { createRoute }                 from "@/lib/api/handler";
import { queryAll, execute, queryOne } from "@/lib/db";
import { Errors }                      from "@/lib/api-error";
import { NPC_USERNAMES, NPC_IDS }      from "@/lib/constants";
import { NPC_COLORS, NPC_ICONS, NPC_TITLES } from "@/lib/npc-config";
import type { NpcName }                from "@/lib/npc-config";
import { randomUUID }                  from "crypto";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user }) => {
    const rows = await queryAll<{ id: string; npc_name: NpcName; created_at: string }>(db,
      `SELECT id, npc_name, created_at FROM npc_dm_channels
       WHERE user_id = ? ORDER BY created_at ASC`,
      [user.id]
    );

    const enriched = await Promise.all(rows.map(async (row) => {
      const chatId  = `npc-dm-${row.npc_name.toLowerCase()}`;
      const lastMsg = await queryOne<{ text: string; created_at: string }>(db,
        `SELECT text, created_at FROM chat_messages
         WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1`,
        [chatId]
      );
      const unreadCount = await queryOne<{ cnt: number }>(db,
        `SELECT COUNT(*) AS cnt FROM chat_messages cm
         LEFT JOIN chat_read_markers rm ON rm.chat_id = cm.chat_id AND rm.user_id = ?
         WHERE cm.chat_id = ?
           AND (rm.last_read_msg_id IS NULL OR cm.id > rm.last_read_msg_id)
           AND cm.sender_id != ?`,
        [user.id, chatId, user.id]
      );
      return {
        id:            row.id,
        npcName:       row.npc_name,
        chatId,
        createdAt:     row.created_at,
        lastMessage:   lastMsg?.text ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
        unreadCount:   unreadCount?.cnt ?? 0,
        npcColor:      NPC_COLORS[row.npc_name] ?? "#888",
        npcIcon:       NPC_ICONS[row.npc_name]  ?? "◈",
        npcTitle:      NPC_TITLES[row.npc_name] ?? row.npc_name,
      };
    }));

    return NextResponse.json(enriched);
  },
});

export const POST = createRoute<{ npcName: string }>({
  auth: "player",
  handler: async ({ db, user, body }) => {
    const npcName = body.npcName as NpcName;
    if (!NPC_USERNAMES.has(npcName as NpcName))
      throw Errors.validation("無効なNPC名です");

    const existing = await queryOne<{ id: string; npc_name: string }>(db,
      `SELECT id, npc_name FROM npc_dm_channels WHERE user_id = ? AND npc_name = ?`,
      [user.id, npcName]
    );
    if (existing) {
      return NextResponse.json({
        id:     existing.id,
        chatId: `npc-dm-${existing.npc_name.toLowerCase()}`,
        alreadyExists: true,
      });
    }

    const id     = randomUUID();
    const chatId = `npc-dm-${npcName.toLowerCase()}`;
    await execute(db,
      `INSERT INTO npc_dm_channels (id, user_id, npc_name) VALUES (?, ?, ?)`,
      [id, user.id, npcName]
    );

    const npcUserId = NPC_IDS[npcName];
    if (npcUserId) {
      await execute(db,
        `INSERT INTO chat_messages (id, chat_id, sender_id, sender_name, text, type)
         VALUES (?, ?, ?, ?, ?, 'npc')`,
        [
          randomUUID(), chatId, npcUserId, npcName,
          `接続を確認しました。${NPC_TITLES[npcName] ?? npcName} との通信チャンネルが開通しました。`,
        ]
      );
    }

    return NextResponse.json({ id, chatId, alreadyExists: false }, { status: 201 });
  },
});
