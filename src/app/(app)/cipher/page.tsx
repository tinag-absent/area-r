/*
 * cipher/page.tsx — 暗号解読ページ
 * Updated: 2026-03-19 04:25 JST — cipher_textにNarehate（なれはて体）を適用・グロー演出追加
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useBoundStore } from "@/store";

interface Puzzle {
  id:           string;
  slug:         string;
  title:        string;
  cipher_text:  string;
  hint:         string | null;
  xp_reward:    number;
  clearance_req: number;
  solved:       boolean;
}

// ── グリッチアニメーション文字 ─────────────────────────────────────

const GLITCH = "◈◆◎⬡◐◉▣◫░▒▓█▀▄■□▪▫ΨΩΛΞΠΣΦω";

function useGlitch(active: boolean) {
  const [chars, setChars] = useState("");
  useEffect(() => {
    if (!active) { setChars(""); return; }
    const iv = setInterval(() => {
      const len = Math.floor(Math.random() * 12) + 4;
      setChars(Array.from({ length: len }, () => GLITCH[Math.floor(Math.random() * GLITCH.length)]).join(""));
    }, 80);
    return () => clearInterval(iv);
  }, [active]);
  return chars;
}

// ── カード ────────────────────────────────────────────────────────────

function PuzzleCard({ puzzle, onSolve }: { puzzle: Puzzle; onSolve: (slug: string) => void }) {
  const [open,    setOpen]    = useState(false);
  const [answer,  setAnswer]  = useState("");
  const [result,  setResult]  = useState<{ correct: boolean; message: string; xp?: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const glitch = useGlitch(sending);

  const addToast = useBoundStore(s => s.addToast);

  async function handleSubmit() {
    if (!answer.trim() || sending) return;
    setSending(true); setResult(null);
    try {
      const res = await fetch("/api/cipher", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ slug: puzzle.slug, answer }),
      });
      const data = await res.json();
      setResult({ correct: data.correct, message: data.message, xp: data.xpGranted });
      if (data.correct && data.firstSolve) {
        addToast({ type: "xp", title: `+${data.xpGranted} XP`, body: "暗号解読完了" });
        onSolve(puzzle.slug);
      }
    } catch {
      setResult({ correct: false, message: "通信エラーが発生しました" });
    } finally {
      setSending(false);
    }
  }

  const borderColor = puzzle.solved
    ? "rgba(0,230,118,0.25)"
    : open
    ? "rgba(0,200,255,0.3)"
    : "rgba(0,200,255,0.1)";

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${puzzle.solved ? "var(--color-success)" : "var(--color-primary)"}`,
      borderRadius: 2,
      background: "var(--color-bg-surface)",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* ヘッダー */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", textAlign: "left", padding: "14px 16px",
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{
            fontSize: 16, flexShrink: 0,
            color: puzzle.solved ? "var(--color-success)" : "var(--color-primary)",
          }}>
            {puzzle.solved ? "◆" : "◇"}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: "bold",
              color: puzzle.solved ? "var(--color-success)" : "var(--color-foreground)",
              fontFamily: "var(--font-mono)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}>
              {puzzle.title}
            </div>
            <div className="hud-label" style={{ marginTop: 2 }}>
              LV{puzzle.clearance_req}+ · +{puzzle.xp_reward} XP
              {puzzle.solved && <span style={{ color: "var(--color-success)", marginLeft: 8 }}>SOLVED</span>}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: "var(--color-fg-muted)", flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* 展開パネル */}
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,200,255,0.08)" }}>
          {/* 暗号文 */}
          <div style={{
            margin: "14px 0 12px",
            padding: "14px 16px",
            background: "#030a12",
            border: "1px solid rgba(0,200,255,0.12)",
            borderRadius: 2,
          }}>
            <div className="hud-label" style={{ marginBottom: 8, color: "var(--color-primary)" }}>
              CIPHER TEXT
            </div>
            <pre style={{
              margin: 0, fontSize: 15,
              color: "var(--color-primary)",
              fontFamily: "var(--font-cipher)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              whiteSpace: "pre-wrap", wordBreak: "break-all",
              lineHeight: 2, letterSpacing: "0.18em",
              textShadow: "0 0 10px rgba(0,200,255,0.35)",
            }}>
              {puzzle.cipher_text}
            </pre>
          </div>

          {/* ヒント */}
          {puzzle.hint && (
            <div style={{ marginBottom: 12 }}>
              {!showHint ? (
                <button onClick={() => setShowHint(true)}
                  style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 2, cursor: "pointer",
                    background: "transparent", border: "1px dashed rgba(255,180,60,0.3)",
                    color: "var(--color-warning)", fontFamily: "var(--font-mono)",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}>
                  ヒントを表示（解読困難な場合）
                </button>
              ) : (
                <div style={{
                  padding: "8px 12px", borderRadius: 2, fontSize: 12,
                  background: "rgba(255,180,60,0.05)",
                  border: "1px solid rgba(255,180,60,0.2)",
                  color: "var(--color-warning)",
                  fontFamily: "var(--font-mono)",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}>
                  HINT: {puzzle.hint}
                </div>
              )}
            </div>
          )}

          {/* 解答入力 */}
          {!puzzle.solved ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="解答を入力..."
                style={{
                  flex: 1, fontSize: 12, padding: "8px 10px", borderRadius: 2,
                  background: "var(--color-bg)",
                  border: result
                    ? `1px solid ${result.correct ? "rgba(0,230,118,0.4)" : "rgba(255,68,68,0.4)"}`
                    : "1px solid rgba(0,200,255,0.2)",
                  color: "var(--color-foreground)",
                  fontFamily: "var(--font-mono)", outline: "none",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={sending || !answer.trim()}
                style={{
                  padding: "8px 16px", borderRadius: 2, cursor: "pointer", fontSize: 11,
                  background: "rgba(0,200,255,0.08)",
                  border: "1px solid rgba(0,200,255,0.3)",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-mono)",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  opacity: sending || !answer.trim() ? 0.5 : 1,
                  minWidth: 80,
                }}>
                {sending ? glitch || "解読中" : "DECODE"}
              </button>
            </div>
          ) : (
            <div style={{
              padding: "10px 12px", borderRadius: 2, fontSize: 12,
              background: "rgba(0,230,118,0.06)",
              border: "1px solid rgba(0,230,118,0.25)",
              color: "var(--color-success)",
              fontFamily: "var(--font-mono)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}>
              ✓ この暗号は解読済みです
            </div>
          )}

          {/* 結果 */}
          {result && (
            <div style={{
              marginTop: 8, padding: "8px 12px", borderRadius: 2, fontSize: 12,
              background: result.correct ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
              border: `1px solid ${result.correct ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
              color: result.correct ? "var(--color-success)" : "var(--color-danger)",
              fontFamily: "var(--font-mono)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}>
              {result.correct ? "✓" : "✕"} {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── メイン ────────────────────────────────────────────────────────────

export default function CipherPage() {
  const userLevel = useBoundStore(s => s.user?.level ?? 0);
  const [puzzles,  setPuzzles]  = useState<Puzzle[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cipher", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setPuzzles(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function markSolved(slug: string) {
    setPuzzles(prev => prev.map(p => p.slug === slug ? { ...p, solved: true } : p));
  }

  const solved = puzzles.filter(p => p.solved).length;

  if (userLevel < 2) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8">
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔒</div>
          <div className="hud-label" style={{ color: "var(--color-primary)" }}>CLEARANCE LV2 REQUIRED</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[860px] mx-auto">
      <div style={{ marginBottom: 24 }}>
        <div className="hud-label" style={{ marginBottom: 4, color: "var(--color-primary)" }}>
          CIPHER DECODER — CLASSIFIED DIVISION
        </div>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: "bold", letterSpacing: "0.04em",
          color: "var(--color-foreground)", marginBottom: 8,
        }}>
          暗号解読
        </h1>
        <div className="hud-label">
          {loading ? "読み込み中..." : `${solved} / ${puzzles.length} 件解読済`}
        </div>
      </div>

      {/* 進捗バー */}
      {!loading && puzzles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 3, background: "rgba(0,200,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${(solved / puzzles.length) * 100}%`,
              background: solved === puzzles.length ? "var(--color-success)" : "var(--color-primary)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="hud-label text-center" style={{ padding: 48, color: "var(--color-fg-muted)" }}>
          暗号データを取得中...
        </div>
      ) : puzzles.length === 0 ? (
        <div style={{
          padding: "40px 24px", textAlign: "center",
          border: "1px dashed rgba(0,200,255,0.12)", borderRadius: 2,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◇</div>
          <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
            現在利用可能な暗号データはありません
          </div>
          <div style={{ fontSize: 11, marginTop: 6, color: "var(--color-fg-muted)" }}>
            クリアランスレベルの上昇により新たな暗号が解放される場合があります
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {puzzles.map(p => (
            <PuzzleCard key={p.id} puzzle={p} onSolve={markSolved} />
          ))}
        </div>
      )}
    </div>
  );
}
