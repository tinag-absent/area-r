# KAISHOKU — ファイル命名規則

**File Naming Convention | Next.js 15 App Router + TypeScript**

---

## 1. 基本方針

ファイルの役割・置き場所に応じてケースを統一し、import 時に迷わない状態を維持する。

Next.js が予約するファイル名（`page` / `layout` / `route` / `loading` / `error` / `not-found` / `middleware`）はその名前に固定する。

---

## 2. ディレクトリ別ルール

| ディレクトリ | ケース | パターン | 例 |
|---|---|---|---|
| `src/components/**` | PascalCase | `ComponentName.tsx` | `UserProvider.tsx` |
| `src/hooks/` | camelCase | `use` + PascalCase | `useChat.ts` |
| `src/lib/` | kebab-case | `lowercase-words.ts` | `api-client.ts` |
| `src/actions/` | kebab-case | `lowercase-words.ts` | `login-bonus.ts` |
| `src/store/` | `index.ts` 固定 | — | `index.ts` |
| `src/app/**/[Seg]/` | kebab-case | `segment-name/` | `skill-tree/` |
| `src/app/**/*Client` | PascalCase | `NameClient.tsx` | `MapClient.tsx` |
| `src/app/**/data` | `data.ts` 固定 | — | `data.ts` |

---

## 3. ルールの詳細

### 3-1. `src/components/**` → PascalCase + `.tsx`

React コンポーネントファイルはすべて PascalCase。export する関数名と一致させる。

- ✓ `UserProvider.tsx` → `export function UserProvider`
- ✓ `OnboardingModal.tsx` → `export function OnboardingModal`
- ✗ `input-cls.ts` → NG（kebab-case は `components/` 禁止）
- • 複数コンポーネントをまとめる場合は `index.tsx` を作成しバレル export する

### 3-2. `src/hooks/` → `use` プレフィックス + camelCase + `.ts`

カスタムフック専用ディレクトリ。ファイル名は必ず `use` で始める。

- ✓ `useChat.ts` → `export function useChat(...)`
- ✓ `useUnreadPolling.ts` → `export { useUnreadPolling, useTriggerCheck }`
- ✗ `chatHook.ts` → NG（`use` プレフィックスなし）
- ✗ `UseChat.ts` → NG（PascalCase は禁止）

### 3-3. `src/lib/` → kebab-case + `.ts`

サーバー・クライアント共通のユーティリティ。単語が1つの場合も kebab-case ルールに従う（実質 lowercase）。

- ✓ `api-client.ts` / `api-error.ts` / `server-auth.ts`
- ✓ `achievements.ts` / `auth.ts` / `db.ts`（1単語 → lowercase のまま）
- ✗ `apiClient.ts` / `ApiClient.ts` → NG
- • サーバー専用ロジックは `server-` プレフィックスで区別する（例: `server-auth.ts`）
- • クライアントから import 可能なデータ定義は `-data` サフィックスを付ける（例: `achievements-data.ts`）

### 3-4. `src/actions/` → kebab-case + `.ts`

Next.js Server Actions をまとめる。`lib/` と同様に kebab-case。

- ✓ `login-bonus.ts` → `export async function processLoginBonus()`

### 3-5. `src/app/` → Next.js 規約ファイル + ルートセグメント

Next.js が予約するファイルは規約名に固定。ルートセグメント名は kebab-case。

- ✓ `page.tsx` / `layout.tsx` / `route.ts` / `loading.tsx` / `error.tsx` / `not-found.tsx`
- ✓ `skill-tree/` / `npc-dm/` / `division-transfer/`（セグメント名は kebab-case）
- ✓ `data.ts`（ページ固有データ — 固定名）
- ✓ `[chatId]` / `[missionId]`（動的セグメント — camelCase パラメータ名）
- ✓ Client コンポーネントは PascalCase + `Client` サフィックス（例: `MapClient.tsx`）
- • `examData.ts` などの例外は Page Router 互換ファイルのみ許容

---

## 4. import パス規則

すべての import は `@/` エイリアスを使う。相対パスは同一ディレクトリの直接参照のみ許可。

```ts
import { useChat }      from "@/hooks/useChat";
import { apiPost }      from "@/lib/api-client";
import { UserProvider } from "@/components/layout/UserProvider";
import { Button }       from "@/components/ui";  // バレル export を推奨
```

---

## 5. 既存の違反ファイルと対処

本規則策定時点で検出された違反と対処方針。

| 違反ファイル | 修正後ファイル名 | 対処内容 |
|---|---|---|
| `components/ui/input-cls.ts` | `components/ui/InputCls.ts` | `@deprecated` につき削除対象 |

---

## 6. 新規ファイル作成チェックリスト

- [ ] コンポーネントを作る → `components/` に `PascalCase.tsx` で配置したか？
- [ ] カスタムフックを作る → `hooks/` に `useName.ts` で配置したか？
- [ ] ロジック・ユーティリティを作る → `lib/` に `kebab-case.ts` で配置したか？
- [ ] ファイル名と `export` の関数名・クラス名が一致しているか？
- [ ] import は `@/` エイリアスを使っているか？
- [ ] Next.js 規約ファイルの名前を間違えていないか？

---

*策定: 2026-03-19 | 対象: `src/` 以下の全ファイル | Next.js 15 App Router*
