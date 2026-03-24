// Server Componentのデータ取得中に表示される
import { Icon } from "@/components/ui/Icon";
export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen text-fg-muted text-[13px] font-mono">
      <div className="text-center">
        <div className="text-primary mb-3"><Icon name="dashboard" size={20} color="var(--color-primary)" aria-hidden /></div>
        <div className="tracking-[0.2em]">LOADING…</div>
      </div>
    </div>
  );
}
