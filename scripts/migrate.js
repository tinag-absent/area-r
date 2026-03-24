#!/usr/bin/env node
/**
 * DBマイグレーション + シードスクリプト
 *
 * 使い方:
 *   npm run db:migrate                           # スキーマのみ
 *   npm run db:migrate -- --seed                 # スキーマ + 静的データ投入
 *   npm run db:migrate -- --admin-password=xxx   # 管理者パスワードを設定
 *   npm run db:migrate -- --seed --admin-password=xxx  # 両方
 *
 * 管理者アカウント: username = K-000-ADMIN
 * SEED_ADMIN_PASSWORD 環境変数でも指定可能（フラグ優先）
 */

const { createClient } = require("@libsql/client");
const fs   = require("fs");
const path = require("path");

// --admin-password=xxx からパスワードを取得
function getAdminPassword() {
  const flag = process.argv.find(a => a.startsWith("--admin-password="));
  if (flag) return flag.split("=").slice(1).join("=");
  return process.env.SEED_ADMIN_PASSWORD ?? "";
}

async function runSql(db, filePath, label) {
  const sql = fs.readFileSync(filePath, "utf-8");
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  let executed = 0;
  for (const stmt of statements) {
    try {
      await db.execute(stmt);
      executed++;
    } catch (err) {
      if (!err.message.includes("already exists") && !err.message.includes("UNIQUE")) {
        console.error(`[${label}] Error:\n${stmt.slice(0, 120)}\n→ ${err.message}`);
      }
    }
  }
  console.log(`✓ ${label}: ${executed} statements executed`);
  return executed;
}

async function setAdminPassword(db, password) {
  if (!password || password.length < 8) {
    console.error("✗ 管理者パスワードは8文字以上が必要です");
    return false;
  }

  // bcryptjs をインラインで使用
  let bcrypt;
  try {
    bcrypt = require("bcryptjs");
  } catch {
    try {
      bcrypt = require("bcrypt");
    } catch {
      console.error("✗ bcryptjs/bcrypt が見つかりません: npm install bcryptjs");
      return false;
    }
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await db.execute({
    sql: `UPDATE users
          SET password_hash = ?
          WHERE agent_id = 'K-000-ADMIN' OR username = 'K-000-ADMIN'`,
    args: [hash],
  });

  if (result.rowsAffected === 0) {
    console.error("✗ 管理者ユーザーが見つかりません（schema.sql が古い可能性があります）");
    return false;
  }

  console.log(`✓ 管理者パスワードを設定しました (rows: ${result.rowsAffected})`);
  console.log(`  username:  K-000-ADMIN`);
  console.log(`  agent_id:  K-000-ADMIN`);
  return true;
}

async function main() {
  const url       = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("Error: TURSO_DATABASE_URL が設定されていません");
    process.exit(1);
  }

  const doSeed     = process.argv.includes("--seed");
  const adminPass  = getAdminPassword();

  console.log(`Connecting to: ${url}`);
  const db = createClient({ url, authToken });

  // ── STEP 1: スキーマ適用 ────────────────────────────────────────────
  const schemaPath = path.join(__dirname, "schema.sql");
  await runSql(db, schemaPath, "Schema");

  // ── STEP 2: 静的データシード ─────────────────────────────────────────
  const seedPath = path.join(__dirname, "seed_static_data.sql");
  if (doSeed) {
    if (!fs.existsSync(seedPath)) {
      console.error("seed_static_data.sql が見つかりません");
      process.exit(1);
    }
    await runSql(db, seedPath, "Static data seed");
    console.log("✓ 静的データをDBに投入しました");
  } else {
    console.log("  (--seed なし: 静的データシードをスキップ)");
  }

  // ── STEP 3: 管理者パスワード設定 ────────────────────────────────────
  if (adminPass) {
    const ok = await setAdminPassword(db, adminPass);
    if (!ok) process.exit(1);
  } else {
    console.log("  (--admin-password なし: パスワード設定をスキップ)");
    console.log("  管理者パスワードを設定するには:");
    console.log("  npm run db:migrate -- --admin-password=YourPassword123");
  }

  console.log("\n✓ Migration complete");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
