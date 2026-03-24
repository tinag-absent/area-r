import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDb, queryOne } from "@/lib/db";
import { SkillTreeClient } from "./SkillTreeClient";

export const metadata: Metadata = { title: "スキルツリー — 海蝕機関" };

export default async function SkillTreePage() {
  const h      = await headers();
  const userId = h.get("x-user-id") ?? "";

  const db  = getDb();
  const row = await queryOne<{ xp_total: number }>(
    db, "SELECT xp_total FROM users WHERE id = ?", [userId]
  );
  const userXp = Number(row?.xp_total ?? 0);

  return <SkillTreeClient userXp={userXp} />;
}
