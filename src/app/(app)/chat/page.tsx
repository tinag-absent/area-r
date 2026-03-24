"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBoundStore } from "@/store";
import { NPC_COLORS, NPC_ICONS, NPC_TITLES, type NpcName } from "@/lib/npc-config";
import { NPC_USERNAMES, NPC_DM_PREFIX } from "@/lib/constants";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ── 型定義 ────────────────────────────────────────────────────────────

interface NpcChannel {
  npcName:     NpcName;
  chatId:      string;
  lastMessage: string | null;
  lastAt:      string | null;
  unread:      number;
  exists:      boolean; // DBにチャンネルが開設済みか
}

// ── 定数 ─────────────────────────────────────────────────────────────

const NPC_NAMES = [...NPC_USERNAMES] as NpcName[];

const GROUP_CHANNELS = [
  { id: "global",    label: "グローバルチャンネル", icon: "chat",       desc: "全機関員がアクセスできる共有チャンネル",   minLevel: 0 },
  { id: "npc_group", label: "NPCグループ",          icon: "hex",        desc: "NPCエージェントとの共有チャンネル",        minLevel: 1 },
  { id: "secure",    label: "セキュアチャンネル",   icon: "mission",    desc: "LV2以上の機関員向け暗号通信チャンネル",   minLevel: 2 },
  { id: "classified",label: "機密チャンネル",       icon: "classified", desc: "LV5機密クリアランス保有者専用チャンネル", minLevel: 5 },
] as const;

// ── サブコンポーネント ────────────────────────────────────────────────

function NpcAvatar({ name, size = 36 }: { name: NpcName; size?: number }) {
  const style = NPC_COLORS[name];
  const icon  = NPC_ICONS[name];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42,
      background: style?.bg   ?? "rgba(160,160,160,0.1)",
      border:    `1px solid ${style?.border ?? "rgba(160,160,160,0.3)"}`,
      boxShadow: `0 0 8px ${style?.glow ?? "transparent"}`,
      flexShrink: 0,
    }}>
      {icon}
    </div>
  );
}

// ── メインコンポーネント ─────────────────────────────────────────────

export default function ChatIndexPage() {
  const router    = useRouter();
  const userLevel = useBoundStore(s => s.user?.level ?? 0);
  const unreadChatCounts = useBoundStore(s => s.unreadChatCounts ?? {});

  const [npcChannels, setNpcChannels] = useState<NpcChannel[]>([]);
  const [starting,    setStarting]    = useState<NpcName | null>(null);

  // NPC DMチャンネル一覧を取得
  const loadNpcChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/npc-dm", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (!res.ok) return;
      const existing: { npcName: NpcName; chatId: string; lastMessage: string | null; lastAt: string | null; unread: number }[] = await res.json();
      const existingMap = new Map(existing.map(c => [c.npcName, c]));

      // 全NPCを列挙（未開設も含む）
      const all: NpcChannel[] = NPC_NAMES.map(name => {
        const ex = existingMap.get(name);
        return ex
          ? { npcName: name, chatId: ex.chatId, lastMessage: ex.lastMessage, lastAt: ex.lastAt, unread: ex.unread, exists: true }
          : { npcName: name, chatId: `${NPC_DM_PREFIX}${name.toLowerCase()}`, lastMessage: null, lastAt: null, unread: 0, exists: false };
      });
      setNpcChannels(all);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { loadNpcChannels(); }, [loadNpcChannels]);

  async function startDm(npcName: NpcName) {
    setStarting(npcName);
    try {
      const res = await fetch("/api/npc-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ npcName }),
      });
      if (res.ok) {
        await loadNpcChannels();
        router.push(`/chat/${NPC_DM_PREFIX}${npcName.toLowerCase()}`);
      }
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[760px] mx-auto">

      {/* ヘッダー */}
      <div className="mb-7">
        <div className="hud-label mb-1">COMMUNICATION HUB</div>
        <h1 className="m-0 text-[19px] font-bold"
          style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          チャット
        </h1>
        <p className="m-0 text-[12px] mt-1" style={{ color: "var(--color-fg-dim)" }}>
          グループチャンネルとNPC個別通信へのアクセス
        </p>
      </div>

      {/* グループチャンネル */}
      <div className="mb-8">
        <div className="hud-label mb-3" style={{ color: "var(--color-fg-muted)", letterSpacing: "0.15em" }}>
          GROUP CHANNELS
        </div>
        <div className="flex flex-col gap-2">
          {GROUP_CHANNELS.map(ch => {
            const locked  = userLevel < ch.minLevel;
            const unread  = unreadChatCounts[ch.id] ?? 0;
            return (
              <button key={ch.id}
                onClick={() => !locked && router.push(`/chat/${ch.id}`)}
                disabled={locked}
                className="text-left p-4 rounded-sm transition-all duration-150 flex items-center gap-4"
                style={{
                  background: "var(--color-bg-surface)",
                  border:     "1px solid rgba(0,200,255,0.08)",
                  cursor:     locked ? "not-allowed" : "pointer",
                  opacity:    locked ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (!locked) (e.currentTarget as HTMLElement).style.border = "1px solid rgba(0,200,255,0.26)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(0,200,255,0.08)"; }}
              >
                <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.12)" }}>
                  <NavIcon icon={ch.icon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-bold" style={{ color: "var(--color-foreground)" }}>
                      {ch.label}
                    </div>
                    {unread > 0 && (
                      <span className="text-[10px] px-1.5 py-px rounded-full font-bold"
                        style={{ background: "var(--color-primary)", color: "var(--color-bg)", fontFamily: "var(--font-mono)" }}>
                        {unread}
                      </span>
                    )}
                    {locked && (
                      <span className="text-[10px] px-1.5 py-px rounded-sm"
                        style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                        LV{ch.minLevel}+
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--color-fg-dim)" }}>
                    {ch.desc}
                  </div>
                </div>
                {!locked && (
                  <Icon name="play" size={11} color="var(--color-fg-muted)" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* NPC個別通信 */}
      {userLevel >= 1 && (
        <div>
          <div className="hud-label mb-3" style={{ color: "var(--color-fg-muted)", letterSpacing: "0.15em" }}>
            NPC DIRECT MESSAGE
          </div>
          <div className="flex flex-col gap-2">
            {npcChannels.map(ch => {
              const npcStyle = NPC_COLORS[ch.npcName];
              const unread   = unreadChatCounts[ch.chatId] ?? ch.unread;
              return (
                <button key={ch.npcName}
                  onClick={() => {
                    if (ch.exists) router.push(`/chat/${ch.chatId}`);
                    else startDm(ch.npcName);
                  }}
                  disabled={starting === ch.npcName}
                  className="text-left p-4 rounded-sm transition-all duration-150 flex items-center gap-4"
                  style={{
                    background: "var(--color-bg-surface)",
                    border:     ch.exists
                      ? `1px solid ${npcStyle?.border ?? "rgba(0,200,255,0.08)"}`
                      : "1px dashed rgba(0,200,255,0.1)",
                    cursor: "pointer",
                    opacity: starting === ch.npcName ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-bg-raised)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-bg-surface)"; }}
                >
                  <NpcAvatar name={ch.npcName} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-bold"
                        style={{ color: ch.exists ? (npcStyle?.name ?? "var(--color-primary)") : "var(--color-fg-dim)" }}>
                        {ch.npcName}
                      </div>
                      {unread > 0 && (
                        <span className="text-[10px] px-1.5 py-px rounded-full font-bold"
                          style={{ background: npcStyle?.name ?? "var(--color-primary)", color: "var(--color-bg)", fontFamily: "var(--font-mono)" }}>
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--color-fg-dim)" }}>
                      {ch.exists
                        ? (ch.lastMessage ?? NPC_TITLES[ch.npcName])
                        : `${NPC_TITLES[ch.npcName]} — 通信を開始する`}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {starting === ch.npcName
                      ? <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>開設中…</span>
                      : ch.exists
                        ? <Icon name="play" size={11} color={npcStyle?.name ?? "var(--color-fg-muted)"} aria-hidden />
                        : <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>未開設</span>
                    }
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
