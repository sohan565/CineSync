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

interface UseSyncOptions {
  slug: string;
  roomId: string;
  userId: string;
  adapterRef: React.MutableRefObject<PlayerAdapter | null>;
}

/**
 * Subscribes to Supabase Realtime broadcast events for the room channel
 * and applies NTP-corrected sync actions to the player adapter.
 */
export function useSync({ slug, roomId, adapterRef }: UseSyncOptions) {
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
            adapter.seekTo(expected); // snap to exact position on pause
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
      }
    },
    [adapterRef, setPlayerState, setCurrentMedia]
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
