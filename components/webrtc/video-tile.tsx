'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  const [hasLiveVideoTrack, setHasLiveVideoTrack] = useState<boolean>(false);

  useEffect(() => {
    const videoNode = videoRef.current;
    if (!stream) {
      setHasLiveVideoTrack(false);
      return;
    }

    const playAndSyncVideo = () => {
      const vTracks = stream.getVideoTracks();
      const hasTrack = vTracks.some((t) => t.enabled && t.readyState === 'live');
      setHasLiveVideoTrack(hasTrack);

      if (videoNode && isCamOn && hasTrack) {
        if (videoNode.srcObject !== stream) {
          videoNode.srcObject = stream;
        }
        videoNode.play().catch(() => null);
      }
    };

    playAndSyncVideo();

    // ── Re-bind and re-play on Fullscreen, Visibility, or Track Changes ──────
    const handleLayoutOrStateChange = () => {
      playAndSyncVideo();
    };

    document.addEventListener('fullscreenchange', handleLayoutOrStateChange);
    document.addEventListener('webkitfullscreenchange', handleLayoutOrStateChange);
    document.addEventListener('mozfullscreenchange', handleLayoutOrStateChange);
    document.addEventListener('visibilitychange', handleLayoutOrStateChange);
    stream.addEventListener('addtrack', handleLayoutOrStateChange);
    stream.addEventListener('removetrack', handleLayoutOrStateChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleLayoutOrStateChange);
      document.removeEventListener('webkitfullscreenchange', handleLayoutOrStateChange);
      document.removeEventListener('mozfullscreenchange', handleLayoutOrStateChange);
      document.removeEventListener('visibilitychange', handleLayoutOrStateChange);
      stream.removeEventListener('addtrack', handleLayoutOrStateChange);
      stream.removeEventListener('removetrack', handleLayoutOrStateChange);
    };
  }, [stream, isCamOn]);

  const initial = (displayName || 'P').charAt(0).toUpperCase();
  const hue = (displayName || 'Peer')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  const showVideo = isCamOn && (isLocal ? Boolean(stream?.getVideoTracks().length) : hasLiveVideoTrack);

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
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local stream to prevent audio feedback loop
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

      {/* Footer Info Overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <span className="truncate max-w-[120px] rounded bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
          {displayName} {isLocal ? '(You)' : ''}
        </span>

        {!isMicOn && (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-[10px] text-white shadow-sm"
            title="Muted"
          >
            🔇
          </span>
        )}
      </div>
    </div>
  );
}
