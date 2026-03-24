/**
 * POST /api/npc/post
 *
 * 内部専用エンドポイント。NPCが指定チャンネルに直接メッセージを投稿する。
 * INTERNAL_SECRET ヘッダーで保護。
 *
 * body: { npcId, chatId, text }
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { getDb, queryOne, execute } from "@/lib/db";
import { getInternalSecret } from "@/lib/env";
import { ALLOWED_CHAT_CHANNELS } from "@/lib/constants";
import { NPC_IDS } from "@/lib/constants";
import { sanitizeText as sanitize } from "@/lib/sanitize";
import { randomUUID } from "crypto";
import type { ChatChannel } from "@/lib/types";
import type { NpcName } from "@/lib/npc-config";

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 内部認証
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== getInternalSecret()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { npcId?: string; chatId?: string; text?: string };
  const { npcId, chatId, text } = body;

  if (!npcId || typeof npcId !== "string") throw Errors.badRequest("npcId が必要です");
  if (!chatId || typeof chatId !== "string") throw Errors.badRequest("chatId が必要です");
  if (!text   || typeof text   !== "string" || text.trim().length === 0) {
    throw Errors.badRequest("text が必要です");
  }

  // チャンネルバリデーション
  if (!(ALLOWED_CHAT_CHANNELS as readonly string[]).includes(chatId)) {
    throw Errors.badRequest("無効なチャンネルIDです");
  }

  // NPC IDバリデーション
  const npcNames = Object.keys(NPC_IDS) as NpcName[];
  const matchingNpc = npcNames.find(name => NPC_IDS[name] === npcId);
  if (!matchingNpc) throw Errors.badRequest("無効な npcId です");

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // NPC が users テーブルに存在するか確認
  const npcUser = await queryOne<{ id: string }>(
    db, "SELECT id FROM users WHERE id = ? AND role = 'npc'", [npcId]
  );
  if (!npcUser) throw Errors.notFound("NPC ユーザー");

  const sanitized = sanitize(text.trim());
  const messageId = randomUUID();

  await execute(db,
    `INSERT INTO chat_messages (id, chat_id, sender_id, sender_name, text, type)
     VALUES (?, ?, ?, ?, ?, 'npc')`,
    [messageId, chatId as ChatChannel, npcId, matchingNpc, sanitized]
  );

  return NextResponse.json({ ok: true, messageId });
});
