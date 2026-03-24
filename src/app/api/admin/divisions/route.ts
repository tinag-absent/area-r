/**
 * GET   /api/admin/divisions      — 部門一覧＋所属人数
 * PATCH /api/admin/divisions      — 部門情報更新
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db   = getDb();
  const divs = await queryAll<{
    id: string; name: string; name_en: string; description: string | null; color: string | null;
  }>(db, `SELECT id, name, name_en, description, color FROM divisions ORDER BY id`);

  const withStats = await Promise.all(divs.map(async d => {
    const stats = await queryOne<{ total: number; active: number; avg_level: number }>(db,
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
              ROUND(AVG(clearance_level),1) AS avg_level
       FROM users WHERE division_id = ? AND role = 'player'`,
      [d.id]
    );
    return {
      ...d,
      memberCount:  stats?.total    ?? 0,
      activeCount:  stats?.active   ?? 0,
      avgLevel:     stats?.avg_level ?? 0,
    };
  }));

  return NextResponse.json(withStats);
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    id:          string;
    name?:       string;
    name_en?:    string;
    description?: string;
    color?:      string;
  };
  if (!body.id) throw Errors.validation("id が必要です");

  const db = getDb();
  if (!await queryOne(db, `SELECT id FROM divisions WHERE id = ?`, [body.id]))
    throw Errors.notFound("部門");

  const sets: string[] = [];
  const args: (string | null)[] = [];
  if (body.name        !== undefined) { sets.push("name = ?");        args.push(body.name); }
  if (body.name_en     !== undefined) { sets.push("name_en = ?");     args.push(body.name_en); }
  if (body.description !== undefined) { sets.push("description = ?"); args.push(body.description ?? null); }
  if (body.color       !== undefined) { sets.push("color = ?");       args.push(body.color ?? null); }

  if (sets.length === 0) throw Errors.validation("更新フィールドがありません");
  args.push(body.id);
  await execute(db, `UPDATE divisions SET ${sets.join(", ")} WHERE id = ?`, args);

  return NextResponse.json({ ok: true });
});
