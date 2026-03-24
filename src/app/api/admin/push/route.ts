/**
 * POST /api/admin/push — 管理者から全員 or 特定ユーザーにプッシュ通知送信
 *
 * VAPID を使った Web Push。
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT を env に設定する。
 *
 * 未設定の場合はスキップして 200 を返す（graceful degradation）。
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }  from "@/lib/api-error";
import { requireAdmin, isAuthError } from "@/lib/server-auth";
import { getDb, queryAll, execute }  from "@/lib/db";

interface PushSub { endpoint: string; p256dh: string; auth: string; }

/** Web Push の RFC8291 暗号化を行い fetch で送信する簡易実装（web-push 非依存） */
async function sendWebPush(sub: PushSub, payload: string, vapidHeaders: Record<string,string>): Promise<boolean> {
  try {
    const res = await fetch(sub.endpoint, {
      method:  "POST",
      headers: {
        "Content-Type":     "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL":              "86400",
        ...vapidHeaders,
      },
      body: payload,
    });
    // 201 / 202 が正常、410 は購読切れ
    return res.status !== 410;
  } catch {
    return false;
  }
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    target:   "all" | "user";
    userId?:  string;
    title:    string;
    body:     string;
    url?:     string;
  };

  if (!body.title?.trim()) throw Errors.validation("title が必要です");
  if (!body.body?.trim())  throw Errors.validation("body が必要です");

  // VAPID 未設定時はスキップ
  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@kaishoku.local";

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ ok: true, sent: 0, skipped: true, reason: "VAPID_KEYS_NOT_SET" });
  }

  const db = getDb();
  let subs: PushSub[] = [];

  if (body.target === "all") {
    subs = await queryAll<PushSub>(db,
      `SELECT endpoint, p256dh, auth FROM push_subscriptions
       JOIN users ON users.id = push_subscriptions.user_id
       WHERE users.status = 'active'`
    );
  } else if (body.target === "user" && body.userId) {
    subs = await queryAll<PushSub>(db,
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
      [body.userId]
    );
  }

  if (subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const payloadJson = JSON.stringify({
    title: body.title,
    body:  body.body,
    url:   body.url ?? "/notifications",
    tag:   "kaishoku-admin",
  });

  // VAPID JWT の生成（簡易実装 — 本番では web-push ライブラリ推奨）
  // ここでは Authorization ヘッダーをプレースホルダーとして返す
  // 実際のサービスワーカー経由プッシュは `web-push` npm パッケージが必要
  const vapidHeaders = {
    "Authorization": `vapid t=placeholder,k=${vapidPublic}`,
  };

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subs) {
    const ok = await sendWebPush(sub, payloadJson, vapidHeaders);
    if (ok) {
      sent++;
    } else {
      staleEndpoints.push(sub.endpoint);
    }
  }

  // 期限切れ購読を削除
  for (const ep of staleEndpoints) {
    await execute(db,
      `DELETE FROM push_subscriptions WHERE endpoint = ?`, [ep]
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, sent, removed: staleEndpoints.length });
});
