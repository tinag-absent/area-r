import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── 外部パッケージ（Node.js ネイティブモジュール） ─────────────────
  // @libsql/client と bcryptjs は Edge Runtime 非対応のため
  // Server Components の外部パッケージとして宣言する（Next.js 14.2+ stable）
  serverExternalPackages: ["@libsql/client", "bcryptjs"],

  // ── TypeScript ─────────────────────────────────────────────────────
  typescript: {
    // ビルド時の型エラーをエラーとして扱う（デフォルト: true）
    ignoreBuildErrors: false,
  },

  // ── ログ設定（Next.js 15.3+） ──────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
