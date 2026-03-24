/**
 * GET  /api/users/me/story-state — フラグ・変数・フェーズを返す
 * POST /api/users/me/story-state — 変数を更新（プレイヤー操作）
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAuth, isAuthError }  from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                from "crypto";
import type { ProgressFlagKey }      from "@/lib/types";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();

  const [flags, vars, userRow] = await Promise.all([
    queryAll<{ flag_key: ProgressFlagKey; flag_value: string; set_at: string }>(db,
      "SELECT flag_key, flag_value, set_at FROM progress_flags WHERE user_id = ? ORDER BY set_at ASC",
      [auth.user.id]
    ),
    queryAll<{ var_key: string; var_value: number }>(db,
      "SELECT var_key, var_value FROM story_variables WHERE user_id = ?",
      [auth.user.id]
    ),
    queryOne<{ clearance_level: number; xp_total: number }>(db,
      "SELECT clearance_level, xp_total FROM users WHERE id = ?",
      [auth.user.id]
    ),
  ]);

  const flagMap = Object.fromEntries(flags.map(r => [r.flag_key, r.flag_value]));
  const varMap  = Object.fromEntries(vars.map(r => [r.var_key,  r.var_value]));
  const phase   = flagMap["phase1_unlocked"] ? 2 : 1;

  return NextResponse.json({
    flags:          flagMap,
    variables:      varMap,
    phase,
    clearanceLevel: userRow?.clearance_level ?? 0,
    xpTotal:        userRow?.xp_total ?? 0,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    action:   "increment" | "set" | "delete";
    key:      string;
    value?:   number;
    delta?:   number;
  };

  if (!body.key?.trim())  throw Errors.validation("key が必要です");
  if (!/^[a-z0-9_]+$/.test(body.key)) throw Errors.validation("key は英小文字・数字・アンダースコアのみ使用可能です");

  const db = getDb();

  if (body.action === "set") {
    const val = Number(body.value ?? 0);
    if (!Number.isFinite(val)) throw Errors.validation("value が不正です");
    await execute(db,
      `INSERT INTO story_variables (id, user_id, var_key, var_value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, var_key) DO UPDATE SET var_value = excluded.var_value`,
      [randomUUID(), auth.user.id, body.key, val]
    );
    return NextResponse.json({ ok: true, key: body.key, value: val });
  }

  if (body.action === "increment") {
    const delta = Number(body.delta ?? 1);
    if (!Number.isFinite(delta)) throw Errors.validation("delta が不正です");
    const current = await queryOne<{ var_value: number }>(db,
      "SELECT var_value FROM story_variables WHERE user_id = ? AND var_key = ?",
      [auth.user.id, body.key]
    );
    const newVal = (current?.var_value ?? 0) + delta;
    await execute(db,
      `INSERT INTO story_variables (id, user_id, var_key, var_value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, var_key) DO UPDATE SET var_value = excluded.var_value`,
      [randomUUID(), auth.user.id, body.key, newVal]
    );
    return NextResponse.json({ ok: true, key: body.key, value: newVal });
  }

  if (body.action === "delete") {
    await execute(db,
      "DELETE FROM story_variables WHERE user_id = ? AND var_key = ?",
      [auth.user.id, body.key]
    );
    return NextResponse.json({ ok: true, key: body.key });
  }

  throw Errors.validation(`未知のアクション: ${body.action}`);
});
