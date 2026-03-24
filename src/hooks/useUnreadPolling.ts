/**
 * HOOK-4: 未読カウントのポーリングロジック
 *
 * UserProvider から切り出し、コンポーネントをシンプルにする。
 * タブ非アクティブ時のスキップ、visibilitychange 復帰も含む。
 */
"use client";
import { useEffect, useRef } from "react";
import { useBoundStore } from "@/store";
import { apiGet, apiPost } from "@/lib/api-client";

const POLL_INTERVAL_MS = 30_000;

export function useUnreadPolling() {
  const setUnreadCount      = useBoundStore(s => s.setUnreadCount);
  const setUnreadChatCounts = useBoundStore(s => s.setUnreadChatCounts);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      if (document.hidden) return;

      try {
        const [notifRes, chatRes] = await Promise.all([
          apiGet("/api/users/me/notifications"),
          apiGet("/api/chat/unread"),
        ]);

        // セッション切れは即座にログインページへ
        if (notifRes.status === 401 || chatRes.status === 401) {
          window.location.href = "/login?expired=1";
          return;
        }

        // 403/429 等のエラーはサイレントスキップ（次のポーリングで再試行）
        if (notifRes.ok) {
          const notifs = await notifRes.json().catch(() => []) as { is_read: number }[];
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        }
        if (chatRes.ok) {
          const counts = await chatRes.json().catch(() => ({})) as Record<string, number>;
          setUnreadChatCounts(counts);
        }
      } catch (err) {
        // ネットワークエラー・JSON解析失敗は無視（次のポーリングで再試行）
        if (process.env.NODE_ENV === "development") {
          console.warn("[useUnreadPolling] poll error:", err);
        }
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) poll();
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setUnreadCount, setUnreadChatCounts]);
}

/** マウント時に一度だけトリガーチェックを実行する（fire & forget） */
export function useTriggerCheck() {
  useEffect(() => {
    apiPost("/api/users/me/check-triggers").catch(() => {});
  }, []);
}
