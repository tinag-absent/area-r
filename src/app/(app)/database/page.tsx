import { headers } from "next/headers";
import type { Metadata } from "next";
import { DatabaseClient } from "./DatabaseClient";
import type { TabId } from "./data";

export const metadata: Metadata = {
  title: "データベース — 海蝕機関",
};

const VALID_TABS: TabId[] = ["missions", "entities", "modules", "personnel", "facilities", "equipment", "search"];

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const level    = Number((await headers()).get("x-user-level") ?? 0);
  const { tab }  = await searchParams;
  const initialTab = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "missions";
  return <DatabaseClient level={level} initialTab={initialTab} />;
}
