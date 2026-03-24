"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { DIVISIONS }     from "@/lib/constants";
import { Icon, NavIcon } from "@/components/ui/Icon";

interface XpData {
  ranking:      { agent_id: string; username: string; xp_total: number; clearance_level: number; division_id: string | null }[];
  recentLogs:   { agent_id: string; activity: string; xp_gained: number; created_at: string }[];
  activityStats:{ activity: string; total_xp: number; cnt: number }[];
}

const ACTIVITY_LABEL: Record<string, string> = {
  first_login: "初回ログイン", daily_login: "ログイン", send_chat_message: "チャット",
  complete_mission: "ミッション完了", discover_keyword: "KW発見",
  admin_grant: "管理者付与", admin_adjust: "管理調整", achievement: "実績",
  skill_exam: "スキル試験", division_transfer: "部門移動",
};

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, outline: "none",
};

function fmtTime(raw: string) {
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminXpPage() {
  const [data,       setData]       = useState<XpData | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [activeTab,  setActiveTab]  = useState<"rank" | "log" | "grant">("rank");

  // 付与フォーム
  const [target,     setTarget]     = useState<"user" | "all" | "division">("user");
  const [userId,     setUserId]     = useState("");
  const [divisionId, setDivisionId] = useState("DIV-01");
  const [xp,         setXp]         = useState("");
  const [reason,     setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/xp", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGrant() {
    const xpNum = Number(xp);
    if (!xp || !Number.isInteger(xpNum) || xpNum === 0) { setMsg("XP は0以外の整数を入力してください"); return; }
    if (Math.abs(xpNum) > 100000) { setMsg("±100,000 以内で入力してください"); return; }
    if (target === "user" && !userId.trim()) { setMsg("ユーザーIDを入力してください"); return; }
    if (!confirm(`${xpNum > 0 ? "+" : ""}${xpNum} XP を付与しますか？`)) return;

    setSubmitting(true); setMsg("");
    try {
      const body: Record<string, unknown> = { target, xp: xpNum, reason: reason.trim() || undefined };
      if (target === "user")     body.userId     = userId.trim();
      if (target === "division") body.divisionId = divisionId;

      const res = await fetch("/api/admin/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg(`✓ ${d.applied} 名に ${xpNum > 0 ? "+" : ""}${xpNum} XP を付与しました`);
      setXp(""); setReason(""); setUserId("");
      load();
    } finally { setSubmitting(false); }
  }

  const maxXp = data ? Math.max(...data.ranking.map(r => r.xp_total), 1) : 1;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1000px] mx-auto">
      <PageHeader eyebrow="ADMIN — XP MANAGEMENT" title="XP管理" eyebrowColor="warning" />

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]" style={{
          background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
          border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
          color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)",
          fontFamily: "var(--font-mono)",
        }}>{msg}</div>
      )}

      {/* タブ */}
      <div className="flex gap-1 mb-5">
        {(["rank", "log", "grant"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
            style={{ background: activeTab === t ? "rgba(255,180,60,0.12)" : "transparent", border: "1px solid rgba(255,180,60,0.2)", color: activeTab === t ? "var(--color-warning)" : "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
            {t === "rank" ? "ランキング" : t === "log" ? "付与履歴" : "XP付与"}
          </button>
        ))}
      </div>

      {loading || !data ? <LoadingStatus /> : (
        <>
          {/* ランキング */}
          {activeTab === "rank" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {data.activityStats.slice(0, 3).map(a => (
                  <div key={a.activity} className="rounded-sm p-3" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.1)" }}>
                    <div className="hud-label mb-1">{ACTIVITY_LABEL[a.activity] ?? a.activity}</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                      +{Number(a.total_xp).toLocaleString()}
                    </div>
                    <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{Number(a.cnt)}件（30日）</div>
                  </div>
                ))}
              </div>

              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
                <div className="grid gap-2 px-4 py-2 text-[11px]"
                  style={{ gridTemplateColumns: "28px 1fr 1fr 100px 50px", background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                  <span>#</span><span>機関員</span><span>XP</span><span>部門</span><span>LV</span>
                </div>
                {data.ranking.map((r, i) => {
                  const pct = Math.round(r.xp_total / maxXp * 100);
                  const col = i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "var(--color-success)";
                  return (
                    <div key={r.agent_id} className="grid gap-2 px-4 py-2.5 items-center"
                      style={{ gridTemplateColumns: "28px 1fr 1fr 100px 50px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: i < 3 ? `${col}06` : "var(--color-bg-surface)" }}>
                      <span style={{ fontSize: 12, fontWeight: "bold", color: col, fontFamily: "var(--font-mono)", textAlign: "center" }}>{i + 1}</span>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{r.agent_id}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{r.username}</div>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: col, fontFamily: "var(--font-mono)", minWidth: 52, textAlign: "right" }}>
                            {Number(r.xp_total).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.division_id ?? "—"}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 2, background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.2)", color: "#ffb43c", fontFamily: "var(--font-mono)" }}>
                          LV{r.clearance_level}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 付与履歴 */}
          {activeTab === "log" && (
            <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
              <div className="grid gap-2 px-4 py-2 text-[11px]"
                style={{ gridTemplateColumns: "90px 1fr 80px 100px", background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                <span>機関員</span><span>アクティビティ</span><span>XP</span><span>日時</span>
              </div>
              {data.recentLogs.map((log, i) => (
                <div key={i} className="grid gap-2 px-4 py-2 items-center"
                  style={{ gridTemplateColumns: "90px 1fr 80px 100px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: "var(--color-bg-surface)" }}>
                  <span style={{ fontSize: 10, color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{log.agent_id}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{ACTIVITY_LABEL[log.activity] ?? log.activity}</span>
                  <span style={{ fontSize: 12, fontWeight: "bold", color: Number(log.xp_gained) >= 0 ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                    {Number(log.xp_gained) >= 0 ? "+" : ""}{Number(log.xp_gained)}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>{fmtTime(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          {/* XP付与フォーム */}
          {activeTab === "grant" && (
            <div className="rounded-sm p-5 max-w-[520px]" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.18)" }}>
              <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />XP付与 / 減算</div>

              {/* 送信先 */}
              <div className="mb-3">
                <label className="hud-label block mb-1.5">対象</label>
                <div className="flex gap-2 mb-2">
                  {(["user", "division", "all"] as const).map(t => (
                    <button key={t} onClick={() => setTarget(t)}
                      className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
                      style={{ background: target === t ? "rgba(255,180,60,0.12)" : "transparent", border: "1px solid rgba(255,180,60,0.2)", color: target === t ? "var(--color-warning)" : "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                      {t === "user" ? "個人" : t === "division" ? "部門" : "全員"}
                    </button>
                  ))}
                </div>
                {target === "user" && (
                  <input value={userId} onChange={e => setUserId(e.target.value)}
                    placeholder="ユーザーID (UUID)" style={{ ...iStyle, width: "100%" }} />
                )}
                {target === "division" && (
                  <select value={divisionId} onChange={e => setDivisionId(e.target.value)} style={{ ...iStyle, width: "100%" }}>
                    {DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                {target === "all" && <div className="hud-label" style={{ color: "var(--color-warning)" }}><Icon name="warning" size={12} style={{ marginRight: 4 }} aria-hidden />全アクティブプレイヤーが対象</div>}
              </div>

              {/* XP */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="hud-label block mb-1">XP量（マイナスで減算）</label>
                  <input type="number" value={xp} onChange={e => setXp(e.target.value)}
                    placeholder="+100 or -50" style={{ ...iStyle, width: "100%" }} />
                </div>
                <div>
                  <label className="hud-label block mb-1">理由（ログ用）</label>
                  <input value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="例: イベント報酬" style={{ ...iStyle, width: "100%" }} />
                </div>
              </div>

              <button onClick={handleGrant} disabled={submitting || !xp}
                className="w-full py-2.5 text-[12px] rounded-sm cursor-pointer"
                style={{ background: Number(xp) < 0 ? "rgba(255,68,68,0.1)" : "rgba(0,230,118,0.1)", border: `1px solid ${Number(xp) < 0 ? "rgba(255,68,68,0.3)" : "rgba(0,230,118,0.3)"}`, color: Number(xp) < 0 ? "var(--color-danger)" : "var(--color-success)", fontFamily: "var(--font-mono)", opacity: submitting || !xp ? 0.5 : 1 }}>
                {submitting ? "処理中..." : Number(xp) < 0 ? `▼ ${xp} XP 減算` : `▲ +${xp || "?"} XP 付与`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
