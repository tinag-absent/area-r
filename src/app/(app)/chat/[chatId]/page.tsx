"use client";
import { Button } from "@/components/ui/Button";
import { useRef, useMemo, use } from "react";
import { useChat }              from "@/hooks/useChat";
import { NPC_COLORS, NPC_ICONS, NPC_TITLES, type NpcName } from "@/lib/npc-config";
import { NPC_USERNAMES, NPC_DM_PREFIX } from "@/lib/constants";
import type { ChatMessage }     from "@/hooks/useChat";
import { Icon, NavIcon } from "@/components/ui/Icon";

const CHANNEL_LABELS: Record<string, string> = {
  global:     "グローバルチャンネル",
  general:    "グローバルチャンネル",  // 旧名後方互換
  npc_group:  "NPCグループ",
  secure:     "セキュアチャンネル",
  classified: "機密チャンネル",
};

const CHANNEL_ICONS: Record<string, string> = {
  global:     "chat",
  general:    "chat",
  npc_group:  "hex",
  secure:     "mission",
  classified: "classified",
};

function MessageBubble({
  message, currentUserId,
}: {
  message: ChatMessage;
  currentUserId: string | null | undefined;
}) {
  const isNpc  = message.type === "npc" && NPC_USERNAMES.has(message.sender_name);
  const isMe   = message.sender_id === currentUserId;

  const npcStyle = isNpc ? NPC_COLORS[message.sender_name as NpcName] : null;
  const npcIcon  = isNpc ? NPC_ICONS[message.sender_name as NpcName]  : null;

  const bubbleStyle = {
    background: isNpc
      ? npcStyle?.bg
      : isMe
      ? "rgba(0,200,255,0.05)"
      : "transparent",
    border: isNpc
      ? `1px solid ${npcStyle?.border}`
      : isMe
      ? "1px solid rgba(0,200,255,0.12)"
      : "1px solid transparent",
    boxShadow: isNpc ? `0 0 12px ${npcStyle?.glow}` : "none",
  } as const;

  const nameColor = isNpc
    ? npcStyle?.name
    : isMe
    ? "var(--color-primary)"
    : "var(--color-fg-dim)";

  const timestamp = new Date(message.created_at.replace(" ", "T") + "Z")
    .toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <li
      className={[
        "rounded-sm px-3.5 py-2.5 max-w-[85%] sm:max-w-[75%] list-none",
        isMe ? "self-end" : "self-start",
      ].join(" ")}
      style={bubbleStyle}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {npcIcon && <span aria-hidden="true" style={{ color: npcStyle?.name, fontSize: "11px" }}>{npcIcon}</span>}
        <span className="text-[11px] font-bold tracking-[0.06em]" style={{ color: nameColor }}>
          {message.sender_name}
        </span>
        <span className="text-[10px] ml-auto" style={{ color: "var(--color-fg-muted)" }}>{timestamp}</span>
      </div>
      <p className="m-0 text-[13px] leading-[1.7] whitespace-pre-wrap break-words" style={{ color: "var(--color-foreground)" }}>
        {message.text}
      </p>
    </li>
  );
}

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const {
    messages, loading, sending, text, setText,
    sendMessage, isAllowedChannel, currentUserId,
  } = useChat(chatId);

  const bottomRef = useRef<HTMLLIElement>(null);
  const renderedMessages = useMemo(
    () => messages.map(message => (
      <MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
    )),
    [messages, currentUserId]
  );

  if (!isAllowedChannel) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>
          不正なチャンネルです。
        </div>
      </div>
    );
  }

  // NPC DMチャンネルの判定
  const npcName = chatId.startsWith(NPC_DM_PREFIX)
    ? (chatId.slice(NPC_DM_PREFIX.length).toUpperCase() as NpcName)
    : null;
  const npcStyle = npcName && NPC_COLORS[npcName] ? NPC_COLORS[npcName] : null;
  const npcIcon  = npcName ? NPC_ICONS[npcName] : null;

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Header */}
      <div
        className="px-5 py-3 shrink-0 flex items-center gap-3"
        style={{
          borderBottom: `1px solid ${npcStyle?.border ?? "rgba(0,200,255,0.08)"}`,
          background: npcStyle?.bg ?? "var(--color-bg-surface)",
        }}
      >
        {npcName ? (
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
            background: npcStyle?.bg   ?? "rgba(160,160,160,0.1)",
            border:    `1px solid ${npcStyle?.border ?? "rgba(160,160,160,0.3)"}`,
            boxShadow: `0 0 8px ${npcStyle?.glow ?? "transparent"}`,
          }}>
            {npcIcon}
          </div>
        ) : (
          <span className="text-[14px]" style={{ color: "var(--color-primary)" }} aria-hidden="true">
            <NavIcon icon={CHANNEL_ICONS[chatId] ?? "chat"} size={14} />
          </span>
        )}
        <div>
          <div className="text-[13px] font-bold"
            style={{ color: npcStyle?.name ?? "var(--color-foreground)" }}>
            {npcName ?? (CHANNEL_LABELS[chatId] ?? chatId)}
          </div>
          <div className="hud-label">
            {npcName ? NPC_TITLES[npcName] : `#${chatId.toUpperCase()} — ENCRYPTED`}
          </div>
        </div>
        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-[5px] h-[5px] rounded-full"
            style={{
              background: "var(--color-success)",
              boxShadow: "0 0 5px var(--color-success)",
              animation: "var(--animate-pulse-dot)",
            }}
          />
          <span className="hud-label" style={{ color: "var(--color-success)" }}>LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <ul
        role="log"
        aria-live="polite"
        aria-label={`${CHANNEL_LABELS[chatId] ?? chatId} のメッセージ`}
        className="flex-1 overflow-auto px-4 sm:px-6 py-5 flex flex-col gap-2 list-none m-0 p-0"
        style={{ scrollbarWidth: "thin" }}
      >
        {loading && (
          <div role="status" className="hud-label py-2">
            <span className="sr-only">通信確立中</span>
            <span aria-hidden="true">通信確立中…</span>
          </div>
        )}
        {renderedMessages}
        <li aria-hidden="true" ref={bottomRef} />
      </ul>

      {/* Input */}
      <div
        className="px-4 sm:px-6 py-3 shrink-0 chat-input-area safe-bottom"
        style={{
          borderTop: "1px solid rgba(0,200,255,0.08)",
          background: "var(--color-bg-surface)",
        }}
      >
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            id="chat-input"
            aria-label="メッセージを入力"
            aria-describedby="chat-send-hint"
            className="input-base flex-1"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="メッセージを入力…"
            disabled={sending}
            style={{ borderRadius: "2px" }}
          />
          <Button
            type="submit"
            disabled={sending || !text.trim()}
            isLoading={sending}
            className="shrink-0 px-5"
          >
            {sending ? "…" : "送信"}
          </Button>
        </form>
        <span id="chat-send-hint" className="sr-only">
          Enterキーまたは送信ボタンでメッセージを送信します
        </span>
      </div>
    </div>
  );
}
