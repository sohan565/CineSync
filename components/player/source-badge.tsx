import React from 'react';
import { MediaSourceType } from '@/types/room';
import { SOURCE_LABELS } from '@/lib/player/url-parser';
import { cn } from '@/lib/utils';

const sourceStyles: Record<MediaSourceType, string> = {
  youtube: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  mp4:     'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  hls:     'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  local:   'bg-muted text-muted-foreground',
};

const sourceIcons: Record<MediaSourceType, string> = {
  youtube: '▶',
  mp4:     '🎬',
  hls:     '📡',
  local:   '💾',
};

interface SourceBadgeProps {
  sourceType: MediaSourceType;
  className?: string;
}

export function SourceBadge({ sourceType, className }: SourceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        sourceStyles[sourceType],
        className
      )}
      aria-label={`Source: ${SOURCE_LABELS[sourceType]}`}
    >
      <span aria-hidden="true">{sourceIcons[sourceType]}</span>
      {SOURCE_LABELS[sourceType]}
    </span>
  );
}
