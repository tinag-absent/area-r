"use client";

import { useState, useEffect, useCallback } from "react";
import { Button }        from "@/components/ui/Button";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ─── 型 ──────────────────────────────────────────────────────────────

interface Post {
  id:               string;
  title:            string;
  body:             string;
  category:         string;
  is_pinned:        number;
  created_at:       string;
  poster_agent_id:  string;
  poster_username:  string;
}

type Category = "general" | "report" | "request";

const CATEGORY_CONFIG: Record<Category, { label: string; icon: string; color: string }> = {
  general: { label: "一般",   icon: "chat", color: "var(--color-primary)" },
  report:  { label: "報告",   icon: "warning", color: "var(--color-warning)" },
  request: { label: "要請",   icon: "dashboard", color: "var(--color-success)" },
};

// ─── ユーティリティ ──────────────────────────────────────────────────

function fmtDatetime(raw: string) {
  const d = new Date(raw.replace(" ", "T") + "Z");
  return d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })
    + " " + d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

// ─── 投稿カード ───────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[post.category as Category] ?? CATEGORY_CONFIG.general;

  return (
    <div
      className="rounded-sm transition-all duration-200"
      style={{
        background: post.is_pinned ? "linear-gradient(135deg, rgba(0,200,255,0.05) 0%, transparent 100%)" : "var(--color-bg-surface)",
        border: `1px solid ${post.is_pinned ? "rgba(0,200,255,0.2)" : "rgba(0,200,255,0.08)"}`,
        borderLeft: `3px solid ${cat.color}55`,
      }}
    >
      <div className="px-4 py-3.5">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {post.is_pinned === 1 && (
              <span className="hud-label px-1.5 py-0.5 rounded-sm"
                style={{ color: "var(--color-primary)", background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.15)" }}>
                📌 固定
              </span>
            )}
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-sm"
              style={{ color: cat.color, background: `${cat.color}12`, border: `1px solid ${cat.color}25` }}>
              {cat.icon} {cat.label}
            </span>
          </div>
          <div className="hud-label shrink-0">{fmtDatetime(post.created_at)}</div>
        </div>

        {/* タイトル */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-left w-full mb-1.5 cursor-pointer"
          style={{ background: "none", border: "none", padding: 0 }}
        >
          <div className="text-[14px] font-bold leading-snug" style={{ color: "var(--color-foreground)" }}>
            {post.title}
          </div>
        </button>

        {/* 投稿者 */}
        <div className="hud-label mb-2" style={{ color: "var(--color-fg-muted)" }}>
          {post.poster_agent_id} / {post.poster_username}
        </div>

        {/* 本文（展開時） */}
        {expanded && (
          <div
            className="text-[12px] leading-relaxed mt-3 pt-3 whitespace-pre-wrap break-words"
            style={{
              color: "var(--color-fg-dim)",
              borderTop: "1px solid rgba(0,200,255,0.06)",
            }}
          >
            {post.body}
          </div>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11px] mt-2 cursor-pointer transition-colors"
          style={{ background: "none", border: "none", padding: 0, color: "var(--color-fg-muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}
        >
          {expanded ? "▲ 閉じる" : "▼ 本文を読む"}
        </button>
      </div>
    </div>
  );
}

// ─── 投稿フォーム ─────────────────────────────────────────────────────

function PostForm({ onPosted }: { onPosted: () => void }) {
  const [open, setOpen]         = useState(false);
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    background: "rgba(0,200,255,0.04)",
    border: "1px solid rgba(0,200,255,0.15)",
    color: "var(--color-foreground)",
    outline: "none",
    borderRadius: "2px",
    width: "100%",
    fontSize: "13px",
    fontFamily: "inherit",
    padding: "8px 12px",
  };

  const submit = async () => {
    if (!title.trim() || !body.trim()) { setError("タイトルと本文を入力してください"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ title, body, category }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "投稿に失敗しました"); return; }
      setTitle(""); setBody(""); setOpen(false);
      onPosted();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return (
    <div className="mb-5">
      <Button onClick={() => setOpen(true)}><Icon name="bulletin" size={13} style={{ marginRight: 4 }} aria-hidden />新規投稿</Button>
    </div>
  );

  return (
    <div className="mb-6 rounded-sm p-5"
      style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.15)" }}>
      <div className="hud-label mb-4">NEW POST</div>

      <div className="flex flex-col gap-3">
        {/* カテゴリ */}
        <div className="flex gap-2">
          {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setCategory(k)}
              className="px-3 py-1.5 text-[11px] font-bold rounded-sm cursor-pointer transition-all duration-150"
              style={{
                color: category === k ? v.color : "var(--color-fg-muted)",
                background: category === k ? `${v.color}12` : "transparent",
                border: `1px solid ${category === k ? `${v.color}40` : "rgba(0,200,255,0.08)"}`,
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* タイトル */}
        <input
          type="text"
          placeholder="タイトル（80文字以内）"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={80}
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.45)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.15)"; }}
        />

        {/* 本文 */}
        <textarea
          placeholder="本文（2000文字以内）"
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={2000}
          rows={5}
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.45)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.15)"; }}
        />

        {/* 文字数 */}
        <div className="hud-label text-right" style={{ color: "var(--color-fg-muted)" }}>
          {body.length} / 2000
        </div>

        {error && (
          <div className="text-[12px] px-3 py-2 rounded-sm"
            style={{ color: "var(--color-danger)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={submit} isLoading={loading}>投稿する</Button>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>キャンセル</Button>
        </div>
      </div>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────

export default function BulletinPage() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [category, setCategory] = useState<Category | "all">("all");

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch(`/api/posts?category=${category}&limit=50`);
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { key: "all" as const,     label: "すべて", icon: "notify" },
    { key: "general" as const, label: "一般",   icon: "chat" },
    { key: "report" as const,  label: "報告",   icon: "warning" },
    { key: "request" as const, label: "要請",   icon: "dashboard" },
  ];

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[760px] mx-auto">
      {/* ヘッダー */}
      <div className="mb-7">
        <div className="hud-label mb-1">INTERNAL BULLETIN</div>
        <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          掲示板
        </h1>
      </div>

      {/* 投稿フォーム */}
      <PostForm onPosted={load} />

      {/* カテゴリタブ */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key)}
            className="px-3 py-1.5 text-[12px] font-bold font-mono rounded-sm cursor-pointer transition-all duration-150"
            style={{
              color:      category === t.key ? "var(--color-primary)" : "var(--color-fg-dim)",
              background: category === t.key ? "rgba(0,200,255,0.08)" : "transparent",
              border:     `1px solid ${category === t.key ? "rgba(0,200,255,0.3)" : "rgba(0,200,255,0.08)"}`,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {loading && <LoadingStatus />}

      {!loading && error && (
        <div className="rounded-sm p-5 text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}>
          <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>取得に失敗しました</p>
          <Button variant="secondary" onClick={load} className="text-[12px]">再試行</Button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-sm p-10 text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
          <div className="mb-2 opacity-15"><Icon name="bulletin" size={24} aria-hidden /></div>
          <div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>投稿がありません</div>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="flex flex-col gap-3">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
