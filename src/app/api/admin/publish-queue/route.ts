/**
 * GET    /api/admin/publish-queue?status=scheduled  — 一覧取得
 * POST   /api/admin/publish-queue                   — スケジュール登録
 * PATCH  /api/admin/publish-queue                   — cancel / publish_now
 * DELETE /api/admin/publish-queue?id=...            — キャンセル済みを削除
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors }   from "@/lib/api-error";
import { requireAdmin, isAuthError }  from "@/lib/server-auth";
import { getDb, queryAll, queryOne, execute } from "@/lib/db";
import { randomUUID }                  from "crypto";

// ── GET ──────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "scheduled";

  const db = getDb();
  const rows = await queryAll<{
    id:           string;
    content_type: string;
    content_id:   string;
    title:        string;
    publish_at:   string;
    status:       string;
    notify_target: string | null;
    notify_title:  string | null;
    flag_key:      string | null;
    created_by:    string;
    created_at:    string;
    published_at:  string | null;
  }>(db,
    `SELECT id, content_type, content_id, title, publish_at, status,
            notify_target, notify_title, flag_key,
            created_by, created_at, published_at
     FROM publish_queue
     WHERE status = ?
     ORDER BY publish_at ASC
     LIMIT 100`,
    [status]
  );

  return NextResponse.json(rows);
});

// ── POST ─────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json() as {
    contentType:   string;
    contentId:     string;
    title:         string;
    publishAt:     string;
    notifyTarget?: string;
    notifyTitle?:  string;
    notifyBody?:   string;
    flagKey?:      string;
    flagValue?:    string;
  };

  if (!body.contentType) throw Errors.validation("contentType が必要です");
  if (!body.contentId)   throw Errors.validation("contentId が必要です");
  if (!body.title?.trim()) throw Errors.validation("title が必要です");
  if (!body.publishAt)   throw Errors.validation("publishAt が必要です");

  const publishDate = new Date(body.publishAt);
  if (isNaN(publishDate.getTime())) throw Errors.validation("publishAt の形式が不正です");
  if (publishDate <= new Date())    throw Errors.validation("公開日時は現在より未来に設定してください");

  // SQLite 用 UTC datetime 文字列
  const publishAtSql = publishDate.toISOString().replace("T", " ").slice(0, 19);

  const db = getDb();
  const id = randomUUID();

  await execute(db,
    `INSERT INTO publish_queue
       (id, content_type, content_id, title, publish_at,
        notify_target, notify_title, notify_body,
        flag_key, flag_value, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      body.contentType,
      body.contentId,
      body.title.trim(),
      publishAtSql,
      body.notifyTarget ?? null,
      body.notifyTitle  ?? null,
      body.notifyBody   ?? null,
      body.flagKey      ?? null,
      body.flagValue    ?? "true",
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
    id:     string;
    action: "cancel" | "publish_now";
  };

  if (!body.id)     throw Errors.validation("id が必要です");
  if (!body.action) throw Errors.validation("action が必要です");

  const db = getDb();

  const item = await queryOne<{
    status:        string;
    content_type:  string;
    content_id:    string;
    notify_target: string | null;
    notify_title:  string | null;
    notify_body:   string | null;
    flag_key:      string | null;
    flag_value:    string;
  }>(db,
    `SELECT status, content_type, content_id,
            notify_target, notify_title, notify_body,
            flag_key, flag_value
     FROM publish_queue WHERE id = ?`,
    [body.id]
  );

  if (!item) throw Errors.notFound("スケジュールアイテム");
  if (item.status !== "scheduled")
    throw Errors.validation("scheduled ステータスのアイテムのみ操作可能です");

  // ── キャンセル ──────────────────────────────────────────────────────
  if (body.action === "cancel") {
    await execute(db,
      `UPDATE publish_queue SET status = 'cancelled' WHERE id = ?`,
      [body.id]
    );
    return NextResponse.json({ ok: true, action: "cancel" });
  }

  // ── 即時公開 ────────────────────────────────────────────────────────
  if (body.action === "publish_now") {
    // 1. published_content に登録
    await execute(db,
      `INSERT OR REPLACE INTO published_content (content_type, content_id, published_at)
       VALUES (?, ?, datetime('now'))`,
      [item.content_type, item.content_id]
    );

    // 2. フラグを全プレイヤーに付与
    if (item.flag_key) {
      const players = await queryAll<{ id: string }>(db,
        `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
      );
      for (const p of players) {
        await execute(db,
          `INSERT INTO progress_flags (id, user_id, flag_key, flag_value, set_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT (user_id, flag_key)
           DO UPDATE SET flag_value = excluded.flag_value, set_at = excluded.set_at`,
          [randomUUID(), p.id, item.flag_key, item.flag_value]
        );
      }
    }

    // 3. 通知送信
    if (item.notify_title && item.notify_body && item.notify_target) {
      let targetUsers: { id: string }[] = [];

      if (item.notify_target === "all") {
        targetUsers = await queryAll<{ id: string }>(db,
          `SELECT id FROM users WHERE role = 'player' AND status = 'active'`
        );
      } else if (item.notify_target.startsWith("division:")) {
        const divId = item.notify_target.split(":")[1] ?? "";
        targetUsers = await queryAll<{ id: string }>(db,
          `SELECT id FROM users WHERE division_id = ? AND status = 'active'`,
          [divId]
        );
      }

      for (const user of targetUsers) {
        await execute(db,
          `INSERT INTO notifications (id, user_id, type, title, body)
           VALUES (?, ?, 'unlock', ?, ?)`,
          [randomUUID(), user.id, item.notify_title, item.notify_body]
        );
      }
    }

    // 4. ステータス更新
    await execute(db,
      `UPDATE publish_queue
       SET status = 'published', published_at = datetime('now')
       WHERE id = ?`,
      [body.id]
    );

    return NextResponse.json({ ok: true, action: "publish_now" });
  }

  throw Errors.validation(`未知のアクション: ${body.action}`);
});

// ── DELETE ───────────────────────────────────────────────────────────

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) throw Errors.validation("id が必要です");

  const db = getDb();
  await execute(db,
    `DELETE FROM publish_queue WHERE id = ? AND status = 'cancelled'`,
    [id]
  );

  return NextResponse.json({ ok: true });
});
