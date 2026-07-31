'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useAppStore } from '@/hooks/use-store';
import { ChatMessageItem } from '@/components/chat/chat-message-item';
import { PinnedMessageBanner } from '@/components/chat/pinned-message-banner';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { ChatInput } from '@/components/chat/chat-input';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  roomId: string;
  slug: string;
  hostId: string;
  className?: string;
}

export function ChatPanel({ roomId, slug, hostId, className }: ChatPanelProps) {
  const user = useAppStore((s) => s.user);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    pinnedMessage,
    typingUsers,
    isLoading,
    error,
    sendMessage,
    isSending,
    handleTyping,
    handleTogglePin,
    handleDeleteMessage,
  } = useChat(roomId, slug);

  const isHost = user?.id === hostId;

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card',
        className
      )}
      aria-label="Room live chat"
      role="region"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live Chat
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Pinned Message */}
      <PinnedMessageBanner
        message={pinnedMessage}
        canPin={isHost}
        onUnpin={handleTogglePin}
      />

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-2"
        aria-label="Chat messages history"
      >
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4 animate-pulse">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-red-400">
            Failed to load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <span className="text-2xl" aria-hidden="true">💬</span>
            <p className="text-xs font-medium">No messages yet.</p>
            <p className="text-[11px] text-muted-foreground/70">
              Say hello to everyone in the room!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              currentUserId={user?.id}
              isHost={isHost}
              onTogglePin={handleTogglePin}
              onDelete={handleDeleteMessage}
            />
          ))
        )}
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onTyping={handleTyping}
        disabled={!user}
        isSending={isSending}
      />
    </div>
  );
}
