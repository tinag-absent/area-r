/**
 * GET    /api/admin/content?type=novel|codex   — 一覧
 * POST   /api/admin/content                    — 新規作成
 * PATCH  /api/admin/content                    — 更新・公開切替
 * DELETE /api/admin/content?id=...             — 削除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                from "crypto";

// ── GET ──────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "novel";

  const db   = getDb();
  const rows = await queryAll<{
    id: string; content_id: string; title: string; subtitle: string | null;
    category: string | null; clearance_req: number; author: string | null;
    date_label: string | null; is_published: number;
    created_at: string; updated_at: string;
  }>(db,
    `SELECT id, content_id, title, subtitle, category, clearance_req,
            author, date_label, is_published, created_at, updated_at
     FROM content_entries WHERE content_type = ?
     ORDER BY clearance_req ASC, created_at ASC`,
    [type]
  );

  return NextResponse.json(rows);
});

// ── POST ─────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    contentType:   "novel" | "codex";
    contentId:     string;
    title:         string;
    subtitle?:     string;
    category?:     string;
    clearanceReq?: number;
    author?:       string;
    dateLabel?:    string;
    body:          string;
  };

  if (!body.contentType) throw Errors.validation("contentType が必要です");
  if (!body.contentId?.trim()) throw Errors.validation("contentId が必要です");
  if (!body.title?.trim())     throw Errors.validation("title が必要です");

  const db = getDb();
  const existing = await queryOne(db,
    `SELECT id FROM content_entries WHERE content_type = ? AND content_id = ?`,
    [body.contentType, body.contentId]
  );
  if (existing) throw Errors.conflict("この content_id は既に使用されています");

  const id = randomUUID();
  await execute(db,
    `INSERT INTO content_entries
       (id, content_type, content_id, title, subtitle, category,
        clearance_req, author, date_label, body, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, body.contentType, body.contentId.trim(), body.title.trim(),
      body.subtitle?.trim() ?? null, body.category?.trim() ?? null,
      body.clearanceReq ?? 0, body.author?.trim() ?? null,
      body.dateLabel?.trim() ?? null, body.body ?? "",
      auth.user.id,
    ]
  );

  return NextResponse.json({ ok: true, id }, { status: 201 });
});

// ── PATCH ────────────────────────────────────────────────────────────

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    id:             string;
    action?:        "toggle_publish";
    title?:         string;
    subtitle?:      string;
    category?:      string;
    clearanceReq?:  number;
    author?:        string;
    dateLabel?:     string;
    body?:          string;
  };

  if (!body.id) throw Errors.validation("id が必要です");

  const db   = getDb();
  const item = await queryOne<{ is_published: number }>(db,
    `SELECT is_published FROM content_entries WHERE id = ?`, [body.id]
  );
  if (!item) throw Errors.notFound("コンテンツ");

  if (body.action === "toggle_publish") {
    await execute(db,
      `UPDATE content_entries SET is_published = ?, updated_at = datetime('now') WHERE id = ?`,
      [item.is_published ? 0 : 1, body.id]
    );
    return NextResponse.json({ ok: true, is_published: !item.is_published });
  }

  const sets: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];

  if (body.title        !== undefined) { sets.push("title = ?");         args.push(body.title); }
  if (body.subtitle     !== undefined) { sets.push("subtitle = ?");      args.push(body.subtitle ?? null); }
  if (body.category     !== undefined) { sets.push("category = ?");      args.push(body.category ?? null); }
  if (body.clearanceReq !== undefined) { sets.push("clearance_req = ?"); args.push(body.clearanceReq); }
  if (body.author       !== undefined) { sets.push("author = ?");        args.push(body.author ?? null); }
  if (body.dateLabel    !== undefined) { sets.push("date_label = ?");    args.push(body.dateLabel ?? null); }
  if (body.body         !== undefined) { sets.push("body = ?");          args.push(body.body); }

  if (sets.length === 1) throw Errors.validation("更新するフィールドがありません");
  args.push(body.id);
  await execute(db, `UPDATE content_entries SET ${sets.join(", ")} WHERE id = ?`, args);

  return NextResponse.json({ ok: true });
});

// ── DELETE ───────────────────────────────────────────────────────────

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  await execute(db, `DELETE FROM content_entries WHERE id = ?`, [id]);

  return NextResponse.json({ ok: true });
});
