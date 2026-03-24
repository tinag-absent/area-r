"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import type { Entity } from "@/app/(app)/database/data";
import { Icon, NavIcon } from "@/components/ui/Icon";

const iS: React.CSSProperties = { background:"var(--color-bg)", border:"1px solid rgba(255,180,60,0.2)", color:"var(--color-foreground)", fontFamily:"var(--font-mono)", fontSize:12, padding:"6px 8px", borderRadius:2, width:"100%", outline:"none" };
const taS: React.CSSProperties = { ...iS, resize:"vertical" as const, minHeight:100 };
const THREAT_COLORS: Record<string,string> = { LOW:"var(--color-success)", MODERATE:"var(--color-warning)", HIGH:"var(--color-danger)", CRITICAL:"#ff2020", UNKNOWN:"var(--color-fg-muted)" };

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background:ok?"rgba(0,230,118,0.06)":"rgba(255,68,68,0.06)", border:`1px solid ${ok?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.25)"}`, color:ok?"var(--color-success)":"var(--color-danger)", fontFamily:"var(--font-mono)" }}>{text}</div>;
}

const EMPTY: Partial<Entity> = { designation:"", code:"", threat:"UNKNOWN", clearance:1, status:"OBSERVED", classification:"unknown", description:"", first_detected:"", neutralized:0, containment_protocol:"", observed_abilities:[], related_entities:[] };

export default function AdminEntitiesPage() {
  const [items,    setItems]    = useState<Entity[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [editing,  setEditing]  = useState<Entity | null>(null);
  const [form,     setForm]     = useState<Partial<Entity>>(EMPTY);
  const [isNew,    setIsNew]    = useState(false);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/db-entities",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) setItems(await r.json()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startNew() { setForm(EMPTY); setEditing(null); setIsNew(true); setMsg(""); }
  function startEdit(e: Entity) { setForm({ ...e, observed_abilities: Array.isArray(e.observed_abilities)?e.observed_abilities:[], related_entities: Array.isArray(e.related_entities)?e.related_entities:[] }); setEditing(e); setIsNew(false); setMsg(""); }
  function sf(k: keyof Entity) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:ev.target.value})); }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body = { ...form, clearance: Number(form.clearance||1), neutralized: form.neutralized!=null?Number(form.neutralized):null,
        observed_abilities: typeof form.observed_abilities==="string"?(form.observed_abilities as unknown as string).split("\n").filter(Boolean):form.observed_abilities||[],
        related_entities:   typeof form.related_entities==="string"?(form.related_entities as unknown as string).split("\n").filter(Boolean):form.related_entities||[],
      };
      if (!isNew) body.id = editing!.id;
      const r = await fetch("/api/admin/db-entities",{ method:isNew?"POST":"PATCH", headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"}, body:JSON.stringify(body) });
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`); return;}
      setMsg(`✓ ${isNew?"作成":"更新"}しました`); setIsNew(false); load();
    } finally { setSaving(false); }
  }

  async function del(id: string, name: string) {
    if(!confirm(`「${name}」を削除しますか？`)) return;
    const r = await fetch(`/api/admin/db-entities?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg(r.ok?"✓ 削除しました":"削除エラー"); load();
  }

  const isEditing = isNew || !!editing;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1100px] mx-auto">
      <PageHeader eyebrow="ADMIN — ENTITIES" title="実体カタログ管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* リスト */}
        <div>
          <button onClick={startNew} className="w-full mb-3 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ 新規実体</button>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-1 overflow-y-auto" style={{maxHeight:600}}>
              {items.map(e => (
                <div key={e.id} onClick={()=>startEdit(e)} className="px-3 py-2.5 rounded-sm cursor-pointer" style={{background:editing?.id===e.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)",border:`1px solid ${editing?.id===e.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`,borderLeft:`3px solid ${THREAT_COLORS[e.threat]||"var(--color-fg-muted)"}`}}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[12px] font-bold" style={{color:"var(--color-foreground)"}}>{e.designation}</div>
                      <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{e.code} · LV{e.clearance}</div>
                    </div>
                    <span style={{fontSize:10,padding:"1px 5px",borderRadius:2,background:`${THREAT_COLORS[e.threat]}18`,border:`1px solid ${THREAT_COLORS[e.threat]}44`,color:THREAT_COLORS[e.threat],fontFamily:"var(--font-mono)"}}>{e.threat}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* フォーム */}
        {isEditing && (
          <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
            <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNew?"新規実体":"編集: "+editing?.code}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="hud-label block mb-1">呼称 *</label><input value={form.designation||""} onChange={sf("designation")} style={iS}/></div>
              <div><label className="hud-label block mb-1">コード *</label><input value={form.code||""} onChange={sf("code")} placeholder="E-026" style={iS}/></div>
              <div><label className="hud-label block mb-1">脅威レベル</label><select value={form.threat||"UNKNOWN"} onChange={sf("threat")} style={iS}>{["LOW","MODERATE","HIGH","CRITICAL","UNKNOWN"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label className="hud-label block mb-1">クリアランス</label><select value={form.clearance||1} onChange={sf("clearance")} style={iS}>{[1,2,3,4,5].map(n=><option key={n} value={n}>LV{n}</option>)}</select></div>
              <div><label className="hud-label block mb-1">ステータス</label><select value={form.status||"OBSERVED"} onChange={sf("status")} style={iS}>{["ACTIVE","OBSERVED","CONTAINED","CLASSIFIED","MISSING"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="hud-label block mb-1">分類</label><input value={form.classification||""} onChange={sf("classification")} style={iS}/></div>
              <div><label className="hud-label block mb-1">初観測日</label><input value={form.first_detected||""} onChange={sf("first_detected")} placeholder="2020-01-01" style={iS}/></div>
              <div><label className="hud-label block mb-1">無力化数</label><input type="number" value={form.neutralized??0} onChange={sf("neutralized")} style={iS}/></div>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div><label className="hud-label block mb-1">説明</label><textarea value={form.description||""} onChange={sf("description")} rows={3} style={taS}/></div>
              <div><label className="hud-label block mb-1">収容プロトコル</label><textarea value={form.containment_protocol||""} onChange={sf("containment_protocol")} rows={3} style={taS}/></div>
              <div>
                <label className="hud-label block mb-1">観測能力（改行区切り）</label>
                <textarea value={(Array.isArray(form.observed_abilities)?form.observed_abilities:[]as string[]).join("\n")} onChange={e=>setForm(p=>({...p,observed_abilities:e.target.value.split("\n")}))} rows={3} style={taS}/>
              </div>
              <div>
                <label className="hud-label block mb-1">関連実体ID（改行区切り）</label>
                <textarea value={(Array.isArray(form.related_entities)?form.related_entities:[]as string[]).join("\n")} onChange={e=>setForm(p=>({...p,related_entities:e.target.value.split("\n")}))} rows={2} style={taS}/>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{setIsNew(false);setEditing(null);}} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--color-fg-dim)",fontFamily:"var(--font-mono)"}}>キャンセル</button>
              {!isNew && <button onClick={()=>del(editing!.id,editing!.designation)} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",color:"var(--color-danger)",fontFamily:"var(--font-mono)"}}>削除</button>}
              <button onClick={save} disabled={saving} style={{padding:"7px 16px",borderRadius:2,cursor:"pointer",fontSize:12,background:"rgba(255,180,60,0.12)",border:"1px solid rgba(255,180,60,0.4)",color:"var(--color-warning)",fontFamily:"var(--font-mono)",opacity:saving?0.5:1}}>{saving?"保存中...":"保存"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
