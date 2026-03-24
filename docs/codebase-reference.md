# コードベース詳細リファレンス

> **プロジェクト:** 海蝕機関 ARG（area-r）
> **フレームワーク:** Next.js 16 (App Router) / TypeScript
> **DB:** Turso (libSQL / SQLite 互換)
> **認証:** JWT — HttpOnly Cookie (jose + bcryptjs)
> **状態管理:** Zustand + persist
> **最終更新:** 2026-03-23

---

## 目次

1. [ディレクトリ構成](#1-ディレクトリ構成)
2. [ライブラリ層 (`src/lib/`)](#2-ライブラリ層)
3. [ストア層 (`src/store/`)](#3-ストア層)
4. [ミドルウェア](#4-ミドルウェア)
5. [API ルート一覧](#5-api-ルート一覧)
6. [ページ一覧](#6-ページ一覧)
7. [タグシステム（NovelRenderer）](#7-タグシステム)
8. [DBスキーマ概要](#8-dbスキーマ概要)
9. [ARG エンジン群](#9-argエンジン群)
10. [よくある落とし穴](#10-よくある落とし穴)

---

## 1. ディレクトリ構成

```
area-r-main/
├── src/
│   ├── actions/                    # Server Actions
│   │   └── loginBonus.ts
│   ├── app/
│   │   ├── (app)/                  # 認証済みユーザー向け（middleware で保護）
│   │   │   ├── admin/              # 管理画面 32 ページ
│   │   │   │   ├── world-data/     # 世界観データ統合管理（v5）
│   │   │   │   ├── sigma-messages/ # SIGMAメッセージ管理（v5）
│   │   │   │   ├── audio/          # 音声記録管理
│   │   │   │   └── ...（29 ページ）
│   │   │   ├── novel/
│   │   │   │   ├── page.tsx
│   │   │   │   └── NovelRenderer.tsx  # タグシステム中核（33タグ・ARG演出9種）
│   │   │   ├── skill-tree/
│   │   │   │   ├── data.ts         # スキル静的定義（SKILLS / BRANCHES）
│   │   │   │   └── SkillTreeClient.tsx
│   │   │   └── ...（35 ページ）
│   │   ├── (auth)/                 # 未認証ページ
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── api/                    # 公開 API（59 本）
│   │   │   ├── admin/              # 管理者 CRUD API（38 本）
│   │   │   ├── auth/               # 認証系（login / logout / register 等）
│   │   │   └── users/me/           # ログインユーザー自身の操作
│   │   ├── globals.css             # CSS 変数・keyframes（glitch / pulse-dot 等）
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AudioModal.tsx      # 音声再生モーダル（AUD- タグ用）
│   │   │   ├── PageHeader.tsx
│   │   │   └── LoadingStatus.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── UserProvider.tsx
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useUnreadPolling.ts
│   ├── lib/
│   │   ├── achievements-data.ts    # 実績マスター定義（静的・クライアント共有可）
│   │   ├── achievements.ts         # 実績付与ロジック（サーバー専用）
│   │   ├── api-client.ts           # クライアント fetch ラッパー
│   │   ├── api-error.ts            # Errors.notFound / Errors.validation 等
│   │   ├── auth.ts                 # JWT 生成・検証・Cookie 操作
│   │   ├── constants.ts            # ALLOWED_CHAT_CHANNELS 等
│   │   ├── date.ts                 # 日付フォーマットユーティリティ
│   │   ├── db.ts                   # Turso クライアント・queryAll / queryOne / execute
│   │   ├── env.ts                  # 環境変数バリデーション（INTERNAL_SECRET 長さ検証）
│   │   ├── event-triggers.ts       # ストーリートリガー・フラグ・XP 付与
│   │   ├── npc-config.ts           # NPC スタイル定義（NPC_COLORS / NPC_DESCRIPTIONS 等）
│   │   ├── npc-engine.ts           # NPC 応答ロジック・トリガールール
│   │   ├── sanitize.ts             # XSS サニタイズ（HTML 除去・2 パス）
│   │   ├── server-auth.ts          # requireAuth / requireAdmin / requireSuperAdmin
│   │   └── types.ts                # 共通型定義
│   ├── middleware.ts               # 認証・CLR ゲート・CSRF・スプーフィング防止
│   └── store/
│       ├── index.ts                # Zustand メインストア（user / ui / chat）
│       └── dbCacheStore.ts         # タグ解決用 DB キャッシュ（20 フィールド・全 API 並列フェッチ）
├── scripts/
│   ├── schema.sql                  # DB スキーマ（49 テーブル）
│   ├── migrate.js                  # マイグレーション実行
│   ├── seed-from-area13.mjs        # area13 初期データシード
│   └── area13/                     # 初期 JSON データ（entities / modules 等）
├── public/
│   └── data/
│       ├── area-incidents.json     # マップインシデントデータ
│       └── rotated.geojson         # 大分県 GeoJSON（2367 フィーチャー）
└── docs/
    ├── README.md
    ├── codebase-reference.md       # このファイル
    ├── naming-convention.md
    ├── kaishoku_content_request_format.md
    ├── kaishoku_deploy_v5.ipynb
    └── security-report-v2.md
```

---

## 2. ライブラリ層

### `src/lib/db.ts`

```typescript
getDb()            // Turso クライアントシングルトン
queryAll<T>()      // SELECT 複数行
queryOne<T>()      // SELECT 単一行（nullableで返る）
execute()          // INSERT / UPDATE / DELETE
```

接続は `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` で初期化。Edge Runtime 非対応のため `middleware.ts` は Node.js Runtime を明示。

### `src/lib/server-auth.ts`

```typescript
requireAuth(req)       // → UserSession | AuthError（CLR 0 以上）
requireAdmin(req)      // → UserSession | AuthError（role: admin/super_admin）
requireSuperAdmin(req) // → UserSession | AuthError（role: super_admin のみ）
isAuthError(r)         // type guard
```

セッションは `getSessionFromCookie(req)` で JWT → DB 照合。BANされたユーザーは DB の `status` チェックで弾く。

### `src/lib/api-error.ts`

```typescript
Errors.notFound("リソース名")   // 404
Errors.validation("メッセージ") // 400
Errors.forbidden()              // 403
withErrorHandler(handler)       // try/catch ラッパー
```

### `src/lib/event-triggers.ts`

ストーリーフラグ・XP 付与・変数更新のサーバーサイドロジック。

```typescript
checkAndFireTriggers(userId, eventKey, db)
setFlag(userId, flagKey, value, db)
addXp(userId, activity, amount, db)
```

`progress_flags` テーブルと `story_variables` テーブルを操作。

### `src/lib/npc-engine.ts`

NPC 応答生成。`npc_engine_rules` テーブルの動的ルールを評価してスクリプトを選択。

```typescript
processNpcMessage(chatId, userMessage, userId, db)
```

---

## 3. ストア層

### `src/store/index.ts` — メインストア

```typescript
interface BoundState {
  user: {
    agentId:    string | null  // 表示 ID（K-ARZ 等）
    username:   string | null
    divisionId: string | null
    role:       string | null
    level:      number         // クリアランスレベル（XP 連動）
    // XP / anomalyScore はサーバーから毎回取得（localStorage に保存しない）
  }
  // ui / chat スライスも含む
}
```

`partialize` で `agentId` / `username` / `divisionId` / `role` のみ localStorage に保存。機密フィールドは保存しない。

### `src/store/dbCacheStore.ts` — タグ解決用キャッシュ

`NovelRenderer` が使用するZustand ストア。初回ロード時に 20 本の API を並列フェッチしてキャッシュ。

```typescript
interface DbCache {
  missions / facilities / entities / equipment / personnel  // 既存 DB
  divisions / incidents / modules / codex / audio           // 既存 DB
  events / puzzles                                          // 既存 API
  observation_points / observation_logs                     // v5 新テーブル
  dimension_cracks / case_reports / operation_records       // v5 新テーブル
  containment_protocols / research_theories / sigma_messages // v5 新テーブル
}

// フック
const { db, load, invalidate } = useDbCacheStore()
// db が null の間はタグカードを「LOCKED」表示でフォールバック
// invalidate(["missions"]) で特定スライスだけ再フェッチ
```

**パフォーマンス注意:** 20 本の並列フェッチは初回表示コストが高い。
将来的にコアデータ／新テーブルで分割 lazy フェッチへの移行を検討。

---

## 4. ミドルウェア

`src/middleware.ts` — マッチャーで `(app)` 配下全ページに適用。

処理順序:
1. スプーフィングヘッダー削除（`x-user-id` / `x-user-level` / `x-user-role`）
2. JWT 検証 → 失敗で `/login` リダイレクト
3. CLR ゲート（`clearance_required` に満たないページは `/forbidden`）
4. `x-user-id` / `x-user-level` / `x-user-role` をセッション値で上書きして転送
5. CSRF チェック（`X-Requested-With: XMLHttpRequest` が必須）

---

## 5. API ルート一覧

### 公開 API（59 本、認証必須）

**認証系**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `POST /api/auth/reset-by-otp`
- `GET  /api/auth/check-id`
- `POST /api/auth/secret-question`
- `POST /api/auth/tutorial-complete`

**ユーザー自身**
- `GET/PATCH /api/users/me/achievements`
- `POST      /api/users/me/achievements/check`
- `POST      /api/users/me/activity`
- `GET/POST  /api/users/me/bookmarks`
- `GET       /api/users/me/chat-history`
- `POST      /api/users/me/check-triggers`
- `POST      /api/users/me/division-transfer`
- `GET/PATCH /api/users/me/flags`
- `GET       /api/users/me/login`
- `GET       /api/users/me/notifications`
- `PATCH     /api/users/me/password`
- `GET/POST  /api/users/me/secret-question`
- `PATCH     /api/users/me/settings`
- `GET       /api/users/me/story-state`
- `POST      /api/users/me/xp`

**ゲームコンテンツ**
- `GET       /api/missions` / `GET /api/missions/[id]`
- `POST      /api/missions/[id]/apply`
- `POST      /api/missions/[id]/complete`
- `GET       /api/novel`
- `GET       /api/codex`
- `GET       /api/modules`
- `GET       /api/events`
- `GET/POST  /api/cipher`
- `GET       /api/db-data?type=facilities|entities|equipment|personnel`
- `GET       /api/divisions`
- `GET       /api/incidents`
- `GET       /api/entities` / `GET /api/entities/[code]`
- `GET       /api/personnel` / `GET /api/personnel/[code]`

**タグ解決 API（v4–v5）**
- `GET /api/audio` / `GET /api/audio?id=xxx`
- `GET /api/observation-points` / `?id=xxx`
- `GET /api/observation-logs` / `?id=xxx`
- `GET /api/dimension-cracks` / `?id=xxx`
- `GET /api/agent-memos?id=xxx`（一覧は非公開）
- `GET /api/case-reports` / `?id=xxx`
- `GET /api/operation-records` / `?id=xxx`
- `GET /api/containment-protocols` / `?id=xxx`
- `GET /api/research-theories` / `?id=xxx`
- `GET /api/sigma-messages` / `?id=xxx`
- `GET /api/posts` / `GET /api/posts?id=xxx`

**NPC / Chat**
- `GET/POST /api/chat/[chatId]`
- `GET      /api/chat/unread`
- `POST     /api/npc/post`
- `POST     /api/npc/process`
- `POST     /api/npc-dm`

**その他**
- `GET  /api/health`
- `GET  /api/skill-exam`
- `POST /api/push`
- `GET  /api/cron/email-reminder`
- `POST /api/cron/publish-queue`

### 管理者 API（38 本、admin 以上必須）

`/api/admin/{resource}` で GET/POST/PATCH/DELETE を実装。

| リソース | テーブル |
|---------|---------|
| `users` / `xp` / `achievements` | ユーザー管理 |
| `divisions` / `missions` / `mission-participants` | ゲーム管理 |
| `novel` / `content` / `codex` | コンテンツ |
| `audio` | 音声記録 |
| `sigma-messages` | SIGMAメッセージ（v5） |
| `observation-points` / `observation-logs` | 観測データ（v5） |
| `dimension-cracks` / `agent-memos` | 世界観データ（v5） |
| `case-reports` / `operation-records` | 事案・作戦記録（v5） |
| `containment-protocols` / `research-theories` | プロトコル・仮説（v5） |
| `db-entities` / `db-facilities` / `db-equipment` / `db-personnel` | 世界観 DB |
| `incidents` | インシデント |
| `event-schedule` / `publish-queue` | スケジューラー |
| `npc-engine` / `puzzles` / `rule-engine` | ARG エンジン |
| `story-engine` / `skill-tree` | ゲーム進行 |
| `analytics` / `security` | 運用 |
| `bulletin` / `chat` / `dm` / `notifications` / `push` | コミュニケーション |

---

## 6. ページ一覧

### プレイヤー向け（35 ページ）

| パス | 説明 | CLR |
|-----|------|-----|
| `/dashboard` | メインダッシュボード | 0 |
| `/missions` / `/missions/[id]` | ミッション一覧・詳細 | 0 |
| `/novel` | 機関員の日記（タグシステム） | 0 |
| `/cipher` | 暗号解読パズル | 0 |
| `/codex` | コーデックス | 0 |
| `/skill-tree` / `/skill-tree/exam/[id]` | スキルツリー・試験 | 0 |
| `/database` / `/database/[tab]/[id]` | 世界観 DB（実体・施設等） | 0 |
| `/map` / `/map/[cityCode]` | 海蝕マップ（大分県） | 0 |
| `/chat/[chatId]` | NPC チャット | 0 |
| `/npc-dm` | NPC DM 選択 | 0 |
| `/bulletin` | 掲示板 | 0 |
| `/events` | ARGイベント一覧 | 0 |
| `/entities` / `/entities/[code]` | エンティティ一覧・詳細 | 0 |
| `/personnel` / `/personnel/[code]` | 人事一覧・詳細 | 0 |
| `/modules` | 収束モジュール | 0 |
| `/incidents/[id]` | インシデント詳細 | 0 |
| `/divisions` | 部門一覧 | 0 |
| `/achievements` | 実績 | 0 |
| `/history` | 行動履歴 | 0 |
| `/notifications` | 通知 | 0 |
| `/discovered` | 発見済みコンテンツ | 0 |
| `/statistics` | 統計 | 0 |
| `/console` | コマンドコンソール | 0 |
| `/search` | 全テーブル横断検索 | 0 |
| `/profile` / `/settings` | プロフィール・設定 | 0 |
| `/division-transfer` | 部門異動申請 | 1 |
| `/classified` | 機密コンテンツ | 2 |

### 管理者向け（32 ページ）

`/admin/*` — `requireAdmin` で保護。サイドバーでグループ分け。

| グループ | ページ |
|---------|--------|
| 運用 | dashboard / analytics / security |
| プレイヤー | users / xp / achievements / skill-tree / story-engine / divisions |
| コミュニケーション | dm / announcements / bulletin / chat-viewer |
| 世界観 DB | db-entities / db-facilities / db-equipment / db-personnel / incidents |
| コンテンツ | novel / novel-db / codex / audio / **world-data** / **sigma-messages** / publish-queue / puzzles |
| ARG | missions / event-schedule / npc-engine / npc-scripts |
| システム | rule-engine |

---

## 7. タグシステム

### `src/app/(app)/novel/NovelRenderer.tsx`

小説本文の `[[TAG-ID]]` 記法をインラインカード・モーダルに変換するクライアントコンポーネント。

#### アーキテクチャ

```
content string
  ↓ parseContent()     # Segment[] に分解（テキスト / カード / ARG演出）
  ↓ renderParagraph()  # Segment → React Node
  ↓ InlineCard         # resolveTag() で TagMeta を解決 → ボタン表示
  ↓ handleOpen()       # クリック → ModalState をセット
  ↓ Modal              # GenericTagModal / AudioModal / BulletinModal / MemoModal / ObserverModal
```

#### TAG_RESOLVERS（33 件）

| プレフィックス | データソース | モーダル種別 |
|---|---|---|
| `M-` `FAC-` `ENT-` `EQ-` `AGT-` `DIV-` `INC-` `MOD-` `CDX-` | dbCacheStore | Generic |
| `AUD-` | dbCacheStore → `/api/audio?id=` | AudioModal |
| `SKL-` `ACH-` `NPC-` `PHASE-` `LAYER-` `CERT-` | 静的定義 | Generic |
| `EVT-` `PZL-` `CIPHER-` | dbCacheStore | Generic |
| `BUL-` | オンデマンド `/api/posts?id=` | BulletinModal |
| `LOC-` `RIFT-` `GSI-` `SIG-` `SCAN-` | dbCacheStore | Generic |
| `CRK-` `CASE-` `OP-` `PROTO-` `THEORY-` | dbCacheStore | Generic |
| `MEMO-` | オンデマンド `/api/agent-memos?id=` | MemoModal |
| `SIGMA-MSG` | dbCacheStore（整合性 % で伏字演出） | Generic |
| `OBSERVER` | 静的（useBoundStore で動的） | ObserverModal |

#### ARG演出タグ（Segment 専用・モーダルなし）

| タグ | コンポーネント | 説明 |
|---|---|---|
| `[[REDACTED]]` / `[[REDACTED:理由]]` | `RedactedBlock` | 黒塗り（ホバーで理由） |
| `[[VOID]]` | `VoidBlock` | 完全な空白（aria-hidden） |
| `[[CORRUPTED]]` / `[[CORRUPTED:ラベル]]` | `CorruptedBlock` | glitch アニメーション |
| `[[TIMESTAMP:ISO]]` | `TimestampBlock` | インライン時刻バッジ |
| `[[ANOMALY:4.8σ]]` | `AnomalyBlock` | GSI 値連動カラーバッジ |
| `[[USER]]` | `UserTag` | agentId 動的挿入 |
| `[[UNKNOWN]]` / `[[UNKNOWN:ヒント]]` | `UnknownBlock` | SCANNING… 点滅バッジ |
| `[[CLASSIFIED:LV4]]` | `ClassifiedBlock` | CLR 照合・動的黒塗り |

#### 新規タグ追加手順

1. `src/store/dbCacheStore.ts` — 型・DbCache フィールド・fetch を追加
2. `NovelRenderer.tsx` — `TagKind` に追加 → リゾルバ関数を書く → `TAG_RESOLVERS` に登録
3. `TagModalContent` に `if (kind === "xxx")` ブロックを追加
4. 必要なら新モーダルコンポーネントを作成・`ModalState` に追加

---

## 8. DBスキーマ概要

`scripts/schema.sql` 全 49 テーブル。

### ユーザー管理

| テーブル | 用途 |
|---------|------|
| `users` | エージェント情報（agentId / xp_total / level / role） |
| `divisions` | 部門マスター |
| `xp_logs` | XP 付与履歴 |
| `login_attempts` | ログイン試行ログ（レート制限用） |
| `email_verifications` | OTP テーブル |

### ゲームコンテンツ

| テーブル | タグ |
|---------|------|
| `db_entities` | `ENT-` |
| `db_facilities` | `FAC-` |
| `db_equipment` | `EQ-` |
| `db_personnel` | `AGT-` |
| `field_incidents` | `INC-` |
| `novel_documents` | — |
| `codex_sections` / `codex_entries` | `CDX-` |
| `puzzle_entries` / `puzzle_solves` | `PZL-` / `CIPHER-` |
| `audio_records` | `AUD-` |
| `sigma_messages` | `SIGMA-MSG` |

### 世界観データ（v5）

| テーブル | タグ |
|---------|------|
| `observation_points` | `LOC-` / `RIFT-` |
| `observation_logs` | `GSI-` / `SIG-` / `SCAN-` |
| `dimension_cracks` | `CRK-` |
| `agent_memos` | `MEMO-` |
| `case_reports` | `CASE-` |
| `operation_records` | `OP-` |
| `containment_protocols` | `PROTO-` |
| `research_theories` | `THEORY-` |

### ARG エンジン

| テーブル | 用途 |
|---------|------|
| `missions` / `mission_participants` | ミッション |
| `event_schedule` / `published_content` | スケジューラー |
| `progress_flags` | ストーリーフラグ |
| `story_variables` | 数値変数（current_phase 等） |
| `npc_engine_rules` | NPC 動的ルール |
| `rule_engine_entries` | ARG キーワード・ルール |
| `achievements` / `user_achievements` | 実績 |
| `user_skill_nodes` / `skill_exam_results` | スキルツリー |

### その他

| テーブル | 用途 |
|---------|------|
| `posts` | 掲示板（`BUL-`） |
| `chat_messages` | チャットログ |
| `notifications` | 通知 |
| `bookmarks` | ブックマーク |
| `push_subscriptions` | Web Push |

---

## 9. ARGエンジン群

### NPC エンジン（`src/lib/npc-engine.ts`）

5 NPC（K-ECHO / N-VEIL / L-RIFT / A-PHOS / G-MIST）への DM を処理。  
`npc_engine_rules` の動的ルールをキーワードマッチ → スクリプト選択 → 応答生成。  
管理者画面 `/admin/npc-engine` でルールを追加・編集可能。

### イベントトリガー（`src/lib/event-triggers.ts`）

```typescript
checkAndFireTriggers(userId, eventKey, db)
```

`event_schedule` テーブルのスケジューラーと `progress_flags` の組み合わせで、  
特定条件達成時に XP 付与・フラグ更新・NPC 応答を自動発火。

### ルールエンジン（`rule_engine_entries`）

ARG キーワードを登録しておき、チャットメッセージに含まれる場合にトリガーを発火。  
`type = 'arg_keyword'` の行を `/admin/rule-engine` で管理。

### 実績エンジン（`src/lib/achievements.ts`）

`ACHIEVEMENTS_MASTER`（静的定義）の `check()` 関数を評価して付与。  
ログイン・XP・ミッション完了・チャット数など多数の条件をサポート。

---

## 10. よくある落とし穴

| 問題 | 原因 | 対処 |
|------|------|------|
| チャット送信が 500 | `INTERNAL_SECRET` が 32 文字未満 | `openssl rand -base64 32` で再生成 |
| タグカードが全て「LOCKED」 | `dbCacheStore` の load() 未呼び出し | `useEffect(() => { load(); }, [load])` を確認 |
| CLR 変更が反映されない | Zustand キャッシュが古い | 再ログインを促す（`invalidate()` は管理者操作後に呼ぶ） |
| 管理者 API が 403 | `requireAdmin` ではなく `requireAuth` を使っている | `src/lib/server-auth.ts` の関数を確認 |
| 新テーブルが見つからない | `migrate.js` 未実行 | `node --env-file=.env.local scripts/migrate.js` を実行 |
| `CORRUPTED` バッジが SSR/CSR で異なる | `Math.random()` 使用（修正済） | `seededCorruptedLabel()` を使うこと |
| `observation_points` 等が空 | 初期データ未投入 | `/admin/world-data` からデータを入力、またはデプロイノートブックの World Seed セルを実行 |
| `MEMO-` タグが「読み込み中」のまま | `/api/agent-memos?id=` が 404 | `agent_memos` テーブルに対象 ID が存在するか確認 |
| NPC が応答しない | `npc_engine_rules` が空 | `/admin/npc-engine` でルールを登録 |
