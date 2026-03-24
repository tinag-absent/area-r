/*
 * CodexClient.tsx — コーデックスクライアント
 * Updated: 2026-03-19 04:25 JST — 見出しにIgyouMincho、本文にIseminを適用
 */
"use client";

import { useState, useId, useEffect, useCallback } from "react";
import { type CodexSection, type CodexEntry } from "./data";
import { Icon, NavIcon } from "@/components/ui/Icon";
import { type DIVISIONS } from "@/lib/constants";

type Division = typeof DIVISIONS[number];

// ─── 本文レンダラー ───────────────────────────────────────────────────

function BodyRenderer({ body }: { body: string }) {
  const lines = body.split("\n");
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1" aria-hidden="true" />;
        const isHeading = line.trimStart().startsWith("【") && line.includes("】");
        const parts = line.split(/(█+)/g);
        const rendered = parts.map((p, j) =>
          /^█+$/.test(p)
            ? <span key={j} className="inline-block align-middle rounded-sm px-1 select-none font-mono"
                style={{ background: "rgba(0,0,0,0.85)", color: "transparent", border: "1px solid rgba(255,255,255,0.04)", fontSize: "12px", userSelect: "none" }}
                aria-label="機密情報（黒塗り）">{p}</span>
            : <span key={j}>{p}</span>
        );
        return (
          <p key={i} className="m-0 break-words leading-[1.9] text-[13px]"
            style={{
              color:         isHeading ? "var(--color-foreground)" : "var(--color-fg-dim)",
              fontWeight:    isHeading ? "700" : "400",
              fontFamily:    isHeading ? "var(--font-display)" : "var(--font-ja)",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
              letterSpacing: isHeading ? "0.06em" : "0.03em",
              fontSize:      isHeading ? "14px" : "13px",
            }}>
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

// ─── エントリアコーディオン（内側） ──────────────────────────────────

function EntryAccordion({ entry, accentColor, forceOpen }: {
  entry: CodexEntry; accentColor: string; forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen !== undefined ? forceOpen : open;
  const headingId = useId();
  const panelId   = useId();

  return (
    <div className="rounded-sm overflow-hidden transition-all duration-200"
      style={{
        border:     `1px solid ${isOpen ? `${accentColor}30` : "rgba(0,200,255,0.06)"}`,
        background: isOpen ? `linear-gradient(135deg, ${accentColor}05 0%, transparent 60%)` : "var(--color-bg-raised)",
      }}>
      <button id={headingId} aria-expanded={isOpen} aria-controls={panelId}
        onClick={() => forceOpen === undefined && setOpen(v => !v)}
        className="w-full text-left flex items-start gap-3 px-4 py-3.5 cursor-pointer"
        style={{ background: "none", border: "none" }}>
        <span className="shrink-0 text-[10px] mt-0.5 font-mono transition-transform duration-200"
          style={{ color: isOpen ? accentColor : "var(--color-fg-muted)", transform: isOpen ? "rotate(90deg)" : "none", display: "inline-block" }}
          aria-hidden="true"><Icon name="play" size={12} aria-hidden /></span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold leading-snug"
            style={{ color: isOpen ? "var(--color-foreground)" : "var(--color-fg-dim)" }}>
            {entry.title}
          </div>
          {entry.subtitle && <div className="hud-label mt-0.5">{entry.subtitle}</div>}
          {!isOpen && entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {entry.tags.map(tag => (
                <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm font-mono"
                  style={{ color: "var(--color-fg-muted)", border: "1px solid rgba(0,200,255,0.08)" }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        {entry.clearance > 0 && (
          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-sm font-mono"
            style={{ color: "var(--color-warning)", background: "rgba(255,180,60,0.06)", border: "1px solid rgba(255,180,60,0.18)" }}>
            LV{entry.clearance}
          </span>
        )}
      </button>
      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={headingId}
          className="px-4 pb-5 pt-1" style={{ borderTop: `1px solid ${accentColor}15` }}>
          <BodyRenderer body={entry.body} />
        </div>
      )}
    </div>
  );
}

// ─── セクションアコーディオン（外側） ────────────────────────────────

function SectionAccordion({ section, forceOpen, defaultOpen }: {
  section: CodexSection; forceOpen?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const isOpen = forceOpen !== undefined ? forceOpen : open;
  const headingId = useId();
  const panelId   = useId();

  return (
    <div className="rounded-sm overflow-hidden"
      style={{
        border:     `1px solid ${isOpen ? `${section.color}30` : "rgba(0,200,255,0.08)"}`,
        borderLeft: `3px solid ${isOpen ? section.color : `${section.color}40`}`,
        background: "var(--color-bg-surface)",
        transition: "border-color 0.2s",
      }}>
      <button id={headingId} aria-expanded={isOpen} aria-controls={panelId}
        onClick={() => forceOpen === undefined && setOpen(v => !v)}
        className="w-full text-left flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-150"
        style={{ background: "none", border: "none" }}
        onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.02)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
        <span className="shrink-0 text-[16px]" style={{ color: section.color }} aria-hidden="true">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="hud-label">{section.label}</div>
          <div className="text-[15px] font-bold mt-0.5" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
            {section.title}
          </div>
        </div>
        <span className="hud-label shrink-0">{section.entries.length}件</span>
        <span className="shrink-0 text-[12px] font-mono transition-transform duration-200"
          style={{ color: section.color, transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block" }}
          aria-hidden="true">▼</span>
      </button>
      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={headingId}
          className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${section.color}15` }}>
          {section.entries.map(entry => (
            <EntryAccordion key={entry.id} entry={entry} accentColor={section.color} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 部門セクション ───────────────────────────────────────────────────

function DivisionsSection({
  divisions, memberCounts, myDivisionId,
}: {
  divisions: Division[];
  memberCounts: Record<string, number>;
  myDivisionId: string | null;
}) {
  const [open, setOpen] = useState(true);
  const headingId = useId();
  const panelId   = useId();

  return (
    <div className="rounded-sm overflow-hidden transition-all duration-200"
      style={{
        border:     `1px solid ${open ? "rgba(0,200,255,0.18)" : "rgba(0,200,255,0.07)"}`,
        background: open ? "linear-gradient(135deg, rgba(0,200,255,0.03) 0%, transparent 60%)" : "transparent",
      }}>
      <button id={headingId} aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
        className="w-full text-left flex items-center gap-3 px-5 py-4 cursor-pointer"
        style={{ background: "none", border: "none" }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.02)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
        <span className="shrink-0 text-[16px]" style={{ color: "var(--color-primary)" }} aria-hidden="true">◈</span>
        <div className="flex-1 min-w-0">
          <div className="hud-label">ORGANIZATION</div>
          <div className="text-[15px] font-bold mt-0.5"
            style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>部門一覧</div>
        </div>
        <span className="hud-label shrink-0">{divisions.length}部門</span>
        <span className="shrink-0 text-[12px] font-mono transition-transform duration-200"
          style={{ color: "var(--color-primary)", transform: open ? "rotate(180deg)" : "none", display: "inline-block" }}
          aria-hidden="true">▼</span>
      </button>

      {open && (
        <div id={panelId} role="region" aria-labelledby={headingId}
          className="px-4 pb-4 flex flex-col gap-3"
          style={{ borderTop: "1px solid rgba(0,200,255,0.1)" }}>
          <div className="grid grid-cols-1 gap-3 mt-3">
            {divisions.map(div => {
              const isMine = div.id === myDivisionId;
              const count  = memberCounts[div.id] ?? 0;
              return (
                <div key={div.id} className="p-4 rounded-sm"
                  style={{
                    background: "var(--color-bg-raised)",
                    border: `1px solid ${isMine ? div.color + "55" : "rgba(0,200,255,0.06)"}`,
                    borderLeft: `3px solid ${div.color}`,
                    boxShadow: isMine ? `0 0 12px ${div.color}18` : "none",
                  }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      {isMine && (
                        <div className="hud-label mb-1" style={{ color: div.color, letterSpacing: "0.12em" }}>
                          ◈ 所属部門
                        </div>
                      )}
                      <div className="text-[14px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
                        {div.name}
                      </div>
                      <div className="hud-label mt-0.5" style={{ color: div.color }}>{div.name_en}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[18px] font-bold" style={{ color: div.color, fontFamily: "var(--font-mono)" }}>{count}</div>
                      <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>機関員</div>
                    </div>
                  </div>
                  <div className="text-[12px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
                    {div.description}
                  </div>
                  <div className="mt-2 hud-label" style={{ color: "var(--color-fg-muted)" }}>ID: {div.id}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── ロックセクション ─────────────────────────────────────────────────

function LockedSection({ title, label, requiredLevel }: { title: string; label: string; requiredLevel: number }) {
  return (
    <div className="rounded-sm px-5 py-4 flex items-center gap-3 select-none"
      style={{ border: "1px dashed rgba(0,200,255,0.06)", borderLeft: "3px solid rgba(0,200,255,0.06)", opacity: 0.4 }}>
      <Icon name="lock" size={16} color="var(--color-fg-decorative)" aria-hidden />
      <div className="flex-1">
        <div className="hud-label">{label}</div>
        <div className="text-[14px] font-bold" style={{ color: "var(--color-fg-muted)", letterSpacing: "0.04em" }}>{title}</div>
      </div>
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm font-mono"
        style={{ color: "var(--color-fg-muted)", border: "1px solid rgba(0,200,255,0.08)" }}>
        CLEARANCE LV{requiredLevel}
      </span>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────

export function CodexClient({ level, divisions, memberCounts, myDivisionId }: {
  level: number;
  divisions: Division[];
  memberCounts: Record<string, number>;
  myDivisionId: string | null;
}) {
  const [sections,  setSections]  = useState<CodexSection[]>([]);
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  const loadSections = useCallback(async () => {
    try {
      const res = await fetch("/api/codex", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) setSections(await res.json());
    } catch { /* noop */ }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  const accessible = sections.filter(s => s.clearance <= level);
  const locked     = sections.filter(s => s.clearance > level);

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[800px] mx-auto">
      {/* ページヘッダー */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="hud-label mb-1">WORLD CODEX</div>
          <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
            コーデックス
          </h1>
          <p className="m-0 text-[12px] mt-1 leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
            海蝕機関の世界観・組織・現象に関する公式記録。
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setExpandAll(true)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-sm font-mono cursor-pointer transition-all duration-150"
            style={{ color: "var(--color-fg-dim)", background: "transparent", border: "1px solid rgba(0,200,255,0.12)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.12)"; }}>
            ▼ すべて展開
          </button>
          <button
            onClick={() => setExpandAll(false)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-sm font-mono cursor-pointer transition-all duration-150"
            style={{ color: "var(--color-fg-dim)", background: "transparent", border: "1px solid rgba(0,200,255,0.12)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,255,0.12)"; }}>
            ▲ すべて閉じる
          </button>
        </div>
      </div>

      {/* セクション */}
      <div className="flex flex-col gap-3">
        {/* 部門セクション（常にLV0でアクセス可能） */}
        <DivisionsSection
          divisions={divisions}
          memberCounts={memberCounts}
          myDivisionId={myDivisionId}
        />
        {accessible.map((section, i) => (
          <SectionAccordion
            key={section.id}
            section={section}
            forceOpen={expandAll}
            defaultOpen={expandAll === undefined && i === 0}
          />
        ))}
        {locked.map(s => (
          <LockedSection key={s.id} title={s.title} label={s.label} requiredLevel={s.clearance} />
        ))}
      </div>

      <div className="mt-8 pt-5 text-center hud-label"
        style={{ borderTop: "1px solid rgba(0,200,255,0.06)", color: "var(--color-fg-decorative)" }}>
        ——— KAISHOKU WORLD CODEX / CLEARANCE LV{level} ———
      </div>
    </div>
  );
}
