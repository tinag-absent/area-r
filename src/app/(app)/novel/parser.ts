/**
 * src/app/(app)/novel/parser.ts
 *
 * ノベルタグパーサー。
 * [[TAG]] / [[TAG|ラベル]] 構文を Segment[] に変換する。
 *
 * NovelRenderer.tsx から分離することで:
 *   - 単体テスト可能
 *   - NovelRenderer の行数削減
 *   - 他コンポーネントからの再利用
 *
 * 対応タグ一覧:
 *   [[REDACTED]]           / [[REDACTED:理由]]
 *   [[VOID]]
 *   [[CORRUPTED]]          / [[CORRUPTED:ラベル]]
 *   [[TIMESTAMP:ISO]]
 *   [[ANOMALY:値]]
 *   [[USER]]
 *   [[UNKNOWN]]            / [[UNKNOWN:ヒント]]
 *   [[CLASSIFIED:LVN]]     / [[CLASSIFIED:LVN:ラベル]]
 *   [[任意ID]]             / [[任意ID|ラベル]]  → type: "card"
 */

import type { Segment } from "./tags/types";

export { type Segment };

/**
 * テキストを解析して Segment[] に変換する。
 *
 * @param content - [[TAG]] を含むプレーンテキスト
 * @returns パース済みセグメント配列
 */
export function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex               = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let   lastIndex           = 0;
  let   match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // タグ前のプレーンテキスト
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    const tag   = match[1]!.trim();
    const label = match[2]?.trim();

    // ── ARG演出タグ（カード表示なし） ────────────────────────────

    if (tag === "REDACTED" || tag.startsWith("REDACTED:")) {
      segments.push({
        type:   "redacted",
        reason: tag.startsWith("REDACTED:") ? tag.slice(9).trim() : undefined,
      });
    }
    else if (tag === "VOID") {
      segments.push({ type: "void" });
    }
    else if (tag === "CORRUPTED" || tag.startsWith("CORRUPTED:")) {
      segments.push({
        type:  "corrupted",
        label: tag.startsWith("CORRUPTED:") ? tag.slice(10).trim() : label,
      });
    }
    else if (tag.startsWith("TIMESTAMP:")) {
      segments.push({ type: "timestamp", iso: tag.slice(10).trim() });
    }
    else if (tag.startsWith("ANOMALY:")) {
      segments.push({ type: "anomaly", value: tag.slice(8).trim() });
    }
    else if (tag === "USER") {
      segments.push({ type: "user_tag" });
    }
    else if (tag === "UNKNOWN" || tag.startsWith("UNKNOWN:")) {
      segments.push({
        type: "unknown",
        hint: tag.startsWith("UNKNOWN:") ? tag.slice(8).trim() : label,
      });
    }
    else if (tag.startsWith("CLASSIFIED:")) {
      const rest  = tag.slice(11).trim();                         // "LV4" or "LV4:ラベル"
      const lvStr = rest.replace(/^LV/i, "").split(":")[0] ?? ""; // "4"
      const lv    = parseInt(lvStr, 10) || 0;
      const lbl   = rest.includes(":") ? rest.slice(rest.indexOf(":") + 1).trim() : label;
      segments.push({ type: "classified", level: lv, label: lbl ?? "" });
    }

    // ── DBカード参照タグ ──────────────────────────────────────────
    else {
      segments.push({ type: "card", id: tag, label });
    }

    lastIndex = regex.lastIndex;
  }

  // タグ後の残りテキスト
  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}
