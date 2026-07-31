'use client';

import React from 'react';
import { DEFAULT_REACTION_EMOJIS, PresetEmoji } from '@/types/reaction';
import { cn } from '@/lib/utils';

interface ReactionPickerProps {
  onReact: (emoji: PresetEmoji) => void;
  disabled?: boolean;
  className?: string;
}

export function ReactionPicker({
  onReact,
  disabled = false,
  className,
}: ReactionPickerProps) {
  return (
    <div
      role="toolbar"
      aria-label="Emoji reactions"
      className={cn(
        'flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1.5 backdrop-blur-md shadow-lg',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {DEFAULT_REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          disabled={disabled}
          aria-label={`React with ${emoji}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-transform hover:scale-125 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
