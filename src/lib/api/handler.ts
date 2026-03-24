/**
 * src/lib/api/handler.ts
 *
 * 統一APIルートハンドラーヘルパー。
 *
 * 使い方:
 *
 *   // プレイヤー認証のみ
 *   export const GET = createRoute({
 *     auth: "player",
 *     handler: async ({ req, user, db }) => {
 *       const rows = await queryAll(db, "SELECT ...");
 *       return NextResponse.json(rows);
 *     },
 *   });
 *
 *   // 管理者 + Zodバリデーション + params
 *   export const POST = createRoute({
 *     auth: "admin",
 *     bodySchema: z.object({ title: z.string().min(1) }),
 *     handler: async ({ body, db }) => {
 *       await execute(db, "INSERT ...", [body.title]);
 *       return NextResponse.json({ ok: true }, { status: 201 });
 *     },
 *   });
 *
 *   // params付きルート（動的セグメント）
 *   export const GET = createParamsRoute<{ id: string }>({
 *     auth: "player",
 *     handler: async ({ params, user, db }) => {
 *       const row = await queryOne(db, "SELECT * FROM ... WHERE id=?", [params.id]);
 *       if (!row) throw Errors.notFound("リソース");
 *       return NextResponse.json(row);
 *     },
 *   });
 *
 * 特徴:
 *   - requireAuth / requireAdmin の呼び出し・isAuthError チェックを自動化
 *   - Zodスキーマが与えられた場合、req.json() のパース・バリデーションを自動実行
 *   - try/catch は withErrorHandler に委譲（二重ラップなし）
 *   - auth: "none" で認証スキップ（公開エンドポイント用）
 */

import { NextRequest, NextResponse }                   from "next/server";
import { withErrorHandler, Errors }                    from "@/lib/api-error";
import { requireAuth, requireAdmin,
         requireSuperAdmin, isAuthError }              from "@/lib/server-auth";
import { getDb }                                       from "@/lib/db";
import type { Client }                                 from "@libsql/client";
import type { JwtPayload }                             from "@/lib/auth";
import type { ZodType }                                from "zod";

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

/** ハンドラーに渡されるコンテキスト */
export interface RouteContext<TBody = undefined, TParams extends Record<string,string> = Record<string,never>> {
  req:    NextRequest;
  db:     Client;
  user:   JwtPayload;          // auth: "none" のときは空のダミー値
  body:   TBody;               // bodySchema指定時のみ型付き
  params: TParams;             // createParamsRoute のみ
  query:  URLSearchParams;     // req.nextUrl.searchParams の alias
}

export type AuthLevel = "none" | "player" | "admin" | "super_admin";

export interface RouteConfig<TBody, TParams extends Record<string,string>> {
  auth:         AuthLevel;
  bodySchema?:  ZodType<TBody>;
  handler:      (ctx: RouteContext<TBody, TParams>) => Promise<NextResponse>;
}

// ─────────────────────────────────────────────────────────────────────
// 内部: 認証チェック
// ─────────────────────────────────────────────────────────────────────

const DUMMY_USER: JwtPayload = { id: "", agentId: "", role: "player", level: 0 };

function resolveAuth(
  auth: AuthLevel,
  req:  NextRequest
): { user: JwtPayload } | NextResponse {
  if (auth === "none")         return { user: DUMMY_USER };
  if (auth === "super_admin")  return requireSuperAdmin(req);
  if (auth === "admin")        return requireAdmin(req);
  return requireAuth(req);
}

// ─────────────────────────────────────────────────────────────────────
// 内部: bodyのパースとバリデーション
// ─────────────────────────────────────────────────────────────────────

async function parseBody<TBody>(
  req:    NextRequest,
  schema: ZodType<TBody> | undefined
): Promise<TBody | undefined> {
  if (!schema) return undefined;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw Errors.badRequest("リクエストボディが不正なJSONです");
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues;
    const first  = issues[0];
    const msg    = first ? `${first.path.join(".")}: ${first.message}` : "バリデーションエラー";
    throw Errors.validation(msg);
  }
  return result.data;
}

// ─────────────────────────────────────────────────────────────────────
// createRoute — params なしルート用
// ─────────────────────────────────────────────────────────────────────

export function createRoute<TBody = undefined>(
  config: RouteConfig<TBody, Record<string,never>>
): (req: NextRequest) => Promise<NextResponse> {
  return withErrorHandler(async (req: NextRequest) => {
    // 1. 認証
    const authResult = resolveAuth(config.auth, req);
    if (isAuthError(authResult)) return authResult;

    // 2. Zodバリデーション
    const body = await parseBody(req, config.bodySchema) as TBody;

    // 3. ハンドラー実行
    return config.handler({
      req,
      db:     getDb(),
      user:   authResult.user,
      body,
      params: {} as Record<string,never>,
      query:  req.nextUrl.searchParams,
    });
  });
}

// ─────────────────────────────────────────────────────────────────────
// createParamsRoute — 動的セグメント（params）付きルート用
// ─────────────────────────────────────────────────────────────────────

export function createParamsRoute<
  TParams extends Record<string, string>,
  TBody = undefined,
>(
  config: RouteConfig<TBody, TParams>
): (req: NextRequest, ctx: { params: Promise<TParams> }) => Promise<NextResponse> {
  return withErrorHandler(async (
    req: NextRequest,
    ctx: { params: Promise<TParams> }
  ) => {
    // 1. 認証
    const authResult = resolveAuth(config.auth, req);
    if (isAuthError(authResult)) return authResult;

    // 2. params解決
    const params = await ctx.params;

    // 3. Zodバリデーション
    const body = await parseBody(req, config.bodySchema) as TBody;

    // 4. ハンドラー実行
    return config.handler({
      req,
      db:   getDb(),
      user: authResult.user,
      body,
      params,
      query: req.nextUrl.searchParams,
    });
  }) as (req: NextRequest, ctx: { params: Promise<TParams> }) => Promise<NextResponse>;
}
