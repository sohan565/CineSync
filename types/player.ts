// ─── Media Player Domain Types ────────────────────────────────────────────────
// All player-related interfaces, events, and state shapes.

import { MediaSourceType } from '@/types/room';

// ── Resolved media source ─────────────────────────────────────────────────────

export interface MediaSource {
  url: string;
  title: string;
  sourceType: MediaSourceType;
}

// ── Player state (local + synced) ─────────────────────────────────────────────

export interface PlayerState {
  isPlaying: boolean;
  /** Current playback position in seconds */
  position: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  playbackRate: number;
  /** Whether *this* client is allowed to issue control commands */
  canControl: boolean;
}

export const DEFAULT_PLAYER_STATE: PlayerState = {
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isBuffering: false,
  playbackRate: 1,
  canControl: false,
};

// ── Sync event payload (broadcast over Supabase Realtime) ─────────────────────

export type PlayerEventType =
  | 'PLAYER_PLAY'
  | 'PLAYER_PAUSE'
  | 'PLAYER_SEEK'
  | 'PLAYER_RATE'
  | 'MEDIA_CHANGE'
  | 'PLAYER_SYNC_TICK'; // Host heartbeat: viewers auto-seek if > 1s drift

export interface PlayerSyncEvent {
  type: PlayerEventType;
  /** Position in seconds at time of event */
  position: number;
  /** Wall-clock timestamp (ms) when the sender dispatched this event */
  sentAt: number;
  /** Sender's user ID */
  senderId: string;
  /** Playback rate (for PLAYER_RATE events) */
  playbackRate?: number;
  /** New media source (for MEDIA_CHANGE events) */
  media?: MediaSource;
}

// ── NTP clock offset ──────────────────────────────────────────────────────────

export interface ClockOffset {
  /** Estimated one-way network latency in ms */
  latencyMs: number;
  /** Difference between server time and local time in ms */
  offsetMs: number;
}

// ── Player adapter interface ──────────────────────────────────────────────────
// All adapters (YouTube, HTML5) must satisfy this contract.

export interface PlayerAdapter {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  isReady: boolean;
}

// ── URL parse result ──────────────────────────────────────────────────────────

export interface ParsedMediaUrl {
  sourceType: MediaSourceType;
  /** Cleaned/canonical URL ready to hand to the adapter */
  canonicalUrl: string;
  /** YouTube video ID, if applicable */
  youtubeId?: string;
  /** Human-readable title guess from URL */
  titleGuess: string;
}
