/**
 * src/types/api.ts
 *
 * APIレスポンス型の共有定義。
 * フロントエンドの apiFetch<T>() の型引数として使用することで
 * キャストを排除できる。
 *
 * 命名: 各エンドポイントの URL パスに対応するレスポンス型。
 */

// ─────────────────────────────────────────────────────────────────────
// 共通
// ─────────────────────────────────────────────────────────────────────

export interface OkResponse { ok: true }
export interface OkIdResponse { ok: true; id: string }

// ─────────────────────────────────────────────────────────────────────
// /api/novel
// ─────────────────────────────────────────────────────────────────────

export interface NovelDocument {
  id:         string;
  title:      string;
  subtitle:   string | null;
  clearance:  number;
  category:   string;
  date:       string;
  author:     string;
  content:    string;
  sort_order: number;
}

// ─────────────────────────────────────────────────────────────────────
// /api/codex
// ─────────────────────────────────────────────────────────────────────

export interface CodexSection {
  id:         string;
  label:      string;
  title:      string;
  icon:       string;
  color:      string;
  clearance:  number;
  sort_order: number;
}

export interface CodexEntry {
  id:         string;
  section_id: string;
  title:      string;
  subtitle:   string | null;
  body:       string;
  clearance:  number;
  tags:       string[] | string;
  sort_order: number;
}

export interface CodexResponse {
  sections: CodexSection[];
  entries:  CodexEntry[];
}

// ─────────────────────────────────────────────────────────────────────
// /api/incidents
// ─────────────────────────────────────────────────────────────────────

export interface FieldIncident {
  id:       string;
  severity: "critical" | "warning" | "safe";
  status:   string;
  name:     string;
  lon:      number;
  lat:      number;
  location: string;
  entity:   string;
  gsi:      number;
  division: string;
  desc:     string;
  time:     string;
  cityCode: string | null;
  cityName: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// /api/divisions
// ─────────────────────────────────────────────────────────────────────

export interface Division {
  id:          string;
  name:        string;
  name_en:     string;
  description: string | null;
  color:       string | null;
}

// ─────────────────────────────────────────────────────────────────────
// /api/missions
// ─────────────────────────────────────────────────────────────────────

export interface Mission {
  id:               string;
  title:            string;
  description:      string | null;
  category:         string;
  status:           string;
  required_level:   number;
  xp_reward:        number;
  phase:            number;
  assigned_division:string | null;
  issued_by:        string | null;
  issued_at:        string;
}

// ─────────────────────────────────────────────────────────────────────
// /api/sigma-messages
// ─────────────────────────────────────────────────────────────────────

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
// /api/cipher
// ─────────────────────────────────────────────────────────────────────

export interface CipherPuzzle {
  id:            string;
  slug:          string;
  title:         string;
  cipher_text:   string;
  hint:          string | null;
  xp_reward:     number;
  clearance_req: number;
  solved:        boolean;
}

export interface CipherSubmitResponse {
  ok:         boolean;
  correct:    boolean;
  firstSolve?: boolean;
  xpGranted?: number;
  message:    string;
}

// ─────────────────────────────────────────────────────────────────────
// /api/skill-exam
// ─────────────────────────────────────────────────────────────────────

export interface SkillExamResult {
  skill_id: string;
  score:    number;
  total:    number;
  passed:   number;
  taken_at: string;
}

export interface SkillExamSubmitResponse {
  score:    number;
  total:    number;
  passed:   boolean;
  passMark: number;
  xpGained: number;
  detail:   Array<{
    questionId:  string;
    correct:     boolean;
    yourAnswer:  number;
    rightAnswer: number;
    hint?:       string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// /api/users/me/*
// ─────────────────────────────────────────────────────────────────────

export interface UserMeResponse {
  id:            string;
  agentId:       string;
  username:      string;
  displayName:   string | null;
  divisionId:    string | null;
  divisionName:  string | null;
  role:          string;
  status:        string;
  clearanceLevel:number;
  xpTotal:       number;
  anomalyScore:  number;
  observerLoad:  number;
  streak:        number;
  loginCount:    number;
  flags:         Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────
// /api/npc-dm
// ─────────────────────────────────────────────────────────────────────

export interface NpcDmChannel {
  id:            string;
  npcName:       string;
  chatId:        string;
  createdAt:     string;
  lastMessage:   string | null;
  lastMessageAt: string | null;
  unreadCount:   number;
  npcColor:      string;
  npcIcon:       string;
  npcTitle:      string;
}
