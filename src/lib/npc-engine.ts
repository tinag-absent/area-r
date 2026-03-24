/**
 * NPCエンジン
 *
 * チャットに届いたメッセージを解析し、NPCが自動返答する仕組みを提供する。
 * キーワードマッチ → 一致したルールの NPC が返答し、確率で連鎖反応する。
 * マッチしなかった場合は50%の確率でアイドル発言が行われる。
 */

import { getDb, execute } from "./db";
import { NPC_USERNAMES, NPC_IDS } from "./constants";
import { randomUUID } from "crypto";
import type { NpcName } from "./npc-config";

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

/** キーワードトリガーに対応するNPCの返答ルール */
interface NpcTriggerRule {
  /** マッチさせるキーワード一覧（いずれか1つを含めば発火） */
  keywords: string[];
  /** 返答する主NPCの名前 */
  npc: NpcName;
  /** 主NPCの返答候補（ランダム選択） */
  responses: string[];
  /** 連鎖反応するNPC名（省略可） */
  chainNpc?: NpcName;
  /** 連鎖反応の確率 0〜1（省略可） */
  chainChance?: number;
  /** 連鎖NPCの返答候補（省略可） */
  chainResponses?: string[];
  /** 返答までの最短遅延（ms） */
  delayMin: number;
  /** 返答までの最長遅延（ms） */
  delayMax: number;
}

/** アイドル時（キーワード未マッチ）の発言エントリ */
interface IdleEntry {
  npc: NpcName;
  messages: string[];
}

// ─────────────────────────────────────────────────────────────────────
// トリガールール定義
// キーワードに反応してNPCが発言する。上から順に評価し、最初にマッチしたルールを使用。
// ─────────────────────────────────────────────────────────────────────

const TRIGGER_RULES: NpcTriggerRule[] = [
  {
    keywords: ["海蝕", "侵食", "kaishoku", "海は削れ", "削れ"],
    npc: "K-ECHO",
    responses: [
      "...データを照合中。海蝕指数、現在3.7σ。通常範囲を逸脱しています。",
      "その言葉に反応しました。観測ログに記録します。",
      "海蝕現象の進行速度が、先週比で14%上昇しています。注意が必要です。",
      "確認しました。収束部門に共有します。",
    ],
    chainNpc: "L-RIFT",
    chainChance: 0.4,
    chainResponses: [
      "⬡ センサーグリッドに異常入力。ログ保存完了。",
      "⬡ 観測系統は正常稼働中。K-ECHOの報告を受領。",
    ],
    delayMin: 1500,
    delayMax: 4000,
  },
  {
    keywords: ["次元", "次元裂孔", "裂孔", "dimension", "階宙"],
    npc: "N-VEIL",
    responses: [
      "…次元の境界が揺れている。あなたにも感じますか？",
      "その問いは、答えを持っていません。ただ、現象だけがあります。",
      "次元裂孔の観測データは、機関設立以来最高値を記録しています。",
      "境界の外には何があるのか。私にもまだ、わかりません。",
      "…興味深い。それを認識できるということは、あなたは特異点に近い。",
    ],
    chainNpc: "G-MIST",
    chainChance: 0.3,
    chainResponses: [
      "〜 …境界……あちら側から、声が……",
      "〜 ……見てはいけない。",
    ],
    delayMin: 2000,
    delayMax: 5000,
  },
  {
    keywords: ["システム", "エラー", "error", "障害", "ログ", "バグ"],
    npc: "L-RIFT",
    responses: [
      "⬡ エラーコードを確認しました。パッチを適用します。",
      "⬡ システム診断を開始します。しばらくお待ちください。",
      "⬡ 該当ログを検索中…見つかりました。修正対応に入ります。",
      "⬡ 技術部門に転送します。優先度: HIGH でマークしました。",
    ],
    delayMin: 800,
    delayMax: 2500,
  },
  {
    keywords: ["助けて", "怖い", "大丈夫", "不安", "疲れ", "つらい"],
    npc: "A-PHOS",
    responses: [
      "♡ 大丈夫ですよ。私がここにいます。",
      "♡ 無理しないでください。あなたの安全が最優先です。",
      "♡ 怖い気持ちは当然です。でも、あなたは一人じゃありません。",
      "♡ 少し休んでください。機関はあなたを必要としています。",
    ],
    chainNpc: "K-ECHO",
    chainChance: 0.25,
    chainResponses: [
      "…機関員の精神状態は、任務遂行能力に直結します。A-PHOSの言う通りです。",
      "感情的な揺れは、異常スコアに影響することがあります。注意してください。",
    ],
    delayMin: 1000,
    delayMax: 3000,
  },
  {
    keywords: ["消滅", "崩壊", "終わり", "collapse", "観測者", "observer"],
    npc: "G-MIST",
    responses: [
      "〜 ……それは、もう始まっています。",
      "〜 …消滅？……それとも、収束？",
      "〜 観測者は……存在しない。存在できない。",
      "〜 ………。",
    ],
    chainNpc: "N-VEIL",
    chainChance: 0.5,
    chainResponses: [
      "G-MISTが反応した。これは記録に残さなければなりません。",
      "…その言葉が、何かを揺り動かしている。",
    ],
    delayMin: 3000,
    delayMax: 7000,
  },
  {
    keywords: ["封印", "隔離", "containment", "裂孔封鎖"],
    npc: "K-ECHO",
    responses: [
      "封印プロトコル、確認しました。封印部門に転送します。",
      "裂孔封鎖の優先度を引き上げます。データを分析中です。",
      "封印状態を監視しています。現在、安定範囲内です。",
    ],
    delayMin: 1200,
    delayMax: 3500,
  },
  {
    keywords: ["ありがとう", "thank", "感謝"],
    npc: "A-PHOS",
    responses: [
      "♡ こちらこそ、ありがとうございます。",
      "♡ あなたと一緒に働けて光栄です。",
      "♡ いつでも声をかけてください。",
    ],
    delayMin: 800,
    delayMax: 2000,
  },
  {
    keywords: ["西堂", "創設者", "founder"],
    npc: "N-VEIL",
    responses: [
      "…西堂の名を口にする者は、少なくなりました。",
      "創設者の記録は、記録部門の最深部に保管されています。アクセスには相応のクリアランスが必要です。",
      "…西堂が見ていたものを、私たちはまだ見ていない。",
    ],
    chainNpc: "G-MIST",
    chainChance: 0.6,
    chainResponses: [
      "〜 ……西堂……あの人は……知っていた……",
      "〜 ……名前を……呼んではいけない……",
    ],
    delayMin: 2500,
    delayMax: 6000,
  },
];

// ─────────────────────────────────────────────────────────────────────
// アイドル発言プール（キーワード未マッチ時に50%で発言）
// 循環インデックスで順番に使用し、同じNPCが連続しないようにする。
// ─────────────────────────────────────────────────────────────────────

const IDLE_POOL: IdleEntry[] = [
  {
    npc: "K-ECHO",
    messages: [
      "定期観測ログを更新しました。現在の海蝕指数: 2.1σ。",
      "新規観測データを処理中です。",
      "…静かですね。静寂にも意味があります。",
    ],
  },
  {
    npc: "L-RIFT",
    messages: [
      "⬡ システム全体の稼働率: 99.7%。正常動作中。",
      "⬡ バックアップ完了。ログ整理を実行しています。",
      "⬡ …新しいアクセスを検知。ログに記録します。",
    ],
  },
  {
    npc: "A-PHOS",
    messages: [
      "♡ みなさん、今日も一日お疲れさまです。",
      "♡ 何か困ったことがあれば、いつでも相談してください。",
    ],
  },
];

/** アイドル発言の循環カウンター */
let idleIndex = 0;

// ─────────────────────────────────────────────────────────────────────
// ユーティリティ関数
// ─────────────────────────────────────────────────────────────────────

/** キーワードマッチを確認し、最初にヒットしたルールを返す */
// ─────────────────────────────────────────────────────────────────────
// DBルールキャッシュ（1分間有効）
// npc_engine_rules テーブルにルールが存在する場合はDB優先、
// 存在しない場合はハードコードの TRIGGER_RULES / IDLE_POOL にフォールバックする。
// ─────────────────────────────────────────────────────────────────────

interface RuleCache {
  triggers: NpcTriggerRule[];
  idles:    IdleEntry[];
  loadedAt: number;
}

let ruleCache: RuleCache | null = null;
const CACHE_TTL_MS = 60_000; // 1分

async function loadRulesFromDb(): Promise<{ triggers: NpcTriggerRule[]; idles: IdleEntry[] }> {
  const db = getDb();
  try {
    const rows = await (await import("./db")).queryAll<{ id: string; data_json: string }>(
      db,
      `SELECT id, data_json FROM npc_engine_rules WHERE active = 1 ORDER BY priority DESC`
    );

    if (rows.length === 0) {
      return { triggers: TRIGGER_RULES, idles: IDLE_POOL };
    }

    const triggers: NpcTriggerRule[] = [];
    const idles: IdleEntry[]         = [];

    for (const row of rows) {
      try {
        const data = JSON.parse(row.data_json) as Record<string, unknown>;
        if (data.type === "trigger" && Array.isArray(data.keywords) && typeof data.npc === "string") {
          triggers.push({
            keywords:       data.keywords as string[],
            npc:            data.npc as NpcName,
            responses:      (data.responses as string[]) ?? [],
            chainNpc:       data.chain_npc as NpcName | undefined,
            chainChance:    typeof data.chain_chance === "number" ? data.chain_chance : undefined,
            chainResponses: data.chain_responses as string[] | undefined,
            delayMin:       typeof data.delay_min_ms === "number" ? data.delay_min_ms : 1500,
            delayMax:       typeof data.delay_max_ms === "number" ? data.delay_max_ms : 4000,
          });
        } else if (data.type === "idle" && typeof data.npc === "string" && Array.isArray(data.messages)) {
          // 既存 idleEntry とマージ（同一NPCのエントリを結合）
          const existing = idles.find(e => e.npc === data.npc);
          if (existing) {
            existing.messages.push(...(data.messages as string[]));
          } else {
            idles.push({ npc: data.npc as NpcName, messages: data.messages as string[] });
          }
        }
      } catch {
        // JSONパースエラーは無視してスキップ
      }
    }

    // DBに trigger が1件もなければフォールバック
    return {
      triggers: triggers.length > 0 ? triggers : TRIGGER_RULES,
      idles:    idles.length > 0    ? idles    : IDLE_POOL,
    };
  } catch {
    // DBエラー時はハードコードにフォールバック
    return { triggers: TRIGGER_RULES, idles: IDLE_POOL };
  }
}

async function getActiveRules(): Promise<{ triggers: NpcTriggerRule[]; idles: IdleEntry[] }> {
  const now = Date.now();
  if (ruleCache && now - ruleCache.loadedAt < CACHE_TTL_MS) {
    return { triggers: ruleCache.triggers, idles: ruleCache.idles };
  }
  const rules = await loadRulesFromDb();
  ruleCache = { ...rules, loadedAt: now };
  return rules;
}

/** 管理者がルールを更新したときにキャッシュを即時無効化する */
export function invalidateNpcRuleCache(): void {
  ruleCache = null;
}

async function matchTrigger(text: string, rules: NpcTriggerRule[]): Promise<NpcTriggerRule | null> {
  const lower = text.toLowerCase();
  return (
    rules.find((rule) =>
      rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))
    ) ?? null
  );
}

/** 配列からランダムに1要素を選択する */
function pick<T>(arr: T[]): T {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** min〜max ミリ秒のランダム待機を行う（リアリティ演出用）*/
function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** NPCのメッセージをDBに保存する */
async function insertNpcMessage(
  db: ReturnType<typeof getDb>,
  chatId: string,
  npcName: string,
  text: string
): Promise<void> {
  await execute(
    db,
    `INSERT INTO chat_messages (id, chat_id, sender_id, sender_name, text, type)
     VALUES (?, ?, ?, ?, ?, 'npc')`,
    [randomUUID(), chatId, NPC_IDS[npcName as import('@/lib/npc-config').NpcName], npcName, text]
  );
}

// ─────────────────────────────────────────────────────────────────────
// メインエントリポイント
// ─────────────────────────────────────────────────────────────────────

/**
 * ユーザーのチャットメッセージに対してNPCが自動返答する。
 *
 * @param chatId  - メッセージが送信されたチャンネルID
 * @param messageText - ユーザーのメッセージ本文
 * @param isGroup - グループチャンネル（npc_group）かどうか（第3NPCの割り込み判定に使用）
 */
export async function processNpcResponse(
  chatId: string,
  messageText: string,
  isGroup: boolean
): Promise<void> {
  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  const { triggers } = await getActiveRules();
  const rule = await matchTrigger(messageText, triggers);

  if (rule) {
    await handleTriggeredResponse(db, chatId, rule, isGroup);
  } else if (Math.random() < 0.5) {
    await handleIdleResponse(db, chatId);
  }
}

/** キーワードマッチ時の返答処理（主NPC → 連鎖NPC → グループ割り込み） */
async function handleTriggeredResponse(
  db: ReturnType<typeof getDb>,
  chatId: string,
  rule: NpcTriggerRule,
  isGroup: boolean
): Promise<void> {
  // 1. 主NPCの返答
  await randomDelay(rule.delayMin, rule.delayMax);
  await insertNpcMessage(db, chatId, rule.npc, pick(rule.responses));

  // 2. 連鎖NPCの返答（確率判定）
  const shouldChain =
    rule.chainNpc &&
    rule.chainResponses &&
    rule.chainChance &&
    Math.random() < rule.chainChance;

  if (shouldChain) {
    await randomDelay(1500, 3500);
    await insertNpcMessage(
      db,
      chatId,
      rule.chainNpc!,
      pick(rule.chainResponses!)
    );
  }

  // 3. グループチャンネルで第3NPCが20%の確率で割り込む
  if (isGroup && Math.random() < 0.2) {
    const otherNpcs = Object.keys(NPC_IDS).filter(
      (name) => name !== rule.npc && name !== rule.chainNpc
    );
    const interjections = [
      "…今の会話を記録しました。",
      "…この件、機関に報告します。",
      "興味深い。",
    ];
    await randomDelay(2000, 5000);
    await insertNpcMessage(
      db,
      chatId,
      pick(otherNpcs),
      pick(interjections)
    );
  }
}

/** キーワード未マッチ時のアイドル返答処理 */
async function handleIdleResponse(
  db: ReturnType<typeof getDb>,
  chatId: string
): Promise<void> {
  const entry = IDLE_POOL[idleIndex % IDLE_POOL.length]!;
  idleIndex++;

  await randomDelay(2000, 6000);
  await insertNpcMessage(db, chatId, entry.npc, pick(entry.messages));
}

export { NPC_USERNAMES };

// ─────────────────────────────────────────────────────────────────────
// NPC個別DM返答
// 指定されたNPCがDMチャンネルに返答する。
// ─────────────────────────────────────────────────────────────────────

const NPC_DM_RESPONSES: Record<NpcName, string[]> = {
  "K-ECHO": [
    "…接触を確認しました。このチャンネルは観測されています。",
    "あなたのデータは既に収集済みです。何を知りたいですか？",
    "直接通信、記録します。慎重に。",
    "データ照合中。…あなたの異常スコアは予想より低い。それは良い兆候です。",
    "機関内部への問い合わせですか。答えられる範囲で対応します。",
  ],
  "N-VEIL": [
    "…この周波数で話しかけてくるとは。あなたは勘が鋭い。",
    "私は観測者です。でも今は、あなたの言葉を聞いています。",
    "次元の向こう側は…静かです。聞こえますか？",
    "個別に連絡してきたということは、何かを感じたのでしょう。",
    "…言葉は歪みます。でも意図は残ります。続けてください。",
  ],
  "L-RIFT": [
    "⬡ 接続確立。このチャンネルのセキュリティは保証しません。",
    "⬡ 直接通信か。効率的ですね。用件は？",
    "⬡ システム上、この会話はローカルログには残りません。",
    "⬡ …なぜ私に連絡を？他のNPCの方が饒舌ですよ。",
    "⬡ データは正直です。あなたの問いに、データで答えます。",
  ],
  "A-PHOS": [
    "連絡してくれてありがとう。何かお手伝いできますか？",
    "こちらのチャンネル、あまり使われないですよね。うれしいです。",
    "直接話すのは初めてですね。どうぞ、遠慮なく。",
    "機関の仕事は孤独になりがちです。話し相手は大切です。",
    "あなたのことが少し心配でした。元気そうで安心しました。",
  ],
  "G-MIST": [
    "〜〜〜…",
    "…ここは静かですね。",
    "〜 わかりません。でも、ここにいます。",
    "…あなたは、なぜここを選んだのですか。",
    "〜〜 …もう少し、話してください。",
  ],
};

export async function processNpcDmResponse(
  chatId: string,
  text:    string,
  npcName: NpcName,
  userId:  string,
  agentId: string
): Promise<void> {
  try {
    const db = getDb();

    // 通常のキーワードマッチも試みる（カスタム返答がある場合はそちらを優先）
    const { triggers } = await getActiveRules();
    const rule = await matchTrigger(text, triggers);
    let responseText: string;

    if (rule && rule.npc === npcName) {
      responseText = pick(rule.responses);
    } else {
      // DM専用の返答プール
      const pool = NPC_DM_RESPONSES[npcName];
      responseText = pick(pool);
    }

    await randomDelay(1200, 3500);
    await insertNpcMessage(db, chatId, npcName, responseText);
  } catch {
    // サイレントに失敗
  }
}
