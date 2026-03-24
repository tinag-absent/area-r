/**
 * HOOK-1: チャット機能のデータ取得・送信ロジック
 *
 * ChatPage（212行・useEffect/useCallback/useRef 13個）からロジックを切り出し、
 * ページコンポーネントをレンダリングのみに集中させる。
 */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import { useBoundStore } from "@/store";
import { apiGet, apiPost, parseResponse, getErrorMessage } from "@/lib/api-client";
import { ALLOWED_CHAT_CHANNELS, NPC_DM_PREFIX } from "@/lib/constants";
import type { ChatChannel } from "@/lib/types";

export interface ChatMessage {
  id:          string;
  sender_id:   string;
  sender_name: string;
  text:        string;
  type:        "user" | "npc";
  created_at:  string;
}

const POLL_INTERVAL_MS = 5_000;
// NPCの返答を待つタイミング（送信後にポーリングを追加実行するオフセット）
const NPC_POLL_OFFSETS_MS = [500, 3_000, 6_000];

export function useChat(chatId: string) {
  const addToast       = useBoundStore(s => s.addToast);
  const currentUserId  = useBoundStore(s => s.user?.id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [text,     setText]     = useState("");

  const pollRef      = useRef<ReturnType<typeof setInterval>  | null>(null);
  const npcTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isAllowedChannel = (ALLOWED_CHAT_CHANNELS as readonly string[]).includes(chatId) || chatId.startsWith(NPC_DM_PREFIX);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await apiGet(`/api/chat/${chatId}?limit=60`).then(res => parseResponse<ChatMessage[]>(res));
      setMessages(msgs);
    } catch {
      // チャット取得失敗はサイレントに（ポーリング中のネットワーク断など）
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // ポーリング開始・停止
  useEffect(() => {
    if (!isAllowedChannel) { setLoading(false); return; }
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [chatId, isAllowedChannel, fetchMessages]);

  // アンマウント時にNPC待機タイマーをすべてキャンセル
  useEffect(() => {
    return () => { npcTimersRef.current.forEach(clearTimeout); };
  }, []);

  const sendMessage = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiPost(`/api/chat/${chatId}`, { text }).then(res => parseResponse(res));
      setText("");
      // fire & forget — XP付与（失敗しても問題なし）
      apiPost("/api/users/me/xp", { activity: "send_chat_message" }).catch(() => {});
      // NPCの返答タイミングに合わせて追加ポーリング
      npcTimersRef.current = NPC_POLL_OFFSETS_MS.map(ms => setTimeout(fetchMessages, ms));
    } catch (err) {
      addToast({ type: "error", title: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  }, [chatId, text, sending, fetchMessages, addToast]);

  return {
    messages,
    loading,
    sending,
    text,
    setText,
    sendMessage,
    isAllowedChannel,
    channelId:     chatId as ChatChannel,
    currentUserId,
  };
}
