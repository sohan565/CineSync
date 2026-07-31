'use client';

import { useState, useCallback, useEffect } from 'react';
import { ActivityNotification, ChimeSoundType } from '@/types/notification';
import { NotificationService } from '@/services/notification-service';

export function useNotifications(slug: string | null) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);

  const addNotification = useCallback(
    (n: ActivityNotification, chime?: ChimeSoundType) => {
      setNotifications((prev) => [n, ...prev].slice(0, 30)); // Keep latest 30
      if (chime) {
        NotificationService.playChime(chime);
      }
    },
    []
  );

  // Subscribe to room activity broadcast events
  useEffect(() => {
    if (!slug) return;

    const cleanup = NotificationService.subscribeToActivity(slug, (notification) => {
      addNotification(notification, 'join');
    });

    return () => {
      cleanup();
    };
  }, [slug, addNotification]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAllAsRead,
    clearAll,
    playChime: NotificationService.playChime,
  };
}
