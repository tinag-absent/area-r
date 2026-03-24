/**
 * src/store/slices/toast.ts
 *
 * Toast 通知キュースライス。
 * タイマーは Zustand 外（モジュールスコープ Map）で管理する（シリアライズ不可のため）。
 */

import type { StateCreator }  from "zustand";
import type { NotificationType } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

export type ToastType = NotificationType;

export const TOAST_DURATIONS: Record<ToastType, number> = {
  xp:          4500,
  levelup:     7000,
  login:       4000,
  unlock:      5500,
  mission:     5000,
  info:        4000,
  achievement: 6000,
  warning:     5000,
  system:      4000,
  error:       6000,
  story:       6000,
};

export interface Toast {
  id:        string;
  type:      ToastType;
  title:     string;
  body?:     string;
  duration?: number;
}

export interface ToastSlice {
  toasts:      Toast[];
  addToast:    (t: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────
// Toastタイマー（Zustand外で管理 — シリアライズ不可のため）
// ─────────────────────────────────────────────────────────────────────

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function randomId(): string {
  return Math.random().toString(36).slice(2);
}

// ─────────────────────────────────────────────────────────────────────
// スライス実装
// ─────────────────────────────────────────────────────────────────────

export const createToastSlice: StateCreator<ToastSlice> = (set, get) => ({
  toasts: [],

  addToast: (t) => {
    const id       = randomId();
    const toast: Toast = { id, ...t };
    const duration = t.duration ?? TOAST_DURATIONS[t.type] ?? 6000;

    // 最大5件（古いものを押し出す）
    set((s) => ({ toasts: [...s.toasts.slice(-4), toast] }));

    const timer = setTimeout(() => get().removeToast(id), duration);
    toastTimers.set(id, timer);
  },

  removeToast: (id) => {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
});
