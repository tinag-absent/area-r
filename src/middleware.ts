import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forbidden",
  "/favicon.ico",
  "/_next",
  "/images",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/check-id",
  "/api/auth/secret-question",
  "/api/health",
];

const LEVEL_GATED: { path: string; minLevel: number; exact?: boolean }[] = [
  { path: "/map",               minLevel: 1 },
  { path: "/database",          minLevel: 2 },
  { path: "/console",           minLevel: 3 },
  { path: "/classified",        minLevel: 5, exact: true },
  { path: "/cipher",            minLevel: 2 },
  { path: "/events",            minLevel: 0 },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 公開パスはそのまま通過
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. CSRF対策: 状態変更リクエストには X-Requested-With が必要
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const xrw = req.headers.get("X-Requested-With");
    if (!xrw && pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 3. スプーフィングされたセッションヘッダーを除去
  const headers = new Headers(req.headers);
  headers.delete("x-user-id");
  headers.delete("x-user-role");
  headers.delete("x-user-level");
  headers.delete("x-user-agent-id");

  // 4. セッション検証
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // ログイン・登録・ルート自身は from に含めない（ログイン後にダッシュボードへ）
    const AUTH_PATHS = ["/login", "/register", "/reset-password", "/"];
    if (!AUTH_PATHS.includes(pathname)) {
      url.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(url);
  }

  const session = await getSessionFromCookie(token);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "セッションが無効です" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }

  // 5. レベルゲート
  for (const gate of LEVEL_GATED) {
    const match = gate.exact
      ? pathname === gate.path
      : pathname.startsWith(gate.path);
    if (match && session.level < gate.minLevel) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "クリアランスレベルが不足しています" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  // 6. 管理者ゲート
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!["admin", "super_admin"].includes(session.role)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "権限がありません" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  // 7. セッション情報をヘッダーにインジェクト
  headers.set("x-user-id", session.id);
  headers.set("x-user-role", session.role);
  headers.set("x-user-level", String(session.level));
  headers.set("x-user-agent-id", session.agentId);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
