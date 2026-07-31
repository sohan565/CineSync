// ─── Chat Domain Types ────────────────────────────────────────────────────────
// Single source of truth for all chat-related interfaces.
// Mapped 1-to-1 from Database Schema (docs/05-Database/Database-Schema.md).

import { UserRole } from '@/types/room';

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  /** Joined metadata from profiles & room_members */
  senderName: string;
  senderAvatar: string | null;
  senderRole: UserRole;
  /** Flag for local/system notifications (e.g. user joined, video updated) */
  isSystem?: boolean;
}

export interface TypingUser {
  userId: string;
  displayName: string;
  startedAt: number;
}

export interface SendMessageDTO {
  roomId: string;
  userId: string;
  content: string;
}

export interface ChatSlice {
  messages: ChatMessage[];
  pinnedMessage: ChatMessage | null;
  typingUsers: TypingUser[];
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setPinnedMessage: (message: ChatMessage | null) => void;
  setTypingUser: (user: TypingUser, isTyping: boolean) => void;
  clearChat: () => void;
}
