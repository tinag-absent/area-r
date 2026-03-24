/*
 * register/page.tsx — 新規登録ページ
 * Updated: 2026-03-19 04:25 JST — KAISHOKUロゴにIgyouMincho適用
 * Updated: 2026-03-24 — パスワード表示トグルボタンを追加
 */
"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiPost, getErrorMessage } from "@/lib/api-client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DIVISIONS } from "@/lib/constants";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ── EmailJS 設定（パスワードリセットと共通） ──────────────────────────
const EJS_SERVICE  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const EJS_TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_REGISTER_TEMPLATE_ID
                  ?? process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const EJS_KEY      = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";
const emailjsReady = !!(EJS_SERVICE && EJS_TEMPLATE && EJS_KEY);

async function sendVerificationMail(
  to: string,
  otp: string,
  username: string
): Promise<void> {
  const { default: emailjs } = await import("@emailjs/browser");
  await emailjs.send(
    EJS_SERVICE,
    EJS_TEMPLATE,
    { to_email: to, otp_code: otp, username, org_name: "海蝕機関" },
    { publicKey: EJS_KEY }
  );
}

// ── ステップ定数 ──────────────────────────────────────────────────────
type Step = "form" | "verify" | "done";

// ── フィールドコンポーネント ───────────────────────────────────────────
function Field({
  id, label, hint, type = "text", value, onChange,
  placeholder, autoComplete, required = true, disabled,
}: {
  id: string; label: string; hint?: string;
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string;
  required?: boolean; disabled?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="hud-label mb-1.5 block">
        {label}
        {hint && <span style={{ color: "var(--color-fg-decorative)", marginLeft: 6 }}>{hint}</span>}
      </label>
      <div style={{ position: isPassword ? "relative" : undefined }}>
        <input
          id={id}
          className="input-base"
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-required={required}
          style={isPassword ? { paddingRight: "2.4rem" } : undefined}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? "パスキーを隠す" : "パスキーを表示"}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
              color: "var(--color-fg-dim)", display: "flex", alignItems: "center",
            }}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={14} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

// ── ステップ1: 登録フォーム ───────────────────────────────────────────
function StepForm({
  onNext,
}: {
  onNext: (userId: string, email: string, username: string) => void;
}) {
  const [username,   setUsername]   = useState("");
  const [password,   setPassword]   = useState("");
  const [email,      setEmail]      = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await apiPost("/api/auth/register", {
        action: "request", username, password, email, divisionId: divisionId || undefined,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "エラーが発生しました。"); return; }

      // EmailJS が設定されていればメール送信
      if (emailjsReady) {
        try {
          await sendVerificationMail(email, data.otp, username);
        } catch {
          setError("メール送信に失敗しました。メールアドレスと EmailJS の設定を確認してください。");
          return;
        }
      } else {
        // EmailJS 未設定: コードをコンソールに出力（開発用）
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.info(`[DEV] 認証コード: ${data.otp}`);
        }
        alert(`[開発モード] 認証コード: ${data.otp}\n（本番では EmailJS でメール送信されます）`);
      }

      onNext(data.userId, email, username);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="hud-label mb-5">— STEP 1 / 2 — 着任情報の入力 —</div>
      {error && <ErrorMessage id="reg-error" message={error} />}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          id="reg-username" label="ログインID" hint="(3〜24文字・英数字)"
          value={username} onChange={setUsername}
          placeholder="例: agent_001" autoComplete="username" disabled={loading}
        />
        <Field
          id="reg-password" label="パスキー" hint="(8文字以上)"
          type="password" value={password} onChange={setPassword}
          placeholder="••••••••" autoComplete="new-password" disabled={loading}
        />
        <Field
          id="reg-email" label="メールアドレス" hint="(認証コードを送信します)"
          type="email" value={email} onChange={setEmail}
          placeholder="agent@example.com" autoComplete="email" disabled={loading}
        />
        <div>
          <label htmlFor="reg-division" className="hud-label mb-1.5 block">
            配属部門 <span style={{ color: "var(--color-fg-decorative)" }}>(任意)</span>
          </label>
          <select
            id="reg-division"
            className="input-base select"
            value={divisionId}
            onChange={e => setDivisionId(e.target.value)}
            disabled={loading}
          >
            <option value="">— 未配属 —</option>
            {DIVISIONS.map(d => (
              <option key={d.id} value={d.id}>{d.name} / {d.name_en}</option>
            ))}
          </select>
        </div>

        {!emailjsReady && (
          <div className="px-3 py-2 rounded-sm text-[11px]"
            style={{ background: "rgba(255,180,60,0.06)", border: "1px solid rgba(255,180,60,0.18)", color: "var(--color-warning)" }}>
            <Icon name="warning" size={12} style={{ marginRight: 4 }} aria-hidden />EmailJS が未設定のため、認証コードが画面に表示されます（開発モード）。
          </div>
        )}

        <Button type="submit" disabled={loading} isLoading={loading} className="w-full mt-1">
          {loading ? "送信中…" : <><Icon name="play" size={11} aria-hidden /> 認証コードを送信</>}
        </Button>
      </form>
    </>
  );
}

// ── ステップ2: OTP 検証 ───────────────────────────────────────────────
function StepVerify({
  userId, email, username,
  onBack, onSuccess,
}: {
  userId: string; email: string; username: string;
  onBack: () => void; onSuccess: () => void;
}) {
  const [otp,     setOtp]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await apiPost("/api/auth/register", {
        action: "verify", userId, otp: otp.trim(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "認証に失敗しました。"); return; }
      try { new BroadcastChannel("sea-auth").postMessage({ type: "login" }); } catch {}
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true); setError("");
    try {
      // 再送信: メールアドレスなしで resend はできないので back → form から
      // ここでは前のステップのデータがないため、ユーザーに戻るよう案内
      onBack();
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <div className="hud-label mb-5">— STEP 2 / 2 — 認証コードの確認 —</div>

      <div className="px-3 py-3 rounded-sm mb-4 text-[12px]"
        style={{ background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.15)" }}>
        <div style={{ color: "var(--color-primary)", marginBottom: 4 }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />認証コードを送信しました</div>
        <div style={{ color: "var(--color-fg-dim)" }}>
          <span style={{ color: "var(--color-primary)" }}>{email}</span> に送信した
          6桁のコードを入力してください。（有効期限: 10分）
        </div>
      </div>

      {error && <ErrorMessage id="verify-error" message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="reg-otp" className="hud-label mb-1.5 block">
            認証コード <span style={{ color: "var(--color-fg-decorative)" }}>(6桁)</span>
          </label>
          <input
            id="reg-otp"
            className="input-base"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            autoComplete="one-time-code"
            autoFocus
            required
            disabled={loading}
            style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
          />
        </div>

        <Button type="submit" disabled={loading || otp.length < 6} isLoading={loading} className="w-full">
          {loading ? "確認中…" : <><Icon name="play" size={11} aria-hidden /> 認証して着任</>}
        </Button>
      </form>

      <div className="mt-4 flex justify-between text-[11px]"
        style={{ color: "var(--color-fg-dim)" }}>
        <button
          onClick={handleResend}
          disabled={resending}
          className="no-underline cursor-pointer"
          style={{ background: "none", border: "none", color: "var(--color-fg-dim)", padding: 0 }}
        >
          ← 入力内容を修正する
        </button>
        <span>コードが届かない場合は迷惑メールフォルダを確認してください</span>
      </div>
    </>
  );
}

// ── ステップ3: 完了 ───────────────────────────────────────────────────
function StepDone() {
  return (
    <div className="text-center py-6">
      <div style={{ marginBottom: 12 }}><Icon name="dashboard" size={32} color="var(--color-primary)" aria-hidden /></div>
      <div className="text-[15px] font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
        着任完了
      </div>
      <div className="hud-label mb-6" style={{ color: "var(--color-fg-dim)" }}>
        機関員として認証されました。ダッシュボードへ移動します。
      </div>
      <div className="flex justify-center">
        <div className="h-1 w-24 rounded-full animate-pulse" style={{ background: "var(--color-primary)" }} />
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────

export default function RegisterPage() {
  const [step,     setStep]     = useState<Step>("form");
  const [userId,   setUserId]   = useState("");
  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");

  function handleFormNext(uid: string, mail: string, uname: string) {
    setUserId(uid);
    setEmail(mail);
    setUsername(uname);
    setStep("verify");
  }

  function handleVerifySuccess() {
    setStep("done");
    // 少し待ってからリダイレクト
    setTimeout(() => { window.location.href = "/dashboard"; }, 1800);
  }

  // ステッパーインジケーター
  const steps = ["情報入力", "メール認証", "完了"];
  const stepIndex = step === "form" ? 0 : step === "verify" ? 1 : 2;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] w-full max-w-[420px]">
      {/* ロゴ */}
      <div className="text-center mb-8">
        <div
          className="text-[26px] font-bold tracking-[0.14em] mb-1"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)", animation: "var(--animate-flicker)" }}
        >
          <Icon name="dashboard" size={22} style={{ marginRight: 6 }} aria-hidden />KAISHOKU
        </div>
        <div className="hud-label">新規機関員 — 着任申請フォーム</div>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-0 mb-6">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: i <= stepIndex ? "var(--color-primary)" : "rgba(0,200,255,0.1)",
                  color:      i <= stepIndex ? "#07090f"               : "rgba(0,200,255,0.3)",
                  border:     `1px solid ${i <= stepIndex ? "var(--color-primary)" : "rgba(0,200,255,0.15)"}`,
                  transition: "all 0.3s",
                }}
              >
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <div
                className="hud-label mt-1 text-center"
                style={{
                  color: i === stepIndex ? "var(--color-primary)" : "var(--color-fg-muted)",
                  fontSize: 9,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px mx-2 mb-4"
                style={{
                  width: 48,
                  background: i < stepIndex ? "var(--color-primary)" : "rgba(0,200,255,0.1)",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        className="bracket rounded-sm p-5"
        style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.1)" }}
      >
        {step === "form" && (
          <StepForm onNext={handleFormNext} />
        )}
        {step === "verify" && (
          <StepVerify
            userId={userId} email={email} username={username}
            onBack={() => setStep("form")}
            onSuccess={handleVerifySuccess}
          />
        )}
        {step === "done" && <StepDone />}

        {step !== "done" && (
          <div
            className="mt-4 pt-4 text-center text-[12px]"
            style={{ borderTop: "1px solid rgba(0,200,255,0.07)", color: "var(--color-fg-dim)" }}
          >
            既に機関員の方 →{" "}
            <Link href="/login" className="no-underline hover:underline" style={{ color: "var(--color-primary)" }}>
              ログインへ
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 text-center hud-label">
        CLASSIFIED SYSTEM — UNAUTHORIZED ACCESS PROHIBITED
      </div>
    </div>
  );
}
