/*
 * admin/sigma-messages/page.tsx — SIGMAメッセージ管理
 * Updated: 2026-03-23
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

const H  = { "X-Requested-With": "XMLHttpRequest" };
const iS: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(0,200,255,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)", fontSize: 12,
  padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};
const taS: React.CSSProperties = { ...iS, resize: "vertical" as const, minHeight: 160, lineHeight: 1.85, fontFamily: "var(--font-ja)", fontSize: 13, letterSpacing: "0.04em" };

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

interface SigmaRow {
  id: string; number: number; received_at: string; medium: string;
  integrity: number; clearance_req: number; content: string; context_ref: string | null;
}

type FormState = Partial<SigmaRow>;
const EMPTY: FormState = {
  id: "", number: 0, received_at: "", medium: "N-VEIL 通信補助体経由",
  integrity: 100, clearance_req: 1, content: "", context_ref: "",
};

export default function AdminSigmaPage() {
  const [items,   setItems]   = useState<SigmaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [editing, setEditing] = useState<SigmaRow | null>(null);
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [isNew,   setIsNew]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/sigma-messages", { headers: H });
      if (r.ok) setItems(await r.json());
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startNew() {
    setIsNew(true); setEditing(null); setMsg("");
    setForm({ ...EMPTY });
  }

  function startEdit(row: SigmaRow) {
    setIsNew(false); setEditing(row); setMsg("");
    setForm({ ...row, context_ref: row.context_ref ?? "" });
  }

  function sf(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body = {
        ...form,
        number:        Number(form.number ?? 0),
        integrity:     Number(form.integrity ?? 100),
        clearance_req: Number(form.clearance_req ?? 1),
        context_ref:   form.context_ref || null,
      };
      if (!isNew) (body as Record<string, unknown>).id = editing!.id;
      const r = await fetch("/api/admin/sigma-messages", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", ...H },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) { setMsg(`✗ ${j.message ?? "エラー"}`); return; }
      setMsg("✓ 保存しました");
      setIsNew(false); setEditing(null);
      load();
    } finally { setSaving(false); }
  }

  async function del(id: string, label: string) {
    if (!confirm(`「${label}」を削除しますか？`)) return;
    const r = await fetch(`/api/admin/sigma-messages?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: H });
    if (r.ok) { setMsg("✓ 削除しました"); load(); }
    else setMsg("✗ 削除に失敗しました");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="SIGMAメッセージ管理" eyebrow="SIGMA TRANSMISSIONS" />
      {loading && <LoadingStatus />}
      {msg && <Msg text={msg} />}

      {!isNew && !editing && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={startNew}
              style={{ padding: "6px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.3)", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
              ＋ 新規作成
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map(row => (
              <div key={row.id} style={{ background: "rgba(0,200,255,0.02)", border: "1px solid rgba(0,200,255,0.08)", borderRadius: 3, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--color-primary)", flexShrink: 0, minWidth: 100 }}>{row.id}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-fg-dim)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.content.slice(0, 60)}{row.content.length > 60 ? "…" : ""}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(0,200,255,0.4)", flexShrink: 0 }}>{row.integrity}%</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>LV{row.clearance_req}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{row.received_at.slice(0, 10)}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(row)} style={{ padding: "4px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>編集</button>
                  <button onClick={() => del(row.id, row.id)} style={{ padding: "4px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>削除</button>
                </div>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "32px 0" }}>SIGMAメッセージがありません</p>
            )}
          </div>
        </>
      )}

      {(isNew || editing) && (
        <div style={{ background: "rgba(0,200,255,0.02)", border: "1px solid rgba(0,200,255,0.15)", borderRadius: 3, padding: "20px 20px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--color-primary)", marginBottom: 16, letterSpacing: "0.08em" }}>
            {isNew ? "▶ 新規作成 — SIGMA TRANSMISSION" : `▶ 編集: ${editing!.id}`}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {isNew && (
              <label>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>ID * <span style={{ color: "rgba(255,255,255,0.15)" }}>例: SIGMA-MSG-007</span></span>
                <input value={form.id ?? ""} onChange={sf("id")} style={iS} />
              </label>
            )}
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>番号 (#)</span>
              <input type="number" value={form.number ?? ""} onChange={sf("number")} style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>受信日時</span>
              <input value={form.received_at ?? ""} onChange={sf("received_at")} placeholder="2026-03-13 02:17" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>伝達経路</span>
              <input value={form.medium ?? ""} onChange={sf("medium")} style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>整合性 (0–100%)</span>
              <input type="number" min={0} max={100} value={form.integrity ?? 100} onChange={sf("integrity")} style={iS} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2, display: "block" }}>100未満 → 一部伏字演出</span>
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>必要CLR</span>
              <input type="number" min={0} max={5} value={form.clearance_req ?? 1} onChange={sf("clearance_req")} style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>関連参照</span>
              <input value={form.context_ref ?? ""} onChange={sf("context_ref")} placeholder="DIARY-007" style={iS} />
            </label>
          </div>
          <label className="block mb-4">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>
              本文 <span style={{ color: "rgba(255,255,255,0.2)" }}>（断片的・哲学的な文体で。整合性 &lt;100 の場合は一部が自動的に伏字化されます）</span>
            </span>
            <textarea value={form.content ?? ""} onChange={sf("content")} rows={8} style={taS} />
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setIsNew(false); setEditing(null); }}
              style={{ padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
              キャンセル
            </button>
            {!isNew && (
              <button onClick={() => del(editing!.id, editing!.id)}
                style={{ padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                削除
              </button>
            )}
            <button onClick={save} disabled={saving}
              style={{ padding: "7px 16px", borderRadius: 2, cursor: "pointer", fontSize: 12, background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.4)", color: "var(--color-primary)", fontFamily: "var(--font-mono)", opacity: saving ? 0.5 : 1 }}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
