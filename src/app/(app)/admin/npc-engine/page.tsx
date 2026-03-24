"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

const NPC_LIST = ["K-ECHO", "N-VEIL", "L-RIFT", "A-PHOS", "G-MIST"] as const;
const NPC_COLORS: Record<string, string> = {
  "K-ECHO": "#00c8ff", "N-VEIL": "#a064ff", "L-RIFT": "#50dc78",
  "A-PHOS": "#ffb43c", "G-MIST": "#909090",
};

interface Rule {
  id: string; active: number; priority: number; created_at: string;
  data: {
    keywords:        string[];
    npc:             string;
    responses:       string[];
    chainNpc?:       string;
    chainChance?:    number;
    chainResponses?: string[];
    delayMin?:       number;
    delayMax?:       number;
  };
}

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, outline: "none", width: "100%",
};

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background: ok ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)", border: `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`, color: ok ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{text}</div>;
}

export default function AdminNpcEnginePage() {
  const [rules,      setRules]      = useState<Rule[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [filterNpc,  setFilterNpc]  = useState("");

  // フォーム
  const [fNpc,             setFNpc]             = useState("K-ECHO");
  const [fKeywords,        setFKeywords]        = useState("");
  const [fResponses,       setFResponses]       = useState("");
  const [fChainNpc,        setFChainNpc]        = useState("");
  const [fChainChance,     setFChainChance]     = useState("30");
  const [fChainResponses,  setFChainResponses]  = useState("");
  const [fDelayMin,        setFDelayMin]        = useState("1000");
  const [fDelayMax,        setFDelayMax]        = useState("4000");
  const [fPriority,        setFPriority]        = useState("0");
  const [submitting,       setSubmitting]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/npc-engine", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setRules(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    const keywords  = fKeywords.split(/[,、\n]/).map(k => k.trim()).filter(Boolean);
    const responses = fResponses.split("\n").map(r => r.trim()).filter(Boolean);
    if (!keywords.length)  { setMsg("キーワードを入力してください"); return; }
    if (!responses.length) { setMsg("返答を1件以上入力してください"); return; }

    const body: Record<string, unknown> = {
      keywords, npc: fNpc, responses,
      delayMin:  Number(fDelayMin),
      delayMax:  Number(fDelayMax),
      priority:  Number(fPriority),
    };
    if (fChainNpc.trim()) {
      body.chainNpc        = fChainNpc.trim();
      body.chainChance     = Number(fChainChance);
      body.chainResponses  = fChainResponses.split("\n").map(r => r.trim()).filter(Boolean);
    }

    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/admin/npc-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg("✓ ルールを追加しました");
      setShowForm(false);
      setFKeywords(""); setFResponses(""); setFChainNpc(""); setFChainResponses("");
      load();
    } finally { setSubmitting(false); }
  }

  async function toggleActive(id: string, current: number) {
    const res = await fetch("/api/admin/npc-engine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ id, active: !current }),
    });
    const d = await res.json();
    setMsg(res.ok ? `✓ ${current ? "無効化" : "有効化"}しました` : `エラー: ${d.error}`);
    load();
  }

  async function doDelete(id: string) {
    if (!confirm("このルールを削除しますか？")) return;
    const res = await fetch(`/api/admin/npc-engine?id=${id}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    setMsg(res.ok ? "✓ 削除しました" : "エラー");
    load();
  }

  const filtered = filterNpc ? rules.filter(r => r.data.npc === filterNpc) : rules;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[960px] mx-auto">
      <PageHeader eyebrow="ADMIN — NPC ENGINE" title="NPCエンジン動的ルール" eyebrowColor="warning" />

      <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.12)", color: "var(--color-fg-dim)" }}>
        ここで追加したルールは <code style={{ color: "var(--color-primary)" }}>npc_engine_rules</code> テーブルに保存され、デプロイなしで即時反映されます。
        静的ルール（npc-engine.ts）より優先されます。
      </div>

      {msg && <Msg text={msg} />}

      {/* フィルター + 追加ボタン */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-1">
          <button onClick={() => setFilterNpc("")}
            className="text-[10px] px-2 py-1 rounded-sm cursor-pointer"
            style={{ background: !filterNpc ? "rgba(255,180,60,0.12)" : "transparent", border: "1px solid rgba(255,180,60,0.2)", color: !filterNpc ? "var(--color-warning)" : "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
            ALL
          </button>
          {NPC_LIST.map(n => (
            <button key={n} onClick={() => setFilterNpc(filterNpc === n ? "" : n)}
              className="text-[10px] px-2 py-1 rounded-sm cursor-pointer"
              style={{ background: filterNpc === n ? `${NPC_COLORS[n]}18` : "transparent", border: `1px solid ${filterNpc === n ? NPC_COLORS[n] + "66" : "rgba(255,180,60,0.15)"}`, color: filterNpc === n ? NPC_COLORS[n] : "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
              {n}
            </button>
          ))}
        </div>
        <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
          {filtered.length} 件 / 有効 {filtered.filter(r => r.active).length} 件
        </span>
        <button onClick={() => setShowForm(v => !v)}
          className="ml-auto text-[11px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.35)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
          {showForm ? "▲ 閉じる" : "＋ ルール追加"}
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="rounded-sm p-5 mb-5" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.18)" }}>
          <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />新規ルール</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="hud-label block mb-1">NPC</label>
              <div className="flex gap-1 flex-wrap">
                {NPC_LIST.map(n => (
                  <button key={n} onClick={() => setFNpc(n)}
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 2, cursor: "pointer", background: fNpc === n ? `${NPC_COLORS[n]}18` : "transparent", border: `1px solid ${fNpc === n ? NPC_COLORS[n] : "rgba(255,180,60,0.15)"}`, color: fNpc === n ? NPC_COLORS[n] : "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="hud-label block mb-1">優先度（高いほど先に評価）</label>
              <input type="number" value={fPriority} onChange={e => setFPriority(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">トリガーキーワード（カンマ or 改行区切り）</label>
              <textarea value={fKeywords} onChange={e => setFKeywords(e.target.value)}
                rows={2} placeholder="海蝕, 侵食, 海は削れ" style={{ ...iStyle, resize: "vertical" }} />
            </div>
            <div>
              <label className="hud-label block mb-1">返答（改行区切り、複数でランダム選択）</label>
              <textarea value={fResponses} onChange={e => setFResponses(e.target.value)}
                rows={2} placeholder="「海は削れ続けている…」&#10;「観測値が跳ね上がった」" style={{ ...iStyle, resize: "vertical" }} />
            </div>
            <div>
              <label className="hud-label block mb-1">遅延 最小ms</label>
              <input type="number" value={fDelayMin} onChange={e => setFDelayMin(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">遅延 最大ms</label>
              <input type="number" value={fDelayMax} onChange={e => setFDelayMax(e.target.value)} style={iStyle} />
            </div>
          </div>

          {/* チェーン設定 */}
          <div className="mb-4 p-3 rounded-sm" style={{ background: "var(--color-bg)", border: "1px dashed rgba(255,180,60,0.12)" }}>
            <div className="hud-label mb-2" style={{ color: "var(--color-fg-muted)" }}>チェーン返答（省略可）</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="hud-label block mb-1">連鎖するNPC</label>
                <select value={fChainNpc} onChange={e => setFChainNpc(e.target.value)} style={iStyle}>
                  <option value="">なし</option>
                  {NPC_LIST.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="hud-label block mb-1">発生確率（%）</label>
                <input type="number" value={fChainChance} onChange={e => setFChainChance(e.target.value)} min={1} max={100} style={iStyle} />
              </div>
              <div>
                <label className="hud-label block mb-1">連鎖返答（改行区切り）</label>
                <textarea value={fChainResponses} onChange={e => setFChainResponses(e.target.value)}
                  rows={2} placeholder="「…興味深い」" style={{ ...iStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={submitting}
              className="text-[12px] px-6 py-2 rounded-sm cursor-pointer"
              style={{ background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)", color: "var(--color-warning)", fontFamily: "var(--font-mono)", opacity: submitting ? 0.5 : 1 }}>
              {submitting ? "追加中..." : "ルールを追加"}
            </button>
          </div>
        </div>
      )}

      {/* ルール一覧 */}
      {loading ? <LoadingStatus /> : filtered.length === 0 ? (
        <div className="p-8 text-center hud-label rounded-sm" style={{ color: "var(--color-fg-muted)", border: "1px dashed rgba(255,180,60,0.1)" }}>
          動的ルールはまだ登録されていません
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(rule => {
            const col = NPC_COLORS[rule.data.npc] ?? "var(--color-primary)";
            return (
              <div key={rule.id} style={{
                border: `1px solid ${rule.active ? col + "44" : "rgba(255,255,255,0.07)"}`,
                borderLeft: `3px solid ${rule.active ? col : "rgba(255,255,255,0.12)"}`,
                borderRadius: 2, padding: "12px 14px",
                background: rule.active ? `${col}06` : "rgba(255,255,255,0.02)",
                opacity: rule.active ? 1 : 0.55,
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <span style={{ fontSize: 12, fontWeight: "bold", color: col, fontFamily: "var(--font-mono)" }}>
                        {rule.data.npc}
                      </span>
                      <span className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                        優先度 {rule.priority}
                      </span>
                      {!rule.active && (
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 2, background: "rgba(255,68,68,0.12)", border: "1px solid rgba(255,68,68,0.3)", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
                          DISABLED
                        </span>
                      )}
                    </div>

                    {/* キーワード */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rule.data.keywords.map(k => (
                        <span key={k} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 2, background: `${col}12`, border: `1px solid ${col}33`, color: col, fontFamily: "var(--font-mono)" }}>
                          {k}
                        </span>
                      ))}
                    </div>

                    {/* 返答 */}
                    <div className="flex flex-col gap-0.5">
                      {rule.data.responses.slice(0, 2).map((r, i) => (
                        <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)" }}>
                          「{r.slice(0, 50)}{r.length > 50 ? "…" : ""}」
                        </div>
                      ))}
                      {rule.data.responses.length > 2 && (
                        <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
                          他 {rule.data.responses.length - 2} 件
                        </div>
                      )}
                    </div>

                    {/* チェーン */}
                    {rule.data.chainNpc && (
                      <div className="mt-1.5 hud-label" style={{ color: "var(--color-fg-muted)" }}>
                        → {rule.data.chainNpc} ({rule.data.chainChance}%確率で連鎖)
                      </div>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive(rule.id, rule.active)}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, cursor: "pointer", background: rule.active ? "rgba(255,68,68,0.08)" : "rgba(0,230,118,0.08)", border: `1px solid ${rule.active ? "rgba(255,68,68,0.25)" : "rgba(0,230,118,0.25)"}`, color: rule.active ? "var(--color-danger)" : "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                      {rule.active ? "無効化" : "有効化"}
                    </button>
                    <button onClick={() => doDelete(rule.id)}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
