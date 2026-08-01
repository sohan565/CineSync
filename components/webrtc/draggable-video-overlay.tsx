'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWebRTCContext } from '@/components/providers/webrtc-provider';
import { VideoTile } from '@/components/webrtc/video-tile';
import { useAppStore } from '@/hooks/use-store';
import { cn } from '@/lib/utils';

interface DraggableVideoOverlayProps {
  slug?: string;
  className?: string;
}

export function DraggableVideoOverlay({ className }: DraggableVideoOverlayProps) {
  const user = useAppStore((s) => s.user);
  const { localStream, remotePeers, mediaState } = useWebRTCContext();

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 16,
    initialY: 16,
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Touch Drag Handler (Android / Mobile) ─────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - dragStartRef.current.startX;
      const deltaY = touch.clientY - dragStartRef.current.startY;

      const newX = Math.max(8, dragStartRef.current.initialX + deltaX);
      const newY = Math.max(8, dragStartRef.current.initialY + deltaY);

      setPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Mouse Drag Handler (PC) ───────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag when clicking header/handle or overlay background, not interactive buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const newX = Math.max(8, dragStartRef.current.initialX + deltaX);
      const newY = Math.max(8, dragStartRef.current.initialY + deltaY);

      setPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global move/up listeners during drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Don't render overlay if no participants have media active and no remote peers
  const hasActiveMedia =
    mediaState.isCamOn ||
    mediaState.isMicOn ||
    mediaState.isScreenSharing ||
    remotePeers.length > 0;

  if (!hasActiveMedia) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        top: `${position.y}px`,
        right: `${position.x}px`,
      }}
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute z-50 flex flex-col rounded-2xl bg-black/80 border border-white/20 shadow-2xl backdrop-blur-md transition-shadow select-none touch-none',
        isDragging ? 'opacity-90 scale-[0.98] shadow-emerald-500/20' : '',
        isMinimized ? 'p-2 w-auto' : 'w-48 sm:w-56 p-2',
        className
      )}
      aria-label="Floating video overlay"
    >
      {/* Header bar / Drag handle */}
      <div className="flex items-center justify-between gap-1 pb-1 cursor-grab active:cursor-grabbing border-b border-white/10 mb-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase">
            {isMinimized ? 'Call' : 'Participants'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="flex h-5 w-5 items-center justify-center rounded-md text-xs text-white/70 hover:bg-white/15 hover:text-white"
          title={isMinimized ? 'Expand overlay' : 'Minimize overlay'}
        >
          {isMinimized ? '➕' : '➖'}
        </button>
      </div>

      {/* Expanded view: Video Tiles */}
      {!isMinimized && (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-0.5">
          {/* Local participant video tile */}
          {(mediaState.isCamOn || mediaState.isScreenSharing) && (
            <VideoTile
              stream={localStream}
              displayName={user?.displayName ?? 'You'}
              avatarUrl={user?.avatarUrl}
              isMicOn={mediaState.isMicOn}
              isCamOn={mediaState.isCamOn || mediaState.isScreenSharing}
              isSpeaking={mediaState.isSpeaking}
              isLocal
              className="aspect-video w-full rounded-lg text-xs"
            />
          )}

          {/* Remote participant video tiles */}
          {remotePeers.map((peer) => (
            <VideoTile
              key={peer.peerId}
              stream={peer.stream}
              displayName={peer.displayName}
              avatarUrl={peer.avatarUrl}
              isMicOn={peer.isMicOn}
              isCamOn={peer.isCamOn}
              isSpeaking={peer.isSpeaking}
              className="aspect-video w-full rounded-lg text-xs"
            />
          ))}
        </div>
      )}
    </div>
  );
}
