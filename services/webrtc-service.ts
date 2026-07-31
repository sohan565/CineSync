import { WebRTCSignalPayload } from '@/types/webrtc';
import { channelManager } from '@/lib/supabase/channel-manager';

export class WebRTCService {
  // ── Send Signal (Offer / Answer / Candidate / State-Sync) ─────────────────────

  static sendSignal(slug: string, signal: WebRTCSignalPayload): void {
    channelManager.broadcast(`room:${slug}:webrtc`, 'SIGNAL', signal);
  }

  // ── Subscribe to WebRTC Signals ──────────────────────────────────────────────

  static subscribeToSignals(
    slug: string,
    currentUserId: string,
    onSignal: (signal: WebRTCSignalPayload) => void
  ) {
    const topic = `room:${slug}:webrtc`;
    const channel = channelManager.getOrCreateChannel(topic);

    channel
      .on('broadcast', { event: 'SIGNAL' }, ({ payload }) => {
        const signal = payload as WebRTCSignalPayload;
        if (signal.senderId !== currentUserId) {
          if (!signal.targetId || signal.targetId === currentUserId) {
            onSignal(signal);
          }
        }
      })
      .subscribe();

    return () => {
      channelManager.removeChannel(topic);
    };
  }
}
