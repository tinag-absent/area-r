/**
 * GET /api/health
 *
 * ヘルスチェックエンドポイント。認証不要。
 * デプロイノートブック STEP 7 からもテストされる。
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const GET = async () => {
  // DB接続チェック
  try {
    const db = getDb();
    await db.execute("SELECT 1");
  } catch (e) {
    return NextResponse.json(
      { status: "error", db: "unreachable", ts: new Date().toISOString() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    db:     "connected",
    ts:     new Date().toISOString(),
  });
};
