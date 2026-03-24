# タグシステム — 設計・運用ドキュメント

小説本文に `[[TAG-ID]]` 記法で埋め込むインラインカード／モーダル表示システム。

---

## ファイル構成

```
src/app/(app)/novel/
├── NovelRenderer.tsx          # レンダラー本体（パーサー・ARG演出タグ・モーダル制御）
└── tags/
    ├── types.ts               # 型定義・静的データ（PHASE_DEFS 等）
    ├── resolvers.ts           # 全リゾルバ関数・TAG_RESOLVERS テーブル・resolveTag()
    └── ui.tsx                 # 共通UIプリミティブ（Row / Badge / ModalShell / カラーマップ）

src/store/dbCacheStore.ts      # DB キャッシュ（Zustand）・型定義
```

### 各ファイルの責務

| ファイル | 変更するケース |
|---|---|
| `tags/types.ts` | 型（TagKind）追加、静的定義データ（PHASE_DEFS 等）の変更 |
| `tags/resolvers.ts` | リゾルバ関数の追加・修正、TAG_RESOLVERS への登録 |
| `tags/ui.tsx` | 共通カラーマップの追加、UIプリミティブの追加 |
| `NovelRenderer.tsx` | モーダル表示ロジック（TagModalContent）の追加、ARG演出タグの追加 |
| `dbCacheStore.ts` | 新テーブルの型・フェッチ処理の追加 |

---

## タグ一覧（33種 + ARG演出11種）

### DB参照タグ — Phase 1〜4

| タグ記法 | 例 | DB テーブル | 解説 |
|---|---|---|---|
| `[[M-ID]]` | `[[M-001]]` | `missions` | ミッション |
| `[[FAC-ID]]` | `[[FAC-001]]` | `db_facilities` | 施設 |
| `[[ENT-ID]]` | `[[ENT-001]]` | `db_entities` | エンティティ（実体） |
| `[[EQ-ID]]` | `[[EQ-001]]` | `db_equipment` | 装備 |
| `[[AGT-ID]]` | `[[AGT-K17]]` | `db_personnel` | 人事（エージェント） |
| `[[DIV-ID]]` | `[[DIV-01]]` | `divisions` | 部門 |
| `[[INC-ID]]` | `[[INC-001]]` | `incidents` | インシデント |
| `[[MOD-ID]]` | `[[MOD-001]]` | `modules` | 収束モジュール |
| `[[CDX-ID]]` | `[[CDX-001]]` | `codex_entries` | コーデックス |
| `[[AUD-ID]]` | `[[AUD-001]]` | `audio_records` | 音声記録（専用モーダル） |

### DB参照タグ — Phase 5A

| タグ記法 | 例 | データソース | 解説 |
|---|---|---|---|
| `[[SKL-ID]]` | `[[SKL-obs-basic]]` | `data.ts`（静的） | スキルツリー |
| `[[ACH-KEY]]` | `[[ACH-first_login]]` | `achievements-data.ts`（静的） | 実績 |
| `[[EVT-ID]]` | `[[EVT-001]]` | `event_schedule` | イベント |
| `[[PZL-slug]]` | `[[PZL-sigma-code]]` | `puzzle_entries` | パズル |
| `[[BUL-ID]]` | `[[BUL-001]]` | `posts`（クリック時フェッチ） | 掲示板投稿 |
| `[[NPC-NAME]]` | `[[NPC-K-ECHO]]` | `npc-config.ts`（静的） | NPC |

### DB参照タグ — Phase 5B（新規テーブル）

| タグ記法 | 例 | DB テーブル | 解説 |
|---|---|---|---|
| `[[LOC-ID]]` | `[[LOC-OIT-001]]` | `observation_points`（type=location） | 観測地点 |
| `[[RIFT-ID]]` | `[[RIFT-α7]]` | `observation_points`（type=rift_point） | 観測拠点（裂孔） |
| `[[GSI-ID]]` | `[[GSI-RECORD-042]]` | `observation_logs`（type=gsi） | GSIログ |
| `[[SIG-ID]]` | `[[SIG-DELTA]]` | `observation_logs`（type=signal） | 信号記録 |
| `[[SCAN-ID]]` | `[[SCAN-2026-0313]]` | `observation_logs`（type=scan） | スキャン記録 |
| `[[CRK-ID]]` | `[[CRK-001]]` | `dimension_cracks` | 次元裂孔 |
| `[[MEMO-ID]]` | `[[MEMO-K17-001]]` | `agent_memos`（クリック時フェッチ） | 機関員メモ |
| `[[CASE-ID]]` | `[[CASE-IR-031]]` | `case_reports` | 事案記録 |
| `[[OP-ID]]` | `[[OP-NIGHTFALL]]` | `operation_records` | 作戦記録 |
| `[[PROTO-ID]]` | `[[PROTO-OMEGA]]` | `containment_protocols` | 封印プロトコル |
| `[[THEORY-ID]]` | `[[THEORY-009]]` | `research_theories` | 研究仮説 |
| `[[SIGMA-MSG-ID]]` | `[[SIGMA-MSG-007]]` | `sigma_messages` | SIGMAメッセージ |

### 静的定義タグ

| タグ記法 | 例 | 定義場所 | 解説 |
|---|---|---|---|
| `[[PHASE-N]]` | `[[PHASE-2]]` | `tags/types.ts` の `PHASE_DEFS` | フェーズ定義（1〜3） |
| `[[LAYER-N]]` | `[[LAYER-3]]` | `tags/types.ts` の `LAYER_DEFS` | 次元層（1〜7） |
| `[[CERT-LVN]]` | `[[CERT-LV3]]` | `tags/types.ts` の `CERT_DEFS` | クリアランス証明（0〜5） |
| `[[CIPHER-ID]]` | `[[CIPHER-A7]]` | `puzzle_entries`（slug照合） | 暗号文書（PZL-の別名） |
| `[[OBSERVER]]` | `[[OBSERVER]]` | 静的 | 4th wall 演出モーダル |

### ARG演出タグ（モーダルなし・インライン表示のみ）

| タグ記法 | 表示 |
|---|---|
| `[[REDACTED]]` | 黒塗りブロック |
| `[[REDACTED:理由]]` | 黒塗り（ホバーで理由表示） |
| `[[VOID]]` | 完全消去（真っ黒・文字なし） |
| `[[CORRUPTED]]` | 文字化けバッジ |
| `[[CORRUPTED:ラベル]]` | 文字化けラベル付き |
| `[[TIMESTAMP:ISO]]` | インライン時刻（例: `2026-03-13T02:17`） |
| `[[ANOMALY:値]]` | GSI異常値バッジ（4.0σ以上で赤点滅） |
| `[[USER]]` | ログイン中エージェントIDを動的挿入 |
| `[[UNKNOWN]]` / `[[UNKNOWN:ヒント]]` | 未確認実体バッジ（点滅） |
| `[[CLASSIFIED:LVN]]` | CLR不足なら黒塗り・足りれば表示 |
| `[[CLASSIFIED:LVN:ラベル]]` | ラベル付き動的黒塗り |

### ラベル上書き構文

任意のDBタグにカスタムラベルを付けられます：

```
[[ENT-001|海蝕実体 "アビス"]]
[[M-042|最終作戦]]
```

---

## 新規タグの追加手順

### A. DB参照タグ（新テーブル）を追加する場合

**手順 1 — `dbCacheStore.ts`**

```typescript
// 1a. 型定義を追加
export interface MyNewRecord {
  id:   string;
  name: string;
  // ...
}

// 1b. DbCache に追加
export interface DbCache {
  // ... 既存フィールド
  my_new_table: MyNewRecord[];
}

// 1c. fetchAll() の Promise.all に追加
const [..., myNew] = await Promise.all([
  // ... 既存fetch
  fetch("/api/my-new-endpoint", { headers: H }).then(r => r.ok ? r.json() : []),
]);

// 1d. fetchAll の return に追加
return { ..., my_new_table: myNew };

// 1e. fetchSlices の sliceMap に追加
my_new_table: () => fetch("/api/my-new-endpoint", { headers: H }).then(r => r.ok ? r.json() : []),
```

**手順 2 — `tags/types.ts`**

```typescript
export type TagKind =
  | ... // 既存
  | "my_new_kind"; // ← 追加
```

**手順 3 — `tags/resolvers.ts`**

```typescript
// リゾルバ関数を追加
function resolveMyNew(id: string, db: DbCache): TagMeta | null {
  const rec = db.my_new_table.find(r => r.id === id);
  if (!rec) return null;
  return {
    kind:   "my_new_kind",
    icon:   "◆",
    color:  "var(--color-primary)",
    label:  rec.name,
    sub:    "MY TYPE",
    code:   id,
    locked: false,
  };
}

// TAG_RESOLVERS に追記（長いプレフィックスを先に書く）
export const TAG_RESOLVERS: TagResolver[] = [
  // ...既存...
  { prefix: "NEW-", resolve: resolveMyNew }, // ← 追加
];
```

**手順 4 — `NovelRenderer.tsx` の `TagModalContent`**

```tsx
if (kind === "my_new_kind") {
  const rec = db.my_new_table.find(r => r.id === id);
  if (!rec) return null;
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Badge text="MY TYPE" color="var(--color-primary)" />
      </div>
      <Row label="NAME" value={rec.name} />
    </>
  );
}
```

**手順 5 — `/api/my-new-endpoint/route.ts` を追加**

---

### B. 静的定義タグ（DBなし）を追加する場合

`dbCacheStore.ts` の変更は不要。`tags/resolvers.ts` だけ変更：

```typescript
function resolveMyStatic(id: string, _db: DbCache): TagMeta | null {
  const defs: Record<string, { label: string; color: string }> = {
    "ALPHA": { label: "アルファ型", color: "var(--color-primary)" },
  };
  const key = id.replace(/^MYPREFIX-?/i, "");
  const def = defs[key];
  if (!def) return null;
  return {
    kind: "my_static_kind", icon: "◇",
    color: def.color, label: def.label,
    sub: "MY STATIC TYPE", code: key, locked: false,
  };
}
```

---

### C. オンデマンドフェッチタグ（BUL- / MEMO- 方式）を追加する場合

クリック時に初めてAPIを叩くタイプ。初期表示に不要なデータ・機密性が高い場合に使用。

1. **リゾルバはスタブ**（IDだけで最低限の情報を返す）
2. **`tags/types.ts` の `ModalState` に追加**：
   ```typescript
   export type ModalState =
     | ...
     | { type: "my_ondemand"; id: string; meta: TagMeta }
     | null;
   ```
3. **`NovelRenderer.tsx` の `handleOpen` に分岐追加**：
   ```typescript
   if (meta.kind === "my_ondemand") {
     setModal({ type: "my_ondemand", id, meta });
     return;
   }
   ```
4. **専用モーダルコンポーネントを追加**し、`useEffect` 内でフェッチ

---

## 共通UIプリミティブ（`tags/ui.tsx`）

モーダル内で使う共通コンポーネント群。`NovelRenderer.tsx` から import して使う。

| コンポーネント | 使い方 |
|---|---|
| `<Row label="KEY" value={val} />` | キー/値の1行 |
| `<Row label="KEY" value={val} highlight accentColor={color} />` | ハイライト行（ObserverModal等） |
| `<Badge text="STATUS" color={color} />` | ステータスバッジ |
| `<ModalShell ...>` | モーダル外枠・ヘッダー・IDストリップ |
| `<BadgeRow>` | バッジを横並びにするコンテナ |
| `<DescBlock text={rec.description} />` | 説明文ブロック |
| `<SectionHeader label="FINDINGS" />` | セクション見出し |
| `<WarningBox text={rec.warning} />` | ⚠ 警告ボックス |
| `<ListItem color={color}>...</ListItem>` | リストアイテム（縦棒付き） |
| `<LoadingPlaceholder />` | 読み込み中表示 |
| `<ErrorPlaceholder message="..." />` | エラー表示 |

### カラーマップ定数

| 定数名 | 用途 |
|---|---|
| `THREAT_COLOR` | エンティティ脅威レベル（`LOW` / `MODERATE` / `HIGH` / `CRITICAL`） |
| `SEVERITY_COLOR` | インシデント・観測ログ深刻度（`critical` / `warning` / `safe`） |
| `ENERGY_COLOR` | モジュールエネルギー（`低` / `中` / `高` / `超高` / `極高`） |
| `OUTCOME_COLOR` | 作戦結果（`success` / `partial` / `failure` / `classified`） |
| `EVENT_STATUS_COLOR` | イベントステータス（`scheduled` / `published` / `fired`） |
| `MEMO_STATUS_COLOR` | メモステータス（`recovered` / `partial` / `corrupted` / `classified`） |
| `CATEGORY_COLOR` | 掲示板カテゴリ（`general` / `report` / `request`） |

---

## locked（機密黒塗り）の実装パターン

**リゾルバ側**：
```typescript
const locked = rec.status === "classified";
return {
  label: locked ? "████████" : rec.name,
  sub:   locked ? undefined  : `${rec.status} · ${rec.date}`,
  locked,
};
```

**モーダル側**：
```tsx
<Row label="NAME"     value={locked ? "████████" : rec.name} />
<Row label="LOCATION" value={locked ? "████████" : rec.location} />
<DescBlock text={locked ? "████████████████████████████" : rec.description} />
```

---

## 変更履歴

| フェーズ | 日付 | 内容 |
|---|---|---|
| Phase 1 | 2026-03 | `[[REDACTED]]` 構文・基本タグ |
| Phase 2 | 2026-03 | `DIV-` / `INC-` / `MOD-` / `CDX-` / `AUD-` 追加 |
| Phase 3 | 2026-03 | TagResolver プラグイン化・Zustand キャッシュ化 |
| Phase 4 | 2026-03 | 全タグモーダル表示に統一・インラインカード情報量強化 |
| Phase 5A | 2026-03 | `SKL-` / `ACH-` / `EVT-` / `PZL-` / `BUL-` / `NPC-` 追加 |
| Phase 5B | 2026-03 | 新規9テーブル14タグ追加 |
| Refactor | 2026-03-23 | `tags/` ディレクトリ分離・`BulletinModal` バグ修正・重複カラーマップ統合 |
