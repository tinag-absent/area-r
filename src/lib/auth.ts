import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb, queryOne } from "./db";
import type { UserRole, UserStatus } from "./types";
import { LEVEL_THRESHOLDS } from "./constants";

// ─── JWT Secret ──────────────────────────────────────────────────────
/** JWT署名に使うシークレットを取得する（遅延評価 — ビルド時には実行されない） */
function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production")
      throw new Error("[auth] JWT_SECRET is not set in production");
    return new TextEncoder().encode("dev-only-jwt-secret-change-in-production");
  }
  return new TextEncoder().encode(s);
}

// ─── 型定義 ──────────────────────────────────────────────────────────

export interface JwtPayload {
  id:      string;
  agentId: string;
  role:    UserRole;   // TYPE-2: string → UserRole リテラル型
  level:   number;
}

export interface DbUser {
  id:                    string;
  agent_id:              string;
  username:              string;
  password_hash:         string;
  email:                 string | null;
  display_name:          string | null;
  division_id:           string | null;
  role:                  UserRole;    // TYPE-1: string → UserRole
  status:                UserStatus;  // TYPE-1: string → UserStatus
  clearance_level:       number;
  xp_total:              number;
  anomaly_score:         number;
  observer_load:         number;
  consecutive_login_days: number;
  last_login_at:         string | null;
  login_count:           number;
  secret_question:       string | null;
  secret_answer_hash:    string | null;
  created_at:            string;
  password_changed_at:   string | null;
}

// ─── JWT ─────────────────────────────────────────────────────────────

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/** SEC-5: ペイロードの必須フィールドを検証してからキャストする */
function isValidJwtPayload(p: unknown): p is JwtPayload {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id      === "string" && obj.id.length > 0 &&
    typeof obj.agentId === "string" && obj.agentId.length > 0 &&
    typeof obj.role    === "string" && obj.role.length > 0 &&
    typeof obj.level   === "number"
  );
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // SEC-5: 署名検証後にフィールドの存在・型を確認してから返す
    if (!isValidJwtPayload(payload)) return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Cookie ─────────────────────────────────────────────────────────

export const COOKIE_NAME = "kai_token";

export function setAuthCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   60 * 60 * 24 * 7,
    path:     "/",
  });
  return res;
}

export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}

// ─── パスワード ──────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Cookie からセッションを取得（ミドルウェア用） ───────────────────

const BLOCKED_STATUSES: UserStatus[] = ["banned", "suspended", "inactive"];

export async function getSessionFromCookie(
  token: string
): Promise<JwtPayload | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  // DB で status を確認（banned / suspended / inactive は無効）
  const db   = getDb();
  const user = await queryOne<{ status: UserStatus; password_changed_at: string | null }>(
    db,
    "SELECT status, password_changed_at FROM users WHERE id = ?",
    [payload.id]
  );
  if (!user) return null;
  if (BLOCKED_STATUSES.includes(user.status)) return null;

  return payload;
}

// ─── Full DB user (for API routes) ───────────────────────────────────

export async function getAuthUser(req: NextRequest): Promise<DbUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");
  const user = await queryOne<DbUser>(
    db,
    "SELECT * FROM users WHERE id = ?",
    [payload.id]
  );
  if (!user) return null;
  if (BLOCKED_STATUSES.includes(user.status)) return null;
  return user;
}

// ─── レベル計算 ──────────────────────────────────────────────────────
// LEVEL_THRESHOLDS は constants.ts から import

export function calculateLevel(xp: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && xp >= threshold) { level = i; break; }
  }
  return level;
}

// ─── 安全なリダイレクト先を返す ─────────────────────────────────────

const BLOCKED_PATHS = ["/", "/login", "/register"];

export function getSafeRedirect(from: string | null, role: UserRole, level: number): string {
  if (!from) return "/dashboard";
  if (BLOCKED_PATHS.includes(from)) return "/dashboard";
  if (from.startsWith("/api/") || from.startsWith("/_next/")) return "/dashboard";
  if (from.startsWith("http") || from.startsWith("//")) return "/dashboard";
  if (from.startsWith("/admin") && !["admin", "super_admin"].includes(role)) return "/dashboard";
  if (from === "/console"    && level < 3) return "/dashboard";
  if (from === "/missions"   && level < 2) return "/dashboard";
  if (from === "/classified" && level !== 5) return "/dashboard";
  return from;
}
