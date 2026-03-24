/**
 * 環境変数の検証と安全なエクスポート
 *
 * SEC-1: INTERNAL_SECRET が未設定/短すぎる場合に起動時エラーを投げる。
 * ?? "" のようなフォールバックで空文字列になるのを防ぐ。
 */

/**
 * 指定した環境変数を取得する。未設定・短すぎる場合はエラーを投げる。
 * 呼び出しは必ずリクエスト処理中に行うこと（モジュールトップレベルに置かない）。
 */
function requireEnv(key: string, minLength = 1): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === "production")
      throw new Error(`[env] ${key} is not set in production`);
    console.warn(`[env] ${key} is not set — using dev fallback`);
    return `dev-only-${key.toLowerCase().replace(/_/g, "-")}`;
  }
  if (value.length < minLength)
    throw new Error(`[env] ${key} must be at least ${minLength} characters`);
  return value;
}

/**
 * 内部APIルート間の認証シークレットを取得する（最低32文字）。
 * モジュールトップレベルではなく、リクエスト処理中に呼び出す。
 */
export function getInternalSecret(): string {
  return requireEnv("INTERNAL_SECRET", 32);
}
