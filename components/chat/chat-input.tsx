'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (content: string) => Promise<unknown>;
  onTyping: () => void;
  disabled?: boolean;
  isSending?: boolean;
}

const EMOJI_PRESETS = ['🍿', '❤️', '🔥', '😂', '👏', '🎬', '🎉', '😱'];

export function ChatInput({
  onSend,
  onTyping,
  disabled = false,
  isSending = false,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setContent('');
    setShowEmojis(false);
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else {
      onTyping();
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-2 border-t border-border bg-card p-3"
    >
      {/* Emoji picker popup */}
      {showEmojis && (
        <div
          role="dialog"
          aria-label="Emoji picker"
          className="absolute bottom-14 left-3 z-10 flex gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg animate-in slide-in-from-bottom-2 duration-150"
        >
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded text-base hover:bg-muted focus-visible:outline-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Emoji toggle */}
        <button
          type="button"
          onClick={() => setShowEmojis((v) => !v)}
          aria-label="Insert emoji"
          disabled={disabled}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          😊
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Sign in to chat…' : 'Send a message…'}
          maxLength={1000}
          disabled={disabled}
          autoComplete="off"
          className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40"
        />

        {/* Send Button */}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || !content.trim() || isSending}
          isLoading={isSending}
          aria-label="Send message"
          className="flex-shrink-0"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </Button>
      </div>

      {/* Character Counter */}
      {content.length > 800 && (
        <span className="self-end text-[10px] text-muted-foreground">
          {content.length}/1000
        </span>
      )}
    </form>
  );
}
