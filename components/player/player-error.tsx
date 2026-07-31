import React from 'react';
import { Button } from '@/components/ui/button';

interface PlayerErrorProps {
  message: string;
  onRetry?: () => void;
}

export function PlayerError({ message, onRetry }: PlayerErrorProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
        <svg
          className="h-6 w-6 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-red-400">Playback Error</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
