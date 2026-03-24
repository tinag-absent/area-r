import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { JwtPayload } from "./auth";

/**
 * ミドルウェアがインジェクトしたセッションヘッダーを読み取り、認証済みユーザーを返す。
 * ヘッダーが欠けている場合は 401 レスポンスを返す。
 */
export function requireAuth(
  req: NextRequest
): { user: JwtPayload } | NextResponse {
  const id       = req.headers.get("x-user-id");
  const role     = req.headers.get("x-user-role");
  const levelStr = req.headers.get("x-user-level");
  const agentId  = req.headers.get("x-user-agent-id");

  if (!id || !role || !levelStr || !agentId) {
    return NextResponse.json(
      { error: "認証が必要です", code: "UNAUTHORIZED", status: 401, timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  return {
    user: {
      id,
      agentId,
      role: role as import('@/lib/types').UserRole,
      level: Number(levelStr),
    },
  };
}

/**
 * `requireAuth` に加えて admin / super_admin ロールを要求する。
 */
export function requireAdmin(
  req: NextRequest
): { user: JwtPayload } | NextResponse {
  const result = requireAuth(req);
  if (isAuthError(result)) return result;
  if (!["admin", "super_admin"].includes(result.user.role)) {
    return NextResponse.json(
      { error: "管理者権限が必要です", code: "FORBIDDEN", status: 403, timestamp: new Date().toISOString() },
      { status: 403 }
    );
  }
  return result;
}

/**
 * `requireAuth` に加えて super_admin ロールを要求する。
 */
export function requireSuperAdmin(
  req: NextRequest
): { user: JwtPayload } | NextResponse {
  const result = requireAuth(req);
  if (isAuthError(result)) return result;
  if (result.user.role !== "super_admin") {
    return NextResponse.json(
      { error: "スーパー管理者権限が必要です", code: "FORBIDDEN", status: 403, timestamp: new Date().toISOString() },
      { status: 403 }
    );
  }
  return result;
}

/** 戻り値がエラーレスポンスかどうかを判定する型ガード */
export function isAuthError(
  result: { user: JwtPayload } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
