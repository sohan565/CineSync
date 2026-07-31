import React from 'react';
import { TypingUser } from '@/types/chat';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.displayName);
  const text =
    names.length === 1
      ? `${names[0]} is typing…`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing…`
      : `${names[0]} and ${names.length - 1} others are typing…`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground animate-in fade-in duration-150"
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
      </div>
      <span className="truncate">{text}</span>
    </div>
  );
}
