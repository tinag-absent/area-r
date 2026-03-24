/*
 * NovelRenderer.tsx — 機関員日記レンダラー
 * Updated: 2026-03-23 — リファクタリング: タグ関連コードを tags/ に分離
 *
 *   Phase 1: [[REDACTED:理由]] 構文 / Segment 型に reason? 追加
 *   Phase 2: DIV- / INC- / MOD- / CDX- / AUD- タグ追加
 *   Phase 3: TagResolver プラグイン化 / Zustand キャッシュ
 *   Phase 4: 全タグをモーダル表示に統一・インラインカード情報量強化
 *   Phase 5: SKL- / ACH- / EVT- / PZL- / BUL- / NPC- タグ追加
 *   Refactor: tags/types.ts / tags/resolvers.ts / tags/ui.tsx に分離
 *
 * 新規タグの追加方法: docs/tag-system.md を参照
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBoundStore } from "@/store";
import { useDbCacheStore, type DbCache } from "@/store/dbCacheStore";
import type {
  Division, Incident, TagModule, CodexEntry,
  TagEvent, TagPuzzle, ObservationPoint, ObservationLog,
  DimensionCrack, CaseReport, OperationRecord, ContainmentProtocol,
  ResearchTheory, SigmaMessage,
} from "@/store/dbCacheStore";
import { NPC_COLORS, NPC_ICONS, NPC_TITLES, NPC_DESCRIPTIONS, NPC_CHAT_IDS, type NpcName } from "@/lib/npc-config";
import type { Mission, Facility, Entity, Equipment, Personnel } from "@/app/(app)/database/data";
import { SKILLS, BRANCHES, type Skill, type BranchId } from "@/app/(app)/skill-tree/data";
import { ACHIEVEMENTS_MASTER } from "@/lib/achievements-data";
// ── タグシステム（分離モジュール） ──────────────────────────────────
import { resolveTag } from "./tags/resolvers";
import type { TagKind, TagMeta, ModalState } from "./tags/types";
import { parseContent }       from "./parser";
import { NovelModalSwitch }   from "./NovelModal";
import { PHASE_DEFS, LAYER_DEFS, CERT_DEFS } from "./tags/types";
import {
  MONO, Row, Badge,
  THREAT_COLOR, SEVERITY_COLOR, ENERGY_COLOR,
  OUTCOME_COLOR, EVENT_STATUS_COLOR, MEMO_STATUS_COLOR, CATEGORY_COLOR,
} from "./tags/ui";

// resolveTag は tags/resolvers.ts から import

// ─────────────────────────────────────────────────────────────────────
// 汎用モーダルコンテンツ
// ─────────────────────────────────────────────────────────────────────

interface TagModalData {
  kind:  TagKind;
  id:    string;
  db:    DbCache;
}

export function TagModalContent({ kind, id, db }: TagModalData) {



  if (kind === "missions") {
    const rec = db.missions.find((r: Mission) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "LOCKED" || rec.description.includes("████");
    const color = "var(--color-warning)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.category.toUpperCase()} color={color} />
          <Badge text={`PHASE ${rec.phase}`} color={color} />
          <Badge text={rec.status} color={locked ? "rgba(255,255,255,0.3)" : color} />
        </div>
        <Row label="TITLE" value={rec.title} />
        <Row label="DIVISION" value={rec.assigned_division} />
        <Row label="ISSUED BY" value={rec.issued_by} />
        <Row label="ISSUED AT" value={rec.issued_at} />
        <Row label="XP REWARD" value={`+${rec.xp} XP`} />
        <Row label="REQUIRED" value={`CLR LV${rec.level}`} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
        {!locked && rec.objectives.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>OBJECTIVES</div>
            {rec.objectives.map((o, i) => (
              <div key={i} style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.55)", padding: "3px 0", paddingLeft: 12, borderLeft: "2px solid rgba(255,180,60,0.3)" }}>
                {o}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "facilities") {
    const rec = db.facilities.find((r: Facility) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "RESTRICTED" || rec.status === "CLASSIFIED";
    const color = "var(--color-success)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.type} color={color} />
          <Badge text={rec.status} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={`CLR LV${rec.clearance}`} color={color} />
        </div>
        <Row label="CODE" value={rec.code} />
        <Row label="LOCATION" value={locked ? "████████" : rec.location} />
        <Row label="ESTABLISHED" value={locked ? "████" : rec.established} />
        <Row label="STAFF" value={locked ? "███" : (rec.staff != null ? `${rec.staff}名` : "不明")} />
        {(!locked) && <Row label="DIVISIONS" value={rec.divisions_present.join(", ") || "—"} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
        {!locked && rec.notes && (
          <div style={{ marginTop: 10, ...MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>{rec.notes}</div>
        )}
      </>
    );
  }

  if (kind === "entities") {
    const rec = db.entities.find((r: Entity) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "CLASSIFIED";
    const color = locked ? "rgba(255,255,255,0.3)" : (THREAT_COLOR[rec.threat] ?? "var(--color-primary)");
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={`THREAT: ${rec.threat}`} color={color} />
          <Badge text={rec.classification.toUpperCase()} color={color} />
          <Badge text={rec.status} color={locked ? "rgba(255,255,255,0.3)" : color} />
        </div>
        <Row label="CODE" value={rec.code} />
        <Row label="FIRST DETECTED" value={locked ? "████-██-██" : rec.first_detected} />
        <Row label="NEUTRALIZED" value={locked ? "███" : (rec.neutralized ? "YES" : "NO")} />
        <Row label="CONTAINMENT" value={locked ? "████████████" : rec.containment_protocol} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
        {!locked && rec.observed_abilities.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>OBSERVED ABILITIES</div>
            {rec.observed_abilities.map((a, i) => (
              <div key={i} style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.55)", padding: "3px 0", paddingLeft: 12, borderLeft: `2px solid ${color}55` }}>{a}</div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "equipment") {
    const rec = db.equipment.find((r: Equipment) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "CLASSIFIED";
    const color = "var(--color-primary)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.category} color={color} />
          <Badge text={rec.status} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={`CLR LV${rec.clearance}`} color={color} />
        </div>
        <Row label="CODE" value={rec.code} />
        <Row label="WEIGHT" value={locked ? "███" : rec.weight} />
        <Row label="QUANTITY" value={locked ? "███" : (rec.quantity != null ? `${rec.quantity}基` : "不明")} />
        <Row label="ISSUED BY" value={locked ? "████████" : rec.issued_by} />
        <Row label="MAINTENANCE" value={locked ? "████" : rec.maintenance_cycle} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
        {!locked && Object.keys(rec.specifications).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>SPECIFICATIONS</div>
            {Object.entries(rec.specifications).map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8, ...MONO, fontSize: 10, color: "rgba(255,255,255,0.45)", padding: "2px 0" }}>
                <span style={{ minWidth: 80, color: "rgba(255,255,255,0.55)" }}>{k}</span><span>{v}</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "personnel") {
    const rec = db.personnel.find((r: Personnel) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "CLASSIFIED";
    const statusColor =
      locked                     ? "rgba(255,255,255,0.3)"
      : rec.status === "MISSING" ? "var(--color-danger)"
      : rec.status === "ACTIVE"  ? "var(--color-success)"
      : "var(--color-fg-dim)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.status} color={statusColor} />
          <Badge text={rec.division} color={statusColor} />
          <Badge text={`CLR LV${rec.clearance}`} color={statusColor} />
        </div>
        <Row label="CODENAME" value={rec.codename} />
        <Row label="ROLE" value={locked ? "████████" : rec.role} />
        <Row label="SPECIALIZATION" value={locked ? "████████" : rec.specialization} />
        <Row label="JOINED" value={locked ? "████-██-██" : rec.joined} />
        <Row label="LAST SEEN" value={locked ? "████-██-██" : rec.last_seen} />
        <Row label="MISSIONS" value={locked ? "███" : `${rec.missions_completed ?? 0}件`} />
        {(rec.anomaly_score != null) && <Row label="ANOMALY SCORE" value={locked ? "███" : `${rec.anomaly_score}`} />}
        {!locked && rec.notes && (
          <div style={{ marginTop: 10, ...MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>{rec.notes}</div>
        )}
      </>
    );
  }

  if (kind === "divisions") {
    const rec = db.divisions.find((r: Division) => r.id === id);
    if (!rec) return null;
    const color = rec.color ?? "var(--color-primary)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><Badge text={rec.name_en} color={color} /></div>
        <Row label="ID" value={rec.id} />
        <Row label="NAME" value={rec.name} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {rec.description}
        </div>
      </>
    );
  }

  if (kind === "incidents") {
    const rec = db.incidents.find((r: Incident) => r.id === id);
    if (!rec) return null;

    const color = SEVERITY_COLOR[rec.severity] ?? "var(--color-fg-muted)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.severity.toUpperCase()} color={color} />
          <Badge text={rec.status} color={color} />
        </div>
        <Row label="LOCATION" value={rec.location} />
        <Row label="DIVISION" value={rec.division} />
        <Row label="ENTITY" value={rec.entity || "不明"} />
        <Row label="GSI" value={`${rec.gsi}σ`} />
        <Row label="TIME" value={rec.time} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {rec.desc}
        </div>
      </>
    );
  }

  if (kind === "modules") {
    const rec = db.modules.find((r: TagModule) => r.id === id);
    if (!rec) return null;
    const locked = rec.classification === "classified";
    const color = ENERGY_COLOR[rec.energy] ?? "var(--color-primary)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.classification.toUpperCase()} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={`ENERGY: ${rec.energy}`} color={color} />
        </div>
        <Row label="CODE" value={rec.code} />
        <Row label="DEVELOPER" value={locked ? "████████" : rec.developer} />
        <Row label="RANGE" value={locked ? "███" : rec.range} />
        <Row label="DURATION" value={locked ? "███" : rec.duration} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
        {!locked && rec.details && (
          <div style={{ marginTop: 10, ...MONO, fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>{rec.details}</div>
        )}
        {!locked && rec.warning && (
          <div style={{ marginTop: 10, ...MONO, fontSize: 10, color: "var(--color-warning)", padding: "6px 10px", background: "rgba(255,180,60,0.06)", border: "1px solid rgba(255,180,60,0.2)", borderRadius: 2 }}>
            ⚠ {rec.warning}
          </div>
        )}
      </>
    );
  }

  if (kind === "codex") {
    const rec = db.codex.find((r: CodexEntry) => r.id === id);
    if (!rec) return null;
    return (
      <>
        <Row label="ID" value={rec.id} />
        <Row label="TITLE" value={rec.title} />
        <div style={{ marginTop: 12, fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          詳細はコーデックスページで確認できます。
        </div>
      </>
    );
  }

  // ── Phase 5 ──────────────────────────────────────────────────────────

  if (kind === "skills") {
    const rec = SKILLS.find((s: Skill) => s.id === id);
    if (!rec) return null;
    const branch = BRANCHES.find(b => b.id === rec.branch as BranchId);
    const color  = branch?.color ?? "var(--color-primary)";
    const reqSkills = rec.requires.map(rid => SKILLS.find(s => s.id === rid)).filter(Boolean) as Skill[];
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={branch?.label ?? rec.branch} color={color} />
          <Badge text={`TIER ${rec.tier}`} color={color} />
        </div>
        <Row label="BRANCH" value={branch?.label ?? rec.branch} />
        {<Row label="TIER" value={`${rec.tier} / 4`} />}
        <Row label="XP COST" value={`${rec.xpCost} XP`} />
        <Row label="ICON" value={rec.icon} />
        {(rec.requires.length > 0) && <Row label="REQUIRES" value={rec.requires.join(", ")} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {rec.description}
        </div>
        {reqSkills.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>前提スキル</div>
            {reqSkills.map(s => (
              <div key={s.id} style={{ ...MONO, fontSize: 11, color, padding: "3px 0 3px 12px", borderLeft: `2px solid ${color}44` }}>
                {s.icon} {s.label} <span style={{ opacity: 0.4 }}>({s.xpCost} XP)</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "achievements") {
    const rec = ACHIEVEMENTS_MASTER.find(a => a.key === id);
    if (!rec) return null;
    const secret = rec.is_secret === 1;
    const color  = "var(--color-warning)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={secret ? "SECRET" : "ACHIEVEMENT"} color={color} />
          <Badge text={`+${rec.xp_reward} XP`} color={color} />
        </div>
        <Row label="KEY" value={secret ? "████████████" : rec.key} />
        <Row label="ICON" value={secret ? "?" : rec.icon} />
        <Row label="REWARD" value={`${rec.xp_reward} XP`} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {secret ? "████████████████████████████" : rec.description}
        </div>
      </>
    );
  }

  if (kind === "events") {
    const rec = db.events.find((r: TagEvent) => r.id === id);
    if (!rec) return null;

    const color = EVENT_STATUS_COLOR[rec.status] ?? "var(--color-primary)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.status.toUpperCase()} color={color} />
          <Badge text={rec.eventType} color={color} />
        </div>
        <Row label="TRIGGER" value={rec.triggerAt} />
        {(rec.endAt) && <Row label="END AT" value={rec.endAt} />}
        {(rec.firedAt) && <Row label="FIRED AT" value={rec.firedAt} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {rec.description || "（詳細なし）"}
        </div>
      </>
    );
  }

  if (kind === "puzzles") {
    const rec = db.puzzles.find((r: TagPuzzle) => r.slug === id || r.id === id);
    if (!rec) return null;
    const color = "var(--color-warning)";
    // cipher_text の冒頭 40 文字だけ表示
    const preview = rec.cipher_text.slice(0, 40) + (rec.cipher_text.length > 40 ? "…" : "");
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
          <Badge text={`+${rec.xp_reward} XP`} color={color} />
        </div>
        <Row label="SLUG" value={rec.slug} />
        <Row label="CLR REQ" value={`LV${rec.clearance_req}`} />
        <Row label="REWARD" value={`${rec.xp_reward} XP`} />
        {(rec.hint) && <Row label="HINT" value={rec.hint} />}
        <div style={{ marginTop: 12 }}>
          <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>CIPHER PREVIEW</div>
          <div style={{ ...MONO, fontSize: 11, color, letterSpacing: "0.08em", lineHeight: 1.8, wordBreak: "break-all" }}>{preview}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <PuzzleLink slug={rec.slug} />
        </div>
      </>
    );
  }

  if (kind === "bulletin") {
    // BUL- はオンデマンドフェッチ済みデータを渡す想定
    // GenericTagModal 側で extra prop を受け取る設計にするため、ここでは placeholder
    return (
      <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
        読み込み中…
      </div>
    );
  }

  if (kind === "npc") {
    const npcName = id as NpcName;
    const style   = NPC_COLORS[npcName];
    if (!style) return null;
    const color   = style.name;
    const chatId  = NPC_CHAT_IDS[npcName];
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Badge text={"NPC"} color={color} />
          <Badge text={"ACTIVE"} color={color} />
        </div>
        <Row label="DESIGNATION" value={npcName} />
        <Row label="TITLE" value={NPC_TITLES[npcName]} />
        <Row label="ICON" value={NPC_ICONS[npcName]} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {NPC_DESCRIPTIONS[npcName]}
        </div>
        <div style={{ marginTop: 14 }}>
          <NpcChatLink npcName={npcName} chatId={chatId} color={color} />
        </div>
      </>
    );
  }

  // ── Phase 5B: 新規テーブルタグ ──────────────────────────────────────

  if (kind === "location" || kind === "rift_point") {
    const rec = db.observation_points.find((r: ObservationPoint) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "classified";
    const color  = kind === "rift_point" ? "var(--color-danger)" : "var(--color-success)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={kind === "rift_point" ? "RIFT POINT" : "LOCATION"} color={color} />
          <Badge text={rec.status.toUpperCase()} color={color} />
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="NAME" value={locked ? "████████" : rec.name} />
        <Row label="SHORT" value={locked ? "██" : rec.name_short} />
        {(rec.city_name) && <Row label="CITY" value={rec.city_name} />}
        <Row label="COORDS" value={locked ? "██.████, ██.████" : `${rec.lat.toFixed(4)}, ${rec.lon.toFixed(4)}`} />
        {(rec.gsi_current != null) && <Row label="GSI CURRENT" value={`${rec.gsi_current}σ`} />}
        {rec.notes && !locked && <Row label="NOTES" value={rec.notes} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
      </>
    );
  }

  if (kind === "gsi_log" || kind === "signal_log" || kind === "scan_log") {
    const rec = db.observation_logs.find((r: ObservationLog) => r.id === id);
    if (!rec) return null;
    const color = SEVERITY_COLOR[rec.severity] ?? "var(--color-warning)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.type.toUpperCase()} color={color} />
          <Badge text={rec.severity.toUpperCase()} color={color} />
          {rec.clearance_req > 0 && <Badge text={`CLR LV${rec.clearance_req}`} color={color} />}
        </div>
        <Row label="OBSERVED" value={rec.observed_at} />
        {(rec.location_ref) && <Row label="LOCATION" value={rec.location_ref} />}
        {(rec.entity_ref) && <Row label="ENTITY" value={rec.entity_ref} />}
        {(rec.gsi_value != null) && <Row label="GSI VALUE" value={`${rec.gsi_value}σ`} />}
        {(rec.gsi_baseline != null) && <Row label="BASELINE" value={`${rec.gsi_baseline}σ`} />}
        {(rec.freq_band) && <Row label="FREQ BAND" value={rec.freq_band} />}
        {(rec.amplitude_db != null) && <Row label="AMPLITUDE" value={`+${rec.amplitude_db}dB`} />}
        {(rec.duration_sec != null) && <Row label="DURATION" value={`${rec.duration_sec}s`} />}
        {(rec.pattern_match) && <Row label="PATTERN" value={rec.pattern_match} />}
        {(rec.scan_area) && <Row label="SCAN AREA" value={rec.scan_area} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {rec.description}
        </div>
        {Array.isArray(rec.findings_json) && rec.findings_json.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>FINDINGS</div>
            {(rec.findings_json as { type?: string; ref?: string; desc?: string }[]).map((f, i) => (
              <div key={i} style={{ ...MONO, fontSize: 10, color, padding: "3px 0 3px 10px", borderLeft: `2px solid ${color}44` }}>
                {f.type && <span style={{ opacity: 0.5 }}>[{f.type}] </span>}
                {f.ref && <span style={{ fontWeight: 700 }}>{f.ref} </span>}
                {f.desc}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "crack") {
    const rec = db.dimension_cracks.find((r: DimensionCrack) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "classified";
    const color  = SEVERITY_COLOR[rec.severity] ?? "var(--color-danger)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.severity.toUpperCase()} color={color} />
          <Badge text={rec.status.toUpperCase()} color={color} />
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="LOCATION" value={locked ? "████████" : rec.location} />
        <Row label="FIRST DETECTED" value={locked ? "████-██-██" : rec.first_detected} />
        {(rec.sealed_at) && <Row label="SEALED AT" value={rec.sealed_at} />}
        {(rec.gsi_peak != null) && <Row label="GSI PEAK" value={`${rec.gsi_peak}σ`} />}
        {!locked && rec.entity_emerged.length > 0 && <Row label="ENTITIES" value={rec.entity_emerged.join(", ")} />}
        {rec.notes && !locked && (
          <div style={{ marginTop: 10, ...MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>{rec.notes}</div>
        )}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
      </>
    );
  }

  if (kind === "case_report") {
    const rec = db.case_reports.find((r: CaseReport) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "classified";
    const color  = "var(--color-danger)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.status.toUpperCase()} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="CASE DATE" value={locked ? "████-██-██" : rec.case_date} />
        {(rec.closed_date) && <Row label="CLOSED" value={locked ? "████-██-██" : rec.closed_date} />}
        <Row label="DIVISION" value={locked ? "████████" : (rec.division_ref ?? "不明")} />
        {(rec.entity_ref) && <Row label="ENTITY" value={locked ? "████" : rec.entity_ref} />}
        {(rec.location_ref) && <Row label="LOCATION" value={locked ? "████████" : rec.location_ref} />}
        <Row label="CASUALTIES" value={locked ? "███" : `${rec.casualties}名`} />
        {!locked && rec.personnel_json.length > 0 && <Row label="PERSONNEL" value={rec.personnel_json.join(", ")} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.summary}
        </div>
      </>
    );
  }

  if (kind === "operation") {
    const rec = db.operation_records.find((r: OperationRecord) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "classified";

    const color = OUTCOME_COLOR[rec.outcome] ?? "var(--color-warning)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.status.toUpperCase()} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={rec.outcome.toUpperCase()} color={color} />
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="CODENAME" value={rec.codename} />
        <Row label="OP DATE" value={locked ? "████-██-██" : rec.op_date} />
        {(rec.end_date) && <Row label="END DATE" value={locked ? "████-██-██" : rec.end_date} />}
        <Row label="COMMANDER" value={locked ? "████" : (rec.commander_ref ?? "不明")} />
        {(rec.target_ref) && <Row label="TARGET" value={locked ? "████" : rec.target_ref} />}
        {(rec.location_ref) && <Row label="LOCATION" value={locked ? "████████" : rec.location_ref} />}
        <Row label="CASUALTIES" value={locked ? "███" : `${rec.casualties}名`} />
        {!locked && rec.division_json.length > 0 && <Row label="DIVISIONS" value={rec.division_json.join(", ")} />}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.description}
        </div>
      </>
    );
  }

  if (kind === "protocol") {
    const rec = db.containment_protocols.find((r: ContainmentProtocol) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "classified";
    const color  = "var(--color-danger)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.status.toUpperCase()} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="CODENAME" value={rec.codename} />
        <Row label="DIVISION" value={locked ? "████████" : (rec.division_ref ?? "封印部門")} />
        <Row label="THREAT CLASS" value={locked ? "████" : rec.threat_class} />
        {rec.warnings && !locked && (
          <div style={{ marginTop: 10, ...MONO, fontSize: 10, color: "var(--color-warning)", padding: "6px 10px", background: "rgba(255,180,60,0.06)", border: "1px solid rgba(255,180,60,0.2)", borderRadius: 2 }}>
            ⚠ {rec.warnings}
          </div>
        )}
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.summary}
        </div>
        {!locked && rec.steps_json.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>PROCEDURE</div>
            {rec.steps_json.map(s => (
              <div key={s.step} style={{ display: "flex", gap: 8, ...MONO, fontSize: 10, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ color, minWidth: 20, flexShrink: 0 }}>#{s.step}</span>
                <div>
                  <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{s.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "theory") {
    const rec = db.research_theories.find((r: ResearchTheory) => r.id === id);
    if (!rec) return null;
    const locked = rec.status === "classified";
    const color  = "var(--color-primary)";
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={rec.status.toUpperCase()} color={locked ? "rgba(255,255,255,0.3)" : color} />
          <Badge text={`信頼度 ${rec.confidence}%`} color={color} />
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="AUTHOR" value={locked ? "████" : (rec.author_ref ?? "不明")} />
        <Row label="DIVISION" value={locked ? "████████" : (rec.division_ref ?? "記録部門")} />
        <Row label="PROPOSED" value={locked ? "████-██-██" : rec.proposed_at} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          {locked ? "████████████████████████████" : rec.abstract}
        </div>
        {!locked && Array.isArray(rec.evidence_json) && rec.evidence_json.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>EVIDENCE</div>
            {(rec.evidence_json as { type?: string; ref?: string; desc?: string }[]).map((ev, i) => (
              <div key={i} style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.45)", padding: "3px 0 3px 10px", borderLeft: `2px solid ${color}44` }}>
                {ev.ref && <span style={{ color, fontWeight: 700 }}>{ev.ref} </span>}
                {ev.desc}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "phase") {
    const n   = parseInt(id.replace(/^PHASE-?/i, ""), 10);
    const def = PHASE_DEFS[n];
    if (!def) return null;
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><Badge text={`PHASE ${n}`} color={def.color} /></div>
        <Row label="LABEL" value={def.label} />
        <Row label="SUB" value={def.sub} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>{def.desc}</div>
      </>
    );
  }

  if (kind === "layer") {
    const n   = parseInt(id.replace(/^LAYER-?/i, ""), 10);
    const def = LAYER_DEFS[n];
    if (!def) return null;
    const isSecret = n >= 5;
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Badge text={`LAYER ${n}`} color={def.color} />
          {isSecret && <Badge text="CLR LV3+" color={def.color} />}
        </div>
        <Row label="NAME" value={def.label} />
        <Row label="SUB" value={def.sub} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>{def.desc}</div>
      </>
    );
  }

  if (kind === "cert") {
    const n   = parseInt(id.replace(/^CERT-?LV?/i, ""), 10);
    const def = CERT_DEFS[n];
    if (!def) return null;
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><Badge text={`LV${n}`} color={def.color} /></div>
        <Row label="LEVEL" value={`LV${n}`} />
        <Row label="CREDENTIAL" value={def.label} />
        <Row label="SCOPE" value={def.sub} />
        <div style={{ marginTop: 12, ...MONO, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          このクリアランス証明書はエージェントの権限と任務範囲を規定します。
        </div>
      </>
    );
  }

  if (kind === "sigma") {
    const rec = db.sigma_messages.find((r: SigmaMessage) => r.id === id);
    const color = "var(--color-primary, #00c8ff)";
    const num = rec ? String(rec.number).padStart(3, "0") : id.replace(/^SIGMA-MSG-?/i, "");
    if (!rec) return (
      <div style={{ ...MONO, fontSize: 11, color: "rgba(0,200,255,0.3)" }}>
        SIGMA TRANSMISSION #{num} — データ未取得
      </div>
    );
    const partial = rec.integrity < 100;
    // 整合性に応じて本文を部分的に伏字化
    function maskContent(text: string, pct: number): string {
      if (pct >= 100) return text;
      const chars = text.split("");
      const mask  = Math.floor(chars.length * (1 - pct / 100));
      const step  = Math.max(1, Math.floor(chars.length / Math.max(1, mask)));
      return chars.map((c, i) => (i % step === Math.floor(step / 2) && c !== "\n") ? "█" : c).join("");
    }
    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge text={`#${num}`} color={color} />
          {partial && <Badge text={`INTEGRITY ${rec.integrity}%`} color="var(--color-warning)" />}
          <Badge text={`CLR LV${rec.clearance_req}`} color={color} />
        </div>
        <Row label="RECEIVED" value={rec.received_at} />
        <Row label="MEDIUM" value={rec.medium} />
        {(rec.context_ref) && <Row label="CONTEXT" value={rec.context_ref} />}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "var(--color-fg-muted)", marginBottom: 6 }}>
            TRANSMISSION CONTENT {partial ? `(${rec.integrity}% RECOVERED)` : ""}
          </div>
          <div style={{
            ...MONO, fontSize: 11,
            color: partial ? "rgba(0,200,255,0.5)" : "rgba(0,200,255,0.75)",
            lineHeight: 1.95, whiteSpace: "pre-wrap",
            padding: "12px 14px",
            background: "rgba(0,200,255,0.03)",
            border: `1px solid var(--color-fg-muted)`,
            borderRadius: 2,
            fontFamily: "var(--font-ja, serif)",
            letterSpacing: "0.04em",
            animation: partial ? "pulse-dot 3s ease-in-out infinite" : undefined,
          }}>
            {maskContent(rec.content, rec.integrity) || "（内容を取得できません）"}
          </div>
        </div>
        {partial && (
          <div style={{ marginTop: 8, ...MONO, fontSize: 11, color: "var(--color-fg-muted)" }}>
            ※ データ整合性不良により一部欠損。完全版は上位クリアランスで閲覧可能。
          </div>
        )}
      </>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Phase 5 用ヘルパーコンポーネント
// ─────────────────────────────────────────────────────────────────────

function PuzzleLink({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/cipher")}
      style={{
        fontFamily: "var(--font-mono, monospace)", fontSize: 10,
        letterSpacing: "0.08em", padding: "5px 12px", borderRadius: 2,
        background: "rgba(255,180,60,0.08)", border: "1px solid rgba(255,180,60,0.3)",
        color: "var(--color-warning)", cursor: "pointer",
      }}
    >
      /cipher → {slug} を開く ↗
    </button>
  );
}

function NpcChatLink({ npcName, chatId, color }: { npcName: string; chatId: string; color: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/chat/${chatId}`)}
      style={{
        fontFamily: "var(--font-mono, monospace)", fontSize: 10,
        letterSpacing: "0.08em", padding: "5px 12px", borderRadius: 2,
        background: `${color}10`, border: `1px solid ${color}44`,
        color, cursor: "pointer",
      }}
    >
      {npcName} にDMを送る ↗
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// インラインカード（モーダルを開くボタン）
// ─────────────────────────────────────────────────────────────────────

interface InlineCardProps {
  id:            string;
  labelOverride?: string;
  db:            DbCache | null;
  onOpen:        (id: string) => void;
}

function InlineCard({ id, labelOverride, db, onOpen }: InlineCardProps) {
  const meta = resolveTag(id, db);

  if (!meta || meta.locked) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[11px] font-bold align-middle mx-0.5"
        style={{ color: "var(--color-fg-muted)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span aria-hidden="true">{meta?.icon ?? "?"}</span>
        {labelOverride ?? meta?.label ?? id}
      </span>
    );
  }

  const hasSub = !!meta.sub;

  return (
    <button
      onClick={() => onOpen(id)}
      title={`${meta.label} — クリックして詳細を表示`}
      className="inline-flex items-center gap-1.5 rounded-sm font-mono align-middle mx-0.5 cursor-pointer transition-all duration-150"
      style={{
        color:           meta.color,
        backgroundColor: "rgba(0,0,0,0.15)",
        border:          `1px solid ${meta.color}44`,
        lineHeight:      1,
        verticalAlign:   "middle",
        padding:         hasSub ? "4px 8px 4px 7px" : "4px 8px 4px 7px",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor     = `${meta.color}88`;
        el.style.backgroundColor = "rgba(0,0,0,0.3)";
        el.style.boxShadow       = `0 0 8px ${meta.color}20`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor     = `${meta.color}44`;
        el.style.backgroundColor = "rgba(0,0,0,0.15)";
        el.style.boxShadow       = "none";
      }}
    >
      {/* アイコン */}
      <span style={{ fontSize: "9px", opacity: 0.8 }} aria-hidden="true">{meta.icon}</span>

      {/* ラベル + サブ */}
      <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          {labelOverride ?? meta.label}
        </span>
        {hasSub && (
          <span style={{ fontSize: "8px", letterSpacing: "0.06em", opacity: 0.5, whiteSpace: "nowrap", fontWeight: 400 }}>
            {meta.sub}
          </span>
        )}
      </span>

      {/* コード */}
      {meta.code && (
        <span style={{ fontSize: "8px", letterSpacing: "0.04em", opacity: 0.35, flexShrink: 0 }}>
          [{meta.code}]
        </span>
      )}
      <span style={{ fontSize: "8px", opacity: 0.2 }} aria-hidden="true">↗</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 黒塗りブロック
// ─────────────────────────────────────────────────────────────────────

function RedactedBlock({ reason }: { reason?: string }) {
  return (
    <span
      title={reason ? `[機密区分: ${reason}]` : undefined}
      className="inline-block align-middle rounded-sm px-2 py-0.5 font-mono text-[13px] select-none mx-0.5 cursor-help"
      style={{ background: "rgba(0,0,0,0.85)", color: "transparent", border: "1px solid rgba(255,255,255,0.04)", userSelect: "none" }}
      aria-label={reason ? `機密情報（黒塗り）: ${reason}` : "機密情報（黒塗り）"}
    >
      ████████████
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ARG演出インラインコンポーネント群
// ─────────────────────────────────────────────────────────────────────

// 22: VOID — 存在消去（REDACTEDより強い・完全に何もない）
function VoidBlock() {
  return (
    <span
      aria-hidden="true"
      style={{
        display:        "inline-block",
        width:          "4.8em",
        height:         "1em",
        background:     "#000",
        verticalAlign:  "middle",
        margin:         "0 2px",
        userSelect:     "none",
        border:         "none",
        boxShadow:      "none",
      }}
    />
  );
}

// 23: CORRUPTED — 文字化けバッジ
const GLITCH_CHARS = "!?▓░█▒╳◌◍⚠";
function seededCorruptedLabel(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  const hex = Math.abs(h % 0xff).toString(16).toUpperCase().padStart(2, "0");
  return `ERR:0x${hex}█`;
}
function CorruptedBlock({ label }: { label?: string }) {
  const display = label
    ? label.split("").map((c, i) => i % 3 === 1 ? GLITCH_CHARS[i % GLITCH_CHARS.length] : c).join("")
    : seededCorruptedLabel(label ?? "CORRUPTED");
  return (
    <span
      className="glitch-text inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold align-middle mx-0.5 select-none"
      style={{
        color:      "var(--color-danger, #ff6b3c)",
        background: "rgba(255,107,60,0.07)",
        border:     "1px solid rgba(255,107,60,0.3)",
      }}
      aria-label="データ破損"
    >
      <span style={{ opacity: 0.7 }}>!</span>
      {display}
    </span>
  );
}

// 24: TIMESTAMP — インライン時刻
function TimestampBlock({ iso }: { iso: string }) {
  // "2026-03-13T02:17" or "2026-03-13 02:17" → 表示用に整形
  const display = iso.replace("T", " ").slice(0, 16);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] align-middle mx-0.5"
      style={{
        color:      "var(--color-fg-dim, rgba(255,255,255,0.45))",
        background: "rgba(255,255,255,0.03)",
        border:     "1px solid rgba(255,255,255,0.07)",
      }}
      aria-label={`タイムスタンプ: ${display}`}
    >
      <span style={{ opacity: 0.5 }}>▷</span>
      {display}
    </span>
  );
}

// 26: ANOMALY — GSI異常値バッジ
function AnomalyBlock({ value }: { value: string }) {
  // 数値部分を抽出して閾値判定
  const num    = parseFloat(value.replace(/[^0-9.]/g, ""));
  const unit   = value.includes("σ") ? "σ" : value.replace(/[0-9. ]/g, "") || "σ";
  const isHigh = num >= 4.0;
  const isMid  = num >= 2.0;
  const color  = isHigh ? "var(--color-danger, #ff6b3c)" : isMid ? "var(--color-warning, #c8a040)" : "var(--color-fg-muted)";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold align-middle mx-0.5 ${isHigh ? "glitch-text" : ""}`}
      style={{
        color,
        background: `${color}10`,
        border:     `1px solid ${color}44`,
        animation:  isHigh ? "pulse-danger 1.8s ease-in-out infinite" : isMid ? "pulse-warn 2.4s ease-in-out infinite" : "none",
      }}
      aria-label={`GSI異常値: ${value}`}
    >
      <span style={{ opacity: 0.8 }}>▲</span>
      {num.toFixed(1)}{unit}
    </span>
  );
}

// 27: USER — プレイヤーのエージェントID動的挿入
function UserTag() {
  const agentId = useBoundStore(s => s.user?.agentId ?? null);
  const level   = useBoundStore(s => s.user?.level   ?? 0);
  if (!agentId) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] align-middle mx-0.5"
        style={{ color: "var(--color-fg-muted)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
      >◐ [AGENT]</span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold align-middle mx-0.5"
      style={{
        color:      "var(--color-success, #50dc78)",
        background: "rgba(80,220,120,0.07)",
        border:     "1px solid rgba(80,220,120,0.3)",
      }}
      aria-label={`エージェントID: ${agentId}`}
    >
      <span>◐</span>
      {agentId}
      <span style={{ opacity: 0.4, fontWeight: 400 }}>LV{level}</span>
    </span>
  );
}

// 28: UNKNOWN — 未確認実体（識別試行中の点滅バッジ）
function UnknownBlock({ hint }: { hint?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[10px] align-middle mx-0.5"
      style={{
        color:      "var(--color-fg-muted, rgba(255,255,255,0.3))",
        background: "rgba(255,255,255,0.03)",
        border:     "1px dashed rgba(255,255,255,0.12)",
        animation:  "pulse-dot 2.8s ease-in-out infinite",
      }}
      aria-label={hint ? `未確認実体: ${hint}` : "未確認実体"}
    >
      <span style={{ opacity: 0.6 }}>?</span>
      <span style={{ fontStyle: "italic" }}>{hint ?? "[未確認実体]"}</span>
      <span style={{ opacity: 0.3, fontSize: 8 }}>SCANNING…</span>
    </span>
  );
}

// 29: CLASSIFIED:LVN — CLRレベル指定の動的黒塗り
function ClassifiedBlock({ level, label }: { level: number; label?: string }) {
  const userLevel = useBoundStore(s => s.user?.level ?? 0);
  const unlocked  = userLevel >= level;

  const levelColor =
    level >= 4 ? "var(--color-danger, #ff6b3c)"
    : level >= 3 ? "var(--color-warning, #c8a040)"
    : level >= 2 ? "var(--color-success, #50dc78)"
    : "var(--color-primary, #00c8ff)";

  if (unlocked) {
    // CLR足りている → ラベルを表示（または CLR足りているバッジ）
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] align-middle mx-0.5"
        style={{ color: levelColor, background: `${levelColor}0d`, border: `1px solid ${levelColor}33` }}
        aria-label={`CLR LV${level}解除済み`}
      >
        <span style={{ opacity: 0.7 }}>▣</span>
        {label ?? `CLR LV${level}`}
      </span>
    );
  }
  // CLR不足 → 黒塗り（ホバーでレベルが分かる）
  return (
    <span
      title={`CLEARANCE LEVEL ${level} REQUIRED`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] select-none align-middle mx-0.5 cursor-help"
      style={{
        color:      "transparent",
        background: "#000",
        border:     `1px solid ${levelColor}33`,
        userSelect: "none",
        boxShadow:  `0 0 6px ${levelColor}15`,
      }}
      aria-label={`機密情報 CLR LV${level}必要`}
    >
      ██████████
      <span style={{ color: levelColor, opacity: 0.6, fontSize: 8 }}>LV{level}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// レンダラー
// ─────────────────────────────────────────────────────────────────────

function renderParagraph(
  para: string,
  key: number,
  db: DbCache | null,
  onOpen: (id: string) => void,
): React.ReactNode {
  if (para.trim() === "") return <div key={key} className="h-4" aria-hidden="true" />;
  const isHeading = para.trimStart().startsWith("■");
  const segments  = parseContent(para);
  return (
    <p key={key} className="m-0 break-words" style={{
      color:         isHeading ? "var(--color-foreground)" : "var(--color-fg-dim)",
      fontSize:      isHeading ? "15px" : "14px",
      lineHeight:    "1.95",
      fontWeight:    isHeading ? "bold" : "normal",
      fontFamily:    isHeading ? "var(--font-display)" : "var(--font-ja)",
      letterSpacing: isHeading ? "0.06em" : "0.03em",
    }}>
      {segments.map((seg, i) => {
        if (seg.type === "text")       return <span key={i}>{seg.value}</span>;
        if (seg.type === "card")       return <InlineCard key={i} id={seg.id} labelOverride={seg.label} db={db} onOpen={onOpen} />;
        if (seg.type === "redacted")   return <RedactedBlock key={i} reason={seg.reason} />;
        if (seg.type === "void")       return <VoidBlock key={i} />;
        if (seg.type === "corrupted")  return <CorruptedBlock key={i} label={seg.label} />;
        if (seg.type === "timestamp")  return <TimestampBlock key={i} iso={seg.iso} />;
        if (seg.type === "anomaly")    return <AnomalyBlock key={i} value={seg.value} />;
        if (seg.type === "user_tag")   return <UserTag key={i} />;
        if (seg.type === "unknown")    return <UnknownBlock key={i} hint={seg.hint} />;
        if (seg.type === "classified") return <ClassifiedBlock key={i} level={seg.level} label={seg.label} />;
        return null;
      })}
    </p>
  );
}

export function NovelRenderer({ content, className = "" }: { content: string; className?: string }) {
  const { db, load } = useDbCacheStore();
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => { load(); }, [load]);

  const handleOpen = useCallback(async (id: string) => {
    if (!db) return;
    const meta = resolveTag(id, db);
    if (!meta) return;

    // 掲示板はオンデマンドフェッチが必要な専用モーダル
    if (meta.kind === "bulletin") {
      setModal({ type: "bulletin", id, meta });
      return;
    }

    // 機関員メモはオンデマンドフェッチが必要な専用モーダル
    if (meta.kind === "memo") {
      setModal({ type: "memo", id, meta });
      return;
    }

    // OBSERVER — 4th wall 演出
    if (meta.kind === "observer") {
      setModal({ type: "observer" });
      return;
    }

    // 音声タグは transcript をフェッチしてから専用モーダルを開く
    if (meta.kind === "audio") {
      const H = { "X-Requested-With": "XMLHttpRequest" };
      try {
        const res = await fetch(`/api/audio?id=${encodeURIComponent(id)}`, { headers: H });
        if (!res.ok) return;
        const row = await res.json();
        setModal({
          type: "audio",
          data: {
            id: row.id, title: row.title, filename: row.filename,
            duration_sec: row.duration_sec, recorded_at: row.recorded_at,
            recorded_by: row.recorded_by, location_ref: row.location_ref,
            classification: row.classification, clearance_req: row.clearance_req,
            voice_detected: row.voice_detected, integrity: row.integrity,
            gsi_value: row.gsi_value, entity_ref: row.entity_ref,
            transcript: Array.isArray(row.transcript_json) ? row.transcript_json : [],
          },
        });
      } catch { /* ignore */ }
      return;
    }

    setModal({ type: "generic", kind: meta.kind, id, meta });
  }, [db]);

  return (
    <>
      <div className={`flex flex-col gap-4 ${className}`}>
        {content.split("\n").map((para, i) => renderParagraph(para, i, db, handleOpen))}
      </div>

      <NovelModalSwitch modal={modal} db={db} onClose={() => setModal(null)} />
    </>
  );
}
