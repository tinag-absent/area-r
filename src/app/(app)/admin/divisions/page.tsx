"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

interface Division {
  id: string; name: string; name_en: string; description: string | null;
  color: string | null; memberCount: number; activeCount: number; avgLevel: number;
}

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};

export default function AdminDivisionsPage() {
  const [divisions,  setDivisions]  = useState<Division[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [editing,    setEditing]    = useState<Division | null>(null);
  const [saving,     setSaving]     = useState(false);

  // 編集フォーム
  const [fName,    setFName]    = useState("");
  const [fNameEn,  setFNameEn]  = useState("");
  const [fDesc,    setFDesc]    = useState("");
  const [fColor,   setFColor]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/divisions", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setDivisions(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(d: Division) {
    setEditing(d);
    setFName(d.name); setFNameEn(d.name_en);
    setFDesc(d.description ?? ""); setFColor(d.color ?? "#00c8ff");
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/divisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ id: editing.id, name: fName, name_en: fNameEn, description: fDesc || undefined, color: fColor }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg("✓ 更新しました");
      setEditing(null);
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — DIVISIONS" title="部門管理" eyebrowColor="warning" />

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)", border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`, color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{msg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* 部門カード一覧 */}
        <div>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-3">
              {divisions.map(d => {
                const col = d.color ?? "#00c8ff";
                const isEditing = editing?.id === d.id;
                return (
                  <div key={d.id} style={{
                    border: `1px solid ${isEditing ? col + "66" : "rgba(255,180,60,0.1)"}`,
                    borderLeft: `4px solid ${col}`,
                    borderRadius: 2, padding: "14px 16px",
                    background: isEditing ? `${col}08` : "var(--color-bg-surface)",
                  }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 14, fontWeight: "bold", color: col }}>{d.name}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>{d.name_en}</span>
                          <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 2, background: col + "18", border: `1px solid ${col}44`, color: col, fontFamily: "var(--font-mono)" }}>{d.id}</span>
                        </div>
                        {d.description && <p className="text-[12px] m-0 mb-2" style={{ color: "var(--color-fg-dim)" }}>{d.description}</p>}
                        <div className="flex gap-4">
                          {[
                            { label: "在籍", value: d.memberCount },
                            { label: "アクティブ", value: d.activeCount },
                            { label: "平均LV", value: d.avgLevel },
                          ].map(s => (
                            <div key={s.label} className="text-center">
                              <div style={{ fontSize: 16, fontWeight: "bold", color: col, fontFamily: "var(--font-mono)" }}>{s.value}</div>
                              <div className="hud-label">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => isEditing ? setEditing(null) : startEdit(d)}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 2, cursor: "pointer", background: "transparent", border: `1px solid ${col}44`, color: col, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                        {isEditing ? "閉じる" : "編集"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 編集フォーム */}
        {editing && (
          <div className="rounded-sm p-5 h-fit" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.18)" }}>
            <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{editing.id} 編集</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="hud-label block mb-1">部門名（日本語）</label>
                <input value={fName} onChange={e => setFName(e.target.value)} style={iStyle} />
              </div>
              <div>
                <label className="hud-label block mb-1">部門名（英語）</label>
                <input value={fNameEn} onChange={e => setFNameEn(e.target.value)} style={iStyle} />
              </div>
              <div>
                <label className="hud-label block mb-1">説明文</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={3}
                  style={{ ...iStyle, resize: "vertical" }} />
              </div>
              <div>
                <label className="hud-label block mb-1">カラー</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={fColor} onChange={e => setFColor(e.target.value)}
                    style={{ width: 36, height: 36, border: "none", borderRadius: 2, cursor: "pointer", background: "transparent" }} />
                  <input value={fColor} onChange={e => setFColor(e.target.value)}
                    style={{ ...iStyle, flex: 1 }} placeholder="#00c8ff" />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setEditing(null)} style={{ flex: 1, padding: "7px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                  キャンセル
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "7px", borderRadius: 2, cursor: "pointer", fontSize: 12, background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)", color: "var(--color-warning)", fontFamily: "var(--font-mono)", opacity: saving ? 0.5 : 1 }}>
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
