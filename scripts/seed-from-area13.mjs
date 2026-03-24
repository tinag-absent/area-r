/**
 * seed-from-area13.mjs
 *
 * area_output 13 の JSON データを area-rjgarj の DB スキーマに整形して投入する。
 * area13 のデータを優先する（INSERT OR REPLACE）。
 *
 * 実行:
 *   node --env-file=.env.local scripts/seed-from-area13.mjs
 */

import { createClient } from "@libsql/client";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── DB接続 ────────────────────────────────────────────────────────────

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run(sql, args = []) {
  return db.execute({ sql, args });
}

// ── データ読み込みヘルパー ────────────────────────────────────────────

async function loadJson(relativePath) {
  // JSONは scripts/area13/ に配置されている前提
  // 例: loadJson("data/mission-data.json") → scripts/area13/mission-data.json
  const filename = relativePath.replace(/^data\//, "");
  const p = join(__dir, "area13", filename);
  try {
    const txt = await readFile(p, "utf8");
    return JSON.parse(txt);
  } catch (err) {
    throw new Error(`JSON が見つかりません: ${p}\n${err.message}`);
  }
}

// ── マッピング定義 ────────────────────────────────────────────────────

// area13 部門名 → area-rjgarj DIV-ID
// area13: 収束部門 / 港湾部門 / 工作部門 / 外事部門 / 支援部門
// area-rjgarj: DIV-01 観測 / DIV-02 収束 / DIV-03 記録 / DIV-04 技術 / DIV-05 封印
const DIVISION_MAP = {
  "収束部門": "DIV-02",
  "港湾部門": "DIV-05",
  "工作部門": "DIV-04",
  "外事部門": "DIV-01",
  "支援部門": "DIV-03",
};

function resolveDivision(assignedDivisions) {
  for (const d of (assignedDivisions ?? [])) {
    for (const [key, id] of Object.entries(DIVISION_MAP)) {
      if (d.includes(key)) return id;
    }
  }
  return null;
}

// priority → category
const PRIORITY_TO_CATEGORY = {
  critical: "critical",
  warning:  "standard",
  safe:     "support",
};

// securityLevel → required_level（そのまま使う）

// priority → xp_reward
const PRIORITY_TO_XP = {
  critical: 300,
  warning:  150,
  safe:     75,
};

// status は area13 と area-rjgarj で同じ文字列なのでそのまま使う
// active / monitoring / completed

// ── MISSIONS ─────────────────────────────────────────────────────────

async function seedMissions() {
  const { missions } = await loadJson("data/mission-data.json");

  console.log(`\n[missions] ${missions.length} 件を投入します（INSERT OR REPLACE）`);

  for (const m of missions) {
    await run(
      `INSERT OR REPLACE INTO missions
         (id, title, description, category, status,
          required_level, xp_reward, phase,
          assigned_division, issued_by, issued_at, deadline_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        m.id,
        m.title,
        // description に entity / gsi / notes を付加して情報密度を上げる
        [
          m.description,
          m.entity   ? `\n関連実体: ${m.entity}` : null,
          m.gsi      ? `GSI: ${m.gsi}` : null,
          m.notes    ? `\n備考: ${m.notes}` : null,
        ].filter(Boolean).join("  "),
        PRIORITY_TO_CATEGORY[m.priority] ?? "standard",
        m.status,
        m.securityLevel ?? 2,
        PRIORITY_TO_XP[m.priority] ?? 100,
        // phase: startDate の年で簡易分類（2025→1, 2026→2）
        m.startDate?.startsWith("2025") ? 1 : 2,
        resolveDivision(m.assignedDivisions),
        // issued_by: 最初の assignedDivisions をそのまま表示名として保存
        m.assignedDivisions?.[0] ?? null,
        // issued_at: startDate を SQLite datetime 形式に変換
        m.startDate ? m.startDate.replace("T", " ").slice(0, 19) : null,
        // deadline_at: endDate
        m.endDate   ? m.endDate.replace("T", " ").slice(0, 19) : null,
      ]
    );
    console.log(`  ✓ ${m.id}  ${m.title}`);
  }
}

// ── DIVISIONS ────────────────────────────────────────────────────────
// area-rjgarj の DIVISIONS は constants.ts で定義済みだが、
// DB の divisions テーブルに INSERT OR IGNORE で補完する。
// area13 の説明文で上書きしたい場合は OR REPLACE に変えてください。

async function seedDivisions() {
  const { divisions } = await loadJson("data/divisions-data.json");

  // area13 div-id → area-rjgarj DIV-ID の対応（順番で合わせる）
  const ID_MAP = {
    "div-001": "DIV-02", // 収束部門 → 収束部門
    "div-002": "DIV-05", // 港湾部門 → 封印部門
    "div-003": "DIV-04", // 工作部門 → 技術部門
    "div-004": "DIV-01", // 外事部門 → 観測部門
    "div-005": "DIV-03", // 支援部門 → 記録部門
  };

  // area-rjgarj の既存 name_en（constants.ts に合わせる）
  const NAME_EN_MAP = {
    "DIV-01": "OBSERVATION DIVISION",
    "DIV-02": "CONVERGENCE DIVISION",
    "DIV-03": "ARCHIVE DIVISION",
    "DIV-04": "ENGINEERING DIVISION",
    "DIV-05": "CONTAINMENT DIVISION",
  };

  const COLOR_MAP = {
    "DIV-01": "#00C8FF",
    "DIV-02": "#A064FF",
    "DIV-03": "#50DC78",
    "DIV-04": "#FFB43C",
    "DIV-05": "#FF6B6B",
  };

  console.log(`\n[divisions] ${divisions.length} 件を投入します（INSERT OR IGNORE — 既存優先）`);

  for (const d of divisions) {
    const newId = ID_MAP[d.id];
    if (!newId) continue;

    await run(
      `INSERT OR IGNORE INTO divisions (id, name, name_en, description, color)
       VALUES (?,?,?,?,?)`,
      [
        newId,
        d.name,           // area13 の日本語名を使う
        NAME_EN_MAP[newId],
        d.description,    // area13 の説明文を使う
        COLOR_MAP[newId],
      ]
    );
    console.log(`  ✓ ${newId}  ${d.name}`);
  }
}

// ── rule_engine_entries: entities / modules をARGキーワードとして投入 ──
// entities → arg_keyword（分類ごとに severity を割り当て）
// modules  → arg_keyword

async function seedArgKeywords() {
  const { entities } = await loadJson("data/entities-data.json");
  const { modules  } = await loadJson("data/modules-data.json");

  const CLASSIFICATION_TO_SEVERITY = {
    danger:     "critical",
    classified: "critical",
    caution:    "high",
    safe:       "medium",
  };

  console.log(`\n[rule_engine: arg_keyword] entities ${entities.length} 件 + modules ${modules.length} 件`);

  // entities → キーワード（実体名 + コード）
  for (const e of entities) {
    const severity = CLASSIFICATION_TO_SEVERITY[e.classification] ?? "medium";
    const data = JSON.stringify({
      keyword:  e.name,
      phase:    e.classification === "classified" ? "3" : e.classification === "danger" ? "2" : "1",
      severity,
      source:   "entity",
      code:     e.code,
      note:     e.description,
    });

    await run(
      `INSERT OR IGNORE INTO rule_engine_entries
         (id, type, active, priority, data_json)
       VALUES (?,?,1,0,?)`,
      [`area13-ent-${e.id}`, "arg_keyword", data]
    );
  }
  console.log(`  ✓ entities を arg_keyword として登録`);

  // modules → キーワード（モジュール名 + コード）
  for (const m of modules) {
    const severity = CLASSIFICATION_TO_SEVERITY[m.classification] ?? "medium";
    const data = JSON.stringify({
      keyword:  m.name,
      phase:    m.classification === "classified" ? "3" : m.classification === "danger" ? "2" : "1",
      severity,
      source:   "module",
      code:     m.code,
      note:     m.description,
    });

    await run(
      `INSERT OR IGNORE INTO rule_engine_entries
         (id, type, active, priority, data_json)
       VALUES (?,?,1,0,?)`,
      [`area13-mod-${m.id}`, "arg_keyword", data]
    );
  }
  console.log(`  ✓ modules を arg_keyword として登録`);
}

// ── achievements: ミッションステータスに対応する実績を追加 ──────────────

async function seedAchievements() {
  const seeds = [
    {
      key:         "first_mission_complete",
      title:       "初陣",
      description: "初めてのミッションに参加した。",
      icon:        "◈",
      xp_reward:   100,
      is_secret:   0,
    },
    {
      key:         "critical_mission_complete",
      title:       "重大案件対応",
      description: "重大（CRITICAL）案件を収束させた。",
      icon:        "◉",
      xp_reward:   300,
      is_secret:   0,
    },
    {
      key:         "five_missions_complete",
      title:       "歴戦の機関員",
      description: "5件のミッションを完了した。",
      icon:        "★",
      xp_reward:   200,
      is_secret:   0,
    },
    {
      key:         "all_divisions_participated",
      title:       "全部門横断",
      description: "全5部門のミッションに参加した。",
      icon:        "⬡",
      xp_reward:   500,
      is_secret:   1,
    },
  ];

  console.log(`\n[achievements] ${seeds.length} 件を投入します（INSERT OR IGNORE）`);

  for (const a of seeds) {
    const id = `ach-area13-${a.key}`;
    await run(
      `INSERT OR IGNORE INTO achievements
         (id, key, title, description, icon, xp_reward, is_secret)
       VALUES (?,?,?,?,?,?,?)`,
      [id, a.key, a.title, a.description, a.icon, a.xp_reward, a.is_secret]
    );
    console.log(`  ✓ ${a.key}`);
  }
}

// ── エントリポイント ──────────────────────────────────────────────────

async function main() {
  console.log("=== seed-from-area13 開始 ===");
  console.log(`DB: ${process.env.TURSO_DATABASE_URL ?? "file:local.db"}`);

  try {
    await seedDivisions();
    await seedMissions();
    await seedArgKeywords();
    await seedAchievements();
    console.log("\n=== 完了 ===");
  } catch (err) {
    console.error("\n[ERROR]", err.message);
    process.exit(1);
  }
}

main();
