/*
 * admin/novel/page.tsx — 機関員日記管理ページ
 * Updated: 2026-03-19 04:25 JST — 本文textareaにIseminを適用（執筆時の可読性向上）
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { Icon, NavIcon } from "@/components/ui/Icon";

const iS: React.CSSProperties = { background:"var(--color-bg)", border:"1px solid rgba(255,180,60,0.2)", color:"var(--color-foreground)", fontFamily:"var(--font-mono)", fontSize:12, padding:"6px 8px", borderRadius:2, width:"100%", outline:"none" };
const taS: React.CSSProperties = { ...iS, fontFamily:"var(--font-ja)", fontSize:13, resize:"vertical" as const, minHeight:240, lineHeight:1.9, letterSpacing:"0.03em" };
const CATEGORIES = ["日記","報告書","書簡","手記","機密記録"];

function Msg({ text }: { text: string }) {
  const ok = text.startsWith("✓");
  return <div className="p-3 mb-4 rounded-sm text-[12px]" style={{ background:ok?"rgba(0,230,118,0.06)":"rgba(255,68,68,0.06)", border:`1px solid ${ok?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.25)"}`, color:ok?"var(--color-success)":"var(--color-danger)", fontFamily:"var(--font-mono)" }}>{text}</div>;
}

interface Doc { id:string; title:string; subtitle?:string; clearance:number; category:string; date:string; author:string; is_published:number; sort_order:number; updated_at:string; }

export default function AdminNovelPage() {
  const [items,    setItems]    = useState<Doc[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");
  const [editing,  setEditing]  = useState<Doc|null>(null);
  const [content,  setContent]  = useState("");
  const [form,     setForm]     = useState<Partial<Doc>>({});
  const [isNew,    setIsNew]    = useState(false);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/novel",{headers:{"X-Requested-With":"XMLHttpRequest"}}); if(r.ok) setItems(await r.json()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function startEdit(doc: Doc) {
    setEditing(doc); setIsNew(false); setMsg("");
    setForm({ title:doc.title, subtitle:doc.subtitle||"", clearance:doc.clearance, category:doc.category, date:doc.date, author:doc.author, is_published:doc.is_published, sort_order:doc.sort_order });
    // コンテンツ個別取得
    try {
      const r = await fetch(`/api/admin/novel?content=1`,{headers:{"X-Requested-With":"XMLHttpRequest"}});
      if(r.ok) { const all: (Doc&{content:string})[] = await r.json(); setContent(all.find(d=>d.id===doc.id)?.content||""); }
    } catch { setContent(""); }
  }

  function startNew() {
    setIsNew(true); setEditing(null); setContent(""); setMsg("");
    setForm({ title:"", subtitle:"", clearance:0, category:"日記", date:"", author:"", is_published:1, sort_order:items.length+1 });
  }

  function sf(k: keyof Doc) { return (ev: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:ev.target.value})); }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const body = { ...form, clearance:Number(form.clearance??0), sort_order:Number(form.sort_order??0), content, is_published:form.is_published?1:0 };
      if (!isNew) body.id = editing!.id;
      const r = await fetch("/api/admin/novel",{method:isNew?"POST":"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify(body)});
      const d = await r.json();
      if(!r.ok){setMsg(`エラー: ${d.error}`);return;}
      setMsg(`✓ ${isNew?"作成":"更新"}しました`); setIsNew(false); load();
    } finally { setSaving(false); }
  }

  async function del(id:string, title:string) {
    if(!confirm(`「${title}」を削除しますか？`))return;
    await fetch(`/api/admin/novel?id=${id}`,{method:"DELETE",headers:{"X-Requested-With":"XMLHttpRequest"}});
    setMsg("✓ 削除しました"); setEditing(null); load();
  }

  async function togglePublish(doc: Doc) {
    await fetch("/api/admin/novel",{method:"PATCH",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:JSON.stringify({id:doc.id,is_published:doc.is_published?0:1})});
    load();
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[1200px] mx-auto">
      <PageHeader eyebrow="ADMIN — NOVEL" title="記録文書管理" eyebrowColor="warning" />
      {msg && <Msg text={msg} />}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* サイドリスト */}
        <div>
          <button onClick={startNew} className="w-full mb-3 py-2 text-[11px] rounded-sm cursor-pointer" style={{background:"rgba(255,180,60,0.1)",border:"1px solid rgba(255,180,60,0.35)",color:"var(--color-warning)",fontFamily:"var(--font-mono)"}}>＋ 新規文書</button>
          {loading ? <LoadingStatus /> : (
            <div className="flex flex-col gap-1 overflow-y-auto" style={{maxHeight:640}}>
              {items.map(doc => (
                <div key={doc.id} className="rounded-sm" style={{border:`1px solid ${editing?.id===doc.id?"rgba(255,180,60,0.3)":"rgba(255,180,60,0.08)"}`,background:editing?.id===doc.id?"rgba(255,180,60,0.06)":"var(--color-bg-surface)"}}>
                  <div onClick={()=>startEdit(doc)} className="px-3 py-2.5 cursor-pointer">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="text-[12px] font-bold truncate" style={{color:"var(--color-foreground)"}}>{doc.title}</div>
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:2,background:doc.is_published?"rgba(0,230,118,0.1)":"rgba(255,68,68,0.08)",border:`1px solid ${doc.is_published?"rgba(0,230,118,0.25)":"rgba(255,68,68,0.2)"}`,color:doc.is_published?"var(--color-success)":"var(--color-danger)",fontFamily:"var(--font-mono)",flexShrink:0}}>{doc.is_published?"公開":"非公開"}</span>
                    </div>
                    <div className="hud-label" style={{color:"var(--color-fg-muted)"}}>{doc.category} · LV{doc.clearance}</div>
                  </div>
                  <div className="px-3 pb-2 flex gap-1">
                    <button onClick={()=>togglePublish(doc)} style={{fontSize:10,padding:"2px 6px",borderRadius:2,cursor:"pointer",background:"transparent",border:"1px solid rgba(255,180,60,0.2)",color:"var(--color-fg-muted)",fontFamily:"var(--font-mono)"}}>{doc.is_published?"非公開にする":"公開する"}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 編集フォーム */}
        {(isNew||editing) && (
          <div className="rounded-sm p-5" style={{background:"var(--color-bg-surface)",border:"1px solid rgba(255,180,60,0.15)"}}>
            <div className="hud-label mb-4" style={{color:"var(--color-warning)"}}><Icon name="dashboard" size={12} style={{ marginRight: 4 }} aria-hidden />{isNew?"新規記録文書":"編集: "+editing?.title}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2"><label className="hud-label block mb-1">タイトル *</label><input value={form.title||""} onChange={sf("title")} style={iS}/></div>
              <div className="col-span-2"><label className="hud-label block mb-1">サブタイトル</label><input value={form.subtitle||""} onChange={sf("subtitle")} style={iS}/></div>
              <div><label className="hud-label block mb-1">カテゴリ</label><select value={form.category||"日記"} onChange={sf("category")} style={iS}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="hud-label block mb-1">クリアランス</label><select value={form.clearance??0} onChange={sf("clearance")} style={iS}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>LV{n}</option>)}</select></div>
              <div><label className="hud-label block mb-1">著者</label><input value={form.author||""} onChange={sf("author")} style={iS}/></div>
              <div><label className="hud-label block mb-1">日付</label><input value={form.date||""} onChange={sf("date")} placeholder="2026-01-01" style={iS}/></div>
              <div><label className="hud-label block mb-1">表示順</label><input type="number" value={form.sort_order??0} onChange={sf("sort_order")} style={iS}/></div>
              <div><label className="hud-label block mb-1">公開状態</label><select value={form.is_published?1:0} onChange={e=>setForm(p=>({...p,is_published:Number(e.target.value)}))} style={iS}><option value={1}>公開</option><option value={0}>非公開</option></select></div>
            </div>
            <div className="mb-4">
              <label className="hud-label block mb-1">本文
                <span className="ml-2" style={{color:"var(--color-fg-muted)",fontSize:10}}>[[M-001]] [[FAC-001]] [[ENT-001]] [[EQ-001]] [[AGT-K17]] [[DIV-01]] [[INC-001]] [[MOD-001]] [[CDX-001]] [[AUD-001]] [[REDACTED]] [[REDACTED:理由]] などのタグ記法が使えます</span>
              </label>
              <textarea value={content} onChange={e=>setContent(e.target.value)} rows={16} style={taS}/>
              <div className="hud-label mt-1" style={{textAlign:"right",color:"var(--color-fg-muted)"}}>{content.length.toLocaleString()} 文字</div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{setIsNew(false);setEditing(null);}} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--color-fg-dim)",fontFamily:"var(--font-mono)"}}>キャンセル</button>
              {!isNew && <button onClick={()=>del(editing!.id,editing!.title)} style={{padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",color:"var(--color-danger)",fontFamily:"var(--font-mono)"}}>削除</button>}
              <button onClick={save} disabled={saving} style={{padding:"7px 16px",borderRadius:2,cursor:"pointer",fontSize:12,background:"rgba(255,180,60,0.12)",border:"1px solid rgba(255,180,60,0.4)",color:"var(--color-warning)",fontFamily:"var(--font-mono)",opacity:saving?0.5:1}}>{saving?"保存中...":"保存"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
