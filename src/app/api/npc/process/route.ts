/**
 * POST /api/npc/process
 *
 * 内部専用。チャットPOSTから fire & forget で呼ばれる。
 * npcDm フィールドがある場合は指定NPCが個別DMに返答する。
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler }          from "@/lib/api-error";
import { processNpcResponse, processNpcDmResponse } from "@/lib/npc-engine";
import { getInternalSecret }         from "@/lib/env";
import type { NpcName }              from "@/lib/npc-config";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== getInternalSecret())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { chatId?: string; text?: string; npcDm?: string; userId?: string; agentId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { chatId, text, npcDm, userId, agentId } = body;
  if (!chatId || !text) return NextResponse.json({ ok: false }, { status: 400 });

  if (npcDm) {
    // NPC個別DM: 指定NPCが返答
    processNpcDmResponse(chatId, text, npcDm as NpcName, userId ?? "", agentId ?? "").catch(() => {});
  } else {
    processNpcResponse(chatId, text, chatId === "npc_group").catch(() => {});
  }

  return NextResponse.json({ ok: true });
});
