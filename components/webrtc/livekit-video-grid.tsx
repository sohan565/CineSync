'use client';

import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  ParticipantTile,
  useTracks,
  useLocalParticipant,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useAppStore } from '@/hooks/use-store';
import { VideoGrid } from '@/components/webrtc/video-grid';
import { useWebRTC } from '@/hooks/use-webrtc';
import { cn } from '@/lib/utils';

interface LiveKitVideoGridProps {
  slug: string;
  className?: string;
}

function LiveKitSidebarControls() {
  const room = useRoomContext();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant } =
    useLocalParticipant();

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreen = async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  const handleDisconnect = () => {
    room.disconnect();
  };

  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-border/50 pt-2.5 pb-1 flex-wrap">
      {/* Mic Button */}
      <button
        type="button"
        onClick={toggleMic}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border border-border/60',
          isMicrophoneEnabled
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
            : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isMicrophoneEnabled ? (
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
          ) : (
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3" />
            </>
          )}
        </svg>
        {isMicrophoneEnabled ? 'Mic On' : 'Mic Off'}
      </button>

      {/* Camera Button */}
      <button
        type="button"
        onClick={toggleCam}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border border-border/60',
          isCameraEnabled
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
            : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isCameraEnabled ? (
            <path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
          ) : (
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M21 21l-4.35-4.35M23 7l-7 5v1.5M1 5h2M15 5a2 2 0 0 1 2 2v8" />
            </>
          )}
        </svg>
        {isCameraEnabled ? 'Cam On' : 'Cam Off'}
      </button>

      {/* Screen Share Button */}
      <button
        type="button"
        onClick={toggleScreen}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border border-border/60',
          isScreenShareEnabled
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
            : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        {isScreenShareEnabled ? 'Sharing' : 'Share'}
      </button>

      {/* Disconnect Button */}
      <button
        type="button"
        onClick={handleDisconnect}
        className="flex items-center gap-1 rounded-lg bg-red-600/20 px-2 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 transition hover:bg-red-600/30"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Leave
      </button>
    </div>
  );
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

      {/* Custom Control Bar with explicit SVG icons and Tailwind styling */}
      <LiveKitSidebarControls />
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
