"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { ACHIEVEMENTS_MASTER } from "@/lib/achievements-data";
import { Icon, NavIcon } from "@/components/ui/Icon";

interface EarnedAchievement {
  key: string; title: string; description: string;
  icon: string | null; xp_reward: number; earned_at: string;
}

function fmtDate(raw: string) {
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function EarnedCard({ a }: { a: EarnedAchievement }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-sm"
      style={{
        background: "linear-gradient(135deg, rgba(62,207,106,0.05) 0%, transparent 100%)",
        border: "1px solid rgba(62,207,106,0.2)",
        borderLeft: "3px solid rgba(62,207,106,0.55)",
      }}>
      <div className="shrink-0 w-10 h-10 rounded-sm flex items-center justify-center text-[20px]"
        style={{ background: "rgba(62,207,106,0.1)", border: "1px solid rgba(62,207,106,0.2)" }}>
        <NavIcon icon={a.icon ?? "entity"} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[13px] font-bold" style={{ color: "var(--color-foreground)" }}>
            {a.title}
          </div>
          {a.xp_reward > 0 && (
            <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-sm"
              style={{ color: "var(--color-success)", background: "rgba(62,207,106,0.1)", border: "1px solid rgba(62,207,106,0.2)" }}>
              +{a.xp_reward} XP
            </span>
          )}
        </div>
        <div className="text-[12px] leading-relaxed mb-1.5" style={{ color: "var(--color-fg-dim)" }}>
          {a.description}
        </div>
        <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
          解除日: {fmtDate(a.earned_at)}
        </div>
      </div>
    </div>
  );
}

function LockedCard({ def, isSecret }: { def: { key: string; title: string; description: string; icon: string; xp_reward: number; is_secret: number }; isSecret: boolean }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-sm opacity-50"
      style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.07)", borderLeft: "3px solid rgba(0,200,255,0.1)" }}>
      <div className="shrink-0 w-10 h-10 rounded-sm flex items-center justify-center text-[20px]"
        style={{ background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.08)" }}>
        <NavIcon icon={isSecret ? "lock" : (def.icon ?? "entity")} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[13px] font-bold" style={{ color: "var(--color-fg-dim)" }}>
            {isSecret ? "???" : def.title}
          </div>
          {def.xp_reward > 0 && !isSecret && (
            <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-sm"
              style={{ color: "var(--color-fg-muted)", border: "1px solid rgba(0,200,255,0.1)" }}>
              +{def.xp_reward} XP
            </span>
          )}
        </div>
        <div className="text-[12px] leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
          {isSecret ? "— 秘密の実績 —" : def.description}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [earned, setEarned]   = useState<EarnedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [tab, setTab]         = useState<"earned" | "all">("earned");

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/users/me/achievements");
      if (!res.ok) throw new Error();
      setEarned(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await fetch("/api/users/me/achievements/check", { method: "POST" });
      await load();
    } finally {
      setChecking(false);
    }
  };

  const earnedKeys  = new Set(earned.map(a => a.key));
  const visibleDefs = ACHIEVEMENTS_MASTER.filter(d => !d.is_secret || earnedKeys.has(d.key));
  const lockedDefs  = visibleDefs.filter(d => !earnedKeys.has(d.key));
  const secretCount = ACHIEVEMENTS_MASTER.filter(d => d.is_secret && !earnedKeys.has(d.key)).length;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[720px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="hud-label mb-1">MERIT RECORD</div>
          <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
            実績
          </h1>
        </div>
        <button onClick={handleCheck} disabled={checking}
          className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer disabled:opacity-50"
          style={{ background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
          {checking ? "確認中..." : "実績を確認"}
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "解除済み", value: earned.length, color: "var(--color-success)" },
            { label: "未解除",   value: lockedDefs.length, color: "var(--color-fg-dim)" },
            { label: "秘密",     value: secretCount, color: "var(--color-warning)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 text-center rounded-sm"
              style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.1)" }}>
              <div className="text-[22px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
              <div className="hud-label mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["earned", "all"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer"
            style={{
              fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
              background: tab === t ? "rgba(0,200,255,0.1)" : "transparent",
              border: `1px solid ${tab === t ? "rgba(0,200,255,0.4)" : "rgba(0,200,255,0.12)"}`,
              color: tab === t ? "var(--color-primary)" : "var(--color-fg-dim)",
            }}>
            {t === "earned" ? "解除済み" : "すべて"}
          </button>
        ))}
      </div>

      {loading && <LoadingStatus />}

      {!loading && error && (
        <div className="rounded-sm p-5 text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}>
          <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>取得に失敗しました</p>
          <button onClick={load} className="text-[12px] px-4 py-1.5 rounded-sm cursor-pointer"
            style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", background: "transparent" }}>
            再試行
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Earned tab */}
          {tab === "earned" && (
            <>
              {earned.length === 0 ? (
                <div className="rounded-sm p-10 text-center"
                  style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
                  <div className="mb-3 opacity-15"><Icon name="star" size={28} aria-hidden /></div>
                  <div className="text-[13px] mb-1" style={{ color: "var(--color-fg-dim)" }}>
                    まだ実績を解除していません
                  </div>
                  <div className="hud-label">活動を続けて実績を解除してください</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {earned.map(a => <EarnedCard key={a.key} a={a} />)}
                </div>
              )}
            </>
          )}

          {/* All tab */}
          {tab === "all" && (
            <div className="flex flex-col gap-3">
              {/* Earned first */}
              {earned.map(a => <EarnedCard key={a.key} a={a} />)}
              {/* Locked visible */}
              {lockedDefs.map(d => <LockedCard key={d.key} def={d} isSecret={false} />)}
              {/* Secret placeholder */}
              {secretCount > 0 && (
                <LockedCard
                  def={{ key: "__secret__", title: "???", description: "秘密の実績", icon: "?", xp_reward: 0, is_secret: 1 }}
                  isSecret={true}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
