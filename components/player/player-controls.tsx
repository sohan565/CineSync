'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player/sync-engine';
import { PlayerState } from '@/types/player';

// ── Seek Bar Component ────────────────────────────────────────────────────────

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

  const getPercent = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    },
    [duration]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || duration <= 0) return;
      onSeek(getPercent(e.clientX) * duration);
    },
    [disabled, duration, getPercent, onSeek]
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
      aria-label="Seek progress bar"
      aria-valuenow={Math.floor(position)}
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'group relative flex h-1.5 w-full cursor-pointer items-center rounded-full bg-white/20 transition-all hover:h-2.5',
        disabled && 'cursor-not-allowed opacity-40',
        isDragging && 'h-2.5'
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
      {/* Played progress fill */}
      <div
        className="absolute left-0 h-full rounded-full bg-emerald-500 transition-none"
        style={{ width: `${fillPercent}%` }}
        aria-hidden="true"
      />
      {/* Thumb handle */}
      <div
        className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-md transition-opacity group-hover:scale-125 group-hover:opacity-100"
        style={{ left: `${thumbPercent}%` }}
        aria-hidden="true"
      />
      {/* Hover timestamp tooltip */}
      {hoverPercent !== null && duration > 0 && (
        <div
          className="absolute -top-8 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow backdrop-blur-md border border-white/10"
          style={{ left: `${hoverPercent * 100}%` }}
          aria-hidden="true"
        >
          {formatTime(hoverPercent * duration)}
        </div>
      )}
    </div>
  );
}

// ── Volume Control Component ──────────────────────────────────────────────────

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
        aria-label={isMuted ? 'Unmute (m)' : 'Mute (m)'}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        {isMuted || volume === 0 ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : volume < 0.5 ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          aria-label="Volume slider"
          className="w-20 accent-emerald-500 cursor-pointer"
        />
      )}
    </div>
  );
}

// ── Main YouTube-Style PlayerControls ─────────────────────────────────────────

interface PlayerControlsProps {
  state: PlayerState;
  canControl: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange?: (rate: number) => void;
  onFullscreen?: () => void;
  onTogglePiP?: () => void;
  onToggleTheater?: () => void;
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
  onPlaybackRateChange,
  onFullscreen,
  onTogglePiP,
  onToggleTheater,
  title,
  className,
}: PlayerControlsProps) {
  const { isPlaying, position, duration, volume, isMuted, isBuffering, playbackRate } = state;
  const [showSettings, setShowSettings] = useState(false);

  const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const handleRewind5 = () => {
    onSeek(Math.max(0, position - 5));
  };

  const handleForward5 = () => {
    onSeek(Math.min(duration, position + 5));
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-b-xl bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-3 pt-8 backdrop-blur-[2px]',
        className
      )}
    >
      {/* Title */}
      {title && (
        <p className="truncate text-xs font-semibold text-white/90 drop-shadow-sm" aria-label={`Now playing: ${title}`}>
          {title}
        </p>
      )}

      {/* Seek progress bar */}
      <SeekBar
        position={position}
        duration={duration}
        disabled={!canControl || duration <= 0}
        onSeek={onSeek}
      />

      {/* Control buttons row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Left: Play/Pause, Rewind -5s, Forward +5s, Time */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!canControl || isBuffering}
            aria-label={isPlaying ? 'Pause (space)' : 'Play (space)'}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {isBuffering ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            ) : isPlaying ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="h-5 w-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* ⏪ Rewind 5s */}
          <button
            type="button"
            onClick={handleRewind5}
            disabled={!canControl || duration <= 0}
            aria-label="Rewind 5 seconds"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title="Rewind 5s (Left Arrow)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 19 2 12 11 5 11 19" />
              <polygon points="22 19 13 12 22 5 22 19" />
            </svg>
          </button>

          {/* ⏩ Forward 5s */}
          <button
            type="button"
            onClick={handleForward5}
            disabled={!canControl || duration <= 0}
            aria-label="Forward 5 seconds"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title="Forward 5s (Right Arrow)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 19 22 12 13 5 13 19" />
              <polygon points="2 19 11 12 2 5 2 19" />
            </svg>
          </button>

          {/* Time display */}
          <span className="tabular-nums text-xs font-medium text-white/80 ml-1">
            {formatTime(position)}
            {duration > 0 && <span className="text-white/40"> / {formatTime(duration)}</span>}
          </span>
        </div>

        {/* Right: Volume, Speed Selector, Settings, Theater, PiP, Fullscreen */}
        <div className="relative flex items-center gap-1">
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
          />

          {/* Speed / Settings Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              aria-label="Playback Settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Settings & Speed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Settings Popover */}
            {showSettings && (
              <div className="absolute right-0 bottom-12 z-50 flex w-44 flex-col gap-1 rounded-xl border border-white/10 bg-black/90 p-2 text-xs text-white shadow-2xl backdrop-blur-xl">
                <p className="px-2 py-1 font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Playback Speed</p>
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      onPlaybackRateChange?.(rate);
                      setShowSettings(false);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2.5 py-1.5 transition text-left',
                      (playbackRate || 1) === rate
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <span>{rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}</span>
                    {(playbackRate || 1) === rate && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Picture-in-Picture Button */}
          {onTogglePiP && (
            <button
              type="button"
              onClick={onTogglePiP}
              aria-label="Picture in Picture"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Picture-in-Picture"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <rect x="13" y="10" width="7" height="5" rx="1" ry="1" />
              </svg>
            </button>
          )}

          {/* Theater Mode Button */}
          {onToggleTheater && (
            <button
              type="button"
              onClick={onToggleTheater}
              aria-label="Theater mode"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Theater Mode"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
              </svg>
            </button>
          )}

          {/* Fullscreen Button */}
          {onFullscreen && (
            <button
              type="button"
              onClick={onFullscreen}
              aria-label="Toggle Fullscreen (f)"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Fullscreen (f)"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
