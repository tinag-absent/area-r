/**
 * src/store/slices/notifications.ts
 *
 * 未読通知カウント・チャット未読数スライス。
 */

import type { StateCreator } from "zustand";

export interface NotificationsSlice {
  unreadCount:         number;
  unreadChatCounts:    Record<string, number>;
  setUnreadCount:      (n: number) => void;
  setUnreadChatCounts: (counts: Record<string, number>) => void;
}

export const createNotificationsSlice: StateCreator<NotificationsSlice> = (set) => ({
  unreadCount:         0,
  unreadChatCounts:    {},
  setUnreadCount:      (n) => set({ unreadCount: n }),
  setUnreadChatCounts: (counts) => set({ unreadChatCounts: counts }),
});
