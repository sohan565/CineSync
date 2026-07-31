'use client';

import React, { useState } from 'react';
import { useSyncClock } from '@/hooks/use-sync-clock';
import { SyncDebugModal } from '@/components/room/sync-debug-modal';
import { cn } from '@/lib/utils';

interface SyncStatusBadgeProps {
  slug: string;
  className?: string;
}

export function SyncStatusBadge({ slug, className }: SyncStatusBadgeProps) {
  const { stats, forceResync } = useSyncClock(slug);
  const [debugOpen, setDebugOpen] = useState(false);

  const statusColors = {
    synced: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    syncing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    degraded: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    offline: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const statusIcons = {
    synced: '⚡',
    syncing: '🔄',
    degraded: '⚠️',
    offline: '❌',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDebugOpen(true)}
        title="Click for Sync Engine diagnostics"
        aria-label={`Sync status: ${stats.status}, latency: ${stats.rttMs}ms`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
          statusColors[stats.status],
          className
        )}
      >
        <span className="text-xs" aria-hidden="true">
          {statusIcons[stats.status]}
        </span>
        <span className="tabular-nums">
          {stats.status === 'syncing' ? 'Syncing…' : `${stats.rttMs}ms`}
        </span>
      </button>

      <SyncDebugModal
        isOpen={debugOpen}
        onClose={() => setDebugOpen(false)}
        stats={stats}
        onForceResync={forceResync}
      />
    </>
  );
}
