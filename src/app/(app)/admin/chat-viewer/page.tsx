"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

const CHANNELS = ["global", "npc_group", "secure", "classified",
  "division_convergence", "division_engineering", "division_foreign",
  "division_port", "division_support"];

interface Message {
  id: string; chat_id: string; sender_id: string; sender_name: string;
  text: string; type: string; created_at: string;
  agent_id: string | null; clearance_level: number | null;
}

function fmtTime(raw: string) {
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ChatViewerPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [channel, setChannel]     = useState("");
  const [q, setQ]                 = useState("");
  const [inputQ, setInputQ]       = useState("");
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (channel) params.set("channel", channel);
      if (q)       params.set("q", q);
      const res = await fetch(`/api/admin/chat?${params}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, [channel, q]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("このメッセージを削除しますか？")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/chat?id=${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      setMessages(prev => prev.filter(m => m.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — CHAT VIEWER" title="チャットログ閲覧" eyebrowColor="warning" />

      {/* フィルタ */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={channel} onChange={e => setChannel(e.target.value)}
          className="text-[12px] px-3 py-1.5 rounded-sm"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
            color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}>
          <option value="">全チャンネル</option>
          {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        <div className="flex gap-2 flex-1">
          <input value={inputQ} onChange={e => setInputQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setQ(inputQ)}
            placeholder="キーワード検索..."
            className="flex-1 text-[12px] px-3 py-1.5 rounded-sm"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
              color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
          <button onClick={() => setQ(inputQ)}
            className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
            style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)",
              color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            検索
          </button>
          {q && (
            <button onClick={() => { setQ(""); setInputQ(""); }}
              className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
              クリア
            </button>
          )}
        </div>
        <div className="hud-label self-center" style={{ color: "var(--color-fg-muted)" }}>
          {messages.length}件
        </div>
      </div>

      {loading && <LoadingStatus />}

      {!loading && (
        <div className="flex flex-col gap-1">
          {messages.length === 0 && (
            <div className="p-8 text-center hud-label" style={{ color: "var(--color-fg-muted)" }}>
              メッセージなし
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className="flex gap-3 px-3 py-2.5 rounded-sm group"
              style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,255,255,0.04)" }}>
              {/* チャンネルバッジ */}
              <div className="shrink-0">
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm"
                  style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.25)",
                    color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                  {m.chat_id}
                </span>
              </div>
              {/* 送信者 */}
              <div className="shrink-0 w-24">
                <div className="text-[11px] font-bold" style={{ color: m.type === "npc" ? "var(--color-primary)" : "var(--color-foreground)" }}>
                  {m.sender_name}
                </div>
                {m.agent_id && (
                  <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{m.agent_id}</div>
                )}
              </div>
              {/* テキスト */}
              <div className="flex-1 text-[12px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
                {m.text}
              </div>
              {/* 時刻 + 削除 */}
              <div className="shrink-0 text-right flex flex-col items-end gap-1">
                <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{fmtTime(m.created_at)}</div>
                <button onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)",
                    color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                  {deleting === m.id ? "…" : "削除"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
