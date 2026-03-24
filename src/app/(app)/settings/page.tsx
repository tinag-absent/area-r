"use client";

// ── Web Push 購読状態管理 ─────────────────────────────────────────────
function usePushSubscription() {
  const [supported,  setSupported]  = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.register("/sw.js").then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setSubscribed(!!sub);
      });
    }).catch(() => {});
  }, []);

  async function toggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`, {
            method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
          });
        }
        setSubscribed(false);
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) { alert("VAPID_PUBLIC_KEY が設定されていません"); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: vapidKey,
        });
        const json = sub.toJSON();
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          }),
        });
        setSubscribed(true);
      }
    } catch (e) {
      console.warn("Push toggle error:", e);
    } finally {
      setLoading(false);
    }
  }

  return { supported, subscribed, loading, toggle };
}


import { useState, useEffect, useCallback } from "react";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ─── 型 ──────────────────────────────────────────────────────────────

interface Settings {
  notify_xp:             boolean;
  notify_levelup:        boolean;
  notify_mission:        boolean;
  notify_chat:           boolean;
  notify_system:         boolean;
  privacy_show_activity: boolean;
  privacy_show_division: boolean;
}

// ─── トグルスイッチ ───────────────────────────────────────────────────

function Toggle({
  id, label, description, checked, onChange, disabled,
}: {
  id: string; label: string; description?: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderBottom: "1px solid rgba(0,200,255,0.06)" }}
    >
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-[13px] font-bold block mb-0.5 cursor-pointer"
          style={{ color: disabled ? "var(--color-fg-muted)" : "var(--color-foreground)" }}
        >
          {label}
        </label>
        {description && (
          <p className="m-0 text-[11px] leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="shrink-0 relative rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          width: "40px", height: "22px",
          background: checked ? "var(--color-primary)" : "rgba(0,200,255,0.12)",
          border: `1px solid ${checked ? "rgba(0,200,255,0.6)" : "rgba(0,200,255,0.15)"}`,
          boxShadow: checked ? "0 0 8px rgba(0,200,255,0.3)" : "none",
        }}
      >
        <span
          className="absolute top-[2px] rounded-full transition-all duration-200"
          style={{
            width: "16px", height: "16px",
            background: checked ? "rgba(0,0,0,0.7)" : "rgba(0,200,255,0.3)",
            left: checked ? "20px" : "2px",
          }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

// ─── セクション ───────────────────────────────────────────────────────

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-sm p-5"
      style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}
    >
      <div className="mb-4">
        <div className="hud-label mb-1">{label}</div>
        <h2 className="m-0 text-[15px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────

function PushSection() {
  const { supported, subscribed, loading, toggle } = usePushSubscription();

  if (!supported) {
    return (
      <p className="m-0 text-[12px]" style={{ color: "var(--color-fg-muted)" }}>
        このブラウザはプッシュ通知に対応していません。
      </p>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="text-[13px] font-bold mb-0.5" style={{ color: "var(--color-foreground)" }}>
          ブラウザプッシュ通知
        </div>
        <p className="m-0 text-[11px] leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
          機関からの緊急通達をブラウザ通知で受け取る。
          {subscribed && <span style={{ color: "var(--color-success)", marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="dot" size={8} aria-hidden />有効</span>}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className="shrink-0 relative rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40"
        style={{
          width: "40px", height: "22px",
          background: subscribed ? "var(--color-primary)" : "rgba(0,200,255,0.12)",
          border: `1px solid ${subscribed ? "rgba(0,200,255,0.6)" : "rgba(0,200,255,0.15)"}`,
        }}
        aria-checked={subscribed}
        role="switch"
      >
        <span
          className="absolute top-[2px] rounded-full transition-all duration-200"
          style={{
            width: "16px", height: "16px",
            background: "var(--color-foreground)",
            left: subscribed ? "20px" : "2px",
          }}
        />
      </button>
    </div>
  );
}


export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/me/settings");
      const data = await res.json();
      setSettings({
        notify_xp:             !!data.notify_xp,
        notify_levelup:        !!data.notify_levelup,
        notify_mission:        !!data.notify_mission,
        notify_chat:           !!data.notify_chat,
        notify_system:         !!data.notify_system,
        privacy_show_activity: !!data.privacy_show_activity,
        privacy_show_division: !!data.privacy_show_division,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    setSaving(true); setStatus(null);
    try {
      const res = await fetch("/api/users/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setSettings(settings); // ロールバック
        setStatus({ type: "err", msg: data.error ?? "更新に失敗しました" });
        return;
      }
      setStatus({ type: "ok", msg: "設定を保存しました" });
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setSettings(settings);
      setStatus({ type: "err", msg: "通信エラーが発生しました" });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof Settings) => (v: boolean) => update({ [key]: v });

  if (loading) return (
    <div className="px-5 py-7 sm:px-8 max-w-[720px] mx-auto"><LoadingStatus /></div>
  );
  if (!settings) return null;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[720px] mx-auto">
      {/* ページヘッダー */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="hud-label mb-1">SYSTEM CONFIG</div>
          <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
            設定
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>保存中…</span>
          )}
          {status && (
            <span
              className="text-[12px] px-3 py-1.5 rounded-sm"
              style={{
                color: status.type === "ok" ? "var(--color-success)" : "var(--color-danger)",
                background: status.type === "ok" ? "rgba(62,207,106,0.08)" : "rgba(255,68,68,0.08)",
                border: `1px solid ${status.type === "ok" ? "rgba(62,207,106,0.2)" : "rgba(255,68,68,0.2)"}`,
              }}
            >
              {status.msg}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── 通知設定 ── */}
        <Section label="NOTIFICATIONS" title="通知設定">
          <Toggle
            id="notify_xp"
            label="XP獲得通知"
            description="XPを獲得したときにトースト通知を表示する"
            checked={settings.notify_xp}
            onChange={set("notify_xp")}
            disabled={saving}
          />
          <Toggle
            id="notify_levelup"
            label="レベルアップ通知"
            description="クリアランスレベルが上昇したときに通知する"
            checked={settings.notify_levelup}
            onChange={set("notify_levelup")}
            disabled={saving}
          />
          <Toggle
            id="notify_mission"
            label="ミッション通知"
            description="ミッションの更新・完了時に通知する"
            checked={settings.notify_mission}
            onChange={set("notify_mission")}
            disabled={saving}
          />
          <Toggle
            id="notify_chat"
            label="チャット通知"
            description="チャットの未読メッセージを通知する"
            checked={settings.notify_chat}
            onChange={set("notify_chat")}
            disabled={saving}
          />
          <Toggle
            id="notify_system"
            label="システム通知"
            description="機関からのシステムアラートを受け取る"
            checked={settings.notify_system}
            onChange={set("notify_system")}
            disabled={saving}
          />
        </Section>

        {/* ── Web Push 通知 ── */}
        <Section label="PUSH" title="プッシュ通知">
          <PushSection />
        </Section>

        {/* ── プライバシー設定 ── */}
        <Section label="PRIVACY" title="プライバシー設定">
          <Toggle
            id="privacy_show_activity"
            label="活動履歴を公開"
            description="他のエージェントがあなたの活動ログを閲覧できるようにする"
            checked={settings.privacy_show_activity}
            onChange={set("privacy_show_activity")}
            disabled={saving}
          />
          <Toggle
            id="privacy_show_division"
            label="所属部門を公開"
            description="プロフィールに所属部門を表示する"
            checked={settings.privacy_show_division}
            onChange={set("privacy_show_division")}
            disabled={saving}
          />
        </Section>

        {/* ── アカウント ── */}
        <Section label="ACCOUNT" title="アカウント管理">
          <div className="py-2">
            <p className="m-0 text-[12px] leading-relaxed mb-3" style={{ color: "var(--color-fg-dim)" }}>
              パスキーや秘密の質問の変更は
              <a
                href="/profile"
                className="font-bold mx-1 underline transition-colors"
                style={{ color: "var(--color-primary)" }}
              >
                プロフィールページ
              </a>
              から行えます。
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
}
