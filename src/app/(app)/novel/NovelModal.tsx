/**
 * src/app/(app)/novel/NovelModal.tsx
 *
 * ノベルタグモーダル群。
 * NovelRenderer.tsx から分離 (2026-03-23)。
 *
 * エクスポート:
 *   - ObserverModal   — [[OBSERVER]] タグ用 4th wall 演出モーダル
 *   - BulletinModal   — [[BUL-xxx]] タグ用 掲示板投稿モーダル
 *   - MemoModal       — [[MEMO-xxx]] タグ用 機関員メモモーダル
 *   - GenericTagModal — 汎用タグカードモーダル (TagModalContent をラップ)
 *   - NovelModalSwitch — modal state に応じて上記を切り替えるスイッチャー
 */
"use client";

import { useEffect, useState }      from "react";
import { useBoundStore }             from "@/store";
import { AudioModal }                from "@/components/ui/AudioModal";
import type { DbCache }              from "@/store/dbCacheStore";
import type { TagKind, TagMeta, ModalState } from "./tags/types";
import { CATEGORY_COLOR, MEMO_STATUS_COLOR, MONO, Row, Badge } from "./tags/ui";
import { TagModalContent }           from "./NovelTagModalContent";

// ─────────────────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────────────────

interface BulletinPost {
  id: string; title: string; body: string; category: string;
  is_pinned: number; created_at: string;
  poster_agent_id: string; poster_username: string;
}

interface AgentMemoRow {
  id: string; title: string; author_ref: string; location_ref: string | null;
  written_at: string; found_at: string | null; found_by: string | null;
  status: string; clearance_req: number; content: string;
  tags_json: string[];
}

// ─────────────────────────────────────────────────────────────────────
// ObserverModal — [[OBSERVER]] 4th wall 演出
// ─────────────────────────────────────────────────────────────────────

export function ObserverModal({ onClose }: { onClose: () => void }) {
  const user    = useBoundStore(s => s.user);
  const agentId = user?.agentId  ?? "[UNKNOWN AGENT]";
  const level   = user?.level    ?? 0;
  const divId   = user?.divisionId ?? "—";

  const now = new Date().toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glitch-text"
        style={{
          width: "min(480px, 94vw)",
          background: "rgba(0,8,12,0.99)",
          border: "1px solid var(--color-fg-muted)",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(0,200,255,0.08)",
        }}
      >
        <div style={{
          background: "rgba(0,200,255,0.06)",
          borderBottom: "1px solid var(--color-fg-muted)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ ...MONO, fontSize: 10, color: "var(--color-primary)", animation: "pulse-dot 1.2s ease-in-out infinite" }}>◎</span>
          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-primary)" }}>
            OBSERVATION RECORD
          </span>
          <span style={{ flex: 1 }} />
          <span onClick={onClose} style={{ cursor: "pointer", color: "rgba(0,200,255,0.3)", fontSize: 14, padding: "2px 4px" }}>✕</span>
        </div>

        <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: "var(--color-fg-muted)", padding: "4px 14px 5px", borderBottom: "1px solid rgba(0,200,255,0.06)" }}>
          SYSTEM · LIVE FEED · {now}
        </div>

        <div style={{ padding: "14px 14px 18px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {["ACTIVE", `CLR LV${level}`, divId].map(t => (
              <span key={t} style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", padding: "1px 6px", borderRadius: 2, border: "1px solid var(--color-fg-muted)", background: "rgba(0,200,255,0.06)", color: "var(--color-primary)" }}>{t}</span>
            ))}
          </div>
          <Row label="SUBJECT"   value={agentId} />
          <Row label="CLEARANCE" value={`LV${level}`} />
          <Row label="DIVISION"  value={divId} />
          <Row label="STATUS"    value="ACTIVE / TRACKED" />
          <Row label="UPDATED"   value={now} />
          <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(0,200,255,0.03)", border: "1px solid rgba(0,200,255,0.1)", borderRadius: 2 }}>
            <div style={{ ...MONO, fontSize: 11, color: "rgba(0,200,255,0.6)", lineHeight: 1.95 }}>
              あなたのすべての行動は記録されている。
            </div>
            <div style={{ ...MONO, fontSize: 11, color: "rgba(0,200,255,0.45)", lineHeight: 1.95, marginTop: 4 }}>
              海蝕機関は観測者を必要としている。
            </div>
            <div style={{ ...MONO, fontSize: 10, color: "var(--color-fg-muted)", lineHeight: 1.95, marginTop: 8 }}>
              この記録は <span style={{ color: "rgba(0,200,255,0.5)" }}>{now}</span> に更新された。
            </div>
          </div>
          <div style={{ marginTop: 14, ...MONO, fontSize: 11, color: "var(--color-fg-muted)", letterSpacing: "0.08em" }}>
            KAISHOKU AGENCY INTERNAL SURVEILLANCE SYSTEM v4.1
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BulletinModal — [[BUL-xxx]] 掲示板投稿
// ─────────────────────────────────────────────────────────────────────

export function BulletinModal({ id, meta, onClose }: { id: string; meta: TagMeta; onClose: () => void }) {
  const [post,    setPost]    = useState<BulletinPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts?id=${encodeURIComponent(id)}`, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(r => r.ok ? r.json() : null)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  const color = post ? (CATEGORY_COLOR[post.category] ?? "rgba(255,255,255,0.4)") : meta.color;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(560px, 94vw)", maxHeight: "80vh",
        background: "rgba(8,10,14,0.98)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color }}>◎</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...MONO, fontSize: 12, fontWeight: 700, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "読み込み中…" : (post?.title ?? "取得失敗")}
            </div>
            {post && <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{post.poster_agent_id} · {post.created_at.slice(0, 10)}</div>}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}>✕</span>
        </div>
        <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", padding: "4px 14px 5px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
          BULLETIN · {id}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
          {loading && <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>読み込み中…</div>}
          {!loading && !post && <div style={{ ...MONO, fontSize: 11, color: "var(--color-danger)" }}>投稿が見つかりませんでした。</div>}
          {post && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Badge text={post.category.toUpperCase()} color={color} />
                {post.is_pinned ? <Badge text="PINNED" color={color} /> : null}
              </div>
              <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>POSTED BY</div>
              <div style={{ ...MONO, fontSize: 11, color, marginBottom: 12 }}>{post.poster_agent_id} ({post.poster_username})</div>
              <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>CONTENT</div>
              <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                {post.body}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MemoModal — [[MEMO-xxx]] 機関員メモ
// ─────────────────────────────────────────────────────────────────────

export function MemoModal({ id, meta, onClose }: { id: string; meta: TagMeta; onClose: () => void }) {
  const [memo,    setMemo]    = useState<AgentMemoRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agent-memos?id=${encodeURIComponent(id)}`, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(r => r.ok ? r.json() : null)
      .then(setMemo)
      .finally(() => setLoading(false));
  }, [id]);

  const color = memo ? (MEMO_STATUS_COLOR[memo.status] ?? "var(--color-fg-dim)") : meta.color;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(560px, 94vw)", maxHeight: "82vh",
        background: "rgba(8,10,14,0.98)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color }}>◇</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...MONO, fontSize: 12, fontWeight: 700, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "読み込み中…" : (memo?.title ?? "取得失敗")}
            </div>
            {memo && <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{memo.author_ref} · {memo.written_at}</div>}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}>✕</span>
        </div>
        <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", padding: "4px 14px 5px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
          AGENT MEMO · {id}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
          {loading && <div style={{ ...MONO, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>読み込み中…</div>}
          {!loading && !memo && <div style={{ ...MONO, fontSize: 11, color: "var(--color-danger)" }}>メモが見つかりませんでした。</div>}
          {memo && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Badge text={memo.status.toUpperCase()} color={color} />
                <Badge text={`CLR LV${memo.clearance_req}`} color={color} />
              </div>
              <Row label="AUTHOR"   value={memo.author_ref} />
              <Row label="WRITTEN"  value={memo.written_at} />
              {memo.found_at    && <Row label="FOUND AT"  value={memo.found_at} />}
              {memo.found_by    && <Row label="FOUND BY"  value={memo.found_by} />}
              {memo.location_ref && <Row label="LOCATION" value={memo.location_ref} />}
              <div style={{ marginTop: 14 }}>
                <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>CONTENT</div>
                <div style={{
                  ...MONO, fontSize: 12,
                  color: memo.status === "corrupted" ? "rgba(255,107,60,0.75)" : "rgba(255,255,255,0.7)",
                  lineHeight: 1.95, whiteSpace: "pre-wrap",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${color}22`,
                  borderRadius: 2,
                  fontFamily: "var(--font-ja, serif)",
                  letterSpacing: "0.04em",
                }}>
                  {memo.content || "（本文なし）"}
                </div>
              </div>
              {memo.tags_json.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>RELATED TAGS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {memo.tags_json.map(t => (
                      <span key={t} style={{ ...MONO, fontSize: 11, padding: "1px 6px", borderRadius: 2, border: "1px solid rgba(255,255,255,0.55)", color: "rgba(255,255,255,0.4)" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// GenericTagModal — 汎用タグカードモーダル
// ─────────────────────────────────────────────────────────────────────

export function GenericTagModal({
  kind, id, db, meta, onClose,
}: {
  kind: TagKind; id: string; db: DbCache; meta: TagMeta; onClose: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(520px, 94vw)", maxHeight: "80vh",
        background: "rgba(8,10,14,0.98)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: meta.color }}>{meta.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: meta.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {meta.label}
            </div>
            {meta.sub && (
              <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{meta.sub}</div>
            )}
          </div>
          {meta.code && (
            <span style={{ ...MONO, fontSize: 11, color: `${meta.color}88`, border: `1px solid ${meta.color}33`, padding: "1px 6px", borderRadius: 2, flexShrink: 0 }}>{meta.code}</span>
          )}
          <span onClick={onClose} style={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}>✕</span>
        </div>
        <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", padding: "4px 14px 5px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
          {kind.toUpperCase()} · {id}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
          <TagModalContent kind={kind} id={id} db={db} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// NovelModalSwitch — modal state に応じてモーダルを切り替える
// ─────────────────────────────────────────────────────────────────────

export function NovelModalSwitch({
  modal,
  db,
  onClose,
}: {
  modal:   ModalState;
  db:      DbCache | null;
  onClose: () => void;
}) {
  if (!modal) return null;

  if (modal.type === "generic" && db) {
    return <GenericTagModal kind={modal.kind} id={modal.id} db={db} meta={modal.meta} onClose={onClose} />;
  }
  if (modal.type === "audio") {
    return <AudioModal data={modal.data} onClose={onClose} />;
  }
  if (modal.type === "bulletin") {
    return <BulletinModal id={modal.id} meta={modal.meta} onClose={onClose} />;
  }
  if (modal.type === "memo") {
    return <MemoModal id={modal.id} meta={modal.meta} onClose={onClose} />;
  }
  if (modal.type === "observer") {
    return <ObserverModal onClose={onClose} />;
  }
  return null;
}
