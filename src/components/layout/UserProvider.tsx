"use client";
import { useEffect } from "react";
import { useBoundStore } from "@/store";
import type { UserState } from "@/store";
import { useUnreadPolling, useTriggerCheck } from "@/hooks/useUnreadPolling";

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: UserState;
  children:    React.ReactNode;
}) {
  const setUser   = useBoundStore(s => s.setUser);
  const clearUser = useBoundStore(s => s.clearUser);

  // initialUser.id を依存にする — 同一ユーザーのオブジェクト参照変化で再実行しない
  useEffect(() => {
    setUser(initialUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser.id]);

  // BroadcastChannel "sea-auth" — 複数タブ間でのログイン/ログアウト同期
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("sea-auth");

    channel.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data?.type === "logout") {
        // 別タブでログアウトされた場合 — ストアをクリアしてログインページへ
        clearUser();
        window.location.href = "/login?expired=1";
      } else if (event.data?.type === "login") {
        // 別タブでログインされた場合 — ページをリロードしてセッションを同期
        window.location.reload();
      }
    };

    return () => channel.close();
  }, [clearUser]);

  // HOOK-4: ポーリングとトリガーチェックをHookに委譲
  useUnreadPolling();
  useTriggerCheck();

  return <>{children}</>;
}
