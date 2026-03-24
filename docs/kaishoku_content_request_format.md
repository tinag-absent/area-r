# 海蝕機関 ARG — コンテンツ拡充依頼フォーマット

このドキュメントは、海蝕機関 ARG サイトのコンテンツを AI に追加・拡充してもらう際の依頼フォーマット定義です。

---

## プロジェクト概要（毎回依頼の冒頭に添付する）

```
【世界観サマリー】
「海蝕機関」は、階宙次元からの次元侵食（海蝕現象）を観測・収束する秘密組織。
機関員はKコードのIDを持ち、収束部門・観測部門・技術部門・記録部門・封印部門の
いずれかに所属する。実体（エンティティ）と呼ばれる異次元存在が脅威となる。
GSI（次元安定指数）が高いほど危険度が高い。モジュール（M-XXX-ギリシャ文字）は
実体への対処装備。トーン：硬派・機密文書風・日本語。
```

---

## 1. ミッション（`missions` テーブル）

### スキーマ

```sql
id               TEXT  -- 例: MISSION-2026-010
title            TEXT  -- 日本語タイトル
description      TEXT  -- 200字程度。entity/gsi/notesを末尾に付記
category         TEXT  -- "critical" | "standard" | "support"
status           TEXT  -- "active" | "monitoring" | "completed"
required_level   INT   -- 0〜5
xp_reward        INT   -- critical:300 / standard:150 / support:75
phase            INT   -- 1〜3
assigned_division TEXT -- "DIV-01"〜"DIV-05"
issued_by        TEXT  -- 部門名（例: 収束部門 第2班）
issued_at        TEXT  -- "YYYY-MM-DD HH:MM"
deadline_at      TEXT  -- nullable
```

### 部門IDと名称の対応

| ID | 名称 |
|---|---|
| DIV-01 | 観測部門 |
| DIV-02 | 収束部門 |
| DIV-03 | 記録部門 |
| DIV-04 | 技術部門 |
| DIV-05 | 封印部門 |

### 依頼フォーマット

```
以下のJSONを生成してください。海蝕機関ARGのミッションデータです。
既存ID（MISSION-2026-001〜009、MISSION-2025-347）と重複しないこと。

条件:
- 件数: ○件
- category の内訳: critical ○件 / standard ○件 / support ○件
- 舞台: （例: 東北地方の海岸線）
- フェーズ: （例: 2）

出力形式（JSON配列）:
[
  {
    "id": "MISSION-2026-010",
    "title": "...",
    "description": "...  関連実体: E-XXX（名称）  GSI: X.X  備考: ...",
    "category": "critical",
    "status": "active",
    "required_level": 2,
    "xp_reward": 300,
    "phase": 2,
    "assigned_division": "DIV-02",
    "issued_by": "収束部門 第1班",
    "issued_at": "2026-02-10 09:00",
    "deadline_at": null
  }
]
```

---

## 2. エンティティ（`scripts/area13/entities-data.json`）

### スキーマ

```json
{
  "id":            "ent-021",
  "code":          "E-021",
  "name":          "...",
  "classification":"safe | caution | danger | classified",
  "description":   "一文で説明",
  "threat":        "低 | 中 | 高",
  "intelligence":  "なし | 低 | 中 | 高",
  "origin":        "階宙次元・○○領域",
  "appearance":    "外見の説明",
  "behavior":      "行動パターン",
  "containment":   "収容・無力化方法"
}
```

### 分類の目安

| classification | 意味 | threat |
|---|---|---|
| safe | 敵対的でない | 低 |
| caution | 条件付き危険 | 中 |
| danger | 即時脅威 | 高 |
| classified | LV3未満には伏字表示 | — |

### 依頼フォーマット

```
海蝕機関ARGのエンティティデータを生成してください。
既存コード E-001〜E-020 と重複しないこと。

条件:
- 件数: ○件
- classification の内訳: safe ○件 / caution ○件 / danger ○件 / classified ○件
- テーマ: （例: 音・振動に関連した実体）

出力形式（JSON配列）:
[
  {
    "id": "ent-021",
    "code": "E-021",
    "name": "...",
    "classification": "caution",
    "description": "...",
    "threat": "中",
    "intelligence": "低",
    "origin": "階宙次元・境界領域",
    "appearance": "...",
    "behavior": "...",
    "containment": "..."
  }
]
```

---

## 3. モジュール（`scripts/area13/modules-data.json`）

### スキーマ

```json
{
  "id":             "mod-021",
  "code":           "M-021-φ",
  "name":           "...",
  "classification": "safe | caution | danger | classified",
  "description":    "一文で機能説明",
  "range":          "半径Xm",
  "duration":       "X分 or 瞬間",
  "energy":         "低 | 中 | 高 | 超高 | 極高",
  "developer":      "技術部門",
  "details":        "詳細な動作説明",
  "warning":        "使用上の注意"
}
```

### コードの命名規則

`M-XXX-ギリシャ文字`。既存は M-001-α 〜 M-020-υ（α〜υの20文字）。
次からは φ（021）、χ（022）、ψ（023）、ω（024）の順。

### 依頼フォーマット

```
海蝕機関ARGの収束モジュールデータを生成してください。
既存コード M-001-α〜M-020-υ と重複しないこと。

条件:
- 件数: ○件（M-021-φ から連番）
- テーマ: （例: 索敵・偵察系）

出力形式（JSON配列）:
[
  {
    "id": "mod-021",
    "code": "M-021-φ",
    "name": "...",
    "classification": "safe",
    "description": "...",
    "range": "半径30m",
    "duration": "10分",
    "energy": "低",
    "developer": "技術部門",
    "details": "...",
    "warning": "..."
  }
]
```

---

## 4. ARGキーワード（`rule_engine_entries` テーブル、`type='arg_keyword'`）

### スキーマ（data_json の中身）

```json
{
  "keyword":  "...",
  "phase":    "1 | 2 | 3",
  "severity": "low | medium | high | critical",
  "source":   "story",
  "note":     "NPCが反応する文脈の説明"
}
```

### フェーズと重大度の関係

| phase | severity の目安 | 用途 |
|---|---|---|
| 1 | low〜medium | 初期ストーリーで自然に登場する言葉 |
| 2 | medium〜high | 中盤で意味が明かされるキーワード |
| 3 | high〜critical | 核心に触れる禁断ワード |

### 既存キーワード（重複不可）

`海は削れている` / `海蝕プロジェクト` / `収束` / `西堂` / `次元` / `監視されている` / `封印` / `観測者は存在しない` / `記憶` / `境界` / `消滅`

### 依頼フォーマット

```
海蝕機関ARGのARGキーワードを生成してください。
チャットでこのワードを発言するとNPCが反応します。

条件:
- 件数: ○件
- phase の内訳: phase1 ○件 / phase2 ○件 / phase3 ○件
- テーマ: （例: 時間・記憶の喪失に関するワード）
- 既存ワードとの重複なし

出力形式（JSON配列）:
[
  {
    "keyword":  "時層崩壊",
    "phase":    "2",
    "severity": "high",
    "source":   "story",
    "note":     "時層粉が大量堆積し次元の時間軸が崩れる現象。L-RIFTが反応する。"
  }
]
```

---

## 5. NPC台詞・トリガールール（`src/lib/npc-engine.ts`）

### NPCキャラクター一覧

| ID | 名前 | 個性 | 担当テーマ |
|---|---|---|---|
| K-ECHO | K-ECHO | 冷静・分析的・短文 | 次元物理、収束技術 |
| N-VEIL | N-VEIL | 謎めいた・哲学的・長文 | 真実、観測者、存在論 |
| L-RIFT | L-RIFT | 技術者・簡潔・専門用語多め | モジュール、エンジニアリング |
| A-PHOS | A-PHOS | 温かい・気遣い・励まし | 機関員のケア、日常 |
| G-MIST | G-MIST | 不穏・曖昧・意味深 | 隠された真実、不信 |

### トリガールールのデータ構造

```typescript
// src/lib/npc-engine.ts の TRIGGER_RULES に追加する形式（NpcTriggerRule 型）
{
  keywords:       ["キーワード1", "キーワード2"],  // どれか含まれたら発火
  npc:            "K-ECHO",                        // 応答するNPC
  responses:      ["応答テキストA", "応答テキストB"],  // ランダム選択
  // オプション: 連鎖反応（確率で別NPCが追加発言）
  chainNpc?:      "L-RIFT",
  chainChance?:   0.4,            // 0〜1 の確率
  chainResponses?: ["連鎖テキスト"],
  delayMin:       1500,           // 応答までの最短遅延（ms）
  delayMax:       4000,           // 応答までの最長遅延（ms）
}
```

### 依頼フォーマット

```
海蝕機関ARGのNPCトリガールールを生成してください。

条件:
- 件数: ○件
- 対象NPC: （例: K-ECHO と G-MIST を中心に）
- テーマ: （例: フェーズ2の時空歪曲関連キーワードへの反応）
- トーン: 各NPCの個性に従うこと（上記一覧参照）

出力形式（TypeScript配列リテラル、TRIGGER_RULESに追記できる形）:
[
  {
    keywords: ["時層崩壊", "時間が歪む"],
    npc: "K-ECHO",
    responses: ["時層崩壊の観測データを確認した。T-3地点のGSI値が急上昇している。"],
    delayMin: 1200,
    delayMax: 3500,
  },
  {
    keywords: ["忘れた", "記憶がない"],
    npc: "G-MIST",
    responses: ["…忘れた、か。それとも、最初から知らなかったのか。"],
    chainNpc: "N-VEIL",
    chainChance: 0.3,
    chainResponses: ["…その問いは、答えを持っていない。"],
    delayMin: 3000,
    delayMax: 7000,
  },
]
```

---

## 6. 機関員の日記（`src/app/(app)/novel/data.ts`）

### スキーマ

> **注意**: `novel_documents` テーブルで DB 管理される。`src/app/(app)/novel/data.ts` は静的データを参照するが、管理者画面（`/admin/novel`）から DB を更新するとそちらが優先される。

```typescript
interface NovelDocument {
  id:        string;    // "doc-XXX"
  title:     string;
  author:    string;    // 機関員ID（例: K-042-118）
  date:      string;    // "YYYY-MM-DD"
  clearance: number;    // 閲覧に必要なLV（0〜5）
  tags:      string[];  // ["phase1", "収束部門", ...]
  content:   string;    // マークダウン。[[E-002]] で実体リンク、[[REDACTED]] で伏字
}
```

### content 記法

| 記法 | 表示 |
|---|---|
| `[[E-002]]` | 実体 E-002 へのリンク（クリック可） |
| `[[REDACTED]]` | ████████（伏字ボックス） |
| `[[REDACTED:理由]]` | 同上（理由はツールチップに表示） |

### 依頼フォーマット

```
海蝕機関ARGの「機関員の日記」エントリを生成してください。

条件:
- 件数: ○件
- clearance レベル: （例: LV0が2件・LV2が1件・LV3が1件）
- 時期: （例: 2026年2月、フェーズ1〜2の転換期）
- 視点となる機関員: （例: 収束部門の若手、記録部門のベテラン）
- [[REDACTED]] を各エントリに1〜3箇所含める
- 文体: 一人称、私的メモ風、機関用語を自然に使う

出力形式（TypeScript配列リテラル）:
[
  {
    id: "doc-010",
    title: "東京湾第三次収束作戦の記録",
    author: "K-042-118",
    date: "2026-02-06",
    clearance: 0,
    tags: ["phase2", "収束部門", "wave-eater"],
    content: `今日の作戦は予想以上に難航した。\n\n[[E-002]]が3体同時に出現するなど前例がない。...\n\n上層部は[[REDACTED]]について口を閉ざしている。`
  }
]
```

---

## 7. インシデントマップデータ（`public/data/area-incidents.json`）

### スキーマ

```json
{
  "id":       "area-010",
  "severity": "critical | warning | safe",
  "status":   "対応中 | 監視中 | 収束済み | 観察中",
  "name":     "インシデント名",
  "lon":      131.641,
  "lat":      33.218,
  "location": "場所の説明",
  "entity":   "E-XXX（名称）複数体 など",
  "gsi":      12.4,
  "division": "部門名",
  "desc":     "説明文（100字程度）",
  "time":     "2026-02-XX XX:XX"
}
```

> **注意**: `lon`/`lat` は大分県内の座標（lon: 130.8〜132.2、lat: 32.7〜33.7）を使うこと。回転変換はseedスクリプトが自動適用するため、実際の地理座標で入力してよい。

### 依頼フォーマット

```
海蝕機関ARGの大分県インシデントデータを生成してください。
既存ID area-001〜area-009 と重複しないこと。

条件:
- 件数: ○件
- severity の内訳: critical ○件 / warning ○件 / safe ○件
- 舞台となる市町村: （例: 竹田市・豊後大野市・日田市）
- 大分県内の実際の地名・座標を使うこと

出力形式（JSON配列）:
[
  {
    "id": "area-010",
    "severity": "warning",
    "status": "監視中",
    "name": "竹田市久住高原時空薄化",
    "lon": 131.30,
    "lat": 33.08,
    "location": "久住高原東麓",
    "entity": "なし（自然発生）",
    "gsi": 3.1,
    "division": "観測部門",
    "desc": "久住高原東麓で次元境界の局所的な薄化を検知。現在は安定しているが定期観測を継続。",
    "time": "2026-02-12 14:00"
  }
]
```

---

## 共通注意事項

- **JSONはコードブロック内**に出力してもらう（パース用）
- **既存IDとの重複チェック**を依頼文に明記する
- 世界観の一貫性のため、**プロジェクト概要サマリーを毎回冒頭に添付**する
- 生成後は `seed-from-area13.mjs` か各データファイルに直接追記してDBに反映する

---

## 8. 観測地点（`observation_points` テーブル）

### スキーマ

```sql
id            TEXT  -- LOC-OIT-001 / RIFT-α7
type          TEXT  -- 'location' | 'rift_point'
name          TEXT  -- 観測基地アルファ / 観測点α-7
name_short    TEXT  -- α基地 / α-7
lon / lat     REAL  -- 大分県内座標
city_code     TEXT  -- 44201 等
status        TEXT  -- active / monitoring / critical / abandoned / classified
clearance_req INT   -- 0–5
gsi_current   REAL  -- 現在GSI値（nullable）
description   TEXT
```

### 依頼フォーマット

```
海蝕機関ARGの観測地点データを生成してください。

条件:
- 件数: ○件（LOC- ○件 / RIFT- ○件）
- 場所: 大分県内（既存の大分市・別府市・日田市・国東市等）
- RIFT-（観測拠点）はギリシャ文字+数字（α7, β12等）の命名規則に従う
- LOC-（観測基地）は OIT-XXX 形式

出力形式（JSON配列）:
[
  {
    "id": "RIFT-γ3",
    "type": "rift_point",
    "name": "観測点γ-3",
    "name_short": "γ-3",
    "lon": 131.649, "lat": 33.253,
    "city_code": "44201", "city_name": "大分市",
    "status": "monitoring",
    "clearance_req": 1,
    "gsi_current": 2.4,
    "description": "..."
  }
]
```

---

## 9. 観測ログ（`observation_logs` テーブル）

### スキーマ

```sql
id            TEXT  -- GSI-RECORD-042 / SIG-DELTA / SCAN-2026-0313
type          TEXT  -- 'gsi' | 'signal' | 'scan'
title         TEXT
observed_at   TEXT  -- "YYYY-MM-DD HH:MM"
location_ref  TEXT  -- RIFT-α7 等
severity      TEXT  -- normal / elevated / critical
gsi_value     REAL  -- gsiタイプのみ
freq_band     TEXT  -- signalタイプのみ（例: 12–18kHz）
amplitude_db  REAL  -- signalタイプのみ
pattern_match TEXT  -- signalタイプのみ
scan_area     TEXT  -- scanタイプのみ
findings_json TEXT  -- scanタイプのみ（JSON配列）
description   TEXT
```

### 依頼フォーマット

```
海蝕機関ARGの観測ログデータを生成してください。

条件:
- 件数: ○件（gsi ○件 / signal ○件 / scan ○件）
- 時期: 2026年2月〜3月
- 既存観測点（RIFT-α7, RIFT-β12等）と連動させる

出力形式（JSON配列）:
[
  {
    "id": "GSI-RECORD-043",
    "type": "gsi",
    "title": "β-12 GSI上昇記録",
    "observed_at": "2026-03-10 14:22",
    "location_ref": "RIFT-β12",
    "gsi_value": 3.8,
    "gsi_baseline": 1.2,
    "severity": "elevated",
    "description": "..."
  }
]
```

---

## 10. 次元裂孔（`dimension_cracks` テーブル）

### スキーマ

```sql
id             TEXT  -- CRK-001
name           TEXT
lon / lat      REAL
location       TEXT
status         TEXT  -- forming / active / stable / sealed / collapsed
severity       TEXT  -- safe / warning / critical
gsi_peak       REAL
first_detected TEXT
sealed_at      TEXT  -- nullable
entity_emerged TEXT  -- JSON配列 ["ENT-001",...]
clearance_req  INT
description    TEXT
```

### 依頼フォーマット

```
海蝕機関ARGの次元裂孔データを生成してください。既存ID CRK-001 と重複しないこと。

条件:
- 件数: ○件
- severity の内訳: critical ○件 / warning ○件 / safe ○件
- 大分県内の実際の地名を使うこと

出力形式（JSON配列）:
[
  {
    "id": "CRK-002",
    "name": "由布岳南麓裂孔",
    "lon": 131.390, "lat": 33.284,
    "location": "由布岳南麓",
    "status": "active",
    "severity": "warning",
    "gsi_peak": 5.3,
    "first_detected": "2026-02-20",
    "sealed_at": null,
    "entity_emerged": ["ENT-003"],
    "clearance_req": 2,
    "description": "..."
  }
]
```

---

## 11. 機関員メモ（`agent_memos` テーブル）

### スキーマ

```sql
id           TEXT  -- MEMO-K17-001
title        TEXT
author_ref   TEXT  -- AGT-K17 等
location_ref TEXT  -- RIFT-β12 等（nullable）
written_at   TEXT  -- 執筆日時
found_at     TEXT  -- 発見日時（nullable）
found_by     TEXT  -- 発見者 AGT-ID（nullable）
status       TEXT  -- recovered / partial / corrupted / classified
clearance_req INT
content      TEXT  -- メモ本文
tags_json    TEXT  -- JSON配列 ["ENT-001","CRK-001"]
```

### 依頼フォーマット

```
海蝕機関ARGの機関員メモ（遺留品）を生成してください。

条件:
- 件数: ○件
- 著者: 失踪・行方不明の機関員（例: K-17）
- 本文トーン: 緊迫した一人称・断片的・機関用語を自然に使う
- [[REDACTED]] を各メモに1〜2箇所含める

出力形式（JSON配列）:
[
  {
    "id": "MEMO-K17-002",
    "title": "β-12への単独調査記録",
    "author_ref": "AGT-K17",
    "location_ref": "RIFT-β12",
    "written_at": "2026-03-12 23:40",
    "found_at": "2026-03-14 09:15",
    "found_by": "K-ARZ",
    "status": "partial",
    "clearance_req": 2,
    "content": "...",
    "tags_json": ["CRK-001","ENT-001"]
  }
]
```

---

## 12. 事案記録（`case_reports` テーブル）

### スキーマ

```sql
id              TEXT  -- CASE-IR-031
title           TEXT
case_date       TEXT  -- 発生日
closed_date     TEXT  -- nullable
status          TEXT  -- open / closed / classified / pending
division_ref    TEXT  -- DIV-02 等
personnel_json  TEXT  -- JSON配列 ["AGT-K17",...]
entity_ref      TEXT  -- nullable
location_ref    TEXT  -- nullable
casualties      INT   -- 被害者数
clearance_req   INT
summary         TEXT  -- 短い概要
full_report     TEXT  -- 高CLR帯の詳細（nullable）
```

### IR番号の採番ルール

既存: IR-031（最新）。次から IR-032〜。

### 依頼フォーマット

```
海蝕機関ARGの事案記録（インシデントレポート）を生成してください。
既存 IR-031 より古い過去の事案として生成する（IR-001〜030の範囲）。

条件:
- 件数: ○件
- status の内訳: closed ○件 / classified ○件
- 時期: 2022年〜2025年（機関の歴史上の出来事）

出力形式（JSON配列）:
[
  {
    "id": "CASE-IR-015",
    "title": "姫島境界ゲート初出現事案",
    "case_date": "2023-08-14",
    "closed_date": "2023-09-02",
    "status": "closed",
    "division_ref": "DIV-01",
    "personnel_json": ["AGT-L5"],
    "entity_ref": null,
    "location_ref": null,
    "casualties": 0,
    "clearance_req": 1,
    "summary": "...",
    "full_report": null
  }
]
```

---

## 13. 作戦記録（`operation_records` テーブル）

### スキーマ

```sql
id            TEXT  -- OP-NIGHTFALL
codename      TEXT  -- NIGHTFALL
title         TEXT  -- 正式名称
op_date       TEXT
end_date      TEXT  -- nullable
status        TEXT  -- planned / active / completed / aborted / classified
division_json TEXT  -- JSON配列 ["DIV-02","DIV-05"]
commander_ref TEXT  -- nullable
target_ref    TEXT  -- nullable
location_ref  TEXT  -- nullable
outcome       TEXT  -- success / partial / failure / classified
clearance_req INT
description   TEXT
casualties    INT
```

### コードネーム命名規則

英単語1語（大文字）+ 自然現象・地理・神話から取る。例: NIGHTFALL / DEEPWATER / AURORA

### 依頼フォーマット

```
海蝕機関ARGの作戦記録を生成してください。

条件:
- 件数: ○件（active ○件 / completed ○件 / classified ○件）
- 収束部門・封印部門主導の作戦を中心に

出力形式（JSON配列）:
[
  {
    "id": "OP-AURORA",
    "codename": "AURORA",
    "title": "AURORA作戦 — 国東半島一斉収束",
    "op_date": "2026-02-08",
    "end_date": "2026-02-09",
    "status": "completed",
    "division_json": ["DIV-02"],
    "commander_ref": "AGT-L5",
    "target_ref": "CRK-001",
    "location_ref": "LOC-OIT-001",
    "outcome": "success",
    "clearance_req": 1,
    "description": "...",
    "casualties": 0
  }
]
```

---

## 14. 封印プロトコル（`containment_protocols` テーブル）

### スキーマ

```sql
id            TEXT  -- PROTO-OMEGA
codename      TEXT  -- OMEGA（ギリシャ文字推奨）
title         TEXT
division_ref  TEXT  -- DIV-05 推奨
status        TEXT  -- draft / active / deprecated / classified
threat_class  TEXT  -- 対象脅威クラス
clearance_req INT
summary       TEXT
steps_json    TEXT  -- JSON配列 [{step:N, title:"...", desc:"..."}]
warnings      TEXT  -- nullable
```

### 依頼フォーマット

```
海蝕機関ARGの封印プロトコルを生成してください。
既存 PROTO-OMEGA（LV3）と重複しないこと。

条件:
- 件数: ○件
- 対象: 異なる脅威クラス（実体の規模・裂孔の種別等）

出力形式（JSON配列）:
[
  {
    "id": "PROTO-DELTA",
    "codename": "DELTA",
    "title": "Δプロトコル — 小型実体標準収容手順",
    "division_ref": "DIV-05",
    "status": "active",
    "threat_class": "小型実体 / GSI 3.0σ未満",
    "clearance_req": 1,
    "summary": "...",
    "steps_json": [{"step":1,"title":"初動","desc":"..."}],
    "warnings": null
  }
]
```

---

## 15. 研究仮説（`research_theories` テーブル）

### スキーマ

```sql
id             TEXT  -- THEORY-009
title          TEXT
author_ref     TEXT  -- nullable
division_ref   TEXT  -- DIV-03 推奨
proposed_at    TEXT
status         TEXT  -- proposed / under_review / accepted / refuted / classified
confidence     INT   -- 0–100%
clearance_req  INT
abstract       TEXT
evidence_json  TEXT  -- JSON配列 [{type:"...", ref:"...", desc:"..."}]
related_json   TEXT  -- JSON配列 ["ENT-002","CRK-001"]
```

### 依頼フォーマット

```
海蝕機関ARGの研究仮説を生成してください。既存 THEORY-009 と重複しないこと。

条件:
- 件数: ○件
- テーマ: 海蝕現象の原因・実体の知性・次元構造に関する仮説

出力形式（JSON配列）:
[
  {
    "id": "THEORY-010",
    "title": "次元境界周期崩壊説",
    "author_ref": "AGT-ARZ",
    "division_ref": "DIV-03",
    "proposed_at": "2026-03-01",
    "status": "proposed",
    "confidence": 38,
    "clearance_req": 1,
    "abstract": "...",
    "evidence_json": [{"type":"observation","ref":"GSI-RECORD-042","desc":"..."}],
    "related_json": ["ENT-002","THEORY-009"]
  }
]
```

---

## 16. SIGMAメッセージ（`sigma_messages` テーブル）

### スキーマ

```sql
id            TEXT  -- SIGMA-MSG-007
number        INT   -- 7
received_at   TEXT  -- "YYYY-MM-DD HH:MM"
medium        TEXT  -- "N-VEIL 通信補助体経由"
integrity     INT   -- 0–100%（<100で一部伏字）
clearance_req INT   -- 最低1
content       TEXT  -- 本文（断片的・哲学的）
context_ref   TEXT  -- nullable（関連する小説ID等）
```

### トーンガイド

SIGMAのメッセージは以下の特徴を持つ：
- 次元の外側から観測者視点で書かれている
- 哲学的・詩的・断片的
- 機関員に直接語りかけることがある
- 時制が曖昧（過去・現在・未来が混在）
- `[[REDACTED]]` を適宜含む

### 依頼フォーマット

```
海蝕機関ARGのSIGMAメッセージを生成してください。
既存番号 #001〜#006 と重複しないこと（#007以降）。

条件:
- 件数: ○件（#007から連番）
- integrity の内訳: 100% ○件 / 50–90% ○件
- 関連する日記IDがある場合は context_ref に指定

出力形式（JSON配列）:
[
  {
    "id": "SIGMA-MSG-007",
    "number": 7,
    "received_at": "2026-03-13 02:17",
    "medium": "N-VEIL 通信補助体経由",
    "integrity": 71,
    "clearance_req": 1,
    "content": "...",
    "context_ref": "DIARY-007"
  }
]
```

---

## 共通注意事項（更新）

- **JSONはコードブロック内**に出力してもらう（パース用）
- **既存IDとの重複チェック**を依頼文に明記する
- 世界観の一貫性のため、**プロジェクト概要サマリーを毎回冒頭に添付**する
- タグ記法で他データを参照する場合は必ず実在するIDを使う（`ENT-001`〜`ENT-020`等）
- `clearance_req` は LV0（全員公開）〜LV5（最高機密）で設定
