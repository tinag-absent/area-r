import type { Metadata } from "next";
import { headers } from "next/headers";
import { CodexClient } from "./CodexClient";
import { DIVISIONS } from "@/lib/constants";
import { getDb, queryAll } from "@/lib/db";

export const metadata: Metadata = { title: "コーデックス — 海蝕機関" };

export default async function CodexPage() {
  const h      = await headers();
  const level  = Number(h.get("x-user-level") ?? 0);
  const userId = h.get("x-user-id") ?? "";

  const db = getDb();

  // 各部門の機関員数を取得
  let memberCounts: Record<string, number> = {};
  try {
    const rows = await queryAll<{ division_id: string; cnt: number }>(
      db,
      `SELECT division_id, COUNT(*) as cnt FROM users
       WHERE role = 'player' AND status = 'active' AND division_id IS NOT NULL
       GROUP BY division_id`
    );
    for (const row of rows) {
      memberCounts[row.division_id] = Number(row.cnt);
    }
  } catch { /* DBエラー時は空のまま */ }

  // 自分の所属部門
  let myDivisionId: string | null = null;
  try {
    const me = await db.execute({ sql: "SELECT division_id FROM users WHERE id = ?", args: [userId] });
    myDivisionId = (me.rows[0]?.division_id as string | null) ?? null;
  } catch { /* noop */ }

  return (
    <CodexClient
      level={level}
      divisions={DIVISIONS}
      memberCounts={memberCounts}
      myDivisionId={myDivisionId}
    />
  );
}
