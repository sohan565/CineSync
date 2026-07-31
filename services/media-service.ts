import { createClient } from '@/lib/supabase/client';
import { CurrentMedia } from '@/types/room';
import { PlayerSyncEvent, MediaSource } from '@/types/player';
import { channelManager } from '@/lib/supabase/channel-manager';

// ── MediaService ──────────────────────────────────────────────────────────────
// Handles persisting current_media to Supabase and broadcasting
// player sync events over the Realtime Broadcast channel.

export class MediaService {
  private static get supabase() {
    return createClient();
  }

  // ── Persist current media to rooms table ────────────────────────────────────

  static async setCurrentMedia(
    roomId: string,
    media: MediaSource,
    position = 0,
    isPlaying = false
  ): Promise<void> {
    const payload: CurrentMedia = {
      url: media.url,
      title: media.title,
      sourceType: media.sourceType,
      position,
      isPlaying,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('rooms')
      .update({
        current_media: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    if (error) {
      throw new Error(`Failed to update media: ${error.message}`);
    }
  }

  // ── Persist playback state changes ──────────────────────────────────────────

  static async updatePlaybackState(
    roomId: string,
    position: number,
    isPlaying: boolean
  ): Promise<void> {
    // Read-modify-write — only update position and isPlaying inside JSONB
    const { error } = await this.supabase.rpc('update_room_media_state', {
      p_room_id: roomId,
      p_position: position,
      p_is_playing: isPlaying,
      p_updated_at: new Date().toISOString(),
    });

    // Fallback: full update if RPC doesn't exist yet (no-migration environment)
    if (error) {
      const { data: room } = await this.supabase
        .from('rooms')
        .select('current_media')
        .eq('id', roomId)
        .single();

      if (room?.current_media && Object.keys(room.current_media).length > 0) {
        await this.supabase
          .from('rooms')
          .update({
            current_media: {
              ...room.current_media,
              position,
              isPlaying,
              updatedAt: new Date().toISOString(),
            },
          })
          .eq('id', roomId);
      }
    }
  }

  // ── Broadcast a sync event over Realtime channel ────────────────────────────
  // Channel is per-room: `room:{slug}`
  // ── Broadcast a sync event over Realtime channel ────────────────────────────

  static broadcastPlayerEvent(
    slug: string,
    event: PlayerSyncEvent
  ): void {
    channelManager.broadcast(`room:${slug}`, event.type, event);
  }

  // ── Subscribe to player sync events ────────────────────────────────────────

  static subscribeToPlayerEvents(
    slug: string,
    onEvent: (event: PlayerSyncEvent) => void
  ) {
    const topic = `room:${slug}`;
    const channel = channelManager.getOrCreateChannel(topic);

    channel
      .on('broadcast', { event: 'PLAYER_PLAY' }, ({ payload }) =>
        onEvent(payload as PlayerSyncEvent)
      )
      .on('broadcast', { event: 'PLAYER_PAUSE' }, ({ payload }) =>
        onEvent(payload as PlayerSyncEvent)
      )
      .on('broadcast', { event: 'PLAYER_SEEK' }, ({ payload }) =>
        onEvent(payload as PlayerSyncEvent)
      )
      .on('broadcast', { event: 'PLAYER_RATE' }, ({ payload }) =>
        onEvent(payload as PlayerSyncEvent)
      )
      .on('broadcast', { event: 'MEDIA_CHANGE' }, ({ payload }) =>
        onEvent(payload as PlayerSyncEvent)
      )
      .subscribe();

    return () => {
      channelManager.removeChannel(topic);
    };
  }
}
