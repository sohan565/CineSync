'use client';

import React, { createContext, useContext } from 'react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { PeerStream, MediaStreamState } from '@/types/webrtc';

interface WebRTCContextType {
  localStream: MediaStream | null;
  remotePeers: PeerStream[];
  mediaState: MediaStreamState;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export function WebRTCProvider({
  slug,
  children,
}: {
  slug: string | null;
  children: React.ReactNode;
}) {
  const webrtc = useWebRTC(slug);

  return (
    <WebRTCContext.Provider value={webrtc}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTCContext() {
  const context = useContext(WebRTCContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider
    return {
      localStream: null,
      remotePeers: [],
      mediaState: {
        isMicOn: false,
        isCamOn: false,
        isScreenSharing: false,
        isSpeaking: false,
      },
      toggleMic: async () => {},
      toggleCam: async () => {},
      toggleScreenShare: async () => {},
    };
  }
  return context;
}
