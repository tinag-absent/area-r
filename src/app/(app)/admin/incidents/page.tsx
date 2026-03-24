"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

const iS: React.CSSProperties = { background:"var(--color-bg)", border:"1px solid rgba(255,180,60,0.2)", color:"var(--color-foreground)", fontFamily:"var(--font-mono)", fontSize:12, padding:"6px 8px", borderRadius:2, width:"100%", outline:"none" };
const taS: React.CSSProperties = { ...iS, resize:"vertical" as const, minHeight:80 };
const SEV_COLOR: Record<string,string> = { critical:"var(--color-danger)", warning:"var(--color-warning)", safe:"var(--color-success)" };

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background:ok?"rgba(0,230,118,0.06)":"rgba(255,68,68,0.06)", border:`1px solid ${ok?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.25)"}`, color:ok?"var(--color-success)":"var(--color-danger)", fontFamily:"var(--font-mono)" }}>{text}</div>;
}

interface Incident { id:string; severity:string; status:string; name:string; lon:number; lat:number; location:string; entity:string; gsi:number; division:string; desc:string; time:string; city_code:string|null; city_name:string|null; }
const EMPTY: Partial<Incident> = { severity:"warning", status:"監視中", name:"", lon:131.6, lat:33.2, location:"", entity:"", gsi:3.0, division:"", desc:"", time:"", city_code:null, city_name:null };

export default function AdminIncidentsPage() {
  const [items,   setItems]   = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [editing, setEditing] = useState<Incident|null>(null);
  const [form,    setForm]    = useState<Partial<Incident>>(EMPTY);
  const [isNew,   setIsNew]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [filter,  setFilter]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/incidents",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) setItems(await r.json()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(inc: Incident) { setForm({...inc}); setEditing(inc); setIsNew(false); setMsg(""); }
  function sf(k: keyof Incident) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:ev.target.value})); }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body = { ...form, lon:Number(form.lon||0), lat:Number(form.lat||0), gsi:Number(form.gsi||0) };
      if (!isNew) body.id = editing!.id;
      const r = await fetch("/api/admin/incidents",{method:isNew?"POST":"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify(body)});
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`);return;}
      setMsg(`✓ ${isNew?"作成":"更新"}しました`); setIsNew(false); load();
    } finally { setSaving(false); }
  }

  async function del(id:string, name:string) {
    if(!confirm(`「${name}」を削除しますか？`))return;
    await fetch(`/api/admin/incidents?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg("✓ 削除しました"); setEditing(null); load();
  }

  const filtered = filter ? items.filter(i=>i.name.includes(filter)||i.location.includes(filter)||i.severity===filter) : items;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1100px] mx-auto">
      <PageHeader eyebrow="ADMIN — INCIDENTS" title="フィールドインシデント管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div>
          <button onClick={()=>{setForm(EMPTY);setEditing(null);setIsNew(true);setMsg("");}} className="w-full mb-2 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ 新規インシデント</button>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="名称・地点で絞込..." style={{...iS,marginBottom:8}}/>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-1 overflow-y-auto" style={{maxHeight:580}}>
              {filtered.map(inc => (
                <div key={inc.id} onClick={()=>startEdit(inc)} className="px-3 py-2.5 rounded-sm cursor-pointer" style={{background:editing?.id===inc.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)",border:`1px solid ${editing?.id===inc.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`,borderLeft:`3px solid ${SEV_COLOR[inc.severity]||"var(--color-fg-muted)"}`}}>
                  <div className="text-[12px] font-bold" style={{color:"var(--color-foreground)"}}>{inc.name}</div>
                  <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{inc.location} · GSI {Number(inc.gsi).toFixed(1)}</div>
                  <div style={{display:"flex",gap:4,marginTop:2}}>
                    <span style={{fontSize:9,padding:"1px 5px",borderRadius:2,background:`${SEV_COLOR[inc.severity]||"var(--color-fg-muted)"}18`,color:SEV_COLOR[inc.severity]||"var(--color-fg-muted)",fontFamily:"var(--font-mono)"}}>{inc.severity.toUpperCase()}</span>
                    <span style={{fontSize:9,padding:"1px 5px",borderRadius:2,background:"rgba(0,200,255,0.06)",color:"var(--color-fg-muted)",fontFamily:"var(--font-mono)"}}>{inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {(isNew||editing) && (
          <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
            <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNew?"新規インシデント":"編集: "+editing?.id}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2"><label className="hud-label block mb-1">インシデント名 *</label><input value={form.name||""} onChange={sf("name")} style={iS}/></div>
              <div><label className="hud-label block mb-1">深刻度</label><select value={form.severity||"warning"} onChange={sf("severity")} style={iS}><option value="critical">CRITICAL</option><option value="warning">WARNING</option><option value="safe">SAFE</option></select></div>
              <div><label className="hud-label block mb-1">ステータス</label><select value={form.status||"監視中"} onChange={sf("status")} style={iS}>{["対応中","監視中","収束済み","観察中"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="hud-label block mb-1">GSI値</label><input type="number" step="0.1" value={form.gsi||0} onChange={sf("gsi")} style={iS}/></div>
              <div><label className="hud-label block mb-1">発生時刻</label><input value={form.time||""} onChange={sf("time")} placeholder="2026-02-01 12:00" style={iS}/></div>
              <div><label className="hud-label block mb-1">緯度</label><input type="number" step="0.0001" value={form.lat||0} onChange={sf("lat")} style={iS}/></div>
              <div><label className="hud-label block mb-1">経度</label><input type="number" step="0.0001" value={form.lon||0} onChange={sf("lon")} style={iS}/></div>
              <div><label className="hud-label block mb-1">所在地</label><input value={form.location||""} onChange={sf("location")} style={iS}/></div>
              <div><label className="hud-label block mb-1">市区町村名</label><input value={form.city_name||""} onChange={sf("city_name")} style={iS}/></div>
              <div><label className="hud-label block mb-1">市区町村コード</label><input value={form.city_code||""} onChange={sf("city_code")} style={iS}/></div>
              <div><label className="hud-label block mb-1">関連実体</label><input value={form.entity||""} onChange={sf("entity")} style={iS}/></div>
              <div><label className="hud-label block mb-1">担当部門</label><input value={form.division||""} onChange={sf("division")} style={iS}/></div>
            </div>
            <div className="mb-4"><label className="hud-label block mb-1">概要</label><textarea value={form.desc||""} onChange={sf("desc")} rows={4} style={taS}/></div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{setIsNew(false);setEditing(null);}} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--color-fg-dim)",fontFamily:"var(--font-mono)"}}>キャンセル</button>
              {!isNew && <button onClick={()=>del(editing!.id,editing!.name)} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",color:"var(--color-danger)",fontFamily:"var(--font-mono)"}}>削除</button>}
              <button onClick={save} disabled={saving} style={{padding:"7px 16px",borderRadius:2,cursor:"pointer",fontSize:12,background:"rgba(255,180,60,0.12)",border:"1px solid rgba(255,180,60,0.4)",color:"var(--color-warning)",fontFamily:"var(--font-mono)",opacity:saving?0.5:1}}>{saving?"保存中...":"保存"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
