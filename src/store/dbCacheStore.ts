/**
 * useDbCacheStore — 小説タグ解決用 DB キャッシュ（Zustand）
 *
 * 設計方針:
 *   - モジュールスコープのシングルトン（_dbCache）を廃止し、
 *     Zustand ストアでライフサイクルを正しく管理する
 *   - persist なし（ページリロード時は再フェッチ。機密データをlocalStorageに残さない）
 *   - 複数の NovelRenderer が同一ページに存在しても1回だけフェッチ
 *   - 将来の invalidate() / 部分更新に対応できる構造
 *
 * 新規タグを追加する場合:
 *   1. DbCache に型フィールドを追加
 *   2. fetchAll() に fetch を追加
 *   3. NovelRenderer.tsx の TAG_RESOLVERS にリゾルバを登録
 */

import { create } from "zustand";
import type { Mission, Facility, Entity, Equipment, Personnel } from "@/app/(app)/database/data";

// ─────────────────────────────────────────────────────────────────────
// キャッシュの型
// ─────────────────────────────────────────────────────────────────────

export interface Division {
  id:          string;
  name:        string;
  name_en:     string;
  description: string;
  color:       string | null;
}

export interface Incident {
  id:       string;
  severity: "critical" | "warning" | "safe";
  status:   string;
  name:     string;
  gsi:      number;
  location: string;
  entity:   string;
  division: string;
  desc:     string;
  time:     string;
}

export interface TagModule {
  id:             string;
  code:           string;
  name:           string;
  classification: string;
  description:    string;
  range:          string;
  duration:       string;
  energy:         string;
  developer:      string;
  details:        string;
  warning:        string;
}

export interface CodexEntry {
  id:    string;
  title: string;
}

export interface AudioRecord {
  id:             string;
  title:          string;
  filename:       string;
  duration_sec:   number;
  recorded_at:    string;
  recorded_by:    string;
  location_ref:   string | null;
  classification: string;
  clearance_req:  number;
  voice_detected: number;   // 0=STATIC
  integrity:      number;   // 0–100（<100でCORRUPTED）
  gsi_value:      number | null;
  entity_ref:     string | null;
}

export interface TagEvent {
  id:          string;
  title:       string;
  description: string;
  triggerAt:   string;
  endAt:       string | null;
  status:      string;
  firedAt:     string | null;
  eventType:   string;
}

export interface TagPuzzle {
  id:           string;
  slug:         string;
  title:        string;
  cipher_text:  string;
  hint:         string | null;
  xp_reward:    number;
  clearance_req: number;
}

// ── Phase 5 追加型 ────────────────────────────────────────────────────

export interface ObservationPoint {
  id:            string;
  type:          "location" | "rift_point";
  name:          string;
  name_short:    string;
  lon:           number;
  lat:           number;
  city_code:     string | null;
  city_name:     string | null;
  status:        string;
  clearance_req: number;
  gsi_current:   number | null;
  description:   string;
  notes:         string | null;
}

export interface ObservationLog {
  id:            string;
  type:          "gsi" | "signal" | "scan";
  title:         string;
  observed_at:   string;
  location_ref:  string | null;
  entity_ref:    string | null;
  clearance_req: number;
  gsi_value:     number | null;
  gsi_baseline:  number | null;
  freq_band:     string | null;
  amplitude_db:  number | null;
  duration_sec:  number | null;
  pattern_match: string | null;
  scan_area:     string | null;
  findings_json: unknown[];
  severity:      string;
  description:   string;
}

export interface DimensionCrack {
  id:             string;
  name:           string;
  lon:            number;
  lat:            number;
  location:       string;
  status:         string;
  severity:       string;
  gsi_peak:       number | null;
  first_detected: string;
  sealed_at:      string | null;
  entity_emerged: string[];
  clearance_req:  number;
  description:    string;
  notes:          string | null;
}

export interface CaseReport {
  id:             string;
  title:          string;
  case_date:      string;
  closed_date:    string | null;
  status:         string;
  division_ref:   string | null;
  personnel_json: string[];
  entity_ref:     string | null;
  location_ref:   string | null;
  casualties:     number;
  clearance_req:  number;
  summary:        string;
  full_report:    string | null;
}

export interface OperationRecord {
  id:            string;
  codename:      string;
  title:         string;
  op_date:       string;
  end_date:      string | null;
  status:        string;
  division_json: string[];
  commander_ref: string | null;
  target_ref:    string | null;
  location_ref:  string | null;
  outcome:       string;
  clearance_req: number;
  description:   string;
  casualties:    number;
}

export interface ContainmentProtocol {
  id:            string;
  codename:      string;
  title:         string;
  division_ref:  string | null;
  status:        string;
  threat_class:  string;
  clearance_req: number;
  summary:       string;
  steps_json:    { step: number; title: string; desc: string }[];
  warnings:      string | null;
}

export interface ResearchTheory {
  id:            string;
  title:         string;
  author_ref:    string | null;
  division_ref:  string | null;
  proposed_at:   string;
  status:        string;
  confidence:    number;
  clearance_req: number;
  abstract:      string;
  evidence_json: unknown[];
  related_json:  string[];
}

export interface DbCache {
  missions:               Mission[];
  facilities:             Facility[];
  entities:               Entity[];
  equipment:              Equipment[];
  personnel:              Personnel[];
  divisions:              Division[];
  incidents:              Incident[];
  modules:                TagModule[];
  codex:                  CodexEntry[];
  audio:                  AudioRecord[];
  events:                 TagEvent[];
  puzzles:                TagPuzzle[];
  observation_points:     ObservationPoint[];
  observation_logs:       ObservationLog[];
  dimension_cracks:       DimensionCrack[];
  case_reports:           CaseReport[];
  operation_records:      OperationRecord[];
  containment_protocols:  ContainmentProtocol[];
  research_theories:      ResearchTheory[];
  sigma_messages:         SigmaMessage[];
}

export interface SigmaMessage {
  id:            string;
  number:        number;
  received_at:   string;
  medium:        string;
  integrity:     number;
  clearance_req: number;
  content:       string;
  context_ref:   string | null;
}

// ─────────────────────────────────────────────────────────────────────
// ストア型
// ─────────────────────────────────────────────────────────────────────

interface DbCacheState {
  db:        DbCache | null;
  status:    "idle" | "loading" | "ready" | "error";
  /** 初回ロード or 強制再フェッチ */
  load:      () => Promise<void>;
  /** 特定スライスを上書き（管理者更新後などに使用） */
  invalidate: (keys?: (keyof DbCache)[]) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────
// フェッチャー
// ─────────────────────────────────────────────────────────────────────

const H = { "X-Requested-With": "XMLHttpRequest" };

async function fetchAll(): Promise<DbCache> {
  const [m, f, e, eq, p, div, inc, mod, cdxRaw, aud, evts, pzls,
         obs_pts, obs_logs, cracks, cases, ops, protocols, theories, sigma] = await Promise.all([
    fetch("/api/missions",                { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/db-data?type=facilities", { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/db-data?type=entities",   { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/db-data?type=equipment",  { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/db-data?type=personnel",  { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/divisions",               { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/incidents",               { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/modules",                 { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/codex", { headers: H }).then(r =>
      r.ok ? r.json().then((sections: Array<{ entries?: CodexEntry[] }>) =>
        sections.flatMap(s => (s.entries ?? []).map(e => ({ id: e.id, title: e.title })))
      ) : []
    ),
    fetch("/api/audio",                       { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/events",                      { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/cipher",                      { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/observation-points",          { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/observation-logs",            { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/dimension-cracks",            { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/case-reports",                { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/operation-records",           { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/containment-protocols",       { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/research-theories",           { headers: H }).then(r => r.ok ? r.json() : []),
    fetch("/api/sigma-messages",              { headers: H }).then(r => r.ok ? r.json() : []),
  ]);
  return {
    missions: m, facilities: f, entities: e, equipment: eq, personnel: p,
    divisions: div, incidents: inc, modules: mod, codex: cdxRaw, audio: aud,
    events: evts, puzzles: pzls,
    observation_points: obs_pts, observation_logs: obs_logs,
    dimension_cracks: cracks, case_reports: cases,
    operation_records: ops, containment_protocols: protocols,
    research_theories: theories,
    sigma_messages: sigma,
  };
}

async function fetchSlices(keys: (keyof DbCache)[]): Promise<Partial<DbCache>> {
  const sliceMap: Partial<Record<keyof DbCache, () => Promise<unknown>>> = {
    missions:   () => fetch("/api/missions",                { headers: H }).then(r => r.ok ? r.json() : []),
    facilities: () => fetch("/api/db-data?type=facilities", { headers: H }).then(r => r.ok ? r.json() : []),
    entities:   () => fetch("/api/db-data?type=entities",   { headers: H }).then(r => r.ok ? r.json() : []),
    equipment:  () => fetch("/api/db-data?type=equipment",  { headers: H }).then(r => r.ok ? r.json() : []),
    personnel:  () => fetch("/api/db-data?type=personnel",  { headers: H }).then(r => r.ok ? r.json() : []),
    divisions:  () => fetch("/api/divisions",               { headers: H }).then(r => r.ok ? r.json() : []),
    incidents:  () => fetch("/api/incidents",               { headers: H }).then(r => r.ok ? r.json() : []),
    modules:    () => fetch("/api/modules",                 { headers: H }).then(r => r.ok ? r.json() : []),
    codex:      () => fetch("/api/codex", { headers: H }).then(r =>
      r.ok ? r.json().then((sections: Array<{ entries?: CodexEntry[] }>) =>
        sections.flatMap(s => (s.entries ?? []).map(e => ({ id: e.id, title: e.title })))
      ) : []
    ),
    audio:   () => fetch("/api/audio",                 { headers: H }).then(r => r.ok ? r.json() : []),
    events:  () => fetch("/api/events",                { headers: H }).then(r => r.ok ? r.json() : []),
    puzzles: () => fetch("/api/cipher",                { headers: H }).then(r => r.ok ? r.json() : []),
    observation_points:    () => fetch("/api/observation-points",    { headers: H }).then(r => r.ok ? r.json() : []),
    observation_logs:      () => fetch("/api/observation-logs",      { headers: H }).then(r => r.ok ? r.json() : []),
    dimension_cracks:      () => fetch("/api/dimension-cracks",      { headers: H }).then(r => r.ok ? r.json() : []),
    case_reports:          () => fetch("/api/case-reports",          { headers: H }).then(r => r.ok ? r.json() : []),
    operation_records:     () => fetch("/api/operation-records",     { headers: H }).then(r => r.ok ? r.json() : []),
    containment_protocols: () => fetch("/api/containment-protocols", { headers: H }).then(r => r.ok ? r.json() : []),
    research_theories:     () => fetch("/api/research-theories",     { headers: H }).then(r => r.ok ? r.json() : []),
    sigma_messages:        () => fetch("/api/sigma-messages",        { headers: H }).then(r => r.ok ? r.json() : []),
  };

  const result: Partial<DbCache> = {};
  await Promise.all(
    keys.map(async k => {
      const fn = sliceMap[k];
      if (fn) (result as Record<string, unknown>)[k] = await fn();
    })
  );
  return result;
}

// ─────────────────────────────────────────────────────────────────────
// ストア本体
// ─────────────────────────────────────────────────────────────────────

export const useDbCacheStore = create<DbCacheState>((set, get) => ({
  db:     null,
  status: "idle",

  load: async () => {
    // すでにロード済み or ロード中は何もしない
    const { status } = get();
    if (status === "ready" || status === "loading") return;

    set({ status: "loading" });
    try {
      const db = await fetchAll();
      set({ db, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  invalidate: async (keys) => {
    set({ status: "loading" });
    try {
      if (!keys) {
        // 全件再フェッチ
        const db = await fetchAll();
        set({ db, status: "ready" });
      } else {
        // 指定スライスのみ差し替え
        const partial = await fetchSlices(keys);
        set(s => ({
          db:     s.db ? { ...s.db, ...partial } : null,
          status: "ready",
        }));
      }
    } catch {
      set({ status: "error" });
    }
  },
}));
