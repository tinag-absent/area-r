"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon }          from "@/components/ui/Icon";

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

interface StoryTrigger {
  id:              string;
  title:           string;
  trigger_type:    string;
  active:          number;
  priority:        number;
  once_per_user:   number;
  conditions_json: string;
  effects_json:    string;
  description:     string | null;
  created_at:      string;
  updated_at:      string;
}

// ─────────────────────────────────────────────────────────────────────
// スタイル定数
// ─────────────────────────────────────────────────────────────────────

const S = {
  bg:      "#07090f",
  panel:   "#0c1018",
  panel2:  "#111620",
  border:  "#1a2030",
  border2: "#263040",
  cyan:    "#00d4ff",
  green:   "#00e676",
  yellow:  "#ffd740",
  red:     "#ff5252",
  orange:  "#ff9800",
  text:    "#cdd6e8",
  text2:   "#7a8aa0",
  mono:    "'Share Tech Mono', 'Courier New', monospace",
} as const;

const iStyle: React.CSSProperties = {
  background: S.panel2, border: `1px solid ${S.border2}`,
  color: S.text, fontFamily: S.mono,
  padding: "8px 10px", fontSize: 12, width: "100%",
  outline: "none", borderRadius: 0,
};

const taStyle: React.CSSProperties = {
  ...iStyle, resize: "vertical", minHeight: 80,
};

const TRIGGER_TYPES = [
  "composite", "flag", "level", "xp", "streak", "anomaly",
] as const;

// ─────────────────────────────────────────────────────────────────────
// エディターのデフォルト値
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONDITIONS = JSON.stringify({ not_flag: "first_login_done" }, null, 2);
const DEFAULT_EFFECTS = JSON.stringify({
  flag: "my_flag",
  xp: 50,
  notification: {
    type: "story",
    title: "タイトル",
    body: "通知本文",
  },
}, null, 2);

// ─────────────────────────────────────────────────────────────────────
// メインページ
// ─────────────────────────────────────────────────────────────────────

export default function StoryTriggersAdminPage() {
  const [triggers, setTriggers]   = useState<StoryTrigger[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [selected, setSelected]   = useState<StoryTrigger | null>(null);
  const [isNew,    setIsNew]      = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [error,    setError]      = useState("");

  // フォーム状態
  const [formId,          setFormId]          = useState("");
  const [formTitle,       setFormTitle]       = useState("");
  const [formType,        setFormType]        = useState<string>("composite");
  const [formPriority,    setFormPriority]    = useState(0);
  const [formActive,      setFormActive]      = useState(true);
  const [formOnce,        setFormOnce]        = useState(true);
  const [formConditions,  setFormConditions]  = useState(DEFAULT_CONDITIONS);
  const [formEffects,     setFormEffects]     = useState(DEFAULT_EFFECTS);
  const [formDescription, setFormDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/story-triggers", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (r.ok) setTriggers(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setIsNew(true);
    setSelected(null);
    setFormId("");
    setFormTitle("");
    setFormType("composite");
    setFormPriority(0);
    setFormActive(true);
    setFormOnce(true);
    setFormConditions(DEFAULT_CONDITIONS);
    setFormEffects(DEFAULT_EFFECTS);
    setFormDescription("");
    setError("");
  };

  const openEdit = (t: StoryTrigger) => {
    setIsNew(false);
    setSelected(t);
    setFormId(t.id);
    setFormTitle(t.title);
    setFormType(t.trigger_type);
    setFormPriority(t.priority);
    setFormActive(t.active === 1);
    setFormOnce(t.once_per_user === 1);
    setFormConditions(JSON.stringify(JSON.parse(t.conditions_json), null, 2));
    setFormEffects(JSON.stringify(JSON.parse(t.effects_json), null, 2));
    setFormDescription(t.description ?? "");
    setError("");
  };

  const save = async () => {
    setError("");
    // JSON validation
    try { JSON.parse(formConditions); } catch { setError("conditions_json が不正なJSONです"); return; }
    try { JSON.parse(formEffects);    } catch { setError("effects_json が不正なJSONです"); return; }

    setSaving(true);
    try {
      const body = {
        id:              isNew ? (formId || undefined) : selected?.id,
        title:           formTitle,
        trigger_type:    formType,
        priority:        formPriority,
        active:          formActive,
        once_per_user:   formOnce,
        conditions_json: formConditions,
        effects_json:    formEffects,
        description:     formDescription || null,
      };

      const r = await fetch("/api/admin/story-triggers", {
        method:  isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body:    JSON.stringify(body),
      });

      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "保存エラー"); return; }
      await load();
      setSelected(null);
      setIsNew(false);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm(`トリガー "${id}" を削除しますか？`)) return;
    await fetch(`/api/admin/story-triggers?id=${encodeURIComponent(id)}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    await load();
    if (selected?.id === id) { setSelected(null); setIsNew(false); }
  };

  const toggleActive = async (t: StoryTrigger) => {
    await fetch("/api/admin/story-triggers", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body:    JSON.stringify({ id: t.id, active: t.active === 0 }),
    });
    await load();
  };

  const showForm = isNew || selected !== null;

  return (
    <div style={{ padding: "24px 28px", minHeight: "100vh", background: S.bg, fontFamily: S.mono }}>
      <PageHeader eyebrow="ADMIN — STORY ENGINE" title="ストーリートリガー管理" eyebrowColor="warning" />

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        {/* ── 左: トリガー一覧 ── */}
        <div style={{ flex: "0 0 360px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: S.text2, letterSpacing: "0.08em" }}>
              {triggers.length} TRIGGERS
            </span>
            <button
              onClick={openNew}
              style={{
                padding: "5px 14px", fontSize: 11, cursor: "pointer",
                background: "rgba(0,212,255,0.1)", border: `1px solid ${S.cyan}44`,
                color: S.cyan, fontFamily: S.mono,
              }}
            >
              <Icon name="dashboard" size={11} style={{ marginRight: 4 }} aria-hidden />新規
            </button>
          </div>

          {loading ? <LoadingStatus /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {triggers.map(t => {
                const isActive = t.active === 1;
                const isSelected = selected?.id === t.id;
                return (
                  <div
                    key={t.id}
                    style={{
                      background: isSelected ? "rgba(0,212,255,0.06)" : S.panel,
                      border: `1px solid ${isSelected ? S.cyan + "44" : S.border}`,
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}
                    onClick={() => openEdit(t)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 8, padding: "1px 5px",
                        background: isActive ? "rgba(0,230,118,0.1)" : "rgba(255,82,82,0.08)",
                        border: `1px solid ${isActive ? S.green + "44" : S.red + "44"}`,
                        color: isActive ? S.green : S.red, letterSpacing: "0.08em",
                      }}>
                        {isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <span style={{
                        fontSize: 8, padding: "1px 5px",
                        background: "rgba(255,215,64,0.08)",
                        border: `1px solid ${S.yellow}33`, color: S.yellow,
                        letterSpacing: "0.06em",
                      }}>
                        {t.trigger_type.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, color: S.text2, marginLeft: "auto" }}>
                        P:{t.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: S.text, fontWeight: 700 }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: S.text2, marginTop: 2 }}>{t.id}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); toggleActive(t); }}
                        style={{
                          fontSize: 10, padding: "2px 8px", cursor: "pointer",
                          background: "transparent",
                          border: `1px solid ${isActive ? S.red + "44" : S.green + "44"}`,
                          color: isActive ? S.red : S.green, fontFamily: S.mono,
                        }}
                      >
                        {isActive ? "無効化" : "有効化"}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); del(t.id); }}
                        style={{
                          fontSize: 10, padding: "2px 8px", cursor: "pointer",
                          background: "transparent",
                          border: `1px solid ${S.red}33`,
                          color: S.red, fontFamily: S.mono,
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
              {triggers.length === 0 && (
                <div style={{ fontSize: 12, color: S.text2, padding: 16, textAlign: "center" }}>
                  トリガーがありません
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 右: エディター ── */}
        {showForm && (
          <div style={{ flex: 1, background: S.panel, border: `1px solid ${S.border2}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: S.orange, marginBottom: 16, letterSpacing: "0.08em" }}>
              <Icon name="dashboard" size={11} style={{ marginRight: 6 }} aria-hidden />
              {isNew ? "新規トリガー" : `編集: ${selected?.id}`}
            </div>

            {error && (
              <div style={{ background: "rgba(255,82,82,0.08)", border: `1px solid ${S.red}44`, color: S.red, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {isNew && (
                <div>
                  <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>ID（省略時は自動生成）</label>
                  <input style={iStyle} value={formId} onChange={e => setFormId(e.target.value)} placeholder="my_trigger_id" />
                </div>
              )}
              <div style={{ gridColumn: isNew ? "auto" : "1 / -1" }}>
                <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>タイトル *</label>
                <input style={iStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>トリガー種別</label>
                <select style={iStyle} value={formType} onChange={e => setFormType(e.target.value)}>
                  {TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>優先度（高い順に評価）</label>
                <input type="number" style={iStyle} value={formPriority} onChange={e => setFormPriority(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>状態</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: S.text, cursor: "pointer" }}>
                    <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} />有効
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: S.text, cursor: "pointer" }}>
                    <input type="checkbox" checked={formOnce} onChange={e => setFormOnce(e.target.checked)} />1回限り
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>
                conditions_json *
                <span style={{ marginLeft: 8, color: S.text2 + "88" }}>
                  例: {`{"min_level": 2, "not_flag": "level2_unlocked"}`}
                </span>
              </label>
              <textarea style={taStyle} value={formConditions} onChange={e => setFormConditions(e.target.value)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>
                effects_json *
                <span style={{ marginLeft: 8, color: S.text2 + "88" }}>
                  例: {`{"flag": "my_flag", "xp": 50, "notification": {...}}`}
                </span>
              </label>
              <textarea style={taStyle} value={formEffects} onChange={e => setFormEffects(e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: S.text2, display: "block", marginBottom: 4 }}>説明（管理者メモ）</label>
              <input style={iStyle} value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={save}
                disabled={saving || !formTitle.trim()}
                style={{
                  padding: "8px 20px", fontSize: 12, cursor: "pointer",
                  background: "rgba(0,212,255,0.1)",
                  border: `1px solid ${S.cyan}66`, color: S.cyan,
                  fontFamily: S.mono, opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "保存中…" : "保存"}
              </button>
              <button
                onClick={() => { setSelected(null); setIsNew(false); }}
                style={{
                  padding: "8px 20px", fontSize: 12, cursor: "pointer",
                  background: "transparent",
                  border: `1px solid ${S.border2}`, color: S.text2,
                  fontFamily: S.mono,
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── conditions_json フィールド一覧 ── */}
      <details style={{ marginTop: 28 }}>
        <summary style={{ fontSize: 11, color: S.text2, cursor: "pointer", letterSpacing: "0.06em" }}>
          conditions_json フィールド一覧
        </summary>
        <div style={{ background: S.panel, border: `1px solid ${S.border}`, padding: 16, marginTop: 8 }}>
          {[
            ["not_flag",      "string", "このフラグが立っていないことが条件"],
            ["required_flag", "string", "このフラグが立っていることが条件"],
            ["min_level",     "number", "clearance_level の最小値"],
            ["min_xp",        "number", "xp_total の最小値"],
            ["min_streak",    "number", "consecutive_login_days の最小値"],
            ["min_anomaly",   "number", "anomaly_score の最小値"],
            ["max_anomaly",   "number", "anomaly_score の最大値"],
          ].map(([field, type, desc]) => (
            <div key={field} style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 11 }}>
              <span style={{ color: S.cyan, width: 140, flexShrink: 0 }}>{field}</span>
              <span style={{ color: S.yellow, width: 60, flexShrink: 0 }}>{type}</span>
              <span style={{ color: S.text2 }}>{desc}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
