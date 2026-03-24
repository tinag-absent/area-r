"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

interface Achievement {
  id: string; key: string; title: string; description: string;
  icon: string | null; xp_reward: number; is_secret: number; earnedCount: number;
}

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background: ok ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)", border: `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`, color: ok ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{text}</div>;
}

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState("");

  // 付与フォーム
  const [grantUserId, setGrantUserId] = useState("");
  const [grantKey,    setGrantKey]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  // 取り消しフォーム
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeKey,    setRevokeKey]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/achievements", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setAchievements(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGrant() {
    if (!grantUserId.trim() || !grantKey.trim()) { setMsg("ユーザーIDと実績キーを入力してください"); return; }
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/admin/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ userId: grantUserId.trim(), achievementKey: grantKey.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg(d.skipped ? "既に取得済みです" : `✓ 付与しました（+${d.xpGranted} XP）`);
      setGrantUserId(""); setGrantKey("");
      load();
    } finally { setSubmitting(false); }
  }

  async function handleRevoke() {
    if (!revokeUserId.trim() || !revokeKey.trim()) { setMsg("ユーザーIDと実績キーを入力してください"); return; }
    if (!confirm("実績を取り消しますか？（XPは返還されません）")) return;
    setMsg("");
    const res = await fetch(`/api/admin/achievements?userId=${revokeUserId}&key=${revokeKey}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ 取り消しました" : `エラー: ${d.error}`);
    setRevokeUserId(""); setRevokeKey("");
    load();
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — ACHIEVEMENTS" title="実績管理" eyebrowColor="warning" />

      {msg && <Msg text={msg} />}

      {/* 操作パネル */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* 付与 */}
        <div className="rounded-sm p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,230,118,0.15)" }}>
          <div className="hud-label mb-3" style={{ color: "var(--color-success)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />実績を付与</div>
          <div className="flex flex-col gap-2">
            <input value={grantUserId} onChange={e => setGrantUserId(e.target.value)} placeholder="ユーザーID (UUID)" style={iStyle} />
            <select value={grantKey} onChange={e => setGrantKey(e.target.value)} style={iStyle}>
              <option value="">— 実績を選択 —</option>
              {achievements.map(a => <option key={a.key} value={a.key}>{a.title} ({a.key})</option>)}
            </select>
            <button onClick={handleGrant} disabled={submitting || !grantUserId || !grantKey}
              style={{ padding: "7px", borderRadius: 2, cursor: "pointer", fontSize: 12, fontFamily: "var(--font-mono)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "var(--color-success)", opacity: submitting ? 0.5 : 1 }}>
              {submitting ? "処理中..." : "付与する"}
            </button>
          </div>
        </div>

        {/* 取り消し */}
        <div className="rounded-sm p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.12)" }}>
          <div className="hud-label mb-3" style={{ color: "var(--color-danger)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />実績を取り消し</div>
          <div className="flex flex-col gap-2">
            <input value={revokeUserId} onChange={e => setRevokeUserId(e.target.value)} placeholder="ユーザーID (UUID)" style={iStyle} />
            <select value={revokeKey} onChange={e => setRevokeKey(e.target.value)} style={iStyle}>
              <option value="">— 実績を選択 —</option>
              {achievements.map(a => <option key={a.key} value={a.key}>{a.title}</option>)}
            </select>
            <button onClick={handleRevoke} disabled={!revokeUserId || !revokeKey}
              style={{ padding: "7px", borderRadius: 2, cursor: "pointer", fontSize: 12, fontFamily: "var(--font-mono)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)" }}>
              取り消す
            </button>
          </div>
        </div>
      </div>

      {/* 実績マスター一覧 */}
      <div className="hud-label mb-2" style={{ color: "var(--color-warning)" }}>実績マスター一覧</div>
      {loading ? <LoadingStatus /> : (
        <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
          <div className="grid gap-2 px-4 py-2 text-[11px]"
            style={{ gridTemplateColumns: "28px 1fr 180px 60px 50px 60px", background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            <span></span><span>実績名 / キー</span><span>説明</span><span>XP</span><span>種別</span><span>取得数</span>
          </div>
          {achievements.map((a, i) => (
            <div key={a.id} className="grid gap-2 px-4 py-2.5 items-center"
              style={{ gridTemplateColumns: "28px 1fr 180px 60px 50px 60px", borderBottom: i < achievements.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "var(--color-bg-surface)" }}>
              <div style={{ fontSize: 16, textAlign: "center" }}><NavIcon icon={a.icon ?? "entity"} size={16} /></div>
              <div>
                <div className="text-[12px] font-bold" style={{ color: "var(--color-foreground)" }}>{a.title}</div>
                <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{a.key}</div>
              </div>
              <div className="text-[11px]" style={{ color: "var(--color-fg-dim)" }}>{a.description.slice(0, 40)}{a.description.length > 40 ? "…" : ""}</div>
              <div className="text-[11px]" style={{ color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>+{a.xp_reward}</div>
              <div>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 2, background: a.is_secret ? "rgba(160,100,255,0.12)" : "rgba(0,200,255,0.08)", border: `1px solid ${a.is_secret ? "rgba(160,100,255,0.3)" : "rgba(0,200,255,0.2)"}`, color: a.is_secret ? "#a064ff" : "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                  {a.is_secret ? "秘密" : "通常"}
                </span>
              </div>
              <div className="text-[12px]" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>{a.earnedCount}人</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
