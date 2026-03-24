/**
 * GET  /api/cipher  — アクティブなパズル一覧（自分の解答状況付き）
 * POST /api/cipher  — 解答試行
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }         from "next/server";
import { createRoute }          from "@/lib/api/handler";
import { queryAll, queryOne, execute } from "@/lib/db";
import { Errors }               from "@/lib/api-error";
import { randomUUID }           from "crypto";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user }) => {
    const puzzles = await queryAll<{
      id: string; slug: string; title: string;
      cipher_text: string; hint: string | null;
      xp_reward: number; clearance_req: number;
    }>(db,
      `SELECT id, slug, title, cipher_text, hint, xp_reward, clearance_req
       FROM puzzle_entries
       WHERE is_active = 1 AND clearance_req <= ?
       ORDER BY clearance_req ASC, created_at ASC`,
      [user.level]
    );
    const solved = await queryAll<{ puzzle_id: string }>(db,
      `SELECT puzzle_id FROM puzzle_solves WHERE user_id = ?`,
      [user.id]
    );
    const solvedSet = new Set(solved.map(s => s.puzzle_id));
    return NextResponse.json(puzzles.map(p => ({ ...p, solved: solvedSet.has(p.id) })));
  },
});

export const POST = createRoute<{ slug: string; answer: string }>({
  auth: "player",
  handler: async ({ db, user, body }) => {
    if (!body.slug)   throw Errors.validation("slug が必要です");
    if (!body.answer) throw Errors.validation("answer が必要です");

    const puzzle = await queryOne<{
      id: string; answer: string; xp_reward: number; clearance_req: number; title: string;
    }>(db,
      `SELECT id, answer, xp_reward, clearance_req, title
       FROM puzzle_entries WHERE slug = ? AND is_active = 1`,
      [body.slug]
    );

    if (!puzzle) throw Errors.notFound("パズル");
    if (puzzle.clearance_req > user.level)
      throw Errors.forbidden("クリアランスが不足しています");

    const norm = (s: string) =>
      s.toUpperCase().replace(/[　 ]/g, "").replace(/[Ａ-Ｚａ-ｚ０-９]/g, c =>
        String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
      );
    const correct = norm(body.answer) === norm(puzzle.answer);
    if (!correct) return NextResponse.json({ ok: false, correct: false, message: "解答が違います" });

    const alreadySolved = await queryOne(db,
      `SELECT id FROM puzzle_solves WHERE puzzle_id = ? AND user_id = ?`,
      [puzzle.id, user.id]
    );
    let xpGranted = 0;
    if (!alreadySolved) {
      await execute(db, `INSERT INTO puzzle_solves (id, puzzle_id, user_id) VALUES (?, ?, ?)`,
        [randomUUID(), puzzle.id, user.id]);
      await execute(db, `UPDATE users SET xp_total = xp_total + ? WHERE id = ?`,
        [puzzle.xp_reward, user.id]);
      await execute(db, `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'puzzle_solve', ?)`,
        [randomUUID(), user.id, puzzle.xp_reward]);
      await execute(db, `INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, 'xp', ?, ?)`,
        [randomUUID(), user.id, `暗号解読完了: ${puzzle.title}`, `+${puzzle.xp_reward} XP を獲得しました。`]);
      xpGranted = puzzle.xp_reward;
    }
    return NextResponse.json({
      ok: true, correct: true, firstSolve: !alreadySolved, xpGranted,
      message: alreadySolved ? "正解です（解答済み）" : `正解！ +${xpGranted} XP`,
    });
  },
});
