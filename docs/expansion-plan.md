# 海蝕機関 ARG — プロジェクト拡張計画

> 作成日: 2026-03-23  
> 現状スナップショット: `area_r_updated.zip`  
> ステータス: 計画書 v1.0

---

## 現状サマリー

### 実装済み

| カテゴリ | 内容 |
|---------|------|
| **認証** | JWT / ログイン / 登録 / パスワードリセット（EmailJS） |
| **ページ** | dashboard / missions / skill-tree / cipher / codex / novel / map / npc-dm / bulletin / events / statistics / history / achievements / notifications / division-transfer / personnel / entities / discovered / classified / settings / profile / search / console |
| **タグシステム** | 32種類（NovelRenderer）/ モーダル 5種 / ARG演出タグ 7種 |
| **DB テーブル** | 48テーブル（新規 v5 追加分 8本含む） |
| **API** | 公開 50本以上 / 管理者 30本以上 |
| **管理者画面** | 29ページ（users / xp / npc-engine / publish-queue 等） |
| **ARG エンジン** | NPC エンジン / ストーリートリガー / ルールエンジン / イベントスケジューラー |

### 未実装・不完全

| 種別 | 項目 |
|------|------|
| 管理者画面 | `/admin/world-data`（v5新テーブル8本のUI） |
| コンテンツ | SIGMA メッセージ（`sigma_messages` テーブル・タグ） |
| コンテンツ | 新テーブル8本の実データ（`area13/` JSONに相当するもの） |
| `kaishoku_content_request_format.md` | v5新テーブル向けの依頼フォーマット未記載 |

---

## Phase A — 管理者UI 完成（優先度: 高）

### A-1. `/admin/world-data` — 世界観データ統合管理ページ

v5で追加した8テーブルをタブ切替で一括管理する管理者ページ。

**タブ構成：**

| タブ | テーブル | 主要フィールド |
|------|---------|--------------|
| 観測地点 | `observation_points` | LOC- / RIFT- / 座標 / GSI / ステータス |
| 観測ログ | `observation_logs` | GSI- / SIG- / SCAN- / 種別 / 深刻度 |
| 次元裂孔 | `dimension_cracks` | CRK- / ステータス / 出現実体 |
| 機関員メモ | `agent_memos` | MEMO- / 著者 / 本文 / 遺留品状態 |
| 事案記録 | `case_reports` | CASE-IR- / 日付 / 部門 / 被害 |
| 作戦記録 | `operation_records` | OP- / コードネーム / 結果 |
| 封印プロトコル | `containment_protocols` | PROTO- / 手順 JSON |
| 研究仮説 | `research_theories` | THEORY- / 信頼度 / 証拠 JSON |

**実装方針：** `/admin/audio/page.tsx` のパターンを踏襲。タブ間で共通の一覧・編集フォームコンポーネントを使い回す。

---

### A-2. SIGMA メッセージ管理

```
新規テーブル: sigma_messages
管理ページ:  /admin/sigma-messages
公開API:     /api/sigma-messages
管理API:     /api/admin/sigma-messages（CRUD）
NovelRenderer: [[SIGMA-MSG-007]] タグ
```

タグ表示: `◎ SIGMA TRANSMISSION #007` / 薄い紫色 / CLR LV1 以上  
モーダル: 受信日時・整合性（%）・伝達経路・本文（断片的・哲学的）

---

## Phase B — コンテンツ充実（優先度: 高）

### B-1. `kaishoku_content_request_format.md` の拡充

v5新テーブル向けの依頼フォーマットを追記。AIに発注できる形に整える。

追記すべきセクション：
- §8: 観測地点（LOC- / RIFT-）
- §9: 観測ログ（GSI- / SIG- / SCAN-）
- §10: 次元裂孔（CRK-）
- §11: 機関員メモ（MEMO-）
- §12: 事案記録（CASE-IR-）
- §13: 作戦記録（OP-）
- §14: 封印プロトコル（PROTO-）
- §15: 研究仮説（THEORY-）
- §16: SIGMA メッセージ

### B-2. 既存コンテンツの拡充目標

| データ | 現状 | 目標 |
|--------|------|------|
| 小説（DIARY-） | 8件 | 20件（DIARY-009〜020） |
| エンティティ | 20件 | 30件（E-021〜030） |
| ミッション | 9件 | 20件 |
| パズル | 3件 | 10件 |
| インシデント | 9件 | 20件（大分県全市町村カバー） |
| ARGキーワード | 11件 | 30件 |
| NPC トリガー | 約20ルール | 50ルール |
| 観測地点 | サンプル3件 | 全観測点 15件 |
| 次元裂孔 | サンプル1件 | 主要裂孔 8件 |
| 事案記録 | サンプル1件 | IR-001〜040 |

---

## Phase C — ゲームプレイ改善（優先度: 中）

### C-1. マップページの強化 `/map`

現状は `MapClient` の基本実装のみ。

**追加したい機能：**
- `observation_points` テーブルとの連動（LOC- / RIFT- をピンで表示）
- `dimension_cracks` のオーバーレイ（裂孔の広がりを視覚化）
- インシデントピンクリックで `INC-` タグモーダルを呼び出す
- クリアランスに応じた情報開示（LV0: インシデントのみ、LV2: 裂孔も表示）

### C-2. 検索ページの強化 `/search`

現状は `SearchClient` の最小実装。

**追加したい機能：**
- 全32タグ種別を横断検索
- クリアランスフィルタ
- 種別フィルタ（エンティティのみ、人事のみ等）
- 検索結果からそのままタグモーダルを開く

### C-3. コンソールページ `/console` の拡張

現状: コマンド入力インタフェース実装済み。

**追加コマンド案：**

```
scan [location_id]    — 観測地点のリアルタイムGSI値表示
query [entity_id]     — エンティティ詳細照会
decrypt [puzzle_slug] — 暗号ページへのショートカット
status                — 機関全体のGSIサマリー
whoami                — 自分のエージェント情報
```

### C-4. discovered ページ `/discovered` の拡張

現状: 発見済みコンテンツ一覧。

タグクリックで直接モーダルが開く「発見済みタグライブラリ」として機能させる。32タグ全種別でのフィルタリングを追加。

---

## Phase D — ARG システム深化（優先度: 中）

### D-1. フェーズ進行システムの可視化

`PHASE-N` タグとゲーム内の実際のフェーズ進行を連動させる。

```
story_variables テーブル: current_phase = "1" | "2" | "3"
```

管理者が `current_phase` を変更すると：
- ダッシュボードのフェーズバナーが更新
- クリアランス LV2 以上にブロードキャスト通知
- `PHASE-N` タグの色・テキストが現在フェーズを強調

### D-2. SIGMAメッセージシステム

`[[SIGMA-MSG-007]]` タグ + 管理者からの時限配信。

- `publish_queue` テーブルと連動（`content_type = 'sigma'`）
- 特定フラグ到達ユーザーにのみ表示（`flag_key: 'sigma_contact'`）
- CLR LV3 以上で本文完全開示・LV1-2 は部分伏字

### D-3. 次元裂孔リアルタイムGSIシステム

`dimension_cracks.gsi_peak` と `observation_logs` を連携させ、管理者がGSI値を更新するとマップ・コンソール・ダッシュボードに反映。

```
Vercel Cron（毎時）: cracks のGSI値に微小変動を加算
→ GSI 8.0σ 超過で自動アラート通知
→ 管理者画面で「事案に昇格」ボタン
```

### D-4. ARG実績・進捗の連動強化

既存の `achievements` と新テーブルを紐付ける。

| 実績 | トリガー |
|------|---------|
| 「裂孔観測者」 | CRK-001 タグをクリック |
| 「記録発掘者」 | MEMO- タグを5件閲覧 |
| 「事案解析官」 | CASE-IR- タグを3件閲覧 |
| 「SIGMA接触記録」 | SIGMA-MSG タグをすべて閲覧 |

---

## Phase E — 技術的改善（優先度: 低〜中）

### E-1. `NovelRenderer` のパフォーマンス最適化

現状、`dbCacheStore` が 19エンドポイントを並列フェッチしており、初回表示が重い。

**対策案：**
- `fetchAll()` を Lazy に分割（コアデータ / 新テーブル / 静的データ）
- 新テーブル8本は `/novel` ページ初回アクセス時のみフェッチ（`status: "idle"` → `"deferred_ready"` 状態追加）
- 管理者更新後の `invalidate()` 活用を徹底

### E-2. admin/world-data のリアルタイムプレビュー

本文・ステップ JSON・証拠 JSON を入力しながら、右ペインでタグのインライン表示をプレビューできる機能。`NovelRenderer` をそのままプレビューコンポーネントとして埋め込む。

### E-3. タグ記法のオートコンプリート

`/admin/novel` と `/admin/content` のテキストエリアで `[[` を入力すると補完候補が出る仕組み。`dbCacheStore` のデータを使うため追加APIなしで実装可能。

---

## 優先実装ロードマップ

```
即時（〜1週間）
├─ A-1: /admin/world-data ページ実装
├─ A-2: sigma_messages テーブル・API・タグ
└─ B-1: content_request_format.md 拡充

短期（〜1ヶ月）
├─ B-2: 各テーブルのコンテンツ充実（AI発注）
├─ C-1: マップ × 新テーブル連動
└─ D-1: フェーズ進行システム可視化

中期（〜3ヶ月）
├─ C-2: 検索強化
├─ C-3: コンソールコマンド拡張
├─ D-2: SIGMAメッセージ時限配信
└─ D-4: 実績連動

長期
├─ D-3: GSIリアルタイムシステム
├─ E-1: パフォーマンス最適化
└─ E-2/E-3: 管理者UX改善
```

---

## 技術的負債メモ

| 項目 | 内容 |
|------|------|
| `NovelRenderer` の `CORRUPTED` バッジ | `Math.random()` を使用しているためSSR/CSRで差異が出る可能性。シードベース生成に変更推奨 |
| `skill-tree/data.ts` | スキルデータが静的TS配列。件数が増えたら DB 移行を検討 |
| `npc-engine.ts` の `TRIGGER_RULES` | 静的配列。`npc_engine_rules` テーブル（動的）と二重管理になっている部分を整理 |
| `area13/` JSONデータ | モジュール・エンティティが JSON ファイル管理。DB の `db_entities` / `db_equipment` テーブルへの移行が望ましい |
| `agent-memos` API | 一覧取得エンドポイントが未実装（`?id=` 単一取得のみ）。管理者画面の実装時に追加 |

---

*以上 — 海蝕機関 ARG 拡張計画 v1.0*
