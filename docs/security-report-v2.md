# セキュリティチェックレポート

**対象:** 海蝕機関 ARG（area-r）
**最終更新:** 2026-03-23

---

## 現在の実装状況

### ✅ 対応済み

| 項目 | 実装箇所 |
|---|---|
| JWT — HttpOnly Cookie | `src/lib/auth.ts` + `src/app/api/auth/login/route.ts` |
| CSRF 対策（X-Requested-With） | `src/middleware.ts` + `src/lib/api-client.ts` |
| x-user-level / x-user-role ヘッダー偽装防止 | `src/middleware.ts`（スプーフィングヘッダーを削除してセッション値で上書き） |
| パスワード — bcrypt（コスト係数 12） | `src/lib/auth.ts` |
| レート制限（ログイン IP / アカウント二重） | `src/app/api/auth/login/route.ts` |
| レート制限（登録 IP） | `src/app/api/auth/register/route.ts` |
| レート制限（チャット） | `src/app/api/chat/[chatId]/route.ts` |
| XP レート制限（アクティビティ別 24h 上限） | `src/app/api/users/me/xp/route.ts` |
| チャット chatId ホワイトリスト検証 | `src/app/api/chat/[chatId]/route.ts`（`ALLOWED_CHAT_CHANNELS`） |
| メッセージ長サーバー側検証（1000 文字） | `src/app/api/chat/[chatId]/route.ts` |
| XP 量のサーバー側決定（クライアントから受け取らない） | `src/app/api/users/me/xp/route.ts` |
| sender_name — セッションの agentId を使用（なりすまし防止） | `src/app/api/chat/[chatId]/route.ts` |
| XSS サニタイズ（HTML タグ除去・2 パス） | `src/lib/sanitize.ts` |
| 管理者保護（admin / super_admin ロール） | `src/middleware.ts` + `src/lib/server-auth.ts` |
| レベルゲート（クリアランスレベル別ページ制限） | `src/middleware.ts` |
| NPC チャンネルへの不正書き込み防止 | `src/app/api/chat/[chatId]/route.ts`（NPC_USERNAMES チェック） |
| INTERNAL_SECRET 長さ検証（32 文字以上必須） | `src/lib/env.ts` |
| localStorage に機密フィールドを保存しない | `src/store/index.ts`（partialize で最小限のみ保存） |
| BAN されたユーザーのセッション無効化 | `src/lib/auth.ts`（`getSessionFromCookie` で DB の status を確認） |
| タグ API — CLR フィルタ（全 20 本） | `src/app/api/observation-points/route.ts` 他（`clearance_req <= userLevel`） |
| タグ API — 管理者 CRUD は `requireAdmin` で保護 | `src/app/api/admin/*/route.ts` |
| `agent_memos` — `?id=` 単一取得のみ公開（一覧は非公開） | `src/app/api/agent-memos/route.ts` |
| BUL-タグ — 投稿本文は `?id=` オンデマンド取得（認証必須） | `src/app/api/posts/route.ts` |
| `CORRUPTED` バッジ — SSR/CSR 差異排除（シードベース生成） | `src/app/(app)/novel/NovelRenderer.tsx` |

### ⚠️ 運用上の注意事項

**A. 環境変数の管理**

`JWT_SECRET` / `INTERNAL_SECRET` / `CRON_SECRET` は `openssl rand -base64 32` で生成した値を使用すること。

```bash
openssl rand -base64 32
```

**B. Turso の接続トークン管理**

`TURSO_AUTH_TOKEN` は定期的にローテーションすること（`turso db tokens create kaishoku`）。

**C. Vercel の Environment Variables**

本番環境の環境変数は Vercel ダッシュボードの「Environment Variables」で `Production` スコープのみに設定し、`Preview` には別の値を使用することを推奨する。

**D. `super_admin` ロールの管理**

`super_admin` への昇格は Turso シェルの直接 SQL 操作のみで行い、アプリ上の操作では実施しないこと。

**E. タグ API の CLR フィルタ**

`dbCacheStore.ts` の `fetchAll()` はログイン済みユーザーの CLR でフィルタされたデータのみ取得する。ただし `NovelRenderer` はクライアントサイドでキャッシュを持つため、CLR 変更後は再ログインで反映されることを周知すること。

---

## スキャン結果サマリー

```
検出パターン                              件数
──────────────────────────────────────────────
dangerouslySetInnerHTML / innerHTML         0  ✅
eval / new Function                         0  ✅
ハードコードされたシークレット               0  ✅
オープンリダイレクト                         0  ✅
x-user-level 偽装バイパス                   0  ✅
chatId ホワイトリスト未検証                  0  ✅
XP クライアント操作                          0  ✅
localStorage 権限フィールド保存              0  ✅
CSRF 未対策の API                            0  ✅
タグ API CLR バイパス                        0  ✅
Math.random() SSR/CSR 差異（修正済）        0  ✅
```
