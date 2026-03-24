"use client";

import {
  StatusBadge, ThreatBadge, TagList, CardSection, CardField, CardBody,
  Breadcrumb, Button,
} from "@/components/ui";
import { useRouter } from "next/navigation";
import {
  type TabId, type Mission, type Facility, type Entity,
  type Equipment, type Personnel,
} from "../../data";

type AnyRecord = Mission | Facility | Entity | Equipment | Personnel;

// ─────────────────────────────────────────────────────────────────────
// 各タイプ詳細
// ─────────────────────────────────────────────────────────────────────

function MissionDetail({ r }: { r: Mission }) {
  return (
    <>
      <CardSection title="基本情報">
        <CardField label="ミッションID" value={r.id} />
        <CardField label="フェーズ"     value={`PHASE ${r.phase}`} />
        <CardField label="カテゴリ"     value={r.category} />
        <CardField label="ステータス"   value={<StatusBadge status={r.status} />} />
        <CardField label="担当部門"     value={r.assigned_division} />
        <CardField label="発令者"       value={r.issued_by} />
        <CardField label="発令日"       value={r.issued_at} />
        <CardField label="報酬XP"       value={
          <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>+{r.xp} XP</span>
        } />
        <CardField label="要求レベル"   value={`クリアランス LV${r.level}`} />
      </CardSection>

      <CardSection title="概要">
        <CardBody>{r.description}</CardBody>
      </CardSection>

      <CardSection title="目標">
        <ol className="m-0 p-0 flex flex-col gap-2">
          {(r.objectives ?? []).map((obj, i) => (
            <li key={i} className="flex gap-3 text-[12px]" style={{ listStyle: "none" }}>
              <span style={{ color: "var(--color-primary)", flexShrink: 0 }}>
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span style={{ color: "var(--color-fg-dim)" }}>{obj}</span>
            </li>
          ))}
        </ol>
      </CardSection>
    </>
  );
}

function FacilityDetail({ r }: { r: Facility }) {
  return (
    <>
      <CardSection title="基本情報">
        <CardField label="施設ID"     value={r.id} />
        <CardField label="コード"     value={r.code} />
        <CardField label="種別"       value={r.type} />
        <CardField label="ステータス" value={<StatusBadge status={r.status} />} />
        <CardField label="座標"       value={r.location} />
        <CardField label="常駐人員"   value={r.staff != null ? `${r.staff}名` : "機密"} />
        <CardField label="設立"       value={r.established} />
        <CardField label="要求レベル" value={`クリアランス LV${r.clearance}`} />
      </CardSection>
      <CardSection title="概要"><CardBody>{r.description}</CardBody></CardSection>
      <CardSection title="設置装備"><TagList items={r.equipment_installed} /></CardSection>
      <CardSection title="在籍部門"><TagList items={r.divisions_present} /></CardSection>
      <CardSection title="備考"><CardBody>{r.notes}</CardBody></CardSection>
    </>
  );
}

function EntityDetail({ r }: { r: Entity }) {
  return (
    <>
      <CardSection title="基本情報">
        <CardField label="エンティティID" value={r.id} />
        <CardField label="識別コード"     value={r.code} />
        <CardField label="分類"           value={r.classification} />
        <CardField label="ステータス"     value={<StatusBadge status={r.status} />} />
        <CardField label="脅威レベル"     value={<ThreatBadge level={r.threat} />} />
        <CardField label="初観測"         value={r.first_detected} />
        <CardField label="無力化件数"     value={r.neutralized != null ? `${r.neutralized}件` : "機密"} />
        <CardField label="要求レベル"     value={`クリアランス LV${r.clearance}`} />
      </CardSection>
      <CardSection title="概要"><CardBody>{r.description}</CardBody></CardSection>
      <CardSection title="観測された能力"><TagList items={r.observed_abilities} /></CardSection>
      <CardSection title="封じ込めプロトコル"><CardBody>{r.containment_protocol}</CardBody></CardSection>
      {r.related_entities.length > 0 && (
        <CardSection title="関連エンティティ"><TagList items={r.related_entities} /></CardSection>
      )}
    </>
  );
}

function EquipmentDetail({ r }: { r: Equipment }) {
  return (
    <>
      <CardSection title="基本情報">
        <CardField label="装備ID"     value={r.id} />
        <CardField label="コード"     value={r.code} />
        <CardField label="カテゴリ"   value={r.category} />
        <CardField label="ステータス" value={<StatusBadge status={r.status} />} />
        <CardField label="在庫数"     value={r.quantity != null ? `${r.quantity}点` : "機密"} />
        <CardField label="重量"       value={r.weight} />
        <CardField label="管轄"       value={r.issued_by} />
        <CardField label="保守周期"   value={r.maintenance_cycle} />
        <CardField label="要求レベル" value={`クリアランス LV${r.clearance}`} />
      </CardSection>
      <CardSection title="概要"><CardBody>{r.description}</CardBody></CardSection>
      <CardSection title="スペック">
        <div className="flex flex-col gap-2">
          {Object.entries(r.specifications).map(([k, v]) => (
            <CardField key={k} label={k} value={v} />
          ))}
        </div>
      </CardSection>
    </>
  );
}

function PersonnelDetail({ r }: { r: Personnel }) {
  return (
    <>
      <CardSection title="基本情報">
        <CardField label="識別番号"   value={r.id} />
        <CardField label="コードネーム" value={r.codename} />
        <CardField label="役職"       value={r.role} />
        <CardField label="所属部門"   value={r.division} />
        <CardField label="ステータス" value={<StatusBadge status={r.status} />} />
        <CardField label="入局日"     value={r.joined} />
        <CardField label="最終確認"   value={r.last_seen} />
        <CardField label="要求レベル" value={`クリアランス LV${r.clearance}`} />
        <CardField label="異常スコア" value={
          r.anomaly_score != null ? (
            <span style={{
              color:      r.anomaly_score > 1.5 ? "var(--color-warning)" : "var(--color-success)",
              fontWeight: "bold",
            }}>
              {r.anomaly_score.toFixed(1)}σ
            </span>
          ) : <span style={{ color: "var(--color-fg-muted)" }}>機密</span>
        } />
        <CardField label="任務完了数" value={
          r.missions_completed != null ? `${r.missions_completed}件` : "機密"
        } />
      </CardSection>
      <CardSection title="専門分野">
        <TagList items={r.specialization.split(" / ")} />
      </CardSection>
      <CardSection title="備考"><CardBody>{r.notes}</CardBody></CardSection>
      {r.commendations.length > 0 && (
        <CardSection title="表彰記録"><TagList items={r.commendations} /></CardSection>
      )}
      {r.incident_flags.length > 0 && (
        <CardSection title="インシデントフラグ">
          <div className="flex flex-col gap-1.5">
            {r.incident_flags.map((flag, i) => (
              <div key={i} className="flex gap-2 text-[12px]">
                <span style={{ color: "var(--color-warning)", flexShrink: 0 }}>▲</span>
                <span style={{ color: "var(--color-fg-dim)" }}>{flag}</span>
              </div>
            ))}
          </div>
        </CardSection>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// メタ
// ─────────────────────────────────────────────────────────────────────

const TAB_META: Record<TabId, { icon: string; label: string }> = {
  missions:   { icon: "◆", label: "ミッション" },
  facilities: { icon: "⬡", label: "施設" },
  entities:   { icon: "◎", label: "エンティティ" },
  equipment:  { icon: "◈", label: "装備" },
  personnel:  { icon: "◐", label: "人事ファイル" },
  modules:    { icon: "⬡", label: "モジュール" },
  search:     { icon: "◫", label: "検索" },
};

function getRecordTitle(tab: TabId, r: AnyRecord): string {
  switch (tab) {
    case "missions":   return (r as Mission).title;
    case "facilities": return (r as Facility).name;
    case "entities":   return (r as Entity).designation;
    case "equipment":  return (r as Equipment).name;
    case "personnel":  return `CODENAME: ${(r as Personnel).codename}`;
    case "modules":    return (r as { name?: string; id: string }).name ?? r.id;
    case "search":     return r.id;
  }
}

// ─────────────────────────────────────────────────────────────────────
// DetailClient
// ─────────────────────────────────────────────────────────────────────

export function DetailClient({ tab, record }: { tab: TabId; record: AnyRecord }) {
  const router = useRouter();
  const { icon, label } = TAB_META[tab];
  const title  = getRecordTitle(tab, record);
  const status = (record as { status: string }).status;

  const renderDetail = () => {
    switch (tab) {
      case "missions":   return <MissionDetail   r={record as Mission} />;
      case "facilities": return <FacilityDetail  r={record as Facility} />;
      case "entities":   return <EntityDetail    r={record as Entity} />;
      case "equipment":  return <EquipmentDetail r={record as Equipment} />;
      case "personnel":  return <PersonnelDetail r={record as Personnel} />;
      default:           return null;
    }
  };

  return (
    <div className="animate-[fadeIn_0.35s_ease_both] px-5 py-7 sm:px-8 max-w-[900px] mx-auto">
      {/* パンくず */}
      <Breadcrumb items={[
        { label: "機関データベース", href: "/database" },
        { label: `${icon} ${label}`,  href: "/database" },
        { label: title },
      ]} />

      {/* ヘッダー */}
      <div
        className="mb-6 pb-5"
        style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="hud-label">{icon} {label.toUpperCase()}</span>
          <StatusBadge status={status} />
        </div>
        <h1
          className="m-0 text-[20px] font-bold leading-tight"
          style={{ color: "var(--color-foreground)", letterSpacing: "0.02em" }}
        >
          {title}
        </h1>
      </div>

      {/* コンテンツ */}
      <div className="flex flex-col gap-3">
        {renderDetail()}
      </div>

      {/* 戻る */}
      <div className="mt-7">
        <Button variant="secondary" onClick={() => router.push("/database")}>
          ← データベースに戻る
        </Button>
      </div>
    </div>
  );
}
