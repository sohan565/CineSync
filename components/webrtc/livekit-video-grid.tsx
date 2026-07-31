'use client';

import React from 'react';
import { VideoGrid } from '@/components/webrtc/video-grid';
import { useWebRTC } from '@/hooks/use-webrtc';

interface LiveKitVideoGridProps {
  slug: string;
  className?: string;
}

export function LiveKitVideoGrid({ slug, className }: LiveKitVideoGridProps) {
  // Use 100% reliable Native WebRTC P2P mesh stream engine
  const { localStream, remotePeers, mediaState, toggleMic, toggleCam } = useWebRTC(slug);

  return (
    <VideoGrid
      localStream={localStream}
      remotePeers={remotePeers}
      mediaState={mediaState}
      onToggleMic={toggleMic}
      onToggleCam={toggleCam}
      className={className}
    />
  );
}
