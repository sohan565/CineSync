'use client';

import React from 'react';
import { Room } from '@/types/room';
import { RoomCard } from '@/components/room/room-card';
import { useLeaveRoom } from '@/hooks/use-room';
import { toast } from '@/hooks/use-toast';

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function RoomCardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-4 rounded-xl border border-border bg-card p-5"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-36 rounded-md bg-muted" />
          <div className="h-3 w-20 rounded-md bg-muted" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-24 rounded-md bg-muted" />
        <div className="h-3 w-16 rounded-md bg-muted" />
      </div>
      <div className="h-8 w-full rounded-md bg-muted" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
      <span className="text-4xl" aria-hidden="true">🎬</span>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Room List ─────────────────────────────────────────────────────────────────

interface RoomListProps {
  rooms: Room[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

export function RoomList({
  rooms,
  isLoading = false,
  error = null,
  emptyMessage = 'No rooms yet. Create or join one to get started!',
}: RoomListProps) {
  const { mutateAsync: leaveRoom } = useLeaveRoom();

  const handleLeave = async (roomId: string, slug: string) => {
    try {
      await leaveRoom({ roomId, slug });
      toast.success('You have left the room.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave room.';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Loading rooms"
        aria-busy="true"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400"
      >
        {error.message}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="grid">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Your watch rooms"
    >
      {rooms.map((room) => (
        <li key={room.id}>
          <RoomCard room={room} isMember onLeave={handleLeave} />
        </li>
      ))}
    </ul>
  );
}
