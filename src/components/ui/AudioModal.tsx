/*
 * AudioModal.tsx — [[AUD-XXX]] タグクリック時のモーダルプレイヤー
 * Updated: 2026-03-22
 *
 * 状態:
 *   CLEAR     — 通常再生 / トランスクリプト流出
 *   CORRUPTED — integrity < 100 / エラーログ混在
 *   STATIC    — voice_detected=0 / 信号解析ログのみ
 *   CLASSIFIED — クリアランス不足（通常はインラインタグで弾かれる）
 */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────────────────

export interface TranscriptLine {
  time:      string;
  text:      string;
  corrupted?: boolean;
}

export interface AudioModalData {
  id:             string;
  title:          string;
  filename:       string;
  duration_sec:   number;
  recorded_at:    string;
  recorded_by:    string;
  location_ref:   string | null;
  classification: string;
  clearance_req:  number;
  voice_detected: number;
  integrity:      number;
  gsi_value:      number | null;
  entity_ref:     string | null;
  transcript:     TranscriptLine[];
}

interface Props {
  data: AudioModalData;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// 状態判定
// ─────────────────────────────────────────────────────────────────────

type AudioState = "clear" | "corrupted" | "static" | "classified";

function getAudioState(data: AudioModalData): AudioState {
  if (data.classification === "classified") return "classified";
  if (data.voice_detected === 0)            return "static";
  if (data.integrity < 100)                 return "corrupted";
  return "clear";
}

const STATE_COLOR: Record<AudioState, string> = {
  clear:      "var(--color-primary, #00c8ff)",
  corrupted:  "var(--color-danger,  #ff6b3c)",
  static:     "var(--color-warning, #c8a040)",
  classified: "rgba(255,255,255,0.2)",
};

const STATE_BADGE: Record<AudioState, string> = {
  clear:      "CLEAR",
  corrupted:  "CORRUPTED",
  static:     "NO VOICE",
  classified: "CLASSIFIED",
};

// ─────────────────────────────────────────────────────────────────────
// 波形生成（IDベースの決定論的波形）
// ─────────────────────────────────────────────────────────────────────

function seededWave(id: string, n = 56): number[] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Array.from({ length: n }, (_, i) => {
    const v = Math.abs(Math.sin(h * (i + 1) * 0.37 + i)) * 26 + 5;
    return Math.round(v);
  });
}

function buildWaveHeights(id: string, state: AudioState, n = 56): number[] {
  if (state === "static")    return Array.from({ length: n }, (_, i) => 18 + Math.round(Math.abs(Math.sin(i * 2.3)) * 16));
  if (state === "corrupted") return seededWave(id, n).map((v, i) => i % 5 === 2 ? Math.min(36, v * 2) : i % 7 === 4 ? 3 : v);
  return seededWave(id, n);
}

// ─────────────────────────────────────────────────────────────────────
// ログ行生成
// ─────────────────────────────────────────────────────────────────────

interface LogLine { t: number; cls: ""|"key"|"err"|"warn"; txt: string; }

function buildLogLines(data: AudioModalData, state: AudioState): LogLine[] {
  const dur = data.duration_sec;

  if (state === "static") return [
    { t: 0,    cls: "",     txt: "> SIGNAL RECORD PLAYBACK" },
    { t: 0.5,  cls: "key",  txt: `  FILE     : ${data.filename}` },
    { t: 1.0,  cls: "key",  txt: `  TYPE     : GSI ANOMALY SPIKE / NO VOICE` },
    { t: 1.4,  cls: "key",  txt: `  GSI      : ${data.gsi_value ?? "??"}σ  /  DURATION: ${fmtTime(dur)}` },
    { t: 1.8,  cls: "",     txt: "──────────────────────────────────────" },
    { t: 2.1,  cls: "warn", txt: `  [00:00–${fmtTime(dur)}] BROADBAND EM NOISE` },
    { t: 2.4,  cls: "warn", txt: "  FREQ BAND : 12–18kHz anomaly range" },
    { t: 2.7,  cls: "warn", txt: "  AMPLITUDE : +22dB above baseline" },
    { t: 2.9,  cls: "",     txt: "  NO HUMAN VOCALIZATION DETECTED" },
    ...(data.entity_ref ? [{ t: 3.0, cls: "warn" as const, txt: `  PATTERN   : ${data.entity_ref} PROXIMITY SIGNATURE` }] : []),
    { t: 3.1,  cls: "",     txt: "──────────────────────────────────────" },
    { t: 3.2,  cls: "",     txt: "> END OF SIGNAL LOG" },
  ];

  if (state === "corrupted") {
    const lines: LogLine[] = [
      { t: 0,   cls: "",    txt: "> AUDIO PLAYBACK INIT" },
      { t: 0.8, cls: "err", txt: `  [ERR 0xA4] HEADER CORRUPTION DETECTED` },
      { t: 1.6, cls: "warn",txt: "  ATTEMPTING PARTIAL DECODE..." },
      { t: 2.6, cls: "key", txt: `  INTEGRITY: ${data.integrity}%  /  RECOVERED FRAMES: ${Math.floor(data.integrity * 0.6)}` },
      { t: 3.2, cls: "",    txt: "──────────────────────────────────────" },
    ];
    data.transcript.forEach((line, i) => {
      const t = 5 + (dur / data.transcript.length) * i * 0.7;
      const txt = line.corrupted
        ? `  [${line.time}]  「${line.text.replace(/./g, (c, i) => i % 3 === 0 ? "█" : c)}」`
        : `  [${line.time}]  「${line.text}」`;
      lines.push({ t, cls: "", txt });
      if (i % 3 === 2) lines.push({ t: t + 2, cls: "err", txt: `  [DECODE FAIL] FRAME DROPPED (×${3 + i})` });
    });
    lines.push({ t: dur - 2, cls: "",    txt: "──────────────────────────────────────" });
    lines.push({ t: dur - 0.5, cls: "warn", txt: "> PARTIAL DECODE COMPLETE. DATA UNRELIABLE." });
    return lines;
  }

  // CLEAR
  const lines: LogLine[] = [
    { t: 0,   cls: "",    txt: "> AUDIO PLAYBACK INIT" },
    { t: 0.8, cls: "key", txt: `  FILE      : ${data.filename}` },
    { t: 1.4, cls: "key", txt: `  AGENT     : ${data.recorded_by}  /  DATE: ${data.recorded_at}` },
    { t: 2.0, cls: "key", txt: `  INTEGRITY : 100%   /  CLR: LV${data.clearance_req}` },
    { t: 2.8, cls: "",    txt: "──────────────────────────────────────" },
  ];
  data.transcript.forEach((line, i) => {
    const t = 4 + (dur / Math.max(data.transcript.length, 1)) * i * 0.85;
    lines.push({ t, cls: "", txt: `  [${line.time}]  「${line.text}」` });
  });
  lines.push({ t: dur - 1.5, cls: "", txt: "──────────────────────────────────────" });
  lines.push({ t: dur - 0.3, cls: "", txt: "> PLAYBACK COMPLETE" });
  return lines;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────
// AudioModal
// ─────────────────────────────────────────────────────────────────────

export function AudioModal({ data, onClose }: Props) {
  const state    = getAudioState(data);
  const color    = STATE_COLOR[state];
  const heights  = buildWaveHeights(data.id, state);
  const logLines = buildLogLines(data, state);

  const [playing,  setPlaying]  = useState(false);
  const [elapsed,  setElapsed]  = useState(0);
  const [logShown, setLogShown] = useState<{ cls: string; txt: string }[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const rafRef      = useRef<number | null>(null);
  const lastTsRef   = useRef<number>(0);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logInnerRef = useRef<HTMLDivElement>(null);

  const dur = data.duration_sec || 1;

  // ── 後始末 ──────────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // ── ログスケジューリング ─────────────────────────────────────────────
  const scheduleLog = useCallback((fromElapsed: number) => {
    clearTimers();
    setLogShown([]);
    setActiveIdx(null);

    const pending = logLines.filter(l => l.t > fromElapsed);
    pending.forEach(line => {
      const id = setTimeout(() => {
        setLogShown(prev => {
          const next = [...prev, { cls: line.cls, txt: line.txt }];
          return next.slice(-10);
        });
        setActiveIdx(i => (i === null ? 0 : i + 1));
      }, (line.t - fromElapsed) * 1000);
      timersRef.current.push(id);
    });
  }, [logLines, clearTimers]);

  // ── RAF ティック ────────────────────────────────────────────────────
  const tick = useCallback((now: number) => {
    const dt = (now - lastTsRef.current) / 1000;
    lastTsRef.current = now;
    setElapsed(prev => {
      const next = Math.min(prev + dt, dur);
      if (next >= dur) { setPlaying(false); return dur; }
      return next;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, [dur]);

  // ── 再生 / 停止 ──────────────────────────────────────────────────────
  const startPlay = useCallback((from: number) => {
    setPlaying(true);
    lastTsRef.current = performance.now();
    scheduleLog(from);
    rafRef.current = requestAnimationFrame(tick);
  }, [scheduleLog, tick]);

  const stopPlay = useCallback(() => {
    setPlaying(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    clearTimers();
  }, [clearTimers]);

  const togglePlay = () => {
    if (playing) { stopPlay(); return; }
    const from = elapsed >= dur ? 0 : elapsed;
    if (from === 0) setElapsed(0);
    startPlay(from);
  };

  // ── シーク ─────────────────────────────────────────────────────────
  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newT = pct * dur;
    stopPlay();
    setElapsed(newT);
    if (playing) startPlay(newT);
  };

  // ── クリーンアップ ────────────────────────────────────────────────
  useEffect(() => () => { stopPlay(); }, [stopPlay]);

  // ── ログスクロール ────────────────────────────────────────────────
  useEffect(() => {
    if (logInnerRef.current) logInnerRef.current.scrollTop = logInnerRef.current.scrollHeight;
  }, [logShown]);

  const pct = elapsed / dur;

  const logLineColor = (cls: string) => {
    if (cls === "key")  return color;
    if (cls === "err")  return "var(--color-danger, #ff6b3c)";
    if (cls === "warn") return "var(--color-warning, #c8a040)";
    return "rgba(255,255,255,0.7)";
  };

  const activeBg = state === "corrupted" ? "rgba(255,107,60,.08)"
                 : state === "static"    ? "rgba(200,160,60,.08)"
                 : "rgba(0,200,255,.08)";
  const activeBorder = state === "corrupted" ? "rgba(255,107,60,.3)"
                     : state === "static"    ? "rgba(200,160,60,.3)"
                     : "rgba(0,200,255,.3)";

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(560px, 94vw)", maxHeight: "85vh",
        background: "rgba(8,10,14,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 4,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* ── ヘッダー ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px 10px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", flex: 1, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.filename}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 14, padding: "2px 4px" }}>✕</span>
        </div>

        {/* ── メタ ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "6px 16px",
          padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
          fontFamily: "var(--font-mono,monospace)",
        }}>
          {[
            ["DATE",     data.recorded_at],
            ["AGENT",    data.recorded_by],
            ...(data.location_ref ? [["LOCATION", data.location_ref]] : []),
            ["DURATION", fmtTime(data.duration_sec)],
            ["CLR",      `LV${data.clearance_req}`],
            ...(data.integrity < 100 ? [["INTEGRITY", `${data.integrity}%`]] : []),
            ...(data.gsi_value != null ? [["GSI", `${data.gsi_value}σ`]] : []),
            ...(data.entity_ref ? [["ENTITY", data.entity_ref]] : []),
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>{k}</span>
              <span style={{ fontSize: 10, letterSpacing: "0.04em", color }}>{v}</span>
            </div>
          ))}
        </div>

        {/* ── ログエリア ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "10px 14px", minHeight: 160, position: "relative" }}>
          <div
            ref={logInnerRef}
            style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 0 }}
          >
            {logShown.map((line, i) => {
              const isActive = i === logShown.length - 1;
              return (
                <div key={i} style={{
                  fontFamily: "var(--font-mono,monospace)",
                  fontSize: 10, lineHeight: 1.65, whiteSpace: "pre",
                  letterSpacing: "0.03em",
                  color: logLineColor(line.cls),
                  opacity: isActive ? 1 : 0.28,
                  padding: isActive ? "2px 6px" : "1px 0",
                  margin: isActive ? "1px -6px" : undefined,
                  borderRadius: isActive ? 2 : undefined,
                  background: isActive ? activeBg : undefined,
                  borderLeft: isActive ? `2px solid ${activeBorder}` : undefined,
                  transition: "opacity 0.3s",
                }}>
                  {line.txt}
                </div>
              );
            })}
          </div>
          {/* フェードアウト下部 */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
            background: "linear-gradient(to top, rgba(8,10,14,1) 0%, rgba(8,10,14,0) 100%)",
            pointerEvents: "none", zIndex: 2,
          }} />
        </div>

        {/* ── プレイヤー ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 14px 14px", flexShrink: 0,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* 波形スクラバー */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: 9, color: "rgba(255,255,255,0.28)", minWidth: 34 }}>
              {fmtTime(elapsed)}
            </span>
            <div
              style={{ flex: 1, position: "relative", height: 36, cursor: "pointer" }}
              onClick={scrub}
            >
              {/* バー */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.5px", height: "100%" }}>
                {heights.map((h, i) => (
                  <div key={i} style={{
                    width: 2.5, height: h, borderRadius: 1.5, flexShrink: 0,
                    background: (i / heights.length) < pct ? color : "rgba(255,255,255,0.1)",
                    transition: "background 0.1s",
                    ...(state === "static" ? { animation: `audioNoise ${0.15 + (i % 5) * 0.02}s step-end infinite`, animationDelay: `${i * 0.008}s` } : {}),
                  }} />
                ))}
              </div>
              {/* マスク */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(8,10,14,0.58)",
                left: `${pct * 100}%`,
                pointerEvents: "none",
              }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: 9, color: "rgba(255,255,255,0.28)", minWidth: 34, textAlign: "right" }}>
              {fmtTime(data.duration_sec)}
            </span>
          </div>

          {/* コントロール */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* 再生ボタン（赤） */}
            <button
              onClick={togglePlay}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: playing ? "#c22020" : "#e83535",
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 12, color: "#fff", flexShrink: 0,
                boxShadow: playing ? "0 0 14px rgba(200,30,30,0.6)" : "0 0 12px rgba(232,53,53,0.5)",
                transition: "background 0.15s, box-shadow 0.15s",
                outline: "none",
              }}
            >
              {playing ? "■" : "▶"}
            </button>

            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", flex: 1 }}>
              AUDIO RECORD
            </span>

            {/* バッジ */}
            <span style={{
              fontFamily: "var(--font-mono,monospace)",
              fontSize: 8, letterSpacing: "0.1em",
              padding: "2px 7px", borderRadius: 2,
              border: `1px solid ${color}55`,
              background: `${color}14`,
              color,
              flexShrink: 0,
            }}>
              {STATE_BADGE[state]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
