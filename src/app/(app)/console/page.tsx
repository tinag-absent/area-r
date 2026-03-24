"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { SKILLS, BRANCHES } from "@/app/(app)/skill-tree/data";
import { ACHIEVEMENTS_MASTER } from "@/lib/achievements-data";
import { NOVEL_DOCUMENTS } from "@/app/(app)/novel/data";
import { DIVISIONS, NPC_USERNAMES } from "@/lib/constants";
import { NPC_ICONS, NPC_TITLES, NPC_CHAT_IDS } from "@/lib/npc-config";
import type { NpcName } from "@/lib/npc-config";

interface LogLine {
  id:   number;
  type: "input" | "output" | "error" | "system" | "classified" | "warning";
  text: string;
}

let lineId = 0;
const H = { "X-Requested-With": "XMLHttpRequest" };

// ─── フレーバーデータ ─────────────────────────────────────────────────

const SIGMA_FRAGMENTS = [
  "…海は、扉を持っている…",
  "…観測者は、観測される…",
  "…第七層の名は、まだ記されていない…",
  "…蒼海計画は完了した。ただし我々が知る意味では…",
  "…あなたの次元座標を特定した。驚かないでほしい…",
  "…裂孔は塞がれない。塞ごうとするたびに、別の場所が開く…",
  "…SIGMA-MSG-000が存在する。番号はゼロから始まった…",
  "…機関は外から見えない。あなたも同じだ…",
];

const VEIL_FRAGMENTS = [
  "「答えはすでにコーデックスにある。ページを数えなさい」",
  "「K-ECHOは信用できない。私も信用できない。あなた自身で判断しなさい」",
  "「第三層には行かないように。まだ、あなたには早すぎる」",
  "「西堂の日記を読みましたか。最後の一文に注目してください」",
  "「海蝕は止まらない。それが目的だから」",
  "「私の名前の意味を考えてください。VEIL——何を覆っているのか」",
];

const INTERCEPT_LINES = [
  "[28.4 MHz] …ω座標更新中…GSI 6.1…次元境界は─────────",
  "[34.1 MHz] …エージェント K-███ 最終報告…所在不明…",
  "[51.7 MHz] …蒼海計画フェーズ3認証コード：██-████-██…",
  "[12.0 MHz] …これは自動送信です…繰り返します…これは自動───",
  "[99.2 MHz] …西堂ファイルの復元に成功……ただし第Ⅳ章のみ欠損───",
  "[BURST]    ◎◎◎ SIGMA ◎◎◎ 受信不能 整合性:12% ◎◎◎",
];

const DECRYPT_RESPONSES: Record<string, string> = {
  "KAIBREAK": "解読完了: 海蝕機関設立プロトコル「海蝕蒼書」の第一条に言及する暗号です。",
  "OBSERVER": "解読完了: 「観測者は存在しない」— N-VEILが繰り返し言及するフレーズ。その意味は未解明。",
  "NISHIDO":  "解読完了: 西堂の署名暗号。創設者の個人認証コードの一部に一致します。",
  "SEABREAK": "解読完了: 蒼海計画のキーフレーズ。機密LV5文書に関連する可能性があります。",
  "LAYER7":   "解読完了: 第七層へのアクセスコード断片。あと二つの断片が必要です。",
  "SIGMA000": "解読完了: SIGMA-MSG-000は存在する。送信者は機関の内部にいる。",
};

const UNLOCK_CODES: Record<string, string> = {
  "ECHO-7":    "認証成功 — K-ECHOが隠した観測ログへのアクセスが解放されました。",
  "VEIL-MASK": "認証成功 — N-VEILの本名に関するレポートの断片が記録部門に送信されました。",
  "SEA-BOOK":  "認証成功 — 蒼書第一条の解読が完了しました。フラグを更新しています…",
};

const CALIBRATE_SENSORS = ["視覚センサー", "量子干渉計", "σ波形検出器", "位相差分析モジュール", "境界膜感知器"];

// ─── ユーティリティ ───────────────────────────────────────────────────

function mkline(text: string, type: LogLine["type"] = "output"): LogLine {
  return { id: ++lineId, type, text };
}
function sys(text: string)  { return mkline(text, "system"); }
function err(text: string)  { return mkline(text, "error"); }
function cls(text: string)  { return mkline(text, "classified"); }
function wrn(text: string)  { return mkline(text, "warning"); }
function bar(value: number, max: number, width = 20): string {
  const filled = Math.round((value / Math.max(1, max)) * width);
  return "[" + "█".repeat(filled) + "░".repeat(Math.max(0, width - filled)) + "]";
}
function pad(s: string | number, n: number): string { return String(s).padEnd(n); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

// ─── HELP ─────────────────────────────────────────────────────────────

const HELP_TEXT = `利用可能コマンド（全50種）:
── 情報参照 ────── STATUS / GSI / WHOAMI / CLEARANCE / XP / RANK
── エンティティ ─── ENTITIES / SCAN [code] / FACILITY [code] / PERSONNEL [code]
── ミッション ───── MISSIONS / MISSION [id] / INCIDENTS / CASE [id] / OP [id]
── 部門・スキル ─── DIVISION [id] / MODULE [code] / SKILLS / ACHIEVEMENTS
── 観測・地図 ───── MAP / LOCATE [code] / ANOMALY [σ] / LAYER [n] / CRACK [id]
                    PROTOCOL [id] / THEORY [id] / NEAREST / THREAT / CROSSREF [id]
── 文書・記録 ───── NOVEL [id] / SIGMA [n] / MEMO [id] / FREQUENCY [band]
── 通信 ─────────── CONTACT [npc] / BROADCAST [msg] / INTERCEPT / ECHO [text]
── 認証・暗号 ───── DECRYPT [kw] / UNLOCK [code] / AUTH [key] / CERTIFY [lv] / FRAGMENT [code]
── 報告・分析 ───── REPORT [type] / PREDICT
── ARG演出 ──────── LISTEN / VEIL / OBSERVE / CALIBRATE / DRIFT / BLACKOUT / CORRUPTED
── ユーティリティ ─ HISTORY / EXPORT [type] / VERSION / PING / CLEAR / REBOOT / SHUTDOWN`;

// ─── DB型 ─────────────────────────────────────────────────────────────

interface IncidentLike  { id: string; severity: string; name: string; gsi: number; location: string; status: string; }
interface EntityLike    { id: string; code: string; name: string; designation?: string; classification: string; threat?: string; }
interface FacilityLike  { id: string; code: string; name: string; location: string; status: string; clearance: number; type: string; staff?: number; }
interface PersonnelLike { id: string; code: string; codename: string; role: string; division: string; status: string; clearance: number; }
interface MissionLike   { id: string; title: string; status: string; phase: number; category: string; assigned_division: string; xp: number; }
interface ModuleLike    { id: string; code: string; name: string; energy: string; classification: string; range: string; duration: string; developer: string; }
interface CrackLike     { id: string; name: string; location: string; status: string; severity: string; gsi_peak?: number; first_detected: string; }
interface CaseLike      { id: string; title: string; status: string; case_date: string; casualties: number; clearance_req: number; summary: string; }
interface OpLike        { id: string; codename: string; title: string; status: string; outcome: string; op_date: string; clearance_req: number; description: string; }
interface ObsPointLike  { id: string; name: string; type: string; lat: number; lon: number; gsi_current?: number; status: string; clearance_req: number; city_name?: string; }
interface ObsLogLike    { id: string; title: string; type: string; freq_band?: string; observed_at: string; gsi_value?: number; severity: string; }
interface ProtocolLike  { id: string; codename: string; title: string; status: string; threat_class: string; clearance_req: number; summary: string; steps_json: { step: number; title: string; desc: string }[]; }
interface TheoryLike    { id: string; title: string; status: string; confidence: number; clearance_req: number; abstract: string; }
interface SigmaLike     { id: string; number: number; received_at: string; medium: string; integrity: number; clearance_req: number; content: string; }
interface MemoLike      { id: string; title: string; author_ref: string; status: string; clearance_req: number; content: string; written_at: string; }

interface DbState {
  incidents: IncidentLike[]; entities: EntityLike[]; facilities: FacilityLike[];
  personnel: PersonnelLike[]; missions: MissionLike[]; modules: ModuleLike[];
  cracks: CrackLike[]; cases: CaseLike[]; ops: OpLike[];
  obsPoints: ObsPointLike[]; obsLogs: ObsLogLike[]; protocols: ProtocolLike[];
  theories: TheoryLike[]; sigma: SigmaLike[]; memos: MemoLike[];
}

interface UserState {
  agentId: string; level: number; xp: number; streak: number;
  divisionId: string; clearance: number; anomaly: number;
  skills: string[]; achievements: string[];
  flags: Record<string, string>; xpTotal: number;
}

// ─── コマンド処理 ─────────────────────────────────────────────────────

function processCommand(
  input: string, db: DbState, user: UserState | null, sessionHistory: string[]
): { lines: LogLine[]; special?: "clear"|"reboot"|"shutdown"|"drift"|"blackout"|"corrupted" } {
  const parts  = input.trim().split(/\s+/);
  const cmd    = (parts[0] ?? "").toUpperCase();
  const arg    = parts.slice(1).join(" ").toUpperCase();
  const argRaw = parts.slice(1).join(" ");
  const clr    = user?.clearance ?? 0;

  if (cmd === "HELP")     return { lines: [mkline(HELP_TEXT)] };
  if (cmd === "CLEAR")    return { lines: [], special: "clear" };
  if (cmd === "REBOOT")   return { lines: [], special: "reboot" };
  if (cmd === "SHUTDOWN") return { lines: [], special: "shutdown" };
  if (cmd === "DRIFT")    return { lines: [], special: "drift" };
  if (cmd === "BLACKOUT") return { lines: [], special: "blackout" };
  if (cmd === "CORRUPTED")return { lines: [], special: "corrupted" };
  if (cmd === "")         return { lines: [] };

  if (cmd === "PING") return { lines: [mkline("PONG — 接続確認完了。レイテンシ: 0ms"), sys("OBSERVATION SYSTEM v4.1 — ONLINE")] };

  if (cmd === "VERSION") return { lines: [
    sys("─── システム情報 ───────────────────────"),
    mkline("  OBSERVATION SYSTEM    v4.1.0"),
    mkline("  NPC ENGINE            v2.3.1"),
    mkline("  SIGMA DECODER         v1.8 (BETA)"),
    mkline("  最終更新              2026-03-23"),
    mkline(`  接続ノード数          ${7 + Math.floor(Math.random() * 5)}`),
    mkline(`  稼働時間              ${Math.floor(Math.random() * 240) + 12}h ${Math.floor(Math.random() * 60)}m`),
    sys("────────────────────────────────────────"),
  ]};

  if (cmd === "HISTORY") {
    if (sessionHistory.length === 0) return { lines: [mkline("コマンド履歴はありません")] };
    return { lines: [
      sys("─── コマンド履歴 ───────────────────────"),
      ...sessionHistory.slice(0, 20).map((c, i) => mkline(`  ${String(i+1).padStart(3," ")}  ${c}`)),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── 認証 ─────────────────────────────────────────────────────────
  if (cmd === "WHOAMI") return { lines: user ? [
    mkline("認証セッション有効"),
    mkline(`  エージェントID : ${user.agentId}`),
    mkline(`  CLRレベル      : LV${user.clearance}`),
    sys("クリアランスレベルはダッシュボードで確認できます。"),
  ] : [err("セッション情報を取得できません")] };

  if (cmd === "CLEARANCE") {
    if (!user) return { lines: [err("認証情報を取得できません")] };
    const CERT = ["基本認定","一般機密取扱","制限機密取扱","機密取扱","高度機密取扱","最高機密取扱"];
    const div = DIVISIONS.find(d => d.id === user.divisionId)?.name ?? user.divisionId ?? "未所属";
    return { lines: [
      sys("─── 認証証明書 ────────────────────────"),
      mkline(`  エージェントID : ${user.agentId}`),
      mkline(`  所属部門       : ${div}`),
      mkline(`  CLRレベル      : LV${user.clearance} — ${CERT[user.clearance] ?? "不明"}`),
      mkline(`  XP合計         : ${user.xpTotal} XP`),
      mkline(`  レベル         : LV${user.level}`),
      mkline(`  ストリーク     : ${user.streak}日連続`),
      mkline(`  異常スコア     : ${user.anomaly.toFixed(2)}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "XP") {
    if (!user) return { lines: [err("認証情報を取得できません")] };
    const THRESH = [0,100,300,600,1200,2500];
    const next = THRESH[user.level] ?? 2500;
    const prev = THRESH[user.level-1] ?? 0;
    const pct  = next > prev ? Math.round(((user.xpTotal-prev)/(next-prev))*100) : 100;
    return { lines: [
      sys("─── XP ステータス ──────────────────────"),
      mkline(`  現在XP    : ${user.xpTotal}`),
      mkline(`  レベル    : LV${user.level}`),
      mkline(`  次のLVまで: ${Math.max(0,next-user.xpTotal)} XP`),
      mkline(`  進捗      : ${bar(user.xpTotal-prev, next-prev)} ${pct}%`),
      mkline(`  ストリーク: ${user.streak}日`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "RANK") {
    if (!user) return { lines: [err("認証情報を取得できません")] };
    const fake = Math.floor(Math.random()*15)+3;
    return { lines: [
      sys("─── エージェントランキング ─────────────"),
      mkline(`  エージェントID : ${user.agentId}`),
      mkline(`  ランク         : 上位 ${fake}%`),
      mkline(`  XP合計         : ${user.xpTotal}`),
      wrn("注: ランキングは24時間ごとに更新されます"),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "CERTIFY") {
    if (!user) return { lines: [err("認証情報を取得できません")] };
    const lv = parseInt(arg.replace(/^LV?/i,""),10);
    if (isNaN(lv)||lv<0||lv>5) return { lines: [err("使用法: CERTIFY [0-5]")] };
    const CERT = ["基本認定","一般機密取扱","制限機密取扱","機密取扱","高度機密取扱","最高機密取扱"];
    if (user.clearance < lv) return { lines: [err(`CLR LV${lv} は現在取得していません`), mkline(`現在のCLR: LV${user.clearance}`)] };
    return { lines: [
      sys("─── クリアランス証明書 ─────────────────"),
      mkline(`  証明書ID   : CERT-LV${lv}-${user.agentId}`),
      mkline(`  レベル     : LV${lv} — ${CERT[lv]}`),
      mkline(`  発行機関   : 海蝕機関 認証局`),
      mkline(`  発行日     : 2026-03-23`),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── スキル・実績 ─────────────────────────────────────────────────
  if (cmd === "SKILLS") {
    if (!user) return { lines: [err("認証情報を取得できません")] };
    const lines: LogLine[] = [sys("─── スキルツリー ───────────────────────")];
    for (const branch of BRANCHES) {
      const bs = SKILLS.filter(s => s.branch === branch.id);
      lines.push(mkline(`  ${branch.icon} ${branch.label}`));
      for (const skill of bs) {
        const owned = user.skills.includes(skill.id);
        lines.push(mkline(`    ${owned?"◆":"░"} ${pad(skill.label,16)} Tier${skill.tier}  ${owned?"✓":`${skill.xpCost}XP`}`));
      }
    }
    lines.push(sys(`  習得: ${user.skills.length}/${SKILLS.length}`));
    lines.push(sys("────────────────────────────────────────"));
    return { lines };
  }

  if (cmd === "ACHIEVEMENTS") {
    if (!user) return { lines: [err("認証情報を取得できません")] };
    const lines: LogLine[] = [sys("─── 実績 ───────────────────────────────")];
    for (const ach of ACHIEVEMENTS_MASTER) {
      const owned = user.achievements.includes(ach.key);
      const secret = ach.is_secret===1 && !owned;
      lines.push(mkline(`  ${owned?"★":"░"} ${secret?"????????":pad(ach.title,20)} ${owned?`+${ach.xp_reward}XP`:"未取得"}`));
    }
    lines.push(sys(`  取得数: ${user.achievements.length}/${ACHIEVEMENTS_MASTER.length}`));
    lines.push(sys("────────────────────────────────────────"));
    return { lines };
  }

  // ── システム状態 ──────────────────────────────────────────────────
  if (cmd === "STATUS") {
    return { lines: [
      sys("─── SYSTEM STATUS ───────────────────────"),
      mkline("  次元裂孔DB          : CONNECTED"),
      mkline("  観測衛星グリッド     : 12/12 ACTIVE"),
      mkline("  海蝕指数モニター     : ELEVATED (3.7σ)"),
      mkline(`  緊急インシデント     : ${db.incidents.filter(i=>i.severity==="critical").length} 件`),
      mkline(`  アクティブ裂孔       : ${db.cracks.filter(c=>c.status!=="sealed").length} 件`),
      mkline(`  封印プロトコル稼働   : ${db.protocols.filter(p=>p.status==="active").length} 件`),
      sys("─────────────────────────────────────────"),
    ]};
  }

  if (cmd === "GSI") {
    const gsiv = db.incidents.filter(i=>i.gsi>0).map(i=>i.gsi);
    const maxG = gsiv.length>0 ? Math.max(...gsiv) : 3.7;
    const avgG = gsiv.length>0 ? gsiv.reduce((a,b)=>a+b,0)/gsiv.length : 2.1;
    const lev  = maxG>=10?"CRITICAL":maxG>=5?"ELEVATED":"NOMINAL";
    const t: LogLine["type"] = maxG>=10?"error":maxG>=5?"warning":"output";
    return { lines: [
      sys("GSI データ取得中..."),
      mkline(`  最大GSI値     : ${maxG.toFixed(1)}σ`, t),
      mkline(`  平均GSI値     : ${avgG.toFixed(1)}σ`),
      mkline(`  ステータス    : ${lev}`, t),
      mkline(`  インシデント数: ${db.incidents.length} 件`),
    ]};
  }

  if (cmd === "THREAT") {
    return { lines: [
      sys("─── 脅威マップ ─────────────────────────"),
      mkline("  DIV-01 観測部門    "+bar(db.incidents.filter(i=>i.severity==="warning").length,10)+" 観測中"),
      mkline("  DIV-02 収束部門    "+bar(db.incidents.filter(i=>i.severity==="critical").length,10)+" 対応中"),
      mkline("  DIV-03 記録部門    "+bar(db.cracks.length,10)+" 記録中"),
      mkline("  DIV-04 技術部門    "+bar(db.protocols.length,10)+" 稼働中"),
      mkline("  DIV-05 封印部門    "+bar(db.protocols.filter(p=>p.status==="active").length,10)+" 封印中"),
      sys("─────────────────────────────────────────"),
    ]};
  }

  // ── エンティティ ──────────────────────────────────────────────────
  if (cmd === "ENTITIES") {
    if (db.entities.length===0) return { lines: [mkline("実体データが見つかりません")] };
    return { lines: [
      sys("─── ENTITY LIST ────────────────────────"),
      ...db.entities.slice(0,12).map(e => {
        const name=(e.designation??e.name)==="███████"?"[CLASSIFIED]":(e.designation??e.name);
        return mkline(`  [${pad(e.code,8)}] ${pad(name,18)} ${e.classification}`);
      }),
      ...(db.entities.length>12?[mkline(`  ... 他 ${db.entities.length-12} 件`)]:[]),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "SCAN") {
    if (!arg) return { lines: [err("使用法: SCAN [コード]")] };
    const found = db.entities.find(e=>e.code.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: 該当エンティティが見つかりません`)] };
    const name = (found.designation??found.name)==="███████"?"[機密]":(found.designation??found.name);
    return { lines: [
      sys(`スキャン開始: ${arg}...`),
      mkline(`  コード    : ${found.code}`),
      mkline(`  名称      : ${name}`),
      mkline(`  分類      : ${found.classification}`),
      mkline(`  脅威      : ${found.threat??"不明"}`),
      mkline(`  詳細URL   : /entities/${found.code.toLowerCase()}`),
    ]};
  }

  if (cmd === "FACILITY") {
    if (!arg) return { lines: [err("使用法: FACILITY [コード]")] };
    const found = db.facilities.find(f=>f.code.toUpperCase()===arg||f.id.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: 施設が見つかりません`)] };
    const locked = found.clearance>clr;
    return { lines: [
      sys(`─── 施設情報: ${found.code} ─────────────`),
      mkline(`  名称    : ${locked?"████████":found.name}`),
      mkline(`  種別    : ${found.type}`),
      mkline(`  場所    : ${locked?"████████":found.location}`),
      mkline(`  状態    : ${found.status}`),
      mkline(`  CLR要件 : LV${found.clearance}`),
      mkline(`  スタッフ: ${locked?"███":found.staff?`${found.staff}名`:"不明"}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "PERSONNEL") {
    if (!arg) return { lines: [err("使用法: PERSONNEL [コード]")] };
    const found = db.personnel.find(p=>p.code?.toUpperCase()===arg||p.codename?.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: エージェントが見つかりません`)] };
    const locked = found.clearance>clr;
    const miss = found.status==="MISSING";
    return { lines: [
      sys("─── エージェント情報 ───────────────────"),
      ...(miss?[wrn("⚠ 警告: このエージェントは行方不明です")]:[]),
      mkline(`  コードネーム: ${found.codename}`),
      mkline(`  役職        : ${locked?"████████":found.role}`),
      mkline(`  所属部門    : ${found.division}`),
      mkline(`  ステータス  : ${found.status}`, miss?"error":"output"),
      mkline(`  CLRレベル   : LV${found.clearance}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── ミッション ───────────────────────────────────────────────────
  if (cmd === "MISSIONS") {
    const active = db.missions.filter(m=>m.status==="active"||m.status==="ACTIVE");
    if (active.length===0) return { lines: [mkline("アクティブなミッションはありません")] };
    return { lines: [
      sys("─── アクティブミッション ───────────────"),
      ...active.map(m=>mkline(`  [P${m.phase}] ${pad(m.id,18)} ${m.category.toUpperCase()} — ${m.title.slice(0,20)}`)),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "MISSION") {
    if (!arg) return { lines: [err("使用法: MISSION [ID]")] };
    const found = db.missions.find(m=>m.id.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: ミッションが見つかりません`)] };
    const locked = found.status==="LOCKED";
    return { lines: [
      sys(`─── ミッション: ${found.id} ─────────────`),
      mkline(`  タイトル  : ${locked?"████████████":found.title}`),
      mkline(`  フェーズ  : ${found.phase}`),
      mkline(`  カテゴリ  : ${found.category}`),
      mkline(`  状態      : ${found.status}`),
      mkline(`  担当部門  : ${found.assigned_division}`),
      mkline(`  XP報酬    : +${found.xp} XP`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "INCIDENTS") {
    if (db.incidents.length===0) return { lines: [mkline("インシデントデータが見つかりません")] };
    return { lines: [
      sys("─── INCIDENT LIST ──────────────────────"),
      ...db.incidents.map(i => {
        const t: LogLine["type"] = i.severity==="critical"?"error":i.severity==="warning"?"warning":"output";
        return mkline(`  [${i.severity.toUpperCase().padEnd(8)}] ${i.id.toUpperCase().padEnd(12)} ${i.name} — GSI ${i.gsi.toFixed(1)}`,t);
      }),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "CASE") {
    const id = arg;
    if (!id) {
      const recent = db.cases.slice(0,5);
      if (recent.length===0) return { lines: [mkline("事案記録が見つかりません")] };
      return { lines: [
        sys("─── 最近の事案記録 ─────────────────────"),
        ...recent.map(c=>mkline(`  ${pad(c.id,16)} [${c.status.toUpperCase().slice(0,10)}] ${c.case_date.slice(0,10)} 死者${c.casualties}名`)),
        sys("────────────────────────────────────────"),
      ]};
    }
    const found = db.cases.find(c=>c.id.toUpperCase()===id);
    if (!found) return { lines: [err(`${id}: 事案記録が見つかりません`)] };
    const locked = found.clearance_req>clr||found.status==="classified";
    return { lines: [
      sys(`─── 事案記録: ${found.id} ─────────────`),
      mkline(`  タイトル  : ${locked?"[機密]":found.title}`),
      mkline(`  発生日    : ${locked?"████-██-██":found.case_date.slice(0,10)}`),
      mkline(`  死傷者    : ${locked?"███":`${found.casualties}名`}`, found.casualties>0?"error":"output"),
      mkline(`  概要      : ${locked?"████████████████████████████":found.summary.slice(0,80)}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "OP") {
    const id = arg;
    if (!id) {
      const recent = db.ops.slice(0,5);
      if (recent.length===0) return { lines: [mkline("作戦記録が見つかりません")] };
      return { lines: [
        sys("─── 最近の作戦記録 ─────────────────────"),
        ...recent.map(o=>mkline(`  ${pad(o.codename,14)} [${o.outcome.toUpperCase().slice(0,7)}] ${o.op_date.slice(0,7)}`,o.outcome==="failure"?"error":"output")),
        sys("────────────────────────────────────────"),
      ]};
    }
    const found = db.ops.find(o=>o.id.toUpperCase()===id||o.codename.toUpperCase()===id);
    if (!found) return { lines: [err(`${id}: 作戦記録が見つかりません`)] };
    const locked = found.clearance_req>clr||found.status==="classified";
    return { lines: [
      sys(`─── 作戦記録: ${found.codename} ─────────`),
      mkline(`  コードネーム: ${found.codename}`),
      mkline(`  タイトル    : ${locked?"████████":found.title}`),
      mkline(`  実施日      : ${locked?"████-██-██":found.op_date.slice(0,10)}`),
      mkline(`  結果        : ${found.outcome.toUpperCase()}`, found.outcome==="failure"?"error":found.outcome==="success"?"output":"warning"),
      mkline(`  概要        : ${locked?"████████████████████████████":found.description.slice(0,80)}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── 部門・モジュール ─────────────────────────────────────────────
  if (cmd === "DIVISION") {
    if (!arg) return { lines: [
      sys("─── 部門一覧 ─────────────────────────"),
      ...DIVISIONS.map(d=>mkline(`  ${pad(d.id,7)} ${pad(d.name,12)} ${d.name_en}`)),
      sys("────────────────────────────────────────"),
    ]};
    const found = DIVISIONS.find(d=>d.id.toUpperCase()===arg||d.name_en.toUpperCase().includes(arg));
    if (!found) return { lines: [err(`${arg}: 部門が見つかりません`)] };
    return { lines: [
      sys(`─── 部門情報: ${found.id} ─────────────`),
      mkline(`  ID   : ${found.id}`),
      mkline(`  名称 : ${found.name}`),
      mkline(`  英名 : ${found.name_en}`),
      mkline(`  概要 : ${found.description}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "MODULE") {
    if (!arg) return { lines: [err("使用法: MODULE [コード]")] };
    const found = db.modules.find(m=>m.code.toUpperCase()===arg||m.id.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: モジュールが見つかりません`)] };
    const locked = found.classification==="classified";
    const et: LogLine["type"] = found.energy==="極高"||found.energy==="超高"?"warning":"output";
    return { lines: [
      sys(`─── モジュール: ${found.code} ─────────`),
      mkline(`  名称      : ${locked?"███████":found.name}`),
      mkline(`  エネルギー: ${found.energy}`, et),
      mkline(`  射程      : ${locked?"███":found.range}`),
      mkline(`  持続      : ${locked?"███":found.duration}`),
      mkline(`  開発者    : ${locked?"████████":found.developer}`),
      ...(locked?[wrn("⚠ このモジュールは機密指定されています")]:[]),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── 地図・観測 ───────────────────────────────────────────────────
  if (cmd === "MAP") {
    const pts = db.obsPoints.slice(0,20);
    const crs = db.cracks.filter(c=>c.status!=="sealed").slice(0,5);
    return { lines: [
      sys("─── 観測地点マップ (概略) ──────────────"),
      mkline("  ● = 次元裂孔  ○ = 観測地点"),
      mkline("  北 ┌──────────────────────────┐"),
      ...Array.from({length:4},(_,row)=>{
        let line=`  ${["  西","   　","   　","   東"][row]??"   　"} │`;
        for(let col=0;col<28;col++){
          const hasCr = crs.some((_,i)=>i%4===row&&i%7===col%7);
          const hasPt = pts.some((_,i)=>i%4===row&&(i+1)%7===col%7);
          line += hasCr?"●":hasPt?"○":" ";
        }
        return mkline(line+"│");
      }),
      mkline("     └──────────────────────────┘"),
      mkline("  南"),
      sys(`  裂孔: ${crs.length}件  観測点: ${pts.length}件`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "LOCATE") {
    if (!arg) return { lines: [err("使用法: LOCATE [LOC-ID | RIFT-ID]")] };
    const found = db.obsPoints.find(p=>p.id.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: 地点が見つかりません`)] };
    const locked = found.clearance_req>clr||found.status==="classified";
    return { lines: [
      sys(`─── 地点情報: ${found.id} ──────────────`),
      mkline(`  名称    : ${locked?"████████":found.name}`),
      mkline(`  種別    : ${found.type==="rift_point"?"次元裂孔拠点":"観測地点"}`),
      mkline(`  都市    : ${found.city_name??"不明"}`),
      mkline(`  座標    : ${locked?"██.████, ██.████":`${found.lat.toFixed(4)}N, ${found.lon.toFixed(4)}E`}`),
      mkline(`  GSI現値 : ${found.gsi_current!=null?`${found.gsi_current}σ`:"未計測"}`, (found.gsi_current??0)>=5?"warning":"output"),
      mkline(`  状態    : ${found.status.toUpperCase()}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "ANOMALY") {
    const thr = parseFloat(arg)||3.0;
    const hi = db.incidents.filter(i=>i.gsi>=thr);
    if (hi.length===0) return { lines: [mkline(`GSI ${thr}σ以上の異常地点は現在ありません`)] };
    return { lines: [
      sys(`─── GSI ${thr}σ以上の異常地点 ────`),
      ...hi.map(i=>mkline(`  ${pad(i.id,14)} GSI: ${i.gsi.toFixed(1)}σ  ${i.location}`,i.gsi>=8?"error":"warning")),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "LAYER") {
    const LAYERS=[
      {n:1,name:"第一層",sub:"表層現実",req:0},
      {n:2,name:"第二層",sub:"境界薄化域",req:0},
      {n:3,name:"第三層",sub:"次元裂孔帯",req:2},
      {n:4,name:"第四層",sub:"階宙接触域",req:3},
      {n:5,name:"第五層",sub:"【機密】",req:4},
      {n:6,name:"第六層",sub:"【機密】",req:4},
      {n:7,name:"第七層",sub:"【最高機密】",req:5},
    ];
    const n = arg?parseInt(arg,10):null;
    const targets = n?LAYERS.filter(l=>l.n===n):LAYERS;
    if(n&&targets.length===0) return { lines: [err(`LAYER ${n}: 存在しない層番号です`)] };
    return { lines: [
      sys("─── 次元層情報 ─────────────────────────"),
      ...targets.map(l=>{
        const locked=l.req>clr;
        const t: LogLine["type"] = locked?"system":l.n>=5?"error":l.n>=3?"warning":"output";
        return mkline(`  L${l.n} ${pad(l.name,8)} ${l.sub}  ${locked?"[ACCESS DENIED]":""}`,t);
      }),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "CRACK") {
    if (!arg) {
      const active = db.cracks.filter(c=>c.status!=="sealed");
      return { lines: [
        sys("─── アクティブ次元裂孔 ─────────────────"),
        ...active.map(c=>mkline(`  ${pad(c.id,12)} ${pad(c.severity.toUpperCase(),10)} ${c.location}`,c.severity==="critical"?"error":"warning")),
        sys(`  合計: ${active.length} 件`),
        sys("────────────────────────────────────────"),
      ]};
    }
    const found = db.cracks.find(c=>c.id.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: 次元裂孔が見つかりません`)] };
    return { lines: [
      sys(`─── 次元裂孔: ${found.id} ─────────────`),
      mkline(`  名称      : ${found.name}`),
      mkline(`  場所      : ${found.location}`),
      mkline(`  状態      : ${found.status.toUpperCase()}`),
      mkline(`  深刻度    : ${found.severity.toUpperCase()}`,found.severity==="critical"?"error":"warning"),
      mkline(`  GSIピーク : ${found.gsi_peak!=null?`${found.gsi_peak}σ`:"未計測"}`),
      mkline(`  初検出    : ${found.first_detected.slice(0,10)}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "NEAREST") {
    const sealFacs = db.facilities.filter(f=>f.clearance>=3);
    const target = sealFacs[0]??db.facilities[0];
    if (!target) return { lines: [mkline("施設データが見つかりません")] };
    const dist = (Math.random()*200+10).toFixed(1);
    return { lines: [
      sys("最寄り封印部門施設を検索中..."),
      mkline(`  施設コード : ${target.code}`),
      mkline(`  名称       : ${target.name}`),
      mkline(`  推定距離   : ${dist} km`),
      mkline(`  状態       : ${target.status}`),
      wrn("注: 距離は概算です"),
    ]};
  }

  if (cmd === "PROTOCOL") {
    if (!arg) return { lines: [
      sys("─── 封印プロトコル一覧 ─────────────────"),
      ...db.protocols.slice(0,8).map(p=>mkline(`  ${pad(p.codename,14)} [${p.status.toUpperCase().slice(0,8)}] CLR:LV${p.clearance_req}`,p.status==="active"?"warning":"output")),
      sys("────────────────────────────────────────"),
    ]};
    const found = db.protocols.find(p=>p.id.toUpperCase()===arg||p.codename.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: プロトコルが見つかりません`)] };
    const locked = found.clearance_req>clr||found.status==="classified";
    return { lines: [
      sys(`─── プロトコル: ${found.codename} ────────`),
      mkline(`  名称     : ${locked?"████████":found.title}`),
      mkline(`  状態     : ${found.status.toUpperCase()}`,found.status==="active"?"warning":"output"),
      mkline(`  脅威分類 : ${locked?"████":found.threat_class}`),
      mkline(`  概要     : ${locked?"████████████████████████████":found.summary.slice(0,80)}`),
      ...(!locked&&found.steps_json.length>0?[sys("  手順:"),...found.steps_json.slice(0,4).map(s=>mkline(`    #${s.step} ${s.title}`))]:[]),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "THEORY") {
    if (!arg) return { lines: [
      sys("─── 研究仮説一覧 ───────────────────────"),
      ...db.theories.slice(0,8).map(t=>mkline(`  ${pad(t.id,12)} ${bar(t.confidence,100,10)} ${t.confidence}%  ${t.title.slice(0,20)}`)),
      sys("────────────────────────────────────────"),
    ]};
    const found = db.theories.find(t=>t.id.toUpperCase()===arg);
    if (!found) return { lines: [err(`${arg}: 研究仮説が見つかりません`)] };
    const locked = found.clearance_req>clr||found.status==="classified";
    return { lines: [
      sys(`─── 研究仮説: ${found.id} ──────────────`),
      mkline(`  タイトル  : ${locked?"[機密]":found.title}`),
      mkline(`  ステータス: ${found.status.toUpperCase()}`),
      mkline(`  信頼度    : ${bar(found.confidence,100)} ${found.confidence}%`),
      mkline(`  概要      : ${locked?"████████████████████████████":found.abstract.slice(0,100)}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── 文書 ─────────────────────────────────────────────────────────
  if (cmd === "NOVEL") {
    const id = argRaw.toUpperCase();
    if (!id) return { lines: [
      sys("─── 機関員日記 ─────────────────────────"),
      ...NOVEL_DOCUMENTS.map(d=>mkline(`  ${pad(d.id,12)} CLR:${d.clearance} [${d.category}] ${d.title}`,d.clearance>clr?"system":"output")),
      sys("────────────────────────────────────────"),
    ]};
    const found = NOVEL_DOCUMENTS.find(d=>d.id.toUpperCase()===id);
    if (!found) return { lines: [err(`${id}: 文書が見つかりません`)] };
    if (found.clearance>clr) return { lines: [err(`CLR LV${found.clearance} が必要です`)] };
    const preview = found.content.replace(/\[\[.*?\]\]/g,"[タグ]").slice(0,200);
    return { lines: [
      sys(`─── ${found.id}: ${found.title} ─────────`),
      mkline(`  著者: ${found.author}  日付: ${found.date}`),
      mkline(""),
      mkline(preview+(found.content.length>200?"…":"")),
      sys("────────────────────────────────────────"),
      mkline(`全文は /novel で読めます`),
    ]};
  }

  if (cmd === "SIGMA") {
    const n = arg?parseInt(arg,10):null;
    if (n!==null) {
      const found = db.sigma.find(s=>s.number===n);
      if (!found) return { lines: [err(`SIGMA #${n}: 見つかりません`)] };
      if (found.clearance_req>clr) return { lines: [err(`CLR LV${found.clearance_req} が必要です`)] };
      const partial = found.integrity<100;
      const mask = (text: string, pct: number) => {
        if (pct>=100) return text;
        return text.split("").map((c,i)=>i%Math.max(2,Math.floor(100/(100-pct)))===0&&c!=="\n"?"█":c).join("");
      };
      return { lines: [
        sys(`─── SIGMA #${String(found.number).padStart(3,"0")} ──────────────────`),
        mkline(`  受信日時  : ${found.received_at}`),
        mkline(`  媒体      : ${found.medium}`),
        ...(partial?[wrn(`  整合性    : ${found.integrity}% (PARTIAL)`)]:[]),
        mkline(""),
        mkline(mask(found.content,found.integrity), partial?"warning":"classified"),
        sys("────────────────────────────────────────"),
      ]};
    }
    const list = db.sigma.filter(s=>s.clearance_req<=clr);
    return { lines: [
      sys("─── SIGMA メッセージ一覧 ───────────────"),
      ...list.map(s=>mkline(`  #${String(s.number).padStart(3,"0")} ${pad(s.received_at.slice(0,10),12)} 整合性:${s.integrity}%`,s.integrity<100?"warning":"output")),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "MEMO") {
    if (!arg) return { lines: [err("使用法: MEMO [ID]")] };
    const found = db.memos.find(m=>m.id.toUpperCase()===arg||`MEMO-${arg}`===m.id.toUpperCase());
    if (!found) return { lines: [err(`${arg}: メモが見つかりません`)] };
    if (found.clearance_req>clr) return { lines: [err(`CLR LV${found.clearance_req} が必要です`)] };
    const corrupted = found.status==="corrupted";
    const corrupt = (text: string) => text.split("").map((c,i)=>i%7===3&&c!=="\n"?"█":c).join("");
    return { lines: [
      sys(`─── エージェントメモ: ${found.id} ──────`),
      mkline(`  著者   : ${found.author_ref}`),
      mkline(`  作成日 : ${found.written_at.slice(0,10)}`),
      mkline(`  状態   : ${found.status.toUpperCase()}`,corrupted?"error":"output"),
      mkline(""),
      mkline((corrupted?corrupt(found.content.slice(0,300)):found.content.slice(0,300)), corrupted?"error":"classified"),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "FREQUENCY") {
    const logs = arg ? db.obsLogs.filter(l=>l.type==="signal"&&l.freq_band?.toUpperCase().includes(arg)) : db.obsLogs.filter(l=>l.type==="signal");
    if (logs.length===0) return { lines: [mkline(`${arg?`${arg}: `:""}該当する信号記録がありません`)] };
    return { lines: [
      sys(`─── 信号観測ログ${arg?` [${arg}]`:""} ────────────`),
      ...logs.slice(0,10).map(l=>mkline(`  ${pad(l.id,16)} ${pad(l.freq_band??"??",10)} ${l.observed_at.slice(0,10)}`)),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "CROSSREF") {
    if (!arg) return { lines: [err("使用法: CROSSREF [ID]")] };
    const results: string[] = [];
    if (db.incidents.some(i=>i.id.toUpperCase().includes(arg))) results.push("incidents");
    if (db.entities.some(e=>e.code.toUpperCase().includes(arg))) results.push("entities");
    if (db.cases.some(c=>c.id.toUpperCase().includes(arg))) results.push("case_reports");
    if (db.ops.some(o=>o.id.toUpperCase().includes(arg)||o.codename.toUpperCase().includes(arg))) results.push("operation_records");
    if (db.theories.some(t=>t.id.toUpperCase().includes(arg))) results.push("research_theories");
    if (results.length===0) return { lines: [mkline(`${arg}: クロスリファレンスが見つかりませんでした`)] };
    return { lines: [
      sys(`─── クロスリファレンス: ${arg} ──────────`),
      ...results.map(r=>mkline(`  ✓ ${r}`)),
      sys("────────────────────────────────────────"),
    ]};
  }

  // ── 通信 ─────────────────────────────────────────────────────────
  if (cmd === "CONTACT") {
    const name = argRaw.toUpperCase() as NpcName;
    if (!name||!NPC_USERNAMES.has(name)) {
      return { lines: [
        mkline("利用可能なNPC:"),
        ...Array.from(NPC_USERNAMES).map(n=>mkline(`  ${n}  ${NPC_ICONS[n as NpcName]??"◐"}  ${NPC_TITLES[n as NpcName]??""}`)),
        mkline("使用法: CONTACT [NPC名] (例: CONTACT K-ECHO)"),
      ]};
    }
    const chatId = NPC_CHAT_IDS[name];
    return { lines: [
      sys(`─── NPC接続情報: ${name} ───────────────`),
      mkline(`  名称    : ${name}`),
      mkline(`  役職    : ${NPC_TITLES[name]}`),
      mkline(`  アイコン: ${NPC_ICONS[name]}`),
      cls(`  チャット: /chat/${chatId}`),
      sys("────────────────────────────────────────"),
    ]};
  }

  if (cmd === "INTERCEPT") return { lines: [
    sys("電波傍受モード — スキャン中..."),
    cls(`  ${pick(INTERCEPT_LINES)}`),
    sys("傍受終了"),
  ]};

  if (cmd === "ECHO") {
    if (!argRaw) return { lines: [err("使用法: ECHO [テキスト]")] };
    return { lines: [cls(`K-ECHO: 「${argRaw}」`), sys("（K-ECHOスタイルでエコー送信）")] };
  }

  // ── 認証・暗号 ────────────────────────────────────────────────────
  if (cmd === "DECRYPT") {
    if (!arg) return { lines: [err("使用法: DECRYPT [キーワード]")] };
    const resp = DECRYPT_RESPONSES[arg];
    if (resp) return { lines: [cls(resp)] };
    return { lines: [sys(`「${arg}」の解読を試みています...`), mkline("解読失敗 — 対応する暗号パターンが見つかりませんでした"), mkline("ヒント: ARGに登場するキーワードを試してみてください")] };
  }

  if (cmd === "UNLOCK") {
    if (!arg) return { lines: [err("使用法: UNLOCK [コード]")] };
    const resp = UNLOCK_CODES[arg];
    if (resp) return { lines: [cls(resp), sys("フラグ更新中...")] };
    return { lines: [mkline(`コード「${argRaw}」を検証中...`), err("認証失敗 — 該当するコードが見つかりません")] };
  }

  if (cmd === "AUTH") {
    if (!arg) return { lines: [err("使用法: AUTH [トークン]")] };
    const valid = arg.startsWith("KAI-")&&arg.length>=12;
    if (valid) return { lines: [cls(`一時認証成功 — トークン「${arg}」は有効です`), sys("アクセス権が一時的に拡張されました")] };
    return { lines: [err(`認証失敗 — トークン「${argRaw}」は無効です`)] };
  }

  if (cmd === "FRAGMENT") {
    if (!arg) return { lines: [err("使用法: FRAGMENT [コード]")] };
    const frags: Record<string,string> = { "F001":"…海は、扉を…", "F002":"…第七層の名…", "F003":"…西堂はまだ…" };
    const found = frags[arg]??pick(SIGMA_FRAGMENTS).slice(0,30)+"…";
    return { lines: [sys(`SIGMA断片 ${arg} を復号中...`), cls(`  復号結果: ${found}`), wrn("注: 断片の解釈には文脈が必要です")] };
  }

  // ── 報告・分析 ────────────────────────────────────────────────────
  if (cmd === "PREDICT") {
    const lats=["35.6","34.7","43.1","31.5","38.2"];
    const lons=["135.5","139.7","141.3","130.4","140.8"];
    const gsi=(3.5+Math.random()*4).toFixed(1);
    const hours=Math.floor(Math.random()*60)+12;
    return { lines: [
      sys("侵食予測モデル実行中..."),
      mkline("  過去72時間のGSI推移を分析"),
      mkline("  波形パターン照合: 47,331データポイント"),
      wrn(`  次の裂孔発生予測座標: ${pick(lats)}N, ${pick(lons)}E`),
      wrn(`  予測GSI値: ${gsi}σ  /  予測発生まで: ${hours}時間`),
      sys("注: これは確率モデルによる予測です"),
    ]};
  }

  // ── ARG演出 ───────────────────────────────────────────────────────
  if (cmd === "LISTEN")    return { lines: [sys("SIGMA受信モード..."), cls(`  受信: ${pick(SIGMA_FRAGMENTS)}`), sys("受信終了")] };
  if (cmd === "VEIL")      return { lines: [sys("N-VEIL 断片通信受信中..."), cls(`  N-VEIL: ${pick(VEIL_FRAGMENTS)}`), sys("通信終了")] };
  if (cmd === "OBSERVE")   return { lines: [cls("◎ OBSERVER SYSTEM ACTIVATED"), cls("  あなたはこのシステムを観測している。"), cls("  このシステムもまた、あなたを観測している。"), sys(`  現在時刻: ${new Date().toLocaleString("ja-JP")}`)] };

  if (cmd === "CALIBRATE") {
    const sensor = pick(CALIBRATE_SENSORS);
    const error  = (Math.random()*0.08-0.04).toFixed(4);
    return { lines: [sys(`${sensor} — キャリブレーション開始`), mkline("  ベースライン読取り中..."), mkline("  温度補正適用中..."), mkline(`  測定誤差: ${error}σ`), mkline("  校正完了 — センサーは最適状態です")] };
  }

  // ── エクスポート ─────────────────────────────────────────────────
  if (cmd === "EXPORT") {
    if (!arg) return { lines: [err("使用法: EXPORT [INCIDENTS|ENTITIES|MISSIONS]")] };
    const FMTS: Record<string,()=>string[]> = {
      "INCIDENTS": ()=>["id,severity,name,gsi,location",...db.incidents.map(i=>`${i.id},${i.severity},${i.name},${i.gsi},${i.location}`)],
      "ENTITIES":  ()=>["code,designation,classification,threat",...db.entities.map(e=>`${e.code},${e.designation??e.name},${e.classification},${e.threat??""}`)],
      "MISSIONS":  ()=>["id,title,status,phase,category",...db.missions.map(m=>`${m.id},${m.title},${m.status},${m.phase},${m.category}`)],
    };
    const fn = FMTS[arg];
    if (!fn) return { lines: [err(`未知のタイプ: ${arg}  (INCIDENTS / ENTITIES / MISSIONS)`)] };
    const rows = fn();
    return { lines: [sys(`─── EXPORT: ${arg} ───────────────────`), ...rows.map(r=>sys(r)), sys("────────────────────────────────────────"), mkline(`${rows.length-1} 件エクスポート完了`)] };
  }

  return { lines: [err(`不明なコマンド: '${cmd}' — 'HELP' で一覧を確認してください`)] };
}



// ─── メインコンポーネント ─────────────────────────────────────────────

// ─── 起動ログ ─────────────────────────────────────────────────────────

const INIT_LINES: LogLine[] = [
  { id: ++lineId, type: "system", text: "╔══════════════════════════════════════════════════╗" },
  { id: ++lineId, type: "system", text: "║   KAISHOKU OBSERVATION SYSTEM  v4.1.0            ║" },
  { id: ++lineId, type: "system", text: "║   CLEARANCE LV3 TERMINAL — ENCRYPTED SESSION      ║" },
  { id: ++lineId, type: "system", text: "╚══════════════════════════════════════════════════╝" },
  { id: ++lineId, type: "output", text: "" },
  { id: ++lineId, type: "output", text: "認証セッション確立。接続安全。" },
  { id: ++lineId, type: "output", text: ">> HELP でコマンド一覧 / ↑↓ 履歴 / Tab 補完 / EXIT でダッシュボードへ" },
  { id: ++lineId, type: "output", text: "" },
];

// CRTカラーパレット（グリーンフォスフォル）
const C = {
  fg:        "#00ff41",   // メインテキスト（グリーン）
  fgDim:     "#00cc33",   // サブテキスト
  fgMuted:   "#006618",   // ミュート
  fgGhost:   "#003310",   // 最暗
  bg:        "#080c08",   // 背景
  bgSurface: "#0a100a",   // 入力エリア
  error:     "#ff4444",   // エラー（赤）
  warning:   "#ffb800",   // 警告（アンバー）
  classified:"#aa44ff",   // 機密（パープル）
  system:    "#006618",   // システム（暗緑）
  cursor:    "#00ff41",   // カーソル
  border:    "#003310",   // ボーダー
  scanline:  "rgba(0,255,65,0.025)", // スキャンライン
} as const;

const lineColor = (type: LogLine["type"]): string => {
  switch (type) {
    case "input":      return C.fg;
    case "error":      return C.error;
    case "warning":    return C.warning;
    case "system":     return C.system;
    case "classified": return C.classified;
    default:           return C.fgDim;
  }
};

const QUICK = ["STATUS","GSI","INCIDENTS","ENTITIES","MISSIONS","MAP","LISTEN","DRIFT","OBSERVE","HELP"];

const ALL_CMDS = [
  "HELP","STATUS","GSI","WHOAMI","CLEARANCE","XP","RANK","CERTIFY",
  "ENTITIES","SCAN","FACILITY","PERSONNEL",
  "MISSIONS","MISSION","INCIDENTS","CASE","OP",
  "DIVISION","MODULE","SKILLS","ACHIEVEMENTS",
  "MAP","LOCATE","ANOMALY","LAYER","CRACK","NEAREST","THREAT","CROSSREF",
  "NOVEL","SIGMA","MEMO","FREQUENCY","PROTOCOL","THEORY",
  "CONTACT","BROADCAST","INTERCEPT","ECHO",
  "DECRYPT","UNLOCK","AUTH","FRAGMENT",
  "REPORT","PREDICT",
  "LISTEN","VEIL","OBSERVE","CALIBRATE","DRIFT","BLACKOUT","CORRUPTED",
  "HISTORY","EXPORT","VERSION","PING","CLEAR","REBOOT","SHUTDOWN","EXIT",
];

// ─── メインコンポーネント ──────────────────────────────────────────────

export default function ConsolePage() {
  const router = useRouter();

  const [lines,      setLines]    = useState<LogLine[]>(INIT_LINES);
  const [input,      setInput]    = useState("");
  const [history,    setHistory]  = useState<string[]>([]);
  const [histIdx,    setHistIdx]  = useState(-1);
  const [isShutdown, setShutdown] = useState(false);
  const [isDrift,    setDrift]    = useState(false);
  const [isBlackout, setBlackout] = useState(false);
  const [isCorrupt,  setCorrupt]  = useState(false);
  const [cursorOn,   setCursorOn] = useState(true);
  const [db, setDb] = useState<DbState>({
    incidents:[],entities:[],facilities:[],personnel:[],missions:[],modules:[],
    cracks:[],cases:[],ops:[],obsPoints:[],obsLogs:[],protocols:[],theories:[],sigma:[],memos:[],
  });
  const [user, setUser] = useState<UserState|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // カーソル点滅
  useEffect(() => {
    const iv = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(iv);
  }, []);

  // DBデータ取得
  useEffect(() => {
    const f = (url: string) => fetch(url, {headers:H}).then(r=>r.ok?r.json():[]).catch(()=>[]);
    Promise.all([
      f("/api/incidents"),f("/api/db-data?type=entities"),f("/api/db-data?type=facilities"),
      f("/api/db-data?type=personnel"),f("/api/missions"),f("/api/modules"),
      f("/api/dimension-cracks"),f("/api/case-reports"),f("/api/operation-records"),
      f("/api/observation-points"),f("/api/observation-logs"),f("/api/containment-protocols"),
      f("/api/research-theories"),f("/api/sigma-messages"),f("/api/agent-memos"),
    ]).then(([incidents,entities,facilities,personnel,missions,modules,
              cracks,cases,ops,obsPoints,obsLogs,protocols,theories,sigma,memos]) => {
      setDb({incidents,entities,facilities,personnel,missions,modules,
             cracks,cases,ops,obsPoints,obsLogs,protocols,theories,sigma,memos} as DbState);
    });
    fetch("/api/users/me/story-state",{headers:H}).then(r=>r.ok?r.json():null).then(d => {
      if (!d) return;
      setUser({agentId:"K-???",level:d.clearanceLevel??0,xp:d.xpTotal??0,
               streak:0,divisionId:"",clearance:d.clearanceLevel??0,
               anomaly:0,skills:[],achievements:[],flags:d.flags??{},xpTotal:d.xpTotal??0});
    }).catch(()=>{});
  },[]);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [lines]);

  const push = useCallback((newLines: LogLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const submit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || isShutdown) return;
    const inputLine: LogLine = {id:++lineId, type:"input", text:`> ${cmd}`};
    const upperCmd = cmd.trim().toUpperCase().split(/\s+/)[0] ?? "";
    const argRaw   = cmd.trim().split(/\s+/).slice(1).join(" ");

    // EXIT — ダッシュボードへ戻る
    if (upperCmd === "EXIT") {
      setLines(prev => [...prev, inputLine,
        {id:++lineId, type:"system", text:"セッションを終了します..."},
        {id:++lineId, type:"system", text:"ダッシュボードへ接続を切り替えています..."},
      ]);
      setTimeout(() => router.push("/dashboard"), 800);
      setHistory(prev => [cmd, ...prev.slice(0,49)]);
      setHistIdx(-1);
      setInput("");
      return;
    }

    const {lines:newLines, special} = processCommand(cmd, db, user, history);
    setHistory(prev => [cmd, ...prev.slice(0,49)]);
    setHistIdx(-1);
    setInput("");

    if (special === "clear")    { setLines(INIT_LINES); return; }
    if (special === "shutdown") {
      setLines(prev => [...prev, inputLine,
        {id:++lineId,type:"system",text:"接続を終了します..."},
        {id:++lineId,type:"system",text:"セッションデータを保存中..."},
        {id:++lineId,type:"classified",text:"■ 接続終了。また任務で。"},
      ]);
      setShutdown(true); return;
    }
    if (special === "reboot") {
      setLines([inputLine]);
      const rlines = [
        "システムを再起動します...", "メモリフラッシュ中...", "観測グリッド再接続中...",
        "認証トークン更新中...",
        "╔══════════════════════════════════════════════════╗",
        "║   OBSERVATION SYSTEM v4.1 — REBOOTED             ║",
        "╚══════════════════════════════════════════════════╝",
        "再起動完了。",
      ];
      rlines.forEach((t,i) => setTimeout(() => {
        setLines(prev => [...prev, {id:++lineId, type:i>=4?"system":"system", text:t}]);
        if (i === rlines.length-1) setShutdown(false);
      }, i*400));
      return;
    }
    if (special === "drift") {
      setLines(prev => [...prev, inputLine, {id:++lineId,type:"system",text:"次元ドリフト検出中..."}]);
      setDrift(true);
      let gsi = 2.1;
      for (let i=0; i<8; i++) {
        setTimeout(() => {
          gsi += Math.random()*1.2;
          const t: LogLine["type"] = gsi>=6?"error":gsi>=4?"warning":"output";
          setLines(prev => [...prev, {id:++lineId,type:t,text:`  GSI: ${gsi.toFixed(2)}σ  ${"█".repeat(Math.round(gsi))}`}]);
          if (i===7) setTimeout(() => {
            setLines(prev => [...prev, {id:++lineId,type:"warning",text:`ドリフト安定化 — 最終GSI: ${gsi.toFixed(2)}σ`}]);
            setDrift(false);
          }, 600);
        }, i*500);
      }
      return;
    }
    if (special === "blackout") {
      setLines(prev => [...prev, inputLine, {id:++lineId,type:"system",text:"接続が一時的に──"}]);
      setBlackout(true);
      setTimeout(() => {
        setBlackout(false);
        setLines(prev => [...prev,
          {id:++lineId,type:"system",text:"── 接続復旧"},
          {id:++lineId,type:"output",text:"ブラックアウト終了。何が起きたか覚えていますか？"},
        ]);
      }, 3000);
      return;
    }
    if (special === "corrupted") {
      const gl = ["█▓░▒│┐╗╔╣","ERR:0xFF█▓░▒","SYS::FAIL▒░","▓█╗╔┼╬╩╦╠═"];
      setLines(prev => [...prev, inputLine]);
      setCorrupt(true);
      for (let i=0; i<5; i++) {
        setTimeout(() => {
          setLines(prev => [...prev, {id:++lineId,type:"error",text:`  ${pick(gl)} ${pick(gl)} ${pick(gl)}`}]);
          if (i===4) setTimeout(() => {
            setCorrupt(false);
            setLines(prev => [...prev, {id:++lineId,type:"system",text:"システム正常化"}]);
          }, 800);
        }, i*300);
      }
      return;
    }

    // 非同期コマンド
    if (upperCmd === "REPORT") {
      setLines(prev => [...prev, inputLine, {id:++lineId,type:"system",text:"報告処理中..."}]);
      const RMAP: Record<string,string> = {"ANOMALY":"report_anomaly","ENTITY":"report_anomaly","SYSTEM":"division_activity"};
      const activity = RMAP[argRaw.toUpperCase()];
      if (!activity) { push([{id:++lineId,type:"error",text:`不明な報告種別: ${argRaw}  (ANOMALY / ENTITY / SYSTEM)`}]); return; }
      try {
        const res = await fetch("/api/users/me/xp",{method:"POST",headers:{...H,"Content-Type":"application/json"},body:JSON.stringify({activity})});
        const data = await res.json() as {xpGained?:number;rateLimit?:number};
        push(data.rateLimit?[{id:++lineId,type:"warning",text:"レート制限: 本日すでに処理されています"}]:
             data.xpGained&&data.xpGained>0?[{id:++lineId,type:"output",text:`報告受理 — +${data.xpGained} XP`}]:
             [{id:++lineId,type:"output",text:"報告受理 — 本日のXP付与上限に達しています"}]);
      } catch { push([{id:++lineId,type:"error",text:"送信エラー"}]); }
      return;
    }
    if (upperCmd === "BROADCAST") {
      if (!argRaw) { setLines(prev => [...prev, inputLine, {id:++lineId,type:"error",text:"使用法: BROADCAST [メッセージ]"}]); return; }
      setLines(prev => [...prev, inputLine, {id:++lineId,type:"system",text:"送信中..."}]);
      try {
        const res = await fetch("/api/chat/global",{method:"POST",headers:{...H,"Content-Type":"application/json"},body:JSON.stringify({content:`[CONSOLE] ${argRaw}`})});
        push(res.ok?[{id:++lineId,type:"system",text:">> TRANSMITTED"}]:[{id:++lineId,type:"error",text:`送信失敗 (${res.status})`}]);
      } catch { push([{id:++lineId,type:"error",text:"送信エラー"}]); }
      return;
    }

    setLines(prev => [...prev, inputLine, ...newLines]);
  }, [input, db, user, history, isShutdown, push, router]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { submit(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx+1, history.length-1);
      setHistIdx(next); setInput(history[next] ?? "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIdx-1;
      if (next < 0) { setHistIdx(-1); setInput(""); }
      else { setHistIdx(next); setInput(history[next] ?? ""); }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.trim().toUpperCase();
      const matches = ALL_CMDS.filter(c => c.startsWith(partial));
      if (matches.length === 1) setInput(matches[0]!);
      else if (matches.length > 1) push([{id:++lineId,type:"system",text:`候補: ${matches.join("  ")}`}]);
    }
  };

  // ステータスバーのテキスト
  const statusText = isDrift ? "⚠ DIMENSIONAL DRIFT" : isShutdown ? "■ OFFLINE" : isBlackout ? "▓▓▓ BLACKOUT" : "● ONLINE";
  const statusColor = isDrift ? C.warning : isShutdown ? C.error : isBlackout ? C.error : C.fg;

  return (
    <div
      style={{
        width: "100%", height: "100dvh",
        background: C.bg,
        display: "flex", flexDirection: "column",
        fontFamily: "'Share Tech Mono', 'Courier New', 'Lucida Console', monospace",
        color: C.fg,
        opacity: isBlackout ? 0.015 : 1,
        transition: "opacity 0.2s ease",
        filter: isCorrupt ? "hue-rotate(100deg) contrast(1.8) saturate(2)" : "none",
        // CRTエフェクト
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* CRTスキャンライン */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${C.scanline} 2px, ${C.scanline} 4px)`,
      }} />

      {/* CRTビネット（周辺減光） */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
        background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
      }} />

      {/* ── ヘッダーバー ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 16px",
        borderBottom: `1px solid ${C.border}`,
        background: "#050905",
        position: "relative", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: statusColor, fontSize: 9, letterSpacing: "0.15em" }}>{statusText}</span>
          <span style={{ color: C.fgGhost }}>│</span>
          <span style={{ color: C.fgMuted, fontSize: 9, letterSpacing: "0.12em" }}>
            KAISHOKU OBS-SYS v4.1 / CLR:LV3 / NODE:{Math.floor(Math.random()*3)+7}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); router.push("/dashboard"); }}
          style={{
            fontSize: 9, letterSpacing: "0.12em", padding: "3px 10px",
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.fgMuted, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.fg; (e.currentTarget as HTMLElement).style.color = C.fg; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.fgMuted; }}
        >
          [ESC] DASHBOARD
        </button>
      </div>

      {/* ── ログ表示エリア ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 20px 4px",
        position: "relative", zIndex: 10,
        scrollbarWidth: "thin",
        scrollbarColor: `${C.border} transparent`,
      }}>
        {lines.map(line => (
          <div key={line.id} style={{
            fontSize: 12, lineHeight: 1.75,
            whiteSpace: "pre-wrap", wordBreak: "break-all",
            color: lineColor(line.type),
            textShadow: `0 0 8px ${lineColor(line.type)}88`,
          }}>
            {line.text}
          </div>
        ))}
        {isShutdown && (
          <div style={{ marginTop: 24, color: C.fgGhost, fontSize: 11 }}>
            REBOOT コマンドで再接続
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── クイックコマンドバー ── */}
      <div style={{
        flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 16px",
        borderTop: `1px solid ${C.border}`,
        background: "#050905",
        position: "relative", zIndex: 10,
      }}>
        <span style={{ fontSize: 9, color: C.fgMuted, alignSelf: "center", marginRight: 4, letterSpacing: "0.1em" }}>QUICK:</span>
        {QUICK.map(cmd => (
          <button key={cmd}
            onClick={e => {
              e.stopPropagation();
              if (isShutdown && cmd !== "REBOOT") return;
              setInput(cmd);
              setTimeout(() => { submit(); }, 0);
            }}
            style={{
              fontSize: 9, letterSpacing: "0.1em", padding: "2px 8px",
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.fgMuted, cursor: "pointer",
              opacity: isShutdown && cmd !== "REBOOT" ? 0.3 : 1,
              transition: "all 0.1s",
              textShadow: "none",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = C.fg;
              el.style.color = C.fg;
              el.style.textShadow = `0 0 6px ${C.fg}`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = C.border;
              el.style.color = C.fgMuted;
              el.style.textShadow = "none";
            }}
          >
            {cmd}
          </button>
        ))}
        <button
          onClick={e => { e.stopPropagation(); router.push("/dashboard"); }}
          style={{
            fontSize: 9, letterSpacing: "0.1em", padding: "2px 8px",
            background: "transparent", border: `1px solid ${C.error}44`,
            color: `${C.error}88`, cursor: "pointer",
            marginLeft: "auto",
            transition: "all 0.1s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = C.error;
            el.style.color = C.error;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${C.error}44`;
            el.style.color = `${C.error}88`;
          }}
        >
          EXIT
        </button>
      </div>

      {/* ── 入力ライン ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 20px 10px",
        borderTop: `1px solid ${C.border}`,
        background: C.bgSurface,
        position: "relative", zIndex: 10,
      }}>
        <span style={{
          fontSize: 13, color: C.fg,
          textShadow: `0 0 8px ${C.fg}`,
          userSelect: "none",
        }}>
          {isShutdown ? "✖" : "▶"}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          disabled={isShutdown}
          placeholder={isShutdown ? "OFFLINE — REBOOT で再起動" : "コマンドを入力...  (Tab補完 / ↑↓履歴)"}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 13, color: C.fg,
            fontFamily: "'Share Tech Mono', 'Courier New', monospace",
            caretColor: "transparent",  // カスタムカーソルのため非表示
            textShadow: `0 0 6px ${C.fg}88`,
            opacity: isShutdown ? 0.3 : 1,
          }}
        />
        {/* ブロックカーソル */}
        {!isShutdown && (
          <span aria-hidden="true" style={{
            display: "inline-block",
            width: 8, height: 14,
            background: cursorOn ? C.cursor : "transparent",
            boxShadow: cursorOn ? `0 0 6px ${C.cursor}` : "none",
            verticalAlign: "middle",
            marginLeft: -2,
            transition: "background 0.05s, box-shadow 0.05s",
          }} />
        )}
        <span style={{ fontSize: 10, color: C.fgMuted, letterSpacing: "0.1em", userSelect: "none" }}>
          ↑↓ TAB
        </span>
      </div>

      {/* グロー効果（グリーン） */}
      <div aria-hidden="true" style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(to top, ${C.fg}06, transparent)`,
        pointerEvents: "none", zIndex: 3,
      }} />
    </div>
  );
}
