import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

class RealtimeChannelManager {
  private channels = new Map<string, RealtimeChannel>();

  /**
   * Get an existing channel or create and subscribe to a new one.
   */
  getOrCreateChannel(topic: string): RealtimeChannel {
    let channel = this.channels.get(topic);
    if (!channel) {
      const supabase = createClient();
      const existing = supabase.getChannels().find(
        (ch) => ch.topic === topic || ch.topic === `realtime:${topic}`
      );
      if (existing) {
        channel = existing;
      } else {
        channel = supabase.channel(topic);
      }
      this.channels.set(topic, channel);
    }
    return channel;
  }

  /**
   * Broadcast a payload on a channel, creating/subscribing if necessary.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcast(topic: string, event: string, payload: any): void {
    const channel = this.getOrCreateChannel(topic);
    channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Cleanly remove and destroy a channel.
   */
  removeChannel(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      const supabase = createClient();
      supabase.removeChannel(channel);
      this.channels.delete(topic);
    }
  }

  /**
   * Destroy all active channels (e.g. on user leave/signout).
   */
  removeAllChannels(): void {
    const supabase = createClient();
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const channelManager = new RealtimeChannelManager();
