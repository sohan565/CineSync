import React from 'react';
import { ChatMessage } from '@/types/chat';

interface PinnedMessageBannerProps {
  message: ChatMessage | null;
  onUnpin?: (message: ChatMessage) => void;
  canPin?: boolean;
}

export function PinnedMessageBanner({
  message,
  onUnpin,
  canPin = false,
}: PinnedMessageBannerProps) {
  if (!message) return null;

  return (
    <div
      role="region"
      aria-label="Pinned message"
      className="flex items-center justify-between gap-3 border-b border-border bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 text-emerald-400" aria-hidden="true">
          📌
        </span>
        <div className="min-w-0 truncate">
          <span className="font-semibold text-emerald-200">
            {message.senderName}:{' '}
          </span>
          <span className="text-emerald-300/90">{message.content}</span>
        </div>
      </div>

      {canPin && onUnpin && (
        <button
          type="button"
          onClick={() => onUnpin(message)}
          aria-label="Unpin message"
          className="flex-shrink-0 text-emerald-400 hover:text-emerald-200 focus-visible:outline-none"
        >
          ✕
        </button>
      )}
    </div>
  );
}
