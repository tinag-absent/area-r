/**
 * console/layout.tsx
 * 観測コンソール専用レイアウト。
 * 親レイアウト（サイドバー付き）の上に position:fixed でビューポート全体を覆い、
 * サイドバーを完全に隠す独立したUI空間を作る。
 */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#080c08",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
