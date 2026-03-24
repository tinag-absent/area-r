/**
 * HOOK: 管理画面ルールエンジンのデータ取得・操作ロジック
 *
 * RuleEnginePage からロジックを切り出す。
 * CLEAN-3: addRule / toggleRule のエラーをサイレント無視していた問題も修正。
 */
"use client";
import { useState, useCallback, useEffect } from "react";
import { apiGet, apiPost, apiPatch, parseResponse, getErrorMessage } from "@/lib/api-client";
import type { RuleEngineType } from "@/lib/types";

export interface RuleEntry {
  id:         string;
  type:       string;
  active:     number;
  priority:   number;
  data_json:  string;
  created_at: string;
}

const DEFAULT_JSON = '{\n  "activity": "example",\n  "xp": 10,\n  "rateLimit": 5\n}';

export function useAdminRuleEngine() {
  const [rules,       setRules]      = useState<RuleEntry[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [newJson,     setNewJson]    = useState(DEFAULT_JSON);
  const [newType,     setNewType]    = useState<RuleEngineType>("xp_rule");
  const [jsonError,   setJsonError]  = useState("");
  // CLEAN-3: 追加・切り替え時のAPIエラーも表示する
  const [submitError, setSubmitError] = useState("");

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet("/api/admin/rule-engine").then(res => parseResponse<RuleEntry[]>(res));
      setRules(data);
    } catch {
      // ロード失敗はサイレント（次回操作時にリトライ）
    } finally {
      setLoading(false);
    }
  }, []);

  const addRule = useCallback(async () => {
    setJsonError("");
    setSubmitError("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(newJson);
    } catch {
      setJsonError("JSONの形式が正しくありません");
      return;
    }
    try {
      await apiPost("/api/admin/rule-engine", { type: newType, data: parsed })
        .then(res => parseResponse(res));
      loadRules();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }, [newJson, newType, loadRules]);

  const toggleRule = useCallback(async (id: string, active: number) => {
    setSubmitError("");
    try {
      await apiPatch("/api/admin/rule-engine", { id, active: active ? 0 : 1 })
        .then(res => parseResponse(res));
      loadRules();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }, [loadRules]);

  useEffect(() => { loadRules(); }, [loadRules]);

  return {
    rules,
    loading,
    newJson,
    setNewJson:   (v: string) => { setNewJson(v); setJsonError(""); },
    newType,
    setNewType,
    jsonError,
    submitError,
    addRule,
    toggleRule,
  };
}
