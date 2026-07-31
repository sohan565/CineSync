'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChatService } from '@/services/chat-service';
import { useAppStore } from '@/hooks/use-store';
import { ChatMessage, SendMessageDTO } from '@/types/chat';
import { toast } from '@/hooks/use-toast';

export function useChat(roomId: string | null, slug: string | null) {
  const user = useAppStore((s) => s.user);
  const messages = useAppStore((s) => s.messages);
  const pinnedMessage = useAppStore((s) => s.pinnedMessage);
  const typingUsers = useAppStore((s) => s.typingUsers);
  const setMessages = useAppStore((s) => s.setMessages);
  const addMessage = useAppStore((s) => s.addMessage);
  const removeMessage = useAppStore((s) => s.removeMessage);
  const setPinnedMessage = useAppStore((s) => s.setPinnedMessage);
  const setTypingUser = useAppStore((s) => s.setTypingUser);
  const clearChat = useAppStore((s) => s.clearChat);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Query: Fetch past messages ──────────────────────────────────────────────

  const { isLoading, error } = useQuery<ChatMessage[], Error>({
    queryKey: ['chat', roomId],
    queryFn: async () => {
      const msgs = await ChatService.fetchMessages(roomId!);
      setMessages(msgs);
      return msgs;
    },
    enabled: Boolean(roomId),
    staleTime: 30_000,
  });

  // ── Realtime Subscription ───────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return;

    const cleanup = ChatService.subscribeToMessages(
      roomId,
      (newMsg) => {
        addMessage(newMsg);
      },
      (deletedId) => {
        removeMessage(deletedId);
      }
    );

    return () => {
      cleanup();
    };
  }, [roomId, addMessage, removeMessage]);

  // Clean up store on unmount
  useEffect(() => {
    return () => {
      clearChat();
    };
  }, [clearChat]);

  // ── Send Mutation ───────────────────────────────────────────────────────────

  const sendMutation = useMutation<ChatMessage, Error, string>({
    mutationFn: (content) => {
      if (!user) throw new Error('You must be signed in or guest to chat.');
      if (!roomId) throw new Error('No active room.');

      const dto: SendMessageDTO = {
        roomId,
        userId: user.id,
        content,
      };
      return ChatService.sendMessage(dto);
    },
    onSuccess: (newMsg) => {
      addMessage(newMsg);
      // Stop typing status on send
      if (slug && user) {
        ChatService.broadcastTyping(slug, user.id, user.displayName, false);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // ── Send Typing Indicator ───────────────────────────────────────────────────

  const handleTyping = useCallback(() => {
    if (!slug || !user) return;

    ChatService.broadcastTyping(slug, user.id, user.displayName, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      ChatService.broadcastTyping(slug, user.id, user.displayName, false);
    }, 2500);
  }, [slug, user]);

  // ── Pin / Unpin ─────────────────────────────────────────────────────────────

  const handleTogglePin = useCallback(
    async (message: ChatMessage) => {
      try {
        const nextPinned = !message.isPinned;
        await ChatService.togglePin(message.id, nextPinned);
        setPinnedMessage(nextPinned ? message : null);
        toast.success(nextPinned ? 'Message pinned!' : 'Message unpinned.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to pin message.';
        toast.error(msg);
      }
    },
    [setPinnedMessage]
  );

  // ── Delete Message ──────────────────────────────────────────────────────────

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await ChatService.deleteMessage(messageId);
        removeMessage(messageId);
        toast.success('Message deleted.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete message.';
        toast.error(msg);
      }
    },
    [removeMessage]
  );

  return {
    messages,
    pinnedMessage,
    typingUsers,
    isLoading,
    error,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    handleTyping,
    handleTogglePin,
    handleDeleteMessage,
  };
}
