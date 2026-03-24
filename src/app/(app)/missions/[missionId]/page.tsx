"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import Link from "next/link";

const S = {
  bg:     "var(--color-bg)",
  panel:  "var(--color-bg-surface)",
  border: "rgba(0,200,255,0.08)",
  border2:"rgba(0,200,255,0.22)",
  cyan:   "var(--color-primary)",
  red:    "var(--color-danger)",
  yellow: "var(--color-warning)",
  green:  "var(--color-success)",
  text:   "var(--color-foreground)",
  text2:  "var(--color-fg-dim)",
  text3:  "var(--color-fg-muted)",
  mono:   "var(--font-mono, 'Share Tech Mono', monospace)",
} as const;

const STATUS_LABEL: Record<string, string> = { active: "対応中", monitoring: "監視中", completed: "収束済み" };
const STATUS_COLOR: Record<string, string> = { active: "var(--color-danger)", monitoring: "var(--color-warning)", completed: "var(--color-success)" };
const CATEGORY_LABEL: Record<string, string> = { critical: "重大", standard: "標準", support: "支援" };
const CATEGORY_COLOR: Record<string, string> = { critical: "var(--color-danger)", standard: "var(--color-primary)", support: "var(--color-success)" };
const PART_STATUS_LABEL: Record<string, string> = { pending: "審査中", approved: "承認済", rejected: "却下", completed: "完了" };
const PART_STATUS_COLOR: Record<string, string> = { pending: "var(--color-warning)", approved: "var(--color-primary)", rejected: "var(--color-danger)", completed: "var(--color-success)" };

function fmtDate(raw: string | null) {
  if (!raw) return "—";
  return new Date(raw.replace(" ", "T") + "Z")
    .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface Mission {
  id: string; title: string; description: string | null;
  category: string; status: string; required_level: number;
  xp_reward: number; phase: number; assigned_division: string | null;
  issued_by: string | null; issued_at: string | null; deadline_at: string | null;
  participantCount: number;
  myParticipation: {
    id: string; status: string; applied_at: string;
    reviewed_at: string | null; completed_at: string | null; note: string | null;
  } | null;
}

export default function MissionDetailPage() {
  const params  = useParams<{ missionId: string }>();
  const router  = useRouter();
  const [mission, setMission]   = useState<Mission | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [applying, setApplying] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast]       = useState("");

  const missionId = params.missionId;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/missions/${missionId}`);
      if (res.status === 403) { router.push("/forbidden"); return; }
      if (res.status === 404) { router.push("/not-found"); return; }
      if (!res.ok) throw new Error();
      setMission(await res.json());
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [missionId, router]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/apply`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? "申請に失敗しました");
        return;
      }
      showToast("参加申請を送信しました。承認をお待ちください。");
      load();
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    setApplying(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/apply`, { method: "DELETE" });
      if (!res.ok) { showToast("取り消しに失敗しました"); return; }
      showToast("申請を取り消しました");
      load();
    } finally {
      setApplying(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/complete`, { method: "POST" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error ?? "完了報告に失敗しました"); return; }
      const d = await res.json();
      showToast(`ミッション完了！ +${d.xpGained} XP${d.leveledUp ? ` → LEVEL ${d.newLevel}` : ""}`);
      load();
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="px-5 py-7 sm:px-8 max-w-[860px] mx-auto"><LoadingStatus /></div>;

  if (error || !mission) return (
    <div className="px-5 py-7 sm:px-8 max-w-[860px] mx-auto">
      <div className="p-6 text-center rounded-sm" style={{ background: S.panel, border: "1px solid rgba(255,68,68,0.2)" }}>
        <p className="text-[13px] mb-3" style={{ color: S.red }}>{error || "ミッションが見つかりません"}</p>
        <button onClick={() => router.push("/missions")} className="text-[12px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ border: `1px solid ${S.border2}`, color: S.text2, background: "transparent", fontFamily: S.mono }}>
          一覧に戻る
        </button>
      </div>
    </div>
  );

  const sColor = STATUS_COLOR[mission.status] ?? S.cyan;
  const cColor = CATEGORY_COLOR[mission.category] ?? S.cyan;
  const mp = mission.myParticipation;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[860px] mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-sm text-[13px] max-w-[340px]"
          style={{ background: "rgba(0,200,255,0.12)", border: "1px solid rgba(0,200,255,0.4)", color: S.cyan, fontFamily: S.mono, backdropFilter: "blur(8px)" }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[11px]" style={{ color: S.text3, fontFamily: S.mono }}>
        <Link href="/missions" style={{ color: S.text3 }} className="hover:opacity-70">MISSION DATABASE</Link>
        <span>›</span>
        <span style={{ color: S.text2 }}>{mission.id}</span>
      </div>

      {/* ヘッダー */}
      <div className="p-5 rounded-sm mb-5" style={{ background: S.panel, border: `1px solid ${S.border2}`, borderLeft: `4px solid ${cColor}` }}>
        <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-sm" style={{ background: `${cColor}18`, border: `1px solid ${cColor}55`, color: cColor, fontFamily: S.mono, letterSpacing: "0.1em" }}>
              {CATEGORY_LABEL[mission.category] ?? mission.category}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm" style={{ background: `${sColor}18`, border: `1px solid ${sColor}55`, color: sColor, fontFamily: S.mono, letterSpacing: "0.1em" }}>
              {STATUS_LABEL[mission.status] ?? mission.status}
            </span>
            <span className="hud-label" style={{ color: S.text3 }}>PHASE {mission.phase}</span>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-bold" style={{ color: S.green, fontFamily: S.mono }}>+{mission.xp_reward} XP</div>
            <div className="hud-label" style={{ color: S.text3 }}>LV{mission.required_level}+ 必須</div>
          </div>
        </div>

        <h1 className="text-[20px] font-bold mb-1" style={{ color: S.text, letterSpacing: "0.03em" }}>{mission.title}</h1>
        <div className="hud-label mb-4" style={{ color: S.text3 }}>{mission.id}</div>

        {mission.description && (
          <p className="text-[13px] leading-relaxed" style={{ color: S.text2 }}>{mission.description}</p>
        )}
      </div>

      {/* メタ情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { label: "担当部門",   value: mission.assigned_division ?? "—" },
          { label: "発令元",     value: mission.issued_by ?? "—" },
          { label: "参加人数",   value: `${mission.participantCount} 名` },
          { label: "発令日時",   value: fmtDate(mission.issued_at) },
          { label: "期限",       value: fmtDate(mission.deadline_at) },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-sm" style={{ background: S.panel, border: `1px solid ${S.border}` }}>
            <div className="hud-label mb-1">{label}</div>
            <div className="text-[13px]" style={{ color: S.text2, fontFamily: S.mono }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 参加状態 & アクション */}
      <div className="p-5 rounded-sm mb-5" style={{ background: S.panel, border: `1px solid ${S.border2}` }}>
        <div className="hud-label mb-3">参加ステータス</div>

        {!mp && mission.status !== "completed" && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px]" style={{ color: S.text2 }}>このミッションへの参加を申請できます。承認後に参加が確定します。</p>
            <button onClick={handleApply} disabled={applying}
              className="px-5 py-2.5 rounded-sm text-[13px] font-bold cursor-pointer disabled:opacity-50"
              style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.4)", color: S.cyan, fontFamily: S.mono, letterSpacing: "0.05em" }}>
              {applying ? "送信中..." : "参加申請"}
            </button>
          </div>
        )}

        {mp && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] px-2.5 py-1 rounded-sm"
                style={{ background: `${PART_STATUS_COLOR[mp.status]}18`, border: `1px solid ${PART_STATUS_COLOR[mp.status]}55`, color: PART_STATUS_COLOR[mp.status], fontFamily: S.mono, letterSpacing: "0.1em" }}>
                {PART_STATUS_LABEL[mp.status] ?? mp.status}
              </span>
              <span className="hud-label" style={{ color: S.text3 }}>申請日: {fmtDate(mp.applied_at)}</span>
            </div>

            {mp.note && (
              <p className="text-[12px] px-3 py-2 rounded-sm mb-3" style={{ background: "rgba(255,180,60,0.06)", border: "1px solid rgba(255,180,60,0.2)", color: S.yellow }}>
                {mp.note}
              </p>
            )}

            {mp.status === "pending" && (
              <button onClick={handleCancel} disabled={applying}
                className="px-4 py-2 rounded-sm text-[12px] cursor-pointer disabled:opacity-50"
                style={{ background: "transparent", border: "1px solid rgba(255,68,68,0.3)", color: S.red, fontFamily: S.mono }}>
                {applying ? "処理中..." : "申請を取り消す"}
              </button>
            )}

            {mp.status === "approved" && mission.status === "active" && (
              <button onClick={handleComplete} disabled={completing}
                className="px-5 py-2.5 rounded-sm text-[13px] font-bold cursor-pointer disabled:opacity-50"
                style={{ background: "rgba(80,220,120,0.1)", border: "1px solid rgba(80,220,120,0.4)", color: S.green, fontFamily: S.mono, letterSpacing: "0.05em" }}>
                {completing ? "処理中..." : "✓ ミッション完了を報告"}
              </button>
            )}
          </div>
        )}

        {mission.status === "completed" && (
          <p className="text-[13px]" style={{ color: S.text3 }}>このミッションは収束済みです。</p>
        )}
      </div>

      <div className="flex justify-start">
        <Link href="/missions" className="text-[12px] px-4 py-2 rounded-sm"
          style={{ border: `1px solid ${S.border2}`, color: S.text2, fontFamily: S.mono }}>
          ← 一覧に戻る
        </Link>
      </div>
    </div>
  );
}
