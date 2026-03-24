/*
 * personnel/[code]/page.tsx — 機関員プロフィールページ
 * Updated: 2026-03-19 04:25 JST — 人物名にIgyouMincho、経歴・日記本文にIseminを適用
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import Link from "next/link";

const S = {
  panel:  "var(--color-bg-surface)",
  border: "rgba(0,200,255,0.08)",
  border2:"rgba(0,200,255,0.22)",
  cyan:   "var(--color-primary)",
  text:   "var(--color-foreground)",
  text2:  "var(--color-fg-dim)",
  text3:  "var(--color-fg-muted)",
  mono:   "var(--font-mono)",
} as const;

const DIVISION_COLOR: Record<string, string> = {
  "収束部門": "#a064ff", "観測部門": "#00c8ff",
  "記録部門": "#50dc78", "技術部門": "#ffb43c", "封印部門": "#ff5252",
};
function divColor(div: string) {
  for (const [k, v] of Object.entries(DIVISION_COLOR)) { if (div.includes(k)) return v; }
  return "#00c8ff";
}

const PSYCH_COLOR: Record<string, string> = {
  "良好": "var(--color-success)", "注意観察": "var(--color-warning)", "要精密検査": "var(--color-danger)"
};

interface PersonnelDetail {
  id: string; name: string; division: string; rank: string;
  age: number; joinDate: string; specialization: string;
  resume: { education: string[]; experience: string[]; achievements: string[]; skills: string[] };
  diary?: { date: string; entry: string }[];
  psychEval?: { lastEval: string; status: string; notes: string };
}

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color }}>{icon}</span>
        <span className="hud-label" style={{ color }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function PersonnelDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [person, setPerson]   = useState<PersonnelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [diaryOpen, setDiaryOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/personnel/${params.code}`);
      if (res.status === 403) { router.push("/forbidden"); return; }
      if (res.status === 404) { router.push("/not-found"); return; }
      if (!res.ok) throw new Error();
      setPerson(await res.json());
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [params.code, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-5 py-7 sm:px-8 max-w-[860px] mx-auto"><LoadingStatus /></div>;
  if (error || !person) return (
    <div className="px-5 py-7 sm:px-8 max-w-[860px] mx-auto">
      <div className="p-6 text-center rounded-sm" style={{ background: S.panel, border: "1px solid rgba(255,68,68,0.2)" }}>
        <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>{error || "機関員が見つかりません"}</p>
        <button onClick={() => router.push("/personnel")} className="text-[12px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ border: `1px solid ${S.border2}`, color: S.text2, background: "transparent" }}>一覧に戻る</button>
      </div>
    </div>
  );

  const col = divColor(person.division);

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[860px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[11px]" style={{ color: S.text3, fontFamily: S.mono }}>
        <Link href="/personnel" style={{ color: S.text3 }} className="hover:opacity-70">PERSONNEL DATABASE</Link>
        <span>›</span><span style={{ color: S.text2 }}>{person.id}</span>
      </div>

      {/* Profile header */}
      <div className="p-5 rounded-sm mb-5" style={{ background: S.panel, border: `1px solid ${col}44`, borderLeft: `4px solid ${col}` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[12px] px-2 py-0.5 rounded-sm font-bold"
                style={{ background: `${col}18`, border: `1px solid ${col}55`, color: col, fontFamily: S.mono }}>
                {person.id}
              </span>
              <span className="hud-label" style={{ color: col }}>{person.rank}</span>
            </div>
            <h1 className="text-[22px] font-bold mb-1" style={{ color: S.text, fontFamily: "var(--font-display)", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>{person.name}</h1>
            <div className="text-[13px]" style={{ color: S.text2 }}>{person.division}</div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <div className="hud-label">年齢: {person.age}歳</div>
            <div className="hud-label">入局: {person.joinDate}</div>
          </div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${col}22` }}>
          <span className="hud-label mr-2" style={{ color: col }}>専門分野</span>
          <span className="text-[13px]" style={{ color: S.text2 }}>{person.specialization}</span>
        </div>
      </div>

      {/* Resume */}
      <div className="p-5 rounded-sm mb-5" style={{ background: S.panel, border: `1px solid ${S.border2}` }}>
        <Section title="経歴" icon="◈" color={col}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education */}
            <div>
              <div className="hud-label mb-2" style={{ color: S.text3 }}>学歴</div>
              <ul className="flex flex-col gap-1">
                {person.resume.education.map((e, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-2" style={{ color: S.text2, fontFamily: "var(--font-ja)", lineHeight: 1.8, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
                    <span style={{ color: col }}>◦</span>{e}
                  </li>
                ))}
              </ul>
            </div>
            {/* Experience */}
            <div>
              <div className="hud-label mb-2" style={{ color: S.text3 }}>職歴</div>
              <ul className="flex flex-col gap-1">
                {person.resume.experience.map((e, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-2" style={{ color: S.text2, fontFamily: "var(--font-ja)", lineHeight: 1.8, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
                    <span style={{ color: col }}>◦</span>{e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <div style={{ borderTop: `1px solid ${S.border}`, margin: "16px 0" }} />

        <Section title="主な実績" icon="◉" color={col}>
          <ul className="flex flex-col gap-1">
            {person.resume.achievements.map((a, i) => (
              <li key={i} className="text-[12px] flex items-start gap-2" style={{ color: S.text2, fontFamily: "var(--font-ja)", lineHeight: 1.8, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
                <span style={{ color: col }}>▸</span>{a}
              </li>
            ))}
          </ul>
        </Section>

        <div style={{ borderTop: `1px solid ${S.border}`, margin: "16px 0" }} />

        <Section title="スキル・資格" icon="⬡" color={col}>
          <div className="flex flex-wrap gap-2">
            {person.resume.skills.map((s, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-sm"
                style={{ background: `${col}10`, border: `1px solid ${col}33`, color: col, fontFamily: S.mono }}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      </div>

      {/* Psych eval (LV2+) */}
      {person.psychEval && (
        <div className="p-5 rounded-sm mb-5" style={{ background: S.panel, border: `1px solid ${S.border2}` }}>
          <Section title="心理評価" icon="◐" color="var(--color-warning)">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "評価日", value: person.psychEval.lastEval },
                { label: "ステータス", value: person.psychEval.status, color: PSYCH_COLOR[person.psychEval.status] },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-sm" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <div className="hud-label mb-1">{label}</div>
                  <div className="text-[13px] font-bold" style={{ color: color ?? S.text2, fontFamily: S.mono }}>{value}</div>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed px-3 py-2 rounded-sm"
              style={{ background: "rgba(255,180,60,0.05)", border: "1px solid rgba(255,180,60,0.15)", color: S.text2 }}>
              {person.psychEval.notes}
            </p>
          </Section>
        </div>
      )}

      {/* Diary (LV2+) */}
      {person.diary && person.diary.length > 0 && (
        <div className="p-5 rounded-sm mb-5" style={{ background: S.panel, border: `1px solid ${S.border2}` }}>
          <Section title="個人記録（閲覧制限：LV2以上）" icon="◇" color="var(--color-fg-dim)">
            <div className="flex flex-col gap-2">
              {person.diary.map((entry, i) => (
                <div key={i} className="rounded-sm overflow-hidden"
                  style={{ border: `1px solid ${diaryOpen === i ? "rgba(0,200,255,0.2)" : S.border}` }}>
                  <button
                    onClick={() => setDiaryOpen(diaryOpen === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer"
                    style={{ background: diaryOpen === i ? "rgba(0,200,255,0.04)" : "transparent" }}>
                    <span className="text-[12px]" style={{ color: S.text2, fontFamily: S.mono }}>{entry.date}</span>
                    <span className="hud-label" style={{ color: S.text3 }}>{diaryOpen === i ? "▲" : "▼"}</span>
                  </button>
                  {diaryOpen === i && (
                    <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid ${S.border}` }}>
                      <p className="text-[13px] leading-relaxed" style={{ color: S.text2, fontFamily: "var(--font-ja)", lineHeight: 1.9, letterSpacing: "0.03em" }}>{entry.entry}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {!person.diary && (
        <div className="p-4 rounded-sm mb-5 text-center" style={{ border: `1px dashed ${S.border2}` }}>
          <p className="hud-label" style={{ color: S.text3 }}>個人記録の閲覧には CLEARANCE LV2 以上が必要です</p>
        </div>
      )}

      <Link href="/personnel" className="text-[12px] px-4 py-2 rounded-sm"
        style={{ border: `1px solid ${S.border2}`, color: S.text2, fontFamily: S.mono }}>
        ← 一覧に戻る
      </Link>
    </div>
  );
}
