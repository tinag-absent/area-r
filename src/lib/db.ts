import { createClient, type Client, type LibsqlError, type InValue } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined;
}

// ─────────────────────────────────────────────────────────────────────
// 接続管理
// ─────────────────────────────────────────────────────────────────────

export function getDb(): Client {
  if (!globalThis.__db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new DbConnectionError(
        "TURSO_DATABASE_URL が設定されていません。環境変数を確認してください。"
      );
    }
    globalThis.__db = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return globalThis.__db;
}

// ─────────────────────────────────────────────────────────────────────
// カスタムエラークラス
// ─────────────────────────────────────────────────────────────────────

export class DbConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbConnectionError";
  }
}

export class DbQueryError extends Error {
  public readonly sql?: string;
  public readonly queryError?: unknown;
  constructor(
    message: string,
    sql?: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "DbQueryError";
    this.sql = sql;
    this.queryError = cause;
  }
}

/** Turso/libSQLのエラーかどうかを判定 */
function isLibsqlError(err: unknown): err is LibsqlError {
  return (
    err instanceof Error && (
      err.name === "LibsqlError" ||
      err.name === "ResponseError" ||
      (err.message ?? "").includes("SQLITE_")
    )
  );
}

/** DB エラーを適切な DbQueryError / DbConnectionError に変換 */
function wrapDbError(err: unknown, sql?: string): never {
  if (err instanceof DbConnectionError || err instanceof DbQueryError) {
    throw err;
  }
  if (isLibsqlError(err)) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("TURSO_DATABASE_URL") || msg.toLowerCase().includes("connect")) {
      throw new DbConnectionError(`DB接続エラー: ${msg}`);
    }
    throw new DbQueryError(msg, sql, err);
  }
  throw new DbQueryError(
    err instanceof Error ? err.message : "不明なDBエラー",
    sql,
    err
  );
}

// ─────────────────────────────────────────────────────────────────────
// クエリユーティリティ（エラーラップ付き）
// ─────────────────────────────────────────────────────────────────────

export async function execute(
  db: Client,
  sql: string,
  args: unknown[] = []
) {
  try {
    return await db.execute({ sql, args: args as InValue[] });
  } catch (err) {
    wrapDbError(err, sql);
  }
}

export async function queryOne<T = Record<string, unknown>>(
  db: Client,
  sql: string,
  args: unknown[] = []
): Promise<T | null> {
  try {
    const res = await db.execute({ sql, args: args as InValue[] });
    if (res.rows.length === 0) return null;
    return res.rows[0] as unknown as T;
  } catch (err) {
    wrapDbError(err, sql);
  }
}

export async function queryAll<T = Record<string, unknown>>(
  db: Client,
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  try {
    const res = await db.execute({ sql, args: args as InValue[] });
    return res.rows as unknown as T[];
  } catch (err) {
    wrapDbError(err, sql);
  }
}

export async function initDb(db: Client) {
  await db.execute("PRAGMA foreign_keys = ON");
}

import type { ProgressFlags, ProgressFlagKey } from "./types";

export async function queryProgressFlags(
  db: Client,
  userId: string
): Promise<ProgressFlags> {
  const rows = await db.execute({
    sql:  "SELECT flag_key, flag_value FROM progress_flags WHERE user_id = ?",
    args: [userId],
  });
  const flags: ProgressFlags = {};
  for (const r of rows.rows) {
    const key = String(r.flag_key  ?? "") as ProgressFlagKey;
    const val = String(r.flag_value ?? "");
    if (key) flags[key] = val;
  }
  return flags;
}
