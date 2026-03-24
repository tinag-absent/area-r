/*
 * admin/world-data/page.tsx — 世界観データ統合管理（v5新テーブル8本）
 * Updated: 2026-03-23
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

const H  = { "X-Requested-With": "XMLHttpRequest" };
const iS: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)", fontSize: 12,
  padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};
const taS: React.CSSProperties = { ...iS, resize: "vertical" as const, minHeight: 100, lineHeight: 1.7 };

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

// ─────────────────────────────────────────────────────────────────────
// タブ定義
// ─────────────────────────────────────────────────────────────────────

type TabId =
  | "observation-points" | "observation-logs" | "dimension-cracks"
  | "agent-memos" | "case-reports" | "operation-records"
  | "containment-protocols" | "research-theories";

interface TabDef {
  id:        TabId;
  label:     string;
  prefix:    string;
  color:     string;
  fields:    FieldDef[];
}

interface FieldDef {
  key:       string;
  label:     string;
  type:      "text" | "textarea" | "number" | "select" | "json";
  options?:  string[];
  required?: boolean;
  hint?:     string;
}

const TABS: TabDef[] = [
  {
    id: "observation-points", label: "観測地点", prefix: "LOC- / RIFT-",
    color: "var(--color-success)",
    fields: [
      { key: "id",            label: "ID *",          type: "text",   required: true, hint: "LOC-OIT-001 / RIFT-α7" },
      { key: "type",          label: "種別 *",        type: "select", required: true, options: ["location","rift_point"] },
      { key: "name",          label: "名称 *",        type: "text",   required: true },
      { key: "name_short",    label: "略称",          type: "text" },
      { key: "lon",           label: "経度",          type: "number" },
      { key: "lat",           label: "緯度",          type: "number" },
      { key: "city_code",     label: "市区町村コード", type: "text",  hint: "44201" },
      { key: "city_name",     label: "市区町村名",    type: "text" },
      { key: "status",        label: "ステータス",    type: "select", options: ["active","monitoring","critical","abandoned","classified"] },
      { key: "clearance_req", label: "必要CLR",       type: "number" },
      { key: "gsi_current",   label: "現在GSI値 (σ)", type: "number" },
      { key: "description",   label: "説明",          type: "textarea" },
      { key: "notes",         label: "備考",          type: "textarea" },
    ],
  },
  {
    id: "observation-logs", label: "観測ログ", prefix: "GSI- / SIG- / SCAN-",
    color: "var(--color-warning)",
    fields: [
      { key: "id",           label: "ID *",         type: "text",   required: true, hint: "GSI-RECORD-042 / SIG-DELTA / SCAN-2026-0313" },
      { key: "type",         label: "種別 *",       type: "select", required: true, options: ["gsi","signal","scan"] },
      { key: "title",        label: "タイトル *",   type: "text",   required: true },
      { key: "observed_at",  label: "観測日時",     type: "text",   hint: "2026-03-13 02:17" },
      { key: "location_ref", label: "場所参照",     type: "text",   hint: "RIFT-α7" },
      { key: "entity_ref",   label: "実体参照",     type: "text",   hint: "ENT-001" },
      { key: "severity",     label: "深刻度",       type: "select", options: ["normal","elevated","critical"] },
      { key: "clearance_req",label: "必要CLR",      type: "number" },
      { key: "gsi_value",    label: "GSI値 (σ)",    type: "number" },
      { key: "gsi_baseline", label: "GSI基準値",    type: "number" },
      { key: "freq_band",    label: "周波数帯",     type: "text",   hint: "12–18kHz" },
      { key: "amplitude_db", label: "振幅 (dB)",    type: "number" },
      { key: "duration_sec", label: "継続時間 (秒)", type: "number" },
      { key: "pattern_match",label: "パターン一致", type: "text" },
      { key: "scan_area",    label: "スキャン範囲", type: "text" },
      { key: "findings_json",label: "発見事項 JSON", type: "json",  hint: '[{"type":"entity","ref":"ENT-001","desc":"..."}]' },
      { key: "description",  label: "説明",         type: "textarea" },
    ],
  },
  {
    id: "dimension-cracks", label: "次元裂孔", prefix: "CRK-",
    color: "var(--color-danger)",
    fields: [
      { key: "id",             label: "ID *",         type: "text",   required: true, hint: "CRK-001" },
      { key: "name",           label: "名称 *",       type: "text",   required: true },
      { key: "lon",            label: "経度",         type: "number" },
      { key: "lat",            label: "緯度",         type: "number" },
      { key: "location",       label: "場所",         type: "text" },
      { key: "status",         label: "ステータス",   type: "select", options: ["forming","active","stable","sealed","collapsed","classified"] },
      { key: "severity",       label: "深刻度",       type: "select", options: ["safe","warning","critical"] },
      { key: "gsi_peak",       label: "最大GSI (σ)",  type: "number" },
      { key: "first_detected", label: "初観測日",     type: "text" },
      { key: "sealed_at",      label: "封印日時",     type: "text" },
      { key: "entity_emerged", label: "出現実体 JSON", type: "json",  hint: '["ENT-001","ENT-004"]' },
      { key: "clearance_req",  label: "必要CLR",      type: "number" },
      { key: "description",    label: "説明",         type: "textarea" },
      { key: "notes",          label: "備考",         type: "textarea" },
    ],
  },
  {
    id: "agent-memos", label: "機関員メモ", prefix: "MEMO-",
    color: "rgba(255,255,255,0.4)",
    fields: [
      { key: "id",           label: "ID *",       type: "text",   required: true, hint: "MEMO-K17-001" },
      { key: "title",        label: "タイトル *", type: "text",   required: true },
      { key: "author_ref",   label: "著者 (AGT)", type: "text",   hint: "AGT-K17" },
      { key: "location_ref", label: "場所参照",   type: "text" },
      { key: "written_at",   label: "執筆日時",   type: "text" },
      { key: "found_at",     label: "発見日時",   type: "text" },
      { key: "found_by",     label: "発見者",     type: "text" },
      { key: "status",       label: "状態",       type: "select", options: ["recovered","partial","corrupted","classified"] },
      { key: "clearance_req",label: "必要CLR",    type: "number" },
      { key: "content",      label: "本文",       type: "textarea" },
      { key: "tags_json",    label: "関連タグ JSON", type: "json", hint: '["ENT-001","CRK-001"]' },
    ],
  },
  {
    id: "case-reports", label: "事案記録", prefix: "CASE-IR-",
    color: "var(--color-danger)",
    fields: [
      { key: "id",              label: "ID *",        type: "text",   required: true, hint: "CASE-IR-031" },
      { key: "title",           label: "タイトル *",  type: "text",   required: true },
      { key: "case_date",       label: "発生日",      type: "text" },
      { key: "closed_date",     label: "解決日",      type: "text" },
      { key: "status",          label: "ステータス",  type: "select", options: ["open","closed","classified","pending"] },
      { key: "division_ref",    label: "担当部門",    type: "text",   hint: "DIV-02" },
      { key: "personnel_json",  label: "関係人員 JSON", type: "json", hint: '["AGT-K17","AGT-ARZ"]' },
      { key: "entity_ref",      label: "関連実体",    type: "text",   hint: "ENT-001" },
      { key: "location_ref",    label: "場所参照",    type: "text" },
      { key: "casualties",      label: "被害者数",    type: "number" },
      { key: "clearance_req",   label: "必要CLR",     type: "number" },
      { key: "summary",         label: "概要",        type: "textarea" },
      { key: "full_report",     label: "詳細報告書",  type: "textarea", hint: "高CLR帯で開示される詳細内容" },
    ],
  },
  {
    id: "operation-records", label: "作戦記録", prefix: "OP-",
    color: "var(--color-warning)",
    fields: [
      { key: "id",            label: "ID *",        type: "text",   required: true, hint: "OP-NIGHTFALL" },
      { key: "codename",      label: "作戦名 *",    type: "text",   required: true, hint: "NIGHTFALL" },
      { key: "title",         label: "正式名称 *",  type: "text",   required: true },
      { key: "op_date",       label: "開始日",      type: "text" },
      { key: "end_date",      label: "終了日",      type: "text" },
      { key: "status",        label: "ステータス",  type: "select", options: ["planned","active","completed","aborted","classified"] },
      { key: "division_json", label: "参加部門 JSON", type: "json", hint: '["DIV-02","DIV-05"]' },
      { key: "commander_ref", label: "指揮官",      type: "text",   hint: "AGT-xxx" },
      { key: "target_ref",    label: "対象",        type: "text",   hint: "CRK-001 / ENT-001" },
      { key: "location_ref",  label: "場所参照",    type: "text" },
      { key: "outcome",       label: "結果",        type: "select", options: ["success","partial","failure","classified"] },
      { key: "clearance_req", label: "必要CLR",     type: "number" },
      { key: "description",   label: "説明",        type: "textarea" },
      { key: "casualties",    label: "被害者数",    type: "number" },
    ],
  },
  {
    id: "containment-protocols", label: "封印プロトコル", prefix: "PROTO-",
    color: "var(--color-danger)",
    fields: [
      { key: "id",            label: "ID *",        type: "text",   required: true, hint: "PROTO-OMEGA" },
      { key: "codename",      label: "コード名 *",  type: "text",   required: true, hint: "OMEGA" },
      { key: "title",         label: "正式名称 *",  type: "text",   required: true },
      { key: "division_ref",  label: "担当部門",    type: "text",   hint: "DIV-05" },
      { key: "status",        label: "ステータス",  type: "select", options: ["draft","active","deprecated","classified"] },
      { key: "threat_class",  label: "対象脅威クラス", type: "text" },
      { key: "clearance_req", label: "必要CLR",     type: "number" },
      { key: "summary",       label: "概要",        type: "textarea" },
      { key: "steps_json",    label: "手順 JSON",   type: "json",   hint: '[{"step":1,"title":"初動","desc":"..."}]' },
      { key: "warnings",      label: "警告事項",    type: "textarea" },
    ],
  },
  {
    id: "research-theories", label: "研究仮説", prefix: "THEORY-",
    color: "var(--color-primary)",
    fields: [
      { key: "id",             label: "ID *",        type: "text",   required: true, hint: "THEORY-009" },
      { key: "title",          label: "タイトル *",  type: "text",   required: true },
      { key: "author_ref",     label: "著者 (AGT)",  type: "text",   hint: "AGT-N01" },
      { key: "division_ref",   label: "部門",        type: "text",   hint: "DIV-03" },
      { key: "proposed_at",    label: "提唱日",      type: "text" },
      { key: "status",         label: "ステータス",  type: "select", options: ["proposed","under_review","accepted","refuted","classified"] },
      { key: "confidence",     label: "信頼度 (0-100)", type: "number" },
      { key: "clearance_req",  label: "必要CLR",     type: "number" },
      { key: "abstract",       label: "要旨",        type: "textarea" },
      { key: "evidence_json",  label: "証拠 JSON",   type: "json",   hint: '[{"type":"observation","ref":"GSI-042","desc":"..."}]' },
      { key: "related_json",   label: "関連タグ JSON", type: "json", hint: '["ENT-002","CRK-001"]' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// メインページ
// ─────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
type Form = Record<string, string>;

export default function AdminWorldDataPage() {
  const [activeTab, setActiveTab] = useState<TabId>("observation-points");
  const [items,     setItems]     = useState<Row[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");
  const [editing,   setEditing]   = useState<Row | null>(null);
  const [form,      setForm]      = useState<Form>({});
  const [isNew,     setIsNew]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  const tab = TABS.find(t => t.id === activeTab)!;

  const load = useCallback(async () => {
    setLoading(true);
    setEditing(null); setIsNew(false); setMsg("");
    try {
      const r = await fetch(`/api/admin/${activeTab}`, { headers: H });
      if (r.ok) setItems(await r.json());
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setIsNew(true); setEditing(null); setMsg("");
    const init: Form = {};
    tab.fields.forEach(f => { init[f.key] = ""; });
    setForm(init);
  }

  function startEdit(row: Row) {
    setIsNew(false); setEditing(row); setMsg("");
    const f: Form = {};
    tab.fields.forEach(fd => {
      const v = row[fd.key];
      f[fd.key] = fd.type === "json"
        ? (typeof v === "string" ? v : JSON.stringify(v ?? [], null, 2))
        : v != null ? String(v) : "";
    });
    setForm(f);
  }

  function sf(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));
  }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body: Record<string, unknown> = {};
      tab.fields.forEach(fd => {
        const v = form[fd.key] ?? "";
        if (fd.type === "number")   body[fd.key] = v !== "" ? Number(v) : null;
        else if (fd.type === "json") {
          try { body[fd.key] = JSON.parse(v || "[]"); } catch { body[fd.key] = []; }
        } else body[fd.key] = v || null;
      });
      if (!isNew) body.id = (editing as Row).id;
      const r = await fetch(`/api/admin/${activeTab}`, {
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

  async function del(id: unknown) {
    if (!confirm(`「${id}」を削除しますか？`)) return;
    const r = await fetch(`/api/admin/${activeTab}?id=${encodeURIComponent(String(id))}`, { method: "DELETE", headers: H });
    if (r.ok) { setMsg("✓ 削除しました"); load(); }
    else setMsg("✗ 削除に失敗しました");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="世界観データ管理" eyebrow="WORLD DATA" />

      {/* タブ */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "5px 12px", borderRadius: 2, cursor: "pointer", fontSize: 10,
              fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
              background: activeTab === t.id ? `${t.color}18` : "transparent",
              border: `1px solid ${activeTab === t.id ? t.color : "rgba(255,255,255,0.1)"}`,
              color: activeTab === t.id ? t.color : "var(--color-fg-dim)",
            }}
          >
            {t.prefix} {t.label}
          </button>
        ))}
      </div>

      {loading && <LoadingStatus />}
      {msg && <Msg text={msg} />}

      {/* 一覧 */}
      {!isNew && !editing && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={startNew}
              style={{ padding: "6px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: `${tab.color}14`, border: `1px solid ${tab.color}55`, color: tab.color, fontFamily: "var(--font-mono)" }}
            >
              ＋ 新規作成
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map(row => (
              <div key={String(row.id)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "9px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: tab.color, flexShrink: 0 }}>{String(row.id)}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-fg-dim)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(row.name ?? row.title ?? row.codename ?? "")}
                </span>
                {!!row.status && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{String(row.status)}</span>}
                {row.clearance_req != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>LV{String(row.clearance_req)}</span>}
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(row)} style={{ padding: "4px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>編集</button>
                  <button onClick={() => del(row.id)} style={{ padding: "4px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>削除</button>
                </div>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "32px 0" }}>データがありません</p>
            )}
          </div>
        </>
      )}

      {/* 編集フォーム */}
      {(isNew || editing) && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tab.color}22`, borderRadius: 3, padding: "20px 20px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: tab.color, marginBottom: 16, letterSpacing: "0.08em" }}>
            {isNew ? `▶ 新規作成 — ${tab.label}` : `▶ 編集: ${String((editing as Row).id)}`}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {tab.fields.map(fd => (
              <label key={fd.key} className={fd.type === "textarea" || fd.type === "json" ? "col-span-2" : ""}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>
                  {fd.label}
                  {fd.hint && <span style={{ color: "rgba(255,255,255,0.15)", marginLeft: 8 }}>{fd.hint}</span>}
                </span>
                {fd.type === "select" ? (
                  <select value={form[fd.key] ?? ""} onChange={sf(fd.key)} style={iS}>
                    <option value="">（選択）</option>
                    {fd.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : fd.type === "textarea" || fd.type === "json" ? (
                  <textarea value={form[fd.key] ?? ""} onChange={sf(fd.key)} rows={fd.type === "json" ? 4 : 3} style={taS} />
                ) : (
                  <input type={fd.type === "number" ? "number" : "text"} value={form[fd.key] ?? ""} onChange={sf(fd.key)} style={iS} />
                )}
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => { setIsNew(false); setEditing(null); }}
              style={{ padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
              キャンセル
            </button>
            {!isNew && (
              <button onClick={() => del((editing as Row).id)}
                style={{ padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                削除
              </button>
            )}
            <button onClick={save} disabled={saving}
              style={{ padding: "7px 16px", borderRadius: 2, cursor: "pointer", fontSize: 12, background: `${tab.color}18`, border: `1px solid ${tab.color}55`, color: tab.color, fontFamily: "var(--font-mono)", opacity: saving ? 0.5 : 1 }}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
