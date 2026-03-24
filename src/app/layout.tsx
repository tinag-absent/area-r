/**
 * layout.tsx — ルートレイアウト
 * Updated: 2026-03-23 — Share Tech Mono を next/font/local に移行（Google Fonts @import廃止）
 *   フォントファイル: public/fonts/ShareTechMono-Regular.woff2 (OFL, fontsource)
 */
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const shareTechMono = localFont({
  src: "../../public/fonts/ShareTechMono-Regular.woff2",
  display: "swap",
  variable: "--font-share-tech-mono",
  weight: "400",
});

export const metadata: Metadata = {
  title: "海蝕機関 — KAISHOKU AGENCY",
  description: "次元侵食を観測・収束する機密組織",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "海蝕機関",
  },
  icons: {
    icon:  "/icons/favicon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#00c8ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={shareTechMono.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Material Symbols Rounded — Google Fonts CDN（可変フォント・アイコン専用） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        {/* Vignette */}
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9991,
          background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.45) 88%, rgba(0,0,0,0.72) 100%)",
        }} />
        {children}
      </body>
    </html>
  );
}
