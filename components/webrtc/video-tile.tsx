'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  avatarUrl?: string | null;
  isMicOn?: boolean;
  isCamOn?: boolean;
  isSpeaking?: boolean;
  isLocal?: boolean;
  className?: string;
}

export function VideoTile({
  stream,
  displayName,
  avatarUrl,
  isMicOn = true,
  isCamOn = true,
  isSpeaking = false,
  isLocal = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && isCamOn) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => null);
    }
  }, [stream, isCamOn]);

  const initial = displayName.charAt(0).toUpperCase();
  const hue = displayName
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div
      className={cn(
        'relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-card border border-border transition-all',
        isSpeaking ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20' : '',
        className
      )}
      aria-label={`${displayName}'s video tile`}
    >
      {/* Video Element */}
      {isCamOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local stream to prevent echo feedback
          className={cn('h-full w-full object-cover', isLocal ? '-scale-x-100' : '')}
        />
      ) : (
        /* Camera Off Avatar Fallback */
        <div className="flex flex-col items-center gap-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold ring-2 ring-border"
              style={{
                background: `hsl(${hue} 60% 25%)`,
                color: `hsl(${hue} 80% 80%)`,
              }}
              aria-hidden="true"
            >
              {initial}
            </div>
          )}
        </div>
      )}

      {/* Name tag and indicators */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
        <span className="truncate rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
          {displayName} {isLocal && '(You)'}
        </span>

        <div className="flex items-center gap-1">
          {!isMicOn && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-[10px] text-white"
              title="Microphone muted"
              aria-label="Microphone muted"
            >
              🔇
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
