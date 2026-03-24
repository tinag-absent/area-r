/**
 * GET  /api/skill-exam?skillId=xxx  — 特定スキルのテスト結果取得
 * GET  /api/skill-exam              — 全テスト結果取得
 * POST /api/skill-exam              — テスト結果を保存
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }                  from "next/server";
import { createRoute }                   from "@/lib/api/handler";
import { queryAll, queryOne, execute }   from "@/lib/db";
import { Errors }                        from "@/lib/api-error";
import { SKILL_EXAMS }                   from "@/app/(app)/skill-tree/examData";
import { randomUUID }                    from "crypto";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db, user, query }) => {
    const skillId = query.get("skillId");
    if (skillId) {
      const row = await queryOne<{
        skill_id: string; score: number; total: number; passed: number; taken_at: string;
      }>(db,
        `SELECT skill_id, score, total, passed, taken_at
         FROM skill_exam_results WHERE user_id = ? AND skill_id = ?`,
        [user.id, skillId]
      );
      return NextResponse.json(row ?? null);
    }
    const rows = await queryAll<{
      skill_id: string; score: number; total: number; passed: number; taken_at: string;
    }>(db,
      `SELECT skill_id, score, total, passed, taken_at
       FROM skill_exam_results WHERE user_id = ? ORDER BY taken_at DESC`,
      [user.id]
    );
    return NextResponse.json(rows);
  },
});

export const POST = createRoute<{ skillId: string; answers: number[] }>({
  auth: "player",
  handler: async ({ db, user, body }) => {
    const { skillId, answers } = body;
    if (!skillId || typeof skillId !== "string") throw Errors.validation("skillId が必要です");
    if (!Array.isArray(answers)) throw Errors.validation("answers が必要です");

    const exam = SKILL_EXAMS.find(e => e.skillId === skillId);
    if (!exam) throw Errors.notFound("テスト");
    if (answers.length !== exam.questions.length)
      throw Errors.validation(`回答数が不正です（期待: ${exam.questions.length}）`);

    const score  = exam.questions.filter((q, i) => answers[i] === q.correct).length;
    const total  = exam.questions.length;
    const passed = score >= exam.passMark ? 1 : 0;

    await db.execute("PRAGMA foreign_keys = ON");
    const existing = await queryOne<{ id: string }>(db,
      `SELECT id FROM skill_exam_results WHERE user_id = ? AND skill_id = ?`,
      [user.id, skillId]
    );

    if (existing) {
      await execute(db,
        `UPDATE skill_exam_results
         SET score = ?, total = ?, passed = ?, taken_at = datetime('now')
         WHERE id = ?`,
        [score, total, passed, existing.id]
      );
    } else {
      await execute(db,
        `INSERT INTO skill_exam_results (id, user_id, skill_id, score, total, passed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), user.id, skillId, score, total, passed]
      );
    }

    let xpGained = 0;
    if (passed && !existing) {
      xpGained = 100;
      await execute(db,
        `INSERT INTO xp_logs (id, user_id, activity, xp_gained) VALUES (?, ?, 'skill_exam_pass', ?)`,
        [randomUUID(), user.id, xpGained]);
      await execute(db,
        `UPDATE users SET xp_total = xp_total + ? WHERE id = ?`,
        [xpGained, user.id]);
    }

    return NextResponse.json({
      score, total, passed: !!passed,
      passMark: exam.passMark,
      xpGained,
      detail: exam.questions.map((q, i) => ({
        questionId:  q.id,
        correct:     answers[i] === q.correct,
        yourAnswer:  answers[i],
        rightAnswer: q.correct,
        hint: answers[i] !== q.correct ? q.hint : undefined,
      })),
    });
  },
});
