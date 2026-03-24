/**
 * GET    /api/admin/puzzles        — 全パズル一覧（解答数付き）
 * POST   /api/admin/puzzles        — パズル作成
 * PATCH  /api/admin/puzzles        — 有効/無効切替・編集
 * DELETE /api/admin/puzzles?id=... — 削除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();
  const rows = await queryAll<{
    id: string; slug: string; title: string; cipher_text: string;
    answer: string; hint: string | null; xp_reward: number;
    clearance_req: number; is_active: number;
    created_at: string;
  }>(db,
    `SELECT id, slug, title, cipher_text, answer, hint,
            xp_reward, clearance_req, is_active, created_at
     FROM puzzle_entries ORDER BY created_at DESC`
  );

  const withCounts = await Promise.all(rows.map(async p => {
    const cnt = await queryOne<{ c: number }>(db,
      `SELECT COUNT(*) as c FROM puzzle_solves WHERE puzzle_id = ?`, [p.id]
    );
    return { ...p, solveCount: cnt?.c ?? 0 };
  }));

  return NextResponse.json(withCounts);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    slug:         string;
    title:        string;
    cipher_text:  string;
    answer:       string;
    hint?:        string;
    xp_reward?:   number;
    clearance_req?: number;
  };

  if (!body.slug?.trim())        throw Errors.validation("slug が必要です");
  if (!body.title?.trim())       throw Errors.validation("title が必要です");
  if (!body.cipher_text?.trim()) throw Errors.validation("cipher_text が必要です");
  if (!body.answer?.trim())      throw Errors.validation("answer が必要です");

  // スラグ重複チェック
  const db = getDb();
  const existing = await queryOne(db, `SELECT id FROM puzzle_entries WHERE slug = ?`, [body.slug]);
  if (existing) throw Errors.conflict("このslugは既に使用されています");

  const id = randomUUID();
  await execute(db,
    `INSERT INTO puzzle_entries
       (id, slug, title, cipher_text, answer, hint, xp_reward, clearance_req, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, body.slug.trim(), body.title.trim(),
      body.cipher_text.trim(), body.answer.trim(),
      body.hint?.trim() ?? null,
      body.xp_reward ?? 50,
      body.clearance_req ?? 0,
      auth.user.id,
    ]
  );

  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    id:           string;
    action?:      "toggle_active";
    title?:       string;
    hint?:        string;
    xp_reward?:   number;
    clearance_req?: number;
  };
  if (!body.id) throw Errors.validation("id が必要です");

  const db = getDb();
  const item = await queryOne<{ is_active: number }>(db,
    `SELECT is_active FROM puzzle_entries WHERE id = ?`, [body.id]
  );
  if (!item) throw Errors.notFound("パズル");

  if (body.action === "toggle_active") {
    await execute(db,
      `UPDATE puzzle_entries SET is_active = ? WHERE id = ?`,
      [item.is_active ? 0 : 1, body.id]
    );
    return NextResponse.json({ ok: true, is_active: !item.is_active });
  }

  // フィールド更新
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (body.title       !== undefined) { sets.push("title = ?");        args.push(body.title); }
  if (body.hint        !== undefined) { sets.push("hint = ?");         args.push(body.hint ?? null); }
  if (body.xp_reward   !== undefined) { sets.push("xp_reward = ?");    args.push(body.xp_reward); }
  if (body.clearance_req !== undefined) { sets.push("clearance_req = ?"); args.push(body.clearance_req); }

  if (sets.length === 0) throw Errors.validation("更新するフィールドがありません");
  args.push(body.id);
  await execute(db, `UPDATE puzzle_entries SET ${sets.join(", ")} WHERE id = ?`, args);

  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  await execute(db, `DELETE FROM puzzle_solves  WHERE puzzle_id = ?`, [id]);
  await execute(db, `DELETE FROM puzzle_entries WHERE id = ?`, [id]);

  return NextResponse.json({ ok: true });
});
