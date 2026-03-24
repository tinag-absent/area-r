/**
 * Codex 管理 API
 *
 * GET    /api/admin/codex                  — 全セクション＋エントリ
 * POST   /api/admin/codex                  — エントリ作成
 * PATCH  /api/admin/codex                  — エントリ更新
 * DELETE /api/admin/codex?id=...           — エントリ削除
 *
 * セクション操作:
 * POST   /api/admin/codex?target=section   — セクション作成
 * PATCH  /api/admin/codex?target=section   — セクション更新
 * DELETE /api/admin/codex?target=section&id=... — セクション削除
 */
import { NextRequest, NextResponse }   from "next/server";
import { withErrorHandler, Errors }    from "@/lib/api-error";
import { requireAdmin, isAuthError }   from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                  from "crypto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db      = getDb();
  const sections = await queryAll<{
    id: string; label: string; title: string; icon: string;
    color: string; clearance: number; sort_order: number;
  }>(db, `SELECT * FROM codex_sections ORDER BY sort_order ASC`);

  const entries  = await queryAll<{
    id: string; section_id: string; title: string; subtitle: string | null;
    body: string; clearance: number; tags: string; sort_order: number; updated_at: string;
  }>(db, `SELECT * FROM codex_entries ORDER BY section_id, sort_order ASC`);

  const result = sections.map(s => ({
    ...s,
    entries: entries
      .filter(e => e.section_id === s.id)
      .map(e => ({
        ...e,
        tags: (() => { try { return JSON.parse(e.tags); } catch { return []; } })(),
      })),
  }));

  return NextResponse.json(result);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const b      = await req.json() as Record<string, unknown>;
  const db     = getDb();

  // ── セクション作成 ─────────────────────────────────────────────
  if (target === "section") {
    if (!b.id || !b.label || !b.title)
      throw Errors.validation("id, label, title が必要です");
    if (await queryOne(db, `SELECT id FROM codex_sections WHERE id = ?`, [b.id]))
      throw Errors.conflict("このIDは既に使用されています");
    const maxRow = await queryOne<{ m: number }>(db,
      `SELECT COALESCE(MAX(sort_order),0) AS m FROM codex_sections`
    );
    await execute(db,
      `INSERT INTO codex_sections (id,label,title,icon,color,clearance,sort_order)
       VALUES (?,?,?,?,?,?,?)`,
      [b.id, b.label, b.title, b.icon||"◈", b.color||"var(--color-primary)",
       Number(b.clearance||0), (maxRow?.m ?? 0) + 1]
    );
    return NextResponse.json({ ok: true, id: b.id }, { status: 201 });
  }

  // ── エントリ作成 ───────────────────────────────────────────────
  if (!b.section_id || !b.title)
    throw Errors.validation("section_id と title が必要です");
  if (!await queryOne(db, `SELECT id FROM codex_sections WHERE id = ?`, [b.section_id]))
    throw Errors.notFound("セクション");

  const maxRow = await queryOne<{ m: number }>(db,
    `SELECT COALESCE(MAX(sort_order),0) AS m FROM codex_entries WHERE section_id = ?`,
    [b.section_id]
  );
  const id = randomUUID();
  await execute(db,
    `INSERT INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, b.section_id, b.title, b.subtitle||null,
     b.body||"", Number(b.clearance||0),
     JSON.stringify(Array.isArray(b.tags) ? b.tags : []),
     (maxRow?.m ?? 0) + 1]
  );
  return NextResponse.json({ ok: true, id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const b      = await req.json() as Record<string, unknown>;
  const db     = getDb();

  if (!b.id) throw Errors.validation("id が必要です");

  // ── セクション更新 ─────────────────────────────────────────────
  if (target === "section") {
    if (!await queryOne(db, `SELECT id FROM codex_sections WHERE id = ?`, [b.id]))
      throw Errors.notFound("セクション");
    const sets: string[] = []; const args: (string|number|null)[] = [];
    for (const [f, col] of [["label","label"],["title","title"],["icon","icon"],
                             ["color","color"],["clearance","clearance"],["sort_order","sort_order"]] as [string,string][]) {
      if (f in b) { sets.push(`${col} = ?`); args.push(b[f] != null ? b[f] as string|number : null); }
    }
    if (!sets.length) throw Errors.validation("更新フィールドがありません");
    args.push(b.id as string);
    await execute(db, `UPDATE codex_sections SET ${sets.join(",")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  }

  // ── エントリ更新 ───────────────────────────────────────────────
  if (!await queryOne(db, `SELECT id FROM codex_entries WHERE id = ?`, [b.id]))
    throw Errors.notFound("エントリ");
  const sets: string[] = ["updated_at = datetime('now')"]; const args: (string|number|null)[] = [];
  for (const [f,col] of [["title","title"],["subtitle","subtitle"],["body","body"]] as [string,string][]) {
    if (f in b) { sets.push(`${col} = ?`); args.push(b[f] != null ? String(b[f]) : null); }
  }
  for (const f of ["clearance","sort_order"]) {
    if (f in b) { sets.push(`${f} = ?`); args.push(Number(b[f])); }
  }
  if ("tags" in b) {
    sets.push("tags = ?");
    args.push(JSON.stringify(Array.isArray(b.tags) ? b.tags : []));
  }
  if (sets.length === 1) throw Errors.validation("更新フィールドがありません");
  args.push(b.id as string);
  await execute(db, `UPDATE codex_entries SET ${sets.join(",")} WHERE id = ?`, args);
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const id     = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  if (target === "section") {
    // エントリも CASCADE 削除
    await execute(db, `DELETE FROM codex_entries WHERE section_id = ?`, [id]);
    await execute(db, `DELETE FROM codex_sections WHERE id = ?`, [id]);
  } else {
    await execute(db, `DELETE FROM codex_entries WHERE id = ?`, [id]);
  }
  return NextResponse.json({ ok: true });
});
