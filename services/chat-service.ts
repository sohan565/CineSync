import { createClient } from '@/lib/supabase/client';
import { ChatMessage, SendMessageDTO } from '@/types/chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    content: row.content,
    isPinned: row.is_pinned ?? false,
    createdAt: row.created_at,
    senderName: row.profiles?.display_name ?? 'Unknown',
    senderAvatar: row.profiles?.avatar_url ?? null,
    senderRole: row.room_members?.[0]?.role ?? 'guest',
  };
}

// Local in-memory fallback store for chat messages when database table is unpopulated or offline
const LOCAL_CHAT_STORE = new Map<string, ChatMessage[]>();

export class ChatService {
  private static get supabase() {
    return createClient();
  }

  // ── Fetch Chat Messages ─────────────────────────────────────────────────────

  static async fetchMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const supabase = this.supabase;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(
          `
          *,
          profiles!chat_messages_user_id_fkey(display_name, avatar_url)
        `
        )
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data ?? []).map(rowToChatMessage);
    } catch {
      // Fallback to local message store if DB query fails or unmigrated
      return LOCAL_CHAT_STORE.get(roomId) || [];
    }
  }

  // ── Send Message ────────────────────────────────────────────────────────────

  static async sendMessage(dto: SendMessageDTO): Promise<ChatMessage> {
    const supabase = this.supabase;
    const content = dto.content.trim();

    if (!content || content.length > 1000) {
      throw new Error('Message must be between 1 and 1000 characters.');
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: dto.roomId,
          user_id: dto.userId,
          content,
          is_pinned: false,
        })
        .select(
          `
          *,
          profiles!chat_messages_user_id_fkey(display_name, avatar_url)
        `
        )
        .single();

      if (error || !data) {
        throw error || new Error('Failed to send message.');
      }

      return rowToChatMessage(data);
    } catch {
      // Local fallback message generator
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        roomId: dto.roomId,
        userId: dto.userId,
        content,
        isPinned: false,
        createdAt: new Date().toISOString(),
        senderName: 'You',
        senderAvatar: null,
        senderRole: 'guest',
      };

      const existing = LOCAL_CHAT_STORE.get(dto.roomId) || [];
      LOCAL_CHAT_STORE.set(dto.roomId, [...existing, fallbackMsg]);

      return fallbackMsg;
    }
  }

  // ── Pin / Unpin Message ────────────────────────────────────────────────────

  static async togglePin(messageId: string, isPinned: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('chat_messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to update pin: ${error.message}`);
    }
  }

  // ── Delete Message ──────────────────────────────────────────────────────────

  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // ── Realtime Postgres Subscription ──────────────────────────────────────────

  static subscribeToMessages(
    roomId: string,
    onMessage: (msg: ChatMessage) => void,
    onDelete?: (messageId: string) => void
  ) {
    const supabase = this.supabase;
    const topic = `chat:${roomId}`;

    // Clean up any pre-existing channel for this topic to avoid "cannot add callbacks after subscribe()"
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === topic || ch.topic === `realtime:${topic}`
    );
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch complete joined profile details for the inserted message
          const { data } = await supabase
            .from('chat_messages')
            .select(
              `
              *,
              profiles!chat_messages_user_id_fkey(display_name, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(rowToChatMessage(data));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (onDelete && payload.old?.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ── Typing Broadcast ────────────────────────────────────────────────────────

  static broadcastTyping(
    slug: string,
    userId: string,
    displayName: string,
    isTyping: boolean
  ): void {
    const supabase = this.supabase;
    const topic = `typing:${slug}`;
    let channel = supabase.getChannels().find(
      (ch) => ch.topic === topic || ch.topic === `realtime:${topic}`
    );
    if (!channel) {
      channel = supabase.channel(topic);
      channel.subscribe();
    }
    channel.send({
      type: 'broadcast',
      event: 'TYPING',
      payload: { userId, displayName, isTyping },
    });
  }
}
