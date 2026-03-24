"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import {
  TABS,
  type TabId, type Mission, type Facility,
  type Equipment,
  type ApiEntity, type ApiModule, type ApiPersonnel,
} from "./data";

// ─── 定数 ────────────────────────────────────────────────────────────
const CLS_COLOR: Record<string, string> = {
  safe:       "var(--color-success)",
  caution:    "var(--color-warning)",
  danger:     "var(--color-danger)",
  classified: "var(--color-purple, #ce93d8)",
};
const CLS_LABEL: Record<string, string> = {
  safe: "安全", caution: "要注意", danger: "危険", classified: "機密",
};
const ENERGY_COLOR: Record<string, string> = {
  低: "var(--color-success)", 中: "var(--color-primary)",
  高: "var(--color-warning)", 超高: "var(--color-danger)", 極高: "#ff00ff",
};
const DIVISION_COLOR: Record<string, string> = {
  "収束部門": "var(--color-purple, #a064ff)",
  "観測部門": "var(--color-primary)",
  "記録部門": "var(--color-success)",
  "技術部門": "var(--color-warning)",
  "封印部門": "var(--color-danger)",
};
const MISSION_STATUS_COLOR: Record<string, string> = {
  active: "var(--color-danger)", monitoring: "var(--color-warning)", completed: "var(--color-success)",
};
const MISSION_STATUS_LABEL: Record<string, string> = {
  active: "対応中", monitoring: "監視中", completed: "収束済み",
};
const MISSION_CAT_COLOR: Record<string, string> = {
  critical: "var(--color-danger)", standard: "var(--color-primary)", support: "var(--color-success)",
};

function divColor(div: string) {
  for (const [k, v] of Object.entries(DIVISION_COLOR)) {
    if (div.includes(k)) return v;
  }
  return "var(--color-primary)";
}

// ─── 共通UIパーツ ─────────────────────────────────────────────────────
function RecordCard({ href, locked, children }: { href: string; locked: boolean; children: React.ReactNode }) {
  if (locked) return (
    <div className="rounded-sm p-4"
      style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.05)", opacity: 0.38, cursor: "not-allowed" }}>
      {children}
    </div>
  );
  return (
    <Link href={href} className="group block rounded-sm p-4 no-underline transition-all duration-150"
      style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.border = "1px solid rgba(0,200,255,0.26)"; el.style.background = "var(--color-bg-raised)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.border = "1px solid rgba(0,200,255,0.08)"; el.style.background = "var(--color-bg-surface)"; }}>
      {children}
    </Link>
  );
}

function CategoryChip({ label }: { label: string }) {
  return <span className="text-[10px] px-1.5 py-px rounded-sm" style={{ border: "1px solid rgba(0,200,255,0.1)", color: "var(--color-fg-muted)" }}>{label}</span>;
}

function RecordMeta({ id, status, extra }: { id: string; status: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
      <span className="hud-label">{id}</span>
      <StatusBadge status={status} />
      {extra}
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}>
      <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>取得に失敗しました</p>
      <button onClick={onRetry} className="text-[12px] px-4 py-1.5 rounded-sm cursor-pointer"
        style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", background: "transparent" }}>再試行</button>
    </div>
  );
}

function LoadingPlaceholder() {
  return <div className="hud-label py-8 text-center" style={{ color: "var(--color-fg-muted)" }}>LOADING...</div>;
}

function FilterBar({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="flex gap-2 mb-5 flex-wrap items-center">
      {options.map(({ label, value: v, color }) => {
        const col = color ?? "var(--color-primary)";
        const active = value === v;
        return (
          <button key={v} onClick={() => onChange(v)}
            className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer transition-all"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
              background: active ? `${col}18` : "transparent",
              border: `1px solid ${active ? col : "rgba(0,200,255,0.15)"}`,
              color: active ? col : "var(--color-fg-dim)" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

const CLS_FILTER_OPTIONS = [
  { label: "すべて",   value: "all" },
  { label: "安全",     value: "safe",       color: CLS_COLOR.safe },
  { label: "要注意",   value: "caution",    color: CLS_COLOR.caution },
  { label: "危険",     value: "danger",     color: CLS_COLOR.danger },
  { label: "機密",     value: "classified", color: CLS_COLOR.classified },
];

// ─── ① 収束案件 ───────────────────────────────────────────────────────
function MissionsTab({ level, missions }: { level: number; missions: Mission[] }) {
  const normalized = missions.map(m => ({
    ...m,
    level: m.required_level != null ? Number(m.required_level) : (m.level ?? 0),
    xp:    m.xp_reward     != null ? Number(m.xp_reward)     : (m.xp ?? 0),
  }));
  return (
    <div className="flex flex-col gap-2">
      {normalized.map(m => {
        const locked = level < m.level;
        const sColor = MISSION_STATUS_COLOR[m.status as string] ?? "var(--color-primary)";
        const cColor = MISSION_CAT_COLOR[m.category as string]  ?? "var(--color-primary)";
        return (
          <RecordCard key={m.id} href={`/database/missions/${m.id}`} locked={locked}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <RecordMeta id={m.id} status={m.status as string} extra={<CategoryChip label={m.category as string} />} />
                <div className="text-[14px] font-bold" style={{ color: locked ? "var(--color-fg-muted)" : "var(--color-foreground)" }}>
                  {locked ? "██████████████" : m.title}
                </div>
                {m.description && !locked && (
                  <div className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
                    {(m.description as string).slice(0, 80)}{(m.description as string).length > 80 ? "…" : ""}
                  </div>
                )}
                {locked && <div className="hud-label mt-1">クリアランス LV{m.level} が必要</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-bold" style={{ color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>+{m.xp} XP</div>
                <div className="hud-label mt-0.5">PHASE {m.phase}</div>
                {!locked && (
                  <div className="text-[10px] mt-1 px-2 py-0.5 rounded-sm"
                    style={{ background: `${sColor}18`, border: `1px solid ${sColor}55`, color: sColor, fontFamily: "var(--font-mono)" }}>
                    {MISSION_STATUS_LABEL[m.status as string] ?? m.status}
                  </div>
                )}
              </div>
            </div>
          </RecordCard>
        );
      })}
    </div>
  );
}

// ─── ② 実体カタログ（API・インライン展開） ──────────────────────────
function EntitiesApiTab({ entities, filter, onFilterChange, loading, error, onRetry }: {
  entities: ApiEntity[]; filter: string; onFilterChange: (v: string) => void;
  loading: boolean; error: boolean; onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (loading) return <LoadingPlaceholder />;
  if (error)   return <ErrorPanel onRetry={onRetry} />;
  return (
    <>
      <FilterBar value={filter} onChange={v => { setExpanded(null); onFilterChange(v); }} options={CLS_FILTER_OPTIONS} />
      <div className="mb-3 hud-label" style={{ color: "var(--color-fg-muted)" }}>{entities.length} 件</div>
      <div className="flex flex-col gap-2">
        {entities.map(e => {
          const col  = CLS_COLOR[e.classification] ?? "var(--color-primary)";
          const open = expanded === e.id;
          return (
            <div key={e.id} className="rounded-sm overflow-hidden"
              style={{ border: `1px solid ${open ? col + "55" : "rgba(0,200,255,0.07)"}` }}>
              <button onClick={() => setExpanded(open ? null : e.id)}
                className="w-full text-left p-4 cursor-pointer transition-all flex items-center gap-4"
                style={{ background: open ? `${col}0a` : "var(--color-bg-surface)" }}>
                <div className="shrink-0 w-16 hud-label text-center py-1"
                  style={{ background: `${col}18`, border: `1px solid ${col}44`, color: col }}>{e.code}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold mb-0.5" style={{ color: "var(--color-foreground)" }}>{e.name}</div>
                  <div className="text-[11px] leading-relaxed line-clamp-1" style={{ color: "var(--color-fg-dim)" }}>{e.description}</div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-sm"
                    style={{ background: `${col}18`, border: `1px solid ${col}55`, color: col, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                    {CLS_LABEL[e.classification] ?? e.classification}
                  </span>
                  <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{open ? "▲ 閉じる" : "▼ 詳細"}</span>
                </div>
              </button>
              {open && (
                <div className="px-4 pb-4 pt-2" style={{ background: `${col}05`, borderTop: `1px solid ${col}22` }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {([["脅威度", e.threat], ["知性", e.intelligence], ["出現源", e.origin], ["外観", e.appearance], ["行動傾向", e.behavior], ["収容方法", e.containment]] as [string, string][]).map(([label, value]) => (
                      <div key={label}>
                        <div className="hud-label mb-1" style={{ color: col }}>{label}</div>
                        <div className="text-[12px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── ③ 収束モジュール（API・インライン展開） ─────────────────────────
function ModulesTab({ modules, filter, onFilterChange, loading, error, onRetry }: {
  modules: ApiModule[]; filter: string; onFilterChange: (v: string) => void;
  loading: boolean; error: boolean; onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (loading) return <LoadingPlaceholder />;
  if (error)   return <ErrorPanel onRetry={onRetry} />;
  return (
    <>
      <FilterBar value={filter} onChange={v => { setExpanded(null); onFilterChange(v); }} options={CLS_FILTER_OPTIONS} />
      <div className="mb-3 hud-label" style={{ color: "var(--color-fg-muted)" }}>{modules.length} 件</div>
      <div className="flex flex-col gap-2">
        {modules.map(m => {
          const col        = CLS_COLOR[m.classification] ?? "var(--color-primary)";
          const open       = expanded === m.id;
          const isRedacted = m.name === "███████";
          return (
            <div key={m.id} className="rounded-sm overflow-hidden"
              style={{ border: `1px solid ${open ? col + "55" : "rgba(0,200,255,0.07)"}` }}>
              <button onClick={() => setExpanded(open ? null : m.id)}
                className="w-full text-left p-4 cursor-pointer transition-all flex items-center gap-4"
                style={{ background: open ? `${col}0a` : "var(--color-bg-surface)" }}>
                <div className="shrink-0 w-20 hud-label text-center py-1"
                  style={{ background: `${col}18`, border: `1px solid ${col}44`, color: col }}>{m.code}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold mb-0.5" style={{ color: "var(--color-foreground)" }}>
                    {isRedacted ? <span className="tracking-widest opacity-40">███████</span> : m.name}
                  </div>
                  <div className="text-[11px] leading-relaxed line-clamp-1" style={{ color: "var(--color-fg-dim)" }}>{m.description}</div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-sm"
                    style={{ background: `${col}18`, border: `1px solid ${col}55`, color: col, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                    {CLS_LABEL[m.classification] ?? m.classification}
                  </span>
                  {!isRedacted && (
                    <span className="text-[10px]" style={{ color: ENERGY_COLOR[m.energy] ?? "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                      ⚡{m.energy}
                    </span>
                  )}
                  <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{open ? "▲ 閉じる" : "▼ 詳細"}</span>
                </div>
              </button>
              {open && !isRedacted && (
                <div className="px-4 pb-4 pt-2" style={{ background: `${col}05`, borderTop: `1px solid ${col}22` }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 mt-2">
                    {([["有効範囲", m.range], ["持続時間", m.duration], ["エネルギー", m.energy], ["開発元", m.developer]] as [string, string][]).map(([label, value]) => (
                      <div key={label} className="p-2 rounded-sm" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="hud-label mb-1" style={{ color: col }}>{label}</div>
                        <div className="text-[12px]" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-3">
                    <div className="hud-label mb-1" style={{ color: col }}>動作詳細</div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>{m.details}</p>
                  </div>
                  {m.warning && (
                    <div className="px-3 py-2 rounded-sm" style={{ background: "rgba(255,180,60,0.06)", border: "1px solid rgba(255,180,60,0.25)" }}>
                      <span className="hud-label mr-2" style={{ color: "var(--color-warning)" }}>⚠ 警告</span>
                      <span className="text-[12px]" style={{ color: "var(--color-warning)" }}>{m.warning}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── ④ 機関員一覧（API・検索付き） ───────────────────────────────────
function PersonnelApiTab({ personnel, loading, error, onRetry, query, onQueryChange }: {
  personnel: ApiPersonnel[]; loading: boolean; error: boolean; onRetry: () => void;
  query: string; onQueryChange: (q: string) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onRetry(); };
  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
        <input value={query} onChange={e => onQueryChange(e.target.value)}
          placeholder="ID・名前・部門で検索..."
          className="flex-1 px-3 py-2 rounded-sm text-[13px] outline-none"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.22)",
            color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }} />
        <button type="submit" className="px-4 py-2 rounded-sm text-[12px] cursor-pointer"
          style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.3)",
            color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>検索</button>
        {query && (
          <button type="button" onClick={() => onQueryChange("")}
            className="px-3 py-2 rounded-sm text-[12px] cursor-pointer"
            style={{ background: "transparent", border: "1px solid rgba(0,200,255,0.22)",
              color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>✕</button>
        )}
      </form>
      {loading && <LoadingPlaceholder />}
      {!loading && error && <ErrorPanel onRetry={onRetry} />}
      {!loading && !error && personnel.length === 0 && (
        <div className="p-10 text-center rounded-sm"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}>
          <div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>該当する機関員がいません</div>
        </div>
      )}
      {!loading && !error && personnel.length > 0 && (
        <>
          <div className="hud-label mb-3" style={{ color: "var(--color-fg-muted)" }}>{personnel.length} 件</div>
          <div className="flex flex-col gap-2">
            {personnel.map(p => {
              const col = divColor(p.division);
              return (
                <div key={p.id} className="p-4 rounded-sm flex items-center gap-4"
                  style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)", borderLeft: `3px solid ${col}` }}>
                  <div className="shrink-0 px-2 py-1 rounded-sm text-[11px] font-bold"
                    style={{ background: `${col}18`, border: `1px solid ${col}44`, color: col, fontFamily: "var(--font-mono)" }}>{p.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold" style={{ color: "var(--color-foreground)" }}>{p.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--color-fg-dim)" }}>{p.division} — {p.rank}</div>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <div className="text-[11px]" style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                      {p.specialization.split("、")[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ─── ⑤ 施設（静的データ） ─────────────────────────────────────────────
function FacilitiesTab({ level, facilities }: { level: number; facilities: Facility[] }) {
  return (
    <div className="flex flex-col gap-2">
      {facilities.map(f => {
        const locked = level < f.clearance;
        return (
          <RecordCard key={f.id} href={`/database/facilities/${f.id}`} locked={locked}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <RecordMeta id={f.id} status={f.status} extra={<CategoryChip label={f.type} />} />
                <div className="text-[14px] font-bold" style={{ color: locked ? "var(--color-fg-muted)" : "var(--color-foreground)" }}>
                  {locked ? "██████████████" : f.name}
                </div>
                <div className="hud-label mt-0.5">{locked ? "████████" : f.code}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="hud-label">{locked ? "——" : f.location}</div>
                <div className="hud-label mt-0.5" style={{ color: "var(--color-primary)" }}>LV{f.clearance}+</div>
              </div>
            </div>
          </RecordCard>
        );
      })}
    </div>
  );
}

// ─── ⑥ 装備（静的データ） ─────────────────────────────────────────────
function EquipmentTab({ level, equipment }: { level: number; equipment: Equipment[] }) {
  return (
    <div className="flex flex-col gap-2">
      {equipment.map(eq => {
        const locked = level < eq.clearance;
        return (
          <RecordCard key={eq.id} href={`/database/equipment/${eq.id}`} locked={locked}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <RecordMeta id={eq.id} status={eq.status} extra={<CategoryChip label={eq.category} />} />
                <div className="text-[14px] font-bold" style={{ color: locked ? "var(--color-fg-muted)" : "var(--color-foreground)" }}>
                  {locked ? "██████████████" : eq.name}
                </div>
                <div className="hud-label mt-0.5">{locked ? "████████" : eq.code}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="hud-label">{eq.quantity != null ? `在庫 ${eq.quantity}` : "——"}</div>
                <div className="hud-label mt-0.5">{eq.weight}</div>
              </div>
            </div>
          </RecordCard>
        );
      })}
    </div>
  );
}

// ─── メイン ───────────────────────────────────────────────────────────
type StaticTabData = { missions: Mission[]; facilities: Facility[]; equipment: Equipment[] };
type ApiState<T>   = { data: T[]; loading: boolean; error: boolean };


// ─── ⑦ ID検索タブ ─────────────────────────────────────────────────────

type SearchState =
  | { status: "idle" }
  | { status: "found"; entry: { tab: string; record: Record<string, unknown>; clearance: number } }
  | { status: "not_found"; query: string };

const ID_HINTS = [
  { prefix: "M-",   eg: "M-001",   label: "ミッション" },
  { prefix: "FAC-", eg: "FAC-001", label: "施設" },
  { prefix: "ENT-", eg: "ENT-001", label: "実体" },
  { prefix: "EQ-",  eg: "EQ-001",  label: "装備" },
  { prefix: "AGT-", eg: "AGT-K17", label: "機関員" },
];

function SearchTab({ level }: { level: number }) {
  const [input, setInput]   = useState("");
  const [state, setState]   = useState<SearchState>({ status: "idle" });
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (override?: string) => {
    const q = (override ?? input).trim().toUpperCase();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search?id=${encodeURIComponent(q)}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) { setState({ status: "not_found", query: q }); return; }
      const data = await res.json();
      if (!data) { setState({ status: "not_found", query: q }); return; }
      setState({ status: "found", entry: data });
    } catch {
      setState({ status: "not_found", query: q });
    } finally { setSearching(false); }
  }, [input]);

  return (
    <div>
      {/* 検索ボックス */}
      <div className="rounded-sm p-4 mb-6" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.1)" }}>
        <label htmlFor="db-id-search" className="hud-label mb-2 block">RECORD ID</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="db-id-search"
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); if (!e.target.value.trim()) setState({ status: "idle" }); }}
              onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
              placeholder="例: M-001 / FAC-002 / ENT-003"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-sm px-3 py-2 text-[13px] outline-none font-mono"
              style={{ background: "var(--color-bg)", border: "1px solid rgba(0,200,255,0.18)", color: "var(--color-foreground)", paddingRight: input ? "36px" : "12px" }}
            />
            {input && (
              <button onClick={() => { setInput(""); setState({ status: "idle" }); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "var(--color-fg-muted)", fontSize: "16px", background: "none", border: "none" }}
                aria-label="クリア">×</button>
            )}
          </div>
          <button onClick={() => doSearch()} disabled={searching}
            className="px-5 py-2 rounded-sm text-[12px] font-bold tracking-[0.08em] cursor-pointer shrink-0"
            style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.25)", color: "var(--color-primary)" }}>
            {searching ? "…" : "検索"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ID_HINTS.map(({ prefix, eg, label }) => {
            const active = input.toUpperCase().startsWith(prefix);
            return (
              <button key={prefix} onClick={() => { setInput(eg); doSearch(eg); }}
                className="text-[10px] px-2 py-1 rounded-sm cursor-pointer transition-all"
                style={{ border: active ? "1px solid rgba(0,200,255,0.4)" : "1px solid rgba(0,200,255,0.1)", color: active ? "var(--color-primary)" : "var(--color-fg-muted)", background: active ? "rgba(0,200,255,0.08)" : "transparent", letterSpacing: "0.06em" }}>
                {prefix}…{" "}<span style={{ color: "var(--color-fg-muted)" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 結果 */}
      <div aria-live="polite">
        {state.status === "idle" && (
          <div className="p-10 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
            <div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>IDを入力して検索してください</div>
            <div className="hud-label mt-2">レコードID形式: M-001 / FAC-001 / ENT-001 / EQ-001 / AGT-K17</div>
          </div>
        )}
        {state.status === "found" && (() => {
          const { record, clearance } = state.entry;
          const locked = level < clearance;
          const title = (record.title ?? record.name ?? record.designation ?? `CODENAME: ${record.codename}`) as string;
          const status = record.status as string;
          return (
            <div className="animate-[fadeIn_0.2s_ease_both]">
              <div className="hud-label mb-3" style={{ color: "var(--color-success)" }}>1件ヒット</div>
              <div className="rounded-sm p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.15)", borderLeft: "3px solid var(--color-primary)" }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="hud-label">{record.id as string}</span>
                  <span className="text-[10px] px-1.5 py-px rounded-sm" style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)" }}>
                    {state.entry.tab}
                  </span>
                </div>
                <div className="text-[14px] font-bold mb-1" style={{ color: locked ? "var(--color-fg-muted)" : "var(--color-foreground)" }}>
                  {locked ? "██████████████" : title}
                </div>
                {locked && <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>クリアランス LV{clearance} が必要</div>}
              </div>
            </div>
          );
        })()}
        {state.status === "not_found" && (
          <div className="animate-[fadeIn_0.2s_ease_both] rounded-sm p-6 text-center" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.12)" }}>
            <div className="hud-label mb-2" style={{ color: "var(--color-danger)" }}>NOT FOUND</div>
            <div className="text-[13px] mb-1.5" style={{ color: "var(--color-foreground)" }}>
              <span style={{ color: "var(--color-primary)" }}>"{state.query}"</span> に一致するレコードがありません
            </div>
            <div className="hud-label">形式を確認してください — M-001 / FAC-001 / ENT-001 / EQ-001 / AGT-K17</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DatabaseClient({ level, initialTab = "missions" }: { level: number; initialTab?: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [dbData,    setDbData]    = useState<StaticTabData>({ missions: [], facilities: [], equipment: [] });
  const [entities,  setEntities]  = useState<ApiState<ApiEntity>>({ data: [], loading: false, error: false });
  const [modules,   setModules]   = useState<ApiState<ApiModule>>({ data: [], loading: false, error: false });
  const [personnel, setPersonnel] = useState<ApiState<ApiPersonnel>>({ data: [], loading: false, error: false });
  const [entFilter, setEntFilter] = useState("all");
  const [modFilter, setModFilter] = useState("all");
  const [perQuery,  setPerQuery]  = useState("");

  const loadMissions = useCallback(async () => {
    try {
      const res = await fetch("/api/missions", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) { const data = await res.json() as Mission[]; setDbData(prev => ({ ...prev, missions: data })); }
    } catch { /**/ }
  }, []);

  const loadStatic = useCallback(async (tab: "facilities" | "equipment") => {
    try {
      const res = await fetch(`/api/db-data?type=${tab}`, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) { const data = await res.json(); setDbData(prev => ({ ...prev, [tab]: data })); }
    } catch { /**/ }
  }, []);

  const loadEntities = useCallback(async (filter = "all") => {
    setEntities(s => ({ ...s, loading: true, error: false }));
    try {
      const p = filter !== "all" ? `?classification=${filter}` : "";
      const res = await fetch(`/api/entities${p}`, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (!res.ok) throw new Error();
      setEntities({ data: await res.json() as ApiEntity[], loading: false, error: false });
    } catch { setEntities(s => ({ ...s, loading: false, error: true })); }
  }, []);

  const loadModules = useCallback(async (filter = "all") => {
    setModules(s => ({ ...s, loading: true, error: false }));
    try {
      const p = filter !== "all" ? `?classification=${filter}` : "";
      const res = await fetch(`/api/modules${p}`, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (!res.ok) throw new Error();
      setModules({ data: await res.json() as ApiModule[], loading: false, error: false });
    } catch { setModules(s => ({ ...s, loading: false, error: true })); }
  }, []);

  const loadPersonnel = useCallback(async (q = "") => {
    setPersonnel(s => ({ ...s, loading: true, error: false }));
    try {
      const p = q ? `?q=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/personnel${p}`, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (!res.ok) throw new Error();
      setPersonnel({ data: await res.json() as ApiPersonnel[], loading: false, error: false });
    } catch { setPersonnel(s => ({ ...s, loading: false, error: true })); }
  }, []);

  // タブ切り替え時にデータ取得
  useEffect(() => {
    switch (activeTab) {
      case "missions":   loadMissions();           break;
      case "entities":   loadEntities(entFilter);  break;
      case "modules":    loadModules(modFilter);    break;
      case "personnel":  loadPersonnel(perQuery);   break;
      case "facilities": loadStatic("facilities");  break;
      case "equipment":  loadStatic("equipment");   break;
      case "search":     /* no preload needed */     break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // フィルタ変更時の再取得
  useEffect(() => { if (activeTab === "entities") loadEntities(entFilter); }, [entFilter, activeTab, loadEntities]);
  useEffect(() => { if (activeTab === "modules")  loadModules(modFilter);  }, [modFilter, activeTab, loadModules]);

  const counts: Record<TabId, number> = {
    missions:   dbData.missions.length,
    entities:   entities.data.length,
    modules:    modules.data.length,
    personnel:  personnel.data.length,
    facilities: dbData.facilities.length,
    equipment:  dbData.equipment.length,
    search:     0,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "missions":   return <MissionsTab level={level} missions={dbData.missions} />;
      case "entities":   return <EntitiesApiTab entities={entities.data} filter={entFilter} onFilterChange={setEntFilter} loading={entities.loading} error={entities.error} onRetry={() => loadEntities(entFilter)} />;
      case "modules":    return <ModulesTab modules={modules.data} filter={modFilter} onFilterChange={setModFilter} loading={modules.loading} error={modules.error} onRetry={() => loadModules(modFilter)} />;
      case "personnel":  return <PersonnelApiTab personnel={personnel.data} loading={personnel.loading} error={personnel.error} onRetry={() => loadPersonnel(perQuery)} query={perQuery} onQueryChange={q => { setPerQuery(q); if (!q) loadPersonnel(""); }} />;
      case "facilities": return <FacilitiesTab level={level} facilities={dbData.facilities} />;
      case "equipment":  return <EquipmentTab level={level} equipment={dbData.equipment} />;
      case "search":     return <SearchTab level={level} />;
    }
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[900px] mx-auto">
      <div className="mb-6">
        <div className="hud-label mb-1">CLEARANCE LV2 — AGENCY DATABASE</div>
        <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          機関データベース
        </h1>
      </div>

      {/* タブバー */}
      <div className="flex mb-5 rounded-sm overflow-x-auto" style={{ border: "1px solid rgba(0,200,255,0.1)" }}
        role="tablist" aria-label="データベースカテゴリ">
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const isLocked = level < tab.minLevel;
          return (
            <button key={tab.id} role="tab" aria-selected={isActive}
              onClick={() => !isLocked && setActiveTab(tab.id)}
              disabled={isLocked}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 transition-all duration-150 whitespace-nowrap"
              style={{
                fontSize: "11px", letterSpacing: "0.05em",
                background:   isActive ? "rgba(0,200,255,0.07)" : "var(--color-bg)",
                color:        isActive ? "var(--color-primary)" : isLocked ? "var(--color-fg-decorative)" : "var(--color-fg-dim)",
                borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                borderRight:  i < TABS.length - 1 ? "1px solid rgba(0,200,255,0.08)" : "none",
                cursor:       isLocked ? "not-allowed" : "pointer",
              }}>
              <span aria-hidden="true" style={{ fontSize: "11px" }}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-[10px] px-1 rounded-sm ml-0.5"
                style={{ background: isActive ? "var(--color-primary)" : "rgba(0,200,255,0.08)", color: isActive ? "var(--color-bg)" : "var(--color-fg-muted)" }}>
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div key={activeTab} className="animate-[fadeIn_0.2s_ease_both]">
        {renderTab()}
      </div>

      <div className="mt-5 px-4 py-2.5 rounded-sm hud-label" style={{ border: "1px dashed rgba(0,200,255,0.07)" }}>
        ※ 表示されているデータはクリアランスレベルに基づきフィルタリングされています。
      </div>
    </div>
  );
}
