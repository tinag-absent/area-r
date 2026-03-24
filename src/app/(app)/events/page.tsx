"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon, NavIcon } from "@/components/ui/Icon";

interface ARGEvent {
  id:          string;
  title:       string;
  description: string;
  triggerAt:   string;
  endAt:       string | null;
  status:      "scheduled" | "published";
  firedAt:     string | null;
  eventType:   string;
}

const TYPE_COLOR: Record<string, string> = {
  mission:      "var(--color-success)",
  story:        "#ce93d8",
  alert:        "var(--color-danger)",
  maintenance:  "var(--color-warning)",
  event:        "var(--color-primary)",
};

const TYPE_LABEL: Record<string, string> = {
  mission:     "MISSION",
  story:       "STORY",
  alert:       "ALERT",
  maintenance: "SYSTEM",
  event:       "EVENT",
};

function Countdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(targetIso.replace(" ", "T") + (targetIso.includes("T") ? "" : "Z")).getTime() - Date.now();
      if (diff <= 0) { setRemaining("ACTIVE"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setRemaining(`${d}d ${h}h ${m}m`);
      else if (h > 0) setRemaining(`${h}h ${m}m ${s}s`);
      else setRemaining(`${m}m ${s}s`);
    }
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [targetIso]);

  const isActive = remaining === "ACTIVE";
  return (
    <span style={{
      fontSize: 13, fontFamily: "var(--font-mono)",
      color: isActive ? "var(--color-success)" : "var(--color-warning)",
    }}>
      {isActive ? "ACTIVE" : `◷ ${remaining}`}
    </span>
  );
}

function EventCard({ ev }: { ev: ARGEvent }) {
  const color    = TYPE_COLOR[ev.eventType] ?? "var(--color-primary)";
  const label    = TYPE_LABEL[ev.eventType] ?? "EVENT";
  const isLive   = ev.status === "published" && !!ev.firedAt;

  const fmtTime = (raw: string) => new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"))
    .toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      border: `1px solid ${isLive ? color + "55" : "rgba(0,200,255,0.12)"}`,
      borderLeft: `3px solid ${isLive ? color : "rgba(0,200,255,0.3)"}`,
      borderRadius: 2,
      background: isLive ? `${color}06` : "var(--color-bg-surface)",
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ライブ時のパルス */}
      {isLive && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 6, height: 6, borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: "pulse 2s infinite",
        }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 2, fontFamily: "var(--font-mono)",
            background: `${color}18`, border: `1px solid ${color}55`, color,
            letterSpacing: "0.08em",
          }}>{label}</span>
          {isLive && (
            <span style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 2, fontFamily: "var(--font-mono)",
              background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
              color: "var(--color-success)", letterSpacing: "0.08em",
            }}>LIVE</span>
          )}
        </div>
        <Countdown targetIso={ev.firedAt ?? ev.triggerAt} />
      </div>

      <h3 style={{
        margin: "0 0 8px", fontSize: 15, fontWeight: "bold",
        color: "var(--color-foreground)", letterSpacing: "0.03em",
      }}>
        {ev.title}
      </h3>

      {ev.description && (
        <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.7, color: "var(--color-fg-dim)" }}>
          {ev.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span className="hud-label">
          開始: {fmtTime(ev.firedAt ?? ev.triggerAt)}
        </span>
        {ev.endAt && (
          <span className="hud-label">
            終了: {fmtTime(ev.endAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events,  setEvents]  = useState<ARGEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const live      = events.filter(e => e.status === "published" && e.firedAt);
  const upcoming  = events.filter(e => !live.find(l => l.id === e.id));

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[860px] mx-auto">
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <div style={{ marginBottom: 24 }}>
        <div className="hud-label" style={{ marginBottom: 4, color: "var(--color-primary)" }}>
          LIVE OPS — KAISHOKU AGENCY
        </div>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: "bold", letterSpacing: "0.04em",
          color: "var(--color-foreground)", marginBottom: 8,
        }}>
          期間限定イベント
        </h1>
        <div className="hud-label">
          {loading ? "取得中..." : `${live.length} 件進行中 / ${upcoming.length} 件予定`}
        </div>
      </div>

      {loading ? (
        <div className="hud-label text-center" style={{ padding: 48, color: "var(--color-fg-muted)" }}>
          イベントデータを取得中...
        </div>
      ) : events.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          border: "1px dashed rgba(0,200,255,0.1)", borderRadius: 2,
        }}>
          <div style={{ marginBottom: 12, opacity: 0.3 }}><Icon name="event" size={32} aria-hidden /></div>
          <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
            現在予定されているイベントはありません
          </div>
          <div style={{ fontSize: 11, marginTop: 6, color: "var(--color-fg-muted)" }}>
            機関からのイベント通知を待機してください
          </div>
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div className="hud-label" style={{ marginBottom: 10, color: "var(--color-success)" }}>
                進行中
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {live.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <div className="hud-label" style={{ marginBottom: 10, color: "var(--color-fg-muted)" }}>
                ◷ 予定
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
