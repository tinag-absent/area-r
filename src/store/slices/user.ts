/**
 * src/store/slices/user.ts
 *
 * ユーザー認証状態スライス。
 * ログイン・ログアウト・部分更新を管理する。
 *
 * セキュリティ方針:
 *   - XP / level / role / anomalyScore 等の機密フィールドは
 *     localStorage に保存しない（partialize で除外）
 *   - サーバーから渡された値を常に優先する
 */

import type { StateCreator }  from "zustand";
import type { UserRole, UserStatus, ProgressFlags } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────

export interface UserState {
  id:          string | null;
  agentId:     string | null;
  username:    string | null;
  displayName: string | null;
  divisionId:  string | null;
  role:        UserRole;
  status:      UserStatus;
  // サーバー信頼の値 — localStorage には保存しない
  level:        number;
  xp:           number;
  anomalyScore: number;
  observerLoad: number;
  streak:       number;
  flags:        ProgressFlags;
}

export interface UserSlice {
  user:       UserState | null;
  setUser:    (u: UserState) => void;
  updateUser: (partial: Partial<UserState>) => void;
  clearUser:  () => void;
}

// ─────────────────────────────────────────────────────────────────────
// スライス実装
// ─────────────────────────────────────────────────────────────────────

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user:       null,
  setUser:    (u) => set({ user: u }),
  updateUser: (partial) =>
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
  clearUser:  () => set({ user: null }),
});

// ─────────────────────────────────────────────────────────────────────
// persist partialize — localStorage に保存する最小限フィールド
// ─────────────────────────────────────────────────────────────────────

export function partializeUser(user: UserState | null): UserState | null {
  if (!user) return null;
  return {
    id:          user.id,
    agentId:     user.agentId,
    username:    user.username,
    displayName: user.displayName,
    divisionId:  user.divisionId,
    // 機密フィールドは初期値（サーバーから再取得される）
    role:         "player" as UserRole,
    status:       "active" as UserStatus,
    level:        0,
    xp:           0,
    anomalyScore: 0,
    observerLoad: 0,
    streak:       0,
    // tutorial_complete のみ保存（ダッシュボード再訪時の再表示防止）
    flags: user.flags?.tutorial_complete
      ? { tutorial_complete: user.flags.tutorial_complete }
      : {},
  };
}
