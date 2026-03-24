"use client";

import { useState, useEffect, useCallback } from "react";
import { NovelRenderer } from "./NovelRenderer";
import { CATEGORY_ICON, type NovelDocument } from "./data";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ─── 閲覧不可ドキュメント（ロック表示用） ────────────────────────────

function LockedItem({ doc, scheduleHeld }: { doc: NovelDocument; scheduleHeld: boolean }) {
  return (
    <div
      className="px-3 py-2.5 rounded-sm select-none"
      style={{
        background: "transparent",
        border: "1px dashed rgba(0,200,255,0.06)",
        opacity: 0.4,
      }}
    >
      <div className="flex items-center gap-2">
        <Icon name="lock" size={12} aria-hidden />
        <span className="text-[11px] font-bold font-mono truncate" style={{ color: "var(--color-fg-muted)" }}>
          {doc.title}
        </span>
      </div>
      <div className="hud-label mt-0.5">
        {scheduleHeld
          ? "PUBLICATION PENDING"
          : `CLEARANCE LV${doc.clearance} REQUIRED`}
      </div>
    </div>
  );
}

// ─── 文書リストアイテム ───────────────────────────────────────────────

function DocItem({
  doc, active, onClick,
}: {
  doc: NovelDocument; active: boolean; onClick: () => void;
}) {
  const icon = CATEGORY_ICON[doc.category];
  return (
    <button
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className="w-full text-left px-3 py-2.5 rounded-sm transition-all duration-150 cursor-pointer"
      style={{
        background:  active ? "rgba(0,200,255,0.08)" : "transparent",
        border:      `1px solid ${active ? "rgba(0,200,255,0.28)" : "transparent"}`,
        borderLeft:  active ? "2px solid var(--color-primary)" : "2px solid transparent",
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.04)";
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div className="flex items-start gap-2">
        <NavIcon icon={icon} size={11} color={active ? "var(--color-primary)" : "var(--color-fg-muted)"} />
        <div className="min-w-0">
          <div
            className="text-[12px] font-bold leading-snug truncate"
            style={{ color: active ? "var(--color-primary)" : "var(--color-foreground)" }}
          >
            {doc.title}
          </div>
          <div className="hud-label mt-0.5 truncate">{doc.date} · {doc.author.split("（")[0]}</div>
        </div>
      </div>
    </button>
  );
}

// ─── 本文パネル ───────────────────────────────────────────────────────

function DocViewer({ doc }: { doc: NovelDocument }) {
  const icon = CATEGORY_ICON[doc.category];

  return (
    <article className="flex-1 min-w-0 overflow-y-auto px-6 py-7 sm:px-10">
      {/* ドキュメントヘッダー */}
      <header className="mb-8 pb-6" style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-sm font-mono"
            style={{
              color: "var(--color-primary)",
              background: "rgba(0,200,255,0.08)",
              border: "1px solid rgba(0,200,255,0.15)",
            }}
          >
            {icon} {doc.category}
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-sm font-mono"
            style={{
              color: "var(--color-fg-muted)",
              background: "transparent",
              border: "1px solid rgba(0,200,255,0.08)",
            }}
          >
            {doc.id}
          </span>
          {doc.clearance > 0 && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-sm font-mono"
              style={{
                color: "var(--color-warning)",
                background: "rgba(255,180,60,0.06)",
                border: "1px solid rgba(255,180,60,0.18)",
              }}
            >
              LV{doc.clearance}
            </span>
          )}
        </div>

        <h1
          className="m-0 text-[22px] font-bold leading-tight mb-2"
          style={{ color: "var(--color-foreground)", letterSpacing: "0.02em" }}
        >
          {doc.title}
        </h1>

        {doc.subtitle && (
          <div className="text-[12px] mb-3" style={{ color: "var(--color-fg-dim)" }}>
            {doc.subtitle}
          </div>
        )}

        <div className="flex flex-wrap gap-4 hud-label">
          <span>DATE: {doc.date}</span>
          <span>AUTHOR: {doc.author}</span>
        </div>
      </header>

      {/* 本文 */}
      <NovelRenderer content={doc.content} />

      {/* フッター */}
      <footer
        className="mt-10 pt-5 hud-label text-center"
        style={{ borderTop: "1px solid rgba(0,200,255,0.06)", color: "var(--color-fg-decorative)" }}
      >
        ——— {doc.id} / END OF RECORD ———
      </footer>
    </article>
  );
}

// ─── 空状態（未選択） ─────────────────────────────────────────────────

function EmptyViewer() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center" style={{ color: "var(--color-fg-decorative)" }}>
        <div className="mb-4 opacity-30"><Icon name="novel" size={40} aria-hidden /></div>
        <div className="text-[13px] font-mono">SELECT A RECORD</div>
        <div className="hud-label mt-1">記録文書を選択してください</div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────

export function NovelClient({
  level,
  scheduledIds = [],
  publishedIds = [],
}: {
  level:         number;
  scheduledIds?: string[];
  publishedIds?: string[];
}) {
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [allDocuments, setAllDocuments] = useState<NovelDocument[]>([]);

  // DBから記録文書を取得（APIはclearance<=levelのみ返す）
  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/novel", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) setAllDocuments(await res.json());
    } catch { /* サイレントスキップ */ }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const scheduledSet = new Set(scheduledIds);
  const publishedSet = new Set(publishedIds);

  // クリアランス OK かつ、スケジュール管理下なら published_content にある場合のみ表示
  const accessible = allDocuments.filter(d => {
    if (scheduledSet.has(d.id) && !publishedSet.has(d.id)) return false;
    return true;
  });

  // ロック: スケジュール未公開（clearance超過は既にAPIでフィルタ済み）
  const locked: NovelDocument[] = [];

  const selected = accessible.find(d => d.id === selectedId) ?? null;

  // クリアランス別グループ
  const grouped: Record<number, NovelDocument[]> = {};
  for (const doc of accessible) {
    if (!grouped[doc.clearance]) grouped[doc.clearance] = [];
    (grouped[doc.clearance] as NovelDocument[]).push(doc);
  }

  return (
    <div
      className="layout-split"
      style={{ height: "100dvh", background: "var(--color-bg)" }}
    >
      {/* ── サイドバー（文書一覧） ── */}
      <aside
        className="layout-split-sidebar"
        style={{
          width: 240,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background:  "var(--color-bg-surface)",
          borderRight: "1px solid rgba(0,200,255,0.08)",
        }}
      >
        {/* ヘッダー */}
        <div
          className="px-4 pt-5 pb-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}
        >
          <div className="hud-label mb-1">FIELD JOURNAL</div>
          <h1 className="m-0 text-[14px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.06em" }}>
            機関員の日記
          </h1>
          <div className="hud-label mt-1">
            {accessible.length}件 / 全{allDocuments.length}件
          </div>
        </div>

        {/* スクロール可能なリスト */}
        <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([lv, docs]) => (
              <div key={lv}>
                <div
                  className="hud-label px-1 mb-1.5"
                  style={{ color: Number(lv) === 0 ? "var(--color-fg-muted)" : "var(--color-warning)" }}
                >
                  {Number(lv) === 0 ? "一般公開" : `CLEARANCE LV${lv}`}
                </div>
                <div className="flex flex-col gap-1">
                  {docs.map(doc => (
                    <DocItem
                      key={doc.id}
                      doc={doc}
                      active={selectedId === doc.id}
                      onClick={() => setSelectedId(doc.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          }

          {/* ロック済みアイテム */}
          {locked.length > 0 && (
            <div>
              <div className="hud-label px-1 mb-1.5" style={{ color: "var(--color-fg-decorative)" }}>
                ロック中 ({locked.length}件)
              </div>
              <div className="flex flex-col gap-1">
                {locked.map(doc => (
                  <LockedItem
                    key={doc.id}
                    doc={doc}
                    scheduleHeld={scheduledSet.has(doc.id) && !publishedSet.has(doc.id) && doc.clearance <= level}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── 本文パネル ── */}
      {selected ? <DocViewer doc={selected} /> : <EmptyViewer />}
    </div>
  );
}
