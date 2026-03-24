import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { TabId } from "../../data";
import { DetailClient } from "./DetailClient";
import { getDb, queryOne } from "@/lib/db";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";

const VALID_TABS: TabId[] = ["missions", "facilities", "entities", "equipment", "personnel"];

const TABLE_MAP: Record<string, string> = {
  missions:   "missions",
  facilities: "db_facilities",
  entities:   "db_entities",
  equipment:  "db_equipment",
  personnel:  "db_personnel",
};

const ARRAY_FIELDS: Record<string, string[]> = {
  entities:   ["observed_abilities", "related_entities"],
  facilities: ["equipment_installed", "divisions_present"],
  equipment:  [],
  personnel:  ["commendations", "incident_flags"],
};
const OBJ_FIELDS: Record<string, string[]> = {
  equipment: ["specifications"],
};

async function fetchRecord(tab: TabId, id: string, userLevel: number) {
  const table = TABLE_MAP[tab];
  if (!table) return null;

  const db  = getDb();
  const row = await queryOne<Record<string, unknown>>(db,
    `SELECT * FROM ${table} WHERE id = ?`, [id]
  );
  if (!row) return null;

  // クリアランスチェック
  const clearance = Number(
    row.clearance ?? row.required_level ?? row.level ?? 0
  );
  if (clearance > userLevel) return null;

  // JSON フィールドをパース
  for (const f of ARRAY_FIELDS[tab] ?? []) {
    if (typeof row[f] === "string") {
      try { row[f] = JSON.parse(row[f] as string); } catch { row[f] = []; }
    }
  }
  for (const f of OBJ_FIELDS[tab] ?? []) {
    if (typeof row[f] === "string") {
      try { row[f] = JSON.parse(row[f] as string); } catch { row[f] = {}; }
    }
  }

  // missions は既存フィールド名との互換性を保つ
  if (tab === "missions") {
    row.level   = row.required_level;
    row.xp      = row.xp_reward;
    row.objectives = [];  // 既存DBには objectives がないので空配列
  }

  return row;
}

interface Props {
  params: Promise<{ tab: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tab, id } = await params;
  if (!VALID_TABS.includes(tab as TabId)) return { title: "Not Found" };

  const jar     = await cookies();
  const token   = jar.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  const level   = payload?.level ?? 0;

  const record = await fetchRecord(tab as TabId, id, level);
  if (!record) return { title: "Not Found — 海蝕機関" };

  const name =
    "title"       in record ? record.title :
    "name"        in record ? record.name :
    "designation" in record ? record.designation :
    "codename"    in record ? `CODENAME: ${record.codename}` : id;
  return { title: `${name} — 海蝕機関` };
}

export default async function DetailPage({ params }: Props) {
  const { tab, id } = await params;
  if (!VALID_TABS.includes(tab as TabId)) notFound();

  const jar     = await cookies();
  const token   = jar.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  const level   = payload?.level ?? 0;

  const record = await fetchRecord(tab as TabId, id, level);
  if (!record) notFound();

  return <DetailClient tab={tab as TabId} record={record as never} />;
}
