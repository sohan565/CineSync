'use client';

/**
 * MobileRoomUI — Full mobile-first room interface for Android/iOS users.
 * Renders ONLY on screens < 1024px (lg breakpoint).
 *
 * Layout:
 *  - Fixed bottom navigation bar (Cam / Chat / Members)
 *  - Floating video grid overlay (collapsible)
 *  - Bottom sheets for Chat and Members panels
 */

import React, { useState } from 'react';
import { ChatPanel } from '@/components/chat/chat-panel';
import { MembersList } from '@/components/room/members-list';
import { VideoGrid } from '@/components/webrtc/video-grid';
import { useWebRTCContext } from '@/components/providers/webrtc-provider';
import { RoomMember } from '@/types/room';
import { cn } from '@/lib/utils';

// ── Tab Types ────────────────────────────────────────────────────────────────

type MobileTab = 'cam' | 'chat' | 'members';

// ── Props ────────────────────────────────────────────────────────────────────

interface MobileRoomUIProps {
  slug: string;
  roomId: string;
  hostId: string;
  members: RoomMember[];
}

// ── Bottom Sheet Wrapper ─────────────────────────────────────────────────────

function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl bg-[#0f0f14] border-t border-white/10 shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
          <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="px-4 pb-2 pt-1">
          <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain pb-2">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Camera Panel (inline, not a sheet) ───────────────────────────────────────

function CameraPanel() {
  const { localStream, remotePeers, mediaState, toggleMic, toggleCam, toggleScreenShare } =
    useWebRTCContext();

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-[#0f0f14] border-t border-white/10 shadow-2xl max-h-[70vh]">
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2 border-b border-white/10">
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>

      <div className="px-4 pb-4 pt-2 overflow-y-auto">
        <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase mb-3">
          Camera & Mic
        </h2>

        {/* Video grid */}
        <VideoGrid
          localStream={localStream}
          remotePeers={remotePeers}
          mediaState={mediaState}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onToggleScreenShare={toggleScreenShare}
        />
      </div>
    </div>
  );
}

// ── Main Mobile Room UI ───────────────────────────────────────────────────────

export function MobileRoomUI({ slug, roomId, hostId, members }: MobileRoomUIProps) {
  const [activeTab, setActiveTab] = useState<MobileTab | null>(null);

  const handleTabPress = (tab: MobileTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const closeSheet = () => setActiveTab(null);

  return (
    <div className="lg:hidden">

      {/* Camera Panel (shows when cam tab active) */}
      {activeTab === 'cam' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeSheet}
            aria-hidden="true"
          />
          <CameraPanel />
        </>
      )}

      {/* Chat Bottom Sheet */}
      {activeTab === 'chat' && (
        <BottomSheet isOpen={true} onClose={closeSheet} title="Live Chat">
          <ChatPanel
            roomId={roomId}
            slug={slug}
            hostId={hostId}
            className="h-full"
          />
        </BottomSheet>
      )}

      {/* Members Bottom Sheet */}
      {activeTab === 'members' && (
        <BottomSheet isOpen={true} onClose={closeSheet} title="Members">
          <div className="px-1 py-2">
            <MembersList members={members} />
          </div>
        </BottomSheet>
      )}

      {/* ── Bottom Navigation Bar ────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-60 flex h-16 items-stretch border-t border-white/10 bg-[#0a0a10]/95 backdrop-blur-xl safe-area-inset-bottom"
        role="tablist"
        aria-label="Room navigation"
      >
        {/* Cam Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cam'}
          onClick={() => handleTabPress('cam')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-all active:scale-95',
            activeTab === 'cam'
              ? 'text-emerald-400'
              : 'text-white/50 hover:text-white/80'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
            activeTab === 'cam' ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50' : ''
          )}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <span>Cam</span>
        </button>

        {/* Chat Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => handleTabPress('chat')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-all active:scale-95',
            activeTab === 'chat'
              ? 'text-emerald-400'
              : 'text-white/50 hover:text-white/80'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
            activeTab === 'chat' ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50' : ''
          )}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span>Chat</span>
        </button>

        {/* Members Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'members'}
          onClick={() => handleTabPress('members')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-all active:scale-95',
            activeTab === 'members'
              ? 'text-emerald-400'
              : 'text-white/50 hover:text-white/80'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
            activeTab === 'members' ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50' : ''
          )}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="relative">
            Members
            {members.length > 0 && (
              <span className="absolute -right-4 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                {members.length}
              </span>
            )}
          </span>
        </button>
      </nav>

      {/* Bottom padding so content doesn't hide behind the nav bar */}
      <div className="h-16" aria-hidden="true" />
    </div>
  );
}
