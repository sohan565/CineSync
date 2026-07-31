// ─── Notification & Activity Domain Types ─────────────────────────────────────

export type NotificationType =
  | 'user_joined'
  | 'user_left'
  | 'media_changed'
  | 'chat_mention'
  | 'host_transferred';

export interface ActivityNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  linkUrl?: string;
}

export type ChimeSoundType = 'join' | 'leave' | 'chat' | 'media';
