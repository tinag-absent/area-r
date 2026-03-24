"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon } from "@/components/ui/Icon";

const iS: React.CSSProperties = { background:"var(--color-bg)", border:"1px solid rgba(255,180,60,0.2)", color:"var(--color-foreground)", fontFamily:"var(--font-mono)", fontSize:12, padding:"6px 8px", borderRadius:2, width:"100%", outline:"none" };
const taS: React.CSSProperties = { ...iS, resize:"vertical" as const, minHeight:80 };

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background:ok?"rgba(0,230,118,0.06)":"rgba(255,68,68,0.06)", border:`1px solid ${ok?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.25)"}`, color:ok?"var(--color-success)":"var(--color-danger)", fontFamily:"var(--font-mono)" }}>{text}</div>;
}

interface Facility { id:string; name:string; code:string; location:string; status:string; clearance:number; type:string; description:string; staff:number|null; established:string; equipment_installed:string[]; divisions_present:string[]; notes:string; }

const EMPTY: Partial<Facility> = { name:"", code:"", location:"", status:"OPERATIONAL", clearance:1, type:"", description:"", staff:null, established:"", equipment_installed:[], divisions_present:[], notes:"" };

export default function AdminFacilitiesPage() {
  const [items, setItems] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Facility|null>(null);
  const [form, setForm] = useState<Partial<Facility>>(EMPTY);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/db-facilities",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) setItems(await r.json()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(f: Facility) { setForm({...f,equipment_installed:Array.isArray(f.equipment_installed)?f.equipment_installed:[],divisions_present:Array.isArray(f.divisions_present)?f.divisions_present:[]}); setEditing(f); setIsNew(false); setMsg(""); }
  function sf(k: keyof Facility) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:ev.target.value})); }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body = { ...form, clearance:Number(form.clearance||1), staff:form.staff!=null?Number(form.staff):null,
        equipment_installed: (Array.isArray(form.equipment_installed)?form.equipment_installed:(form.equipment_installed as unknown as string||"").split("\n")).filter(Boolean),
        divisions_present:   (Array.isArray(form.divisions_present)?form.divisions_present:(form.divisions_present as unknown as string||"").split("\n")).filter(Boolean),
      };
      if (!isNew) body.id = editing!.id;
      const r = await fetch("/api/admin/db-facilities",{method:isNew?"POST":"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify(body)});
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`);return;}
      setMsg(`✓ ${isNew?"作成":"更新"}しました`); setIsNew(false); load();
    } finally { setSaving(false); }
  }

  async function del(id:string, name:string) {
    if(!confirm(`「${name}」を削除しますか？`))return;
    const r = await fetch(`/api/admin/db-facilities?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg(r.ok?"✓ 削除しました":"削除エラー"); load();
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1100px] mx-auto">
      <PageHeader eyebrow="ADMIN — FACILITIES" title="施設データベース管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <div>
          <button onClick={()=>{setForm(EMPTY);setEditing(null);setIsNew(true);setMsg("");}} className="w-full mb-3 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ 新規施設</button>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-1">
              {items.map(f => (
                <div key={f.id} onClick={()=>startEdit(f)} className="px-3 py-2.5 rounded-sm cursor-pointer" style={{background:editing?.id===f.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)",border:`1px solid ${editing?.id===f.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`}}>
                  <div className="text-[12px] font-bold" style={{color:"var(--color-foreground)"}}>{f.name}</div>
                  <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{f.code} · LV{f.clearance}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {(isNew||editing) && (
          <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
            <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNew?"新規施設":"編集: "+editing?.code}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="hud-label block mb-1">施設名 *</label><input value={form.name||""} onChange={sf("name")} style={iS}/></div>
              <div><label className="hud-label block mb-1">コード *</label><input value={form.code||""} onChange={sf("code")} placeholder="FAC-005" style={iS}/></div>
              <div><label className="hud-label block mb-1">種別</label><input value={form.type||""} onChange={sf("type")} style={iS}/></div>
              <div><label className="hud-label block mb-1">ステータス</label><select value={form.status||"OPERATIONAL"} onChange={sf("status")} style={iS}>{["OPERATIONAL","DEGRADED","LIMITED","RESTRICTED","CLASSIFIED"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="hud-label block mb-1">クリアランス</label><select value={form.clearance||1} onChange={sf("clearance")} style={iS}>{[1,2,3,4,5].map(n=><option key={n} value={n}>LV{n}</option>)}</select></div>
              <div><label className="hud-label block mb-1">スタッフ数</label><input type="number" value={form.staff??""} onChange={sf("staff")} style={iS}/></div>
              <div><label className="hud-label block mb-1">所在地</label><input value={form.location||""} onChange={sf("location")} style={iS}/></div>
              <div><label className="hud-label block mb-1">設立日</label><input value={form.established||""} onChange={sf("established")} style={iS}/></div>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div><label className="hud-label block mb-1">説明</label><textarea value={form.description||""} onChange={sf("description")} rows={3} style={taS}/></div>
              <div><label className="hud-label block mb-1">設置装備（改行区切り）</label><textarea value={(Array.isArray(form.equipment_installed)?form.equipment_installed:[]).join("\n")} onChange={e=>setForm(p=>({...p,equipment_installed:e.target.value.split("\n")}))} rows={2} style={taS}/></div>
              <div><label className="hud-label block mb-1">駐留部門（改行区切り）</label><textarea value={(Array.isArray(form.divisions_present)?form.divisions_present:[]).join("\n")} onChange={e=>setForm(p=>({...p,divisions_present:e.target.value.split("\n")}))} rows={2} style={taS}/></div>
              <div><label className="hud-label block mb-1">備考</label><textarea value={form.notes||""} onChange={sf("notes")} rows={2} style={taS}/></div>
            </div>
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
