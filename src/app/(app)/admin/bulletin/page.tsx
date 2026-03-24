"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

interface Post {
  id: string; title: string; body: string; category: string;
  is_pinned: number; is_deleted: number; created_at: string;
  agent_id: string; username: string;
}

const CAT_COLOR: Record<string, string> = {
  general: "var(--color-primary)", report: "var(--color-warning)", request: "var(--color-success)",
};
const CAT_LABEL: Record<string, string> = { general: "一般", report: "報告", request: "要望" };

function fmtTime(raw: string) {
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminBulletinPage() {
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [category, setCategory] = useState("");
  const [q,        setQ]        = useState("");
  const [inputQ,   setInputQ]   = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (category) params.set("category", category);
      if (q)        params.set("q", q);
      const res = await fetch(`/api/admin/bulletin?${params}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) setPosts(await res.json());
    } finally { setLoading(false); }
  }, [category, q]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id: string, action: "pin" | "unpin" | "delete" | "restore") {
    const res = await fetch("/api/admin/bulletin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ id, action }),
    });
    const d = await res.json();
    setMsg(res.ok ? `✓ ${action} 完了` : `エラー: ${d.error}`);
    load();
  }

  async function doDelete(id: string) {
    if (!confirm("完全に削除しますか？（復元不可）")) return;
    const res = await fetch(`/api/admin/bulletin?id=${id}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    setMsg(res.ok ? "✓ 削除しました" : "エラー");
    load();
  }

  const visible = posts.filter(p => showDeleted ? true : !p.is_deleted);

  const iStyle: React.CSSProperties = {
    background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
    color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
    fontSize: 12, padding: "5px 8px", borderRadius: 2, outline: "none",
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — BULLETIN" title="掲示板管理" eyebrowColor="warning" />

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]" style={{
          background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
          border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
          color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)",
          fontFamily: "var(--font-mono)",
        }}>{msg}</div>
      )}

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...iStyle, width: "auto" }}>
          <option value="">全カテゴリ</option>
          <option value="general">一般</option>
          <option value="report">報告</option>
          <option value="request">要望</option>
        </select>
        <div className="flex gap-1 flex-1" style={{ minWidth: 180 }}>
          <input value={inputQ} onChange={e => setInputQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setQ(inputQ)}
            placeholder="タイトル・本文を検索" style={{ ...iStyle, flex: 1 }} />
          <button onClick={() => setQ(inputQ)}
            style={{ ...iStyle, padding: "5px 10px", cursor: "pointer", background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)", color: "var(--color-warning)" }}>
            検索
          </button>
        </div>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--color-fg-muted)" }}>
          <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
          削除済みも表示
        </label>
        <span className="hud-label" style={{ color: "var(--color-fg-muted)", marginLeft: "auto" }}>
          {visible.length} 件
        </span>
      </div>

      {/* 投稿一覧 */}
      {loading ? <LoadingStatus /> : (
        <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
          {/* ヘッダー */}
          <div className="grid gap-2 px-4 py-2 text-[11px]"
            style={{ gridTemplateColumns: "1fr 70px 100px 90px 120px", background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            <span>タイトル / 投稿者</span><span>カテゴリ</span><span>状態</span><span>日時</span><span>操作</span>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center hud-label" style={{ color: "var(--color-fg-muted)", background: "var(--color-bg-surface)" }}>
              投稿がありません
            </div>
          ) : visible.map((p, i) => (
            <div key={p.id} className="grid gap-2 px-4 py-3 items-start"
              style={{ gridTemplateColumns: "1fr 70px 100px 90px 120px", borderBottom: i < visible.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: p.is_deleted ? "rgba(255,68,68,0.03)" : "var(--color-bg-surface)", opacity: p.is_deleted ? 0.6 : 1 }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {!!p.is_pinned && <span style={{ fontSize: 10, color: "#ffb43c" }}>📌</span>}
                  <span className="text-[12px] font-bold" style={{ color: "var(--color-foreground)" }}>{p.title}</span>
                </div>
                <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{p.agent_id} · {p.body.slice(0, 40)}{p.body.length > 40 ? "…" : ""}</div>
              </div>
              <div>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2, background: `${CAT_COLOR[p.category] ?? "var(--color-primary)"}18`, border: `1px solid ${CAT_COLOR[p.category] ?? "var(--color-primary)"}44`, color: CAT_COLOR[p.category] ?? "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                  {CAT_LABEL[p.category] ?? p.category}
                </span>
              </div>
              <div className="text-[10px]" style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                {p.is_deleted ? <span style={{ color: "var(--color-danger)" }}>削除済</span> : p.is_pinned ? <span style={{ color: "#ffb43c" }}>ピン留め</span> : "通常"}
              </div>
              <div className="text-[10px]" style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                {fmtTime(p.created_at)}
              </div>
              <div className="flex flex-col gap-1">
                {!p.is_deleted && (
                  <>
                    <button onClick={() => doAction(p.id, p.is_pinned ? "unpin" : "pin")}
                      className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                      style={{ background: "rgba(255,180,60,0.08)", border: "1px solid rgba(255,180,60,0.25)", color: "#ffb43c", fontFamily: "var(--font-mono)" }}>
                      {p.is_pinned ? "ピン解除" : "ピン留め"}
                    </button>
                    <button onClick={() => doAction(p.id, "delete")}
                      className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                      style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                      削除
                    </button>
                  </>
                )}
                {p.is_deleted && (
                  <>
                    <button onClick={() => doAction(p.id, "restore")}
                      style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2, cursor: "pointer", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.25)", color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                      復元
                    </button>
                    <button onClick={() => doDelete(p.id)}
                      style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                      完全削除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
