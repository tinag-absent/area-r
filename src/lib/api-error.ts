/**
 * src/lib/api-error.ts
 *
 * API ルート全体で使う統一エラーハンドリング基盤。
 *
 * 使い方:
 *   import { ApiError, withErrorHandler, Errors } from "@/lib/api-error";
 *
 *   // withErrorHandler でルートをラップ（推奨）
 *   export const GET = withErrorHandler(async (req) => {
 *     if (!found) throw Errors.notFound("ユーザー");
 *     return NextResponse.json({ user });
 *   });
 *
 *   // params 付きルート
 *   export const GET = withErrorHandler(async (req, ctx) => {
 *     const { id } = await ctx.params;
 *     return NextResponse.json({ id });
 *   });
 */

import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────
// エラーコード定義
// ─────────────────────────────────────────────────────────────────────

export const ErrorCode = {
  BAD_REQUEST:        "BAD_REQUEST",
  VALIDATION_ERROR:   "VALIDATION_ERROR",
  UNAUTHORIZED:       "UNAUTHORIZED",
  FORBIDDEN:          "FORBIDDEN",
  NOT_FOUND:          "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT:           "CONFLICT",
  RATE_LIMITED:       "RATE_LIMITED",
  INTERNAL_ERROR:     "INTERNAL_ERROR",
  DB_ERROR:           "DB_ERROR",
  CONFIG_ERROR:       "CONFIG_ERROR",
} as const;

export type ErrorCodeValue = typeof ErrorCode[keyof typeof ErrorCode];

// ─────────────────────────────────────────────────────────────────────
// ApiError クラス
// ─────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status:  number,
    public override readonly message: string,
    public readonly code:    ErrorCodeValue = statusToCode(status),
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function statusToCode(status: number): ErrorCodeValue {
  const map: Record<number, ErrorCodeValue> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    429: "RATE_LIMITED",
  };
  return map[status] ?? "INTERNAL_ERROR";
}

// ─────────────────────────────────────────────────────────────────────
// エラーレスポンスの共通フォーマット
// ─────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error:      string;
  code:       ErrorCodeValue;
  status:     number;
  timestamp:  string;
  detail?:    unknown;
}

function buildErrorResponse(
  status:  number,
  message: string,
  code:    ErrorCodeValue,
  detail?: unknown,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error:     message,
    code,
    status,
    timestamp: new Date().toISOString(),
  };
  if (detail !== undefined && process.env.NODE_ENV !== "production") {
    body.detail = detail;
  }
  return NextResponse.json(body, { status });
}

// ─────────────────────────────────────────────────────────────────────
// handleApiError — catch ブロックで使う
// ─────────────────────────────────────────────────────────────────────

export function handleApiError(err: unknown): NextResponse<ApiErrorBody> {
  // アプリが意図的に throw した ApiError
  if (err instanceof ApiError) {
    return buildErrorResponse(err.status, err.message, err.code, err.detail);
  }

  // JSON パースエラー
  if (err instanceof SyntaxError) {
    return buildErrorResponse(400, "リクエストボディのJSONが不正です", "BAD_REQUEST");
  }

  // Turso / libSQL エラー
  if (isDbError(err)) {
    const msg = err instanceof Error ? (err.message ?? "") : "";
    if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT_UNIQUE")) {
      return buildErrorResponse(409, "データが重複しています。", "CONFLICT");
    }
    if (msg.includes("FOREIGN KEY")) {
      return buildErrorResponse(400, "関連するリソースが存在しません。", "VALIDATION_ERROR");
    }
    if (msg.toLowerCase().includes("connect") || msg.includes("TURSO_DATABASE_URL")) {
      console.error("[DB] 接続エラー:", msg);
      return buildErrorResponse(503, "データベースに接続できません。しばらく後に再試行してください。", "DB_ERROR");
    }
    console.error("[DB] クエリエラー:", msg);
    return buildErrorResponse(500, "データベース処理中にエラーが発生しました。", "DB_ERROR");
  }

  // 予期しないエラー
  const message = err instanceof Error ? err.message : "不明なエラー";
  console.error("[API] 未処理のエラー:", err);
  return buildErrorResponse(
    500,
    "サーバー内部エラーが発生しました。",
    "INTERNAL_ERROR",
    process.env.NODE_ENV !== "production" ? message : undefined,
  );
}

function isDbError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name ?? "";
  const msg  = err.message ?? "";
  return (
    name === "LibsqlError" ||
    name === "ResponseError" ||
    name === "DbQueryError" ||
    name === "DbConnectionError" ||
    msg.includes("SQLITE_") ||
    msg.includes("libsql")
  );
}

// ─────────────────────────────────────────────────────────────────────
// withErrorHandler — ルートハンドラを try/catch でラップする HOF
// ─────────────────────────────────────────────────────────────────────

// params なしハンドラ
type SimpleHandler = (req: NextRequest) => Promise<NextResponse>;
// params ありハンドラ（Next.js App Router 形式）
type ParamsHandler<P extends Record<string, string>> = (
  req: NextRequest,
  ctx: { params: Promise<P> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: SimpleHandler): SimpleHandler;
export function withErrorHandler<P extends Record<string, string>>(
  handler: ParamsHandler<P>
): ParamsHandler<P>;
export function withErrorHandler(
  handler: SimpleHandler | ParamsHandler<Record<string, string>>
): SimpleHandler | ParamsHandler<Record<string, string>> {
  return async (
    req: NextRequest,
    ctx?: { params: Promise<Record<string, string>> }
  ) => {
    try {
      return ctx
        ? await (handler as ParamsHandler<Record<string, string>>)(req, ctx)
        : await (handler as SimpleHandler)(req);
    } catch (err) {
      return handleApiError(err);
    }
  };
}

// ─────────────────────────────────────────────────────────────────────
// よく使うエラーのショートハンド
// ─────────────────────────────────────────────────────────────────────

/** Retry-After ヘッダー付き 429 レスポンスを生成する */
export function makeRateLimitResponse(
  retryAfterSecs: number,
  msg = "試行回数が上限に達しました。しばらく後に再試行してください。"
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error:     msg,
    code:      "RATE_LIMITED",
    status:    429,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: 429,
    headers: { "Retry-After": String(retryAfterSecs) },
  });
}

export const Errors = {
  badRequest:  (msg = "不正なリクエストです")                    => new ApiError(400, msg, "BAD_REQUEST"),
  validation:  (msg: string)                                     => new ApiError(400, msg, "VALIDATION_ERROR"),
  unauthorized:(msg = "認証が必要です")                          => new ApiError(401, msg, "UNAUTHORIZED"),
  forbidden:   (msg = "アクセス権限がありません")                => new ApiError(403, msg, "FORBIDDEN"),
  notFound:    (resource = "リソース")                           => new ApiError(404, `${resource}が見つかりません`, "NOT_FOUND"),
  conflict:    (msg = "データが既に存在します")                  => new ApiError(409, msg, "CONFLICT"),
  rateLimited: (msg = "試行回数が上限に達しました。しばらく後に再試行してください。") => new ApiError(429, msg, "RATE_LIMITED"),
  internal:    (msg = "内部エラーが発生しました")                => new ApiError(500, msg, "INTERNAL_ERROR"),
} as const;
