import React from 'react';
import { ActivityNotification, NotificationType } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: ActivityNotification;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  user_joined: '👋',
  user_left: '🚪',
  media_changed: '🎬',
  chat_mention: '💬',
  host_transferred: '👑',
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const timeStr = new Date(notification.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-muted/40',
        !notification.read && 'bg-emerald-500/5'
      )}
    >
      <span className="text-base" aria-hidden="true">
        {NOTIFICATION_ICONS[notification.type]}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs font-bold text-foreground">
            {notification.title}
          </p>
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
          {notification.description}
        </p>
      </div>

      {!notification.read && (
        <span
          className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1"
          aria-label="Unread"
        />
      )}
    </div>
  );
}
