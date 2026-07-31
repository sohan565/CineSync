'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/hooks/use-store';
import { useSync } from '@/hooks/use-sync';
import { PlayerAdapter } from '@/types/player';
import { MediaService } from '@/services/media-service';
import { parseMediaUrl } from '@/lib/player/url-parser';
import { toast } from '@/hooks/use-toast';
import { clampPosition } from '@/lib/player/sync-engine';

interface UsePlayerOptions {
  slug: string;
  roomId: string;
  hostId: string;
  permissionMode: 'open' | 'host_only';
}

/**
 * Master player hook — coordinates permissions, adapter ref,
 * sync broadcasting, and store updates.
 */
export function usePlayer({
  slug,
  roomId,
  hostId,
  permissionMode,
}: UsePlayerOptions) {
  const user = useAppStore((s) => s.user);
  const playerState = useAppStore((s) => s.playerState);
  const currentMedia = useAppStore((s) => s.currentMedia);
  const setPlayerState = useAppStore((s) => s.setPlayerState);
  const setCurrentMedia = useAppStore((s) => s.setCurrentMedia);
  const resetPlayer = useAppStore((s) => s.resetPlayer);

  // The adapter ref is shared between this hook and useSync
  const adapterRef = useRef<PlayerAdapter | null>(null);

  // Compute permission
  const userId = user?.id ?? '';
  const isHost = userId === hostId;
  const canControl = isHost || permissionMode === 'open';

  // Sync canControl into the store so controls can read it reactively
  useEffect(() => {
    setPlayerState({ canControl });
  }, [canControl, setPlayerState]);

  const { broadcastPlay, broadcastPause, broadcastSeek } = useSync({
    slug,
    roomId,
    userId,
    adapterRef,
  });

  // ── Control handlers (permission-gated) ───────────────────────────────────

  const handlePlay = useCallback(() => {
    if (!canControl) return;
    const adapter = adapterRef.current;
    const pos = adapter?.getCurrentTime() ?? playerState.position;
    adapter?.play();
    setPlayerState({ isPlaying: true });
    broadcastPlay(pos, userId);
  }, [canControl, playerState.position, broadcastPlay, setPlayerState, userId]);

  const handlePause = useCallback(() => {
    if (!canControl) return;
    const adapter = adapterRef.current;
    const pos = adapter?.getCurrentTime() ?? playerState.position;
    adapter?.pause();
    setPlayerState({ isPlaying: false, position: pos });
    broadcastPause(pos, userId);
  }, [canControl, playerState.position, broadcastPause, setPlayerState, userId]);

  const handleSeek = useCallback(
    (seconds: number) => {
      if (!canControl) return;
      const adapter = adapterRef.current;
      const duration = adapter?.getDuration() ?? playerState.duration;
      const clamped = clampPosition(seconds, duration);
      adapter?.seekTo(clamped);
      setPlayerState({ position: clamped });
      broadcastSeek(clamped, userId);
    },
    [canControl, playerState.duration, broadcastSeek, setPlayerState, userId]
  );

  const handleVolumeChange = useCallback(
    (volume: number) => {
      adapterRef.current?.setVolume(volume);
      setPlayerState({ volume, isMuted: volume === 0 });
    },
    [setPlayerState]
  );

  const handleMuteToggle = useCallback(() => {
    const next = !playerState.isMuted;
    adapterRef.current?.setMuted(next);
    setPlayerState({ isMuted: next });
  }, [playerState.isMuted, setPlayerState]);

  const handleTogglePlay = useCallback(() => {
    if (playerState.isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [playerState.isPlaying, handlePlay, handlePause]);

  // ── Media change ──────────────────────────────────────────────────────────

  const handleMediaChange = useCallback(
    async (rawUrl: string, title?: string) => {
      if (!canControl) {
        toast.error('Only the host can change the video.');
        return;
      }

      const parsed = parseMediaUrl(rawUrl);
      if (!parsed) {
        toast.error('Invalid URL. Please enter a YouTube link, MP4, or HLS stream URL.');
        return;
      }

      const media = {
        url: parsed.canonicalUrl,
        title: title?.trim() || parsed.titleGuess,
        sourceType: parsed.sourceType,
      };

      setCurrentMedia(media);
      setPlayerState({ isPlaying: false, position: 0, duration: 0, isBuffering: true });

      // Broadcast to all members
      MediaService.broadcastPlayerEvent(slug, {
        type: 'MEDIA_CHANGE',
        position: 0,
        sentAt: Date.now(),
        senderId: userId,
        media,
      });

      // Persist to DB
      try {
        await MediaService.setCurrentMedia(roomId, media, 0, false);
        toast.success('Video loaded!');
      } catch {
        toast.error('Video loaded locally, but failed to sync to database.');
      }
    },
    [canControl, slug, roomId, userId, setCurrentMedia, setPlayerState]
  );

  // ── Adapter event callbacks (called by YouTube/HTML5 adapters) ────────────

  const onAdapterReady = useCallback(
    (duration: number) => {
      setPlayerState({ duration, isBuffering: false });
    },
    [setPlayerState]
  );

  const onAdapterTimeUpdate = useCallback(
    (position: number) => {
      setPlayerState({ position });
    },
    [setPlayerState]
  );

  const onAdapterBuffering = useCallback(
    (isBuffering: boolean) => {
      setPlayerState({ isBuffering });
    },
    [setPlayerState]
  );

  const onAdapterEnded = useCallback(() => {
    setPlayerState({ isPlaying: false, position: 0 });
  }, [setPlayerState]);

  const onAdapterError = useCallback(
    (message: string) => {
      toast.error(`Playback error: ${message}`);
      setPlayerState({ isBuffering: false });
    },
    [setPlayerState]
  );

  // Cleanup player state on unmount
  useEffect(() => {
    return () => {
      resetPlayer();
    };
  }, [resetPlayer]);

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      adapterRef.current?.setPlaybackRate(rate);
      setPlayerState({ playbackRate: rate });
      if (canControl) {
        MediaService.broadcastPlayerEvent(slug, {
          type: 'PLAYER_RATE',
          position: playerState.position,
          sentAt: Date.now(),
          senderId: userId,
          playbackRate: rate,
        });
      }
    },
    [canControl, playerState.position, slug, userId, setPlayerState]
  );

  return {
    // State
    playerState,
    currentMedia,
    canControl,
    adapterRef,
    setCurrentMedia,

    // Controls
    handlePlay,
    handlePause,
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    handleMuteToggle,
    handlePlaybackRateChange,
    handleMediaChange,

    // Adapter callbacks
    onAdapterReady,
    onAdapterTimeUpdate,
    onAdapterBuffering,
    onAdapterEnded,
    onAdapterError,
  };
}
