'use client';

import React, { createContext, useContext, useRef, useEffect } from 'react';
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

// ── Persistent Background Audio Tile ──────────────────────────────────────────
// Ensures 100% continuous, zero-interruption audio streaming (WhatsApp/Zoom style)
// even when sidebar tabs, mobile sheets, or fullscreen overlays unmount/remount.

function BackgroundAudioTile({ stream }: { stream: MediaStream | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioNode = audioRef.current;
    if (!audioNode || !stream) return;

    audioNode.srcObject = stream;
    audioNode.play().catch(() => null);

    const handleTrackChange = () => {
      if (audioNode && stream) {
        audioNode.srcObject = stream;
        audioNode.play().catch(() => null);
      }
    };

    stream.addEventListener('addtrack', handleTrackChange);
    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

// ── WebRTC Provider Component ────────────────────────────────────────────────

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
      {/* Root Persistent Background Audio Pool (WhatsApp/Zoom Call Continuity) */}
      <div className="hidden" aria-hidden="true">
        {webrtc.remotePeers.map((peer) => (
          <BackgroundAudioTile key={`bg-audio-${peer.peerId}`} stream={peer.stream} />
        ))}
      </div>
    </WebRTCContext.Provider>
  );
}

export function useWebRTCContext() {
  const context = useContext(WebRTCContext);
  if (!context) {
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
