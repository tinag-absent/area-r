/**
 * GET  /api/chat/[chatId] — メッセージ一覧取得
 * POST /api/chat/[chatId] — メッセージ送信
 *
 * chatId が "npc-dm-{npcName}" 形式の場合は NPC個別DMとして処理する。
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler }          from "@/lib/api-error";
import { requireAuth, isAuthError }  from "@/lib/server-auth";
import { getDb, queryAll, execute, queryOne } from "@/lib/db";
import { sanitizeMultilineText }     from "@/lib/sanitize";
import {
  ALLOWED_CHAT_CHANNELS,
  NPC_DM_PREFIX,
  MAX_CHAT_MESSAGE_LENGTH,
  CHAT_RATE_WINDOW_SECS,
  CHAT_RATE_MAX_MSGS,
  NPC_USERNAMES,
} from "@/lib/constants";
import type { NpcName } from "@/lib/npc-config";
import { randomUUID }          from "crypto";
import { getInternalSecret }   from "@/lib/env";
import { toSqliteUtc }         from "@/lib/date";

function parseNpcDm(chatId: string): NpcName | null {
  if (!chatId.startsWith(NPC_DM_PREFIX)) return null;
  const name = chatId.slice(NPC_DM_PREFIX.length).toUpperCase() as NpcName;
  return NPC_USERNAMES.has(name) ? name : null;
}

function buildMessageQuery(chatId: string, before?: string | null, limit = 50) {
  const conditions: string[]                   = ["chat_id = ?"];
  const args:       (string | number | null)[] = [chatId];
  if (before) { conditions.push("created_at < ?"); args.push(before); }
  args.push(Math.min(limit, 100));
  return {
    sql: `SELECT id, sender_id, sender_name, text, type, created_at
          FROM chat_messages
          WHERE ${conditions.join(" AND ")}
          ORDER BY created_at DESC
          LIMIT ?`,
    args,
  };
}

// ── GET ──────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { chatId } = await params;
  const npcName    = parseNpcDm(chatId);

  if (!npcName && !(ALLOWED_CHAT_CHANNELS as readonly string[]).includes(chatId))
    return NextResponse.json({ error: "不正なチャンネルです" }, { status: 400 });

  if (npcName) {
    const db  = getDb();
    const row = await queryOne(db,
      `SELECT id FROM npc_dm_channels WHERE user_id = ? AND npc_name = ?`,
      [auth.user.id, npcName]
    );
    if (!row) return NextResponse.json({ error: "チャンネルが存在しません" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  const limit  = Number(searchParams.get("limit") ?? 50);

  const db   = getDb();
  const { sql, args } = buildMessageQuery(chatId, before, limit);
  const msgs = await queryAll(db, sql, args);

  if (msgs.length > 0) {
    await execute(db,
      `INSERT INTO chat_read_markers (user_id, chat_id, last_read_msg_id, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (user_id, chat_id)
       DO UPDATE SET last_read_msg_id = excluded.last_read_msg_id,
                     updated_at       = excluded.updated_at`,
      [auth.user.id, chatId, (msgs[0] as { id: string }).id]
    );
  }

  return NextResponse.json(msgs.reverse());
});

// ── POST ─────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { chatId } = await params;
  const npcName    = parseNpcDm(chatId);

  if (!npcName && !(ALLOWED_CHAT_CHANNELS as readonly string[]).includes(chatId))
    return NextResponse.json({ error: "不正なチャンネルです" }, { status: 400 });

  let body: { text?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const rawText = body.text;
  if (!rawText || typeof rawText !== "string")
    return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
  if (rawText.length > MAX_CHAT_MESSAGE_LENGTH)
    return NextResponse.json({ error: `メッセージは${MAX_CHAT_MESSAGE_LENGTH}文字以内です` }, { status: 400 });

  const text = sanitizeMultilineText(rawText);
  if (!text.trim())
    return NextResponse.json({ error: "空のメッセージは送信できません" }, { status: 400 });

  const db    = getDb();
  const since = toSqliteUtc(new Date(Date.now() - CHAT_RATE_WINDOW_SECS * 1000));

  // NPC DM: チャンネル自動作成
  if (npcName) {
    await execute(db,
      `INSERT OR IGNORE INTO npc_dm_channels (id, user_id, npc_name) VALUES (?, ?, ?)`,
      [randomUUID(), auth.user.id, npcName]
    );
  }

  // レート制限
  const cnt = await queryOne<{ c: number }>(db,
    `SELECT COUNT(*) as c FROM rate_limit_attempts
     WHERE key_type = 'chat' AND key_value = ? AND attempted_at > ?`,
    [auth.user.id, since]
  );
  if ((cnt?.c ?? 0) >= CHAT_RATE_MAX_MSGS)
    return NextResponse.json({ error: "送信頻度が高すぎます" }, { status: 429 });

  await execute(db,
    `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at) VALUES (?, ?, ?, 1, datetime('now', '+24 hours'))`,
    [randomUUID(), "chat", auth.user.id]
  );

  const msgId = randomUUID();
  await execute(db,
    `INSERT INTO chat_messages (id, chat_id, sender_id, sender_name, text, type)
     VALUES (?, ?, ?, ?, ?, 'user')`,
    [msgId, chatId, auth.user.id, auth.user.agentId, text]
  );

  // NPC 起動
  if (!NPC_USERNAMES.has(auth.user.agentId)) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    fetch(`${baseUrl}/api/npc/process`, {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-internal-secret": getInternalSecret(),
      },
      body: JSON.stringify({
        chatId,
        text,
        npcDm:   npcName ?? undefined,
        userId:  auth.user.id,
        agentId: auth.user.agentId,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: msgId });
});
