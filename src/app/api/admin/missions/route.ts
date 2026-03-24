/**
 * GET   /api/admin/missions         — 全ミッション一覧（レベル制限なし）
 * POST  /api/admin/missions         — 新規ミッション作成
 * PATCH /api/admin/missions?id=...  — ステータス等の更新
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

const VALID_STATUSES   = ["active", "monitoring", "completed", "failed"] as const;
const VALID_CATEGORIES = ["critical", "standard", "support"] as const;

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();
  const rows = await queryAll<{
    id: string; title: string; description: string | null;
    category: string; status: string; required_level: number;
    xp_reward: number; phase: number; assigned_division: string | null;
    issued_by: string | null; issued_at: string | null; deadline_at: string | null;
  }>(db,
    `SELECT id, title, description, category, status, required_level,
            xp_reward, phase, assigned_division, issued_by, issued_at, deadline_at
     FROM missions ORDER BY issued_at DESC`
  );
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    title?:            string;
    description?:      string;
    category?:         string;
    status?:           string;
    required_level?:   number;
    xp_reward?:        number;
    phase?:            number;
    assigned_division?: string;
    issued_by?:        string;
    deadline_at?:      string;
  };

  if (!body.title?.trim()) throw Errors.validation("title が必要です");
  if (body.title.length > 100) throw Errors.validation("title は100文字以内です");

  const category = body.category ?? "standard";
  const status   = body.status   ?? "active";
  if (!VALID_CATEGORIES.includes(category as any)) throw Errors.validation("無効な category です");
  if (!VALID_STATUSES.includes(status as any))     throw Errors.validation("無効な status です");

  const id = `MISSION-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
  const db = getDb();

  await execute(db,
    `INSERT INTO missions
       (id, title, description, category, status, required_level, xp_reward,
        phase, assigned_division, issued_by, issued_at, deadline_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),?)`,
    [
      id,
      body.title.trim(),
      body.description?.trim() ?? null,
      category,
      status,
      Number(body.required_level ?? 2),
      Number(body.xp_reward ?? 100),
      Number(body.phase ?? 1),
      body.assigned_division ?? null,
      body.issued_by ?? null,
      body.deadline_at ?? null,
    ]
  );

  const created = await queryOne(db, "SELECT * FROM missions WHERE id = ?", [id]);
  return NextResponse.json(created, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const body = await req.json() as Record<string, unknown>;

  const PATCHABLE = ["title", "description", "category", "status", "required_level",
                     "xp_reward", "phase", "assigned_division", "issued_by", "deadline_at"] as const;
  const updates: [string, unknown][] = [];

  for (const key of PATCHABLE) {
    if (key in body) {
      if (key === "status"   && !VALID_STATUSES.includes(body[key] as any))   throw Errors.validation("無効な status");
      if (key === "category" && !VALID_CATEGORIES.includes(body[key] as any)) throw Errors.validation("無効な category");
      updates.push([key, body[key]]);
    }
  }

  if (updates.length === 0) throw Errors.validation("更新するフィールドがありません");

  const db = getDb();
  const existing = await queryOne(db, "SELECT id FROM missions WHERE id = ?", [id]);
  if (!existing) throw Errors.notFound("ミッション");

  const setClauses = updates.map(([k]) => `${k} = ?`).join(", ");
  const values     = [...updates.map(([, v]) => v), id];
  await execute(db, `UPDATE missions SET ${setClauses} WHERE id = ?`, values as (string | number | null)[]);

  const updated = await queryOne(db, "SELECT * FROM missions WHERE id = ?", [id]);
  return NextResponse.json(updated);
});
