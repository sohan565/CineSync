'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player/sync-engine';
import { PlayerState } from '@/types/player';

// ── Sub-components ────────────────────────────────────────────────────────────

// Seek bar
interface SeekBarProps {
  position: number;
  duration: number;
  disabled: boolean;
  onSeek: (seconds: number) => void;
}

function SeekBar({ position, duration, disabled, onSeek }: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  const getPercent = (clientX: number): number => {
    const el = trackRef.current;
    if (!el || duration <= 0) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || duration <= 0) return;
      onSeek(getPercent(e.clientX) * duration);
    },
    [disabled, duration, onSeek] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoverPercent(getPercent(e.clientX));
  };

  const handleMouseLeave = () => setHoverPercent(null);

  const fillPercent = duration > 0 ? (position / duration) * 100 : 0;
  const thumbPercent = hoverPercent !== null ? hoverPercent * 100 : fillPercent;

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Seek"
      aria-valuenow={Math.floor(position)}
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'group relative flex h-1 w-full cursor-pointer items-center rounded-full bg-muted/60 transition-all hover:h-2',
        disabled && 'cursor-not-allowed opacity-40',
        isDragging && 'h-2'
      )}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => !disabled && setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'ArrowRight') onSeek(Math.min(duration, position + 5));
        if (e.key === 'ArrowLeft') onSeek(Math.max(0, position - 5));
      }}
    >
      {/* Fill */}
      <div
        className="absolute left-0 h-full rounded-full bg-emerald-500 transition-none"
        style={{ width: `${fillPercent}%` }}
        aria-hidden="true"
      />
      {/* Thumb */}
      <div
        className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-md opacity-0 transition-opacity group-hover:opacity-100"
        style={{ left: `${thumbPercent}%` }}
        aria-hidden="true"
      />
      {/* Hover time tooltip */}
      {hoverPercent !== null && duration > 0 && (
        <div
          className="absolute -top-8 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow"
          style={{ left: `${hoverPercent * 100}%` }}
          aria-hidden="true"
        >
          {formatTime(hoverPercent * duration)}
        </div>
      )}
    </div>
  );
}

// Volume slider
interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
}

function VolumeControl({ volume, isMuted, onVolumeChange, onMuteToggle }: VolumeControlProps) {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div
      className="relative flex items-center gap-1"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        type="button"
        onClick={onMuteToggle}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {isMuted || volume === 0 ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : volume < 0.5 ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {showSlider && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          className="w-20 accent-emerald-500"
        />
      )}
    </div>
  );
}

// ── Main PlayerControls ───────────────────────────────────────────────────────

interface PlayerControlsProps {
  state: PlayerState;
  canControl: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreen?: () => void;
  title?: string;
  className?: string;
}

export function PlayerControls({
  state,
  canControl,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreen,
  title,
  className,
}: PlayerControlsProps) {
  const { isPlaying, position, duration, volume, isMuted, isBuffering } = state;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-b-xl bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-3 pt-8',
        className
      )}
    >
      {/* Title */}
      {title && (
        <p className="truncate text-xs font-semibold text-white/80" aria-label={`Now playing: ${title}`}>
          {title}
        </p>
      )}

      {/* Seek bar */}
      <SeekBar
        position={position}
        duration={duration}
        disabled={!canControl || duration <= 0}
        onSeek={onSeek}
      />

      {/* Control row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: play/pause + time */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!canControl || isBuffering}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {isBuffering ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            ) : isPlaying ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="h-4 w-4 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Time display */}
          <span className="tabular-nums text-xs text-white/70" aria-live="off">
            {formatTime(position)}
            {duration > 0 && <> / {formatTime(duration)}</>}
          </span>
        </div>

        {/* Right: volume + fullscreen */}
        <div className="flex items-center gap-1">
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
          />

          {!canControl && (
            <span
              className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60"
              aria-label="You are in view-only mode"
              title="Only the host can control playback"
            >
              👁 View only
            </span>
          )}

          {onFullscreen && (
            <button
              type="button"
              onClick={onFullscreen}
              aria-label="Toggle fullscreen"
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
