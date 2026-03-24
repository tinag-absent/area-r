"use client";
import { useAdminRuleEngine } from "@/hooks/useAdminRuleEngine";
import { Button }             from "@/components/ui/Button";
import { PageHeader }         from "@/components/ui/PageHeader";
import { ErrorMessage }       from "@/components/ui/ErrorMessage";
import { LoadingStatus }      from "@/components/ui/LoadingStatus";
import type { RuleEngineType } from "@/lib/types";
import { Icon, NavIcon } from "@/components/ui/Icon";

const RULE_TYPES: RuleEngineType[] = [
  "xp_rule", "anomaly_rule", "arg_keyword", "known_flag", "schedule",
];

function formatRuleData(rawJson: string): string {
  try { return JSON.stringify(JSON.parse(rawJson), null, 2); }
  catch { return rawJson; }
}

export default function RuleEnginePage() {
  const {
    rules, loading,
    newJson, setNewJson, newType, setNewType,
    jsonError, submitError,
    addRule, toggleRule,
  } = useAdminRuleEngine();

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] p-4 sm:p-8">
      <PageHeader eyebrow="ADMIN — RULE ENGINE" title="ルールエンジン" eyebrowColor="warning" />

      {/* Add rule */}
      <div
        className="rounded-sm p-4 mb-5"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid rgba(255,180,60,0.15)",
        }}
      >
        <div className="hud-label mb-3" style={{ color: "var(--color-warning)" }}>
          — 新規ルール追加 —
        </div>
        <div className="flex gap-2 mb-2.5">
          <select
            className="input-base max-w-[200px]"
            value={newType}
            onChange={e => setNewType(e.target.value as RuleEngineType)}
          >
            {RULE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <textarea
          className="input-base w-full resize-y mb-1"
          style={{ minHeight: "100px", fontFamily: "var(--font-mono)", fontSize: "12px" }}
          value={newJson}
          onChange={e => setNewJson(e.target.value)}
          rows={5}
        />
        {jsonError && <p className="text-[12px] mb-2" style={{ color: "var(--color-danger)" }}>{jsonError}</p>}
        {submitError && <ErrorMessage message={submitError} className="mb-2" />}
        <Button onClick={addRule} className="mt-1">+ ルールを追加</Button>
      </div>

      {/* Rule list */}
      {loading ? (
        <LoadingStatus />
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="rounded-sm p-4 transition-opacity"
              style={{
                background: "var(--color-bg-surface)",
                border: `1px solid ${rule.active ? "rgba(255,180,60,0.15)" : "rgba(0,200,255,0.06)"}`,
                opacity: rule.active ? 1 : 0.5,
              }}
            >
              <div className="flex justify-between items-center mb-3 gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-1.5 py-px rounded-sm"
                    style={{
                      border: "1px solid rgba(255,180,60,0.3)",
                      color: "var(--color-warning)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {rule.type}
                  </span>
                  <span
                    className="hud-label"
                    style={{ color: rule.active ? "var(--color-success)" : "var(--color-fg-muted)" }}
                  >
                    {rule.active ? <><Icon name="dot" size={8} style={{ marginRight: 3 }} aria-hidden />ACTIVE</> : "INACTIVE"}
                  </span>
                </div>
                <Button
                  variant={rule.active ? "secondary" : "primary"}
                  onClick={() => toggleRule(rule.id, rule.active)}
                  className="px-3 py-1 text-[11px]"
                >
                  {rule.active ? "無効化" : "有効化"}
                </Button>
              </div>
              <pre
                className="m-0 overflow-x-auto whitespace-pre-wrap break-words"
                style={{
                  fontSize: "11px",
                  color: "var(--color-fg-dim)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {formatRuleData(rule.data_json)}
              </pre>
            </div>
          ))}
          {rules.length === 0 && (
            <div
              className="rounded-sm py-8 text-center"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px dashed rgba(255,180,60,0.1)",
              }}
            >
              <div className="hud-label">ルールがありません</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
