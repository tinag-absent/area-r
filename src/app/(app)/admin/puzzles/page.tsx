"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

interface Puzzle {
  id:           string;
  slug:         string;
  title:        string;
  cipher_text:  string;
  answer:       string;
  hint:         string | null;
  xp_reward:    number;
  clearance_req: number;
  is_active:    number;
  created_at:   string;
  solveCount:   number;
}

const iStyle: React.CSSProperties = {
  background: "var(--color-bg)", border: "1px solid rgba(255,180,60,0.2)",
  color: "var(--color-foreground)", fontFamily: "var(--font-mono)",
  fontSize: 12, padding: "6px 8px", borderRadius: 2, width: "100%", outline: "none",
};

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return (
    <div className="p-3 mb-4 rounded-sm text-[12px]"
      style={{
        background: ok ? "rgba(0,230,118,0.06)" : "rgba(255,68,68,0.06)",
        border: `1px solid ${ok ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}`,
        color: ok ? "var(--color-success)" : "var(--color-danger)",
        fontFamily: "var(--font-mono)",
      }}>
      {text}
    </div>
  );
}

export default function PuzzlesAdminPage() {
  const [puzzles,  setPuzzles]  = useState<Puzzle[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [showForm, setShowForm] = useState(false);

  const [slug,         setSlug]         = useState("");
  const [title,        setTitle]        = useState("");
  const [cipherText,   setCipherText]   = useState("");
  const [answer,       setAnswer]       = useState("");
  const [hint,         setHint]         = useState("");
  const [xpReward,     setXpReward]     = useState("50");
  const [clearanceReq, setClearanceReq] = useState("0");
  const [submitting,   setSubmitting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/puzzles", { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.ok) setPuzzles(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (!slug.trim() || !title.trim() || !cipherText.trim() || !answer.trim()) {
      setMsg("slug・タイトル・暗号文・解答は必須です"); return;
    }
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          slug: slug.trim(), title: title.trim(),
          cipher_text: cipherText.trim(), answer: answer.trim(),
          hint: hint.trim() || undefined,
          xp_reward: Number(xpReward),
          clearance_req: Number(clearanceReq),
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`エラー: ${d.error}`); return; }
      setMsg("✓ パズルを作成しました");
      setShowForm(false);
      setSlug(""); setTitle(""); setCipherText(""); setAnswer(""); setHint(""); setXpReward("50"); setClearanceReq("0");
      load();
    } finally { setSubmitting(false); }
  }

  async function toggleActive(id: string) {
    const res = await fetch("/api/admin/puzzles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ id, action: "toggle_active" }),
    });
    const d = await res.json();
    setMsg(res.ok ? `✓ ${d.is_active ? "有効化" : "無効化"}しました` : `エラー: ${d.error}`);
    load();
  }

  async function doDelete(id: string, slug: string) {
    if (!confirm(`「${slug}」を削除しますか？解答履歴も削除されます。`)) return;
    const res = await fetch(`/api/admin/puzzles?id=${id}`, {
      method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ 削除しました" : `エラー: ${d.error}`);
    load();
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[920px] mx-auto">
      <PageHeader eyebrow="ADMIN — CIPHER MANAGEMENT" title="謎コンテンツ管理" eyebrowColor="warning" />

      {msg && <Msg text={msg} />}

      <div className="flex justify-between items-center mb-4">
        <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>
          {puzzles.length} 件 / アクティブ {puzzles.filter(p => p.is_active).length} 件
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="text-[11px] px-4 py-1.5 rounded-sm cursor-pointer"
          style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.35)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
          {showForm ? "▲ 閉じる" : "＋ パズル作成"}
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <div className="rounded-sm p-5 mb-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,180,60,0.18)" }}>
          <div className="hud-label mb-4" style={{ color: "var(--color-warning)" }}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />新規パズル</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="hud-label block mb-1">スラグ（URL用・英数字）</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="cipher-001" style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">タイトル</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="第一暗号" style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">XP報酬</label>
              <input type="number" value={xpReward} onChange={e => setXpReward(e.target.value)} min={0} max={1000} style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">必要クリアランス</label>
              <select value={clearanceReq} onChange={e => setClearanceReq(e.target.value)} style={iStyle}>
                {[0,1,2,3,4,5].map(n => <option key={n} value={n}>LV{n}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="hud-label block mb-1">暗号文（プレイヤーに表示）</label>
              <textarea value={cipherText} onChange={e => setCipherText(e.target.value)}
                rows={4} placeholder="XLMOR WSMIO..."
                style={{ ...iStyle, resize: "vertical" }} />
            </div>
            <div>
              <label className="hud-label block mb-1">正解（大文字小文字・スペース無視で照合）</label>
              <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="解答文字列" style={iStyle} />
            </div>
            <div>
              <label className="hud-label block mb-1">ヒント（省略可）</label>
              <input value={hint} onChange={e => setHint(e.target.value)} placeholder="省略可" style={iStyle} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleSubmit} disabled={submitting}
              className="text-[12px] px-6 py-2 rounded-sm cursor-pointer"
              style={{ background: "rgba(255,180,60,0.12)", border: "1px solid rgba(255,180,60,0.4)", color: "var(--color-warning)", fontFamily: "var(--font-mono)", opacity: submitting ? 0.5 : 1 }}>
              {submitting ? "作成中..." : "作成"}
            </button>
          </div>
        </div>
      )}

      {/* 一覧 */}
      {loading ? <LoadingStatus /> : (
        <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,180,60,0.12)" }}>
          <div className="grid gap-2 px-4 py-2 text-[11px]"
            style={{ gridTemplateColumns: "1fr 60px 60px 60px 70px 80px", background: "rgba(255,180,60,0.06)", borderBottom: "1px solid rgba(255,180,60,0.1)", color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
            <span>パズル</span><span>LV</span><span>XP</span><span>解答数</span><span>状態</span><span>操作</span>
          </div>

          {puzzles.length === 0 ? (
            <div className="px-4 py-10 text-center hud-label" style={{ color: "var(--color-fg-muted)", background: "var(--color-bg-surface)" }}>
              パズルはまだ作成されていません
            </div>
          ) : puzzles.map((p, i) => (
            <div key={p.id} className="grid gap-2 px-4 py-3 items-center"
              style={{ gridTemplateColumns: "1fr 60px 60px 60px 70px 80px", borderBottom: i < puzzles.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "var(--color-bg-surface)" }}>
              <div>
                <div className="text-[12px] leading-snug" style={{ color: "var(--color-foreground)" }}>{p.title}</div>
                <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{p.slug}</div>
              </div>
              <div className="text-[11px]" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>LV{p.clearance_req}</div>
              <div className="text-[11px]" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>+{p.xp_reward}</div>
              <div className="text-[11px]" style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>{p.solveCount}人</div>
              <div className="text-[11px]" style={{ color: p.is_active ? "var(--color-success)" : "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                {p.is_active ? "ACTIVE" : "OFF"}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => toggleActive(p.id)}
                  className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                  style={{ background: p.is_active ? "rgba(255,68,68,0.08)" : "rgba(0,230,118,0.08)", border: `1px solid ${p.is_active ? "rgba(255,68,68,0.25)" : "rgba(0,230,118,0.25)"}`, color: p.is_active ? "var(--color-danger)" : "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                  {p.is_active ? "無効化" : "有効化"}
                </button>
                <button onClick={() => doDelete(p.id, p.slug)}
                  className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
                  style={{ background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
