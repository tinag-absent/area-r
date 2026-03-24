"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

const iS: React.CSSProperties = { background:"var(--color-bg)", border:"1px solid rgba(255,180,60,0.2)", color:"var(--color-foreground)", fontFamily:"var(--font-mono)", fontSize:12, padding:"6px 8px", borderRadius:2, width:"100%", outline:"none" };
const taS: React.CSSProperties = { ...iS, resize:"vertical" as const, minHeight:180 };

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background:ok?"rgba(0,230,118,0.06)":"rgba(255,68,68,0.06)", border:`1px solid ${ok?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.25)"}`, color:ok?"var(--color-success)":"var(--color-danger)", fontFamily:"var(--font-mono)" }}>{text}</div>;
}

interface CodexEntry { id:string; section_id:string; title:string; subtitle?:string; body:string; clearance:number; tags:string[]; sort_order:number; }
interface CodexSection { id:string; label:string; title:string; icon:string; color:string; clearance:number; sort_order:number; entries:CodexEntry[]; }

export default function AdminCodexPage() {
  const [sections, setSections] = useState<CodexSection[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [selectedSec, setSelectedSec] = useState<string>("");
  const [editingEntry, setEditingEntry] = useState<CodexEntry|null>(null);
  const [entryForm, setEntryForm] = useState<Partial<CodexEntry>>({});
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/codex",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) { const d: CodexSection[] = await r.json(); setSections(d); if(!selectedSec && d.length>0) setSelectedSec(d[0]!.id); } } finally { setLoading(false); }
  }, [selectedSec]);
  useEffect(() => { load(); }, []);  // eslint-disable-line

  const currentSec = sections.find(s=>s.id===selectedSec);

  function startNewEntry() {
    setIsNewEntry(true); setEditingEntry(null); setMsg("");
    setEntryForm({ title:"", subtitle:"", body:"", clearance:0, tags:[], sort_order:(currentSec?.entries?.length||0)+1 });
  }
  function startEditEntry(e: CodexEntry) { setEditingEntry(e); setIsNewEntry(false); setMsg(""); setEntryForm({...e}); }
  function ef(k: keyof CodexEntry) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setEntryForm(p=>({...p,[k]:ev.target.value})); }

  async function saveEntry() {
    setSaving(true); setMsg("");
    try {
      const body = { ...entryForm, clearance:Number(entryForm.clearance??0), sort_order:Number(entryForm.sort_order??0),
        tags: typeof entryForm.tags==="string"?(entryForm.tags as unknown as string).split(",").map((t:string)=>t.trim()).filter(Boolean):entryForm.tags||[],
        section_id: selectedSec };
      if (!isNewEntry) body.id = editingEntry!.id;
      const r = await fetch("/api/admin/codex",{method:isNewEntry?"POST":"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify(body)});
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`);return;}
      setMsg(`✓ ${isNewEntry?"作成":"更新"}しました`); setIsNewEntry(false); load();
    } finally { setSaving(false); }
  }

  async function delEntry(id:string, title:string) {
    if(!confirm(`「${title}」を削除しますか？`))return;
    const r = await fetch(`/api/admin/codex?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg(r.ok?"✓ 削除しました":"削除エラー"); setEditingEntry(null); load();
  }

  const isEditingEntry = isNewEntry || !!editingEntry;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1200px] mx-auto">
      <PageHeader eyebrow="ADMIN — CODEX" title="コーデックス管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}

      {/* セクション選択タブ */}
      <div className="flex flex-wrap gap-1 mb-5">
        {loading ? <LoadingStatus /> : sections.map(s => (
          <button key={s.id} onClick={()=>{setSelectedSec(s.id);setEditingEntry(null);setIsNewEntry(false);}}
            style={{fontSize:11,padding:"5px 10px",borderRadius:2,cursor:"pointer",fontFamily:"var(--font-mono)",background:selectedSec===s.id?`${s.color}18`:"transparent",border:`1px solid ${selectedSec===s.id?s.color:"rgba(255,180,60,0.15)"}`,color:selectedSec===s.id?s.color:"var(--color-fg-dim)"}}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {currentSec && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* エントリリスト */}
          <div>
            <div className="mb-3 p-3 rounded-sm" style={{background:"var(--color-bg-surface)",border:`1px solid ${currentSec.color}33`}}>
              <div style={{fontSize:13,fontWeight:"bold",color:currentSec.color}}>{currentSec.icon} {currentSec.title}</div>
              <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{currentSec.entries?.length||0} エントリ · LV{currentSec.clearance}</div>
            </div>
            <button onClick={startNewEntry} className="w-full mb-2 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ エントリ追加</button>
            <div className="flex flex-col gap-1 overflow-y-auto" style={{maxHeight:500}}>
              {(currentSec.entries||[]).map(e => (
                <div key={e.id} onClick={()=>startEditEntry(e)} className="px-3 py-2.5 rounded-sm cursor-pointer" style={{background:editingEntry?.id===e.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)",border:`1px solid ${editingEntry?.id===e.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`}}>
                  <div className="text-[12px] font-bold truncate" style={{color:"var(--color-foreground)"}}>{e.title}</div>
                  <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>LV{e.clearance} · {(e.tags||[]).slice(0,2).join(", ")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* エントリ編集フォーム */}
          {isEditingEntry && (
            <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
              <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNewEntry?"新規エントリ":"編集: "+editingEntry?.title}</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2"><label className="hud-label block mb-1">タイトル *</label><input value={entryForm.title||""} onChange={ef("title")} style={iS}/></div>
                <div className="col-span-2"><label className="hud-label block mb-1">サブタイトル</label><input value={entryForm.subtitle||""} onChange={ef("subtitle")} style={iS}/></div>
                <div><label className="hud-label block mb-1">クリアランス</label><select value={entryForm.clearance??0} onChange={ef("clearance")} style={iS}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>LV{n}</option>)}</select></div>
                <div><label className="hud-label block mb-1">表示順</label><input type="number" value={entryForm.sort_order??0} onChange={ef("sort_order")} style={iS}/></div>
                <div className="col-span-2"><label className="hud-label block mb-1">タグ（カンマ区切り）</label><input value={(Array.isArray(entryForm.tags)?entryForm.tags:entryForm.tags||[]).join(", ")} onChange={e=>setEntryForm(p=>({...p,tags:e.target.value.split(",").map(t=>t.trim())}))} style={iS}/></div>
              </div>
              <div className="mb-4">
                <label className="hud-label block mb-1">本文</label>
                <textarea value={entryForm.body||""} onChange={ef("body")} rows={14} style={taS}/>
                <div className="hud-label mt-1" style={{textAlign:"right",color:"var(--color-fg-muted)"}}>{(entryForm.body||"").length.toLocaleString()} 文字</div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>{setIsNewEntry(false);setEditingEntry(null);}} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--color-fg-dim)",fontFamily:"var(--font-mono)"}}>キャンセル</button>
                {!isNewEntry && <button onClick={()=>delEntry(editingEntry!.id,editingEntry!.title)} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",color:"var(--color-danger)",fontFamily:"var(--font-mono)"}}>削除</button>}
                <button onClick={saveEntry} disabled={saving} style={{padding:"7px 16px",borderRadius:2,cursor:"pointer",fontSize:12,background:"rgba(255,180,60,0.12)",border:"1px solid rgba(255,180,60,0.4)",color:"var(--color-warning)",fontFamily:"var(--font-mono)",opacity:saving?0.5:1}}>{saving?"保存中...":"保存"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
