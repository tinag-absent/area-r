/**
 * scripts/migrate-channel-general-to-global.js
 *
 * chat_messages / chat_read_markers の chat_id = "general" を "global" に変更する。
 * 実行: node scripts/migrate-channel-general-to-global.js
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const url       = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL が設定されていません");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken || undefined });

async function run() {
  await db.execute("PRAGMA foreign_keys = OFF");

  // chat_messages
  const msgResult = await db.execute(
    "UPDATE chat_messages SET chat_id = 'global' WHERE chat_id = 'general'"
  );
  console.log(`✅ chat_messages: ${msgResult.rowsAffected} 件を更新`);

  // chat_read_markers (テーブルが存在する場合のみ)
  try {
    const markerResult = await db.execute(
      "UPDATE chat_read_markers SET chat_id = 'global' WHERE chat_id = 'general'"
    );
    console.log(`✅ chat_read_markers: ${markerResult.rowsAffected} 件を更新`);
  } catch {
    console.log("ℹ️  chat_read_markers テーブルはスキップ（存在しないか列名が異なる）");
  }

  await db.execute("PRAGMA foreign_keys = ON");
  console.log("🎉 マイグレーション完了");
}

run().catch(err => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
