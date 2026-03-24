"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatusBadge, ThreatBadge, EmptyState } from "@/components/ui";
import {
  type TabId, type Facility, type Entity,
  type Equipment, type Personnel,
} from "../database/data";
import type { Mission } from "@/types/api";

type AnyRecord = Mission | Facility | Entity | Equipment | Personnel;
interface IndexEntry { tab: TabId; record: AnyRecord; clearance: number; }

const TAB_META: Record<TabId, { icon: string; label: string }> = {
  missions:   { icon: "entity", label: "ミッション" },
  facilities: { icon: "hex", label: "施設" },
  entities:   { icon: "chat", label: "エンティティ" },
  equipment:  { icon: "dashboard", label: "装備" },
  personnel:  { icon: "notify", label: "人事ファイル" },
  modules:    { icon: "hex", label: "モジュール" },
  search:     { icon: "search", label: "検索" },
};

function getTitle(tab: TabId, r: AnyRecord): string {
  switch (tab) {
    case "missions":   return (r as Mission).title;
    case "facilities": return (r as Facility).name;
    case "entities":   return (r as Entity).designation;
    case "equipment":  return (r as Equipment).name;
    case "personnel":  return `CODENAME: ${(r as Personnel).codename}`;
    case "modules":    return (r as { name?: string; id: string }).name ?? r.id;
    case "search":     return r.id;
  }
}
function getSub(tab: TabId, r: AnyRecord): string {
  switch (tab) {
    case "missions":   return `PHASE ${(r as Mission).phase} / ${(r as Mission).category}`;
    case "facilities": return (r as Facility).code;
    case "entities":   return (r as Entity).classification;
    case "equipment":  return (r as Equipment).code;
    case "personnel":  return (r as Personnel).role;
    case "modules":    return (r as { code?: string; id: string }).code ?? r.id;
    case "search":     return r.id;
  }
}

// ─────────────────────────────────────────────────────────────────────
// ResultCard
// ─────────────────────────────────────────────────────────────────────

function ResultCard({ entry, level }: { entry: IndexEntry; level: number }) {
  const { tab, record, clearance } = entry;
  const meta   = TAB_META[tab];
  const locked = level < clearance;
  const title  = getTitle(tab, record);
  const sub    = getSub(tab, record);
  const status = (record as { status: string }).status;

  if (locked) {
    return (
      <div
        className="rounded-sm p-4"
        style={{
          background: "var(--color-bg-surface)",
          border:     "1px solid rgba(0,200,255,0.06)",
          opacity:    0.45,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="hud-label">{meta.icon} {meta.label}</span>
          <span className="hud-label">{record.id}</span>
          <StatusBadge status={status} />
        </div>
        <div className="text-[14px] font-bold" style={{ color: "var(--color-fg-muted)" }}>
          ██████████████
        </div>
        <div className="hud-label mt-1">クリアランス LV{clearance} が必要</div>
      </div>
    );
  }

  return (
    <Link
      href={`/database/${tab}/${record.id}`}
      className="block rounded-sm p-4 no-underline transition-all duration-150"
      style={{
        background: "var(--color-bg-surface)",
        border:     "1px solid rgba(0,200,255,0.1)",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.border     = "1px solid rgba(0,200,255,0.28)";
        el.style.background = "var(--color-bg-raised)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.border     = "1px solid rgba(0,200,255,0.1)";
        el.style.background = "var(--color-bg-surface)";
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="hud-label">{meta.icon} {meta.label}</span>
            <span className="hud-label">{record.id}</span>
            <StatusBadge status={status} />
            {tab === "entities" && <ThreatBadge level={(record as Entity).threat} />}
          </div>
          <div className="text-[15px] font-bold mb-0.5" style={{ color: "var(--color-foreground)" }}>
            {title}
          </div>
          <div className="hud-label">{sub}</div>
        </div>
        <span
          className="text-[13px] mt-0.5 shrink-0"
          style={{ color: "var(--color-fg-muted)" }}
          aria-hidden="true"
        >→</span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────
// IDヒント
// ─────────────────────────────────────────────────────────────────────

const ID_HINTS = [
  { prefix: "M-",   eg: "M-001",   label: "ミッション" },
  { prefix: "FAC-", eg: "FAC-001", label: "施設" },
  { prefix: "ENT-", eg: "ENT-001", label: "エンティティ" },
  { prefix: "EQ-",  eg: "EQ-001",  label: "装備" },
  { prefix: "AGT-", eg: "AGT-K17", label: "人事" },
];

// ─────────────────────────────────────────────────────────────────────
// SearchClient
// ─────────────────────────────────────────────────────────────────────

type SearchState =
  | { status: "idle" }
  | { status: "found"; entry: IndexEntry }
  | { status: "not_found"; query: string };

export function SearchClient({ level }: { level: number }) {
  const [input,    setInput]    = useState("");
  const [state,    setState]    = useState<SearchState>({ status: "idle" });
  const [allIndex, setAllIndex] = useState<Record<string, IndexEntry>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // 起動時にDB全データをフェッチしてインデックス構築
  const buildIndex = useCallback(async () => {
    try {
      const [missions, facilities, entities, equipment, personnel] = await Promise.all([
        fetch("/api/missions",             { headers: { "X-Requested-With": "XMLHttpRequest" } }).then(r => r.ok ? r.json() : []),
        fetch("/api/db-data?type=facilities", { headers: { "X-Requested-With": "XMLHttpRequest" } }).then(r => r.ok ? r.json() : []),
        fetch("/api/db-data?type=entities",   { headers: { "X-Requested-With": "XMLHttpRequest" } }).then(r => r.ok ? r.json() : []),
        fetch("/api/db-data?type=equipment",  { headers: { "X-Requested-With": "XMLHttpRequest" } }).then(r => r.ok ? r.json() : []),
        fetch("/api/db-data?type=personnel",  { headers: { "X-Requested-With": "XMLHttpRequest" } }).then(r => r.ok ? r.json() : []),
      ]);
      const idx: Record<string, IndexEntry> = {};
      for (const r of missions)   idx[r.id] = { tab: "missions",   record: r as Mission,   clearance: (r as Mission).required_level ?? 0 };
      for (const r of facilities) idx[r.id] = { tab: "facilities", record: r as Facility,  clearance: (r as Facility).clearance };
      for (const r of entities)   idx[r.id] = { tab: "entities",   record: r as Entity,    clearance: (r as Entity).clearance };
      for (const r of equipment)  idx[r.id] = { tab: "equipment",  record: r as Equipment, clearance: (r as Equipment).clearance };
      for (const r of personnel)  idx[r.id] = { tab: "personnel",  record: r as Personnel, clearance: (r as Personnel).clearance };
      setAllIndex(idx);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { buildIndex(); }, [buildIndex]);

  const doSearch = (raw = input) => {
    const q = raw.trim().toUpperCase();
    if (!q) { setState({ status: "idle" }); return; }
    const entry = allIndex[q];
    setState(entry ? { status: "found", entry } : { status: "not_found", query: q });
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[720px] mx-auto">
      <div className="mb-7">
        <div className="hud-label mb-1">CLEARANCE LV2 — ID LOOKUP</div>
        <h1
          className="m-0 text-[19px] font-bold"
          style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}
        >
          IDレコード検索
        </h1>
        <p className="hud-label mt-1 m-0">
          レコードIDを完全一致で検索します。大文字・小文字は区別しません。
        </p>
      </div>

      {/* 検索ボックス */}
      <div
        className="bracket rounded-sm p-4 mb-6"
        style={{
          background: "var(--color-bg-surface)",
          border:     "1px solid rgba(0,200,255,0.1)",
        }}
      >
        <label htmlFor="id-search" className="hud-label mb-2 block">RECORD ID</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="id-search"
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (!e.target.value.trim()) setState({ status: "idle" });
              }}
              onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
              placeholder="例: M-001 / FAC-002 / AGT-K17"
              autoComplete="off"
              spellCheck={false}
              className="input-base"
              style={{ paddingRight: input ? "36px" : "12px" }}
            />
            {input && (
              <button
                onClick={() => { setInput(""); setState({ status: "idle" }); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                style={{
                  color:      "var(--color-fg-muted)",
                  fontSize:   "16px",
                  background: "none",
                  border:     "none",
                }}
                aria-label="クリア"
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "var(--color-foreground)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)")}
              >×</button>
            )}
          </div>
          <button
            onClick={() => doSearch()}
            className="px-5 py-2 rounded-sm text-[12px] font-bold tracking-[0.08em] cursor-pointer shrink-0 transition-all duration-150"
            style={{
              background: "rgba(0,200,255,0.08)",
              border:     "1px solid rgba(0,200,255,0.25)",
              color:      "var(--color-primary)",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.15)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.08)")}
          >
            検索
          </button>
        </div>

        {/* ヒント */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ID_HINTS.map(({ prefix, eg, label }) => {
            const active = input.toUpperCase().startsWith(prefix);
            return (
              <button
                key={prefix}
                onClick={() => { setInput(eg); doSearch(eg); inputRef.current?.focus(); }}
                className="text-[10px] px-2 py-1 rounded-sm cursor-pointer transition-all duration-150"
                style={{
                  border:     active ? "1px solid rgba(0,200,255,0.4)" : "1px solid rgba(0,200,255,0.1)",
                  color:      active ? "var(--color-primary)" : "var(--color-fg-muted)",
                  background: active ? "rgba(0,200,255,0.08)" : "transparent",
                  letterSpacing: "0.06em",
                }}
              >
                {prefix}…{" "}
                <span style={{ color: "var(--color-fg-muted)" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 結果 */}
      <div aria-live="polite" aria-atomic="true">
        {state.status === "idle" && (
          <EmptyState icon="◫" message="IDを入力して検索してください" />
        )}

        {state.status === "found" && (
          <div className="animate-[fadeIn_0.2s_ease_both]">
            <div className="hud-label mb-3" style={{ color: "var(--color-success)" }}>
              1件ヒット
            </div>
            <ResultCard entry={state.entry} level={level} />
          </div>
        )}

        {state.status === "not_found" && (
          <div
            className="animate-[fadeIn_0.2s_ease_both] rounded-sm p-6 text-center"
            style={{
              background: "var(--color-bg-surface)",
              border:     "1px solid rgba(255,68,68,0.12)",
            }}
          >
            <div className="hud-label mb-2" style={{ color: "var(--color-danger)" }}>NOT FOUND</div>
            <div className="text-[13px] mb-1.5" style={{ color: "var(--color-foreground)" }}>
              <span style={{ color: "var(--color-primary)" }}>"{state.query}"</span> に一致するレコードがありません
            </div>
            <div className="hud-label">
              形式を確認してください — M-001 / FAC-001 / ENT-001 / EQ-001 / AGT-K17
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
