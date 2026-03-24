/**
 * reset-password/page.tsx — パスキー再設定ページ
 * Updated: 2026-03-19 04:10 JST — Field/OTP inputにcolorScheme:dark・WebkitTextFillColorを追加しオートフィル時の黒文字を修正
 * Updated: 2026-03-19 04:25 JST — KAISHOKUロゴにIgyouMincho適用、Field inputのfontFamilyをvar(--font-display)に変更
 */
"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ─── 型 ────────────────────────────────────────────────────────────────
// 秘密の質問フロー: agent → question（回答＋新パスワード同時入力） → done
// OTPメールフロー:  agent → otp_send → otp_verify → newpass → done
type Step   = "agent" | "question" | "otp_send" | "otp_verify" | "newpass" | "done";
type Method = "question" | "otp";

// ─── スタイル定数 ───────────────────────────────────────────────────────
const S = {
  panel:   "rgba(10,16,28,0.94)",
  border:  "rgba(0,200,255,0.2)",
  borderD: "rgba(0,200,255,0.08)",
  cyan:    "var(--color-primary)",
  red:     "var(--color-danger)",
  green:   "var(--color-success)",
  text:    "var(--color-foreground)",
  text2:   "var(--color-fg-dim)",
  text3:   "var(--color-fg-muted)",
  mono:    "var(--font-mono, \'Share Tech Mono\', monospace)",
} as const;

// ─── EmailJS ────────────────────────────────────────────────────────────
const EJS_SERVICE  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const EJS_TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const EJS_KEY      = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";
const emailjsReady = !!(EJS_SERVICE && EJS_TEMPLATE && EJS_KEY);

async function sendOtpMail(to: string, otp: string, agentId: string): Promise<void> {
  const { default: emailjs } = await import("@emailjs/browser");
  await emailjs.send(EJS_SERVICE, EJS_TEMPLATE,
    { to_email: to, otp_code: otp, agent_id: agentId, org_name: "海蝕機関" },
    { publicKey: EJS_KEY });
}

// ─── 共通 UI 部品 ───────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder, disabled, autoFocus, minLength }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
  autoFocus?: boolean; minLength?: number;
}) {
  return (
    <div>
      <label className="hud-label block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} autoFocus={autoFocus}
        minLength={minLength} required
        className="w-full px-3 py-2.5 rounded-sm text-[13px] outline-none disabled:opacity-40"
        style={{
          background: "rgba(0,200,255,0.04)",
          border: `1px solid ${S.border}`,
          color: S.text,
          fontFamily: S.mono,
          colorScheme: "dark",
          WebkitTextFillColor: S.text,
        }} />
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel, disabled }: {
  loading: boolean; label: string; loadingLabel?: string; disabled?: boolean;
}) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="w-full py-2.5 rounded-sm text-[13px] font-bold cursor-pointer disabled:opacity-40 transition-opacity"
      style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.4)", color: S.cyan, fontFamily: S.mono }}>
      {loading ? (loadingLabel ?? "処理中...") : label}
    </button>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="px-3 py-2.5 rounded-sm text-[12px] leading-relaxed mb-4"
      style={{ background: "rgba(255,68,68,0.07)", border: "1px solid rgba(255,68,68,0.25)", color: S.red }}>
      {msg}
    </div>
  );
}

// ─── ステップインジケーター ─────────────────────────────────────────────
type StepConf = { steps: string[]; active: (s: Step) => number };
const STEP_CONFS: Record<Method, StepConf> = {
  question: {
    steps: ["ID入力", "認証＋変更", "完了"],
    active: s => ({ agent: 0, question: 1, done: 2 } as Record<string, number>)[s] ?? 0,
  },
  otp: {
    steps: ["ID入力", "コード送信", "コード確認", "パスワード変更", "完了"],
    active: s => ({ agent: 0, otp_send: 1, otp_verify: 2, newpass: 3, done: 4 } as Record<string, number>)[s] ?? 0,
  },
};

function StepBar({ method, step }: { method: Method; step: Step }) {
  const conf   = STEP_CONFS[method];
  const active = conf.active(step);
  return (
    <div className="flex items-center mb-6">
      {conf.steps.map((label, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < conf.steps.length - 1 ? "1" : "0 0 auto" }}>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0"
              style={{
                background: i < active ? "rgba(80,220,120,0.18)" : i === active ? "rgba(0,200,255,0.18)" : "transparent",
                border: `1px solid ${i < active ? "var(--color-success)" : i === active ? S.cyan : S.borderD}`,
                color: i < active ? "var(--color-success)" : i === active ? S.cyan : S.text3,
                fontFamily: S.mono,
              }}>
              {i < active ? "✓" : i + 1}
            </div>
            <span className="text-[9px] whitespace-nowrap hidden sm:block"
              style={{ color: i === active ? S.cyan : S.text3, fontFamily: S.mono }}>
              {label}
            </span>
          </div>
          {i < conf.steps.length - 1 && (
            <div className="flex-1 h-[1px] mx-1 mb-4"
              style={{ background: i < active ? "rgba(80,220,120,0.4)" : S.borderD }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── メインコンポーネント ───────────────────────────────────────────────
export default function ResetPasswordPage() {
  const [step,        setStep]        = useState<Step>("agent");
  const [method,      setMethod]      = useState<Method>("question");
  const [agentId,     setAgentId]     = useState("");
  const [secretQ,     setSecretQ]     = useState("");
  const [answer,      setAnswer]      = useState("");
  const [email,       setEmail]       = useState("");
  const [otpCode,     setOtpCode]     = useState("");
  const [resetToken,  setResetToken]  = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [otpSentAt,   setOtpSentAt]   = useState(0);
  const [countdown,   setCountdown]   = useState(0);

  // OTP 再送信クールダウン（60秒）
  useEffect(() => {
    if (!otpSentAt) return;
    const id = setInterval(() => {
      const remain = Math.max(0, 60 - Math.floor((Date.now() - otpSentAt) / 1000));
      setCountdown(remain);
      if (!remain) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [otpSentAt]);

  const setErr = (msg: string) => { setError(msg); setLoading(false); };
  const goStep = (s: Step)     => { setError(""); setStep(s); };

  // ── STEP 1: エージェントID確認 ────────────────────────────────────
  const handleAgentSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch(`/api/auth/check-id?agentId=${encodeURIComponent(agentId.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data.error ?? "確認中にエラーが発生しました");
      if (data.available) return setErr("エージェントIDが見つかりません");
      if (data.secretQuestion) {
        setSecretQ(data.secretQuestion); setMethod("question"); goStep("question");
      } else if (emailjsReady) {
        setMethod("otp"); goStep("otp_send");
      } else {
        setErr("秘密の質問が設定されていません。サポートにお問い合わせください。");
      }
    } finally { setLoading(false); }
  };

  // ── STEP 2a: 秘密の質問 → 回答＋新パスワードを一括送信 ──────────
  const handleQuestionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8)      return setErr("新しいパスキーは8文字以上で入力してください");
    if (newPass !== confirmPass)  return setErr("パスキーが一致しません");
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/secret-question", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId.trim(), answer, newPassword: newPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data.error ?? "認証に失敗しました。回答を確認してください");
      goStep("done");
    } finally { setLoading(false); }
  };

  // ── STEP 2b-1: OTPリクエスト → EmailJSで送信 ──────────────────────
  const handleOtpRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return setErr("メールアドレスを入力してください");
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-by-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", agentId: agentId.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data.error ?? "OTPの発行に失敗しました");
      await sendOtpMail(email, data.otp, agentId.trim());
      setOtpSentAt(Date.now()); setCountdown(60);
      goStep("otp_verify");
    } catch {
      setErr("メール送信に失敗しました。メールアドレスとEmailJSの設定を確認してください。");
    } finally { setLoading(false); }
  };

  // ── STEP 2b-2: OTP検証 ────────────────────────────────────────────
  const handleOtpVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return setErr("6桁の認証コードを入力してください");
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-by-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", agentId: agentId.trim(), otp: otpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data.error ?? "認証コードが正しくありません");
      setResetToken(data.resetToken); goStep("newpass");
    } finally { setLoading(false); }
  };

  // ── STEP 2b-3: 新パスワード設定（OTPフロー） ──────────────────────
  const handleOtpReset = async (e: FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8)      return setErr("新しいパスキーは8文字以上で入力してください");
    if (newPass !== confirmPass)  return setErr("パスキーが一致しません");
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-by-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", agentId: agentId.trim(), resetToken, newPassword: newPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data.error ?? "パスワードの更新に失敗しました");
      goStep("done");
    } finally { setLoading(false); }
  };

  // ─── render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-[420px] animate-[fadeIn_0.4s_ease_both]">

        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="text-[24px] font-bold tracking-[0.14em] mb-1"
            style={{ color: S.cyan, fontFamily: "var(--font-display)", animation: "var(--animate-flicker, none)" }}>
            <Icon name="dashboard" size={22} style={{ marginRight: 6 }} aria-hidden />KAISHOKU
          </div>
          <div className="hud-label">パスキー再設定</div>
        </div>

        <div className="p-6 rounded-sm" style={{ background: S.panel, border: `1px solid ${S.border}` }}>

          {step !== "done" && <StepBar method={method} step={step} />}
          <ErrorBox msg={error} />

          {/* ─── agent ── */}
          {step === "agent" && (
            <form onSubmit={handleAgentSubmit} className="flex flex-col gap-4">
              <Field label="エージェントID" value={agentId} onChange={setAgentId}
                placeholder="例: K-ABC-123" autoFocus disabled={loading} />
              <SubmitBtn loading={loading} label="次へ →" disabled={!agentId} />
              {!emailjsReady && (
                <p className="text-[11px] text-center" style={{ color: S.text3 }}>
                  ※ EmailJSが未設定のため秘密の質問による認証のみ利用できます
                </p>
              )}
            </form>
          )}

          {/* ─── question ── */}
          {step === "question" && (
            <form onSubmit={handleQuestionSubmit} className="flex flex-col gap-4">
              {emailjsReady && (
                <div className="flex gap-2">
                  <button type="button" disabled
                    className="flex-1 py-1.5 rounded-sm text-[11px]"
                    style={{ background: "rgba(0,200,255,0.1)", border: `1px solid ${S.cyan}`, color: S.cyan, fontFamily: S.mono }}>
                    秘密の質問
                  </button>
                  <button type="button"
                    onClick={() => { setError(""); setAnswer(""); setNewPass(""); setConfirmPass(""); goStep("otp_send"); }}
                    className="flex-1 py-1.5 rounded-sm text-[11px] cursor-pointer"
                    style={{ background: "transparent", border: `1px solid ${S.borderD}`, color: S.text3, fontFamily: S.mono }}>
                    メール認証に切替
                  </button>
                </div>
              )}
              <div>
                <div className="hud-label mb-1.5">秘密の質問</div>
                <div className="px-3 py-2.5 rounded-sm text-[13px]"
                  style={{ background: "rgba(0,200,255,0.03)", border: `1px solid ${S.borderD}`, color: S.text2 }}>
                  {secretQ}
                </div>
              </div>
              <Field label="回答" value={answer} onChange={setAnswer}
                type="password" placeholder="登録時の回答を入力" autoFocus disabled={loading} />
              <div className="pt-3" style={{ borderTop: `1px solid ${S.borderD}` }}>
                <p className="hud-label mb-3" style={{ color: S.text3 }}>新しいパスキー（8文字以上）</p>
                <div className="flex flex-col gap-3">
                  <Field label="新しいパスキー" value={newPass} onChange={setNewPass}
                    type="password" placeholder="••••••••" minLength={8} disabled={loading} />
                  <Field label="確認（再入力）" value={confirmPass} onChange={setConfirmPass}
                    type="password" placeholder="••••••••" disabled={loading} />
                </div>
              </div>
              <SubmitBtn loading={loading} label="認証してパスキーを更新"
                loadingLabel="更新中..." disabled={!answer || !newPass || !confirmPass} />
            </form>
          )}

          {/* ─── otp_send ── */}
          {step === "otp_send" && (
            <form onSubmit={handleOtpRequest} className="flex flex-col gap-4">
              {secretQ && (
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => { setError(""); goStep("question"); }}
                    className="flex-1 py-1.5 rounded-sm text-[11px] cursor-pointer"
                    style={{ background: "transparent", border: `1px solid ${S.borderD}`, color: S.text3, fontFamily: S.mono }}>
                    秘密の質問に切替
                  </button>
                  <button type="button" disabled
                    className="flex-1 py-1.5 rounded-sm text-[11px]"
                    style={{ background: "rgba(0,200,255,0.1)", border: `1px solid ${S.cyan}`, color: S.cyan, fontFamily: S.mono }}>
                    メール認証
                  </button>
                </div>
              )}
              <p className="text-[12px]" style={{ color: S.text2 }}>
                登録済みのメールアドレスに6桁の認証コードを送信します。
              </p>
              <Field label="メールアドレス" value={email} onChange={setEmail}
                type="email" placeholder="your@email.com" autoFocus disabled={loading} />
              <SubmitBtn loading={loading} label="認証コードを送信" loadingLabel="送信中..." disabled={!email} />
            </form>
          )}

          {/* ─── otp_verify ── */}
          {step === "otp_verify" && (
            <form onSubmit={handleOtpVerify} className="flex flex-col gap-4">
              <div className="px-3 py-2.5 rounded-sm text-[12px]"
                style={{ background: "rgba(0,200,255,0.04)", border: `1px solid ${S.borderD}` }}>
                <p style={{ color: S.text2 }}>
                  <span style={{ color: S.cyan }}>{email}</span> に送信した6桁のコードを入力してください。
                </p>
                <p className="hud-label mt-1" style={{ color: S.text3 }}>有効期限: 10分</p>
              </div>
              <div>
                <label className="hud-label block mb-1.5">認証コード</label>
                <input value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6} required autoFocus
                  className="w-full px-3 py-3 rounded-sm text-[22px] text-center outline-none tracking-[0.5em]"
                  style={{
                    background: "rgba(0,200,255,0.04)",
                    border: `1px solid ${otpCode.length === 6 ? S.cyan : S.border}`,
                    color: S.cyan,
                    fontFamily: S.mono,
                    colorScheme: "dark",
                    WebkitTextFillColor: S.cyan,
                  }} />
              </div>
              <SubmitBtn loading={loading} label="確認" disabled={otpCode.length !== 6} />
              <div className="flex justify-between text-[11px]">
                <button type="button" onClick={() => goStep("otp_send")}
                  style={{ color: S.text3, background: "transparent", border: "none", cursor: "pointer" }}>
                  メールアドレスを変更
                </button>
                {countdown > 0 ? (
                  <span style={{ color: S.text3 }}>再送信まで {countdown}秒</span>
                ) : (
                  <button type="button" onClick={() => { setOtpCode(""); goStep("otp_send"); }}
                    style={{ color: S.cyan, background: "transparent", border: "none", cursor: "pointer" }}>
                    コードを再送信
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ─── newpass（OTPフロー） ── */}
          {step === "newpass" && (
            <form onSubmit={handleOtpReset} className="flex flex-col gap-4">
              <div className="px-3 py-2 rounded-sm text-[12px]"
                style={{ background: "rgba(80,220,120,0.06)", border: "1px solid rgba(80,220,120,0.25)" }}>
                <span style={{ color: "var(--color-success)" }}>✓ 認証完了</span>
                <span className="ml-2" style={{ color: S.text2 }}>新しいパスキーを設定してください</span>
              </div>
              <Field label="新しいパスキー（8文字以上）" value={newPass} onChange={setNewPass}
                type="password" placeholder="••••••••" minLength={8} autoFocus disabled={loading} />
              <Field label="確認（再入力）" value={confirmPass} onChange={setConfirmPass}
                type="password" placeholder="••••••••" disabled={loading} />
              <SubmitBtn loading={loading} label="パスキーを更新"
                loadingLabel="更新中..." disabled={!newPass || !confirmPass} />
            </form>
          )}

          {/* ─── done ── */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="text-[40px] mb-4" style={{ color: "var(--color-success)" }}>✓</div>
              <p className="text-[15px] font-bold mb-2" style={{ color: S.text }}>パスキーを更新しました</p>
              <p className="text-[12px] mb-6" style={{ color: S.text2 }}>新しいパスキーでログインしてください。</p>
              <Link href="/login"
                className="inline-block px-8 py-2.5 rounded-sm text-[13px] font-bold"
                style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.4)", color: S.cyan, fontFamily: S.mono }}>
                ログイン画面へ →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/login" className="hud-label hover:opacity-70 transition-opacity"
            style={{ color: S.text3 }}>
            ← ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
