"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { DIVISIONS }     from "@/lib/constants";
import { Icon, NavIcon } from "@/components/ui/Icon";

const NPC_LIST = [
  { name: "K-ECHO", color: "#00c8ff", title: "観測分析官" },
  { name: "N-VEIL", color: "#a064ff", title: "次元研究者" },
  { name: "L-RIFT", color: "#50dc78", title: "システム管理官" },
  { name: "A-PHOS", color: "#ffb43c", title: "支援調整官" },
  { name: "G-MIST", color: "#a0a0a0", title: "不明" },
] as const;

interface HistoryEntry {
  id: string; sender_name: string; text: string;
  created_at: string; chat_id: string;
}

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return (
    <div className="p-3 mb-4 rounded-sm text-[12px]" style={{
      background: ok ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
      border: `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
      color: ok ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)",
    }}>{text}</div>
  );
}

export default function AdminDmPage() {
  const [target,     setTarget]     = useState<"user" | "all" | "division">("user");
  const [userId,     setUserId]     = useState("");
  const [divisionId, setDivisionId] = useState("DIV-01");
  const [npcName,    setNpcName]    = useState("K-ECHO");
  const [message,    setMessage]    = useState("");
  const [notify,     setNotify]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState("");
  const [history,    setHistory]    = useState<HistoryEntry[]>([]);
  const [loadingH,   setLoadingH]   = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingH(true);
    try {
      const res = await fetch("/api/admin/dm", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setHistory(await res.json());
    } finally { setLoadingH(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleSend() {
    if (!message.trim()) { setMsg("メッセージを入力してください"); return; }
    if (target === "user" && !userId.trim()) { setMsg("ユーザーIDを入力してください"); return; }
    setSubmitting(true); setMsg("");
    try {
      const payload: Record<string, unknown> = { target, npcName, message, notify };
      if (target === "user")     payload.userId     = userId.trim();
      if (target === "division") payload.divisionId = divisionId;

      const res = await fetch("/api/admin/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg(`✓ ${d.sent} 人に送信しました`);
      setMessage("");
      loadHistory();
    } finally { setSubmitting(false); }
  }

  function fmtTime(raw: string) {
    return new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"))
      .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const selectedNpc = NPC_LIST.find(n => n.name === npcName);

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[900px] mx-auto">
      <PageHeader eyebrow="ADMIN — DIRECT MESSAGE" title="管理者 → ユーザー DM送信" eyebrowColor="warning" />

      {msg && <Msg text={msg} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* 送信フォーム */}
        <div className="rounded-sm p-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.15)" }}>
          <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />メッセージ送信</div>

          {/* NPC 選択 */}
          <div className="mb-3">
            <label className="hud-label block mb-1.5">送信NPC</label>
            <div className="flex gap-2 flex-wrap">
              {NPC_LIST.map(n => (
                <button key={n.name} onClick={() => setNpcName(n.name)}
                  className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
                  style={{
                    background: npcName === n.name ? `${n.color}18` : "transparent",
                    border: `1px solid ${npcName === n.name ? n.color : "rgba(255,180,60,0.15)"}`,
                    color: npcName === n.name ? n.color : "var(--color-fg-dim)",
                    fontFamily: "var(--font-mono)",
                  }}>
                  {n.name}
                </button>
              ))}
            </div>
            {selectedNpc && (
              <div className="hud-label mt-1" style={{ color: selectedNpc.color }}>
                {selectedNpc.title}
              </div>
            )}
          </div>

          {/* 送信先 */}
          <div className="mb-3">
            <label className="hud-label block mb-1.5">送信先</label>
            <div className="flex gap-2 mb-2">
              {(["user", "division", "all"] as const).map(t => (
                <button key={t} onClick={() => setTarget(t)}
                  className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
                  style={{
                    background: target === t ? "rgba(255,180,60,0.12)" : "transparent",
                    border: "1px solid rgba(255,180,60,0.2)",
                    color: target === t ? "var(--color-warning)" : "var(--color-fg-dim)",
                    fontFamily: "var(--font-mono)",
                  }}>
                  {t === "user" ? "個人" : t === "division" ? "部門" : "全員"}
                </button>
              ))}
            </div>
            {target === "user" && (
              <input value={userId} onChange={e => setUserId(e.target.value)}
                placeholder="ユーザーID (UUID)" style={iStyle} />
            )}
            {target === "division" && (
              <select value={divisionId} onChange={e => setDivisionId(e.target.value)} style={iStyle}>
                {DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {target === "all" && (
              <div className="hud-label" style={{ color: "var(--color-warning)" }}>
                <Icon name="warning" size={12} style={{ marginRight: 4 }} aria-hidden />全アクティブプレイヤーに送信します
              </div>
            )}
          </div>

          {/* メッセージ */}
          <div className="mb-3">
            <label className="hud-label block mb-1">メッセージ（1000文字以内）</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={4} maxLength={1000}
              placeholder={`${npcName} として送るメッセージを入力...`}
              style={{ ...iStyle, resize: "vertical" }} />
            <div className="hud-label mt-0.5" style={{ textAlign: "right", color: "var(--color-fg-muted)" }}>
              {message.length}/1000
            </div>
          </div>

          {/* 通知オプション */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
            <span className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>
              通知も同時に送信する
            </span>
          </label>

          <button onClick={handleSend}
            disabled={submitting || !message.trim()}
            className="w-full py-2.5 text-[12px] rounded-sm cursor-pointer"
            style={{
              background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)",
              color: "var(--color-warning)", fontFamily: "var(--font-mono)",
              opacity: submitting || !message.trim() ? 0.5 : 1,
            }}>
            {submitting ? "送信中..." : `${npcName} として送信`}
          </button>
        </div>

        {/* 送信履歴 */}
        <div className="rounded-sm overflow-hidden"
          style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
          <div className="px-4 py-2 text-[11px]"
            style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            送信履歴（直近50件）
          </div>
          {loadingH ? <div className="p-4"><LoadingStatus /></div> : history.length === 0 ? (
            <div className="p-6 text-center hud-label" style={{ color: "var(--color-fg-muted)" }}>
              まだ送信履歴はありません
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
              {history.map((h, i) => (
                <div key={h.id} className="px-4 py-3"
                  style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "var(--color-bg-surface)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold" style={{ color: NPC_LIST.find(n => n.name === h.sender_name)?.color ?? "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                      {h.sender_name}
                    </span>
                    <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                      → {h.chat_id.replace("npc-dm-", "").toUpperCase()}
                    </span>
                    <span className="ml-auto hud-label" style={{ color: "var(--color-fg-muted)" }}>
                      {fmtTime(h.created_at)}
                    </span>
                  </div>
                  <div className="text-[12px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
                    {h.text.slice(0, 100)}{h.text.length > 100 ? "…" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
