'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MediaService } from '@/services/media-service';
import { PlayerSyncEvent, PlayerAdapter } from '@/types/player';
import { useAppStore } from '@/hooks/use-store';
import {
  computeExpectedPosition,
  computeSyncAction,
  NORMAL_RATE,
} from '@/lib/player/sync-engine';
import { parseMediaUrl } from '@/lib/player/url-parser';
import { toast } from '@/hooks/use-toast';

// ── Drift threshold: if viewer is > 1 second off from host, force seek ────────
const SYNC_DRIFT_THRESHOLD_S = 1;

interface UseSyncOptions {
  slug: string;
  roomId: string;
  userId: string;
  isHost: boolean;
  adapterRef: React.MutableRefObject<PlayerAdapter | null>;
}

/**
 * Subscribes to Supabase Realtime broadcast events for the room channel
 * and applies NTP-corrected sync actions to the player adapter.
 *
 * Host mode: broadcasts PLAYER_SYNC_TICK every 3 seconds with its current timestamp.
 * Viewer mode: on each PLAYER_SYNC_TICK, if drift > 1s, seekTo the host position.
 */
export function useSync({ slug, roomId, userId, isHost, adapterRef }: UseSyncOptions) {
  const setPlayerState = useAppStore((s) => s.setPlayerState);
  const setCurrentMedia = useAppStore((s) => s.setCurrentMedia);
  const playerState = useAppStore((s) => s.playerState);
  const playerStateRef = useRef(playerState);

  // Keep ref current without triggering re-subscriptions
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  const handleSyncEvent = useCallback(
    (event: PlayerSyncEvent) => {
      // Ignore self-broadcasted sync events to prevent feedback loops/stuttering
      if (event.senderId && userId && event.senderId === userId) {
        return;
      }

      const adapter = adapterRef.current;
      const receivedAt = Date.now();
      const state = playerStateRef.current;

      switch (event.type) {
        case 'MEDIA_CHANGE': {
          if (event.media) {
            const parsed = parseMediaUrl(event.media.url);
            if (parsed) {
              setCurrentMedia({
                url: parsed.canonicalUrl,
                title: event.media.title || parsed.titleGuess,
                sourceType: parsed.sourceType,
              });
              setPlayerState({ isPlaying: false, position: 0 });
            }
          }
          break;
        }

        case 'PLAYER_PLAY': {
          const expected = computeExpectedPosition(event, receivedAt);
          const action = computeSyncAction(expected, state.position, false);

          if (adapter?.isReady) {
            if (action.type === 'seek') {
              adapter.seekTo(action.targetPosition);
            }
            adapter.play();
          }
          setPlayerState({ isPlaying: true });
          break;
        }

        case 'PLAYER_PAUSE': {
          const expected = computeExpectedPosition(event, receivedAt);
          if (adapter?.isReady) {
            adapter.pause();
            adapter.seekTo(expected);
          }
          setPlayerState({ isPlaying: false, position: expected });
          break;
        }

        case 'PLAYER_SEEK': {
          const expected = computeExpectedPosition(event, receivedAt);
          if (adapter?.isReady) {
            adapter.seekTo(expected);
          }
          setPlayerState({ position: expected });
          break;
        }

        case 'PLAYER_RATE': {
          if (adapter?.isReady && event.playbackRate) {
            adapter.setPlaybackRate(event.playbackRate);
          }
          setPlayerState({ playbackRate: event.playbackRate ?? NORMAL_RATE });
          break;
        }

        // ── Host heartbeat sync tick ─────────────────────────────────────────
        // Viewers: auto-seek if drift > 1 second from host position
        case 'PLAYER_SYNC_TICK': {
          if (isHost) break; // Host doesn't process its own ticks
          if (!adapter?.isReady) break;

          const hostPosition = computeExpectedPosition(event, receivedAt);
          const myPosition = adapter.getCurrentTime?.() ?? state.position;
          const drift = Math.abs(myPosition - hostPosition);

          if (drift > SYNC_DRIFT_THRESHOLD_S) {
            adapter.seekTo(hostPosition);
            setPlayerState({ position: hostPosition });
          }

          // Also ensure play/pause state is aligned
          const hostIsPlaying = event.position !== undefined && !isNaN(event.position);
          if (hostIsPlaying && state.isPlaying && !adapter.isReady) {
            adapter.play();
          }
          break;
        }
      }
    },
    [adapterRef, setPlayerState, setCurrentMedia, userId, isHost]
  );

  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    if (!slug) return;

    let cleanup: (() => void) | undefined;
    try {
      cleanup = MediaService.subscribeToPlayerEvents(slug, handleSyncEvent);
    } catch {
      toast.error('Failed to connect to sync channel.');
    }

    return () => {
      cleanup?.();
    };
  }, [slug, handleSyncEvent]);

  // ── Host: broadcast sync tick every 3 seconds ───────────────────────────────
  useEffect(() => {
    if (!isHost || !slug) return;

    const syncInterval = setInterval(() => {
      const adapter = adapterRef.current;
      if (!adapter?.isReady) return;

      const position = adapter.getCurrentTime?.() ?? playerStateRef.current.position;

      MediaService.broadcastPlayerEvent(slug, {
        type: 'PLAYER_SYNC_TICK',
        position,
        sentAt: Date.now(),
        senderId: userId,
      });
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [isHost, slug, userId, adapterRef]);

  // ── Broadcast helpers (for use by the host's controls) ────────────────────

  const broadcastPlay = useCallback(
    (position: number, userId: string) => {
      MediaService.broadcastPlayerEvent(slug, {
        type: 'PLAYER_PLAY',
        position,
        sentAt: Date.now(),
        senderId: userId,
      });
      // Persist to DB (fire-and-forget)
      MediaService.updatePlaybackState(roomId, position, true).catch(() => null);
    },
    [slug, roomId]
  );

  const broadcastPause = useCallback(
    (position: number, userId: string) => {
      MediaService.broadcastPlayerEvent(slug, {
        type: 'PLAYER_PAUSE',
        position,
        sentAt: Date.now(),
        senderId: userId,
      });
      MediaService.updatePlaybackState(roomId, position, false).catch(() => null);
    },
    [slug, roomId]
  );

  const broadcastSeek = useCallback(
    (position: number, userId: string) => {
      MediaService.broadcastPlayerEvent(slug, {
        type: 'PLAYER_SEEK',
        position,
        sentAt: Date.now(),
        senderId: userId,
      });
    },
    [slug]
  );

  return { broadcastPlay, broadcastPause, broadcastSeek };
}
