/*
 * dashboard/page.tsx — メインダッシュボード
 * Updated: 2026-03-23 — force-dynamic を明示（cookies使用のためビルドログ整理）
 */
import type { Metadata } from "next";
import { processLoginBonus } from "@/actions/login-bonus";
import { LoginBonusToast } from "@/components/dashboard/LoginBonusToast";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { BootSequence } from "@/components/dashboard/BootSequence";
import { LEVEL_THRESHOLDS, DIVISIONS } from "@/lib/constants";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getDb, queryOne, queryAll } from "@/lib/db";
import { Icon, NavIcon } from "@/components/ui/Icon";

// cookies() を使用するため動的レンダリングを明示
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ダッシュボード — 海蝕機関" };

function XpBar({ xp, level }: { xp: number; level: number }) {
  const cur  = LEVEL_THRESHOLDS[level] ?? 0;
  const next = LEVEL_THRESHOLDS[level + 1];
  const pct  = next ? Math.min(((xp - cur) / (next - cur)) * 100, 100) : 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span className="hud-label">{xp.toLocaleString()} XP</span>
        <span className="hud-label">
          {next ? `LV${level + 1} まで ${(next - xp).toLocaleString()} XP` : "MAX LEVEL"}
        </span>
      </div>
      <div className="meter" style={{ height: 3 }}>
        <div className="meter-fill meter-fill-cyan" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="card bracket" style={{ textAlign: "center", padding: "14px 12px" }}>
      <div className="hud-label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: "bold", color,
        fontFamily: "var(--font-mono)", lineHeight: 1,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}>{value}</div>
      {sub && <div className="hud-label" style={{ marginTop: 5 }}>{sub}</div>}
    </div>
  );
}



export default async function DashboardPage() {
  const bonus = await processLoginBonus();

  const jar     = await cookies();
  const token   = jar.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  const db  = getDb();
  // ── GSI リアルタイム ──────────────────────────────────────────
  let incidents: { severity: string; gsi: number; status: string }[] = [];
  try {
    incidents = await queryAll<{ severity: string; gsi: number; status: string }>(db,
      `SELECT severity, gsi, status FROM field_incidents`
    );
  } catch { /* incidents stays empty */ }

  const criticalCount = incidents.filter(i => i.severity === "critical").length;
  const maxGsi        = incidents.length > 0 ? Math.max(...incidents.map(i => Number(i.gsi))) : 3.7;
  const gsiLabel      = maxGsi >= 10 ? "CRITICAL" : maxGsi >= 5 ? "ELEVATED" : "NOMINAL";
  const gsiColor      = maxGsi >= 10 ? "var(--color-danger)" : maxGsi >= 5 ? "var(--color-warning)" : "var(--color-success)";
  const activeCount   = incidents.filter(i => i.status !== "収束済み").length;

  const INTEL_FEED = [
    { label: "最大GSI値",       value: `${maxGsi.toFixed(1)} — ${gsiLabel}`,          color: gsiColor },
    { label: "活動中インシデント", value: `${activeCount}件 / 全${incidents.length}件`, color: "var(--color-primary)" },
    { label: "緊急対応中",       value: `TYPE-Ⅰ ${criticalCount}件`,                  color: criticalCount > 0 ? "var(--color-danger)" : "var(--color-success)" },
    { label: "収束ステータス",    value: activeCount === 0 ? "ALL CLEAR" : "ACTIVE",  color: activeCount === 0 ? "var(--color-success)" : "var(--color-warning)" },
  ];

  const row = payload
    ? await queryOne<{
        xp_total: number; clearance_level: number; anomaly_score: number;
        observer_load: number; consecutive_login_days: number;
        agent_id: string; username: string; division_id: string | null;
        display_name: string | null;
      }>(db,
        `SELECT xp_total, clearance_level, anomaly_score, observer_load,
                consecutive_login_days, agent_id, username, division_id, display_name
         FROM users WHERE id = ?`,
        [payload.id])
    : null;

  const xp           = bonus?.xp     ?? Number(row?.xp_total ?? 0);
  const level        = bonus?.level  ?? Number(row?.clearance_level ?? 0);
  const streak       = bonus?.streak ?? Number(row?.consecutive_login_days ?? 0);
  const anomaly      = Number(row?.anomaly_score ?? 0);
  const observerLoad = Number(row?.observer_load ?? 0);
  const agentId      = row?.agent_id ?? "";
  const username     = row?.username ?? "";
  const divisionId   = row?.division_id ?? null;
  const division     = DIVISIONS.find(d => d.id === divisionId);

  return (
    <div className="page-body">
      <BootSequence />
      <LoginBonusToast bonus={bonus} />
      <OnboardingModal agentId={agentId} />

      {/* ── ページヘッダー ── */}
      <div className="page-header">
        <div className="hud-label" style={{ marginBottom: 4 }}>CLASSIFIED — INTERNAL SYSTEM</div>
        <h1 className="page-title">OPERATION DASHBOARD</h1>
      </div>

      {/* ── エージェントカード ── */}
      <div className="card bracket" style={{
        marginBottom: 16, padding: "18px 20px",
        borderColor: "rgba(0,200,255,0.14)",
        background: "linear-gradient(135deg, rgba(0,200,255,0.035) 0%, transparent 60%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* グリッド装飾 */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div>
              <div className="hud-label" style={{ marginBottom: 4 }}>AGENT IDENTIFICATION</div>
              <div style={{
                fontSize: 26, fontWeight: "bold", letterSpacing: "0.06em",
                color: "var(--color-primary)", lineHeight: 1, marginBottom: 3,
                fontFamily: "var(--font-display)",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}>{agentId}</div>
              {username && (
                <div style={{ fontSize: 12, color: "var(--color-fg-dim)" }}>{username}</div>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start" }}>
              <span className="badge badge-cyan">CLEARANCE LV {level}</span>
              <span className="badge badge-green"><Icon name="dot" size={8} style={{ marginRight: 4 }} aria-hidden />ACTIVE</span>
              {division && (
                <span className="badge" style={{
                  color: division.color, borderColor: `${division.color}44`,
                  background: `${division.color}0e`,
                }}>{division.name_en}</span>
              )}
            </div>
          </div>
          <XpBar xp={xp} level={level} />
        </div>
      </div>

      {/* ── ステータスカード ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        <StatCard label="CONSECUTIVE LOGIN" value={`${streak}d`}
          color="var(--color-success)"
          sub={streak >= 7 ? "WEEKLY BONUS" : `7日まで ${7 - streak % 7}日`} />
        <StatCard label="ANOMALY SCORE" value={`${anomaly}`}
          color={anomaly > 60 ? "var(--color-danger)" : anomaly > 30 ? "var(--color-warning)" : "var(--color-success)"}
          sub={anomaly > 60 ? "CRITICAL" : anomaly > 30 ? "ELEVATED" : "NOMINAL"} />
        <StatCard label="OBSERVER LOAD" value={`${observerLoad}%`}
          color="var(--color-primary)" sub="CAPACITY" />
        <StatCard label="DIVISION"
          value={division?.name_en.split(" ")[0] ?? "——"}
          color={division?.color ?? "var(--color-fg-dim)"}
          sub={division?.name ?? "未配属"} />
      </div>

      {/* ── インテルフィード ── */}
      <div className="card">
        <div className="hud-label" style={{
          marginBottom: 12, paddingBottom: 10,
          borderBottom: "1px solid var(--color-border)",
          color: "var(--color-primary)",
        }}><Icon name="dashboard" size={12} style={{ marginRight: 6 }} aria-hidden />LATEST INTELLIGENCE FEED</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {INTEL_FEED.map(item => (
            <div key={item.label} style={{ display: "flex", gap: 16, fontSize: 12 }}>
              <span style={{ color: "var(--color-fg-muted)", minWidth: 120, flexShrink: 0 }}>
                {item.label}
              </span>
              <span style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {level < 2 && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px dashed rgba(0,200,255,0.1)",
          }}>
            <span style={{ fontSize: 11, color: "var(--color-fg-muted)" }}>
              <Icon name="lock" size={12} style={{ marginRight: 4 }} aria-hidden />クリアランス LV2 以上の情報はロックされています。
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
