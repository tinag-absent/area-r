/**
 * HOOK-3: 管理画面ユーザー管理ロジック
 *
 * AdminUsersPage（271行）からデータ取得・編集・保存ロジックを切り出す。
 */
"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { apiGet, apiPatch, parseResponse, getErrorMessage } from "@/lib/api-client";
import type { AdminEditableField, UserRole, UserStatus } from "@/lib/types";

export interface AdminUser {
  id:              string;
  agent_id:        string;
  username:        string;
  display_name:    string | null;
  role:            UserRole;
  status:          UserStatus;
  clearance_level: number;
  xp_total:        number;
  anomaly_score:   number;
  last_login_at:   string | null;
}

export interface EditState {
  userId: string;
  field:  AdminEditableField;
  value:  string;
}

export function useAdminUsers() {
  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<EditState | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  // フォーカスをモーダルを開いたボタンに戻すための参照
  const editTriggerRef = useRef<HTMLButtonElement | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/admin/users?q=${encodeURIComponent(query)}`)
        .then(res => parseResponse<AdminUser[]>(res));
      setUsers(data);
    } catch {
      // ロード失敗はサイレント（再試行可能）
    } finally {
      setLoading(false);
    }
  }, []);

  const openEdit = useCallback((
    userId:  string,
    field:   AdminEditableField,
    value:   string,
    trigger: HTMLButtonElement
  ) => {
    editTriggerRef.current = trigger;
    setSaveError("");
    setEditing({ userId, field, value });
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(null);
    setSaveError("");
    editTriggerRef.current?.focus();
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editing || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await apiPatch("/api/admin/users", {
        userId: editing.userId,
        field:  editing.field,
        value:  editing.value,
      }).then(res => parseResponse(res));
      closeEdit();
      searchUsers(searchQuery);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [editing, saving, searchQuery, searchUsers, closeEdit]);

  useEffect(() => { searchUsers(""); }, [searchUsers]);

  return {
    users,
    searchQuery,
    setSearchQuery,
    loading,
    editing,
    setEditing,
    saving,
    saveError,
    editTriggerRef,
    searchUsers,
    openEdit,
    closeEdit,
    saveEdit,
  };
}
