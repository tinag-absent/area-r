#!/usr/bin/env node
/**
 * 管理者アカウント作成スクリプト
 *
 * 使い方:
 *   node --env-file=.env.local scripts/create-admin.mjs
 *   node --env-file=.env.local scripts/create-admin.mjs --username admin --password MyPass123
 *
 * 環境変数で指定する場合:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=MyPass123 node --env-file=.env.local scripts/create-admin.mjs
 *
 * 既に同名ユーザーが存在する場合はパスワードとロールを更新して active にします。
 */

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

// ── DB接続 ────────────────────────────────────────────────────────────
const db = createClient({
  url:       process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ── 引数パース ────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--username" && args[i + 1]) result.username = args[++i];
    if (args[i] === "--password" && args[i + 1]) result.password = args[++i];
  }
  return result;
}

// ── パスワードバリデーション ──────────────────────────────────────────
function validatePassword(pw) {
  if (pw.length < 8)   return "8文字以上で入力してください";
  if (pw.length > 256) return "256文字以内で入力してください";
  return null;
}

// ── エージェントID生成（constants.ts と同じロジック） ────────────────
function generateAgentId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const prefix = Array.from({ length: 2 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const digits = String(Math.floor(100 + Math.random() * 900));
  return `${prefix}-${digits}-ADMIN`;
}

// ── メイン ────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  海蝕機関 — 管理者アカウント作成ツール  ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log(`DB: ${process.env.TURSO_DATABASE_URL ?? "file:local.db"}\n`);

  const args = parseArgs();

  // ── username 取得 ──────────────────────────────────────────────────
  let username = args.username ?? process.env.ADMIN_USERNAME ?? "";

  if (!username) {
    const rl = readline.createInterface({ input, output });
    username = await rl.question("管理者ユーザー名 (デフォルト: admin): ");
    rl.close();
    username = username.trim() || "admin";
  }

  if (!/^[a-zA-Z0-9_\-]{3,24}$/.test(username)) {
    console.error("✗ ユーザー名は英数字・ハイフン・アンダースコア、3〜24文字で入力してください");
    process.exit(1);
  }

  // ── password 取得 ──────────────────────────────────────────────────
  let password = args.password ?? process.env.ADMIN_PASSWORD ?? "";

  if (!password) {
    const rl = readline.createInterface({ input, output });
    // パスワードを非表示入力（readline では隠せないので注意を促す）
    console.log("⚠ パスワードは画面に表示されます。ターミナルを閉じた後に変更してください。");
    password = await rl.question("パスワード (8文字以上): ");
    rl.close();
    password = password.trim();
  }

  const pwErr = validatePassword(password);
  if (pwErr) {
    console.error(`✗ パスワードエラー: ${pwErr}`);
    process.exit(1);
  }

  // ── DB操作 ────────────────────────────────────────────────────────
  await db.execute("PRAGMA foreign_keys = ON");

  const existing = await db.execute({
    sql:  "SELECT id, role, status FROM users WHERE LOWER(username) = LOWER(?)",
    args: [username],
  });

  const hash = await bcrypt.hash(password, 12);
  console.log("\n処理中...");

  if (existing.rows.length > 0) {
    // 既存ユーザーを管理者に昇格・パスワードを更新
    const row    = existing.rows[0];
    const userId = row.id;

    await db.execute({
      sql:  `UPDATE users
             SET password_hash  = ?,
                 role           = 'admin',
                 status         = 'active',
                 clearance_level = 5
             WHERE id = ?`,
      args: [hash, userId],
    });

    console.log("\n✓ 既存ユーザーを管理者に更新しました");
    console.log(`  ユーザー名  : ${username}`);
    console.log(`  ロール      : ${row.role} → admin`);
    console.log(`  ステータス  : ${row.status} → active`);
    console.log(`  クリアランス: → LV5`);
  } else {
    // 新規作成
    const userId  = randomUUID();
    const agentId = generateAgentId();

    await db.execute({
      sql: `INSERT INTO users
              (id, agent_id, username, password_hash, role, status, clearance_level, xp_total)
            VALUES (?, ?, ?, ?, 'admin', 'active', 5, 99999)`,
      args: [userId, agentId, username, hash],
    });

    console.log("\n✓ 管理者アカウントを作成しました");
    console.log(`  ユーザー名  : ${username}`);
    console.log(`  エージェントID: ${agentId}`);
    console.log(`  ロール      : admin`);
    console.log(`  クリアランス: LV5`);
  }

  console.log("\n  ログインURL: /login");
  console.log("  管理画面  : /admin\n");
  console.log("⚠ パスワードは安全な場所に保管してください。\n");
}

main().catch(err => {
  console.error("\n[ERROR]", err.message);
  process.exit(1);
});
