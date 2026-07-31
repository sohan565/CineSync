// ─── NTP-Style Sync Engine ────────────────────────────────────────────────────
// Calculates clock offset between sender and receiver using round-trip timing,
// then computes the "true" playback position that accounts for network latency.
//
// Algorithm (simplified NTP 4-way):
//   t1 = sender's wall clock at dispatch
//   t2 = receiver's wall clock at reception
//   estimated latency = (t2 - t1) / 2   (assumes symmetric paths)
//   corrected position = sentPosition + (latencyMs / 1000)
//
// Drift correction strategy:
//   |drift| > HARD_SYNC_THRESHOLD  → hard seek
//   |drift| > SOFT_SYNC_THRESHOLD  → nudge playback rate (1.05x / 0.95x)
//   |drift| ≤ SOFT_SYNC_THRESHOLD  → do nothing

import { PlayerSyncEvent, ClockOffset } from '@/types/player';

// ── Thresholds ────────────────────────────────────────────────────────────────

/** Hard-seek if drift exceeds this (seconds) */
export const HARD_SYNC_THRESHOLD = 2.0;
/** Rate-nudge if drift exceeds this (seconds) */
export const SOFT_SYNC_THRESHOLD = 0.3;
/** Maximum playback rate when nudging forward */
export const NUDGE_RATE_FAST = 1.06;
/** Minimum playback rate when nudging back */
export const NUDGE_RATE_SLOW = 0.94;
/** Normal playback rate */
export const NORMAL_RATE = 1.0;

// ── Correction result ─────────────────────────────────────────────────────────

export type SyncAction =
  | { type: 'none' }
  | { type: 'seek'; targetPosition: number }
  | { type: 'rate'; playbackRate: number; targetPosition: number };

// ── Clock offset calculation ──────────────────────────────────────────────────

export function calculateClockOffset(
  sentAt: number,
  receivedAt: number
): ClockOffset {
  const roundTripMs = receivedAt - sentAt;
  const latencyMs = Math.max(0, roundTripMs / 2);
  // Since we only have one-way data, offsetMs ≈ 0 (we correct via latency)
  return { latencyMs, offsetMs: 0 };
}

// ── Position correction ───────────────────────────────────────────────────────

/**
 * Given a sync event, compute what the sender's position "should be" right now
 * on the receiver's clock, accounting for one-way network latency.
 */
export function computeExpectedPosition(
  event: PlayerSyncEvent,
  receivedAt: number
): number {
  const { latencyMs } = calculateClockOffset(event.sentAt, receivedAt);
  // If sender was playing, position has advanced by transit time
  const transitSeconds = event.type === 'PLAYER_PLAY' ? latencyMs / 1000 : 0;
  return event.position + transitSeconds;
}

// ── Sync decision ─────────────────────────────────────────────────────────────

/**
 * Decide what sync action to take given the expected position and
 * the local player's current position.
 */
export function computeSyncAction(
  expectedPosition: number,
  currentPosition: number,
  isPlaying: boolean
): SyncAction {
  const drift = expectedPosition - currentPosition;
  const absDrift = Math.abs(drift);

  if (absDrift <= SOFT_SYNC_THRESHOLD) {
    return { type: 'none' };
  }

  if (absDrift > HARD_SYNC_THRESHOLD) {
    return { type: 'seek', targetPosition: expectedPosition };
  }

  // Soft nudge — only sensible while playing
  if (isPlaying) {
    const rate = drift > 0 ? NUDGE_RATE_FAST : NUDGE_RATE_SLOW;
    return { type: 'rate', playbackRate: rate, targetPosition: expectedPosition };
  }

  return { type: 'seek', targetPosition: expectedPosition };
}

// ── Format helpers (pure, unit-testable) ──────────────────────────────────────

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function clampVolume(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function clampPosition(pos: number, duration: number): number {
  return Math.min(duration, Math.max(0, pos));
}
