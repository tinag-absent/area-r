/**
 * src/store/index.ts
 *
 * Zustand バウンドストア（グローバル状態管理）
 * Updated: 2026-03-23 — スライス分割（user / notifications / toast）
 *
 * 外部インターフェースは変更なし。
 * すべての既存の useBoundStore(s => s.xxx) 呼び出しはそのまま動作する。
 *
 * スライス構成:
 *   user          → src/store/slices/user.ts
 *   notifications → src/store/slices/notifications.ts
 *   toast         → src/store/slices/toast.ts
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createUserSlice,          partializeUser }     from "./slices/user";
import { createNotificationsSlice }                     from "./slices/notifications";
import { createToastSlice }                             from "./slices/toast";

import type { UserSlice }          from "./slices/user";
import type { NotificationsSlice } from "./slices/notifications";
import type { ToastSlice }         from "./slices/toast";

// ─────────────────────────────────────────────────────────────────────
// 後方互換エクスポート（既存コードがそのまま動く）
// ─────────────────────────────────────────────────────────────────────

export type { UserState }  from "./slices/user";
export type { Toast, ToastType } from "./slices/toast";
export { TOAST_DURATIONS } from "./slices/toast";

// ─────────────────────────────────────────────────────────────────────
// バウンドストア型
// ─────────────────────────────────────────────────────────────────────

type BoundState = UserSlice & NotificationsSlice & ToastSlice;

// ─────────────────────────────────────────────────────────────────────
// ストア本体
// ─────────────────────────────────────────────────────────────────────

export const useBoundStore = create<BoundState>()(
  persist(
    (...args) => ({
      ...createUserSlice(...args),
      ...createNotificationsSlice(...args),
      ...createToastSlice(...args),
    }),
    {
      name: "kaishoku-store",
      // 機密フィールドを除いた最小限の情報だけを localStorage に保存する
      partialize: (s) => ({
        user: partializeUser(s.user),
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────────────
// 以下は削除済みのレガシーコード — スライスに移行完了
// ─────────────────────────────────────────────────────────────────────
// UserState, Toast, ToastType, TOAST_DURATIONS は各スライスファイルから
// re-export されているため、既存の import はそのまま動作する。

// NOTE: import type { UserRole, UserStatus, ProgressFlags } from "@/lib/types" は
// 各スライスファイル内で直接 import している。

