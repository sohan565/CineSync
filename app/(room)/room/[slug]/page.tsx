'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/shared/site-header';
import { MembersList } from '@/components/room/members-list';
import { InviteButton } from '@/components/room/invite-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoom } from '@/hooks/use-room';
import { useAppStore } from '@/hooks/use-store';
import { useLeaveRoom } from '@/hooks/use-room';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { RoomPrivacy } from '@/types/room';
import { MediaPlayer } from '@/components/player/media-player';
import { SyncStatusBadge } from '@/components/room/sync-status-badge';
import { ChatPanel } from '@/components/chat/chat-panel';
import { LiveKitVideoGrid } from '@/components/webrtc/livekit-video-grid';
import { SearchModal } from '@/components/search/search-modal';
import { usePlayer } from '@/hooks/use-player';
import { MobileRoomUI } from '@/components/room/mobile-room-ui';
import { WebRTCProvider } from '@/components/providers/webrtc-provider';
import { useRoomMembers } from '@/hooks/use-room-members';

// ── Privacy badge helpers ─────────────────────────────────────────────────────

const privacyConfig: Record<
  RoomPrivacy,
  { label: string; variant: 'success' | 'info' | 'warning'; icon: string }
> = {
  public: { label: 'Public', variant: 'success', icon: '🌍' },
  unlisted: { label: 'Unlisted', variant: 'info', icon: '🔗' },
  password: { label: 'Protected', variant: 'warning', icon: '🔒' },
};


// ── Room Page ─────────────────────────────────────────────────────────────────

interface RoomPageProps {
  params: { slug: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { slug } = params;
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setCurrentRoom = useAppStore((s) => s.setCurrentRoom);
  const setMembers = useAppStore((s) => s.setMembers);
  const { mutateAsync: leaveRoom } = useLeaveRoom();

  const {
    data: roomWithMembers,
    isLoading,
    error,
  } = useRoom(slug);

  // Sync query result into global store
  useEffect(() => {
    if (roomWithMembers) {
      const { members, ...room } = roomWithMembers;
      setCurrentRoom(room);
      setMembers(members);
    }
    return () => {
      setCurrentRoom(null);
      setMembers([]);
    };
  }, [roomWithMembers, setCurrentRoom, setMembers]);

  const [searchOpen, setSearchOpen] = useState(false);

  const { handleMediaChange } = usePlayer({
    slug,
    roomId: roomWithMembers?.id ?? '',
    hostId: roomWithMembers?.hostId ?? '',
    permissionMode: roomWithMembers?.permissionMode ?? 'host_only',
  });

  const handleLeave = async () => {
    if (!roomWithMembers) return;
    try {
      await leaveRoom({ roomId: roomWithMembers.id, slug });
      toast.success('You have left the room.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave.';
      toast.error(msg);
    }
  };

  const roomId = roomWithMembers?.id ?? null;
  const initialMembers = roomWithMembers?.members ?? [];
  const liveMembers = useRoomMembers(slug, roomId, initialMembers);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-emerald-500" />
            <p className="text-sm text-muted-foreground">Loading room…</p>
          </div>
        </div>
      </>
    );
  }

  // ── Not found / error ─────────────────────────────────────────────────────

  if (error || !roomWithMembers) {
    notFound();
  }

  const room = roomWithMembers;
  const privacy = privacyConfig[room.privacy];
  const isHost = user?.id === room.hostId;

  return (
    <WebRTCProvider slug={slug}>
      <SiteHeader />

      <div className="flex min-h-[calc(100vh-4rem)] bg-background">

        {/* ── Main area ───────────────────────────────────────────────────── */}
        <main
          className="flex flex-1 flex-col gap-4 p-4 pb-20 lg:p-6 lg:pb-6"
          aria-label={`Watch room: ${room.name}`}
        >
          {/* Room header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-foreground">
                    {room.name}
                  </h1>
                  <Badge variant={privacy.variant}>
                    <span aria-hidden="true">{privacy.icon}</span>
                    {privacy.label}
                  </Badge>
                  {isHost && (
                    <Badge variant="success">
                      👑 Host
                    </Badge>
                  )}
                  <SyncStatusBadge slug={slug} />
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  #{room.slug} · {liveMembers.length} member{liveMembers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchOpen(true)}
                aria-label="Search movies and trailers"
              >
                🔍 Search Movies
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                className="text-muted-foreground hover:text-red-400"
                aria-label="Leave room"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Leave
              </Button>
            </div>
          </div>

          {/* Video player area */}
          <MediaPlayer
            slug={slug}
            roomId={room.id}
            hostId={room.hostId}
            permissionMode={room.permissionMode}
            initialMedia={room.currentMedia}
          />

          {/* Invite bar — always visible below player */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invite Link
            </p>
            <InviteButton slug={slug} />
          </div>
        </main>

        {/* ── Sidebar (members + voice/video + chat) ────────────────────────── */}
        <aside
          className="hidden w-72 flex-col gap-4 border-l border-border p-4 lg:flex xl:w-80 overflow-y-auto"
          aria-label="Room sidebar"
        >
          {/* Voice & Video SFU / P2P Grid */}
          <LiveKitVideoGrid slug={slug} />

          <MembersList members={liveMembers} />

          {/* Chat Panel */}
          <ChatPanel
            roomId={room.id}
            slug={slug}
            hostId={room.hostId}
            className="flex-1 min-h-[250px]"
          />
        </aside>
      </div>

      {/* ── Mobile Bottom Tab Bar (Android / small screens) ───────────── */}
      <MobileRoomUI
        slug={slug}
        roomId={room.id}
        hostId={room.hostId}
        members={liveMembers}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectMedia={handleMediaChange}
        canControl={isHost || room.permissionMode === 'open'}
      />
    </WebRTCProvider>
  );
}
