'use client';

import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useAppStore } from '@/hooks/use-store';
import { VideoGrid } from '@/components/webrtc/video-grid';
import { useWebRTC } from '@/hooks/use-webrtc';
import { cn } from '@/lib/utils';

interface LiveKitVideoGridProps {
  slug: string;
  className?: string;
}

function LiveKitSidebarLayout() {
  // Fetch all camera & screen share tracks for participants in the room
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Participant Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto">
        {tracks.map((trackRef) => (
          <ParticipantTile
            key={`${trackRef.participant.identity}-${trackRef.source}`}
            trackRef={trackRef}
            className="aspect-video overflow-hidden rounded-lg border border-border bg-black/40 shadow-sm"
          />
        ))}
      </div>

      {/* Audio Renderer for remote participants */}
      <RoomAudioRenderer />

      {/* Control Bar — Explicitly show Microphone & Camera controls */}
      <div className="flex justify-center border-t border-border/50 pt-2">
        <ControlBar
          controls={{
            microphone: true,
            camera: true,
            screenShare: true,
            chat: false,
            settings: false,
            leave: false,
          }}
          variation="minimal"
        />
      </div>
    </div>
  );
}

export function LiveKitVideoGrid({ slug, className }: LiveKitVideoGridProps) {
  const user = useAppStore((s) => s.user);
  const username = user?.displayName || 'Guest User';

  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // WebRTC Mesh fallback hook
  const { localStream, remotePeers, mediaState, toggleMic, toggleCam } = useWebRTC(slug);

  useEffect(() => {
    if (!slug || !username) return;

    let isMounted = true;

    async function fetchToken() {
      try {
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(slug)}&username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        if (data.token && isMounted) {
          setToken(data.token);
        } else if (isMounted) {
          setError(true);
        }
      } catch {
        if (isMounted) setError(true);
      }
    }

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, [slug, username]);

  // If LiveKit Cloud URL or token isn't ready/error, use our clean native WebRTC fallback!
  if (!serverUrl || error || !token) {
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

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)} data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        connect={true}
      >
        <LiveKitSidebarLayout />
      </LiveKitRoom>
    </div>
  );
}
