"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon } from "@/components/ui/Icon";

const iS: React.CSSProperties = { background:"var(--color-bg)", border:"1px solid rgba(255,180,60,0.2)", color:"var(--color-foreground)", fontFamily:"var(--font-mono)", fontSize:12, padding:"6px 8px", borderRadius:2, width:"100%", outline:"none" };
const taS: React.CSSProperties = { ...iS, resize:"vertical" as const, minHeight:80 };
const STATUS_COLORS: Record<string,string> = { ACTIVE:"var(--color-success)", MISSING:"var(--color-warning)", LOCKED:"var(--color-danger)", CLASSIFIED:"var(--color-fg-muted)" };

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background:ok?"rgba(0,230,118,0.06)":"rgba(255,68,68,0.06)", border:`1px solid ${ok?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.25)"}`, color:ok?"var(--color-success)":"var(--color-danger)", fontFamily:"var(--font-mono)" }}>{text}</div>;
}

interface Personnel { id:string; codename:string; real_name:string; role:string; division:string; clearance:number; status:string; joined:string; last_seen:string; specialization:string; notes:string; anomaly_score:number|null; missions_completed:number|null; commendations:string[]; incident_flags:string[]; }

const EMPTY: Partial<Personnel> = { codename:"", real_name:"", role:"", division:"", clearance:1, status:"ACTIVE", joined:"", last_seen:"—", specialization:"", notes:"", anomaly_score:null, missions_completed:null, commendations:[], incident_flags:[] };

export default function AdminPersonnelPage() {
  const [items, setItems] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Personnel|null>(null);
  const [form, setForm] = useState<Partial<Personnel>>(EMPTY);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/db-personnel",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) setItems(await r.json()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(p: Personnel) { setForm({...p,commendations:Array.isArray(p.commendations)?p.commendations:[],incident_flags:Array.isArray(p.incident_flags)?p.incident_flags:[]}); setEditing(p); setIsNew(false); setMsg(""); }
  function sf(k: keyof Personnel) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:ev.target.value})); }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body = { ...form, clearance:Number(form.clearance||1), anomaly_score:form.anomaly_score!=null?Number(form.anomaly_score):null, missions_completed:form.missions_completed!=null?Number(form.missions_completed):null };
      if (!isNew) body.id = editing!.id;
      const r = await fetch("/api/admin/db-personnel",{method:isNew?"POST":"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify(body)});
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`);return;}
      setMsg(`✓ ${isNew?"作成":"更新"}しました`); setIsNew(false); load();
    } finally { setSaving(false); }
  }

  async function del(id:string, name:string) {
    if(!confirm(`「${name}」を削除しますか？`))return;
    await fetch(`/api/admin/db-personnel?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg("✓ 削除しました"); load();
  }

  const filtered = q ? items.filter(p=>p.codename.includes(q)||p.real_name.includes(q)||p.division.includes(q)) : items;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1100px] mx-auto">
      <PageHeader eyebrow="ADMIN — PERSONNEL" title="人事データベース管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div>
          <button onClick={()=>{setForm(EMPTY);setEditing(null);setIsNew(true);setMsg("");}} className="w-full mb-2 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ 新規人事ファイル</button>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="検索..." style={{...iS,marginBottom:8}}/>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-1 overflow-y-auto" style={{maxHeight:560}}>
              {filtered.map(p => (
                <div key={p.id} onClick={()=>startEdit(p)} className="px-3 py-2.5 rounded-sm cursor-pointer" style={{background:editing?.id===p.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)",border:`1px solid ${editing?.id===p.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`,borderLeft:`3px solid ${STATUS_COLORS[p.status]||"var(--color-fg-muted)"}`}}>
                  <div className="text-[12px] font-bold" style={{color:"var(--color-foreground)"}}>{p.codename}</div>
                  <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{p.division} · LV{p.clearance}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {(isNew||editing) && (
          <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
            <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNew?"新規人事ファイル":"編集: "+editing?.codename}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="hud-label block mb-1">コードネーム *</label><input value={form.codename||""} onChange={sf("codename")} style={iS}/></div>
              <div><label className="hud-label block mb-1">実名（機密）</label><input value={form.real_name||""} onChange={sf("real_name")} style={iS}/></div>
              <div><label className="hud-label block mb-1">役職</label><input value={form.role||""} onChange={sf("role")} style={iS}/></div>
              <div><label className="hud-label block mb-1">所属部門</label><input value={form.division||""} onChange={sf("division")} style={iS}/></div>
              <div><label className="hud-label block mb-1">クリアランス</label><select value={form.clearance||1} onChange={sf("clearance")} style={iS}>{[1,2,3,4,5].map(n=><option key={n} value={n}>LV{n}</option>)}</select></div>
              <div><label className="hud-label block mb-1">ステータス</label><select value={form.status||"ACTIVE"} onChange={sf("status")} style={iS}>{["ACTIVE","MISSING","LOCKED","CLASSIFIED"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="hud-label block mb-1">着任日</label><input value={form.joined||""} onChange={sf("joined")} placeholder="2020-01-01" style={iS}/></div>
              <div><label className="hud-label block mb-1">最終確認</label><input value={form.last_seen||"—"} onChange={sf("last_seen")} style={iS}/></div>
              <div><label className="hud-label block mb-1">異常スコア</label><input type="number" step="0.1" value={form.anomaly_score??""} onChange={sf("anomaly_score")} style={iS}/></div>
              <div><label className="hud-label block mb-1">完了ミッション数</label><input type="number" value={form.missions_completed??""} onChange={sf("missions_completed")} style={iS}/></div>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div><label className="hud-label block mb-1">専門分野</label><input value={form.specialization||""} onChange={sf("specialization")} style={iS}/></div>
              <div><label className="hud-label block mb-1">備考・メモ</label><textarea value={form.notes||""} onChange={sf("notes")} rows={4} style={taS}/></div>
              <div><label className="hud-label block mb-1">表彰（改行区切り）</label><textarea value={(Array.isArray(form.commendations)?form.commendations:[]).join("\n")} onChange={e=>setForm(p=>({...p,commendations:e.target.value.split("\n").filter(Boolean)}))} rows={2} style={taS}/></div>
              <div><label className="hud-label block mb-1">インシデントフラグ（改行区切り）</label><textarea value={(Array.isArray(form.incident_flags)?form.incident_flags:[]).join("\n")} onChange={e=>setForm(p=>({...p,incident_flags:e.target.value.split("\n").filter(Boolean)}))} rows={2} style={taS}/></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{setIsNew(false);setEditing(null);}} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--color-fg-dim)",fontFamily:"var(--font-mono)"}}>キャンセル</button>
              {!isNew && <button onClick={()=>del(editing!.id,editing!.codename)} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",color:"var(--color-danger)",fontFamily:"var(--font-mono)"}}>削除</button>}
              <button onClick={save} disabled={saving} style={{padding:"7px 16px",borderRadius:2,cursor:"pointer",fontSize:12,background:"rgba(255,180,60,0.12)",border:"1px solid rgba(255,180,60,0.4)",color:"var(--color-warning)",fontFamily:"var(--font-mono)",opacity:saving?0.5:1}}>{saving?"保存中...":"保存"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
