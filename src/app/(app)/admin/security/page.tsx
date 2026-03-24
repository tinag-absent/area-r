"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

interface SecurityData {
  rateLimits1h:  { key_type: string; key_value: string; attempts: number; last_at: string }[];
  rateLimits24h: { key_type: string; key_value: string; attempts: number; last_at: string }[];
  accessLogs:    { id: string; method: string; path: string; status_code: number | null; created_at: string; agent_id: string | null }[];
  anomalyUsers:  { agent_id: string; anomaly_score: number; observer_load: number; status: string }[];
  failedLogins:  { key_value: string; fails: number }[];
}

const METHOD_COLOR: Record<string, string> = {
  GET: "var(--color-primary)", POST: "var(--color-success)",
  DELETE: "var(--color-danger)", PATCH: "var(--color-warning)", PUT: "#a064ff",
};

function fmtTime(raw: string) {
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
      <div className="px-4 py-2 text-[11px]" style={{ background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
        {title}
      </div>
      <div style={{ background: "var(--color-bg-surface)" }}>{children}</div>
    </div>
  );
}

export default function AdminSecurityPage() {
  const [data,       setData]       = useState<SecurityData | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [activeTab,  setActiveTab]  = useState<"rate" | "access" | "anomaly">("rate");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function clearData(type: "rate_limits" | "access_logs") {
    if (!confirm(`${type === "rate_limits" ? "7日以前のレートリミット履歴" : "30日以前のアクセスログ"}を削除しますか？`)) return;
    const res = await fetch(`/api/admin/security?type=${type}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ 削除しました" : `エラー: ${d.error}`);
    load();
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1000px] mx-auto">
      <PageHeader eyebrow="ADMIN — SECURITY" title="セキュリティ監視" eyebrowColor="warning" />

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)", border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`, color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{msg}</div>
      )}

      {/* タブ */}
      <div className="flex gap-1 mb-4 items-center">
        {(["rate", "access", "anomaly"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
            style={{ background: activeTab === t ? "rgba(255,180,60,0.12)" : "transparent", border: "1px solid rgba(255,180,60,0.2)", color: activeTab === t ? "var(--color-warning)" : "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
            {t === "rate" ? "レートリミット" : t === "access" ? "アクセスログ" : "異常スコア"}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => clearData("rate_limits")}
            style={{ fontSize: 10, padding: "4px 8px", borderRadius: 2, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
            古いRL削除
          </button>
          <button onClick={() => clearData("access_logs")}
            style={{ fontSize: 10, padding: "4px 8px", borderRadius: 2, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
            古いログ削除
          </button>
          <button onClick={load}
            style={{ fontSize: 10, padding: "4px 8px", borderRadius: 2, cursor: "pointer", background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
            更新
          </button>
        </div>
      </div>

      {loading || !data ? <LoadingStatus /> : (
        <>
          {activeTab === "rate" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SectionCard title="レートリミット上位 TOP20（1h）">
                {data.rateLimits1h.length === 0 ? (
                  <div className="p-4 hud-label" style={{ color: "var(--color-fg-muted)" }}>なし</div>
                ) : data.rateLimits1h.map((r, i) => (
                  <div key={i} className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 2, background: "rgba(255,68,68,0.12)", border: "1px solid rgba(255,68,68,0.3)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{r.key_type}</span>
                      <span style={{ fontSize: 13, fontWeight: "bold", color: r.attempts > 10 ? "var(--color-danger)" : "var(--color-warning)", fontFamily: "var(--font-mono)" }}>{r.attempts}回</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>{r.key_value.slice(0, 36)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{fmtTime(r.last_at)}</div>
                  </div>
                ))}
              </SectionCard>

              <div className="flex flex-col gap-4">
                <SectionCard title="ログイン失敗 上位IP（24h）">
                  {data.failedLogins.length === 0 ? (
                    <div className="p-4 hud-label" style={{ color: "var(--color-fg-muted)" }}>なし</div>
                  ) : data.failedLogins.map((r, i) => (
                    <div key={i} className="flex justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>{r.key_value}</span>
                      <span style={{ fontSize: 12, fontWeight: "bold", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{r.fails}失敗</span>
                    </div>
                  ))}
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === "access" && (
            <SectionCard title="アクセスログ 直近50件">
              {data.accessLogs.map((log, i) => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "var(--font-mono)" }}>
                  <span style={{ fontSize: 10, width: 44, textAlign: "center", flexShrink: 0, padding: "1px 4px", borderRadius: 2, background: `${METHOD_COLOR[log.method] ?? "var(--color-fg-muted)"}18`, color: METHOD_COLOR[log.method] ?? "var(--color-fg-muted)" }}>
                    {log.method}
                  </span>
                  <span style={{ fontSize: 11, color: log.status_code && log.status_code >= 400 ? "var(--color-danger)" : "rgba(255,255,255,0.5)", minWidth: 32 }}>
                    {log.status_code ?? "—"}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.path}</span>
                  {log.agent_id && <span style={{ fontSize: 10, color: "rgba(0,200,255,0.6)", flexShrink: 0 }}>{log.agent_id}</span>}
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{fmtTime(log.created_at)}</span>
                </div>
              ))}
            </SectionCard>
          )}

          {activeTab === "anomaly" && (
            <SectionCard title="異常スコア上位ユーザー (score > 5)">
              {data.anomalyUsers.length === 0 ? (
                <div className="p-6 text-center hud-label" style={{ color: "var(--color-fg-muted)" }}>異常スコアの高いユーザーはいません</div>
              ) : data.anomalyUsers.map((u, i) => {
                const score = Number(u.anomaly_score);
                const col = score >= 80 ? "var(--color-danger)" : score >= 50 ? "var(--color-warning)" : "var(--color-fg-dim)";
                return (
                  <div key={u.agent_id} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-primary)", width: 100, flexShrink: 0 }}>{u.agent_id}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(score, 100)}%`, height: "100%", background: col, borderRadius: 3 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: "bold", color: col, fontFamily: "var(--font-mono)", width: 40 }}>{score.toFixed(0)}</span>
                    <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 2, background: u.status === "active" ? "rgba(0,230,118,0.1)" : "rgba(255,68,68,0.1)", color: u.status === "active" ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{u.status}</span>
                  </div>
                );
              })}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
