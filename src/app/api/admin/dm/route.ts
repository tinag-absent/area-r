/**
 * POST /api/admin/dm
 *
 * 管理者が指定NPCとして特定ユーザーの DM チャンネルにメッセージを送信する。
 * - npc_dm_channels を自動作成
 * - chat_messages に npc タイプで挿入
 * - 通知も送信
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, execute, queryOne, queryAll } from "@/lib/db";
import { NPC_USERNAMES, NPC_IDS }    from "@/lib/constants";
import type { NpcName }              from "@/lib/npc-config";
import { randomUUID }                from "crypto";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    target:    "user" | "all" | "division";
    userId?:   string;
    divisionId?: string;
    npcName:   string;
    message:   string;
    notify?:   boolean;
  };

  const npcName = body.npcName?.toUpperCase() as NpcName;
  if (!npcName || !NPC_USERNAMES.has(npcName))
    throw Errors.validation("有効な npcName が必要です");
  if (!body.message?.trim())
    throw Errors.validation("message が必要です");
  if (body.message.length > 1000)
    throw Errors.validation("message は1000文字以内です");

  const db    = getDb();
  const npcId = NPC_IDS[npcName];
  if (!npcId) throw Errors.internal("NPC IDが見つかりません");

  // 送信対象ユーザーを解決
  let targetUsers: { id: string }[] = [];
  if (body.target === "user" && body.userId) {
    const u = await queryOne<{ id: string }>(db,
      `SELECT id FROM users WHERE id = ? AND status = 'active' AND role = 'player'`,
      [body.userId]
    );
    if (!u) throw Errors.notFound("ユーザー");
    targetUsers = [u];
  } else if (body.target === "all") {
    targetUsers = await queryAll<{ id: string }>(db,
      `SELECT id FROM users WHERE status = 'active' AND role = 'player'`
    );
  } else if (body.target === "division" && body.divisionId) {
    targetUsers = await queryAll<{ id: string }>(db,
      `SELECT id FROM users WHERE division_id = ? AND status = 'active' AND role = 'player'`,
      [body.divisionId]
    );
  } else {
    throw Errors.validation("有効な target と対象情報が必要です");
  }

  if (targetUsers.length === 0)
    return NextResponse.json({ ok: true, sent: 0 });

  const chatId = `npc-dm-${npcName.toLowerCase()}`;
  let sent = 0;

  for (const user of targetUsers) {
    // DMチャンネル自動作成
    await execute(db,
      `INSERT OR IGNORE INTO npc_dm_channels (id, user_id, npc_name) VALUES (?, ?, ?)`,
      [randomUUID(), user.id, npcName]
    );

    // メッセージ挿入
    await execute(db,
      `INSERT INTO chat_messages (id, chat_id, sender_id, sender_name, text, type)
       VALUES (?, ?, ?, ?, ?, 'npc')`,
      [randomUUID(), chatId, npcId, npcName, body.message.trim()]
    );

    // 通知（オプション）
    if (body.notify !== false) {
      await execute(db,
        `INSERT INTO notifications (id, user_id, type, title, body)
         VALUES (?, ?, 'info', ?, ?)`,
        [randomUUID(), user.id,
         `${npcName} からメッセージが届きました`,
         body.message.trim().slice(0, 80) + (body.message.length > 80 ? "…" : "")]
      );
    }

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
});

// GET — 送信履歴（直近50件）
export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const rows = await queryAll<{
    id: string; sender_name: string; text: string;
    created_at: string; chat_id: string;
  }>(db,
    `SELECT cm.id, cm.sender_name, cm.text, cm.created_at, cm.chat_id
     FROM chat_messages cm
     WHERE cm.type = 'npc'
       AND cm.chat_id LIKE 'npc-dm-%'
       AND cm.sender_name IN ('K-ECHO','N-VEIL','L-RIFT','A-PHOS','G-MIST')
     ORDER BY cm.created_at DESC LIMIT 50`
  );

  return NextResponse.json(rows);
});
