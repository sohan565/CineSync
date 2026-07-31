'use client';

import React from 'react';
import { MediaStreamState } from '@/types/webrtc';
import { cn } from '@/lib/utils';

interface MediaControlsProps {
  mediaState: MediaStreamState;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare?: () => void;
  className?: string;
}

export function MediaControls({
  mediaState,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  className,
}: MediaControlsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Voice and video controls"
      className={cn(
        'flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 backdrop-blur-md shadow-xl',
        className
      )}
    >
      {/* Microphone toggle */}
      <button
        type="button"
        onClick={onToggleMic}
        aria-label={mediaState.isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
          mediaState.isMicOn
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-red-500/20 text-red-400 border border-red-500/40'
        )}
        title={mediaState.isMicOn ? 'Mute Mic' : 'Unmute Mic'}
      >
        {mediaState.isMicOn ? '🎙️' : '🎙️❌'}
      </button>

      {/* Camera toggle */}
      <button
        type="button"
        onClick={onToggleCam}
        aria-label={mediaState.isCamOn ? 'Turn off camera' : 'Turn on camera'}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
          mediaState.isCamOn
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-red-500/20 text-red-400 border border-red-500/40'
        )}
        title={mediaState.isCamOn ? 'Turn off Camera' : 'Turn on Camera'}
      >
        {mediaState.isCamOn ? '📹' : '📹❌'}
      </button>

      {/* Screen Share toggle */}
      {onToggleScreenShare && (
        <button
          type="button"
          onClick={onToggleScreenShare}
          aria-label={mediaState.isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
            mediaState.isScreenSharing
              ? 'bg-emerald-500 text-white font-bold animate-pulse'
              : 'bg-muted text-foreground hover:bg-muted/80'
          )}
          title={mediaState.isScreenSharing ? 'Stop Screen Share' : 'Share Screen / Window'}
        >
          🖥️
        </button>
      )}
    </div>
  );
}
