/**
 * CineSync v1.0 Pro — TypeScript Declaration Specifications
 */

export type Role = 'host' | 'cohost' | 'guest';
export type RoomPrivacy = 'public' | 'unlisted' | 'password';
export type PermissionMode = 'open' | 'host_only';
export type MediaSourceType = 'YOUTUBE' | 'MP4' | 'HLS' | 'LOCAL';
export type PlaybackState = 'PLAYING' | 'PAUSED' | 'BUFFERING';
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type UIModalType = 'AUTH' | 'LOBBY' | 'TMDB' | 'SETTINGS' | null;

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
}

export interface MediaSource {
  type: MediaSourceType;
  url: string;
  title?: string;
  duration?: number;
}

export interface RoomState {
  slug: string;
  name: string;
  hostId: string;
  privacy: RoomPrivacy;
  permissionMode: PermissionMode;
}

export interface PlayerSyncState {
  playbackState: PlaybackState;
  currentTime: number;
  playbackRate: number;
  mediaSource: MediaSource | null;
  isLobbyActive: boolean;
  readyCheckActive: boolean;
  serverTimeOffset: number; // NTP delta delta
}

export interface Participant {
  id: string;
  displayName: string;
  role: Role;
  isReady: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  displayName: string;
  content: string;
  timestamp: number;
  isPinned: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface UIState {
  mode: 'STANDARD' | 'THEATER' | 'FOCUS';
  activeModal: UIModalType;
  toasts: Toast[];
}

// WebSocket Event Envelope
export interface RealtimeEnvelope<T = any> {
  event: string;
  room_id: string;
  sender_id: string;
  timestamp: number;
  payload: T;
}

export interface PlayerActionPayload {
  action: 'PLAY' | 'PAUSE' | 'SEEK' | 'RATE_CHANGE' | 'MEDIA_CHANGE';
  currentTime: number;
  playbackRate: number;
  mediaSource?: MediaSource;
}

export interface EmojiReactionPayload {
  emoji: string;
  multiplier: number;
}
