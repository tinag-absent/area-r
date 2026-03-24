/**
 * GET /api/entities — 実体一覧（Turso DB から取得）
 * Updated: 2026-03-24 — fs/promises 依存を廃止し DB 直接参照に移行（Vercel 対応）
 *
 * db_entities テーブルのフィールドを area13 JSON 形式にマッピングして返す。
 * observed_abilities は JSON 配列文字列 → behavior / appearance に分割して互換性を保つ。
 */
import { NextResponse } from "next/server";
import { createRoute }  from "@/lib/api/handler";
import { queryAll }     from "@/lib/db";

interface DbEntity {
  id: string; code: string; designation: string;
  threat: string; clearance: number; status: string; classification: string;
  description: string; first_detected: string;
  containment_protocol: string; observed_abilities: string;
}

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const level          = user.level ?? 0;
    const classification = query.get("classification") ?? "all";

    const where = classification !== "all"
      ? "WHERE classification = ?"
      : "";
    const params = classification !== "all" ? [classification] : [];

    const rows = await queryAll<DbEntity>(
      db,
      `SELECT id, code, designation, threat, clearance, status, classification,
              description, first_detected, containment_protocol, observed_abilities
       FROM db_entities ${where}
       ORDER BY clearance ASC, code ASC`,
      params,
    );

    const entities = rows.map(e => {
      const isClassified = e.classification === "classified" && level < 3;
      if (isClassified) {
        return {
          id: e.id, code: e.code, name: "███████",
          classification: "classified",
          description: "[機密] このエンティティへのアクセスには LEVEL 3 以上が必要です。",
          threat: "???", intelligence: "???", origin: "???",
          appearance: "???", behavior: "???", containment: "???",
        };
      }
      // observed_abilities: JSON配列 ["behavior...", "appearance..."] の想定
      let abilities: string[] = [];
      try { abilities = JSON.parse(e.observed_abilities) as string[]; } catch { /* noop */ }

      return {
        id:             e.id,
        code:           e.code,
        name:           e.designation,
        classification: e.classification,
        description:    e.description,
        threat:         e.threat,
        intelligence:   "不明",
        origin:         e.first_detected ? `初観測: ${e.first_detected}` : "不明",
        appearance:     abilities[1] ?? "",
        behavior:       abilities[0] ?? "",
        containment:    e.containment_protocol,
      };
    });

    return NextResponse.json(entities);
  },
});
