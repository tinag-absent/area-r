/**
 * src/types/db.ts
 *
 * DBテーブルの行型定義。
 * queryOne<T> / queryAll<T> の型引数として使用することで
 * Record<string,unknown> キャストを排除できる。
 *
 * 原則: カラム名はスキーマのまま（snake_case）。
 * フロントエンドへ渡す際は api.ts の型（camelCase）に変換する。
 */

import type { UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// users
// ─────────────────────────────────────────────────────────────────────

export interface DbUser {
  id:                     string;
  agent_id:               string;
  username:               string;
  password_hash:          string;
  email:                  string | null;
  display_name:           string | null;
  division_id:            string | null;
  role:                   UserRole;
  status:                 UserStatus;
  clearance_level:        0 | 1 | 2 | 3 | 4 | 5;
  xp_total:               number;
  anomaly_score:          number;
  observer_load:          number;
  consecutive_login_days: number;
  last_login_at:          string | null;
  login_count:            number;
  secret_question:        string | null;
  secret_answer_hash:     string | null;
  created_at:             string;
  password_changed_at:    string | null;
}

// ─────────────────────────────────────────────────────────────────────
// divisions
// ─────────────────────────────────────────────────────────────────────

export interface DbDivision {
  id:          string;
  name:        string;
  name_en:     string;
  description: string | null;
  color:       string | null;
}

// ─────────────────────────────────────────────────────────────────────
// novel_documents
// ─────────────────────────────────────────────────────────────────────

export interface DbNovelDocument {
  id:           string;
  title:        string;
  subtitle:     string | null;
  clearance:    number;
  category:     string;
  date:         string;
  author:       string;
  content:      string;
  is_published: 0 | 1;
  sort_order:   number;
  created_at:   string;
  updated_at:   string;
}

// ─────────────────────────────────────────────────────────────────────
// codex_sections / codex_entries
// ─────────────────────────────────────────────────────────────────────

export interface DbCodexSection {
  id:         string;
  label:      string;
  title:      string;
  icon:       string;
  color:      string;
  clearance:  number;
  sort_order: number;
}

export interface DbCodexEntry {
  id:         string;
  section_id: string;
  title:      string;
  subtitle:   string | null;
  body:       string;
  clearance:  number;
  tags:       string;  // JSON array string
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────
// db_entities
// ─────────────────────────────────────────────────────────────────────

export interface DbEntity {
  id:                   string;
  designation:          string;
  code:                 string;
  threat:               string;
  clearance:            number;
  status:               string;
  classification:       string;
  description:          string;
  first_detected:       string;
  neutralized:          number | null;
  containment_protocol: string;
  observed_abilities:   string;  // JSON array string
  related_entities:     string;  // JSON array string
  created_at:           string;
  updated_at:           string;
}

// ─────────────────────────────────────────────────────────────────────
// db_facilities
// ─────────────────────────────────────────────────────────────────────

export interface DbFacility {
  id:                  string;
  name:                string;
  code:                string;
  location:            string;
  status:              string;
  clearance:           number;
  type:                string;
  description:         string;
  staff:               number | null;
  established:         string;
  equipment_installed: string;  // JSON array string
  divisions_present:   string;  // JSON array string
  notes:               string;
  created_at:          string;
  updated_at:          string;
}

// ─────────────────────────────────────────────────────────────────────
// db_equipment
// ─────────────────────────────────────────────────────────────────────

export interface DbEquipment {
  id:               string;
  name:             string;
  code:             string;
  category:         string;
  status:           string;
  clearance:        number;
  quantity:         number | null;
  description:      string;
  weight:           string;
  issued_by:        string;
  specifications:   string;  // JSON object string
  maintenance_cycle:string;
  created_at:       string;
  updated_at:       string;
}

// ─────────────────────────────────────────────────────────────────────
// db_personnel
// ─────────────────────────────────────────────────────────────────────

export interface DbPersonnel {
  id:                 string;
  codename:           string;
  real_name:          string;
  role:               string;
  division:           string;
  clearance:          number;
  status:             string;
  joined:             string;
  last_seen:          string;
  specialization:     string;
  notes:              string;
  anomaly_score:      number | null;
  missions_completed: number | null;
  commendations:      string;  // JSON array string
  incident_flags:     string;  // JSON array string
  created_at:         string;
  updated_at:         string;
}

// ─────────────────────────────────────────────────────────────────────
// missions
// ─────────────────────────────────────────────────────────────────────

export interface DbMission {
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
  deadline_at:      string | null;
}

// ─────────────────────────────────────────────────────────────────────
// field_incidents
// ─────────────────────────────────────────────────────────────────────

export interface DbFieldIncident {
  id:         string;
  severity:   "critical" | "warning" | "safe";
  status:     string;
  name:       string;
  lon:        number;
  lat:        number;
  location:   string;
  entity:     string;
  gsi:        number;
  division:   string;
  desc:       string;
  time:       string;
  city_code:  string | null;
  city_name:  string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────
// notifications
// ─────────────────────────────────────────────────────────────────────

export interface DbNotification {
  id:         string;
  user_id:    string;
  type:       string;
  title:      string;
  body:       string | null;
  is_read:    0 | 1;
  expires_at: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────
// chat_messages
// ─────────────────────────────────────────────────────────────────────

export interface DbChatMessage {
  id:          string;
  chat_id:     string;
  sender_id:   string;
  sender_name: string;
  text:        string;
  type:        string;
  created_at:  string;
}

// ─────────────────────────────────────────────────────────────────────
// xp_logs
// ─────────────────────────────────────────────────────────────────────

export interface DbXpLog {
  id:         string;
  user_id:    string;
  activity:   string;
  xp_gained:  number;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────
// progress_flags
// ─────────────────────────────────────────────────────────────────────

export interface DbProgressFlag {
  id:          string;
  user_id:     string;
  flag_key:    string;
  flag_value:  string;
  set_at:      string;
}

// ─────────────────────────────────────────────────────────────────────
// achievements / user_achievements
// ─────────────────────────────────────────────────────────────────────

export interface DbAchievement {
  id:          string;
  key:         string;
  title:       string;
  description: string;
  icon:        string | null;
  xp_reward:   number;
  is_secret:   0 | 1;
}

export interface DbUserAchievement {
  id:             string;
  user_id:        string;
  achievement_id: string;
  earned_at:      string;
}

// ─────────────────────────────────────────────────────────────────────
// audio_records
// ─────────────────────────────────────────────────────────────────────

export interface DbAudioRecord {
  id:              string;
  title:           string;
  filename:        string;
  duration_sec:    number;
  recorded_at:     string;
  recorded_by:     string;
  location_ref:    string | null;
  classification:  string;
  clearance_req:   number;
  voice_detected:  0 | 1;
  integrity:       number;
  transcript_json: string;  // JSON array string
  gsi_value:       number | null;
  entity_ref:      string | null;
  notes:           string | null;
  created_by:      string;
  created_at:      string;
  updated_at:      string;
}

// ─────────────────────────────────────────────────────────────────────
// sigma_messages
// ─────────────────────────────────────────────────────────────────────

export interface DbSigmaMessage {
  id:            string;
  number:        number;
  received_at:   string;
  medium:        string;
  integrity:     number;
  clearance_req: number;
  content:       string;
  context_ref:   string | null;
  created_at:    string;
}

// ─────────────────────────────────────────────────────────────────────
// puzzle_entries / puzzle_solves
// ─────────────────────────────────────────────────────────────────────

export interface DbPuzzleEntry {
  id:            string;
  slug:          string;
  title:         string;
  cipher_text:   string;
  answer:        string;
  hint:          string | null;
  xp_reward:     number;
  clearance_req: number;
  is_active:     0 | 1;
  created_by:    string;
  created_at:    string;
}

// ─────────────────────────────────────────────────────────────────────
// posts (掲示板)
// ─────────────────────────────────────────────────────────────────────

export interface DbPost {
  id:         string;
  user_id:    string;
  title:      string;
  body:       string;
  category:   string;
  is_pinned:  0 | 1;
  is_deleted: 0 | 1;
  created_at: string;
}
