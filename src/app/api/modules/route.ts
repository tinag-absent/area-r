/**
 * GET /api/modules — 収束モジュール一覧（Turso DB から取得）
 * Updated: 2026-03-24 — fs/promises 依存を廃止し DB 直接参照に移行（Vercel 対応）
 *
 * db_equipment テーブルのフィールドを area13 JSON 形式にマッピングして返す。
 * specifications (JSON) から range / duration / energy を展開する。
 */
import { NextResponse } from "next/server";
import { createRoute }  from "@/lib/api/handler";
import { queryAll }     from "@/lib/db";

interface DbEquipment {
  id: string; code: string; name: string;
  category: string; clearance: number; classification?: string;
  description: string; issued_by: string;
  specifications: string; maintenance_cycle: string;
}

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const level          = user.level ?? 0;
    const classification = query.get("classification") ?? "all";

    // category を classification 代わりに使う（seed では category='収束モジュール' 等）
    // classified 判定は clearance >= 5 で行う
    const rows = await queryAll<DbEquipment>(
      db,
      `SELECT id, code, name, category, clearance, description, issued_by,
              specifications, maintenance_cycle
       FROM db_equipment
       ORDER BY clearance ASC, code ASC`,
      [],
    );

    const modules = rows.map(m => {
      const isClassified = m.clearance >= 5 && level < 3;
      if (isClassified) {
        return {
          id: m.id, code: m.code, name: "███████",
          classification: "classified",
          description: "[機密] CLEARANCE LEVEL 3 以上が必要です。",
          range: "???", duration: "???", energy: "???",
          developer: "???", details: "???", warning: "???",
        };
      }

      // specifications: {"範囲": "...", "持続時間": "...", "エネルギー消費": "..."}
      let specs: Record<string, string> = {};
      try { specs = JSON.parse(m.specifications) as Record<string, string>; } catch { /* noop */ }

      const cls = m.clearance >= 5 ? "classified"
        : m.clearance >= 3         ? "restricted"
        : m.clearance >= 2         ? "caution"
        : "safe";

      return {
        id:             m.id,
        code:           m.code,
        name:           m.name,
        classification: cls,
        description:    m.description,
        range:          specs["範囲"]          ?? specs["range"]    ?? "—",
        duration:       specs["持続時間"]      ?? specs["duration"] ?? "—",
        energy:         specs["エネルギー消費"] ?? specs["energy"]   ?? "—",
        developer:      m.issued_by,
        details:        m.description,
        warning:        m.maintenance_cycle,
      };
    });

    // classification フィルタ
    const filtered = classification !== "all"
      ? modules.filter(m => m.classification === classification)
      : modules;

    return NextResponse.json(filtered);
  },
});
