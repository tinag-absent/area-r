/**
 * GET    /api/admin/novel         — 全記録文書一覧
 * POST   /api/admin/novel         — 新規作成（Zodバリデーション）
 * PATCH  /api/admin/novel         — 更新（Zodバリデーション）
 * DELETE /api/admin/novel?id=...  — 削除
 * Updated: 2026-03-23 — createRoute + Zod に移行
 */
import { NextResponse }                  from "next/server";
import { createRoute }                   from "@/lib/api/handler";
import { queryAll, queryOne, execute }   from "@/lib/db";
import { Errors }                        from "@/lib/api-error";
import { randomUUID }                    from "crypto";
import { NovelPostSchema, NovelPatchSchema } from "@/lib/api/schemas";

export const GET = createRoute({
  auth: "admin",
  handler: async ({ db, query }) => {
    const withContent = query.get("content") === "1";
    const cols = withContent
      ? "id,title,subtitle,clearance,category,date,author,content,is_published,sort_order,updated_at"
      : "id,title,subtitle,clearance,category,date,author,is_published,sort_order,updated_at";
    const rows = await queryAll(db,
      `SELECT ${cols} FROM novel_documents ORDER BY sort_order ASC, clearance ASC`
    );
    return NextResponse.json(rows);
  },
});

export const POST = createRoute({
  auth: "admin",
  bodySchema: NovelPostSchema,
  handler: async ({ db, body }) => {
    const maxRow = await queryOne<{ m: number }>(db,
      `SELECT COALESCE(MAX(sort_order),0) AS m FROM novel_documents`
    );
    const id = randomUUID();
    await execute(db,
      `INSERT INTO novel_documents
         (id,title,subtitle,clearance,category,date,author,content,is_published,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, body.title.trim(), body.subtitle ?? null, body.clearance,
       body.category, body.date, body.author, body.content,
       body.is_published ? 1 : 0, (maxRow?.m ?? 0) + 1]
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  },
});

export const PATCH = createRoute({
  auth: "admin",
  bodySchema: NovelPatchSchema,
  handler: async ({ db, body }) => {
    if (!await queryOne(db, `SELECT id FROM novel_documents WHERE id = ?`, [body.id]))
      throw Errors.notFound("記録文書");

    const sets: string[] = ["updated_at = datetime('now')"];
    const args: unknown[] = [];

    const strFields = ["title","subtitle","category","date","author","content"] as const;
    const numFields = ["clearance","sort_order"] as const;

    for (const f of strFields) {
      if (body[f] !== undefined) { sets.push(`${f} = ?`); args.push(body[f] ?? null); }
    }
    for (const f of numFields) {
      if (body[f] !== undefined) { sets.push(`${f} = ?`); args.push(body[f]); }
    }
    if (body.is_published !== undefined) {
      sets.push("is_published = ?"); args.push(body.is_published ? 1 : 0);
    }
    if (sets.length === 1) throw Errors.validation("更新フィールドがありません");

    args.push(body.id);
    await execute(db, `UPDATE novel_documents SET ${sets.join(",")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  },
});

export const DELETE = createRoute({
  auth: "admin",
  handler: async ({ db, query }) => {
    const id = query.get("id");
    if (!id) throw Errors.validation("id が必要です");
    await execute(db, `DELETE FROM novel_documents WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  },
});
