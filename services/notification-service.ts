import { createClient } from '@/lib/supabase/client';
import { ActivityNotification, ChimeSoundType } from '@/types/notification';
import { channelManager } from '@/lib/supabase/channel-manager';

export class NotificationService {
  private static audioCtx: AudioContext | null = null;

  private static get supabase() {
    return createClient();
  }

  /**
   * Synthesize audio chime using native Web Audio API (zero external asset files needed).
   */
  static playChime(type: ChimeSoundType = 'chat'): void {
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioCtx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => null);
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';

      const now = this.audioCtx.currentTime;

      // Frequencies for different events
      if (type === 'chat') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      } else if (type === 'join') {
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      } else if (type === 'leave') {
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15); // A4
      } else if (type === 'media') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      }

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore Web Audio API initialization restriction if not user-interacted
    }
  }

  // ── Broadcast Activity Notification ────────────────────────────────────────

  static broadcastActivity(slug: string, notification: ActivityNotification): void {
    channelManager.broadcast(`room:${slug}:activity`, 'ACTIVITY', notification);
  }

  // ── Subscribe to Activity Notifications ─────────────────────────────────────

  static subscribeToActivity(
    slug: string,
    onNotification: (n: ActivityNotification) => void
  ) {
    const topic = `room:${slug}:activity`;
    const channel = channelManager.getOrCreateChannel(topic);

    channel
      .on('broadcast', { event: 'ACTIVITY' }, ({ payload }) => {
        onNotification(payload as ActivityNotification);
      })
      .subscribe();

    return () => {
      channelManager.removeChannel(topic);
    };
  }
}
