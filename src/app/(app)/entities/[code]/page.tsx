"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import Link from "next/link";

const CLS_COLOR: Record<string, string> = {
  safe: "var(--color-success)", caution: "var(--color-warning)",
  danger: "var(--color-danger)", classified: "var(--color-purple, #ce93d8)",
};
const CLS_LABEL: Record<string, string> = {
  safe: "安全", caution: "要注意", danger: "危険", classified: "機密",
};

interface Entity {
  id: string; code: string; name: string;
  classification: string; description: string;
  threat: string; intelligence: string; origin: string;
  appearance: string; behavior: string; containment: string;
}

function RedactedBox({ text }: { text: string }) {
  const isRedacted = text === "???";
  if (!isRedacted) return <span>{text}</span>;
  return (
    <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] tracking-widest"
      style={{ background: "rgba(200,100,255,0.08)", border: "1px solid rgba(200,100,255,0.2)", color: "rgba(200,100,255,0.5)", fontFamily: "var(--font-mono)" }}>
      ████████
    </span>
  );
}

export default function EntityDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [entity, setEntity]   = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/entities/${params.code}`);
      if (res.status === 403) { router.push("/forbidden"); return; }
      if (res.status === 404) { router.push("/not-found"); return; }
      if (!res.ok) throw new Error();
      setEntity(await res.json());
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [params.code, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-5 py-7 sm:px-8 max-w-[860px] mx-auto"><LoadingStatus /></div>;

  if (error || !entity) return (
    <div className="px-5 py-7 sm:px-8 max-w-[860px] mx-auto">
      <div className="p-6 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}>
        <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>{error || "エンティティが見つかりません"}</p>
        <button onClick={() => router.push("/entities")} className="text-[12px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", background: "transparent" }}>
          一覧に戻る
        </button>
      </div>
    </div>
  );

  const col = CLS_COLOR[entity.classification] ?? "var(--color-primary)";
  const isClassified = entity.classification === "classified" && entity.name === "███████";

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[860px] mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[11px]" style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
        <Link href="/entities" style={{ color: "var(--color-fg-muted)" }} className="hover:opacity-70">ENTITY CATALOG</Link>
        <span>›</span>
        <span style={{ color: "var(--color-fg-dim)" }}>{entity.code}</span>
      </div>

      {/* Header */}
      <div className="p-5 rounded-sm mb-5" style={{ background: "var(--color-bg-surface)", border: `1px solid ${col}44`, borderLeft: `4px solid ${col}` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-sm text-[13px] font-bold" style={{ background: `${col}18`, border: `1px solid ${col}55`, color: col, fontFamily: "var(--font-mono)" }}>
              {entity.code}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-sm"
              style={{ background: `${col}18`, border: `1px solid ${col}55`, color: col, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
              {CLS_LABEL[entity.classification] ?? entity.classification}
            </span>
          </div>
        </div>

        {isClassified ? (
          <div className="py-4">
            <div className="text-[28px] font-bold tracking-[0.3em] mb-2" style={{ color: "rgba(200,100,255,0.4)", fontFamily: "var(--font-mono)" }}>
              ███████████
            </div>
            <p className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>{entity.description}</p>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-bold mb-2" style={{ color: "var(--color-foreground)", letterSpacing: "0.03em" }}>{entity.name}</h1>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>{entity.description}</p>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "脅威度",   value: entity.threat },
          { label: "知性レベル", value: entity.intelligence },
          { label: "出現源",   value: entity.origin },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-sm text-center" style={{ background: "var(--color-bg-surface)", border: `1px solid ${col}22` }}>
            <div className="hud-label mb-2" style={{ color: col }}>{label}</div>
            <div className="text-[14px] font-bold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}>
              <RedactedBox text={value} />
            </div>
          </div>
        ))}
      </div>

      {/* Detail fields */}
      <div className="flex flex-col gap-4 mb-6">
        {[
          { label: "外観", value: entity.appearance, icon: "◈" },
          { label: "行動傾向", value: entity.behavior, icon: "◉" },
          { label: "収容・無力化方法", value: entity.containment, icon: "⬡" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="p-4 rounded-sm" style={{ background: "var(--color-bg-surface)", border: `1px solid ${col}22` }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: col }}>{icon}</span>
              <span className="hud-label" style={{ color: col }}>{label}</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
              <RedactedBox text={value} />
            </p>
          </div>
        ))}
      </div>

      <Link href="/entities" className="text-[12px] px-4 py-2 rounded-sm"
        style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
        ← 一覧に戻る
      </Link>
    </div>
  );
}
