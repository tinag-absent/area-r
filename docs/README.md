# 海蝕機関 — KAISHOKU AGENCY

ARG（代替現実ゲーム）Webアプリ。Next.js 16 + Turso (libSQL) + Vercel で動作する。

> **Updated: 2026-03-23** — タグシステム v5（33タグ）/ 新規テーブル9本 / 管理者画面拡充

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| データベース | Turso (libSQL / SQLite 互換) |
| 認証 | JWT (jose) + bcryptjs — HttpOnly Cookie |
| 状態管理 | Zustand + persist |
| スタイル | Tailwind CSS v4 |
| デプロイ | Vercel |

---

## セットアップ手順

### 1. Turso のセットアップ

```bash
# Turso CLI インストール（macOS）
brew install tursodatabase/tap/turso

# Linux / WSL
curl -sSfL https://get.tur.so/install.sh | bash

turso auth login
turso db create kaishoku
turso db show kaishoku          # → TURSO_DATABASE_URL
turso db tokens create kaishoku # → TURSO_AUTH_TOKEN
```

### 2. スキーマとシードデータの適用

```bash
cp .env.example .env.local
# .env.local を編集して TURSO_* / JWT_SECRET / INTERNAL_SECRET を設定

npm install
node --env-file=.env.local scripts/migrate.js --admin-password=YourPassword123
```

### 3. ローカル開発

```bash
npm run dev   # → http://localhost:3000
```

### 4. Vercel へデプロイ

**方法 A: GitHub 経由（推奨）**

1. このリポジトリを GitHub に push
2. [vercel.com](https://vercel.com) で Import Project → リポジトリを選択
3. 環境変数を設定（下記参照）
4. Deploy

**方法 B: Google Colab ノートブック**

`docs/kaishoku_deploy_v5.ipynb` を Colab で開き、STEP 0 の設定を入力して順番に実行する。

---

## 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `TURSO_DATABASE_URL` | ✅ | Turso DB の接続 URL |
| `TURSO_AUTH_TOKEN` | ✅ | Turso 認証トークン |
| `JWT_SECRET` | ✅ | JWT 署名シークレット（32 文字以上推奨） |
| `INTERNAL_SECRET` | ✅ | 内部 API ルート間の認証（**32 文字以上必須**） |
| `NEXT_PUBLIC_BASE_URL` | ✅ | サイトのベースURL（例: `https://kaishoku.vercel.app`） |
| `CRON_SECRET` | 推奨 | Cron ジョブ認証トークン |

```bash
# シークレット生成
openssl rand -base64 32
```

> **注意**: `INTERNAL_SECRET` が 32 文字未満だとチャット送信時に 500 エラーになる（`src/lib/env.ts` で検証）。

---

## ディレクトリ構成

```
src/
├── actions/          # Server Actions（ログインボーナス処理）
├── app/
│   ├── (app)/        # 認証済みユーザー向けページ
│   │   ├── admin/    # 管理画面（29ページ）
│   │   │   ├── world-data/        # 世界観データ統合管理（v5）
│   │   │   ├── sigma-messages/    # SIGMAメッセージ管理（v5）
│   │   │   ├── audio/             # 音声記録管理
│   │   │   └── ...
│   │   ├── novel/    # 機関員の日記（タグシステム搭載）
│   │   ├── cipher/   # 暗号解読
│   │   ├── map/      # 海蝕マップ
│   │   └── ...（その他 40+ ページ）
│   ├── (auth)/       # 未認証ページ（login / register / reset-password）
│   └── api/          # API ルートハンドラ（公開 50本+ / 管理者 30本+）
├── components/
│   ├── ui/           # 共通 UI（AudioModal など）
│   └── layout/       # Sidebar, UserProvider など
├── lib/              # npc-engine / event-triggers / achievements など
├── middleware.ts     # 認証・クリアランスゲート・CSRF
└── store/
    ├── index.ts          # Zustand メインストア
    └── dbCacheStore.ts   # タグ解決用 DB キャッシュ（Zustand）
scripts/
├── schema.sql            # DB スキーマ（49テーブル）
├── migrate.js
├── seed-from-area13.mjs
└── area13/               # 初期 JSON データ
docs/
├── README.md                          # このファイル
├── naming-convention.md               # ファイル命名規則
├── kaishoku_content_request_format.md # AI発注フォーマット（§1–16）
├── kaishoku_deploy_v5.ipynb           # Google Colab デプロイノートブック
├── security-report-v2.md              # セキュリティ実装状況
└── expansion-plan.md                  # 拡張計画
```

---

## タグシステム（NovelRenderer）

小説本文中に `[[TAG-ID]]` 記法でインラインカード・モーダルを表示できる。

**対応タグ 33種:**

| プレフィックス | 種別 | 例 |
|---|---|---|
| `M-` | ミッション | `[[M-001]]` |
| `FAC-` | 施設 | `[[FAC-001]]` |
| `ENT-` | エンティティ | `[[ENT-001]]` |
| `EQ-` | 装備 | `[[EQ-001]]` |
| `AGT-` | 人事 | `[[AGT-K17]]` |
| `DIV-` | 部門 | `[[DIV-01]]` |
| `INC-` | インシデント | `[[INC-001]]` |
| `MOD-` | 収束モジュール | `[[MOD-001]]` |
| `CDX-` | コーデックス | `[[CDX-001]]` |
| `AUD-` | 音声記録 | `[[AUD-001]]` |
| `SKL-` | スキル | `[[SKL-obs-basic]]` |
| `ACH-` | 実績 | `[[ACH-first_login]]` |
| `EVT-` | イベント | `[[EVT-001]]` |
| `PZL-` | パズル | `[[PZL-sigma-code]]` |
| `BUL-` | 掲示板 | `[[BUL-001]]` |
| `NPC-` | NPC | `[[NPC-K-ECHO]]` |
| `LOC-` | 観測地点 | `[[LOC-OIT-001]]` |
| `RIFT-` | 観測拠点 | `[[RIFT-α7]]` |
| `GSI-` | GSIログ | `[[GSI-RECORD-042]]` |
| `SIG-` | 信号記録 | `[[SIG-DELTA]]` |
| `SCAN-` | スキャン記録 | `[[SCAN-2026-0313]]` |
| `CRK-` | 次元裂孔 | `[[CRK-001]]` |
| `MEMO-` | 機関員メモ | `[[MEMO-K17-001]]` |
| `CASE-` | 事案記録 | `[[CASE-IR-031]]` |
| `OP-` | 作戦記録 | `[[OP-NIGHTFALL]]` |
| `PROTO-` | 封印プロトコル | `[[PROTO-OMEGA]]` |
| `THEORY-` | 研究仮説 | `[[THEORY-009]]` |
| `PHASE-` | フェーズ定義 | `[[PHASE-2]]` |
| `LAYER-` | 次元層 | `[[LAYER-3]]` |
| `CERT-` | クリアランス証明 | `[[CERT-LV3]]` |
| `CIPHER-` | 暗号文書 | `[[CIPHER-A7]]` |
| `SIGMA-MSG` | SIGMAメッセージ | `[[SIGMA-MSG-007]]` |
| `OBSERVER` | 4th wall 演出 | `[[OBSERVER]]` |

**ARG演出タグ（モーダルなし）:** `[[VOID]]` `[[CORRUPTED]]` `[[TIMESTAMP:]]` `[[ANOMALY:4.8σ]]` `[[USER]]` `[[UNKNOWN]]` `[[CLASSIFIED:LV4]]` `[[REDACTED]]` `[[REDACTED:理由]]`

---

## DBテーブル一覧（主要）

| テーブル | 用途 |
|---|---|
| `users` | ユーザー（エージェント） |
| `divisions` | 部門 |
| `missions` / `mission_participants` | ミッション |
| `db_entities` / `db_facilities` / `db_equipment` / `db_personnel` | 世界観 DB |
| `novel_documents` | 機関員の日記 |
| `codex_sections` / `codex_entries` | コーデックス |
| `audio_records` | 音声記録 |
| `sigma_messages` | SIGMAメッセージ |
| `observation_points` | 観測地点（LOC- / RIFT-） |
| `observation_logs` | 観測ログ（GSI- / SIG- / SCAN-） |
| `dimension_cracks` | 次元裂孔（CRK-） |
| `agent_memos` | 機関員メモ（MEMO-） |
| `case_reports` | 事案記録（CASE-IR-） |
| `operation_records` | 作戦記録（OP-） |
| `containment_protocols` | 封印プロトコル（PROTO-） |
| `research_theories` | 研究仮説（THEORY-） |
| `event_schedule` / `published_content` | ARGイベントスケジューラー |
| `puzzle_entries` / `puzzle_solves` | 暗号解読パズル |
| `npc_engine_rules` | NPC エンジン動的ルール |
| `achievements` / `user_achievements` | 実績 |
| `skill_exam_results` / `user_skill_nodes` | スキルツリー |

全スキーマは `scripts/schema.sql` を参照。

---

## 初期管理者アカウント

```bash
node --env-file=.env.local scripts/migrate.js --admin-password=YourPassword123
```

ログイン後、Turso シェルで `super_admin` に昇格:

```sql
UPDATE users SET role = 'super_admin' WHERE agent_id = 'K-000-ADMIN';
```

---

## 注意事項

- `middleware.ts` は `export const runtime = "nodejs"` を宣言（Vercel Edge Runtime で `@libsql/client` 非対応のため）
- `INTERNAL_SECRET` が 32 文字未満だとチャット送信時に 500 エラーになる
- Turso 無料プランは 1DB まで、月 500 接続まで
- タグシステムの新テーブル（`observation_points` 等）は `migrate.js` 実行後に `/admin/world-data` からデータ投入
