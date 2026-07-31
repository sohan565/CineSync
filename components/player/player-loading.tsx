import React from 'react';

interface PlayerLoadingProps {
  message?: string;
}

export function PlayerLoading({ message = 'Loading video…' }: PlayerLoadingProps) {
  return (
    <div
      role="status"
      aria-label={message}
      aria-live="polite"
      className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl bg-card"
    >
      {/* Pulsing play icon */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/20" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card ring-2 ring-border">
          <svg
            className="h-5 w-5 animate-pulse text-muted-foreground"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {/* Shimmer bar */}
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-emerald-500/60" />
      </div>
    </div>
  );
}
