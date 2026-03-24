/**
 * フロントエンド用 API クライアント
 *
 * - CSRF ヘッダー (X-Requested-With) を自動付与
 * - 構造化エラーレスポンスを ApiClientError として throw
 * - リダイレクト安全チェック
 */

// ─────────────────────────────────────────────────────────────────────
// エラークラス
// ─────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error:     string;
  code?:     string;
  status?:   number;
  timestamp?: string;
  detail?:   unknown;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status:  number,
    public readonly body:    ApiErrorBody,
  ) {
    super(body.error);
    this.name = "ApiClientError";
  }

  get code(): string { return this.body.code ?? "UNKNOWN"; }
  get isUnauthorized(): boolean { return this.status === 401; }
  get isForbidden():    boolean { return this.status === 403; }
  get isNotFound():     boolean { return this.status === 404; }
  get isConflict():     boolean { return this.status === 409; }
  get isRateLimited():  boolean { return this.status === 429; }
  get isServerError():  boolean { return this.status >= 500; }
}

// ─────────────────────────────────────────────────────────────────────
// 基本リクエスト関数
// ─────────────────────────────────────────────────────────────────────

async function request(
  url:    string,
  method: string,
  body?:  unknown,
): Promise<Response> {
  const headers: HeadersInit = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  return res;
}

// ─────────────────────────────────────────────────────────────────────
// 公開 API
// ─────────────────────────────────────────────────────────────────────

/**
 * POST リクエストを送る。
 * エラーレスポンスは Response をそのまま返す（呼び出し元で .ok を確認）。
 */
export async function apiPost(url: string, body?: unknown): Promise<Response> {
  return request(url, "POST", body);
}

export async function apiGet(url: string): Promise<Response> {
  return request(url, "GET");
}

export async function apiPatch(url: string, body?: unknown): Promise<Response> {
  return request(url, "PATCH", body);
}

export async function apiDelete(url: string): Promise<Response> {
  return request(url, "DELETE");
}

/**
 * レスポンスを JSON としてパースし、エラーなら ApiClientError を throw する。
 *
 * @example
 * const data = await parseResponse<{ ok: boolean }>(
 *   await apiPost("/api/auth/login", { username, password })
 * );
 */
export async function parseResponse<T = unknown>(res: Response): Promise<T> {
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiClientError(res.status, {
        error: `HTTPエラー ${res.status}`,
        status: res.status,
      });
    }
    throw new Error("レスポンスのJSONパースに失敗しました");
  }

  if (!res.ok) {
    const body = json as ApiErrorBody;
    throw new ApiClientError(res.status, {
      error:     body?.error     ?? `HTTPエラー ${res.status}`,
      code:      body?.code,
      status:    res.status,
      timestamp: body?.timestamp,
      detail:    body?.detail,
    });
  }

  return json as T;
}

/**
 * エラーコードから日本語メッセージに変換する
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    // サーバーから返ってきたメッセージをそのまま使う
    return err.body.error;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "予期しないエラーが発生しました";
}

/**
 * リダイレクト先のパスが安全かチェックする。
 * ログイン・登録・ルート・ログアウトページ自身はリダイレクト先にしない。
 */
const REDIRECT_BLOCKED_PATHS = [
  "/login",
  "/register",
  "/reset-password",
  "/",
];

export function safeRedirectPath(path: string): string {
  // オープンリダイレクト対策: 相対パスのみ許可
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  // 外部URLへのリダイレクトを防ぐ
  try {
    const url = new URL(path, "http://localhost");
    if (url.host !== "localhost") return "/dashboard";
  } catch {
    return "/dashboard";
  }
  // 認証・ルートページ自体をリダイレクト先にさせない
  const pathname = path.split("?")[0] ?? path;
  if (REDIRECT_BLOCKED_PATHS.some(p => pathname === p)) {
    return "/dashboard";
  }
  return path;
}
