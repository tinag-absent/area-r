import type { Metadata } from "next";
import { headers }       from "next/headers";
import { NovelClient }   from "./NovelClient";
import { getDb, queryAll } from "@/lib/db";

export const metadata: Metadata = { title: "機関員の日記 — 海蝕機関" };

// スケジュール管理下のコンテンツID
// publish_queue で管理する予定のIDをここに列挙する。
// 列挙されていないIDは従来通りクリアランスのみで表示される。
const SCHEDULE_GATED_IDS = new Set([
  "DIARY-005",
  "DIARY-006",
  "DIARY-007",
  "DIARY-008",
]);

export default async function NovelPage() {
  const h     = await headers();
  const level = Number(h.get("x-user-level") ?? 0);

  // published_content テーブルから公開済み novel ID を取得
  let publishedIds = new Set<string>();
  const gatedIds   = new Set(SCHEDULE_GATED_IDS);

  try {
    const db   = getDb();
    const rows = await queryAll<{ content_id: string }>(db,
      `SELECT content_id FROM published_content WHERE content_type = 'novel'`
    );
    publishedIds = new Set(rows.map(r => r.content_id));
  } catch {
    // テーブル未作成（migrate 前）の場合はゲートを無効化してフォールバック
    gatedIds.clear();
  }

  return (
    <NovelClient
      level={level}
      scheduledIds={[...gatedIds]}
      publishedIds={[...publishedIds]}
    />
  );
}
