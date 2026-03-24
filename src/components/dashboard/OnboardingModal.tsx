"use client";
import { apiPost } from "@/lib/api-client";
import { useState, useEffect, useRef } from "react";
import { useBoundStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Icon, NavIcon } from "@/components/ui/Icon";

import type { IconName } from "@/components/ui/Icon";

const STEPS: { icon: IconName; title: string; sub: string; body: string; color: string }[] = [
  {
    icon:  "dashboard",
    title: "海蝕機関へようこそ",
    sub:   "WELCOME TO KAISHOKU AGENCY",
    body:  "あなたは今日、「海蝕機関」に着任しました。\n\nこの機関は、私たちの世界に隣接する「階宙次元」からの侵食——通称「海蝕現象」を観測・収束することを使命とする秘密組織です。",
    color: "#00c8ff",
  },
  {
    icon:  "entity",
    title: "あなたの機関員ID",
    sub:   "AGENT IDENTIFICATION",
    body:  "あなたには固有の機関員IDが割り当てられました。\n\nこのIDはシステム全体で使用されます。大切に保管してください。",
    color: "#a064ff",
  },
  {
    icon:  "hex",
    title: "クリアランスレベル",
    sub:   "CLEARANCE LEVEL SYSTEM",
    body:  "機関内での活動実績に応じて、クリアランスレベル（LV 0〜5）が上昇します。\n\nレベルが上がるほど、より多くの情報・区域へのアクセスが許可されます。",
    color: "#3ecf6a",
  },
  {
    icon:  "warning",
    title: "警告",
    sub:   "SECURITY WARNING",
    body:  "このシステムは機密扱いです。\n\n不審な現象を発見した場合は即座に報告してください。「海蝕現象」はすでにあなたの近くまで進行しています。\n\n任務に備えてください。",
    color: "#ff4444",
  },
] as const;

export function OnboardingModal({ agentId }: { agentId: string }) {
  const [step,      setStep]      = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [closed,    setClosed]    = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const userFlags  = useBoundStore(s => s.user?.flags);
  const updateUser = useBoundStore(s => s.updateUser);

  // tutorial_complete フラグが立っていれば表示しない
  const isDone = userFlags?.tutorial_complete === "true";

  useEffect(() => {
    if (isDone) return;
    dialogRef.current?.showModal();
  }, [isDone]);

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    try {
      await apiPost("/api/auth/tutorial-complete");
      updateUser({ flags: { ...userFlags, tutorial_complete: "true" } });
    } catch { /* ignore */ }
    dialogRef.current?.close();
    setClosed(true);
  }

  if (isDone || closed) return null;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const s = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-body"
      className="bg-transparent border-0 p-4 max-w-[460px] w-full backdrop:bg-bg/85"
      onCancel={e => {
        e.preventDefault();
        if (isLast && !finishing) finish();
      }}
    >
      <div
        className="animate-[fadeIn_0.4s_ease_both] rounded-sm p-6 w-full"
        style={{
          background: "var(--color-bg-surface)",
          border:     `1px solid ${s.color}44`,
          boxShadow:  `0 0 50px ${s.color}18, 0 8px 40px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Step icon + title */}
        <div className="text-center mb-5">
          <div
            className="text-[36px] mb-2"
            style={{ color: s.color }}
            aria-hidden="true"
          >
            <Icon name={s.icon} size={36} color={s.color} aria-hidden />
          </div>
          <h2
            id="onboarding-title"
            className="m-0 text-[17px] font-bold tracking-[0.05em]"
            style={{ color: s.color }}
          >
            {s.title}
          </h2>
          <div
            className="hud-label mt-1"
            style={{ color: `${s.color}99` }}
            aria-hidden="true"
          >
            {s.sub}
          </div>
        </div>

        {/* Agent ID display on step 1 */}
        {step === 1 && (
          <div
            className="text-center mb-4 text-[20px] font-bold tracking-[0.1em] px-3 py-2.5 rounded-sm"
            style={{
              background: `${s.color}0f`,
              border:     `1px solid ${s.color}44`,
              color:      s.color,
            }}
          >
            <span aria-label={`エージェントID: ${agentId}`}>{agentId}</span>
          </div>
        )}

        {/* Body */}
        <p
          id="onboarding-body"
          className="text-[13px] leading-[1.85] whitespace-pre-wrap mb-5 m-0"
          style={{ color: "var(--color-fg-dim)" }}
        >
          {s.body}
        </p>

        {/* Progress dots */}
        <div aria-hidden="true" className="flex justify-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-[4px] rounded-full transition-all duration-300"
              style={{
                width:      i === step ? "20px" : "6px",
                background: i === step ? s.color : "var(--color-fg-decorative)",
              }}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          ステップ {step + 1} / {STEPS.length}：{s.title}
        </p>

        {/* Actions */}
        <div className="flex justify-between items-center">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="hud-label cursor-pointer transition-colors"
              style={{
                background: "none",
                border:     "none",
                color:      "var(--color-fg-muted)",
                padding:    0,
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.color = "var(--color-fg-dim)")
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)")
              }
            >
              ← 戻る
            </button>
          ) : (
            <span />
          )}

          {!isLast ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              aria-label={`次のステップへ（${step + 2} / ${STEPS.length}）`}
              style={{
                border:     `1px solid ${s.color}55`,
                color:      s.color,
                background: `${s.color}0d`,
              }}
            >
              次へ <Icon name="play" size={11} aria-hidden />
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={finishing}
              isLoading={finishing}
              style={{
                border:     `1px solid ${s.color}55`,
                color:      s.color,
                background: `${s.color}0d`,
              }}
            >
              {finishing ? "処理中…" : <><Icon name="play" size={11} aria-hidden /> 任務を開始する</>}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
