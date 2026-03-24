/**
 * tags/resolvers.ts — インラインカード用リゾルバ関数群
 *
 * 各 resolveXxx() は DB + ID → TagMeta | null を返す純関数。
 * モーダル表示ロジックはここに書かない（tags/modals.tsx に分離）。
 *
 * 新規タグ追加手順は tags/types.ts のコメントを参照。
 */

import type { DbCache } from "@/store/dbCacheStore";
import type {
  Mission, Facility, Entity, Equipment, Personnel,
} from "@/app/(app)/database/data";
import type {
  Division, Incident, TagModule, CodexEntry, AudioRecord,
  TagEvent, TagPuzzle,
  ObservationPoint, ObservationLog, DimensionCrack,
  CaseReport, OperationRecord, ContainmentProtocol,
  ResearchTheory, SigmaMessage,
} from "@/store/dbCacheStore";
import { SKILLS, BRANCHES, type Skill, type BranchId } from "@/app/(app)/skill-tree/data";
import { ACHIEVEMENTS_MASTER } from "@/lib/achievements-data";
import { NPC_COLORS, NPC_ICONS, NPC_TITLES, type NpcName } from "@/lib/npc-config";
import {
  THREAT_COLOR, SEVERITY_COLOR, ENERGY_COLOR,
  OUTCOME_COLOR, EVENT_STATUS_COLOR,
} from "./ui";
import { PHASE_DEFS, LAYER_DEFS, CERT_DEFS, type TagMeta, type TagResolver } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Phase 1–4 リゾルバ
// ─────────────────────────────────────────────────────────────────────

function resolveMission(id: string, db: DbCache): TagMeta | null {
  const rec = db.missions.find((r: Mission) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "LOCKED" || rec.description.includes("████");
  return {
    kind: "missions", icon: "◆",
    color: "var(--color-warning)",
    label: locked ? `MISSION ${id}` : rec.title,
    sub:   locked ? undefined : `${rec.category.toUpperCase()} · ${rec.assigned_division}`,
    code:  `PHASE ${rec.phase}`,
    locked,
  };
}

function resolveFacility(id: string, db: DbCache): TagMeta | null {
  const rec = db.facilities.find((r: Facility) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "RESTRICTED" || rec.status === "CLASSIFIED";
  return {
    kind: "facilities", icon: "⬡",
    color: "var(--color-success)",
    label: locked ? id : rec.name,
    sub:   locked ? undefined : `${rec.type} · ${rec.location}`,
    code:  rec.code,
    locked,
  };
}

function resolveEntity(id: string, db: DbCache): TagMeta | null {
  const rec = db.entities.find((r: Entity) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "CLASSIFIED";
  return {
    kind: "entities", icon: "◎",
    color:  locked ? "var(--color-fg-muted)" : (THREAT_COLOR[rec.threat] ?? "var(--color-primary)"),
    label:  locked ? "████ ████" : rec.designation,
    sub:    locked ? undefined : `THREAT: ${rec.threat} · ${rec.classification.toUpperCase()}`,
    code:   rec.code,
    locked,
  };
}

function resolveEquipment(id: string, db: DbCache): TagMeta | null {
  const rec = db.equipment.find((r: Equipment) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "CLASSIFIED";
  return {
    kind: "equipment", icon: "◈",
    color: "var(--color-primary)",
    label: locked ? "████████" : rec.name,
    sub:   locked ? undefined : `${rec.category} · ${rec.status}`,
    code:  rec.code,
    locked,
  };
}

function resolvePersonnel(id: string, db: DbCache): TagMeta | null {
  const rec = db.personnel.find((r: Personnel) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "CLASSIFIED";
  const statusColor =
    locked                     ? "var(--color-fg-muted)"
    : rec.status === "MISSING" ? "var(--color-danger)"
    : rec.status === "ACTIVE"  ? "var(--color-success)"
    : "var(--color-fg-dim)";
  return {
    kind: "personnel", icon: "◐",
    color: statusColor,
    label: locked ? "████" : rec.codename,
    sub:   locked ? undefined : `${rec.role} · ${rec.division}`,
    code:  locked ? undefined : rec.status,
    locked,
  };
}

function resolveDivision(id: string, db: DbCache): TagMeta | null {
  const rec = db.divisions.find((r: Division) => r.id === id);
  if (!rec) return null;
  return {
    kind: "divisions", icon: "⬢",
    color: rec.color ?? "var(--color-primary)",
    label: rec.name,
    sub:   rec.name_en,
    code:  id,
    locked: false,
  };
}

function resolveIncident(id: string, db: DbCache): TagMeta | null {
  const rec = db.incidents.find((r: Incident) => r.id === id);
  if (!rec) return null;
  const locked = rec.severity === "critical" && rec.status === "対応中";
  return {
    kind: "incidents", icon: "⚠",
    color: SEVERITY_COLOR[rec.severity] ?? "var(--color-fg-muted)",
    label: locked ? "[機密インシデント]" : rec.name,
    sub:   locked ? undefined : `${rec.status} · ${rec.location}`,
    code:  `GSI:${rec.gsi}`,
    locked,
  };
}

function resolveModule(id: string, db: DbCache): TagMeta | null {
  const rec = db.modules.find((r: TagModule) => r.id === id);
  if (!rec) return null;
  const locked = rec.classification === "classified";
  return {
    kind: "modules", icon: "◈",
    color: locked ? "var(--color-fg-muted)" : (ENERGY_COLOR[rec.energy] ?? "var(--color-primary)"),
    label: locked ? "███████" : rec.name,
    sub:   locked ? undefined : `${rec.range} · ${rec.duration} · エネルギー:${rec.energy}`,
    code:  locked ? undefined : rec.code,
    locked,
  };
}

function resolveCodex(id: string, db: DbCache): TagMeta | null {
  const rec = db.codex.find((r: CodexEntry) => r.id === id);
  if (!rec) return null;
  return {
    kind: "codex", icon: "◉",
    color: "var(--color-fg-dim)",
    label: rec.title,
    sub:   "CODEX ENTRY",
    code:  id,
    locked: false,
  };
}

function resolveAudio(id: string, db: DbCache): TagMeta | null {
  const rec = db.audio.find((r: AudioRecord) => r.id === id);
  if (!rec) return null;
  const locked      = rec.classification === "classified";
  const isStatic    = rec.voice_detected === 0;
  const isCorrupted = rec.integrity < 100;
  const color =
    locked        ? "var(--color-fg-muted)"
    : isStatic    ? "var(--color-warning)"
    : isCorrupted ? "var(--color-danger)"
    : "var(--color-primary)";
  const dur = rec.duration_sec;
  const mm = String(Math.floor(dur / 60)).padStart(2, "0");
  const ss = String(dur % 60).padStart(2, "0");
  const state = locked ? "CLASSIFIED" : isStatic ? "STATIC" : isCorrupted ? "CORRUPTED" : "CLEAR";
  return {
    kind: "audio", icon: isStatic ? "~" : isCorrupted ? "!" : "▶",
    color,
    label: locked ? "████████████" : rec.title,
    sub:   locked ? undefined : `${state} · ${mm}:${ss}`,
    code:  locked ? undefined : rec.recorded_at.slice(0, 10),
    locked,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Phase 5A リゾルバ
// ─────────────────────────────────────────────────────────────────────

function resolveSkill(id: string, _db: DbCache): TagMeta | null {
  const rec    = SKILLS.find((s: Skill) => s.id === id);
  if (!rec) return null;
  const branch = BRANCHES.find(b => b.id === rec.branch as BranchId);
  return {
    kind: "skills", icon: branch?.icon ?? "◇",
    color: branch?.color ?? "var(--color-primary)",
    label: rec.label,
    sub:   `${branch?.label ?? rec.branch} · Tier ${rec.tier}`,
    code:  `${rec.xpCost} XP`,
    locked: false,
  };
}

function resolveAchievement(id: string, _db: DbCache): TagMeta | null {
  const rec    = ACHIEVEMENTS_MASTER.find(a => a.key === id);
  if (!rec) return null;
  const secret = rec.is_secret === 1;
  return {
    kind: "achievements", icon: "★",
    color: "var(--color-warning)",
    label: secret ? "????????" : rec.title,
    sub:   secret ? "SECRET ACHIEVEMENT" : `+${rec.xp_reward} XP`,
    code:  secret ? "SECRET" : rec.icon,
    locked: false,
  };
}

function resolveEvent(id: string, db: DbCache): TagMeta | null {
  const rec = db.events.find((r: TagEvent) => r.id === id);
  if (!rec) return null;
  return {
    kind: "events", icon: "◈",
    color: EVENT_STATUS_COLOR[rec.status] ?? "var(--color-primary)",
    label: rec.title,
    sub:   `${rec.status.toUpperCase()} · ${rec.triggerAt.slice(0, 10)}`,
    code:  rec.eventType,
    locked: false,
  };
}

function resolvePuzzle(id: string, db: DbCache): TagMeta | null {
  const rec = db.puzzles.find((r: TagPuzzle) => r.slug === id || r.id === id);
  if (!rec) return null;
  return {
    kind: "puzzles", icon: "?",
    color: "var(--color-warning)",
    label: rec.title,
    sub:   `CLR LV${rec.clearance_req} · +${rec.xp_reward} XP`,
    code:  rec.slug,
    locked: false,
  };
}

function resolveNpc(id: string, _db: DbCache): TagMeta | null {
  const npcName = id as NpcName;
  const style   = NPC_COLORS[npcName];
  if (!style) return null;
  return {
    kind: "npc", icon: NPC_ICONS[npcName] ?? "◐",
    color: style.name,
    label: npcName,
    sub:   NPC_TITLES[npcName],
    code:  "NPC",
    locked: false,
  };
}

// BUL- はクリック時オンデマンドフェッチ → スタブリゾルバ
function resolveBulletin(id: string, _db: DbCache): TagMeta | null {
  return {
    kind: "bulletin", icon: "◎",
    color: "var(--color-fg-dim)",
    label: `BULLETIN #${id}`,
    sub:   "掲示板投稿",
    code:  id,
    locked: false,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Phase 5B リゾルバ（新規テーブル）
// ─────────────────────────────────────────────────────────────────────

function resolveLocation(id: string, db: DbCache): TagMeta | null {
  const rec = db.observation_points.find((r: ObservationPoint) => r.id === id && r.type === "location");
  if (!rec) return null;
  const locked = rec.status === "classified";
  return {
    kind: "location", icon: "⬡",
    color: locked ? "var(--color-fg-muted)" : "var(--color-success)",
    label: locked ? id : rec.name,
    sub:   locked ? undefined : `LOCATION · ${rec.city_name ?? ""}`,
    code:  `LV${rec.clearance_req}`,
    locked,
  };
}

function resolveRift(id: string, db: DbCache): TagMeta | null {
  const rec = db.observation_points.find((r: ObservationPoint) => r.id === id && r.type === "rift_point");
  if (!rec) return null;
  const locked = rec.status === "classified";
  return {
    kind: "rift_point", icon: "⊗",
    color: locked ? "var(--color-fg-muted)" : "var(--color-danger)",
    label: locked ? id : rec.name,
    sub:   locked ? undefined : `GSI: ${rec.gsi_current ?? "?"}σ · ${rec.status}`,
    code:  "RIFT",
    locked,
  };
}

function resolveGsiLog(id: string, db: DbCache): TagMeta | null {
  const rec = db.observation_logs.find((r: ObservationLog) => r.id === id && r.type === "gsi");
  if (!rec) return null;
  return {
    kind: "gsi_log", icon: "▲",
    color: SEVERITY_COLOR[rec.severity] ?? "var(--color-warning)",
    label: rec.title,
    sub:   `GSI ${rec.gsi_value ?? "?"}σ · ${rec.observed_at.slice(0, 10)}`,
    code:  rec.location_ref ?? undefined,
    locked: false,
  };
}

function resolveSignalLog(id: string, db: DbCache): TagMeta | null {
  const rec = db.observation_logs.find((r: ObservationLog) => r.id === id && r.type === "signal");
  if (!rec) return null;
  return {
    kind: "signal_log", icon: "~",
    color: "var(--color-primary)",
    label: rec.title,
    sub:   `${rec.freq_band ?? "??"} · ${rec.amplitude_db != null ? `+${rec.amplitude_db}dB` : ""}`,
    code:  "SIGNAL",
    locked: false,
  };
}

function resolveScanLog(id: string, db: DbCache): TagMeta | null {
  const rec = db.observation_logs.find((r: ObservationLog) => r.id === id && r.type === "scan");
  if (!rec) return null;
  return {
    kind: "scan_log", icon: "▷",
    color: "var(--color-fg-dim)",
    label: rec.title,
    sub:   `SCAN · ${rec.observed_at.slice(0, 10)}`,
    code:  `LV${rec.clearance_req}`,
    locked: false,
  };
}

function resolveCrack(id: string, db: DbCache): TagMeta | null {
  const rec    = db.dimension_cracks.find((r: DimensionCrack) => r.id === id);
  if (!rec) return null;
  const locked = rec.clearance_req > 0 && rec.status === "classified";
  return {
    kind: "crack", icon: "◉",
    color: locked ? "var(--color-fg-muted)" : (SEVERITY_COLOR[rec.severity] ?? "var(--color-danger)"),
    label: locked ? `████ ${id}` : rec.name,
    sub:   locked ? undefined : `${rec.status.toUpperCase()} · ${rec.location}`,
    code:  rec.gsi_peak != null ? `GSI: ${rec.gsi_peak}σ` : undefined,
    locked,
  };
}

// MEMO- はクリック時オンデマンドフェッチ → スタブリゾルバ
function resolveMemo(id: string, _db: DbCache): TagMeta | null {
  return {
    kind: "memo", icon: "◇",
    color: "var(--color-fg-dim)",
    label: `MEMO ${id}`,
    sub:   "機関員メモ（遺留品）",
    code:  id,
    locked: false,
  };
}

function resolveCaseReport(id: string, db: DbCache): TagMeta | null {
  const rec    = db.case_reports.find((r: CaseReport) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "classified";
  return {
    kind: "case_report", icon: "◎",
    color: locked ? "var(--color-fg-muted)" : "var(--color-danger)",
    label: locked ? `[機密] ${id}` : rec.title,
    sub:   locked ? undefined : `${rec.status.toUpperCase()} · ${rec.case_date.slice(0, 10)}`,
    code:  `CLR LV${rec.clearance_req}`,
    locked,
  };
}

function resolveOperation(id: string, db: DbCache): TagMeta | null {
  const rec    = db.operation_records.find((r: OperationRecord) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "classified";
  return {
    kind: "operation", icon: "◆",
    color: locked ? "var(--color-fg-muted)" : (OUTCOME_COLOR[rec.outcome] ?? "var(--color-warning)"),
    label: locked ? "[機密作戦]" : `${rec.codename}作戦`,
    sub:   locked ? undefined : `${rec.status.toUpperCase()} · ${rec.op_date.slice(0, 7)}`,
    code:  locked ? undefined : rec.outcome.toUpperCase(),
    locked,
  };
}

function resolveProtocol(id: string, db: DbCache): TagMeta | null {
  const rec    = db.containment_protocols.find((r: ContainmentProtocol) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "classified";
  return {
    kind: "protocol", icon: "⬢",
    color: locked ? "var(--color-fg-muted)" : "var(--color-danger)",
    label: locked ? "████ PROTOCOL" : rec.codename,
    sub:   locked ? undefined : `${rec.division_ref ?? "封印部門"} · ${rec.status.toUpperCase()}`,
    code:  `CLR LV${rec.clearance_req}`,
    locked,
  };
}

function resolveTheory(id: string, db: DbCache): TagMeta | null {
  const rec    = db.research_theories.find((r: ResearchTheory) => r.id === id);
  if (!rec) return null;
  const locked = rec.status === "classified";
  return {
    kind: "theory", icon: "◉",
    color: locked ? "var(--color-fg-muted)" : "var(--color-primary)",
    label: locked ? "[機密仮説]" : rec.title,
    sub:   locked ? undefined : `${rec.status.toUpperCase()} · ${rec.division_ref ?? "記録部門"}`,
    code:  locked ? undefined : `信頼度 ${rec.confidence}%`,
    locked,
  };
}

function resolveSigma(id: string, db: DbCache): TagMeta | null {
  const rec     = db.sigma_messages.find((r: SigmaMessage) => r.id === id);
  const partial = rec ? rec.integrity < 100 : false;
  const num     = rec ? String(rec.number).padStart(3, "0") : id.replace(/^SIGMA-MSG-?/i, "");
  if (!rec) {
    return {
      kind: "sigma", icon: "◎",
      color: "var(--color-primary)",
      label: id, sub: "SIGMA TRANSMISSION",
      code: undefined, locked: false,
    };
  }
  return {
    kind: "sigma", icon: "◎",
    color: "var(--color-primary)",
    label: `SIGMA #${num}`,
    sub:   `${partial ? "PARTIAL " : ""}${rec.received_at.slice(0, 10)} · ${rec.medium.slice(0, 12)}`,
    code:  partial ? `${rec.integrity}%` : undefined,
    locked: false,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 静的タグリゾルバ
// ─────────────────────────────────────────────────────────────────────

function resolvePhase(id: string, _db: DbCache): TagMeta | null {
  const n   = parseInt(id.replace(/^PHASE-?/i, ""), 10);
  const def = PHASE_DEFS[n];
  if (!def) return null;
  return { kind: "phase", icon: "◆", color: def.color, label: def.label, sub: def.sub, code: `P${n}`, locked: false };
}

function resolveLayer(id: string, _db: DbCache): TagMeta | null {
  const n   = parseInt(id.replace(/^LAYER-?/i, ""), 10);
  const def = LAYER_DEFS[n];
  if (!def) return null;
  return { kind: "layer", icon: "≡", color: def.color, label: def.label, sub: def.sub, code: `L${n}`, locked: false };
}

function resolveCert(id: string, _db: DbCache): TagMeta | null {
  const n   = parseInt(id.replace(/^CERT-?LV?/i, ""), 10);
  const def = CERT_DEFS[n];
  if (!def) return null;
  return { kind: "cert", icon: "▣", color: def.color, label: def.label, sub: def.sub, code: `LV${n}`, locked: false };
}

function resolveCipher(id: string, db: DbCache): TagMeta | null {
  const slug = id.replace(/^CIPHER-?/i, "").toLowerCase();
  const rec  = db.puzzles.find((r: TagPuzzle) => r.slug.toLowerCase() === slug || r.id === id);
  const displayId = id.replace(/^CIPHER-?/i, "");
  if (!rec) {
    return {
      kind: "puzzles", icon: "?",
      color: "var(--color-warning)",
      label: `CIPHER-${displayId}`,
      sub:   "暗号文書", code: "CIPHER", locked: false,
    };
  }
  return {
    kind: "puzzles", icon: "?",
    color: "var(--color-warning)",
    label: rec.title,
    sub:   `CLR LV${rec.clearance_req} · +${rec.xp_reward} XP`,
    code:  rec.slug.toUpperCase(),
    locked: false,
  };
}

function resolveObserver(_id: string, _db: DbCache): TagMeta | null {
  return {
    kind: "observer",
    icon: "◎", color: "var(--color-primary)",
    label: "OBSERVER", sub: "機関はあなたを観測している",
    code: undefined, locked: false,
  };
}

// ─────────────────────────────────────────────────────────────────────
// TAG_RESOLVERS — プレフィックス → リゾルバ の対応テーブル
// 長いプレフィックスを先に書く（前方一致の誤マッチを防ぐ）
// ─────────────────────────────────────────────────────────────────────

export const TAG_RESOLVERS: TagResolver[] = [
  { prefix: "M-",        resolve: resolveMission     },
  { prefix: "FAC-",      resolve: resolveFacility    },
  { prefix: "ENT-",      resolve: resolveEntity      },
  { prefix: "EQ-",       resolve: resolveEquipment   },
  { prefix: "AGT-",      resolve: resolvePersonnel   },
  { prefix: "DIV-",      resolve: resolveDivision    },
  { prefix: "INC-",      resolve: resolveIncident    },
  { prefix: "MOD-",      resolve: resolveModule      },
  { prefix: "CDX-",      resolve: resolveCodex       },
  { prefix: "AUD-",      resolve: resolveAudio       },
  { prefix: "SKL-",      resolve: resolveSkill       },
  { prefix: "ACH-",      resolve: resolveAchievement },
  { prefix: "EVT-",      resolve: resolveEvent       },
  { prefix: "PZL-",      resolve: resolvePuzzle      },
  { prefix: "BUL-",      resolve: resolveBulletin    },
  { prefix: "NPC-",      resolve: resolveNpc         },
  { prefix: "LOC-",      resolve: resolveLocation    },
  { prefix: "RIFT-",     resolve: resolveRift        },
  { prefix: "GSI-",      resolve: resolveGsiLog      },
  { prefix: "SIG-",      resolve: resolveSignalLog   },
  { prefix: "SCAN-",     resolve: resolveScanLog     },
  { prefix: "CRK-",      resolve: resolveCrack       },
  { prefix: "MEMO-",     resolve: resolveMemo        },
  { prefix: "CASE-",     resolve: resolveCaseReport  },
  { prefix: "OP-",       resolve: resolveOperation   },
  { prefix: "PROTO-",    resolve: resolveProtocol    },
  { prefix: "THEORY-",   resolve: resolveTheory      },
  { prefix: "PHASE-",    resolve: resolvePhase       },
  { prefix: "LAYER-",    resolve: resolveLayer       },
  { prefix: "CERT-",     resolve: resolveCert        },
  { prefix: "CIPHER-",   resolve: resolveCipher      },
  { prefix: "SIGMA-MSG", resolve: resolveSigma       },
  { prefix: "OBSERVER",  resolve: resolveObserver    },
];

// ─────────────────────────────────────────────────────────────────────
// resolveTag — TAG_RESOLVERS を引いて TagMeta を返すエントリポイント
// ─────────────────────────────────────────────────────────────────────

export function resolveTag(id: string, db: DbCache | null): TagMeta | null {
  if (!db) return null;
  for (const r of TAG_RESOLVERS) {
    if (id.startsWith(r.prefix)) return r.resolve(id, db);
  }
  return null;
}
