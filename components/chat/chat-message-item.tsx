import React from 'react';
import { ChatMessage } from '@/types/chat';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  isHost?: boolean;
  onTogglePin?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
}

export function ChatMessageItem({
  message,
  currentUserId,
  isHost = false,
  onTogglePin,
  onDelete,
}: ChatMessageItemProps) {
  const isOwn = message.userId === currentUserId;
  const canDelete = isOwn || isHost;

  // System notification bubble
  if (message.isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted/50 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  const timeStr = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const initial = message.senderName.charAt(0).toUpperCase();
  const hue =
    message.userId
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-2 transition hover:bg-muted/20',
        message.isPinned && 'bg-emerald-500/5'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.senderAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.senderAvatar}
            alt={`${message.senderName}'s avatar`}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 ring-border"
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

      {/* Message Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-bold text-foreground">
            {message.senderName}
          </span>

          {message.senderRole === 'host' && (
            <Badge variant="success" className="px-1.5 py-0 text-[9px]">
              Host
            </Badge>
          )}

          {message.senderRole === 'cohost' && (
            <Badge variant="info" className="px-1.5 py-0 text-[9px]">
              Co-host
            </Badge>
          )}

          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        </div>

        <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90">
          {message.content}
        </p>
      </div>

      {/* Action triggers (shown on hover/focus) */}
      <div className="absolute right-3 top-2 hidden items-center gap-1 group-hover:flex focus-within:flex">
        {isHost && onTogglePin && (
          <button
            type="button"
            onClick={() => onTogglePin(message)}
            aria-label={message.isPinned ? 'Unpin message' : 'Pin message'}
            className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground hover:text-foreground"
            title={message.isPinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
        )}

        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            aria-label="Delete message"
            className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground hover:text-red-400"
            title="Delete"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
