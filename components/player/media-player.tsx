'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/hooks/use-player';
import { PlayerAdapter } from '@/types/player';
import { MediaSource } from '@/types/player';
import { CurrentMedia, PermissionMode } from '@/types/room';
import { parseMediaUrl } from '@/lib/player/url-parser';

import { YouTubePlayer, YouTubePlayerHandle } from '@/components/player/youtube-player';
import { HTML5Player, HTML5PlayerHandle } from '@/components/player/html5-player';
import { PlayerControls } from '@/components/player/player-controls';
import { PlayerError } from '@/components/player/player-error';
import { DraggableVideoOverlay } from '@/components/webrtc/draggable-video-overlay';
import { MediaUrlInput } from '@/components/player/media-url-input';
import { SourceBadge } from '@/components/player/source-badge';
import { useReactions } from '@/hooks/use-reactions';
import { ReactionOverlay } from '@/components/reactions/reaction-overlay';
import { ReactionPicker } from '@/components/reactions/reaction-picker';

// ── Empty State ───────────────────────────────────────────────────────────────

function PlayerEmptyState({
  canControl,
  onAddVideo,
}: {
  canControl: boolean;
  onAddVideo: () => void;
}) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl bg-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted ring-2 ring-border">
        <svg
          className="h-8 w-8 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.901L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">No video loaded</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {canControl
            ? 'Add a YouTube link, MP4, or HLS stream to get started.'
            : 'Waiting for the host to load a video…'}
        </p>
      </div>
      {canControl && (
        <button
          type="button"
          onClick={onAddVideo}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Video
        </button>
      )}
    </div>
  );
}

// ── MediaPlayer ───────────────────────────────────────────────────────────────

interface MediaPlayerProps {
  slug: string;
  roomId: string;
  hostId: string;
  permissionMode: PermissionMode;
  /** Initial media from DB (rooms.current_media) — may be empty object */
  initialMedia?: CurrentMedia | Record<string, never>;
  className?: string;
}

export function MediaPlayer({
  slug,
  roomId,
  hostId,
  permissionMode,
  initialMedia,
  className,
}: MediaPlayerProps) {
  // ── Player hook (all state + logic) ────────────────────────────────────────
  const {
    playerState,
    currentMedia,
    canControl,
    adapterRef,
    setCurrentMedia,
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    handleMuteToggle,
    handlePlaybackRateChange,
    handleMediaChange,
    onAdapterReady,
    onAdapterTimeUpdate,
    onAdapterBuffering,
    onAdapterEnded,
    onAdapterError,
  } = usePlayer({ slug, roomId, hostId, permissionMode });

  // ── Adapter refs per type ────────────────────────────────────────────────
  const ytRef = useRef<YouTubePlayerHandle>(null);
  const h5Ref = useRef<HTML5PlayerHandle>(null);

  // Keep the shared adapterRef pointing to the active adapter.
  // Sync on every render so the Play button always has the latest adapter.
  if (currentMedia?.sourceType === 'youtube') {
    adapterRef.current = ytRef.current as PlayerAdapter | null;
  } else {
    adapterRef.current = h5Ref.current as PlayerAdapter | null;
  }

  // ── Initialize from DB state on mount ───────────────────────────────────
  useEffect(() => {
    if (initialMedia && 'url' in initialMedia && initialMedia.url) {
      const parsed = parseMediaUrl(initialMedia.url);
      if (parsed) {
        setCurrentMedia({
          url: parsed.canonicalUrl,
          title: initialMedia.title || parsed.titleGuess,
          sourceType: parsed.sourceType,
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fullscreen & PiP ─────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  }, []);

  const handleTogglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const videoEl = containerRef.current?.querySelector('video');
        if (videoEl && document.pictureInPictureEnabled) {
          await videoEl.requestPictureInPicture();
        }
      }
    } catch {
      /* ignore PiP errors */
    }
  }, []);

  // ── Keyboard Shortcuts (Space, Left, Right, Shift+Left/Right, M, F) ──────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 5;
        handleSeek(Math.max(0, playerState.position - delta));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 5;
        handleSeek(Math.min(playerState.duration, playerState.position + delta));
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleMuteToggle();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleSeek, handleMuteToggle, handleFullscreen, playerState.position, playerState.duration]);

  // ── Double-Tap Gestures (-5s / +5s) ──────────────────────────────────────
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const [gestureFeedback, setGestureFeedback] = useState<'rewind' | 'forward' | null>(null);

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;

    if (now - lastTapRef.current.time < 300) {
      if (isRightSide) {
        handleSeek(Math.min(playerState.duration, playerState.position + 5));
        setGestureFeedback('forward');
      } else {
        handleSeek(Math.max(0, playerState.position - 5));
        setGestureFeedback('rewind');
      }
      setTimeout(() => setGestureFeedback(null), 650);
    } else {
      resetHideTimer();
    }
    lastTapRef.current = { time: now, x: clickX };
  };

  // ── Controls visibility (auto-hide) ──────────────────────────────────────
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      if (playerState.isPlaying) setShowControls(false);
    }, 3000);
  }, [playerState.isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); };
  }, [playerState.isPlaying, resetHideTimer]);

  // ── URL input modal ───────────────────────────────────────────────────────
  const [mediaInputOpen, setMediaInputOpen] = useState(false);

  // ── Error state ───────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const handleError = useCallback(
    (msg: string) => {
      setError(msg);
      onAdapterError(msg);
    },
    [onAdapterError]
  );

  const handleRetry = () => {
    setError(null);
    setRetryKey((k) => k + 1);
  };

  // ── Extract YouTube ID ────────────────────────────────────────────────────
  const youtubeId =
    currentMedia?.sourceType === 'youtube'
      ? currentMedia.url.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] ?? null
      : null;

  // ── Reaction particles ───────────────────────────────────────────────────
  const { particles, triggerReaction } = useReactions(slug);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('relative flex w-full flex-col overflow-hidden rounded-xl bg-black', className)}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
        aria-label="Watch party media player"
        role="region"
      >
        {/* Floating Emoji Reactions Overlay */}
        <ReactionOverlay particles={particles} />

        {/* Double-tap ripple gesture overlay */}
        {gestureFeedback === 'rewind' && (
          <div className="absolute inset-y-0 left-0 w-1/2 z-30 flex items-center justify-center bg-white/10 backdrop-blur-xs animate-in fade-in zoom-in duration-200 pointer-events-none rounded-l-xl">
            <div className="flex flex-col items-center gap-1 text-white font-bold text-lg drop-shadow-md">
              <span className="text-3xl">⏪</span>
              <span>-5 seconds</span>
            </div>
          </div>
        )}
        {gestureFeedback === 'forward' && (
          <div className="absolute inset-y-0 right-0 w-1/2 z-30 flex items-center justify-center bg-white/10 backdrop-blur-xs animate-in fade-in zoom-in duration-200 pointer-events-none rounded-r-xl">
            <div className="flex flex-col items-center gap-1 text-white font-bold text-lg drop-shadow-md">
              <span className="text-3xl">⏩</span>
              <span>+5 seconds</span>
            </div>
          </div>
        )}

        {/* ── Top bar — source badge + add video button ─────────────────── */}
        {(currentMedia || canControl) && (
          <div
            className={cn(
              'absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 transition-opacity duration-300',
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {currentMedia && (
              <SourceBadge sourceType={currentMedia.sourceType} />
            )}
            {canControl && (
              <button
                type="button"
                onClick={() => setMediaInputOpen(true)}
                aria-label="Change video"
                className="ml-auto flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {currentMedia ? 'Change Video' : 'Add Video'}
              </button>
            )}
          </div>
        )}

        {/* ── Player area ───────────────────────────────────────────────── */}
        <div className="aspect-video w-full cursor-pointer" onClick={handleViewportClick}>
          {/* Error */}
          {error && <PlayerError message={error} onRetry={handleRetry} />}

          {/* Empty */}
          {!error && !currentMedia && (
            <PlayerEmptyState
              canControl={canControl}
              onAddVideo={() => setMediaInputOpen(true)}
            />
          )}

          {/* YouTube */}
          {!error && currentMedia?.sourceType === 'youtube' && youtubeId && (
            <YouTubePlayer
              key={`yt-${youtubeId}-${retryKey}`}
              ref={ytRef}
              videoId={youtubeId}
              onReady={onAdapterReady}
              onTimeUpdate={onAdapterTimeUpdate}
              onBuffering={onAdapterBuffering}
              onEnded={onAdapterEnded}
              onError={handleError}
            />
          )}

          {/* HTML5 (MP4 / HLS / local) */}
          {!error && currentMedia && currentMedia.sourceType !== 'youtube' && (
            <HTML5Player
              key="h5-player-adapter"
              ref={h5Ref}
              url={currentMedia.url}
              sourceType={currentMedia.sourceType}
              onReady={onAdapterReady}
              onTimeUpdate={onAdapterTimeUpdate}
              onBuffering={onAdapterBuffering}
              onEnded={onAdapterEnded}
              onError={handleError}
            />
          )}

          {/* Buffering overlay */}
          {!error && currentMedia && playerState.isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40" aria-hidden="true">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}

          {/* Floating Draggable Video Grid Overlay (Visible in Fullscreen Mode) */}
          {isFullscreen && <DraggableVideoOverlay slug={slug} />}
        </div>

        {/* ── Controls overlay ──────────────────────────────────────────── */}
        {currentMedia && !error && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300',
              showControls || !playerState.isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <div className="flex justify-end px-4 pb-2">
              <ReactionPicker onReact={triggerReaction} />
            </div>
            <PlayerControls
              state={playerState}
              canControl={canControl}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
              onPlaybackRateChange={handlePlaybackRateChange}
              onFullscreen={handleFullscreen}
              onTogglePiP={handleTogglePiP}
              title={currentMedia.title}
            />
          </div>
        )}
      </div>

      {/* Media URL Input Modal */}
      <MediaUrlInput
        isOpen={mediaInputOpen}
        onClose={() => setMediaInputOpen(false)}
        onSubmit={handleMediaChange}
        canControl={canControl}
      />
    </>
  );
}

// ── Local file upload wrapper ─────────────────────────────────────────────────
// Converts a File to an object URL so HTML5Player can consume it.

interface LocalFilePlayerProps {
  file: File;
  onMediaSource: (source: MediaSource) => void;
}

export function LocalFilePlayer({ file, onMediaSource }: LocalFilePlayerProps) {
  useEffect(() => {
    const url = URL.createObjectURL(file);
    onMediaSource({ url, title: file.name, sourceType: 'local' });
    return () => URL.revokeObjectURL(url);
  }, [file, onMediaSource]);

  return null;
}
