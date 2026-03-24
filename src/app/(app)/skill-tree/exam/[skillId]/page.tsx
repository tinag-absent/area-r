"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { getExamBySkillId, type SkillExam, type ExamQuestion } from "../../examData";
import { SKILLS, getBranchColor }                                from "../../data";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ─────────────────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────────────────

interface ExamResult {
  score:    number;
  total:    number;
  passed:   boolean;
  passMark: number;
  xpGained: number;
  detail: {
    questionId:  string;
    correct:     boolean;
    yourAnswer:  number;
    rightAnswer: number;
    hint?:       string;
  }[];
}

interface PastResult {
  skill_id:  string;
  score:     number;
  total:     number;
  passed:    number;
  taken_at:  string;
}

// ─────────────────────────────────────────────────────────────────────
// 進行状態インジケーター
// ─────────────────────────────────────────────────────────────────────

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-all duration-300"
            style={{
              background: i < current
                ? color
                : i === current
                ? `${color}55`
                : "rgba(0,200,255,0.08)",
              boxShadow: i < current ? `0 0 4px ${color}66` : "none",
            }}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold shrink-0" style={{ color }}>
        {current}/{total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 問題コンポーネント
// ─────────────────────────────────────────────────────────────────────

function QuestionCard({
  question, index, total, selected, onSelect, onNext, isLast, color,
}: {
  question:  ExamQuestion;
  index:     number;
  total:     number;
  selected:  number | null;
  onSelect:  (i: number) => void;
  onNext:    () => void;
  isLast:    boolean;
  color:     string;
}) {
  return (
    <div className="animate-[fadeIn_0.3s_ease_both]">
      {/* 問番号 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="hud-label" style={{ color }}>
          問題 {index + 1} / {total}
        </span>
      </div>

      {/* 問題文 */}
      <div
        className="rounded-sm p-5 mb-5"
        style={{
          background: `${color}08`,
          border: `1px solid ${color}25`,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <p className="text-[14px] leading-[1.8] m-0" style={{ color: "var(--color-foreground)" }}>
          {question.text}
        </p>
      </div>

      {/* 選択肢 */}
      <div className="flex flex-col gap-2.5 mb-6">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="w-full text-left px-4 py-3 rounded-sm transition-all duration-150 cursor-pointer"
              style={{
                background: isSelected ? `${color}15` : "var(--color-bg-surface)",
                border: `1px solid ${isSelected ? color : "rgba(0,200,255,0.1)"}`,
                boxShadow: isSelected ? `0 0 12px ${color}18` : "none",
              }}
              onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = `${color}44`;
              }}
              onMouseLeave={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.1)";
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all"
                  style={{
                    background: isSelected ? color : "transparent",
                    border: `1px solid ${isSelected ? color : "rgba(0,200,255,0.2)"}`,
                    color: isSelected ? "#060b10" : "var(--color-fg-muted)",
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span
                  className="text-[13px] leading-snug"
                  style={{ color: isSelected ? "var(--color-foreground)" : "var(--color-fg-dim)" }}
                >
                  {choice}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 次へボタン */}
      <button
        onClick={onNext}
        disabled={selected === null}
        className="px-6 py-2.5 rounded-sm font-bold text-[12px] tracking-[0.06em] transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: selected !== null ? `${color}15` : "transparent",
          border: `1px solid ${selected !== null ? color : `${color}33`}`,
          color: selected !== null ? color : `${color}55`,
        }}
      >
        {isLast ? "採点する" : "次の問題 →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 結果コンポーネント
// ─────────────────────────────────────────────────────────────────────

function ResultView({
  result, exam, answers, color, onRetry, onBack,
}: {
  result:  ExamResult;
  exam:    SkillExam;
  answers: number[];
  color:   string;
  onRetry: () => void;
  onBack:  () => void;
}) {
  const pct  = Math.round((result.score / result.total) * 100);

  return (
    <div className="animate-[fadeIn_0.4s_ease_both]">
      {/* 合否バナー */}
      <div
        className="rounded-sm p-6 mb-6 text-center"
        style={{
          background: result.passed ? "rgba(62,207,106,0.06)" : "rgba(255,68,68,0.06)",
          border: `1px solid ${result.passed ? "rgba(62,207,106,0.3)" : "rgba(255,68,68,0.3)"}`,
          borderLeft: `4px solid ${result.passed ? "var(--color-success)" : "var(--color-danger)"}`,
        }}
      >
        <div
          className="text-[32px] font-bold mb-1"
          style={{
            color: result.passed ? "var(--color-success)" : "var(--color-danger)",
            textShadow: result.passed ? "0 0 20px rgba(62,207,106,0.4)" : "0 0 20px rgba(255,68,68,0.4)",
          }}
        >
          {result.passed ? "合格" : "不合格"}
        </div>
        <div className="text-[13px] mb-3" style={{ color: "var(--color-fg-dim)" }}>
          {result.passed
            ? "認定テストに合格しました。スキルを習得してください。"
            : `合格点 ${result.passMark}/${result.total} に達しませんでした。再挑戦してください。`}
        </div>

        {/* スコア */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="hud-label mb-1">スコア</div>
            <div className="text-[28px] font-bold" style={{ color }}>
              {result.score}<span className="text-[16px]">/{result.total}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="hud-label mb-1">正答率</div>
            <div className="text-[28px] font-bold" style={{ color }}>{pct}%</div>
          </div>
          <div className="text-center">
            <div className="hud-label mb-1">合格点</div>
            <div className="text-[28px] font-bold" style={{ color: "var(--color-fg-muted)" }}>
              {result.passMark}<span className="text-[16px]">/{result.total}</span>
            </div>
          </div>
          {result.xpGained > 0 && (
            <div className="text-center">
              <div className="hud-label mb-1">XP獲得</div>
              <div className="text-[28px] font-bold" style={{ color: "var(--color-success)" }}>
                +{result.xpGained}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 解答一覧 */}
      <div className="mb-6">
        <div className="hud-label mb-3">解答結果</div>
        <div className="flex flex-col gap-2.5">
          {exam.questions.map((q, i) => {
            const d       = result.detail[i]!;
            const isRight = d.correct;
            return (
              <div
                key={q.id}
                className="rounded-sm p-4"
                style={{
                  background: isRight ? "rgba(62,207,106,0.04)" : "rgba(255,68,68,0.04)",
                  border: `1px solid ${isRight ? "rgba(62,207,106,0.15)" : "rgba(255,68,68,0.15)"}`,
                  borderLeft: `3px solid ${isRight ? "var(--color-success)" : "var(--color-danger)"}`,
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className="text-[12px] shrink-0 mt-0.5"
                    style={{ color: isRight ? "var(--color-success)" : "var(--color-danger)" }}
                  >
                    {isRight ? "✓" : "✕"}
                  </span>
                  <span className="text-[12px] leading-relaxed" style={{ color: "var(--color-foreground)" }}>
                    {q.text}
                  </span>
                </div>

                {/* 選択肢表示 */}
                <div className="ml-5 flex flex-col gap-1">
                  {q.choices.map((choice, ci) => {
                    const isYours  = d.yourAnswer === ci;
                    const isAnswer = d.rightAnswer === ci;
                    if (!isYours && !isAnswer) return null;
                    return (
                      <div key={ci} className="flex items-center gap-2 text-[11px]">
                        <span
                          style={{
                            color: isAnswer
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                          }}
                        >
                          {isAnswer ? <><Icon name="check" size={12} style={{ marginRight: 3 }} aria-hidden />正解：</> : <><Icon name="close" size={12} style={{ marginRight: 3 }} aria-hidden />あなたの回答：</>}
                        </span>
                        <span style={{ color: "var(--color-fg-dim)" }}>{choice}</span>
                      </div>
                    );
                  })}
                </div>

                {/* ヒント（不正解時） */}
                {!isRight && q.hint && (
                  <div
                    className="mt-2 ml-5 px-3 py-2 rounded-sm text-[11px] leading-relaxed"
                    style={{
                      background: "rgba(255,180,60,0.06)",
                      border: "1px solid rgba(255,180,60,0.2)",
                      color: "var(--color-warning)",
                    }}
                  >
                    💡 {q.hint}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        {!result.passed && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-sm font-bold text-[12px] tracking-[0.06em] cursor-pointer transition-all"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}`,
              color,
            }}
          >
            再挑戦
          </button>
        )}
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-sm font-bold text-[12px] tracking-[0.06em] cursor-pointer transition-all"
          style={{
            background: "transparent",
            border: "1px solid rgba(0,200,255,0.2)",
            color: "var(--color-fg-dim)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.4)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.2)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-fg-dim)";
          }}
        >
          ← スキルツリーに戻る
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// メインページコンポーネント
// ─────────────────────────────────────────────────────────────────────

type Phase = "intro" | "exam" | "submitting" | "result";

export default function ExamPage({ params }: { params: Promise<{ skillId: string }> }) {
  const { skillId }  = use(params);
  const router       = useRouter();
  const exam         = getExamBySkillId(skillId);
  const skill        = SKILLS.find(s => s.id === skillId);
  const color        = skill ? getBranchColor(skill.branch) : "#00c8ff";

  const [phase, setPhase]       = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers]   = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult]     = useState<ExamResult | null>(null);
  const [pastResult, setPastResult] = useState<PastResult | null>(null);
  const [loadingPast, setLoadingPast] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 過去の受験結果を取得
  useEffect(() => {
    if (!skillId) return;
    fetch(`/api/skill-exam?skillId=${skillId}`)
      .then(r => r.json())
      .then(data => { if (data) setPastResult(data); })
      .catch(() => {})
      .finally(() => setLoadingPast(false));
  }, [skillId]);

  const startExam = useCallback(() => {
    setPhase("exam");
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setSubmitError(null);
  }, []);

  const handleNext = useCallback(async () => {
    if (selected === null || !exam) return;
    const newAnswers = [...answers, selected];
    setSelected(null);

    if (currentQ < exam.questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(prev => prev + 1);
    } else {
      // 最終問題 → 送信
      setPhase("submitting");
      try {
        const res = await fetch("/api/skill-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ skillId, answers: newAnswers }),
        });
        const data = await res.json();
        if (!res.ok) { setSubmitError(data.error ?? "送信エラー"); setPhase("exam"); return; }
        setResult(data);
        setPastResult({
          skill_id: skillId, score: data.score, total: data.total,
          passed: data.passed ? 1 : 0, taken_at: new Date().toISOString(),
        });
        setPhase("result");
      } catch {
        setSubmitError("通信エラーが発生しました");
        setPhase("exam");
      }
    }
  }, [selected, answers, currentQ, exam, skillId]);

  if (!exam || !skill) {
    return (
      <div className="px-5 py-7 sm:px-8 max-w-[640px] mx-auto">
        <div className="hud-label mb-2" style={{ color: "var(--color-danger)" }}>ERROR</div>
        <p className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>
          テストが見つかりません：{skillId}
        </p>
        <button onClick={() => router.push("/skill-tree")}
          className="mt-4 px-4 py-2 text-[12px] cursor-pointer rounded-sm"
          style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", background: "transparent" }}>
          ← スキルツリーに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[680px] mx-auto">

      {/* ─ ヘッダー ─ */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/skill-tree")}
          className="hud-label mb-3 flex items-center gap-1 cursor-pointer transition-colors"
          style={{ color: "var(--color-fg-muted)", background: "none", border: "none", padding: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = color; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}
        >
          ← スキルツリー
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px]" style={{ color }} aria-hidden="true">{skill.icon}</span>
          <div className="hud-label" style={{ color }}>スキル認定テスト</div>
        </div>
        <h1 className="m-0 text-[20px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          {exam.title}
        </h1>
        <p className="text-[12px] mt-1.5 m-0 leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
          {exam.description}
        </p>
      </div>

      {/* ─ INTRO ─ */}
      {phase === "intro" && (
        <div className="animate-[fadeIn_0.4s_ease_both]">
          {/* 概要カード */}
          <div
            className="rounded-sm p-5 mb-5"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.1)" }}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "問題数",   value: `${exam.questions.length}問` },
                { label: "合格点",   value: `${exam.passMark}/${exam.questions.length}問 正解` },
                { label: "合格率",   value: `${Math.round((exam.passMark / exam.questions.length) * 100)}%` },
                { label: "合格特典", value: "+100 XP（初回のみ）" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="hud-label mb-0.5">{label}</div>
                  <div className="text-[13px] font-bold" style={{ color: "var(--color-foreground)" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 過去の結果 */}
          {!loadingPast && pastResult && (
            <div
              className="rounded-sm p-4 mb-5"
              style={{
                background: pastResult.passed ? "rgba(62,207,106,0.05)" : "rgba(255,68,68,0.04)",
                border: `1px solid ${pastResult.passed ? "rgba(62,207,106,0.2)" : "rgba(255,68,68,0.2)"}`,
                borderLeft: `3px solid ${pastResult.passed ? "var(--color-success)" : "var(--color-danger)"}`,
              }}
            >
              <div className="hud-label mb-2">前回の受験記録</div>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-[13px] font-bold" style={{ color: pastResult.passed ? "var(--color-success)" : "var(--color-danger)" }}>
                    {pastResult.passed ? "合格" : "不合格"}
                  </span>
                </div>
                <div>
                  <span className="hud-label mr-1">スコア</span>
                  <span className="text-[13px] font-bold" style={{ color }}>
                    {pastResult.score}/{pastResult.total}
                  </span>
                  <span className="text-[11px] ml-1" style={{ color: "var(--color-fg-muted)" }}>
                    ({Math.round((pastResult.score / pastResult.total) * 100)}%)
                  </span>
                </div>
                <div>
                  <span className="hud-label mr-1">受験日</span>
                  <span className="text-[11px]" style={{ color: "var(--color-fg-dim)" }}>
                    {new Date(pastResult.taken_at.replace(" ", "T") + "Z")
                      .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })}
                  </span>
                </div>
              </div>
              {!pastResult.passed && (
                <p className="text-[11px] mt-2 mb-0" style={{ color: "var(--color-fg-muted)" }}>
                  再挑戦できます。過去の記録は新しいスコアで上書きされます。
                </p>
              )}
            </div>
          )}

          {submitError && (
            <div className="mb-4 px-3 py-2 rounded-sm text-[12px]"
              style={{ color: "var(--color-danger)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={startExam}
              className="px-6 py-2.5 rounded-sm font-bold text-[12px] tracking-[0.06em] cursor-pointer transition-all"
              style={{ background: `${color}15`, border: `1px solid ${color}`, color }}
            >
              {pastResult ? "再受験する" : "テストを開始する"}
            </button>
            <button
              onClick={() => router.push("/skill-tree")}
              className="px-5 py-2.5 rounded-sm text-[12px] cursor-pointer transition-all"
              style={{ background: "transparent", border: "1px solid rgba(0,200,255,0.15)", color: "var(--color-fg-dim)" }}
            >
              戻る
            </button>
          </div>
        </div>
      )}

      {/* ─ EXAM ─ */}
      {phase === "exam" && (
        <div>
          {/* プログレスバー */}
          <div className="mb-6">
            <ProgressBar current={currentQ} total={exam.questions.length} color={color} />
          </div>

          <QuestionCard
            question={exam.questions[currentQ]!}
            index={currentQ}
            total={exam.questions.length}
            selected={selected}
            onSelect={setSelected}
            onNext={handleNext}
            isLast={currentQ === exam.questions.length - 1}
            color={color}
          />

          {submitError && (
            <div className="mt-4 px-3 py-2 rounded-sm text-[12px]"
              style={{ color: "var(--color-danger)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* ─ SUBMITTING ─ */}
      {phase === "submitting" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-8 h-8 rounded-full border-2"
            style={{
              borderColor: `${color} transparent transparent transparent`,
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>採点中…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ─ RESULT ─ */}
      {phase === "result" && result && (
        <ResultView
          result={result}
          exam={exam}
          answers={answers.map(a => a ?? 0)}
          color={color}
          onRetry={startExam}
          onBack={() => router.push("/skill-tree")}
        />
      )}
    </div>
  );
}
