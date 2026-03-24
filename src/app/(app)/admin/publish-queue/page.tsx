"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ── コンテンツIDリスト（data.ts と同期させる） ───────────────────────
// novel/codex を追加・変更した際はここも更新する

const CONTENT_OPTIONS = {
  novel: [
    { id: "DIARY-001", label: "DIARY-001 / 初配属の日（LV0）" },
    { id: "DIARY-002", label: "DIARY-002 / 最初の観測任務（LV0）" },
    { id: "DIARY-003", label: "DIARY-003 / NPCとの接触（LV1）" },
    { id: "DIARY-004", label: "DIARY-004 / α-7の夜（LV1）" },
    { id: "DIARY-005", label: "DIARY-005 / K-17の失踪（LV2）" },
    { id: "DIARY-006", label: "DIARY-006 / ブリーフィング室の記録（LV2）" },
    { id: "DIARY-007", label: "DIARY-007 / SIGMAとの間接接触（LV3）" },
    { id: "DIARY-008", label: "DIARY-008 / （未作成・予約枠）" },
  ],
  codex: [
    { id: "agency-overview",  label: "機関の概要" },
    { id: "agency-history",   label: "機関の歴史" },
    { id: "agency-clearance", label: "クリアランスレベル制度" },
  ],
  notification: [
    { id: "custom", label: "通知のみ（コンテンツ公開なし）" },
  ],
  flag: [
    { id: "custom", label: "フラグ発火のみ（コンテンツ公開なし）" },
  ],
} as const;

type ContentType = keyof typeof CONTENT_OPTIONS;
type QueueStatus = "scheduled" | "published" | "cancelled";

interface QueueItem {
  id:           string;
  content_type: ContentType;
  content_id:   string;
  title:        string;
  publish_at:   string;
  status:       QueueStatus;
  notify_target: string | null;
  notify_title:  string | null;
  flag_key:      string | null;
  created_by:    string;
  created_at:    string;
  published_at:  string | null;
}

// ── スタイル定数 ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<QueueStatus, string> = {
  scheduled: "予約中",
  published: "公開済",
  cancelled: "キャンセル",
};

const STATUS_COLOR: Record<QueueStatus, string> = {
  scheduled: "var(--color-primary)",
  published: "var(--color-success)",
  cancelled: "var(--color-danger)",
};

const TYPE_LABEL: Record<ContentType, string> = {
  novel:        "小説",
  codex:        "コーデックス",
  notification: "通知のみ",
  flag:         "フラグのみ",
};

const inputStyle: React.CSSProperties = {
  background:  "var(--color-bg)",
  border:      "1px solid rgba(255,180,60,0.2)",
  color:       "var(--color-foreground)",
  fontFamily:  "var(--font-mono)",
  outline:     "none",
  borderRadius: "2px",
  fontSize:    "12px",
  padding:     "6px 8px",
  width:       "100%",
};

// ── サブコンポーネント ────────────────────────────────────────────────

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return (
    <div className="p-3 mb-4 rounded-sm text-[12px]"
      style={{
        background: ok ? "rgba(0,230,118,0.06)"  : "rgba(255,68,68,0.06)",
        border:    `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
        color:      ok ? "var(--color-success)"  : "var(--color-danger)",
        fontFamily: "var(--font-mono)",
      }}>
      {text}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="hud-label mb-1.5" style={{ color: "var(--color-fg-muted)", marginTop: 16 }}>
      — {children} —
    </div>
  );
}

// ── メインコンポーネント ─────────────────────────────────────────────

export default function PublishQueuePage() {
  const [tab,      setTab]      = useState<QueueStatus>("scheduled");
  const [items,    setItems]    = useState<QueueItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [showForm, setShowForm] = useState(false);

  // フォーム
  const [contentType,   setContentType]   = useState<ContentType>("novel");
  const [contentId,     setContentId]     = useState("");
  const [customTitle,   setCustomTitle]   = useState("");
  const [publishAt,     setPublishAt]     = useState("");
  const [notifyTarget,  setNotifyTarget]  = useState("all");
  const [notifyTitle,   setNotifyTitle]   = useState("");
  const [notifyBody,    setNotifyBody]    = useState("");
  const [flagKey,       setFlagKey]       = useState("");
  const [flagValue,     setFlagValue]     = useState("true");
  const [submitting,    setSubmitting]    = useState(false);

  // ── データ取得 ─────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/publish-queue?status=${tab}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // ── アクション ─────────────────────────────────────────────────────

  async function doAction(id: string, action: "cancel" | "publish_now") {
    const label = action === "publish_now" ? "今すぐ公開" : "キャンセル";
    if (!confirm(`${label}しますか？`)) return;

    setMsg("");
    const res = await fetch("/api/admin/publish-queue", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body:    JSON.stringify({ id, action }),
    });
    const data = await res.json();
    setMsg(res.ok
      ? `✓ ${action === "publish_now" ? "即時公開しました" : "キャンセルしました"}`
      : `エラー: ${data.error ?? "不明なエラー"}`
    );
    load();
  }

  async function doDelete(id: string) {
    if (!confirm("削除しますか？（キャンセル済みのみ削除可能）")) return;
    const res = await fetch(`/api/admin/publish-queue?id=${id}`, {
      method:  "DELETE",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const data = await res.json();
    setMsg(res.ok ? "✓ 削除しました" : `エラー: ${data.error ?? "不明なエラー"}`);
    load();
  }

  // ── フォーム送信 ───────────────────────────────────────────────────

  async function handleSubmit() {
    if (!contentId)  { setMsg("対象コンテンツを選択してください"); return; }
    if (!publishAt)  { setMsg("公開日時を入力してください"); return; }

    setSubmitting(true); setMsg("");
    try {
      const selectedLabel =
        (CONTENT_OPTIONS[contentType] as ReadonlyArray<{ id: string; label: string }>)
          .find(o => o.id === contentId)?.label ?? contentId;

      const res = await fetch("/api/admin/publish-queue", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          contentType,
          contentId,
          title:        customTitle.trim() || selectedLabel,
          publishAt:    new Date(publishAt).toISOString(),
          notifyTarget: notifyTitle.trim() ? notifyTarget : undefined,
          notifyTitle:  notifyTitle.trim() || undefined,
          notifyBody:   notifyBody.trim()  || undefined,
          flagKey:      flagKey.trim()     || undefined,
          flagValue:    flagValue.trim()   || "true",
        }),
      });

      const data = await res.json();
      if (!res.ok) { setMsg(`エラー: ${data.error ?? "登録失敗"}`); return; }

      setMsg("✓ スケジュールを登録しました");
      setShowForm(false);
      setContentId(""); setCustomTitle(""); setPublishAt("");
      setNotifyTitle(""); setNotifyBody(""); setFlagKey(""); setFlagValue("true");
      if (tab === "scheduled") load();
    } finally {
      setSubmitting(false);
    }
  }

  // ── 日時フォーマット ───────────────────────────────────────────────

  function fmtTime(raw: string) {
    const d = new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"));
    return d.toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit",
      hour:  "2-digit", minute: "2-digit",
    });
  }

  // ── レンダリング ───────────────────────────────────────────────────

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[920px] mx-auto">
      <PageHeader
        eyebrow="ADMIN — CONTENT SCHEDULER"
        title="コンテンツ公開スケジュール"
        eyebrowColor="warning"
      />

      {msg && <Msg text={msg} />}

      {/* ── タブ + 新規登録ボタン ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1">
          {(["scheduled", "published", "cancelled"] as QueueStatus[]).map(s => (
            <button key={s} onClick={() => setTab(s)}
              className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer transition-colors"
              style={{
                background: tab === s ? "rgba(255,180,60,0.12)" : "transparent",
                border:     "1px solid rgba(255,180,60,0.2)",
                color:      tab === s ? "var(--color-warning)" : "var(--color-fg-dim)",
                fontFamily: "var(--font-mono)",
              }}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <button onClick={() => setShowForm(v => !v)}
          className="text-[11px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{
            background: "rgba(255,180,60,0.1)",
            border:     "1px solid rgba(255,180,60,0.35)",
            color:      "var(--color-warning)",
            fontFamily: "var(--font-mono)",
          }}>
          {showForm ? "▲ 閉じる" : "＋ 新規スケジュール"}
        </button>
      </div>

      {/* ── 登録フォーム ── */}
      {showForm && (
        <div className="rounded-sm p-5 mb-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.18)" }}>
          <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}>
            <><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />新規スケジュール登録</>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* コンテンツタイプ */}
            <div>
              <label className="hud-label block mb-1">コンテンツタイプ</label>
              <select
                value={contentType}
                onChange={e => { setContentType(e.target.value as ContentType); setContentId(""); }}
                style={inputStyle}>
                <option value="novel">小説（記録文書）</option>
                <option value="codex">コーデックス</option>
                <option value="notification">通知のみ</option>
                <option value="flag">フラグ発火のみ</option>
              </select>
            </div>

            {/* コンテンツ選択 */}
            <div>
              <label className="hud-label block mb-1">対象コンテンツ</label>
              <select value={contentId} onChange={e => setContentId(e.target.value)} style={inputStyle}>
                <option value="">— 選択してください —</option>
                {(CONTENT_OPTIONS[contentType] as ReadonlyArray<{ id: string; label: string }>)
                  .map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
              </select>
            </div>

            {/* 公開日時 */}
            <div>
              <label className="hud-label block mb-1">公開日時（JST入力）</label>
              <input type="datetime-local" value={publishAt}
                onChange={e => setPublishAt(e.target.value)}
                style={inputStyle} />
              <div className="hud-label mt-1" style={{ color: "var(--color-fg-muted)", fontSize: 10 }}>
                ※ サーバーはUTCで処理します（JST = UTC+9）
              </div>
            </div>

            {/* 管理ラベル */}
            <div>
              <label className="hud-label block mb-1">管理ラベル（省略可）</label>
              <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                placeholder="省略時はコンテンツ名を使用"
                style={inputStyle} />
            </div>
          </div>

          {/* 通知設定 */}
          <SectionLabel>通知設定（省略可）</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="hud-label block mb-1">送信先</label>
              <select value={notifyTarget} onChange={e => setNotifyTarget(e.target.value)} style={inputStyle}>
                <option value="all">全員</option>
                <option value="division:DIV-01">観測部門</option>
                <option value="division:DIV-02">収束部門</option>
                <option value="division:DIV-03">記録部門</option>
                <option value="division:DIV-04">技術部門</option>
                <option value="division:DIV-05">封印部門</option>
              </select>
            </div>
            <div>
              <label className="hud-label block mb-1">通知タイトル</label>
              <input type="text" value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)}
                placeholder="新規記録文書が公開されました" maxLength={100}
                style={inputStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">通知本文</label>
              <input type="text" value={notifyBody} onChange={e => setNotifyBody(e.target.value)}
                placeholder="/novel で確認してください" maxLength={200}
                style={inputStyle} />
            </div>
          </div>

          {/* フラグ設定 */}
          <SectionLabel>フラグ発火（省略可）</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="hud-label block mb-1">フラグキー</label>
              <input type="text" value={flagKey} onChange={e => setFlagKey(e.target.value)}
                placeholder="例: diary005_published"
                style={inputStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">フラグ値</label>
              <input type="text" value={flagValue} onChange={e => setFlagValue(e.target.value)}
                placeholder="true"
                style={inputStyle} />
            </div>
          </div>

          {/* 送信 */}
          <div className="flex justify-end mt-5">
            <button onClick={handleSubmit}
              disabled={submitting || !contentId || !publishAt}
              className="text-[12px] px-6 py-2 rounded-sm cursor-pointer"
              style={{
                background: "rgba(255,180,60,0.12)",
                border:     "1px solid rgba(255,180,60,0.4)",
                color:      "var(--color-warning)",
                fontFamily: "var(--font-mono)",
                opacity:    submitting || !contentId || !publishAt ? 0.5 : 1,
              }}>
              {submitting ? "登録中..." : "スケジュール登録"}
            </button>
          </div>
        </div>
      )}

      {/* ── キュー一覧 ── */}
      {loading ? <LoadingStatus /> : (
        <div className="rounded-sm overflow-hidden"
          style={{ border: "1px solid rgba(255,180,60,0.12)" }}>

          {/* テーブルヘッダー */}
          <div
            className="grid gap-3 px-4 py-2 text-[11px]"
            style={{
              gridTemplateColumns: "1fr 80px 76px 120px 80px",
              background:    "rgba(255,180,60,0.06)",
              borderBottom:  "1px solid rgba(255,180,60,0.1)",
              color:         "var(--color-warning)",
              fontFamily:    "var(--font-mono)",
            }}>
            <span>コンテンツ</span>
            <span>タイプ</span>
            <span>状態</span>
            <span>公開日時</span>
            <span>操作</span>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center hud-label"
              style={{ color: "var(--color-fg-muted)", background: "var(--color-bg-surface)" }}>
              {STATUS_LABEL[tab]}のアイテムはありません
            </div>
          ) : items.map((item, i) => (
            <div key={item.id}
              className="grid gap-3 px-4 py-3 items-start"
              style={{
                gridTemplateColumns: "1fr 80px 76px 120px 80px",
                borderBottom:  i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background:    "var(--color-bg-surface)",
              }}>

              {/* タイトル + メタ */}
              <div>
                <div className="text-[12px] leading-snug mb-0.5"
                  style={{ color: "var(--color-foreground)" }}>
                  {item.title}
                </div>
                <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                  {item.content_id !== "custom" && `${item.content_id}`}
                  {item.notify_title && ` · 📢 ${item.notify_title}`}
                  {item.flag_key     && ` · 🏳 ${item.flag_key}`}
                </div>
                {item.published_at && (
                  <div className="hud-label mt-0.5" style={{ color: "var(--color-success)" }}>
                    公開: {fmtTime(item.published_at)}
                  </div>
                )}
              </div>

              {/* タイプ */}
              <div className="text-[11px] pt-0.5"
                style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                {TYPE_LABEL[item.content_type] ?? item.content_type}
              </div>

              {/* ステータス */}
              <div className="text-[11px] pt-0.5"
                style={{ color: STATUS_COLOR[item.status], fontFamily: "var(--font-mono)" }}>
                {STATUS_LABEL[item.status]}
              </div>

              {/* 公開日時 */}
              <div className="text-[11px] pt-0.5"
                style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>
                {fmtTime(item.publish_at)}
              </div>

              {/* 操作ボタン */}
              <div className="flex flex-col gap-1">
                {item.status === "scheduled" && (<>
                  <button onClick={() => doAction(item.id, "publish_now")}
                    className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer w-full"
                    style={{
                      background: "rgba(0,200,255,0.08)",
                      border:     "1px solid rgba(0,200,255,0.25)",
                      color:      "var(--color-primary)",
                      fontFamily: "var(--font-mono)",
                    }}>
                    即時公開
                  </button>
                  <button onClick={() => doAction(item.id, "cancel")}
                    className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer w-full"
                    style={{
                      background: "rgba(255,68,68,0.08)",
                      border:     "1px solid rgba(255,68,68,0.25)",
                      color:      "var(--color-danger)",
                      fontFamily: "var(--font-mono)",
                    }}>
                    キャンセル
                  </button>
                </>)}
                {item.status === "cancelled" && (
                  <button onClick={() => doDelete(item.id)}
                    className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer w-full"
                    style={{
                      background: "rgba(255,68,68,0.05)",
                      border:     "1px solid rgba(255,68,68,0.18)",
                      color:      "var(--color-danger)",
                      fontFamily: "var(--font-mono)",
                      opacity:    0.7,
                    }}>
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 説明フッター */}
      <div className="mt-6 p-4 rounded-sm"
        style={{ background: "rgba(0,0,0,0.2)", border: "1px dashed rgba(255,180,60,0.1)" }}>
        <div className="hud-label mb-2" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />動作仕様</div>
        <div className="hud-label" style={{ color: "var(--color-fg-muted)", lineHeight: 1.8 }}>
          Cron（/api/cron/publish-queue）が毎時実行され、公開時刻を過ぎた予約を自動処理します。<br />
          「即時公開」ボタンを使えばCronを待たずに即時反映できます。<br />
          小説・コーデックスは published_content テーブルに記録され、フロント側で出し分けます。<br />
          Vercel Hobby プランでは Cron は1日1回（0 3 * * *）に制限されます。Pro プランで毎時実行が可能です。
        </div>
      </div>
    </div>
  );
}
