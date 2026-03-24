"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingStatus } from "@/components/ui/LoadingStatus";
import { DIVISIONS, LEVEL_THRESHOLDS } from "@/lib/constants";
import { useBoundStore } from "@/store";
import { Icon, NavIcon } from "@/components/ui/Icon";

// ─── 型定義 ────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "history" | "discovered" | "stats" | "transfer";

interface Division {
  id: string; name: string; name_en: string; color: string; description: string;
}

interface GlobalStats {
  totalUsers: number; activeUsers: number;
  divisionCounts: Array<{ division_id: string; cnt: number }>;
  levelCounts: Array<{ clearance_level: number; cnt: number }>;
  missionStats: { active: number; completed: number; total: number };
}

interface Props {
  initialTab:    ProfileTab;
  agentId:       string;
  username:      string;
  displayName:   string | null;
  divisionId:    string | null;
  division:      Division | null;
  level:         number;
  xp:            number;
  xpPct:         number;
  nextThreshold: number | null;
  streak:        number;
  loginCount:    number;
  anomalyScore:  number;
  observerLoad:  number;
  secretQuestion: string | null;
  createdAt:     string;
  xpByActivity:  Record<string, number>;
  globalStats:   GlobalStats | null;
}

// ─── 定数 ──────────────────────────────────────────────────────────────

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: "overview",   label: "概要",     icon: "◈" },
  { id: "history",    label: "活動履歴", icon: "◆" },
  { id: "discovered", label: "発見記録", icon: "◎" },
  { id: "stats",      label: "統計",     icon: "⬡" },
  { id: "transfer",   label: "部門移動", icon: "◐" },
];

const ACTIVITY_LABEL: Record<string, string> = {
  first_login:       "初回ログイン",
  daily_login:       "ログインボーナス",
  send_chat_message: "チャット送信",
  complete_mission:  "ミッション完了",
  discover_keyword:  "キーワード発見",
  report_anomaly:    "異常報告",
  division_activity: "部門活動",
  view_classified:   "機密閲覧",
  division_transfer: "部門移動",
};

const CHANNEL_LABELS: Record<string, string> = {
  global: "グローバル", npc_group: "NPCグループ",
  secure: "セキュア", classified: "機密",
};

const TYPE_COLOR: Record<string, string> = {
  entity:   "var(--color-danger)",   mission: "var(--color-warning)",
  document: "var(--color-primary)",  location: "var(--color-success)",
};
const TYPE_LABEL: Record<string, string> = {
  entity: "実体", mission: "案件", document: "文書", location: "地点",
};

// ─── 共通UIパーツ ──────────────────────────────────────────────────────

function Panel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-sm p-5" style={{
      background: "var(--color-bg-surface)",
      border: `1px solid ${accent ? `${accent}22` : "rgba(0,200,255,0.08)"}`,
      borderLeft: accent ? `3px solid ${accent}55` : undefined,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="hud-label mb-1">{label}</div>
      <h2 className="m-0 text-[15px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5" style={{ borderBottom: "1px solid rgba(0,200,255,0.06)" }}>
      <div className="hud-label">{label}</div>
      <div className={`text-[13px] ${mono ? "font-mono" : ""}`} style={{ color: "var(--color-foreground)" }}>
        {value}
      </div>
    </div>
  );
}

function FormField({ label, id, type = "text", value, onChange, placeholder, hint }: {
  label: string; id: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="hud-label">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete="off"
        className="w-full rounded-sm px-3 py-2 text-[13px] font-mono transition-all duration-150"
        style={{ background: "var(--color-bg-input, rgba(0,200,255,0.04))", border: "1px solid rgba(0,200,255,0.15)", color: "var(--color-foreground)", outline: "none" }}
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.5)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.15)"; }}
      />
      {hint && <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>{hint}</div>}
    </div>
  );
}

function StatusMsg({ type, msg }: { type: "ok" | "err"; msg: string }) {
  return (
    <div className="text-[12px] px-3 py-2 rounded-sm" style={{
      color: type === "ok" ? "var(--color-success)" : "var(--color-danger)",
      background: type === "ok" ? "rgba(62,207,106,0.08)" : "rgba(255,68,68,0.08)",
      border: `1px solid ${type === "ok" ? "rgba(62,207,106,0.2)" : "rgba(255,68,68,0.2)"}`,
    }}>
      {msg}
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}>
      <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>取得に失敗しました</p>
      <button onClick={onRetry} className="text-[12px] px-4 py-1.5 rounded-sm cursor-pointer"
        style={{ border: "1px solid rgba(0,200,255,0.2)", color: "var(--color-fg-dim)", background: "transparent" }}>
        再試行
      </button>
    </div>
  );
}

// ─── フォームコンポーネント ────────────────────────────────────────────

function PasswordForm() {
  const [cur, setCur] = useState(""); const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!cur || !next || !confirm) { setStatus({ type: "err", msg: "すべての項目を入力してください" }); return; }
    if (next !== confirm) { setStatus({ type: "err", msg: "新しいパスキーが一致しません" }); return; }
    if (next.length < 8) { setStatus({ type: "err", msg: "パスキーは8文字以上で入力してください" }); return; }
    setLoading(true); setStatus(null);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "err", msg: data.error ?? "更新に失敗しました" }); return; }
      setStatus({ type: "ok", msg: "パスキーを更新しました" });
      setCur(""); setNext(""); setConfirm("");
    } catch { setStatus({ type: "err", msg: "通信エラーが発生しました" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <FormField label="現在のパスキー" id="cur-pw" type="password" value={cur} onChange={setCur} />
      <FormField label="新しいパスキー" id="new-pw" type="password" value={next} onChange={setNext} hint="8文字以上" />
      <FormField label="新しいパスキー（確認）" id="confirm-pw" type="password" value={confirm} onChange={setConfirm} />
      {status && <StatusMsg type={status.type} msg={status.msg} />}
      <Button onClick={handleSubmit} isLoading={loading} className="self-start">パスキーを更新</Button>
    </div>
  );
}

function DisplayNameForm({ initialName }: { initialName: string | null }) {
  const [name, setName] = useState(initialName ?? "");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (name.length > 32) { setStatus({ type: "err", msg: "表示名は32文字以内にしてください" }); return; }
    setLoading(true); setStatus(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ displayName: name.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "err", msg: data.error ?? "更新に失敗しました" }); return; }
      setStatus({ type: "ok", msg: "表示名を更新しました" });
    } catch { setStatus({ type: "err", msg: "通信エラーが発生しました" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <FormField label="表示名" id="display-name" value={name} onChange={setName}
        placeholder="空欄の場合はエージェントIDを使用" hint="最大32文字。空欄でエージェントIDに戻す。" />
      {status && <StatusMsg type={status.type} msg={status.msg} />}
      <Button onClick={handleSubmit} isLoading={loading} className="self-start">表示名を更新</Button>
    </div>
  );
}

const SECRET_QUESTIONS = [
  "子供の頃に住んでいた街の名前は？", "最初に飼ったペットの名前は？", "母親の旧姓は？",
  "初めて通った学校の名前は？", "好きな映画のタイトルは？",
];

function SecretQuestionForm({ initialQuestion }: { initialQuestion: string | null }) {
  const [question, setQuestion] = useState(initialQuestion ?? SECRET_QUESTIONS[0]);
  const [answer, setAnswer] = useState(""); const [curPw, setCurPw] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!answer || !curPw) { setStatus({ type: "err", msg: "すべての項目を入力してください" }); return; }
    setLoading(true); setStatus(null);
    try {
      const res = await fetch("/api/users/me/secret-question", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ question, answer, currentPassword: curPw }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "err", msg: data.error ?? "更新に失敗しました" }); return; }
      setStatus({ type: "ok", msg: "秘密の質問を更新しました" });
      setAnswer(""); setCurPw("");
    } catch { setStatus({ type: "err", msg: "通信エラーが発生しました" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="secret-q" className="hud-label">質問を選択</label>
        <select id="secret-q" value={question} onChange={e => setQuestion(e.target.value)}
          className="w-full rounded-sm px-3 py-2 text-[13px] transition-all duration-150"
          style={{ background: "var(--color-bg-input, rgba(0,200,255,0.04))", border: "1px solid rgba(0,200,255,0.15)", color: "var(--color-foreground)", outline: "none" }}>
          {SECRET_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      <FormField label="回答" id="secret-a" value={answer} onChange={setAnswer} placeholder="回答を入力" />
      <FormField label="現在のパスキー（確認用）" id="secret-pw" type="password" value={curPw} onChange={setCurPw} />
      {status && <StatusMsg type={status.type} msg={status.msg} />}
      <Button onClick={handleSubmit} isLoading={loading} className="self-start">秘密の質問を更新</Button>
    </div>
  );
}

// ─── タブパネル ────────────────────────────────────────────────────────

function OverviewTab({ agentId, username, displayName, division, level, xp, xpPct, nextThreshold, streak, loginCount, anomalyScore, observerLoad, secretQuestion, createdAt }: {
  agentId: string; username: string; displayName: string | null;
  division: Division | null; level: number; xp: number; xpPct: number;
  nextThreshold: number | null; streak: number; loginCount: number;
  anomalyScore: number; observerLoad: number; secretQuestion: string | null; createdAt: string;
}) {
  const joinDate = new Date(createdAt.replace(" ", "T") + "Z")
    .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <SectionHeader label="IDENTIFICATION" title="エージェント情報" />
        <div className="relative rounded-sm p-4 mb-4 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,200,255,0.06) 0%, transparent 100%)", border: "1px solid rgba(0,200,255,0.18)" }}>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundImage: "linear-gradient(rgba(0,200,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative">
            <div className="hud-label mb-1">AGENT ID</div>
            <div className="text-[28px] font-bold font-mono leading-none mb-1" style={{ color: "var(--color-primary)", letterSpacing: "0.06em" }}>{agentId}</div>
            {displayName && <div className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>{displayName}</div>}
          </div>
        </div>
        <div className="mb-4">
          <Field label="ユーザー名" value={username} mono />
          <Field label="表示名" value={displayName ?? <span style={{ color: "var(--color-fg-muted)" }}>未設定</span>} />
          <Field label="所属部門" value={
            division
              ? <span style={{ color: division.color }} className="font-bold">{division.name} — {division.name_en}</span>
              : <span style={{ color: "var(--color-fg-muted)" }}>未配属</span>
          } />
          <Field label="クリアランスレベル" value={<span className="font-bold" style={{ color: "var(--color-primary)" }}>LV {level}</span>} />
          <Field label="参加日" value={joinDate} />
        </div>
        <div>
          <div className="flex justify-between hud-label mb-1.5">
            <span>XP {xp.toLocaleString()}</span>
            <span>{nextThreshold ? `NEXT — ${(nextThreshold - xp).toLocaleString()} XP` : "MAX LEVEL"}</span>
          </div>
          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(0,200,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, var(--color-primary), rgba(0,200,255,0.35))", boxShadow: "0 0 8px rgba(0,200,255,0.4)", transition: "width 0.6s ease" }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "連続ログイン", value: `${streak}d`, color: "var(--color-success)" },
            { label: "異常スコア",   value: `${anomalyScore}`, color: anomalyScore > 60 ? "var(--color-danger)" : anomalyScore > 30 ? "var(--color-warning)" : "var(--color-success)" },
            { label: "観測負荷",     value: `${observerLoad}%`, color: "var(--color-primary)" },
          ].map(s => (
            <div key={s.label} className="rounded-sm p-3 text-center" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(0,200,255,0.06)" }}>
              <div className="hud-label mb-1">{s.label}</div>
              <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel accent="rgba(0,200,255,1)">
        <SectionHeader label="EDIT PROFILE" title="表示名の変更" />
        <DisplayNameForm initialName={displayName} />
      </Panel>
      <Panel accent="rgba(160,100,255,1)">
        <SectionHeader label="SECURITY" title="パスキーの変更" />
        <PasswordForm />
      </Panel>
      <Panel accent="rgba(255,180,60,1)">
        <SectionHeader label="RECOVERY" title="秘密の質問" />
        {secretQuestion && (
          <div className="mb-4 px-3 py-2.5 rounded-sm text-[12px]"
            style={{ background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.1)", color: "var(--color-fg-dim)" }}>
            現在の質問：<span style={{ color: "var(--color-foreground)" }}>{secretQuestion}</span>
          </div>
        )}
        <SecretQuestionForm initialQuestion={secretQuestion} />
      </Panel>
    </div>
  );
}

function HistoryTab() {
  const [activeTab, setActiveTab] = useState<"xp" | "chat">("xp");
  const [xpRows, setXpRows] = useState<{ id: string; activity: string; xp_gained: number; created_at: string }[]>([]);
  const [chatRows, setChatRows] = useState<{ id: string; chat_id: string; text: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (tab: "xp" | "chat") => {
    setLoading(true); setError(false);
    try {
      if (tab === "xp") {
        const res = await fetch("/api/users/me/activity?limit=100");
        if (!res.ok) throw new Error();
        setXpRows(await res.json());
      } else {
        const res = await fetch("/api/users/me/chat-history?limit=100");
        if (!res.ok) throw new Error();
        setChatRows(await res.json());
      }
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  function fmtDatetime(raw: string) {
    const d = new Date(raw.replace(" ", "T") + "Z");
    return d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }) + " " +
           d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(["xp", "chat"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="px-4 py-2 text-[12px] font-bold font-mono tracking-[0.06em] rounded-sm transition-all duration-150 cursor-pointer"
            style={{ background: activeTab === t ? "rgba(0,200,255,0.1)" : "transparent", border: `1px solid ${activeTab === t ? "rgba(0,200,255,0.35)" : "rgba(0,200,255,0.08)"}`, color: activeTab === t ? "var(--color-primary)" : "var(--color-fg-dim)" }}>
            {t === "xp" ? "XP履歴" : "チャット送信"}
          </button>
        ))}
      </div>
      {loading && <LoadingStatus />}
      {!loading && error && <ErrorPanel onRetry={() => load(activeTab)} />}
      {!loading && !error && activeTab === "xp" && (
        xpRows.length === 0
          ? <div className="p-10 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}><div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>XP履歴がありません</div></div>
          : (
            <div>
              <div className="hud-label mb-3" style={{ color: "var(--color-primary)" }}>
                合計 {xpRows.reduce((s, r) => s + r.xp_gained, 0).toLocaleString()} XP / {xpRows.length}件
              </div>
              <div className="flex flex-col gap-1.5">
                {xpRows.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-sm"
                    style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
                    <div className="flex-1 text-[13px]" style={{ color: "var(--color-foreground)" }}>
                      {ACTIVITY_LABEL[r.activity] ?? r.activity}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-bold font-mono" style={{ color: "var(--color-success)" }}>+{r.xp_gained} XP</div>
                      <div className="hud-label">{fmtDatetime(r.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}
      {!loading && !error && activeTab === "chat" && (
        chatRows.length === 0
          ? <div className="p-10 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}><div className="text-[13px]" style={{ color: "var(--color-fg-dim)" }}>チャット送信履歴がありません</div></div>
          : (
            <div>
              <div className="hud-label mb-3" style={{ color: "var(--color-primary)" }}>{chatRows.length}件</div>
              <div className="flex flex-col gap-1.5">
                {chatRows.map(r => (
                  <div key={r.id} className="px-4 py-3 rounded-sm"
                    style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm"
                        style={{ color: "var(--color-primary)", background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.15)" }}>
                        {CHANNEL_LABELS[r.chat_id] ?? r.chat_id}
                      </span>
                      <div className="hud-label">{fmtDatetime(r.created_at)}</div>
                    </div>
                    <div className="text-[12px] leading-relaxed truncate" style={{ color: "var(--color-fg-dim)" }} title={r.text}>
                      {r.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}

function DiscoveredTab() {
  const [items, setItems] = useState<{ id: string; target_type: string; target_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/users/me/bookmarks");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/users/me/bookmarks?id=${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(b => b.id !== id));
    } finally { setDeleting(null); }
  }

  const types = [...new Set(items.map(b => b.target_type))];
  const filtered = filter === "all" ? items : items.filter(b => b.target_type === filter);

  function fmtDate(raw: string) {
    return new Date(raw.replace(" ", "T") + "Z").toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  if (loading) return <LoadingStatus />;
  if (error)   return <ErrorPanel onRetry={load} />;

  return (
    <div>
      {items.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {["all", ...types].map(t => {
            const col = t === "all" ? "var(--color-primary)" : (TYPE_COLOR[t] ?? "var(--color-primary)");
            return (
              <button key={t} onClick={() => setFilter(t)}
                className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer transition-all"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
                  background: filter === t ? `${col}18` : "transparent",
                  border: `1px solid ${filter === t ? col : "rgba(0,200,255,0.15)"}`,
                  color: filter === t ? col : "var(--color-fg-dim)" }}>
                {t === "all" ? "すべて" : TYPE_LABEL[t] ?? t}
                {t !== "all" && ` (${items.filter(b => b.target_type === t).length})`}
              </button>
            );
          })}
          <div className="ml-auto hud-label self-center" style={{ color: "var(--color-fg-muted)" }}>{filtered.length} 件</div>
        </div>
      )}
      {filtered.length === 0 && (
        <div className="p-10 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
          <div className="text-[13px] mb-1" style={{ color: "var(--color-fg-dim)" }}>発見記録がありません</div>
          <div className="hud-label">実体カタログ・案件データベースで記録を追加できます</div>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map(b => {
            const col = TYPE_COLOR[b.target_type] ?? "var(--color-primary)";
            return (
              <div key={b.id} className="flex items-center gap-4 px-4 py-3 rounded-sm"
                style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.07)", borderLeft: `3px solid ${col}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm"
                      style={{ background: `${col}18`, border: `1px solid ${col}44`, color: col, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                      {TYPE_LABEL[b.target_type] ?? b.target_type}
                    </span>
                  </div>
                  <div className="text-[13px] font-mono truncate" style={{ color: "var(--color-foreground)" }}>{b.target_id}</div>
                  <div className="hud-label mt-0.5" style={{ color: "var(--color-fg-muted)" }}>記録日: {fmtDate(b.created_at)}</div>
                </div>
                <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                  className="shrink-0 text-[11px] px-3 py-1 rounded-sm cursor-pointer transition-all"
                  style={{ fontFamily: "var(--font-mono)", background: "transparent", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)", opacity: deleting === b.id ? 0.5 : 1 }}>
                  {deleting === b.id ? "…" : "削除"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatsTab({ xp, level, xpPct, nextThreshold, streak, loginCount, xpByActivity, globalStats }: {
  xp: number; level: number; xpPct: number; nextThreshold: number | null;
  streak: number; loginCount: number;
  xpByActivity: Record<string, number>; globalStats: GlobalStats | null;
}) {
  return (
    <div>
      <div className="hud-label mb-3" style={{ color: "var(--color-primary)" }}>— PERSONAL DATA —</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "XP",          value: xp.toLocaleString(), color: "var(--color-success)" },
          { label: "クリアランス", value: `LV${level}`,         color: "var(--color-primary)" },
          { label: "ストリーク",   value: `${streak}日`,         color: "var(--color-warning)" },
          { label: "ログイン数",   value: `${loginCount}回`,     color: "var(--color-fg-dim)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}>
            <div className="text-[20px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
            <div className="hud-label mt-1">{label}</div>
          </div>
        ))}
      </div>
      {nextThreshold && (
        <div className="mb-6 p-4 rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}>
          <div className="flex justify-between hud-label mb-2">
            <span style={{ color: "var(--color-primary)" }}>LV{level} → LV{level + 1}</span>
            <span style={{ color: "var(--color-fg-muted)" }}>{xp.toLocaleString()} / {nextThreshold.toLocaleString()} XP</span>
          </div>
          <div className="h-2 rounded-sm overflow-hidden" style={{ background: "rgba(0,200,255,0.08)" }}>
            <div className="h-full rounded-sm transition-all" style={{ width: `${xpPct}%`, background: "var(--color-primary)", boxShadow: "0 0 8px var(--color-primary)" }} />
          </div>
          <div className="text-right hud-label mt-1" style={{ color: "var(--color-fg-muted)" }}>{xpPct.toFixed(1)}%</div>
        </div>
      )}
      {Object.keys(xpByActivity).length > 0 && (
        <div className="mb-8">
          <div className="hud-label mb-3" style={{ color: "var(--color-fg-dim)" }}>アクティビティ別XP（直近30件）</div>
          <div className="flex flex-col gap-2">
            {Object.entries(xpByActivity).sort(([,a],[,b]) => b-a).map(([activity, xp]) => (
              <div key={activity} className="flex items-center gap-3 px-3 py-2 rounded-sm"
                style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
                <div className="flex-1 text-[12px]" style={{ color: "var(--color-fg-dim)" }}>{ACTIVITY_LABEL[activity] ?? activity}</div>
                <div className="text-[13px] font-bold" style={{ color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>+{xp} XP</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {globalStats ? (
        <>
          <div className="hud-label mb-3" style={{ color: "var(--color-primary)" }}>— AGENCY-WIDE STATISTICS —</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "総機関員数",        value: globalStats.totalUsers,                color: "var(--color-primary)" },
              { label: "直近7日アクティブ", value: globalStats.activeUsers,               color: "var(--color-success)" },
              { label: "対応中案件",        value: globalStats.missionStats.active,        color: "var(--color-danger)" },
              { label: "収束済み案件",      value: globalStats.missionStats.completed,     color: "var(--color-fg-dim)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.08)" }}>
                <div className="text-[20px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
                <div className="hud-label mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="mb-6">
            <div className="hud-label mb-3" style={{ color: "var(--color-fg-dim)" }}>部門別機関員数</div>
            <div className="flex flex-col gap-2">
              {DIVISIONS.map(div => {
                const cnt = Number(globalStats.divisionCounts.find(r => r.division_id === div.id)?.cnt ?? 0);
                const maxCnt = Math.max(...globalStats.divisionCounts.map(r => Number(r.cnt)), 1);
                return (
                  <div key={div.id} className="px-3 py-2 rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
                    <div className="flex justify-between hud-label mb-1.5">
                      <span style={{ color: div.color }}>{div.name}</span>
                      <span style={{ color: "var(--color-fg-dim)", fontFamily: "var(--font-mono)" }}>{cnt}</span>
                    </div>
                    <div className="h-1 rounded-sm overflow-hidden" style={{ background: "rgba(0,200,255,0.06)" }}>
                      <div className="h-full rounded-sm" style={{ width: `${(cnt/maxCnt)*100}%`, background: div.color, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="hud-label mb-3" style={{ color: "var(--color-fg-dim)" }}>クリアランスレベル分布</div>
            <div className="flex gap-2">
              {[0,1,2,3,4,5].map(lv => {
                const cnt   = Number(globalStats.levelCounts.find(r => Number(r.clearance_level) === lv)?.cnt ?? 0);
                const total = globalStats.totalUsers || 1;
                const col   = lv >= 5 ? "var(--color-danger)" : lv >= 3 ? "var(--color-warning)" : "var(--color-primary)";
                return (
                  <div key={lv} className="flex-1 text-center p-2 rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.06)" }}>
                    <div className="text-[16px] font-bold" style={{ color: col, fontFamily: "var(--font-mono)" }}>{cnt}</div>
                    <div className="hud-label" style={{ color: col }}>LV{lv}</div>
                    <div className="hud-label" style={{ color: "var(--color-fg-muted)" }}>{((cnt/total)*100).toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="p-5 rounded-sm mt-4" style={{ background: "rgba(255,215,64,0.04)", border: "1px solid rgba(255,215,64,0.15)" }}>
          <div className="text-[12px]" style={{ color: "var(--color-warning)" }}>
            ⚠ 機関全体統計はクリアランス LV2 以上で閲覧可能になります。
          </div>
        </div>
      )}
    </div>
  );
}

function TransferTab({ level, divisionId }: { level: number; divisionId: string | null }) {
  const router   = useRouter();
  const user     = useBoundStore(s => s.user);
  const setUser  = useBoundStore(s => s.setUser);
  const addToast = useBoundStore(s => s.addToast);

  const [targetId, setTargetId] = useState("");
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);
  const [newDivName, setNewDivName] = useState("");

  const currentDiv = DIVISIONS.find(d => d.id === divisionId);
  const MIN_LEVEL  = 2;

  if (level < MIN_LEVEL) return (
    <div className="p-8 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}>
      <div className="text-[14px] font-bold mb-2" style={{ color: "var(--color-danger)" }}>ACCESS DENIED</div>
      <div className="text-[12px]" style={{ color: "var(--color-fg-dim)" }}>部門移動にはクリアランス LV{MIN_LEVEL} 以上が必要です。</div>
    </div>
  );

  if (done) return (
    <div className="p-8 text-center rounded-sm" style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,230,118,0.2)" }}>
      <div className="text-[14px] font-bold mb-2" style={{ color: "var(--color-success)" }}>移動完了</div>
      <div className="text-[13px] mb-6" style={{ color: "var(--color-fg-dim)" }}>{newDivName} への移動が完了しました。</div>
      <button onClick={() => setDone(false)} className="text-[12px] px-5 py-2 rounded-sm cursor-pointer"
        style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.3)", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
        再度申請する
      </button>
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/users/me/division-transfer", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ divisionId: targetId, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "申請に失敗しました"); return; }
      if (user) setUser({ ...user, divisionId: targetId });
      const div = DIVISIONS.find(d => d.id === targetId);
      setNewDivName(div?.name ?? targetId);
      addToast({ type: "system", title: "部門移動完了", body: `${div?.name} へ移動しました` });
      setDone(true);
    } catch { setError("通信エラーが発生しました"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-[560px]">
      <div className="hud-label mb-1">DIVISION TRANSFER</div>
      <h2 className="m-0 text-[15px] font-bold mb-6" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>部門移動申請</h2>
      {currentDiv && (
        <div className="p-4 rounded-sm mb-5" style={{ background: "var(--color-bg-surface)", border: `1px solid ${currentDiv.color}33`, borderLeft: `3px solid ${currentDiv.color}` }}>
          <div className="hud-label mb-1" style={{ color: "var(--color-fg-muted)" }}>現在の所属</div>
          <div className="text-[14px] font-bold" style={{ color: currentDiv.color }}>{currentDiv.name}</div>
          <div className="hud-label mt-0.5" style={{ color: currentDiv.color, opacity: 0.7 }}>{currentDiv.name_en}</div>
        </div>
      )}
      <div className="p-3 mb-5 rounded-sm" style={{ background: "rgba(255,215,64,0.05)", border: "1px solid rgba(255,215,64,0.2)" }}>
        <div className="text-[11px] leading-relaxed" style={{ color: "var(--color-warning)" }}>
          ⚠ 部門移動は30日に1回のみ可能です。
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <div className="hud-label mb-3">移動先部門</div>
          <div className="flex flex-col gap-2">
            {DIVISIONS.filter(d => d.id !== divisionId).map(div => (
              <label key={div.id} className="flex items-center gap-4 p-4 rounded-sm cursor-pointer transition-all"
                style={{ background: targetId === div.id ? `${div.color}0f` : "var(--color-bg-surface)", border: `1px solid ${targetId === div.id ? div.color+"55" : "rgba(0,200,255,0.08)"}`, borderLeft: `3px solid ${div.color}` }}>
                <input type="radio" name="division" value={div.id} checked={targetId === div.id} onChange={() => setTargetId(div.id)} className="sr-only" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold mb-0.5" style={{ color: "var(--color-foreground)" }}>{div.name}</div>
                  <div className="text-[11px]" style={{ color: "var(--color-fg-dim)" }}>{div.description}</div>
                </div>
                <div className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center"
                  style={{ borderColor: targetId === div.id ? div.color : "rgba(0,200,255,0.2)", background: targetId === div.id ? div.color : "transparent" }}>
                  {targetId === div.id && <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-bg)" }} />}
                </div>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="hud-label mb-2">移動理由 <span style={{ color: "var(--color-fg-muted)" }}>（任意）</span></div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={200}
            placeholder="移動を希望する理由を入力してください..."
            className="w-full rounded-sm resize-none text-[12px] leading-relaxed p-3"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(0,200,255,0.15)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)", outline: "none" }} />
          <div className="text-right hud-label mt-1" style={{ color: "var(--color-fg-muted)" }}>{reason.length}/200</div>
        </div>
        {error && (
          <div className="text-[12px] px-3 py-2 rounded-sm" style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.25)", color: "var(--color-danger)" }}>{error}</div>
        )}
        <button type="submit" disabled={!targetId || loading}
          className="py-3 rounded-sm text-[13px] font-bold cursor-pointer transition-all"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em",
            background: targetId && !loading ? "rgba(0,200,255,0.1)" : "rgba(0,200,255,0.04)",
            border: `1px solid ${targetId && !loading ? "rgba(0,200,255,0.4)" : "rgba(0,200,255,0.1)"}`,
            color: targetId && !loading ? "var(--color-primary)" : "var(--color-fg-muted)",
            cursor: targetId && !loading ? "pointer" : "not-allowed" }}>
          {loading ? "申請中…" : "移動申請を送信"}
        </button>
      </form>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────

export function ProfileClient({
  initialTab, agentId, username, displayName, divisionId, division,
  level, xp, xpPct, nextThreshold, streak, loginCount, anomalyScore, observerLoad,
  secretQuestion, createdAt, xpByActivity, globalStats,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[800px] mx-auto">
      <div className="mb-6">
        <div className="hud-label mb-1">AGENT RECORD</div>
        <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
          エージェントプロフィール
        </h1>
      </div>

      {/* タブバー */}
      <div className="flex mb-6 rounded-sm overflow-x-auto" style={{ border: "1px solid rgba(0,200,255,0.1)" }}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const isLocked = tab.id === "transfer" && level < 2;
          return (
            <button key={tab.id} onClick={() => !isLocked && setActiveTab(tab.id)}
              disabled={isLocked}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 transition-all duration-150 whitespace-nowrap"
              style={{
                fontSize: "11px", letterSpacing: "0.05em",
                background:   isActive ? "rgba(0,200,255,0.07)" : "var(--color-bg)",
                color:        isActive ? "var(--color-primary)" : isLocked ? "var(--color-fg-decorative)" : "var(--color-fg-dim)",
                borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                borderRight:  i < TABS.length - 1 ? "1px solid rgba(0,200,255,0.08)" : "none",
                cursor:       isLocked ? "not-allowed" : "pointer",
              }}>
              <span aria-hidden="true">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* パネル */}
      <div key={activeTab} className="animate-[fadeIn_0.2s_ease_both]">
        {activeTab === "overview"   && <OverviewTab agentId={agentId} username={username} displayName={displayName} division={division} level={level} xp={xp} xpPct={xpPct} nextThreshold={nextThreshold} streak={streak} loginCount={loginCount} anomalyScore={anomalyScore} observerLoad={observerLoad} secretQuestion={secretQuestion} createdAt={createdAt} />}
        {activeTab === "history"    && <HistoryTab />}
        {activeTab === "discovered" && <DiscoveredTab />}
        {activeTab === "stats"      && <StatsTab xp={xp} level={level} xpPct={xpPct} nextThreshold={nextThreshold} streak={streak} loginCount={loginCount} xpByActivity={xpByActivity} globalStats={globalStats} />}
        {activeTab === "transfer"   && <TransferTab level={level} divisionId={divisionId} />}
      </div>
    </div>
  );
}
