/**
 * POST /api/push   — 購読登録
 * DELETE /api/push — 購読解除
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAuth, isAuthError }  from "@/lib/server-auth";
import { getDb, execute, queryOne }  from "@/lib/db";
import { randomUUID }                from "crypto";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth)
    throw Errors.validation("endpoint と keys が必要です");

  const db = getDb();
  const ua = req.headers.get("user-agent")?.slice(0, 200) ?? null;

  await execute(db,
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (endpoint) DO UPDATE SET
       user_id = excluded.user_id,
       p256dh  = excluded.p256dh,
       auth    = excluded.auth`,
    [randomUUID(), auth.user.id, body.endpoint, body.keys.p256dh, body.keys.auth, ua]
  );

  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  if (!endpoint) throw Errors.validation("endpoint が必要です");

  const db = getDb();
  await execute(db,
    `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
    [auth.user.id, endpoint]
  );

  return NextResponse.json({ ok: true });
});
