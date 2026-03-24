"use client";
/**
 * ログインボーナス結果をToastで通知するClient Component。
 * DashboardPage(Server Component)からbonusをpropsで受け取りマウント時に表示する。
 */
import { useEffect, useRef } from "react";
import { useBoundStore } from "@/store";
import type { LoginBonusResult } from "@/actions/login-bonus";

export function LoginBonusToast({ bonus }: { bonus: LoginBonusResult | null }) {
  const addToast  = useBoundStore(s => s.addToast);
  const updateUser = useBoundStore(s => s.updateUser);
  // マウント時に1回だけ実行するためのRef
  const firedRef = useRef(false);

  useEffect(() => {
    if (!bonus || firedRef.current) return;
    firedRef.current = true;
    updateUser({ xp: bonus.xp, level: bonus.level, streak: bonus.streak });

    if (bonus.xpGained > 0) {
      addToast({
        type:  "achievement",
        title: `ログインボーナス +${bonus.xpGained} XP`,
        body:  `連続ログイン: ${bonus.streak}日目`,
      });
    }
    if (bonus.leveledUp) {
      addToast({
        type:     "info",
        title:    `クリアランスレベル ${bonus.newLevel} に上昇`,
        body:     "新しいコンテンツへのアクセスが解放されました。",
        duration: 8000,
      });
    }
  }, [bonus, addToast, updateUser]);

  return null;
}
