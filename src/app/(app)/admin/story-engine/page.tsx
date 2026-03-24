"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";

interface Flag { flag_key: string; flag_value: string; set_at: string; }
interface FiredEvent { event_id: string; fired_at: string; }
interface UserInfo { agent_id: string; username: string; clearance_level: number; xp_total: number; }

export default function StoryEnginePage() {
  const [userQuery, setUserQuery] = useState("");
  const [userId, setUserId]       = useState("");
  const [userInfo, setUserInfo]   = useState<UserInfo | null>(null);
  const [flags, setFlags]         = useState<Flag[]>([]);
  const [fired, setFired]         = useState<FiredEvent[]>([]);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState("");

  // フラグ操作フォーム
  const [newFlagKey, setNewFlagKey]   = useState("");
  const [newFlagVal, setNewFlagVal]   = useState("true");
  const [xpAmount, setXpAmount]       = useState("");

  const loadUser = useCallback(async () => {
    if (!userId.trim()) return;
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`/api/admin/story-engine?userId=${encodeURIComponent(userId)}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) { setMsg("ユーザーが見つかりません"); setUserInfo(null); return; }
      const data = await res.json();
      setUserInfo(data.user);
      setFlags(data.flags ?? []);
      setFired(data.firedEvents ?? []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  async function doAction(action: string, extra: Record<string, unknown> = {}) {
    setMsg("");
    const res = await fetch("/api/admin/story-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(`エラー: ${data.error}`); return; }
    setMsg(`✓ ${action} 完了`);
    loadUser();
  }

  function fmtTime(raw: string) {
    return new Date(raw.replace(" ", "T") + "Z").toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[880px] mx-auto">
      <PageHeader eyebrow="ADMIN — STORY ENGINE" title="ストーリーエンジン管理" eyebrowColor="warning" />

      {/* ユーザー検索 */}
      <div className="flex gap-3 mb-6">
        <input value={userId} onChange={e => setUserId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && loadUser()}
          placeholder="ユーザーID (uuid) を入力..."
          className="flex-1 text-[12px] px-3 py-2 rounded-sm"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.2)",
            color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
        <button onClick={loadUser}
          className="text-[11px] px-4 py-2 rounded-sm cursor-pointer"
          style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)",
            color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
          読み込み
        </button>
      </div>

      {loading && <LoadingStatus />}

      {msg && (
        <div className="p-3 mb-4 rounded-sm text-[12px]"
          style={{ background: msg.startsWith("✓") ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
            border: `1px solid ${msg.startsWith("✓") ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
            color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)" }}>
          {msg}
        </div>
      )}

      {!loading && userInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* ユーザー情報 */}
          <div className="rounded-sm p-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.12)" }}>
            <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>ユーザー情報</div>
            {[
              { label: "AGENT ID", value: userInfo.agent_id },
              { label: "USERNAME", value: userInfo.username },
              { label: "LEVEL",    value: `LV${userInfo.clearance_level}` },
              { label: "XP",       value: Number(userInfo.xp_total).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{label}</span>
                <span className="text-[12px]" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}>{value}</span>
              </div>
            ))}

            {/* XP調整 */}
            <div className="mt-4">
              <div className="hud-label mb-2" style={{ color: "var(--color-warning)" }}>XP調整</div>
              <div className="flex gap-2">
                <input type="number" value={xpAmount} onChange={e => setXpAmount(e.target.value)}
                  placeholder="±XP" className="flex-1 text-[12px] px-2 py-1.5 rounded-sm"
                  style={{ background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
                    color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
                <button onClick={() => xpAmount && doAction("add_xp", { xp: Number(xpAmount) })}
                  disabled={!xpAmount}
                  className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
                  style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
                    color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                  適用
                </button>
              </div>
            </div>
          </div>

          {/* フラグ管理 */}
          <div className="rounded-sm p-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.12)" }}>
            <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>
              フラグ管理 ({flags.length}件)
            </div>

            {/* フラグ追加 */}
            <div className="flex gap-2 mb-3">
              <input value={newFlagKey} onChange={e => setNewFlagKey(e.target.value)}
                placeholder="flag_key" className="flex-1 text-[11px] px-2 py-1.5 rounded-sm"
                style={{ background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
                  color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
              <input value={newFlagVal} onChange={e => setNewFlagVal(e.target.value)}
                placeholder="value" className="w-20 text-[11px] px-2 py-1.5 rounded-sm"
                style={{ background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
                  color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
              <button
                onClick={() => newFlagKey && doAction("set_flag", { flagKey: newFlagKey, flagValue: newFlagVal })}
                disabled={!newFlagKey}
                className="text-[11px] px-2 py-1.5 rounded-sm cursor-pointer"
                style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)",
                  color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                SET
              </button>
            </div>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {flags.length === 0
                ? <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>フラグなし</div>
                : flags.map(f => (
                  <div key={f.flag_key} className="flex items-center gap-2 py-1 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <span className="text-[11px] flex-1 truncate" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                      {f.flag_key}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--color-fg-dim)" }}>{f.flag_value}</span>
                    <button onClick={() => doAction("delete_flag", { flagKey: f.flag_key })}
                      className="text-[10px] px-1.5 py-0.5 rounded-sm cursor-pointer"
                      style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)",
                        color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>✕</button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* 発火済みイベント */}
          <div className="sm:col-span-2 rounded-sm p-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.12)" }}>
            <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>
              発火済みイベント ({fired.length}件)
            </div>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {fired.length === 0
                ? <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>なし</div>
                : fired.map(e => (
                  <div key={e.event_id} className="flex items-center gap-3 py-1 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <span className="text-[11px] flex-1" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                      {e.event_id}
                    </span>
                    <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{fmtTime(e.fired_at)}</span>
                    <button onClick={() => doAction("reset_fired_event", { eventId: e.event_id })}
                      className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                      style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)",
                        color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                      リセット
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
