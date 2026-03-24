/*
 * admin/audio/page.tsx — 音声記録管理ページ
 * Updated: 2026-03-22
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

const H = { "X-Requested-With": "XMLHttpRequest" };
const iS: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)", fontSize: 12,
  padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};
const taS: React.CSSProperties = { ...iS, resize: "vertical", minHeight: 160, lineHeight: 1.7 };

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

interface AudioRow {
  id: string; title: string; filename: string; duration_sec: number;
  recorded_at: string; recorded_by: string; location_ref: string | null;
  classification: string; clearance_req: number;
  voice_detected: number; integrity: number;
  gsi_value: number | null; entity_ref: string | null; notes: string | null;
  transcript_json: { time: string; text: string; corrupted?: boolean }[];
  created_at: string; updated_at: string;
}

type FormState = Partial<Omit<AudioRow, "transcript_json">> & { transcript_raw?: string };

const CLASSIFICATIONS = ["safe", "restricted", "classified"];
const EMPTY_FORM: FormState = {
  id: "", title: "", filename: "", duration_sec: 0,
  recorded_at: "", recorded_by: "", location_ref: "",
  classification: "safe", clearance_req: 0,
  voice_detected: 1, integrity: 100,
  gsi_value: undefined, entity_ref: "", notes: "",
  transcript_raw: "[]",
};

export default function AdminAudioPage() {
  const [items,   setItems]   = useState<AudioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [editing, setEditing] = useState<AudioRow | null>(null);
  const [form,    setForm]    = useState<FormState>(EMPTY_FORM);
  const [isNew,   setIsNew]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/audio", { headers: H });
      if (r.ok) setItems(await r.json());
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startNew() {
    setIsNew(true); setEditing(null); setMsg("");
    setForm({ ...EMPTY_FORM });
  }

  function startEdit(row: AudioRow) {
    setIsNew(false); setEditing(row); setMsg("");
    setForm({
      title: row.title, filename: row.filename,
      duration_sec: row.duration_sec, recorded_at: row.recorded_at,
      recorded_by: row.recorded_by, location_ref: row.location_ref ?? "",
      classification: row.classification, clearance_req: row.clearance_req,
      voice_detected: row.voice_detected, integrity: row.integrity,
      gsi_value: row.gsi_value ?? undefined, entity_ref: row.entity_ref ?? "",
      notes: row.notes ?? "",
      transcript_raw: JSON.stringify(row.transcript_json ?? [], null, 2),
    });
  }

  function sf(k: keyof FormState) {
    return (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: ev.target.value }));
  }

  async function save() {
    setSaving(true); setMsg("");
    try {
      let transcript_json: unknown[] = [];
      try { transcript_json = JSON.parse(form.transcript_raw || "[]"); } catch { /* ignore */ }

      const body: Record<string, unknown> = {
        ...form,
        duration_sec:  Number(form.duration_sec  ?? 0),
        clearance_req: Number(form.clearance_req ?? 0),
        voice_detected:Number(form.voice_detected ?? 1),
        integrity:     Number(form.integrity     ?? 100),
        gsi_value:     form.gsi_value != null && String(form.gsi_value) !== "" ? Number(form.gsi_value) : null,
        transcript_json,
      };
      delete body.transcript_raw;
      if (!isNew) body.id = editing!.id;

      const r = await fetch("/api/admin/audio", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", ...H },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok) { setMsg(`✗ ${json.message ?? "エラー"}`); return; }
      setMsg("✓ 保存しました");
      setIsNew(false); setEditing(null);
      load();
    } finally { setSaving(false); }
  }

  async function del(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    const r = await fetch(`/api/admin/audio?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: H });
    if (r.ok) { setMsg("✓ 削除しました"); load(); }
    else setMsg("✗ 削除に失敗しました");
  }

  const stateLabel = (row: AudioRow) => {
    if (row.classification === "classified") return { label: "CLASSIFIED", color: "rgba(255,255,255,0.3)" };
    if (row.voice_detected === 0)            return { label: "STATIC",     color: "var(--color-warning)" };
    if (row.integrity < 100)                 return { label: "CORRUPTED",  color: "var(--color-danger)"  };
    return { label: "CLEAR", color: "var(--color-primary)" };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="音声記録管理" eyebrow="AUDIO RECORDS" />
      {loading && <LoadingStatus />}
      {msg && <Msg text={msg} />}

      {/* ── 一覧 ── */}
      {!isNew && !editing && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={startNew}
              style={{ padding: "6px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.4)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}
            >
              ＋ 新規作成
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map(row => {
              const st = stateLabel(row);
              return (
                <div key={row.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: st.color, border: `1px solid ${st.color}44`, padding: "1px 6px", borderRadius: 2, flexShrink: 0 }}>{st.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--color-foreground)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.id}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-fg-dim)", flex: 2, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.title}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{row.recorded_at.slice(0, 10)}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>LV{row.clearance_req}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(row)} style={{ padding: "4px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>編集</button>
                    <button onClick={() => del(row.id, row.title)} style={{ padding: "4px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>削除</button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && !loading && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "32px 0" }}>音声記録がありません</p>
            )}
          </div>
        </>
      )}

      {/* ── 編集フォーム ── */}
      {(isNew || editing) && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,180,60,0.15)", borderRadius: 3, padding: "20px 20px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--color-warning)", marginBottom: 16, letterSpacing: "0.08em" }}>
            {isNew ? "▶ 新規作成" : `▶ 編集: ${editing!.id}`}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {isNew && (
              <label className="col-span-2">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>ID *</span>
                <input value={form.id ?? ""} onChange={sf("id")} placeholder="AUD-001 / REC-2026-0313-K17" style={iS} />
              </label>
            )}
            <label className="col-span-2">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>タイトル *</span>
              <input value={form.title ?? ""} onChange={sf("title")} placeholder="K-17 最終通信" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>ファイル名</span>
              <input value={form.filename ?? ""} onChange={sf("filename")} placeholder="REC-2026-0313-K17.wav" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>録音日時</span>
              <input value={form.recorded_at ?? ""} onChange={sf("recorded_at")} placeholder="2026-03-13 02:17" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>録音者 (AGT-ID)</span>
              <input value={form.recorded_by ?? ""} onChange={sf("recorded_by")} placeholder="K-ARZ" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>再生時間 (秒)</span>
              <input type="number" min={0} value={form.duration_sec ?? 0} onChange={sf("duration_sec")} style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>機密区分</span>
              <select value={form.classification ?? "safe"} onChange={sf("classification")} style={iS}>
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>必要クリアランス</span>
              <input type="number" min={0} max={5} value={form.clearance_req ?? 0} onChange={sf("clearance_req")} style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>完全性 (0–100%)</span>
              <input type="number" min={0} max={100} value={form.integrity ?? 100} onChange={sf("integrity")} style={iS} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2, display: "block" }}>100未満 → CORRUPTED演出</span>
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>音声あり</span>
              <select value={form.voice_detected ?? 1} onChange={sf("voice_detected")} style={iS}>
                <option value={1}>あり (CLEAR/CORRUPTED)</option>
                <option value={0}>なし (STATIC)</option>
              </select>
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>GSI値 (STATIC用)</span>
              <input type="number" step="0.1" value={form.gsi_value ?? ""} onChange={sf("gsi_value")} placeholder="4.8" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>エンティティ参照</span>
              <input value={form.entity_ref ?? ""} onChange={sf("entity_ref")} placeholder="ENT-001" style={iS} />
            </label>
            <label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>場所参照</span>
              <input value={form.location_ref ?? ""} onChange={sf("location_ref")} placeholder="INC-007" style={iS} />
            </label>
          </div>

          <label className="block mb-3">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>
              トランスクリプト JSON
              <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: 8 }}>
                {`[{"time":"00:04","text":"「今日、α-7の──」"},...]`}
              </span>
            </span>
            <textarea value={form.transcript_raw ?? "[]"} onChange={sf("transcript_raw")} rows={8} style={taS} />
          </label>

          <label className="block mb-4">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>備考</span>
            <textarea value={form.notes ?? ""} onChange={sf("notes")} rows={2} style={taS} />
          </label>

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setIsNew(false); setEditing(null); }}
              style={{ padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
              キャンセル
            </button>
            {!isNew && (
              <button onClick={() => del(editing!.id, editing!.title)}
                style={{ padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                削除
              </button>
            )}
            <button onClick={save} disabled={saving}
              style={{ padding: "7px 16px", borderRadius: 2, cursor: "pointer", fontSize: 12, background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)", color: "var(--color-warning)", fontFamily: "var(--font-mono)", opacity: saving ? 0.5 : 1 }}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
