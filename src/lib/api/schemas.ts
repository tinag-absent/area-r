/**
 * src/lib/api/schemas.ts
 *
 * 管理者CRUD API用の共通Zodスキーマ定義。
 * createRoute の bodySchema に渡すことでリクエストバリデーションを自動化する。
 *
 * 使い方:
 *   import { NovelPostSchema, NovelPatchSchema } from "@/lib/api/schemas";
 *
 *   export const POST = createRoute({
 *     auth: "admin",
 *     bodySchema: NovelPostSchema,
 *     handler: async ({ body }) => {
 *       // body は NovelPost 型として推論される（キャスト不要）
 *     },
 *   });
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────
// 共通プリミティブ
// ─────────────────────────────────────────────────────────────────────

const ClearanceLevel = z.number().int().min(0).max(5);
const NonEmptyString = z.string().min(1).max(500);
const OptionalString = z.string().max(2000).nullable().optional();

// ─────────────────────────────────────────────────────────────────────
// novel_documents
// ─────────────────────────────────────────────────────────────────────

export const NovelPostSchema = z.object({
  title:        NonEmptyString,
  subtitle:     OptionalString,
  clearance:    ClearanceLevel.default(0),
  category:     z.string().default("日記"),
  date:         z.string().default(""),
  author:       z.string().default(""),
  content:      z.string().default(""),
  is_published: z.boolean().default(false),
});
export type NovelPost = z.infer<typeof NovelPostSchema>;

export const NovelPatchSchema = z.object({
  id:           z.string().min(1),
  title:        z.string().min(1).optional(),
  subtitle:     OptionalString,
  clearance:    ClearanceLevel.optional(),
  category:     z.string().optional(),
  date:         z.string().optional(),
  author:       z.string().optional(),
  content:      z.string().optional(),
  is_published: z.boolean().optional(),
  sort_order:   z.number().int().optional(),
});
export type NovelPatch = z.infer<typeof NovelPatchSchema>;

// ─────────────────────────────────────────────────────────────────────
// codex_sections / codex_entries
// ─────────────────────────────────────────────────────────────────────

export const CodexSectionPostSchema = z.object({
  id:         z.string().min(1),
  label:      NonEmptyString,
  title:      NonEmptyString,
  icon:       z.string().default("◈"),
  color:      z.string().default("var(--color-primary)"),
  clearance:  ClearanceLevel.default(0),
  sort_order: z.number().int().default(0),
});

export const CodexEntryPostSchema = z.object({
  section_id: z.string().min(1),
  title:      NonEmptyString,
  subtitle:   OptionalString,
  body:       z.string().default(""),
  clearance:  ClearanceLevel.default(0),
  tags:       z.array(z.string()).default([]),
  sort_order: z.number().int().default(0),
});
export type CodexEntryPost = z.infer<typeof CodexEntryPostSchema>;

// ─────────────────────────────────────────────────────────────────────
// db_entities
// ─────────────────────────────────────────────────────────────────────

export const EntityPostSchema = z.object({
  designation:          NonEmptyString,
  code:                 NonEmptyString,
  threat:               z.string().default("UNKNOWN"),
  clearance:            ClearanceLevel.default(1),
  status:               z.string().default("OBSERVED"),
  classification:       z.string().default("unknown"),
  description:          z.string().default(""),
  first_detected:       z.string().default(""),
  neutralized:          z.number().int().nullable().optional(),
  containment_protocol: z.string().default(""),
  observed_abilities:   z.array(z.string()).default([]),
  related_entities:     z.array(z.string()).default([]),
});
export type EntityPost = z.infer<typeof EntityPostSchema>;

// ─────────────────────────────────────────────────────────────────────
// field_incidents
// ─────────────────────────────────────────────────────────────────────

export const IncidentPostSchema = z.object({
  id:       z.string().optional(),
  severity: z.enum(["critical", "warning", "safe"]).default("warning"),
  status:   z.string().default("監視中"),
  name:     NonEmptyString,
  lon:      z.number(),
  lat:      z.number(),
  location: z.string().default(""),
  entity:   z.string().default(""),
  gsi:      z.number().min(0).default(0),
  division: z.string().default(""),
  desc:     z.string().default(""),
  city_code:z.string().nullable().optional(),
  city_name:z.string().nullable().optional(),
});
export type IncidentPost = z.infer<typeof IncidentPostSchema>;

// ─────────────────────────────────────────────────────────────────────
// story_triggers
// ─────────────────────────────────────────────────────────────────────

export const StoryTriggerPostSchema = z.object({
  id:              z.string().optional(),
  title:           NonEmptyString,
  trigger_type:    z.enum(["flag", "level", "xp", "streak", "anomaly", "composite"]).default("composite"),
  active:          z.boolean().default(true),
  priority:        z.number().int().default(0),
  once_per_user:   z.boolean().default(true),
  conditions_json: z.string().refine(s => { try { JSON.parse(s); return true; } catch { return false; } }, "conditions_jsonが不正なJSONです"),
  effects_json:    z.string().refine(s => { try { JSON.parse(s); return true; } catch { return false; } }, "effects_jsonが不正なJSONです"),
  description:     z.string().nullable().optional(),
});
export type StoryTriggerPost = z.infer<typeof StoryTriggerPostSchema>;

// ─────────────────────────────────────────────────────────────────────
// npc_engine_rules
// ─────────────────────────────────────────────────────────────────────

export const NpcRulePostSchema = z.object({
  active:    z.boolean().default(true),
  priority:  z.number().int().default(0),
  data_json: z.string().refine(s => { try { JSON.parse(s); return true; } catch { return false; } }, "data_jsonが不正なJSONです"),
});
export type NpcRulePost = z.infer<typeof NpcRulePostSchema>;

// ─────────────────────────────────────────────────────────────────────
// missions
// ─────────────────────────────────────────────────────────────────────

export const MissionPostSchema = z.object({
  id:               z.string().optional(),
  title:            NonEmptyString,
  description:      z.string().nullable().optional(),
  category:         z.string().default("standard"),
  status:           z.string().default("active"),
  required_level:   z.number().int().min(0).max(5).default(2),
  xp_reward:        z.number().int().min(0).default(100),
  phase:            z.number().int().default(1),
  assigned_division:z.string().nullable().optional(),
  issued_by:        z.string().nullable().optional(),
  deadline_at:      z.string().nullable().optional(),
});
export type MissionPost = z.infer<typeof MissionPostSchema>;
