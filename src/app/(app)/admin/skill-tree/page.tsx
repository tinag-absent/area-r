"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

interface StatsData {
  popularNodes:  { node_id: string; cnt: number }[];
  examStats:     { skill_id: string; total_attempts: number; pass_rate: number }[];
  topUnlockers:  { agent_id: string; username: string; node_count: number }[];
}

interface UserDetail {
  userId:   string;
  userInfo: { agent_id: string; username: string; clearance_level: number } | null;
  nodes:    { node_id: string; unlocked_at: string }[];
  exams:    { skill_id: string; score: number; total: number; passed: number; taken_at: string }[];
}

function fmtTime(raw: string) {
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminSkillTreePage() {
  const [stats,    setStats]    = useState<StatsData | null>(null);
  const [detail,   setDetail]   = useState<UserDetail | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [userId,   setUserId]   = useState("");
  const [activeTab,setActiveTab]= useState<"stats" | "user">("stats");

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skill-tree", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setStats(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function loadUser() {
    if (!userId.trim()) { setMsg("ユーザーIDを入力してください"); return; }
    setLoading(true); setMsg(""); setDetail(null);
    try {
      const res = await fetch(`/api/admin/skill-tree?userId=${userId.trim()}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) { setMsg("ユーザーが見つかりません"); return; }
      const d = await res.json();
      setDetail(d);
      setActiveTab("user");
    } finally { setLoading(false); }
  }

  async function revokeNode(userId: string, nodeId: string) {
    if (!confirm(`ノード「${nodeId}」の解放を取り消しますか？`)) return;
    const res = await fetch(`/api/admin/skill-tree?userId=${userId}&nodeId=${nodeId}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ 取り消しました" : `エラー: ${d.error}`);
    if (detail) loadUser();
  }

  const iStyle: React.CSSProperties = {
    background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
    color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
    fontSize: 12, padding: "6px 8px", borderRadius: 2, outline: "none",
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — SKILL TREE" title="スキルツリー管理" eyebrowColor="warning" />

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)", border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`, color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{msg}</div>
      )}

      {/* ユーザー検索 */}
      <div className="flex gap-2 mb-5">
        <input value={userId} onChange={e => setUserId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && loadUser()}
          placeholder="ユーザーID (UUID) でスキル詳細を確認"
          style={{ ...iStyle, flex: 1 }} />
        <button onClick={loadUser}
          style={{ ...iStyle, width: "auto", padding: "6px 14px", cursor: "pointer", background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)", color: "var(--color-warning)" }}>
          検索
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-5">
        {(["stats", "user"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
            style={{ background: activeTab === t ? "rgba(255,180,60,0.12)" : "transparent", border: "1px solid rgba(255,180,60,0.2)", color: activeTab === t ? "var(--color-warning)" : "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
            {t === "stats" ? "全体統計" : "ユーザー詳細"}
          </button>
        ))}
      </div>

      {loading ? <LoadingStatus /> : (
        <>
          {/* 全体統計 */}
          {activeTab === "stats" && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* 人気ノード */}
              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
                <div className="px-4 py-2 text-[11px]" style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                  人気ノード TOP20
                </div>
                <div style={{ background: "var(--color-bg-surface)" }}>
                  {stats.popularNodes.length === 0 ? (
                    <div className="p-4 hud-label" style={{ color: "var(--color-fg-muted)" }}>データなし</div>
                  ) : (() => {
                    const maxCnt = Math.max(...stats.popularNodes.map(n => Number(n.cnt)), 1);
                    return stats.popularNodes.map((n, i) => {
                      const pct = Math.round(Number(n.cnt) / maxCnt * 100);
                      return (
                        <div key={n.node_id} className="px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <div className="flex justify-between mb-1">
                            <span style={{ fontSize: 11, color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{n.node_id}</span>
                            <span style={{ fontSize: 11, color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>{Number(n.cnt)}人</span>
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary)", borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* 試験統計 */}
                <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
                  <div className="px-4 py-2 text-[11px]" style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                    スキル試験 統計
                  </div>
                  <div style={{ background: "var(--color-bg-surface)" }}>
                    {stats.examStats.length === 0 ? (
                      <div className="p-4 hud-label" style={{ color: "var(--color-fg-muted)" }}>データなし</div>
                    ) : stats.examStats.map(e => {
                      const rate = Number(e.pass_rate);
                      const col = rate >= 70 ? "var(--color-success)" : rate >= 40 ? "var(--color-warning)" : "var(--color-danger)";
                      return (
                        <div key={e.skill_id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <span style={{ fontSize: 11, color: "var(--color-primary)", fontFamily: "var(--font-mono)", flex: 1 }}>{e.skill_id}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{Number(e.total_attempts)}回</span>
                          <span style={{ fontSize: 12, fontWeight: "bold", color: col, fontFamily: "var(--font-mono)", minWidth: 44, textAlign: "right" }}>
                            {rate.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TOP解放者 */}
                <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
                  <div className="px-4 py-2 text-[11px]" style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                    解放数 TOP10
                  </div>
                  <div style={{ background: "var(--color-bg-surface)" }}>
                    {stats.topUnlockers.map((u, i) => (
                      <div key={u.agent_id} className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <span style={{ fontSize: 12, fontWeight: "bold", color: i < 3 ? "#ffd700" : "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)", width: 20 }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{u.agent_id}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{u.username}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: "bold", color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                          {u.node_count} ノード
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ユーザー詳細 */}
          {activeTab === "user" && (
            detail ? (
              <div>
                <div className="rounded-sm p-4 mb-4" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.12)" }}>
                  <div className="flex items-center gap-4">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: "var(--color-foreground)" }}>{detail.userInfo?.username ?? "不明"}</div>
                      <div className="hud-label" style={{ color: "var(--color-primary)" }}>{detail.userInfo?.agent_id}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 2, background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.2)", color: "#ffb43c", fontFamily: "var(--font-mono)" }}>
                      LV{detail.userInfo?.clearance_level ?? "—"}
                    </span>
                    <div className="ml-auto hud-label" style={{ color: "var(--color-fg-muted)" }}>
                      解放 {detail.nodes.length} ノード / 試験 {detail.exams.length} 件
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 解放ノード */}
                  <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
                    <div className="px-4 py-2 text-[11px]" style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                      解放済みノード ({detail.nodes.length})
                    </div>
                    <div style={{ background: "var(--color-bg-surface)", maxHeight: 400, overflowY: "auto" }}>
                      {detail.nodes.length === 0 ? (
                        <div className="p-4 hud-label" style={{ color: "var(--color-fg-muted)" }}>解放済みノードなし</div>
                      ) : detail.nodes.map(n => (
                        <div key={n.node_id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <span style={{ fontSize: 11, color: "var(--color-success)", fontFamily: "var(--font-mono)", flex: 1 }}>{n.node_id}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{fmtTime(n.unlocked_at)}</span>
                          <button onClick={() => revokeNode(detail.userId, n.node_id)}
                            style={{ fontSize: 9, padding: "1px 6px", borderRadius: 2, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                            取消
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 試験結果 */}
                  <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
                    <div className="px-4 py-2 text-[11px]" style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                      試験結果 ({detail.exams.length})
                    </div>
                    <div style={{ background: "var(--color-bg-surface)", maxHeight: 400, overflowY: "auto" }}>
                      {detail.exams.length === 0 ? (
                        <div className="p-4 hud-label" style={{ color: "var(--color-fg-muted)" }}>試験受験なし</div>
                      ) : detail.exams.map((e, i) => {
                        const pct = Math.round(e.score / Math.max(e.total, 1) * 100);
                        return (
                          <div key={i} className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <div className="flex justify-between mb-1">
                              <span style={{ fontSize: 11, color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{e.skill_id}</span>
                              <span style={{ fontSize: 11, fontWeight: "bold", color: e.passed ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                                {e.score}/{e.total} ({pct}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 2, background: e.passed ? "rgba(0,230,118,0.1)" : "rgba(255,68,68,0.1)", color: e.passed ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                                {e.passed ? "PASS" : "FAIL"}
                              </span>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{fmtTime(e.taken_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-sm" style={{ border: "1px dashed rgba(255,180,60,0.1)" }}>
                <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                  ユーザーIDを入力して検索してください
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
