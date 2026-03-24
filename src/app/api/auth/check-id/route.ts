/**
 * GET /api/auth/check-id?agentId=K-XXX-000
 *
 * エージェントIDの重複確認 + 秘密の質問取得（パスワードリセット用）
 * 未認証で呼び出し可能。
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { getDb, queryOne } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const agentId = req.nextUrl.searchParams.get("agentId")?.trim();

  if (!agentId || agentId.length < 3 || agentId.length > 20) {
    throw Errors.badRequest("agentId は 3〜20 文字で指定してください");
  }

  const db  = getDb();
  const row = await queryOne<{ id: string; secret_question: string | null }>(
    db,
    "SELECT id, secret_question FROM users WHERE LOWER(agent_id) = LOWER(?)",
    [agentId]
  );

  if (!row) {
    // ユーザー列挙対策: 存在しない場合も同じ形で返す
    return NextResponse.json({ available: true, secretQuestion: null });
  }

  return NextResponse.json({
    available: false,
    secretQuestion: row.secret_question ?? null,
  });
});
