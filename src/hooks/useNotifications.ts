/**
 * HOOK-2: 通知データの取得・既読管理ロジック
 *
 * NotificationsPage からロジックを切り出し、ページコンポーネントを
 * 純粋なレンダリングに集中させる。
 */
"use client";
import { useState, useCallback, useEffect } from "react";
import { useBoundStore } from "@/store";
import { apiGet, apiPatch, parseResponse, getErrorMessage } from "@/lib/api-client";

export interface Notification {
  id:         string;
  type:       string;
  title:      string;
  body:       string;
  is_read:    number;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const setUnreadCount = useBoundStore(s => s.setUnreadCount);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet("/api/users/me/notifications")
        .then(res => parseResponse<Notification[]>(res));
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  const markAllRead = useCallback(async () => {
    try {
      await apiPatch("/api/users/me/notifications", { all: true })
        .then(res => parseResponse(res));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // 既読化失敗はサイレント（UIは楽観的更新しない）
    }
  }, [setUnreadCount]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    retry:      fetchNotifications,
    markAllRead,
  };
}
