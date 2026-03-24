"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { DIVISIONS } from "@/lib/constants";

interface Mission {
  id: string; title: string; description: string | null;
  category: string; status: string; required_level: number;
  xp_reward: number; phase: number; assigned_division: string | null;
  issued_by: string | null; issued_at: string | null; deadline_at: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--color-danger)", monitoring: "var(--color-warning)",
  completed: "var(--color-success)", failed: "var(--color-fg-dim)",
};
const CATEGORY_COLOR: Record<string, string> = {
  critical: "var(--color-danger)", standard: "var(--color-primary)", support: "var(--color-success)",
};

export default function AdminMissionsPage() {
  const [missions, setMissions]   = useState<Mission[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [msg, setMsg]             = useState("");

  // 新規作成フォーム
  const [form, setForm] = useState({
    title: "", description: "", category: "standard", status: "active",
    required_level: "2", xp_reward: "100", phase: "1",
    assigned_division: "", issued_by: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error();
      setMissions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patchStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/missions?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({
        ...form,
        required_level: Number(form.required_level),
        xp_reward:      Number(form.xp_reward),
        phase:          Number(form.phase),
        assigned_division: form.assigned_division || null,
        issued_by:      form.issued_by || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(`エラー: ${data.error}`); return; }
    setMsg("✓ ミッションを作成しました");
    setShowForm(false);
    setForm({ title: "", description: "", category: "standard", status: "active",
              required_level: "2", xp_reward: "100", phase: "1", assigned_division: "", issued_by: "" });
    load();
  }

  const inputStyle = {
    background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
    color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
    outline: "none", fontSize: 12, padding: "6px 10px", borderRadius: 2,
    width: "100%",
  };
  const selectStyle = { ...inputStyle };

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <div className="flex items-center justify-between mb-1">
        <PageHeader eyebrow="ADMIN — MISSIONS" title="ミッション管理" eyebrowColor="warning" />
        <button onClick={() => setShowForm(v => !v)}
          className="text-[11px] px-4 py-2 rounded-sm cursor-pointer"
          style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)",
            color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
          {showForm ? "▲ 閉じる" : "＋ 新規作成"}
        </button>
      </div>

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]"
          style={{ background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
            border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
            color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)" }}>
          {msg}
        </div>
      )}

      {/* 新規作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 rounded-sm"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.15)" }}>
          <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}>新規ミッション</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <div className="hud-label mb-1">タイトル *</div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required maxLength={100} style={inputStyle} placeholder="ミッションタイトル" />
            </div>
            <div className="sm:col-span-2">
              <div className="hud-label mb-1">説明</div>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="ミッションの説明" />
            </div>
            {[
              { key: "category", label: "カテゴリ", opts: ["critical","standard","support"] },
              { key: "status",   label: "ステータス", opts: ["active","monitoring","completed"] },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="hud-label mb-1">{label}</div>
                <select value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={selectStyle}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {[
              { key: "required_level", label: "必要LV", type: "number", min: 0, max: 5 },
              { key: "xp_reward",      label: "XP報酬",   type: "number", min: 0 },
              { key: "phase",          label: "フェーズ",  type: "number", min: 1, max: 3 },
            ].map(({ key, label, ...rest }) => (
              <div key={key}>
                <div className="hud-label mb-1">{label}</div>
                <input value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={inputStyle} {...rest} />
              </div>
            ))}
            <div>
              <div className="hud-label mb-1">担当部門</div>
              <select value={form.assigned_division}
                onChange={e => setForm(p => ({ ...p, assigned_division: e.target.value }))}
                style={selectStyle}>
                <option value="">未割当</option>
                {DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <div className="hud-label mb-1">発令元</div>
              <input value={form.issued_by} onChange={e => setForm(p => ({ ...p, issued_by: e.target.value }))}
                style={inputStyle} placeholder="発令元部門名" maxLength={50} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit"
              className="text-[12px] px-5 py-2 rounded-sm cursor-pointer"
              style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.35)",
                color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
              作成
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-[12px] px-4 py-2 rounded-sm cursor-pointer"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {loading && <LoadingStatus />}

      {!loading && (
        <div className="flex flex-col gap-2">
          {missions.map(m => {
            const sc = STATUS_COLOR[m.status] ?? "var(--color-fg-dim)";
            const cc = CATEGORY_COLOR[m.category] ?? "var(--color-primary)";
            return (
              <div key={m.id} className="p-4 rounded-sm"
                style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.08)",
                  borderLeft: `3px solid ${cc}` }}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5"
                        style={{ background: `${cc}18`, border: `1px solid ${cc}55`, color: cc, fontFamily: "var(--font-mono)" }}>
                        {m.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5"
                        style={{ background: `${sc}18`, border: `1px solid ${sc}55`, color: sc, fontFamily: "var(--font-mono)" }}>
                        {m.status}
                      </span>
                      <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                        LV{m.required_level} / +{m.xp_reward}XP / P{m.phase}
                      </span>
                    </div>
                    <div className="text-[13px] font-bold mb-0.5" style={{ color: "var(--color-foreground)" }}>
                      {m.title}
                    </div>
                    <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{m.id}</div>
                  </div>
                  {/* ステータス変更ボタン */}
                  <div className="flex gap-1.5 flex-wrap shrink-0">
                    {["active","monitoring","completed","failed"].filter(s => s !== m.status).map(s => (
                      <button key={s} onClick={() => patchStatus(m.id, s)}
                        className="text-[10px] px-2 py-1 rounded-sm cursor-pointer"
                        style={{ background: `${STATUS_COLOR[s]}10`, border: `1px solid ${STATUS_COLOR[s]}44`,
                          color: STATUS_COLOR[s], fontFamily: "var(--font-mono)" }}>
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
