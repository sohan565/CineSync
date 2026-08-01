'use client';

import React from 'react';
import { VideoGrid } from '@/components/webrtc/video-grid';
import { useWebRTCContext } from '@/components/providers/webrtc-provider';

interface LiveKitVideoGridProps {
  slug?: string;
  className?: string;
}

export function LiveKitVideoGrid({ className }: LiveKitVideoGridProps) {
  const { localStream, remotePeers, mediaState, toggleMic, toggleCam, toggleScreenShare } =
    useWebRTCContext();

  return (
    <VideoGrid
      localStream={localStream}
      remotePeers={remotePeers}
      mediaState={mediaState}
      onToggleMic={toggleMic}
      onToggleCam={toggleCam}
      onToggleScreenShare={toggleScreenShare}
      className={className}
    />
  );
}
