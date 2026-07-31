'use client';

import React from 'react';
import { MediaStreamState } from '@/types/webrtc';
import { cn } from '@/lib/utils';

interface MediaControlsProps {
  mediaState: MediaStreamState;
  onToggleMic: () => void;
  onToggleCam: () => void;
  className?: string;
}

export function MediaControls({
  mediaState,
  onToggleMic,
  onToggleCam,
  className,
}: MediaControlsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Voice and video controls"
      className={cn(
        'flex items-center justify-center gap-3 rounded-full border border-border/80 bg-card/90 px-4 py-2 backdrop-blur-md shadow-xl',
        className
      )}
    >
      {/* Microphone toggle */}
      <button
        type="button"
        onClick={onToggleMic}
        aria-label={mediaState.isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
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
          'flex h-10 w-10 items-center justify-center rounded-full text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
          mediaState.isCamOn
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-red-500/20 text-red-400 border border-red-500/40'
        )}
        title={mediaState.isCamOn ? 'Turn off Camera' : 'Turn on Camera'}
      >
        {mediaState.isCamOn ? '📹' : '📹❌'}
      </button>
    </div>
  );
}
