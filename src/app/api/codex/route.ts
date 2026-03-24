/**
 * GET /api/codex — プレイヤー向けコーデックス（セクション + エントリを結合）
 * Updated: 2026-03-23 — createRoute に移行
 * Fixed:   2026-03-23 — sections に entries を結合した正しい形式で返す
 */
import { NextResponse }          from "next/server";
import { createRoute }           from "@/lib/api/handler";
import { queryAll }              from "@/lib/db";
import type { DbCodexSection, DbCodexEntry } from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user }) => {
    const sections = await queryAll<DbCodexSection>(db,
      `SELECT * FROM codex_sections WHERE clearance <= ? ORDER BY sort_order ASC`,
      [user.level]
    );
    const entries = await queryAll<DbCodexEntry>(db,
      `SELECT * FROM codex_entries WHERE clearance <= ? ORDER BY section_id, sort_order ASC`,
      [user.level]
    );

    // entries を section_id でグループ化し、各 section に結合して返す
    const entryMap = new Map<string, DbCodexEntry[]>();
    for (const entry of entries) {
      const list = entryMap.get(entry.section_id) ?? [];
      list.push(entry);
      entryMap.set(entry.section_id, list);
    }

    const result = sections.map(s => ({
      id:        s.id,
      label:     s.label,
      title:     s.title,
      icon:      s.icon,
      color:     s.color,
      clearance: s.clearance,
      entries: (entryMap.get(s.id) ?? []).map(e => ({
        id:        e.id,
        title:     e.title,
        subtitle:  e.subtitle ?? undefined,
        body:      e.body,
        clearance: e.clearance,
        tags:      (() => { try { return JSON.parse(e.tags); } catch { return []; } })(),
      })),
    }));

    return NextResponse.json(result);
  },
});
