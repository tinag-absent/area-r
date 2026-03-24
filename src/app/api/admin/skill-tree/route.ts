/**
 * GET    /api/admin/skill-tree              — 解放状況・試験結果統計
 * DELETE /api/admin/skill-tree?userId=&nodeId= — ノード解放を取り消し
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const db = getDb();

  if (userId) {
    // 特定ユーザーの詳細
    const [nodes, exams, userInfo] = await Promise.all([
      queryAll<{ node_id: string; unlocked_at: string }>(db,
        `SELECT node_id, unlocked_at FROM user_skill_nodes
         WHERE user_id = ? ORDER BY unlocked_at ASC`, [userId]
      ),
      queryAll<{ skill_id: string; score: number; total: number; passed: number; taken_at: string }>(db,
        `SELECT skill_id, score, total, passed, taken_at
         FROM skill_exam_results WHERE user_id = ? ORDER BY taken_at DESC`, [userId]
      ),
      queryOne<{ agent_id: string; username: string; clearance_level: number }>(db,
        `SELECT agent_id, username, clearance_level FROM users WHERE id = ?`, [userId]
      ),
    ]);
    return NextResponse.json({ userId, userInfo, nodes, exams });
  }

  // 集計統計
  const [popularNodes, examStats, topUnlockers] = await Promise.all([
    queryAll<{ node_id: string; cnt: number }>(db,
      `SELECT node_id, COUNT(*) AS cnt FROM user_skill_nodes
       GROUP BY node_id ORDER BY cnt DESC LIMIT 20`
    ),
    queryAll<{ skill_id: string; total_attempts: number; pass_rate: number }>(db,
      `SELECT skill_id,
              COUNT(*) AS total_attempts,
              ROUND(AVG(passed)*100, 1) AS pass_rate
       FROM skill_exam_results
       GROUP BY skill_id ORDER BY total_attempts DESC`
    ),
    queryAll<{ agent_id: string; username: string; node_count: number }>(db,
      `SELECT u.agent_id, u.username, COUNT(n.node_id) AS node_count
       FROM user_skill_nodes n JOIN users u ON u.id = n.user_id
       GROUP BY n.user_id ORDER BY node_count DESC LIMIT 10`
    ),
  ]);

  return NextResponse.json({ popularNodes, examStats, topUnlockers });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const nodeId = searchParams.get("nodeId");

  if (!userId || !nodeId) throw Errors.validation("userId と nodeId が必要です");

  const db = getDb();
  await execute(db,
    `DELETE FROM user_skill_nodes WHERE user_id = ? AND node_id = ?`, [userId, nodeId]
  );
  return NextResponse.json({ ok: true });
});
