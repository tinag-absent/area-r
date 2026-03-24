/**
 * /admin/novel-db
 * content_entries テーブルの小説エントリを一覧・プレビューするページ。
 * /admin/content のシンプルなビューアー版。
 */
import { redirect } from "next/navigation";
export default function NovelDbPage() {
  redirect("/admin/content?type=novel");
}
