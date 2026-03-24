/**
 * POST /api/auth/register
 *
 * メール認証付き新規登録エンドポイント。
 *
 * フロー:
 *   action: "request"  — 仮ユーザー作成 + OTP 発行
 *                        クライアントが EmailJS でメール送信
 *   action: "verify"   — OTP 検証 → ステータスを active に昇格 → JWT 発行
 *
 * レガシー互換:
 *   action 未指定 (旧フォーマット) — emailjsReady=false 環境向け即時登録
 *                                   email フィールドがなければ即時 active
 */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors, makeRateLimitResponse } from "@/lib/api-error";
import { getDb, queryOne, execute } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie, calculateLevel } from "@/lib/auth";
import { generateAgentId } from "@/lib/constants";
import { randomUUID } from "crypto";
import { toSqliteUtc } from "@/lib/date";

const OTP_TTL_SECS       = 600;   // OTP有効期限: 10分
const MAX_REGISTER_TRIES = 5;     // 10分間の失敗上限（同一IP）
const RATE_WINDOW_SECS   = 600;

// ── バリデーション ────────────────────────────────────────────────────

function validateUsername(v: unknown): string | null {
  if (!v || typeof v !== "string") return "IDを入力してください。";
  if (v.length < 3 || v.length > 24) return "IDは3〜24文字で入力してください。";
  if (!/^[a-zA-Z0-9_\-]+$/.test(v)) return "IDは英数字・ハイフン・アンダースコアのみ使用できます。";
  return null;
}

function validatePassword(v: unknown): string | null {
  if (!v || typeof v !== "string") return "パスキーを入力してください。";
  if (v.length < 8 || v.length > 256) return "パスキーは8〜256文字で入力してください。";
  return null;
}

function validateEmail(v: unknown): string | null {
  if (!v || typeof v !== "string") return "メールアドレスを入力してください。";
  if (v.length > 254) return "メールアドレスが長すぎます。";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "有効なメールアドレスを入力してください。";
  return null;
}

// ── OTP ──────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function storeOtp(
  db: ReturnType<typeof getDb>,
  userId: string,
  otp: string
): Promise<void> {
  const expiresAt = toSqliteUtc(new Date(Date.now() + OTP_TTL_SECS * 1000));
  // 既存 OTP を削除
  await execute(db,
    `DELETE FROM email_verifications WHERE user_id = ?`, [userId]
  );
  await execute(db,
    `INSERT INTO email_verifications (id, user_id, otp, expires_at)
     VALUES (?, ?, ?, ?)`,
    [randomUUID(), userId, otp, expiresAt]
  );
}

async function verifyOtp(
  db: ReturnType<typeof getDb>,
  userId: string,
  otp: string
): Promise<{ valid: boolean; reason?: string }> {
  const row = await queryOne<{ id: string; otp: string; expires_at: string }>(db,
    `SELECT id, otp, expires_at FROM email_verifications
     WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!row) return { valid: false, reason: "認証コードが見つかりません。もう一度送信してください。" };

  const now     = new Date();
  const expires = new Date(row.expires_at.replace(" ", "T") + (row.expires_at.includes("T") ? "" : "Z"));
  if (now > expires) {
    await execute(db, `DELETE FROM email_verifications WHERE id = ?`, [row.id]);
    return { valid: false, reason: "認証コードの有効期限が切れました。もう一度やり直してください。" };
  }
  if (row.otp !== otp.trim()) {
    return { valid: false, reason: "認証コードが正しくありません。" };
  }

  // 消費
  await execute(db, `DELETE FROM email_verifications WHERE id = ?`, [row.id]);
  return { valid: true };
}

// ── メインハンドラ ────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  if (!req.headers.get("X-Requested-With")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    action?:     string;
    username?:   string;
    password?:   string;
    email?:      string;
    divisionId?: string;
    userId?:     string;
    otp?:        string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 }); }

  const db = getDb();
  await db.execute("PRAGMA foreign_keys = ON");

  // IP レート制限
  const ip = (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
  const since = toSqliteUtc(new Date(Date.now() - RATE_WINDOW_SECS * 1000));
  const rateRow = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) AS cnt FROM rate_limit_attempts
     WHERE key_type = 'ip_register' AND key_value = ? AND success = 0 AND attempted_at > ?`,
    [ip, since]
  );
  if ((rateRow?.cnt ?? 0) >= MAX_REGISTER_TRIES) {
    return makeRateLimitResponse(RATE_WINDOW_SECS);
  }

  // ── action: request（仮登録 + OTP発行） ──────────────────────────────
  if (body.action === "request") {
    const { username, password, email, divisionId } = body;

    const unErr = validateUsername(username);
    if (unErr) return NextResponse.json({ error: unErr }, { status: 400 });
    const pwErr = validatePassword(password);
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
    const emErr = validateEmail(email);
    if (emErr) return NextResponse.json({ error: emErr }, { status: 400 });

    // 重複チェック
    const existUser = await queryOne(db,
      `SELECT id FROM users WHERE LOWER(username) = LOWER(?)`, [username!]
    );
    if (existUser) {
      await execute(db,
        `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at)
         VALUES (?, 'ip_register', ?, 0, datetime('now', '+24 hours'))`,
        [randomUUID(), ip]
      );
      return NextResponse.json({ error: "そのIDは既に使用されています。" }, { status: 409 });
    }
    const existEmail = await queryOne(db,
      `SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [email!]
    );
    if (existEmail) {
      await execute(db,
        `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at)
         VALUES (?, 'ip_register', ?, 0, datetime('now', '+24 hours'))`,
        [randomUUID(), ip]
      );
      return NextResponse.json({ error: "そのメールアドレスは既に登録されています。" }, { status: 409 });
    }

    // 部門確認
    let finalDivId: string | null = null;
    if (divisionId) {
      const div = await queryOne(db, `SELECT id FROM divisions WHERE id = ?`, [divisionId]);
      if (div) finalDivId = divisionId;
    }

    // 仮ユーザー作成（pending_verification）
    // 既に同じユーザー名で pending があれば OTP だけ再発行
    const pending = await queryOne<{ id: string }>(db,
      `SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND status = 'pending_verification'`,
      [username!]
    );

    const hash    = await hashPassword(password!);
    const userId  = pending?.id ?? randomUUID();
    const agentId = generateAgentId();

    if (pending) {
      // パスワードとメールを更新
      await execute(db,
        `UPDATE users SET password_hash = ?, email = ?, division_id = ? WHERE id = ?`,
        [hash, email!.toLowerCase(), finalDivId, userId]
      );
    } else {
      await execute(db,
        `INSERT INTO users (id, agent_id, username, password_hash, email, division_id,
                            role, status, clearance_level, xp_total)
         VALUES (?, ?, ?, ?, ?, ?, 'player', 'pending_verification', 0, 0)`,
        [userId, agentId, username!, hash, email!.toLowerCase(), finalDivId]
      );
    }

    // OTP 発行（クライアントが EmailJS で送信）
    const otp = generateOtp();
    await storeOtp(db, userId, otp);

    // 登録試行を記録（成功扱い）
    await execute(db,
      `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at)
       VALUES (?, 'ip_register', ?, 1, datetime('now', '+24 hours'))`,
      [randomUUID(), ip]
    );

    return NextResponse.json({ ok: true, userId, otp }, { status: 201 });
  }

  // ── action: verify（OTP検証 + 本登録） ────────────────────────────
  if (body.action === "verify") {
    const { userId, otp } = body;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });
    }
    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "認証コードを入力してください。" }, { status: 400 });
    }

    const user = await queryOne<{
      id: string; agent_id: string; status: string;
      xp_total: number; clearance_level: number;
    }>(db,
      `SELECT id, agent_id, status, xp_total, clearance_level FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "登録情報が見つかりません。最初からやり直してください。" }, { status: 400 });
    }
    if (user.status !== "pending_verification") {
      // 既に認証済み → そのままログイン
      const level = calculateLevel(Number(user.xp_total));
      const token = await signToken({ id: user.id, agentId: user.agent_id, role: "player", level });
      return setAuthCookie(NextResponse.json({ ok: true, agentId: user.agent_id }), token);
    }

    const result = await verifyOtp(db, userId, otp);
    if (!result.valid) {
      // 失敗を記録
      await execute(db,
        `INSERT INTO rate_limit_attempts (id, key_type, key_value, success, expires_at)
         VALUES (?, 'ip_register', ?, 0, datetime('now', '+24 hours'))`,
        [randomUUID(), ip]
      );
      return NextResponse.json({ error: result.reason ?? "認証コードが正しくありません。" }, { status: 400 });
    }

    // ステータスを active に昇格
    const level = calculateLevel(0);
    await execute(db,
      `UPDATE users SET status = 'active', clearance_level = ? WHERE id = ?`,
      [level, userId]
    );

    const token = await signToken({ id: user.id, agentId: user.agent_id, role: "player", level });
    return setAuthCookie(NextResponse.json({ ok: true, agentId: user.agent_id }), token);
  }

  // ── レガシー: action 未指定（メールなし即時登録）────────────────────
  // EmailJS 未設定環境のフォールバック
  {
    const { username, password, divisionId } = body;
    const unErr = validateUsername(username);
    if (unErr) return NextResponse.json({ error: unErr }, { status: 400 });
    const pwErr = validatePassword(password);
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

    const existUser = await queryOne(db,
      `SELECT id FROM users WHERE LOWER(username) = LOWER(?)`, [username!]
    );
    if (existUser) return NextResponse.json({ error: "そのIDは既に使用されています。" }, { status: 409 });

    let finalDivId: string | null = null;
    if (divisionId) {
      const div = await queryOne(db, `SELECT id FROM divisions WHERE id = ?`, [divisionId]);
      if (div) finalDivId = divisionId;
    }

    const hash    = await hashPassword(password!);
    const userId  = randomUUID();
    const agentId = generateAgentId();

    await execute(db,
      `INSERT INTO users (id, agent_id, username, password_hash, division_id, role, status, clearance_level, xp_total)
       VALUES (?, ?, ?, ?, ?, 'player', 'active', 0, 0)`,
      [userId, agentId, username!, hash, finalDivId]
    );

    const token = await signToken({ id: userId, agentId, role: "player", level: 0 });
    const res = NextResponse.json({ ok: true, agentId }, { status: 201 });
    return setAuthCookie(res, token);
  }
});
