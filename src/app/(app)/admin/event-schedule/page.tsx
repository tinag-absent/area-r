"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

type EvStatus = "scheduled" | "published" | "cancelled";

interface EventItem {
  id:           string;
  title:        string;
  description:  string | null;
  trigger_at:   string;
  status:       EvStatus;
  actions_json: string;
  created_by:   string;
  created_at:   string;
  fired_at:     string | null;
}

interface Action {
  type:           string;
  notify_target?: string;
  notify_title?:  string;
  notify_body?:   string;
  flag_key?:      string;
  flag_value?:    string;
  is_public?:     boolean;
  public_title?:  string;
  public_desc?:   string;
  end_at?:        string;
}

const STATUS_LABEL: Record<EvStatus, string> = { scheduled: "予約中", published: "発火済", cancelled: "キャンセル" };
const STATUS_COLOR: Record<EvStatus, string> = {
  scheduled: "var(--color-primary)",
  published: "var(--color-success)",
  cancelled: "var(--color-danger)",
};

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return (
    <div className="p-3 mb-4 rounded-sm text-[12px]"
      style={{
        background: ok ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
        border: `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
        color: ok ? "var(--color-success)" : "var(--color-danger)",
        fontFamily: "var(--font-mono)",
      }}>
      {text}
    </div>
  );
}

export default function EventSchedulePage() {
  const [tab,      setTab]      = useState<EvStatus>("scheduled");
  const [items,    setItems]    = useState<EventItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [showForm, setShowForm] = useState(false);

  // フォーム
  const [title,       setTitle]       = useState("");
  const [desc,        setDesc]        = useState("");
  const [triggerAt,   setTriggerAt]   = useState("");
  const [actions,     setActions]     = useState<Action[]>([
    { type: "notify", notify_target: "all", notify_title: "", notify_body: "", is_public: true, public_title: "", public_desc: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/event-schedule?status=${tab}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) setItems(await res.json());
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  function fmtTime(raw: string) {
    return new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"))
      .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  async function doAction(id: string, action: "fire_now" | "cancel") {
    if (!confirm(action === "fire_now" ? "今すぐ発火しますか？" : "キャンセルしますか？")) return;
    setMsg("");
    const res = await fetch("/api/admin/event-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ id, action }),
    });
    const d = await res.json();
    setMsg(res.ok ? `✓ ${action === "fire_now" ? "発火しました" : "キャンセルしました"}` : `エラー: ${d.error}`);
    load();
  }

  async function doDelete(id: string) {
    if (!confirm("削除しますか？")) return;
    const res = await fetch(`/api/admin/event-schedule?id=${id}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ 削除しました" : `エラー: ${d.error}`);
    load();
  }

  async function handleSubmit() {
    if (!title.trim() || !triggerAt) { setMsg("タイトルと日時を入力してください"); return; }
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/admin/event-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          title: title.trim(), description: desc.trim() || undefined,
          triggerAt: new Date(triggerAt).toISOString(),
          actions,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg("✓ イベントを登録しました");
      setShowForm(false);
      setTitle(""); setDesc(""); setTriggerAt("");
      if (tab === "scheduled") load();
    } finally { setSubmitting(false); }
  }

  function updateAction(i: number, key: keyof Action, value: string | boolean) {
    setActions(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: value } : a));
  }

  function addAction() {
    setActions(prev => [...prev, { type: "notify", notify_target: "all", notify_title: "", notify_body: "" }]);
  }

  function removeAction(i: number) {
    setActions(prev => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[920px] mx-auto">
      <PageHeader eyebrow="ADMIN — EVENT SCHEDULER" title="ARGイベントスケジューラー" eyebrowColor="warning" />

      {msg && <Msg text={msg} />}

      {/* タブ + 新規 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1">
          {(["scheduled", "published", "cancelled"] as EvStatus[]).map(s => (
            <button key={s} onClick={() => setTab(s)}
              className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
              style={{
                background: tab === s ? "rgba(255,180,60,0.12)" : "transparent",
                border: "1px solid rgba(255,180,60,0.2)",
                color: tab === s ? "var(--color-warning)" : "var(--color-fg-dim)",
                fontFamily: "var(--font-mono)",
              }}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="text-[11px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.35)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
          {showForm ? "▲ 閉じる" : "＋ 新規イベント"}
        </button>
      </div>

      {/* 登録フォーム */}
      {showForm && (
        <div className="rounded-sm p-5 mb-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.18)" }}>
          <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />イベント登録</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="hud-label block mb-1">タイトル</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="イベント名" style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">発火日時（JST）</label>
              <input type="datetime-local" value={triggerAt} onChange={e => setTriggerAt(e.target.value)} style={iStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className="hud-label block mb-1">説明（省略可）</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="管理者メモ" style={iStyle} />
            </div>
          </div>

          {/* アクション設定 */}
          <div className="hud-label mb-2 mt-4" style={{ color: "var(--color-fg-muted)" }}>— アクション —</div>
          {actions.map((action, i) => (
            <div key={i} className="rounded-sm p-3 mb-2"
              style={{ background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.1)" }}>
              <div className="flex items-center gap-2 mb-2">
                <select value={action.type} onChange={e => updateAction(i, "type", e.target.value)}
                  style={{ ...iStyle, width: "auto" }}>
                  <option value="notify">通知送信</option>
                  <option value="flag">フラグ発火</option>
                </select>
                <label className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-fg-dim)" }}>
                  <input type="checkbox" checked={action.is_public ?? false}
                    onChange={e => updateAction(i, "is_public", e.target.checked)} />
                  プレイヤーに公開
                </label>
                {actions.length > 1 && (
                  <button onClick={() => removeAction(i)}
                    style={{ marginLeft: "auto", fontSize: 11, padding: "2px 6px", cursor: "pointer", background: "transparent", border: "1px solid rgba(255,68,68,0.3)", color: "var(--color-danger)", borderRadius: 2 }}>
                    削除
                  </button>
                )}
              </div>

              {action.type === "notify" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select value={action.notify_target ?? "all"} onChange={e => updateAction(i, "notify_target", e.target.value)} style={iStyle}>
                    <option value="all">全員</option>
                    <option value="division:DIV-01">観測部門</option>
                    <option value="division:DIV-02">収束部門</option>
                    <option value="division:DIV-03">記録部門</option>
                    <option value="division:DIV-04">技術部門</option>
                    <option value="division:DIV-05">封印部門</option>
                  </select>
                  <input placeholder="通知タイトル" value={action.notify_title ?? ""} onChange={e => updateAction(i, "notify_title", e.target.value)} style={iStyle} />
                  <input placeholder="通知本文" value={action.notify_body ?? ""} onChange={e => updateAction(i, "notify_body", e.target.value)} style={iStyle} />
                </div>
              )}

              {action.type === "flag" && (
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="flag_key" value={action.flag_key ?? ""} onChange={e => updateAction(i, "flag_key", e.target.value)} style={iStyle} />
                  <input placeholder="flag_value (default: true)" value={action.flag_value ?? ""} onChange={e => updateAction(i, "flag_value", e.target.value)} style={iStyle} />
                </div>
              )}

              {action.is_public && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input placeholder="公開タイトル" value={action.public_title ?? ""} onChange={e => updateAction(i, "public_title", e.target.value)} style={{ ...iStyle, borderColor: "rgba(0,200,255,0.25)" }} />
                  <input placeholder="公開説明文" value={action.public_desc ?? ""} onChange={e => updateAction(i, "public_desc", e.target.value)} style={{ ...iStyle, borderColor: "rgba(0,200,255,0.25)" }} />
                </div>
              )}
            </div>
          ))}
          <button onClick={addAction}
            className="text-[11px] px-3 py-1 rounded-sm cursor-pointer mb-4"
            style={{ background: "transparent", border: "1px dashed rgba(255,180,60,0.25)", color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
            ＋ アクション追加
          </button>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={submitting || !title.trim() || !triggerAt}
              className="text-[12px] px-6 py-2 rounded-sm cursor-pointer"
              style={{
                background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)",
                color: "var(--color-warning)", fontFamily: "var(--font-mono)",
                opacity: submitting || !title.trim() || !triggerAt ? 0.5 : 1,
              }}>
              {submitting ? "登録中..." : "イベント登録"}
            </button>
          </div>
        </div>
      )}

      {/* 一覧 */}
      {loading ? <LoadingStatus /> : (
        <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
          <div className="grid gap-3 px-4 py-2 text-[11px]"
            style={{ gridTemplateColumns: "1fr 90px 80px 120px 80px", background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            <span>イベント</span><span>アクション</span><span>状態</span><span>発火日時</span><span>操作</span>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center hud-label" style={{ color: "var(--color-fg-muted)", background: "var(--color-bg-surface)" }}>
              {STATUS_LABEL[tab]}のイベントはありません
            </div>
          ) : items.map((item, i) => {
            let actionCount = 0;
            try { actionCount = JSON.parse(item.actions_json).length; } catch { /* noop */ }
            return (
              <div key={item.id} className="grid gap-3 px-4 py-3 items-start"
                style={{ gridTemplateColumns: "1fr 90px 80px 120px 80px", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "var(--color-bg-surface)" }}>
                <div>
                  <div className="text-[12px] leading-snug mb-0.5" style={{ color: "var(--color-foreground)" }}>{item.title}</div>
                  {item.description && <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{item.description}</div>}
                  {item.fired_at && <div className="hud-label mt-0.5" style={{ color: "var(--color-success)" }}>発火: {fmtTime(item.fired_at)}</div>}
                </div>
                <div className="text-[11px] pt-0.5" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                  {actionCount} 件
                </div>
                <div className="text-[11px] pt-0.5" style={{ color: STATUS_COLOR[item.status], fontFamily: "var(--font-mono)" }}>
                  {STATUS_LABEL[item.status]}
                </div>
                <div className="text-[11px] pt-0.5" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                  {fmtTime(item.trigger_at)}
                </div>
                <div className="flex flex-col gap-1">
                  {item.status === "scheduled" && (<>
                    <button onClick={() => doAction(item.id, "fire_now")}
                      className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer w-full"
                      style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.25)", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                      即時発火
                    </button>
                    <button onClick={() => doAction(item.id, "cancel")}
                      className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer w-full"
                      style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                      キャンセル
                    </button>
                  </>)}
                  {item.status !== "scheduled" && (
                    <button onClick={() => doDelete(item.id)}
                      className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer w-full"
                      style={{ background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                      削除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
