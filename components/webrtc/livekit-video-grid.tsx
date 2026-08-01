'use client';

import React, { useRef, useEffect } from 'react';
import { useAgora, AgoraPeer } from '@/hooks/use-agora';
import { VideoGrid } from '@/components/webrtc/video-grid';
import { useWebRTC } from '@/hooks/use-webrtc';
import { MediaControls } from '@/components/webrtc/media-controls';
import { useAppStore } from '@/hooks/use-store';
import { cn } from '@/lib/utils';

interface LiveKitVideoGridProps {
  slug: string;
  className?: string;
}

// ── Agora Local Video Tile ───────────────────────────────────────────────────

function AgoraLocalTile({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  videoTrack,
  displayName,
  isMicOn,
  isCamOn,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  videoTrack: any;
  displayName: string;
  isMicOn: boolean;
  isCamOn: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && videoTrack && isCamOn) {
      videoTrack.play(containerRef.current);
      return () => {
        try { videoTrack.stop(); } catch { /* ignore */ }
      };
    }
  }, [videoTrack, isCamOn]);

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-card border border-border">
      {isCamOn && videoTrack ? (
        <div ref={containerRef} className="h-full w-full object-cover -scale-x-100" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 font-bold text-white text-lg">
            {initial}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
          {displayName} (You)
        </span>
        {!isMicOn && <span className="rounded-full bg-red-500/80 px-1.5 py-0.5 text-[10px]">🔇</span>}
      </div>
    </div>
  );
}

// ── Agora Remote Video Tile ──────────────────────────────────────────────────

function AgoraRemoteTile({ peer }: { peer: AgoraPeer }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && peer.videoTrack && peer.hasVideo) {
      peer.videoTrack.play(containerRef.current);
      return () => {
        try { peer.videoTrack?.stop(); } catch { /* ignore */ }
      };
    }
  }, [peer.videoTrack, peer.hasVideo]);

  const initial = peer.displayName.charAt(0).toUpperCase();

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-card border border-border">
      {peer.hasVideo && peer.videoTrack ? (
        <div ref={containerRef} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-700 font-bold text-white text-lg">
            {initial}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
          {peer.displayName}
        </span>
        {!peer.hasAudio && <span className="rounded-full bg-red-500/80 px-1.5 py-0.5 text-[10px]">🔇</span>}
      </div>
    </div>
  );
}

// ── Main Agora Video Grid ────────────────────────────────────────────────────

export function LiveKitVideoGrid({ slug, className }: LiveKitVideoGridProps) {
  const user = useAppStore((s) => s.user);

  // Agora Cloud Hook
  const {
    localVideoTrack,
    remotePeers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    hasAppId,
  } = useAgora(slug);

  // P2P Native WebRTC Fallback
  const p2p = useWebRTC(slug);

  // If NEXT_PUBLIC_AGORA_APP_ID is not configured, fall back to native WebRTC mesh grid
  if (!hasAppId) {
    return (
      <VideoGrid
        localStream={p2p.localStream}
        remotePeers={p2p.remotePeers}
        mediaState={p2p.mediaState}
        onToggleMic={p2p.toggleMic}
        onToggleCam={p2p.toggleCam}
        onToggleScreenShare={p2p.toggleScreenShare}
        className={className}
      />
    );
  }

  const mediaState = {
    isMicOn,
    isCamOn,
    isScreenSharing,
    isSpeaking: false,
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
        <AgoraLocalTile
          videoTrack={localVideoTrack}
          displayName={user?.displayName || 'You'}
          isMicOn={isMicOn}
          isCamOn={isCamOn || isScreenSharing}
        />
        {remotePeers.map((peer) => (
          <AgoraRemoteTile key={peer.uid} peer={peer} />
        ))}
      </div>

      <MediaControls
        mediaState={mediaState}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleScreenShare={toggleScreenShare}
      />
    </div>
  );
}
