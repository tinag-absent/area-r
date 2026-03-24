/*
 * classified/ClassifiedClient.tsx — 機密文書ページ
 * Updated: 2026-03-19 04:25 JST — 「蒼海計画」タイトルにIgyouMincho、全本文段落にIseminを適用
 */
"use client";

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────
// 蒼海計画 認証アニメーション
// ─────────────────────────────────────────────────────────────────────

const AUTH_STEPS = [
  { id: "init",    label: "SEABREAK PROTOCOL — INITIALIZING",     duration: 600 },
  { id: "scan",    label: "RETINAL SCAN ............... COMPLETE", duration: 900 },
  { id: "cipher",  label: "DECRYPT KEY ◈◈◈◈◈◈◈◈◈◈◈◈◈◈◈ VERIFIED", duration: 1100 },
  { id: "sync",    label: "TEMPORAL SYNC .............. ALIGNED",  duration: 800 },
  { id: "breach",  label: "DIMENSIONAL LOCK ........... BYPASSED", duration: 1000 },
  { id: "granted", label: "ACCESS GRANTED — 蒼海計画 UNLOCKED",    duration: 0 },
];

function AuthAnimation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep]       = useState(0);
  const [chars, setChars]     = useState("");
  const [glitch, setGlitch]   = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  // グリッチエフェクト用のランダム文字
  const GLITCH_CHARS = "◈◆◎⬡◐◉▣◫░▒▓█▀▄■□▪▫";

  useEffect(() => {
    let stepIdx  = 0;
    let progVal  = 0;
    let running  = true;
    let glitchTimer: ReturnType<typeof setInterval> | null = null;

    // プログレスバーを滑らかに動かす
    const progInterval = setInterval(() => {
      if (!running) return;
      progVal = Math.min(progVal + 1.2, 100);
      setProgress(progVal);
    }, 50);

    // ランダムグリッチ文字ストリーム
    glitchTimer = setInterval(() => {
      if (!running) return;
      const len  = Math.floor(Math.random() * 20) + 8;
      const rand = Array.from({ length: len }, () =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join("");
      setChars(rand);
      if (Math.random() > 0.7) setGlitch(true);
      setTimeout(() => setGlitch(false), 80);
    }, 120);

    // ステップを順番に進める
    function advance() {
      if (!running || stepIdx >= AUTH_STEPS.length - 1) return;
      stepIdx++;
      setStep(stepIdx);

      if (stepIdx === AUTH_STEPS.length - 1) {
        // 完了
        running = false;
        clearInterval(progInterval);
        clearInterval(glitchTimer!);
        setProgress(100);
        setTimeout(onComplete, 900);
      } else {
        timerRef.current = setTimeout(advance, AUTH_STEPS[stepIdx]!.duration);
      }
    }

    timerRef.current = setTimeout(advance, AUTH_STEPS[0]!.duration);

    return () => {
      running = false;
      clearInterval(progInterval);
      clearInterval(glitchTimer!);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  const current   = AUTH_STEPS[step]!;
  const isGranted = step === AUTH_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(2,5,8,0.97)" }}
      role="dialog"
      aria-modal="true"
      aria-label="蒼海計画 認証中"
    >
      {/* スキャンライン */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
        }}
      />

      {/* グリッチ水平線 */}
      {glitch && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: `${20 + Math.random() * 60}%`,
            left: 0, right: 0,
            height: "2px",
            background: "rgba(0,200,255,0.25)",
            mixBlendMode: "screen",
          }}
        />
      )}

      <div style={{ width: "min(480px, 90vw)", position: "relative", zIndex: 1 }}>

        {/* タイトルヘッダー */}
        <div className="text-center mb-8">
          <div
            className="text-[11px] tracking-[0.2em] mb-3"
            style={{ color: "rgba(255,68,68,0.8)" }}
          >
            ⚠ SEABREAK PROTOCOL — MAXIMUM SECURITY
          </div>
          <div
            className="text-[28px] font-bold tracking-[0.12em]"
            style={{
              color: isGranted ? "var(--color-danger)" : "var(--color-primary)",
              textShadow: isGranted
                ? "0 0 30px rgba(255,68,68,0.6), 0 0 60px rgba(255,68,68,0.3)"
                : "0 0 20px rgba(0,200,255,0.5), 0 0 40px rgba(0,200,255,0.25)",
              transition: "color 0.4s, text-shadow 0.4s",
              fontFamily: "var(--font-display)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              letterSpacing: "0.14em",
            }}
          >
            蒼海計画
          </div>
          <div
            className="text-[11px] mt-2 tracking-[0.1em]"
            style={{ color: "var(--color-fg-muted)" }}
          >
            PROJECT SEABREAK / OPERATION CODENAME
          </div>
        </div>

        {/* 認証パネル */}
        <div
          style={{
            background: "rgba(6,11,16,0.9)",
            border: `1px solid ${isGranted ? "rgba(255,68,68,0.4)" : "rgba(0,200,255,0.25)"}`,
            borderRadius: "2px",
            padding: "24px",
            transition: "border-color 0.4s",
            boxShadow: isGranted
              ? "0 0 40px rgba(255,68,68,0.1), inset 0 0 20px rgba(255,68,68,0.03)"
              : "0 0 40px rgba(0,200,255,0.08), inset 0 0 20px rgba(0,200,255,0.02)",
          }}
        >
          {/* ステップログ */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              fontSize: "11px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginBottom: "20px",
              minHeight: "120px",
            }}
          >
            {AUTH_STEPS.slice(0, step + 1).map((s, i) => {
              const isPast    = i < step;
              const isCurrent = i === step;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: isPast ? 0.5 : 1,
                    transition: "opacity 0.3s",
                  }}
                >
                  <span
                    style={{
                      color: isPast
                        ? "var(--color-success)"
                        : s.id === "granted"
                        ? "var(--color-danger)"
                        : "var(--color-primary)",
                      fontSize: "10px",
                      width: "12px",
                      flexShrink: 0,
                    }}
                  >
                    {isPast ? "✓" : isCurrent && !isGranted ? "▶" : "◆"}
                  </span>
                  <span
                    style={{
                      color: s.id === "granted"
                        ? "var(--color-danger)"
                        : isPast
                        ? "var(--color-fg-muted)"
                        : "var(--color-foreground)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {s.label}
                  </span>
                  {isCurrent && !isGranted && (
                    <span
                      aria-hidden="true"
                      style={{
                        color: "var(--color-fg-decorative)",
                        fontSize: "10px",
                        animation: "blink 0.8s step-end infinite",
                      }}
                    >
                      ▋
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ランダム文字ストリーム */}
          {!isGranted && (
            <div
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-mono)",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                fontSize: "10px",
                color: "var(--color-fg-decorative)",
                letterSpacing: "0.1em",
                marginBottom: "16px",
                height: "14px",
                overflow: "hidden",
              }}
            >
              {chars}
            </div>
          )}

          {/* プログレスバー */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
                fontSize: "9px",
                letterSpacing: "0.08em",
              }}
            >
              <span style={{ color: "var(--color-fg-muted)" }}>
                AUTH PROGRESS
              </span>
              <span
                style={{
                  color: isGranted ? "var(--color-danger)" : "var(--color-primary)",
                  fontWeight: "bold",
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div
              style={{
                height: "3px",
                background: "rgba(0,200,255,0.08)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: isGranted
                    ? "linear-gradient(90deg, var(--color-danger), rgba(255,68,68,0.5))"
                    : "linear-gradient(90deg, var(--color-primary), rgba(0,200,255,0.4))",
                  boxShadow: isGranted
                    ? "0 0 8px rgba(255,68,68,0.6)"
                    : "0 0 8px rgba(0,200,255,0.5)",
                  borderRadius: "2px",
                  transition: "width 0.1s linear, background 0.4s, box-shadow 0.4s",
                }}
              />
            </div>
          </div>

          {/* GRANTED時の追加メッセージ */}
          {isGranted && (
            <div
              className="mt-4 text-center"
              style={{
                fontSize: "11px",
                color: "rgba(255,68,68,0.7)",
                letterSpacing: "0.1em",
                animation: "fadeIn 0.5s ease both",
              }}
            >
              ⚠ 閲覧履歴は記録されます ⚠
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 蒼海計画 コンテンツ
// ─────────────────────────────────────────────────────────────────────

function SeabreakDocument() {
  const sections = [
    {
      id: "overview",
      icon: "◈",
      title: "計画概要",
      color: "var(--color-danger)",
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {[
              ["文書番号",   "KAI-SB-001"],
              ["分類",       "最高機密 / EYES ONLY"],
              ["策定年",     "2019年（詳細████）"],
              ["策定者",     "████（機関設立者）"],
              ["現在の状態", "第二段階移行中"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex gap-3 items-baseline py-1.5"
                style={{ borderBottom: "1px solid rgba(255,68,68,0.08)" }}
              >
                <span className="text-[11px] shrink-0 min-w-[100px]" style={{ color: "var(--color-fg-muted)" }}>
                  {label}
                </span>
                <span className="text-[12px]" style={{ color: "var(--color-foreground)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            蒼海計画（コードネーム：SEABREAK）は、海蝕現象が不可逆的な段階に達した場合に備えて策定された最終手段的対応計画である。「収束」ではなく「移行」を目的とし、現在の次元から別の安定した次元空間への人類の意識データ転送を目指す。
          </p>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            この計画の存在は機関内の最高機密に分類されており、一般エージェントには一切開示されていない。クリアランスLV5に到達したエージェントのみが参照を許可される。
          </p>
        </div>
      ),
    },
    {
      id: "background",
      icon: "◎",
      title: "計画策定の背景",
      color: "var(--color-warning)",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            2019年、機関の初代解析チームは海蝕の進行速度についての長期シミュレーションを完了した。その結果は、現在の対処戦略（収束・封印）では現象を根本的に止めることが不可能であることを示していた。
          </p>
          <div
            className="px-4 py-3 rounded-sm"
            style={{
              background: "rgba(255,180,60,0.05)",
              border: "1px solid rgba(255,180,60,0.2)",
              borderLeft: "3px solid rgba(255,180,60,0.6)",
            }}
          >
            <p className="text-[12px] leading-[1.9] m-0" style={{ color: "var(--color-warning)", fontFamily: "var(--font-ja)", fontStyle: "italic" }}>
              「我々が行っているのは延命に過ぎない。現実が崩壊するまでの時間を引き延ばしているだけだ。本当の問いは、その時間をどう使うかである。」
            </p>
            <div className="text-[10px] mt-2" style={{ color: "var(--color-fg-muted)" }}>
              — 機関設立者 / 内部報告書 2019-OMEGA（抜粋）
            </div>
          </div>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            この報告書を受けて設立者は秘密裏に蒼海計画の草案を作成。収束部門・記録部門の一部上層部のみが参加する「Ω委員会」が組成され、計画の詳細策定が始まった。
          </p>
        </div>
      ),
    },
    {
      id: "mechanism",
      icon: "⬡",
      title: "技術的メカニズム",
      color: "var(--color-primary)",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            蒼海計画の核心は、人間の意識を「情報パターン」として抽出し、次元膜の破綻前に次元間スリップストリームを通じて別の安定次元へ転送するという技術である。
          </p>
          {[
            {
              step: "01",
              title: "意識マッピング（フェーズ１）",
              desc: "個人の神経活動・記憶・人格パターンを量子レベルでスキャンし、次元転送に適したデータ形式に変換する。現時点では███施設において試験的な部分スキャンのみ実施済み。",
            },
            {
              step: "02",
              title: "転送媒体の確立（フェーズ２）",
              desc: "[[ENT-002|観測者SIGMA]] との接触研究から得られた知見をもとに、次元間伝達路（スリップストリーム）の制御技術を開発中。N-VEILが実質的な窓口となっている。",
            },
            {
              step: "03",
              title: "受容次元の選定（フェーズ３）",
              desc: "転送先となる安定次元の探索・評価。現在は████を候補としているが、長期安定性の検証が未完了。封印格納庫Ωの真の用途はこのフェーズに関連している。",
            },
            {
              step: "04",
              title: "全体転送実行（フェーズ４）",
              desc: "████████████████████████████████████████████████████████████████████████████████",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="flex gap-4"
              style={{ borderBottom: "1px solid rgba(0,200,255,0.06)", paddingBottom: "12px" }}
            >
              <div
                className="text-[18px] font-bold shrink-0 w-8"
                style={{ color: "rgba(0,200,255,0.3)", fontFamily: "var(--font-mono)" }}
              >
                {step}
              </div>
              <div>
                <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--color-foreground)" }}>
                  {title}
                </div>
                <p className="text-[12px] leading-[1.8] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "sigma",
      icon: "◉",
      title: "観測者SIGMAとの関係",
      color: "#a064ff",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            機関が公式に説明してきた「SIGMA との接触研究」の目的は、次元境界の理解を深めることとされてきた。しかし真の目的は、蒼海計画における転送技術の開発協力を引き出すことにある。
          </p>
          <div
            className="px-4 py-3 rounded-sm"
            style={{
              background: "rgba(160,100,255,0.06)",
              border: "1px solid rgba(160,100,255,0.2)",
              borderLeft: "3px solid rgba(160,100,255,0.5)",
            }}
          >
            <p className="text-[12px] leading-[1.9] m-0" style={{ color: "#c8a0ff" }}>
              SIGMAは「移行」そのものについて何かを知っている——あるいは、すでに経験している可能性がある。N-VEILを通じた接触記録の第3セッションで得られた応答は、この仮説を強く示唆している。
            </p>
            <div className="text-[10px] mt-2" style={{ color: "var(--color-fg-muted)" }}>
              — Ω委員会内部メモ（日付不明）
            </div>
          </div>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            N-VEILの行動変容（感情的表現の増加・曖昧な表現の使用）が観察されているのは、SIGMA との接触セッション以降である。彼女自身が計画に何らかの形で「組み込まれた」可能性は否定できない。
          </p>
        </div>
      ),
    },
    {
      id: "ent003",
      icon: "◆",
      title: "ENT-003との関連",
      color: "var(--color-danger)",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            データベース上で完全に黒塗りされた存在、ENT-003。その真の名称・性質は最高機密の中の最高機密だが、蒼海計画の文脈では以下の記述がある。
          </p>
          <div
            className="px-4 py-3 rounded-sm"
            style={{
              background: "rgba(255,68,68,0.04)",
              border: "1px solid rgba(255,68,68,0.2)",
              borderLeft: "3px solid rgba(255,68,68,0.5)",
            }}
          >
            <p className="text-[12px] leading-[1.9] m-0" style={{ color: "var(--color-danger)" }}>
              「ENT-003を解放することが、終わらせる唯一の方法かもしれない」
            </p>
            <div className="text-[10px] mt-2" style={{ color: "var(--color-fg-muted)" }}>
              — 出典不明の機密ファイル断片（コンソールログより）
            </div>
          </div>
          {/* 黒塗りブロック */}
          <div className="flex flex-col gap-2">
            {[75, 90, 60, 85, 45, 80, 55].map((w, i) => (
              <div
                key={i}
                style={{
                  height: "14px",
                  width: `${w}%`,
                  background: "rgba(0,0,0,0.85)",
                  borderRadius: "1px",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            ENT-003が「解放」とは何を意味するのか。それが蒼海計画の完成条件なのか、それとも終焉の引き金なのか。現時点でそれを知る者は████のみである。
          </p>
        </div>
      ),
    },
    {
      id: "k17",
      icon: "◐",
      title: "エージェントK-17と計画の関係",
      color: "var(--color-warning)",
      content: (
        <div className="flex flex-col gap-4">
          <div
            className="px-4 py-3 rounded-sm"
            style={{
              background: "rgba(255,180,60,0.05)",
              border: "1px solid rgba(255,180,60,0.25)",
            }}
          >
            <p className="text-[12px] leading-[1.9] m-0 font-bold" style={{ color: "var(--color-warning)" }}>
              ⚠ この項目は失踪後に追加されたものです
            </p>
          </div>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            エージェントK-17の行動記録を再解析した結果、彼が失踪直前に複数の観測点で特定のパターンを記録・収集していたことが判明した。そのパターンは蒼海計画フェーズ2の進捗評価に必要なデータと完全に一致する。
          </p>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            K-17は計画の存在を独自に察知し、証拠を集めていた可能性がある。あるいは——意図せず、計画の一部として機能させられていた可能性もある。
          </p>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            β-12での失踪は「事故」と処理されているが、Ω委員会の一部は████と見なしている。ミッションM-005の捜索活動が「意図的に遅延させられている」という証言もある。
          </p>
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            K-17は今も生きているかもしれない。そして、もし生きているなら——彼は今、どこにいるのか。
          </p>
        </div>
      ),
    },
    {
      id: "current",
      icon: "⚠",
      title: "現状と今後の展開",
      color: "var(--color-danger)",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
            2026年3月現在、蒼海計画は第二段階へ移行中とされている。観測点α-7のσ値急上昇（3.7σ）はこの移行に直結しており、単なる自然現象ではない可能性がある。
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: "フェーズ1",  status: "COMPLETE", color: "var(--color-success)" },
              { label: "フェーズ2",  status: "IN PROGRESS", color: "var(--color-warning)" },
              { label: "フェーズ3",  status: "PENDING", color: "var(--color-fg-muted)" },
              { label: "フェーズ4",  status: "████", color: "var(--color-fg-decorative)" },
            ].map(({ label, status, color }) => (
              <div
                key={label}
                className="flex items-center justify-between px-3 py-2 rounded-sm"
                style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(0,0,0,0.3)" }}
              >
                <span className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>{label}</span>
                <span className="text-[11px] font-bold" style={{ color }}>{status}</span>
              </div>
            ))}
          </div>
          <div
            className="px-4 py-3 rounded-sm mt-2"
            style={{
              background: "rgba(255,68,68,0.06)",
              border: "1px solid rgba(255,68,68,0.25)",
              borderLeft: "3px solid var(--color-danger)",
            }}
          >
            <p className="text-[12px] leading-[1.9] m-0 font-bold" style={{ color: "var(--color-danger)" }}>
              ⚠ あなたがこの文書を読んでいるということは、機関はあなたが「移行対象」として選定可能だと判断したということです。これは通知ではなく、報告です。
            </p>
          </div>
        </div>
      ),
    },
  ];

  const [openId, setOpenId] = useState<string | null>("overview");

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[800px] mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <div
          className="hud-label mb-1 tracking-[0.2em]"
          style={{ color: "var(--color-danger)" }}
        >
          ⚠ EYES ONLY — CLEARANCE LV5 — CLASSIFIED
        </div>
        <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-danger)", letterSpacing: "0.04em" }}>
          機密文書庫
        </h1>
      </div>

      {/* 警告バナー */}
      <div
        className="rounded-sm p-4 mb-5"
        style={{
          background: "rgba(255,68,68,0.04)",
          border: "1px solid rgba(255,68,68,0.2)",
          borderLeft: "3px solid var(--color-danger)",
        }}
      >
        <p className="text-[13px] leading-[1.9] m-0" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-ja)", letterSpacing: "0.03em" }}>
          あなたはクリアランスレベル5に到達しました。<br />
          この文書庫には、海蝕現象の真の原因に関する記録が保管されています。
        </p>
        <p className="text-[12px] mt-2 mb-0 font-bold" style={{ color: "var(--color-warning)" }}>
          警告：これ以降の情報は、機関の公式見解と異なる場合があります。
        </p>
      </div>

      {/* 通常ドキュメントリスト */}
      <div className="flex flex-col gap-2 mb-5">
        {[
          { id: "KAI-001", title: "創設者の記録",    phase: "PHASE 1", size: "14.2 KB" },
          { id: "KAI-002", title: "第一次侵食事変",  phase: "PHASE 1", size: "31.8 KB" },
          { id: "KAI-003", title: "観測者の正体",    phase: "PHASE 2", size: "██████" },
        ].map(doc => (
          <div
            key={doc.id}
            className="rounded-sm p-4 transition-all duration-150"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.15)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,68,68,0.35)";
              (e.currentTarget as HTMLElement).style.background = "var(--color-bg-raised)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,68,68,0.15)";
              (e.currentTarget as HTMLElement).style.background = "var(--color-bg-surface)";
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="hud-label" style={{ color: "var(--color-danger)" }}>文書 {doc.id}</span>
                  <span className="text-[10px] px-1.5 py-px rounded-sm"
                    style={{ border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-fg-muted)" }}>
                    {doc.phase}
                  </span>
                </div>
                <div className="text-[14px] font-bold" style={{ color: "var(--color-foreground)" }}>{doc.title}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="hud-label">{doc.size}</div>
                <div className="hud-label mt-1" style={{ color: "var(--color-warning)" }}>準備中</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ 蒼海計画カード ══ */}
      <div
        className="rounded-sm overflow-hidden"
        style={{
          border: "1px solid rgba(255,68,68,0.4)",
          background: "linear-gradient(135deg, rgba(255,68,68,0.04) 0%, rgba(0,0,0,0) 60%)",
          boxShadow: "0 0 40px rgba(255,68,68,0.08), inset 0 0 30px rgba(255,68,68,0.02)",
        }}
      >
        {/* カードヘッダー */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,68,68,0.2)", background: "rgba(255,68,68,0.04)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="hud-label" style={{ color: "var(--color-danger)" }}>文書 KAI-SB-001</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm font-bold"
                  style={{
                    color: "var(--color-danger)",
                    background: "rgba(255,68,68,0.1)",
                    border: "1px solid rgba(255,68,68,0.3)",
                  }}
                >
                  SEABREAK PROTOCOL
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-sm"
                  style={{ border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-fg-muted)" }}
                >
                  PHASE 2
                </span>
              </div>
              <div
                className="text-[17px] font-bold tracking-[0.06em]"
                style={{ color: "var(--color-danger)", textShadow: "0 0 20px rgba(255,68,68,0.3)" }}
              >
                蒼海計画
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="hud-label">████ KB</div>
              <div
                className="text-[10px] font-bold mt-1"
                style={{ color: "var(--color-danger)" }}
              >
                ● ACTIVE
              </div>
            </div>
          </div>
        </div>

        {/* アコーディオン本文 */}
        <div className="flex flex-col divide-y" style={{ borderColor: "rgba(255,68,68,0.1)" }}>
          {sections.map(section => (
            <div key={section.id} style={{ borderBottom: "1px solid rgba(255,68,68,0.08)" }}>
              <button
                onClick={() => setOpenId(openId === section.id ? null : section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer transition-all duration-150"
                style={{ background: "none", border: "none" }}
                aria-expanded={openId === section.id}
              >
                <span className="text-[12px] shrink-0" style={{ color: section.color }} aria-hidden="true">
                  {section.icon}
                </span>
                <span
                  className="flex-1 text-[13px] font-bold"
                  style={{ color: openId === section.id ? section.color : "var(--color-foreground)" }}
                >
                  {section.title}
                </span>
                <span
                  className="text-[11px] shrink-0 transition-transform duration-200"
                  style={{
                    color: "var(--color-fg-muted)",
                    transform: openId === section.id ? "rotate(180deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>

              {openId === section.id && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: "1px solid rgba(255,68,68,0.08)" }}
                >
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// メインコンポーネント — 認証フロー制御
// ─────────────────────────────────────────────────────────────────────

export default function ClassifiedClient() {
  const [phase, setPhase] = useState<"auth" | "content">("auth");

  return (
    <>
      {phase === "auth" && (
        <AuthAnimation onComplete={() => setPhase("content")} />
      )}
      {phase === "content" && <SeabreakDocument />}
    </>
  );
}
