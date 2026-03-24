"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Button }           from "@/components/ui/Button";
import { LoadingStatus }    from "@/components/ui/LoadingStatus";
import type { Notification } from "@/hooks/useNotifications";
import type { NotificationType } from "@/lib/types";
import { Icon, NavIcon } from "@/components/ui/Icon";

const TYPE_CONFIG: Partial<Record<NotificationType, { accent: string; icon: string }>> = {
  info:        { accent: "var(--color-primary)",  icon: "chat" },
  warning:     { accent: "var(--color-warning)",  icon: "warning" },
  achievement: { accent: "var(--color-success)",  icon: "entity" },
  system:      { accent: "var(--color-fg-dim)",   icon: "hex" },
  error:       { accent: "var(--color-danger)",   icon: "✕" },
  story:       { accent: "var(--color-primary)",  icon: "mission" },
};

function NotificationItem({ notification: notif }: { notification: Notification }) {
  const t = notif.type as NotificationType;
  const cfg = TYPE_CONFIG[t] ?? { accent: "var(--color-fg-dim)", icon: "chat" };
  const date = new Date(notif.created_at.replace(" ", "T") + "Z");
  const dateStr = date.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" });
  const timeStr = date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="rounded-sm transition-all duration-200"
      style={{
        background: notif.is_read ? "var(--color-bg-surface)" : `linear-gradient(135deg, ${cfg.accent}06 0%, transparent 60%)`,
        border: `1px solid ${notif.is_read ? "rgba(0,200,255,0.06)" : `${cfg.accent}22`}`,
        borderLeft: `2px solid ${notif.is_read ? "rgba(0,200,255,0.06)" : cfg.accent}`,
        opacity: notif.is_read ? 0.55 : 1,
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span
          className="text-[14px] mt-0.5 shrink-0"
          style={{ color: cfg.accent }}
          aria-hidden="true"
        >
          <NavIcon icon={cfg.icon} size={13} color={cfg.accent} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="text-[13px] font-bold" style={{ color: "var(--color-foreground)" }}>
              {!notif.is_read && <span className="sr-only">未読：</span>}
              {notif.title}
            </div>
            <div
              className="shrink-0 text-right"
              style={{ color: "var(--color-fg-muted)" }}
            >
              <div className="hud-label">{dateStr}</div>
              <div className="hud-label">{timeStr}</div>
            </div>
          </div>
          {notif.body && (
            <p className="m-0 text-[12px] leading-relaxed break-words" style={{ color: "var(--color-fg-dim)" }}>
              {notif.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, loading, error, retry, markAllRead } = useNotifications();
  const hasUnread = notifications.some(n => !n.is_read);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] px-5 py-7 sm:px-8 max-w-[720px] mx-auto">
      <div className="flex justify-between items-start mb-7 gap-4">
        <div>
          <div className="hud-label mb-1">SYSTEM ALERTS</div>
          <h1 className="m-0 text-[19px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}>
            通知センター
          </h1>
          {unreadCount > 0 && (
            <div className="hud-label mt-1" style={{ color: "var(--color-primary)" }}>
              未読 {unreadCount}件
            </div>
          )}
        </div>
        {hasUnread && (
          <Button variant="secondary" onClick={markAllRead} className="shrink-0 text-[11px]">
            すべて既読
          </Button>
        )}
      </div>

      {loading && <LoadingStatus />}

      {!loading && error && (
        <div
          className="rounded-sm p-5 text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,68,68,0.2)" }}
        >
          <p className="text-[13px] mb-3" style={{ color: "var(--color-danger)" }}>通知の取得に失敗しました</p>
          <Button variant="secondary" onClick={retry} className="text-[12px]">再試行</Button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div
          className="rounded-sm p-10 text-center"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid rgba(0,200,255,0.06)",
            color: "var(--color-fg-dim)",
          }}
        >
          <div className="mb-2 opacity-20"><Icon name="notify" size={24} aria-hidden /></div>
          <div className="text-[13px]">通知はありません</div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
