"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

type ContentType = "novel" | "codex";

interface Entry {
  id:           string;
  content_id:   string;
  title:        string;
  subtitle:     string | null;
  category:     string | null;
  clearance_req: number;
  author:       string | null;
  date_label:   string | null;
  is_published: number;
  created_at:   string;
  updated_at:   string;
}

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};

const taStyle: React.CSSProperties = {
  ...iStyle, resize: "vertical", minHeight: 200, lineHeight: 1.7,
};

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return (
    <div className="p-3 mb-4 rounded-sm text-[12px]" style={{
      background: ok ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
      border: `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
      color: ok ? "var(--color-success)" : "var(--color-danger)",
      fontFamily: "var(--font-mono)",
    }}>{text}</div>
  );
}

export default function ContentEditorPage() {
  const [tab,       setTab]      = useState<ContentType>("novel");
  const [entries,   setEntries]  = useState<Entry[]>([]);
  const [loading,   setLoading]  = useState(false);
  const [msg,       setMsg]      = useState("");
  const [editing,   setEditing]  = useState<Entry | null>(null);
  const [showForm,  setShowForm] = useState(false);

  // 新規作成フォーム
  const [fContentId,   setFContentId]   = useState("");
  const [fTitle,       setFTitle]       = useState("");
  const [fSubtitle,    setFSubtitle]    = useState("");
  const [fCategory,    setFCategory]    = useState("");
  const [fClearance,   setFClearance]   = useState("0");
  const [fAuthor,      setFAuthor]      = useState("");
  const [fDateLabel,   setFDateLabel]   = useState("");
  const [fBody,        setFBody]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?type=${tab}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) setEntries(await res.json());
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!fContentId.trim() || !fTitle.trim()) { setMsg("content_id と タイトルは必須です"); return; }
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          contentType: tab, contentId: fContentId.trim(), title: fTitle.trim(),
          subtitle: fSubtitle.trim() || undefined, category: fCategory.trim() || undefined,
          clearanceReq: Number(fClearance), author: fAuthor.trim() || undefined,
          dateLabel: fDateLabel.trim() || undefined, body: fBody,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg("✓ 作成しました");
      setShowForm(false);
      setFContentId(""); setFTitle(""); setFSubtitle(""); setFCategory("");
      setFClearance("0"); setFAuthor(""); setFDateLabel(""); setFBody("");
      load();
    } finally { setSubmitting(false); }
  }

  async function handleUpdate() {
    if (!editing) return;
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          id: editing.id, title: fTitle, subtitle: fSubtitle || undefined,
          category: fCategory || undefined, clearanceReq: Number(fClearance),
          author: fAuthor || undefined, dateLabel: fDateLabel || undefined, body: fBody,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg("✓ 更新しました");
      setEditing(null);
      load();
    } finally { setSubmitting(false); }
  }

  async function togglePublish(id: string) {
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ id, action: "toggle_publish" }),
    });
    const d = await res.json();
    setMsg(res.ok ? `✓ ${d.is_published ? "公開" : "非公開"}にしました` : `エラー: ${d.error}`);
    load();
  }

  async function doDelete(id: string, contentId: string) {
    if (!confirm(`「${contentId}」を削除しますか？`)) return;
    const res = await fetch(`/api/admin/content?id=${id}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ 削除しました" : `エラー: ${d.error}`);
    if (editing?.id === id) setEditing(null);
    load();
  }

  function startEdit(e: Entry) {
    setEditing(e);
    setFTitle(e.title);
    setFSubtitle(e.subtitle ?? "");
    setFCategory(e.category ?? "");
    setFClearance(String(e.clearance_req));
    setFAuthor(e.author ?? "");
    setFDateLabel(e.date_label ?? "");
    setFBody("");
    setShowForm(false);
    // body を別途取得
    fetch(`/api/admin/content?type=${tab}`, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(r => r.json()).then((rows: Entry[]) => {
        // body は一覧には含まれないため、個別取得が必要な場合は追加APIを実装
        // 暫定: フォームを空にして手入力
      });
  }

  const NOVEL_CATEGORIES = ["日記", "報告書", "書簡", "手記", "機密記録"];
  const CODEX_CATEGORIES = ["ORGANIZATION", "ENTITY", "FACILITY", "TECHNOLOGY", "INCIDENT"];

  const categories = tab === "novel" ? NOVEL_CATEGORIES : CODEX_CATEGORIES;
  const isEditing = !!editing;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1100px] mx-auto">
      <PageHeader eyebrow="ADMIN — CONTENT EDITOR" title="コンテンツエディタ" eyebrowColor="warning" />

      {msg && <Msg text={msg} />}

      {/* タブ */}
      <div className="flex gap-1 mb-5">
        {(["novel", "codex"] as ContentType[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setEditing(null); setShowForm(false); }}
            className="text-[11px] px-4 py-1.5 rounded-sm cursor-pointer"
            style={{
              background: tab === t ? "rgba(255,180,60,0.12)" : "transparent",
              border: "1px solid rgba(255,180,60,0.2)",
              color: tab === t ? "var(--color-warning)" : "var(--color-fg-dim)",
              fontFamily: "var(--font-mono)",
            }}>
            {t === "novel" ? "小説（記録文書）" : "コーデックス"}
          </button>
        ))}
        <button onClick={() => { setShowForm(v => !v); setEditing(null); }}
          className="ml-auto text-[11px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.35)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
          {showForm ? "▲ 閉じる" : "＋ 新規作成"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

        {/* ── エントリ一覧 ── */}
        <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
          <div className="px-3 py-2 text-[11px]"
            style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            {entries.length} 件
          </div>
          {loading ? <div className="p-4"><LoadingStatus /></div> : entries.length === 0 ? (
            <div className="p-6 text-center hud-label" style={{ color: "var(--color-fg-muted)" }}>まだ作成されていません</div>
          ) : entries.map((e, i) => (
            <div key={e.id}
              className="px-3 py-2.5 cursor-pointer"
              onClick={() => startEdit(e)}
              style={{
                borderBottom: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: editing?.id === e.id ? "rgba(255,180,60,0.06)" : "var(--color-bg-surface)",
                borderLeft: editing?.id === e.id ? "2px solid var(--color-warning)" : "2px solid transparent",
              }}>
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="text-[12px] font-bold truncate" style={{ color: "var(--color-foreground)" }}>{e.title}</div>
                <span className="text-[10px] flex-shrink-0" style={{ color: e.is_published ? "var(--color-success)" : "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                  {e.is_published ? "公開" : "非公開"}
                </span>
              </div>
              <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                {e.content_id} · LV{e.clearance_req}
              </div>
              <div className="flex gap-2 mt-1.5">
                <button onClick={ev => { ev.stopPropagation(); togglePublish(e.id); }}
                  className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                  style={{ background: e.is_published ? "rgba(255,68,68,0.08)" : "rgba(0,230,118,0.08)", border: `1px solid ${e.is_published ? "rgba(255,68,68,0.25)" : "rgba(0,230,118,0.25)"}`, color: e.is_published ? "var(--color-danger)" : "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                  {e.is_published ? "非公開にする" : "公開する"}
                </button>
                <button onClick={ev => { ev.stopPropagation(); doDelete(e.id, e.content_id); }}
                  className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                  style={{ background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── フォームエリア ── */}
        <div className="rounded-sm p-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.15)" }}>

          {!showForm && !editing ? (
            <div className="flex items-center justify-center h-40 hud-label" style={{ color: "var(--color-fg-muted)" }}>
              ← エントリを選択するか「新規作成」を押してください
            </div>
          ) : (
            <>
              <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}>
                {isEditing ? `編集: ${editing!.content_id}` : "新規作成"}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {!isEditing && (
                  <div>
                    <label className="hud-label block mb-1">content_id *</label>
                    <input value={fContentId} onChange={e => setFContentId(e.target.value)} placeholder="DIARY-008" style={iStyle} />
                  </div>
                )}
                <div className={isEditing ? "sm:col-span-2" : ""}>
                  <label className="hud-label block mb-1">タイトル *</label>
                  <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="新しい記録" style={iStyle} />
                </div>
                <div>
                  <label className="hud-label block mb-1">サブタイトル</label>
                  <input value={fSubtitle} onChange={e => setFSubtitle(e.target.value)} placeholder="エージェント手記 / 2026-04-01" style={iStyle} />
                </div>
                <div>
                  <label className="hud-label block mb-1">カテゴリ</label>
                  <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={iStyle}>
                    <option value="">— 選択 —</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="hud-label block mb-1">必要クリアランス</label>
                  <select value={fClearance} onChange={e => setFClearance(e.target.value)} style={iStyle}>
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>LV{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="hud-label block mb-1">著者</label>
                  <input value={fAuthor} onChange={e => setFAuthor(e.target.value)} placeholder="K-ARZ" style={iStyle} />
                </div>
                <div>
                  <label className="hud-label block mb-1">日付ラベル</label>
                  <input value={fDateLabel} onChange={e => setFDateLabel(e.target.value)} placeholder="2026-04-01" style={iStyle} />
                </div>
              </div>

              <div className="mb-4">
                <label className="hud-label block mb-1">
                  本文
                  <span className="ml-2" style={{ color: "var(--color-fg-muted)", fontSize: 10 }}>
                    [[ENT-001]] [[FAC-001]] [[DIV-01]] [[INC-001]] [[MOD-001]] [[CDX-001]] [[AUD-001]] [[REDACTED]] [[REDACTED:理由]] などのタグ記法が使えます
                  </span>
                </label>
                <textarea value={fBody} onChange={e => setFBody(e.target.value)}
                  placeholder="本文を入力... (Markdownライクなプレーンテキスト)"
                  style={taStyle} />
                <div className="hud-label mt-1" style={{ color: "var(--color-fg-muted)", textAlign: "right" }}>
                  {fBody.length.toLocaleString()} 文字
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setEditing(null); setShowForm(false); }}
                  className="text-[11px] px-4 py-2 rounded-sm cursor-pointer"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                  キャンセル
                </button>
                <button onClick={isEditing ? handleUpdate : handleCreate}
                  disabled={submitting || !fTitle.trim() || (!isEditing && !fContentId.trim())}
                  className="text-[12px] px-6 py-2 rounded-sm cursor-pointer"
                  style={{ background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)", color: "var(--color-warning)", fontFamily: "var(--font-mono)", opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? "処理中..." : isEditing ? "更新" : "作成"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
