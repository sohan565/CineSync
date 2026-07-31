'use client';

import React from 'react';
import { PeerStream, MediaStreamState } from '@/types/webrtc';
import { VideoTile } from '@/components/webrtc/video-tile';
import { MediaControls } from '@/components/webrtc/media-controls';
import { useAppStore } from '@/hooks/use-store';
import { cn } from '@/lib/utils';

interface VideoGridProps {
  localStream: MediaStream | null;
  remotePeers: PeerStream[];
  mediaState: MediaStreamState;
  onToggleMic: () => void;
  onToggleCam: () => void;
  className?: string;
}

export function VideoGrid({
  localStream,
  remotePeers,
  mediaState,
  onToggleMic,
  onToggleCam,
  className,
}: VideoGridProps) {
  const user = useAppStore((s) => s.user);

  const totalParticipants = 1 + remotePeers.length;

  const gridCols =
    totalParticipants === 1
      ? 'grid-cols-1'
      : totalParticipants <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Grid of video tiles */}
      <div
        className={cn('grid gap-2', gridCols)}
        aria-label="Participant video grid"
      >
        {/* Local Participant Tile */}
        <VideoTile
          stream={localStream}
          displayName={user?.displayName ?? 'You'}
          avatarUrl={user?.avatarUrl}
          isMicOn={mediaState.isMicOn}
          isCamOn={mediaState.isCamOn}
          isSpeaking={mediaState.isSpeaking}
          isLocal
        />

        {/* Remote Participant Tiles */}
        {remotePeers.map((peer) => (
          <VideoTile
            key={peer.peerId}
            stream={peer.stream}
            displayName={peer.displayName}
            avatarUrl={peer.avatarUrl}
            isMicOn={peer.isMicOn}
            isCamOn={peer.isCamOn}
            isSpeaking={peer.isSpeaking}
          />
        ))}
      </div>

      {/* Floating Toolbar Controls */}
      <MediaControls
        mediaState={mediaState}
        onToggleMic={onToggleMic}
        onToggleCam={onToggleCam}
      />
    </div>
  );
}
