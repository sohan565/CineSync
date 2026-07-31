'use client';

import React, { useState } from 'react';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/shared/site-header';
import { RoomList } from '@/components/room/room-list';
import { CreateRoomModal } from '@/components/room/create-room-modal';
import { JoinRoomModal } from '@/components/room/join-room-modal';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/hooks/use-store';
import { useUserRooms } from '@/hooks/use-room';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth();
  const user = useAppStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const {
    data: rooms = [],
    isLoading: roomsLoading,
    error,
  } = useUserRooms(user?.id ?? null);

  // Redirect unauthenticated users (middleware also handles this as edge guard)
  if (!authLoading && !user) {
    redirect('/login');
  }

  const isGuest = user?.isGuest ?? false;

  return (
    <>
      <SiteHeader />

      <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Page header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {user
                  ? `Welcome back, ${user.displayName} 👋`
                  : 'Loading…'}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setJoinOpen(true)}
                id="join-room-btn"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Join a Room
              </Button>

              {isGuest ? (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
                  <span className="text-xs font-medium text-yellow-400">
                    🔒 Sign up to create rooms
                  </span>
                  <a
                    href="/register"
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Register →
                  </a>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCreateOpen(true)}
                  id="create-room-btn"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Room
                </Button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Your Rooms', value: rooms.length },
              { label: 'Hosting', value: rooms.filter((r) => r.hostId === user?.id).length },
              { label: 'Joined as Guest', value: rooms.filter((r) => r.hostId !== user?.id).length },
              { label: 'Active', value: rooms.filter((r) => r.isActive).length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card px-5 py-4"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Room list */}
          <section className="mt-10" aria-labelledby="rooms-heading">
            <h2
              id="rooms-heading"
              className="mb-4 text-lg font-bold text-foreground"
            >
              Your Watch Rooms
            </h2>
            <RoomList
              rooms={rooms}
              isLoading={roomsLoading || authLoading}
              error={error}
              emptyMessage="You haven't joined any rooms yet. Create one or join with a room code!"
            />
          </section>
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinRoomModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
