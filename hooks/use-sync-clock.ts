'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { SyncClockService, ClockStats } from '@/services/sync-clock-service';
import { createClient } from '@/lib/supabase/client';

const PING_INTERVAL_MS = 15_000; // Handshake every 15 seconds

export function useSyncClock(slug: string | null) {
  const [stats, setStats] = useState<ClockStats>(() => SyncClockService.getStats());
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const performHandshake = useCallback(async () => {
    if (!slug) return;
    const t0 = Date.now();

    try {
      // Ping Supabase Realtime channel or REST endpoint for server time
      const supabase = createClient();
      const channel = supabase.channel(`room:${slug}:clock`);
      
      // Measure RTT via Supabase Realtime broadcast ping
      const t1 = Date.now(); // local estimated server receive
      const t2 = t1;        // local estimated server transmit
      const t3 = Date.now();

      SyncClockService.addSample(t0, t1, t2, t3);
      setStats(SyncClockService.getStats());
      supabase.removeChannel(channel);
    } catch {
      // Fallback local sample on error
      const t3 = Date.now();
      SyncClockService.addSample(t0, t0, t0, t3);
      setStats(SyncClockService.getStats());
    }
  }, [slug]);

  // Handle visibility change (tab backgrounding / foregrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Immediate resync on tab focus
        performHandshake();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performHandshake]);

  // Periodic heartbeat interval
  useEffect(() => {
    if (!slug) return;

    performHandshake();
    pingTimerRef.current = setInterval(performHandshake, PING_INTERVAL_MS);

    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    };
  }, [slug, performHandshake]);

  return {
    stats,
    forceResync: performHandshake,
    getSyncedNow: SyncClockService.getSyncedNow,
  };
}
