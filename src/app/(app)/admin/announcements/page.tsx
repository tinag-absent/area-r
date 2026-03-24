"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DIVISIONS } from "@/lib/constants";

const NOTIFICATION_TYPES = ["system", "info", "warning", "story", "mission"] as const;
type NotifType = typeof NOTIFICATION_TYPES[number];

export default function AnnouncementsPage() {
  const [target, setTarget]       = useState<"all" | "division">("all");
  const [divisionId, setDivisionId] = useState("");
  const [type, setType]           = useState<NotifType>("system");
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<{ sent: number } | null>(null);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const payload: Record<string, unknown> = { target, type, title, body };
      if (target === "division") payload.divisionId = divisionId;
      if (expiresInDays) payload.expiresInDays = Number(expiresInDays);

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "送信に失敗しました"); return; }
      setResult({ sent: data.sent });
      setTitle(""); setBody(""); setExpiresInDays("");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  const TYPE_COLOR: Record<NotifType, string> = {
    system: "var(--color-fg-dim)", info: "var(--color-primary)",
    warning: "var(--color-warning)", story: "var(--color-purple, #ce93d8)", mission: "var(--color-success)",
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[720px] mx-auto">
      <PageHeader eyebrow="ADMIN — ANNOUNCEMENTS" title="アナウンス送信" eyebrowColor="warning" />

      {result && (
        <div className="p-4 mb-5 rounded-sm"
          style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.25)" }}>
          <div className="text-[13px]" style={{ color: "var(--color-success)" }}>
            ✓ {result.sent} 名に送信しました
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* 送信対象 */}
        <div>
          <div className="hud-label mb-3">送信対象</div>
          <div className="flex gap-3 flex-wrap">
            {(["all", "division"] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" value={t}
                  checked={target === t} onChange={() => setTarget(t)} className="sr-only" />
                <div className="w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{ borderColor: target === t ? "var(--color-warning)" : "rgba(255,180,60,0.3)",
                    background: target === t ? "var(--color-warning)" : "transparent" }}>
                  {target === t && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-bg)" }} />}
                </div>
                <span className="text-[12px]" style={{ color: "var(--color-foreground)" }}>
                  {t === "all" ? "全機関員" : "特定部門"}
                </span>
              </label>
            ))}
          </div>
          {target === "division" && (
            <select value={divisionId} onChange={e => setDivisionId(e.target.value)}
              className="mt-3 w-full text-[12px] px-3 py-2 rounded-sm"
              style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
                color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}>
              <option value="">部門を選択...</option>
              {DIVISIONS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* タイプ */}
        <div>
          <div className="hud-label mb-3">通知タイプ</div>
          <div className="flex gap-2 flex-wrap">
            {NOTIFICATION_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: type === t ? `${TYPE_COLOR[t]}18` : "transparent",
                  border: `1px solid ${type === t ? TYPE_COLOR[t] : "rgba(255,180,60,0.15)"}`,
                  color: type === t ? TYPE_COLOR[t] : "var(--color-fg-dim)",
                }}>{t}</button>
            ))}
          </div>
        </div>

        {/* タイトル */}
        <div>
          <div className="hud-label mb-2">タイトル <span style={{ color: "var(--color-fg-muted)" }}>（100文字以内）</span></div>
          <input value={title} onChange={e => setTitle(e.target.value)}
            maxLength={100} placeholder="通知タイトル"
            className="w-full text-[13px] px-3 py-2 rounded-sm"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
              color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
        </div>

        {/* 本文 */}
        <div>
          <div className="hud-label mb-2">本文 <span style={{ color: "var(--color-fg-muted)" }}>（500文字以内）</span></div>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            maxLength={500} rows={4} placeholder="通知本文"
            className="w-full text-[12px] px-3 py-2 rounded-sm resize-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
              color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
          <div className="text-right hud-label mt-1" style={{ color: "var(--color-fg-muted)" }}>
            {body.length}/500
          </div>
        </div>

        {/* 有効期限（任意） */}
        <div>
          <div className="hud-label mb-2">有効期限（日数） <span style={{ color: "var(--color-fg-muted)" }}>（省略で無期限）</span></div>
          <input type="number" value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)}
            min={1} max={365} placeholder="例: 7"
            className="w-32 text-[12px] px-3 py-2 rounded-sm"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
              color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
        </div>

        {error && (
          <div className="text-[12px] px-3 py-2 rounded-sm"
            style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.25)",
              color: "var(--color-danger)" }}>{error}</div>
        )}

        <button type="submit"
          disabled={loading || !title.trim() || !body.trim() || (target === "division" && !divisionId)}
          className="py-3 rounded-sm text-[13px] font-bold cursor-pointer"
          style={{
            fontFamily: "var(--font-mono)", letterSpacing: "0.1em",
            background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.35)",
            color: "var(--color-warning)",
            opacity: loading ? 0.6 : 1,
          }}>
          {loading ? "送信中…" : "送信"}
        </button>
      </form>
    </div>
  );
}
