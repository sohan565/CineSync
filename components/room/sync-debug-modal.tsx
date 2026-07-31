'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ClockStats } from '@/services/sync-clock-service';
import { HARD_SYNC_THRESHOLD, SOFT_SYNC_THRESHOLD } from '@/lib/player/sync-engine';

interface SyncDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ClockStats;
  onForceResync: () => void;
}

export function SyncDebugModal({
  isOpen,
  onClose,
  stats,
  onForceResync,
}: SyncDebugModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sync Engine Diagnostics"
      description="Real-time NTP clock sync parameters, latency, and drift thresholds."
    >
      <div className="flex flex-col gap-4">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Latency (RTT)
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {stats.rttMs} ms
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Clock Offset
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {stats.offsetMs >= 0 ? `+${stats.offsetMs}` : stats.offsetMs} ms
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Jitter
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              ±{stats.jitterMs} ms
            </p>
          </div>
        </div>

        {/* Engine Parameters */}
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Drift Control Parameters
          </h4>
          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <dt className="text-muted-foreground">Target Precision</dt>
              <dd className="font-mono font-semibold text-emerald-400">&lt; {SOFT_SYNC_THRESHOLD * 1000} ms</dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <dt className="text-muted-foreground">Rate Nudge Threshold</dt>
              <dd className="font-mono font-semibold text-yellow-400">{SOFT_SYNC_THRESHOLD}s – {HARD_SYNC_THRESHOLD}s</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Hard Seek Threshold</dt>
              <dd className="font-mono font-semibold text-red-400">&gt; {HARD_SYNC_THRESHOLD}s</dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onForceResync}
            className="flex-1"
          >
            🔄 Force Resync Clock
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
