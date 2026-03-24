/*
 * incidents/[incidentId]/page.tsx — インシデント詳細ページ
 * Updated: 2026-03-19 04:25 JST — タイトルにIgyouMincho、説明文にIseminを適用
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import Link from "next/link";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ── 型定義 ────────────────────────────────────────────────────────────

interface Incident {
  id: string; severity: string; status: string; name: string;
  lon: number; lat: number; location: string; entity: string;
  gsi: number; division: string; desc: string; time: string;
  cityCode?: string; cityName?: string;
}

// ── 定数 ─────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  critical: "var(--color-danger)",
  warning:  "var(--color-warning)",
  safe:     "var(--color-success)",
};
const SEV_LABEL: Record<string, string> = {
  critical: "TYPE-Ⅰ 緊急",
  warning:  "TYPE-Ⅱ 警戒",
  safe:     "TYPE-Ⅲ 安全",
};
const SEV_BG: Record<string, string> = {
  critical: "rgba(255,68,68,0.05)",
  warning:  "rgba(255,180,60,0.05)",
  safe:     "rgba(0,230,118,0.05)",
};
const GLITCH = "◈◆◎⬡◐◉▣░▒▓ΨΩΛ";

// ── GSI メーター ──────────────────────────────────────────────────────

function GsiMeter({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const pct   = Math.min(value / 15 * 100, 100);
  const color = value >= 10 ? "var(--color-danger)"
               : value >= 5  ? "var(--color-warning)"
               : "var(--color-success)";
  const label = value >= 10 ? "CRITICAL" : value >= 5 ? "ELEVATED" : "NOMINAL";

  useEffect(() => {
    let v = 0;
    const iv = setInterval(() => {
      v = Math.min(v + value / 30, value);
      setDisplayed(v);
      if (v >= value) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [value]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="hud-label">GSI — 次元安定指数</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 10, padding: "2px 6px", borderRadius: 2, fontFamily: "var(--font-mono)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            background: `${color}18`, border: `1px solid ${color}55`, color,
            letterSpacing: "0.08em",
          }}>{label}</span>
          <span style={{ fontSize: 20, fontWeight: "bold", color, fontFamily: "var(--font-mono)" }}>
            {displayed.toFixed(1)}
          </span>
        </div>
      </div>
      {/* セグメントバー */}
      <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
        {Array.from({ length: 15 }, (_, i) => {
          const segPct = (i + 1) / 15 * 100;
          const filled = segPct <= pct;
          const segColor = i >= 10 ? "var(--color-danger)"
                         : i >= 5  ? "var(--color-warning)"
                         : "var(--color-success)";
          return (
            <div key={i} style={{
              flex: 1, height: 10, borderRadius: 1,
              background: filled ? segColor : "rgba(255,255,255,0.05)",
              boxShadow: filled ? `0 0 4px ${segColor}` : "none",
              transition: "background 0.05s",
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="hud-label" style={{ color: "var(--color-success)" }}>0 — NOMINAL</span>
        <span className="hud-label" style={{ color: "var(--color-warning)" }}>5 — ELEVATED</span>
        <span className="hud-label" style={{ color: "var(--color-danger)" }}>10 — CRITICAL</span>
      </div>
    </div>
  );
}

// ── 観測ログ（タイピングアニメーション） ─────────────────────────────

function ObservationLog({ incident }: { incident: Incident }) {
  const color = SEV_COLOR[incident.severity] ?? "var(--color-primary)";
  const logs = [
    { tag: "INIT",     text: `インシデント検知: ${incident.id.toUpperCase()}`, color: "var(--color-fg-muted)" },
    { tag: "LOCATE",   text: `座標確認: ${incident.lat.toFixed(4)}, ${incident.lon.toFixed(4)}`, color: "var(--color-primary)" },
    { tag: "CLASSIFY", text: `分類: ${SEV_LABEL[incident.severity] ?? incident.severity} — ${incident.entity}`, color },
    { tag: "ASSIGN",   text: `担当部門アサイン: ${incident.division}`, color: "var(--color-primary)" },
    { tag: "STATUS",   text: `現在ステータス: ${incident.status}`, color: incident.status === "収束済み" ? "var(--color-success)" : color },
  ];

  const [visibleCount, setVisibleCount] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const logRef = useRef(0);

  useEffect(() => {
    logRef.current = 0;
    setVisibleCount(0);
    setTypedChars(0);

    function revealNext() {
      if (logRef.current >= logs.length) return;
      const delay = logRef.current === 0 ? 200 : 500 + Math.random() * 400;
      setTimeout(() => {
        logRef.current++;
        setVisibleCount(logRef.current);
        revealNext();
      }, delay);
    }
    revealNext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident.id]);

  return (
    <div style={{
      background: "#030a12", border: "1px solid rgba(0,200,255,0.1)",
      borderRadius: 2, padding: "14px 16px",
    }}>
      <div className="hud-label" style={{ marginBottom: 10, color: "var(--color-primary)" }}>
        <><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />OBSERVATION LOG — {incident.time}</>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {logs.slice(0, visibleCount).map((log, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, fontSize: 11,
            fontFamily: "var(--font-mono)", lineHeight: 1.6,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            animation: "fadeIn 0.2s ease both",
          }}>
            <span style={{
              color: "rgba(0,200,255,0.4)", minWidth: 72, flexShrink: 0,
            }}>[{log.tag}]</span>
            <span style={{ color: log.color }}>{log.text}</span>
          </div>
        ))}
        {visibleCount < logs.length && (
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>
            <span style={{ opacity: 0.5 }}>{'>'}</span>
            <span style={{ animation: "blink 1s step-end infinite" }}>_</span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(2px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}

// ── 関連インシデント ──────────────────────────────────────────────────

function RelatedIncidents({ current, all }: { current: Incident; all: Incident[] }) {
  // 同じ severiy か同じ entity キーワードを含む他インシデント
  const related = all
    .filter(i => i.id !== current.id && (
      i.severity === current.severity ||
      i.entity.split("（")[0] === current.entity.split("（")[0]
    ))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div style={{
      background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)",
      borderRadius: 2, padding: "14px 16px",
    }}>
      <div className="hud-label" style={{ marginBottom: 10, color: "var(--color-primary)" }}>
        <><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />関連インシデント</>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {related.map(r => {
          const col = SEV_COLOR[r.severity] ?? "var(--color-primary)";
          return (
            <Link key={r.id} href={`/incidents/${r.id}`}
              style={{ textDecoration: "none", display: "block" }}>
              <div style={{
                padding: "8px 10px", borderRadius: 2,
                border: `1px solid ${col}22`,
                background: SEV_BG[r.severity] ?? "transparent",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${col}55`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${col}22`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                    {r.id.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 10, padding: "1px 5px", borderRadius: 2,
                    background: `${col}18`, border: `1px solid ${col}44`,
                    color: col, fontFamily: "var(--font-mono)",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}>{SEV_LABEL[r.severity] ?? r.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-foreground)", fontWeight: "bold" }}>
                  {r.name}
                </div>
                <div className="hud-label" style={{ marginTop: 2 }}>{r.location} — GSI {r.gsi.toFixed(1)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const params  = useParams<{ incidentId: string }>();
  const router  = useRouter();
  const [incident, setIncident]   = useState<Incident | null>(null);
  const [allInc,   setAllInc]     = useState<Incident[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState("");
  const [glitch,   setGlitch]     = useState("");
  const [scanDone, setScanDone]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/incidents", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error();
      const list: Incident[] = await res.json();
      setAllInc(list);
      const found = list.find(i => i.id === params.incidentId);
      if (!found) { setError("インシデントが見つかりません"); return; }
      setIncident(found);
    } catch {
      setError("データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [params.incidentId]);

  useEffect(() => { load(); }, [load]);

  // グリッチアニメーション（読み込み中）
  useEffect(() => {
    if (!loading) { setScanDone(true); return; }
    const iv = setInterval(() => {
      const len = Math.floor(Math.random() * 14) + 6;
      setGlitch(Array.from({ length: len }, () => GLITCH[Math.floor(Math.random() * GLITCH.length)]).join(""));
    }, 80);
    return () => clearInterval(iv);
  }, [loading]);

  // ── ローディング ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: "48px 32px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="hud-label" style={{ color: "var(--color-danger)", marginBottom: 6 }}>
          SCANNING DIMENSIONAL DATABASE...
        </div>
        <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--color-primary)", letterSpacing: "0.08em" }}>
          {glitch}
        </div>
      </div>
      <LoadingStatus />
    </div>
  );

  // ── エラー ─────────────────────────────────────────────────────────
  if (error || !incident) return (
    <div style={{ padding: "32px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{
        padding: 24, textAlign: "center", borderRadius: 2,
        background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)",
      }}>
        <div className="hud-label" style={{ color: "var(--color-danger)", marginBottom: 8 }}>
          RECORD NOT FOUND
        </div>
        <p style={{ fontSize: 13, marginBottom: 16, color: "var(--color-fg-dim)" }}>{error}</p>
        <button onClick={() => router.push("/map")}
          style={{
            fontSize: 12, padding: "8px 16px", borderRadius: 2, cursor: "pointer",
            border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", background: "transparent",
          }}>← マップに戻る</button>
      </div>
    </div>
  );

  const col     = SEV_COLOR[incident.severity]  ?? "var(--color-primary)";
  const sevLabel = SEV_LABEL[incident.severity] ?? incident.severity;
  const isClosed = incident.status === "収束済み";

  return (
    <div className="animate-[fadeIn_0.4s_ease_both]"
      style={{ padding: "28px 20px", maxWidth: 900, margin: "0 auto" }}>

      {/* パンくず */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
        fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-fg-muted)",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}>
        <Link href="/map" style={{ color: "var(--color-fg-muted)", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"}>
          海蝕マップ
        </Link>
        <span>›</span>
        <span style={{ color: "var(--color-fg-dim)" }}>{incident.id.toUpperCase()}</span>
      </div>

      {/* ヘッダーカード */}
      <div style={{
        padding: "18px 20px", borderRadius: 2, marginBottom: 16,
        background: isClosed ? "rgba(0,230,118,0.03)" : SEV_BG[incident.severity] ?? "var(--color-bg-surface)",
        border: `1px solid ${col}44`,
        borderLeft: `4px solid ${col}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 2, fontFamily: "var(--font-mono)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              background: `${col}18`, border: `1px solid ${col}55`, color: col, letterSpacing: "0.1em",
            }}>{sevLabel}</span>
            <span style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 2, fontFamily: "var(--font-mono)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              background: isClosed ? "rgba(0,230,118,0.1)" : "rgba(0,200,255,0.08)",
              border: isClosed ? "1px solid rgba(0,230,118,0.3)" : "1px solid rgba(0,200,255,0.2)",
              color: isClosed ? "var(--color-success)" : "var(--color-primary)",
            }}>{incident.status}</span>
            <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
              {incident.id.toUpperCase()}
            </span>
          </div>
          <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
            {incident.time}
          </span>
        </div>
        <h1 style={{
          margin: "0 0 8px", fontSize: 20, fontWeight: "bold", letterSpacing: "0.05em",
          color: "var(--color-foreground)",
          fontFamily: "var(--font-display)",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}>
          {incident.name}
        </h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.85, color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
          {incident.desc}
        </p>
      </div>

      {/* 2カラムレイアウト */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* GSIメーター */}
        <div style={{
          padding: "16px 18px", borderRadius: 2,
          background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.1)",
          gridColumn: "1 / -1",
        }}>
          <GsiMeter value={incident.gsi} />
        </div>

        {/* 詳細メタ */}
        {[
          { label: "発生地点",    value: incident.location },
          { label: "関連実体",    value: incident.entity },
          { label: "担当部門",    value: incident.division },
          { label: "市区町村",    value: incident.cityName ?? "—" },
          { label: "緯度 / 経度", value: `${incident.lat.toFixed(6)} / ${incident.lon.toFixed(6)}` },
          { label: "GSI",         value: `${incident.gsi.toFixed(1)} σ` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            padding: "12px 14px", borderRadius: 2,
            background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.07)",
          }}>
            <div className="hud-label" style={{ marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* 観測ログ */}
      <div style={{ marginBottom: 16 }}>
        <ObservationLog incident={incident} />
      </div>

      {/* 関連インシデント */}
      <div style={{ marginBottom: 20 }}>
        <RelatedIncidents current={incident} all={allInc} />
      </div>

      {/* ナビゲーション */}
      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/map"
          style={{
            fontSize: 12, padding: "8px 16px", borderRadius: 2, textDecoration: "none",
            border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)",
            fontFamily: "var(--font-mono)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}>
          ← マップへ戻る
        </Link>
        <Link href="/database/entities"
          style={{
            fontSize: 12, padding: "8px 16px", borderRadius: 2, textDecoration: "none",
            border: "1px solid rgba(0,200,255,0.15)", color: "var(--color-fg-muted)",
            fontFamily: "var(--font-mono)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}>
          実体データベース →
        </Link>
      </div>
    </div>
  );
}
