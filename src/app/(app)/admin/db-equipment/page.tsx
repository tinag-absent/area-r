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

interface Equipment { id:string; name:string; code:string; category:string; status:string; clearance:number; quantity:number|null; description:string; weight:string; issued_by:string; specifications:Record<string,string>; maintenance_cycle:string; }

const EMPTY: Partial<Equipment> = { name:"", code:"", category:"", status:"IN_SERVICE", clearance:1, quantity:null, description:"", weight:"", issued_by:"", specifications:{}, maintenance_cycle:"" };

export default function AdminEquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Equipment|null>(null);
  const [form, setForm] = useState<Partial<Equipment>>(EMPTY);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [specsRaw, setSpecsRaw] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/db-equipment",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) setItems(await r.json()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(eq: Equipment) {
    setForm({...eq});
    setSpecsRaw(Object.entries(eq.specifications||{}).map(([k,v])=>`${k}: ${v}`).join("\n"));
    setEditing(eq); setIsNew(false); setMsg("");
  }
  function sf(k: keyof Equipment) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:ev.target.value})); }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const specs: Record<string,string> = {};
      specsRaw.split("\n").forEach(line=>{ const [k,...v]=line.split(":"); if(k?.trim()) specs[k.trim()]=v.join(":").trim(); });
      const body = { ...form, clearance:Number(form.clearance||1), quantity:form.quantity!=null?Number(form.quantity):null, specifications:specs };
      if (!isNew) body.id = editing!.id;
      const r = await fetch("/api/admin/db-equipment",{method:isNew?"POST":"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify(body)});
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`);return;}
      setMsg(`✓ ${isNew?"作成":"更新"}しました`); setIsNew(false); load();
    } finally { setSaving(false); }
  }

  async function del(id:string, name:string) {
    if(!confirm(`「${name}」を削除しますか？`))return;
    await fetch(`/api/admin/db-equipment?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg("✓ 削除しました"); load();
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1100px] mx-auto">
      <PageHeader eyebrow="ADMIN — EQUIPMENT" title="装備データベース管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div>
          <button onClick={()=>{setForm(EMPTY);setSpecsRaw("");setEditing(null);setIsNew(true);setMsg("");}} className="w-full mb-3 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ 新規装備</button>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-1 overflow-y-auto" style={{maxHeight:600}}>
              {items.map(eq => (
                <div key={eq.id} onClick={()=>startEdit(eq)} className="px-3 py-2.5 rounded-sm cursor-pointer" style={{background:editing?.id===eq.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)",border:`1px solid ${editing?.id===eq.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`}}>
                  <div className="text-[12px] font-bold" style={{color:"var(--color-foreground)"}}>{eq.name}</div>
                  <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{eq.code} · {eq.category} · LV{eq.clearance}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {(isNew||editing) && (
          <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
            <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNew?"新規装備":"編集: "+editing?.code}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="hud-label block mb-1">装備名 *</label><input value={form.name||""} onChange={sf("name")} style={iS}/></div>
              <div><label className="hud-label block mb-1">コード *</label><input value={form.code||""} onChange={sf("code")} placeholder="EQ-021" style={iS}/></div>
              <div><label className="hud-label block mb-1">カテゴリ</label><input value={form.category||""} onChange={sf("category")} style={iS}/></div>
              <div><label className="hud-label block mb-1">ステータス</label><select value={form.status||"IN_SERVICE"} onChange={sf("status")} style={iS}>{["IN_SERVICE","PENDING","LIMITED","RESTRICTED","CLASSIFIED"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="hud-label block mb-1">クリアランス</label><select value={form.clearance||1} onChange={sf("clearance")} style={iS}>{[1,2,3,4,5].map(n=><option key={n} value={n}>LV{n}</option>)}</select></div>
              <div><label className="hud-label block mb-1">在庫数</label><input type="number" value={form.quantity??""} onChange={sf("quantity")} style={iS}/></div>
              <div><label className="hud-label block mb-1">重量</label><input value={form.weight||""} onChange={sf("weight")} style={iS}/></div>
              <div><label className="hud-label block mb-1">支給元</label><input value={form.issued_by||""} onChange={sf("issued_by")} style={iS}/></div>
              <div className="col-span-2"><label className="hud-label block mb-1">メンテナンス周期</label><input value={form.maintenance_cycle||""} onChange={sf("maintenance_cycle")} style={iS}/></div>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div><label className="hud-label block mb-1">説明</label><textarea value={form.description||""} onChange={sf("description")} rows={3} style={taS}/></div>
              <div><label className="hud-label block mb-1">仕様（key: value 形式 / 改行区切り）</label><textarea value={specsRaw} onChange={e=>setSpecsRaw(e.target.value)} rows={4} placeholder={"重量: 2.3kg\n出力: 500W"} style={taS}/></div>
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
