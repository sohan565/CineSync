import { ReactionEventPayload } from '@/types/reaction';
import { channelManager } from '@/lib/supabase/channel-manager';

export class ReactionService {
  // ── Broadcast Reaction ──────────────────────────────────────────────────────

  static broadcastReaction(slug: string, payload: ReactionEventPayload): void {
    channelManager.broadcast(`room:${slug}`, 'REACTION', payload);
  }

  // ── Subscribe to Reactions ──────────────────────────────────────────────────

  static subscribeToReactions(
    slug: string,
    onReaction: (payload: ReactionEventPayload) => void
  ) {
    const topic = `room:${slug}`;
    const channel = channelManager.getOrCreateChannel(topic);

    channel
      .on('broadcast', { event: 'REACTION' }, ({ payload }) => {
        onReaction(payload as ReactionEventPayload);
      })
      .subscribe();

    return () => {
      channelManager.removeChannel(topic);
    };
  }
}
