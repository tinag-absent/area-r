import { PageHeader } from "@/components/ui/PageHeader";
import { Icon, NavIcon } from "@/components/ui/Icon";

const NPCS = [
  { npc: "K-ECHO", icon: "dashboard", color: "#00c8ff", triggers: ["海蝕", "侵食", "海は削れ"],  idle: 3 },
  { npc: "N-VEIL", icon: "mission", color: "#a064ff", triggers: ["次元", "次元裂孔", "境界"],   idle: 4 },
  { npc: "L-RIFT", icon: "hex", color: "#3ecf6a", triggers: ["システム", "エラー", "障害"], idle: 3 },
  { npc: "A-PHOS", icon: "heart", color: "#ffb43c", triggers: ["助けて", "怖い", "大丈夫"],   idle: 4 },
  { npc: "G-MIST", icon: "wave", color: "#9090a0", triggers: ["霧", "境界", "消滅"],        idle: 2 },
] as const;

export default function NpcScriptsPage() {
  return (
    <div className="animate-[fadeIn_0.4s_ease_both] p-4 sm:p-8 max-w-[800px]">
      <PageHeader eyebrow="ADMIN — NPC SCRIPTS" title="NPCスクリプト管理" eyebrowColor="warning" />

      {/* Info */}
      <div
        className="rounded-sm p-4 mb-4 text-[12px] leading-[1.8]"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid rgba(255,180,60,0.12)",
          color: "var(--color-fg-dim)",
        }}
      >
        <p className="m-0">
          NPCの自動返答ルールは{" "}
          <code style={{ color: "var(--color-primary)" }}>src/lib/npc-engine.ts</code>{" "}
          で定義されています。
        </p>
        <p className="m-0 mt-1">
          分岐スクリプト（条件付き会話）は{" "}
          <code style={{ color: "var(--color-primary)" }}>npc_conv_states</code>{" "}
          テーブルで管理します。
        </p>
      </div>

      {/* NPC list */}
      <div className="flex flex-col gap-2">
        {NPCS.map(n => (
          <div
            key={n.npc}
            className="rounded-sm p-4 transition-all duration-150"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid rgba(0,200,255,0.07)",
              borderLeft: `3px solid ${n.color}55`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-bg-raised)";
              (e.currentTarget as HTMLElement).style.borderLeftColor = `${n.color}99`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-bg-surface)";
              (e.currentTarget as HTMLElement).style.borderLeftColor = `${n.color}55`;
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <NavIcon icon={n.icon} size={15} color={n.color} />
              <span className="text-[13px] font-bold" style={{ color: n.color }}>{n.npc}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="hud-label">トリガー:</span>
              {n.triggers.map(t => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded-sm"
                  style={{
                    border: `1px solid ${n.color}44`,
                    color: n.color,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t}
                </span>
              ))}
              <span className="hud-label ml-2">アイドル {n.idle}件</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 px-4 py-3 rounded-sm text-[11px]"
        style={{
          border: "1px dashed rgba(255,180,60,0.12)",
          color: "var(--color-fg-muted)",
        }}
      >
        スクリプトの詳細編集は <code style={{ color: "var(--color-primary)" }}>npc-engine.ts</code> を直接編集してください。GUIエディタは今後実装予定。
      </div>
    </div>
  );
}
