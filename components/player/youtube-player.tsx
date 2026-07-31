'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { PlayerAdapter } from '@/types/player';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */
declare global {
  namespace YT {
    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }
    class Player {
      constructor(element: HTMLElement | string, options: any);
      playVideo(): void;
      pauseVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      setVolume(volume: number): void;
      mute(): void;
      unMute(): void;
      setPlaybackRate(rate: number): void;
      getDuration(): number;
      getCurrentTime(): number;
      destroy(): void;
    }
  }

  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── YouTube IFrame API loader (singleton, idempotent) ─────────────────────────

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: Array<() => void> = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded) { resolve(); return; }
    ytApiCallbacks.push(resolve);
    if (ytApiLoading) return;
    ytApiLoading = true;

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks.length = 0;
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

// ── YouTubePlayer ─────────────────────────────────────────────────────────────

interface YouTubePlayerProps {
  videoId: string;
  onReady: (duration: number) => void;
  onTimeUpdate: (position: number) => void;
  onBuffering: (isBuffering: boolean) => void;
  onEnded: () => void;
  onError: (message: string) => void;
}

export type YouTubePlayerHandle = PlayerAdapter;

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer(
    { videoId, onReady, onTimeUpdate, onBuffering, onEnded, onError },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YT.Player | null>(null);
    const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isAdapterReady, setIsAdapterReady] = useState(false);

    // Expose adapter interface to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        play: () => playerRef.current?.playVideo(),
        pause: () => playerRef.current?.pauseVideo(),
        seekTo: (s: number) => playerRef.current?.seekTo(s, true),
        setVolume: (v: number) => playerRef.current?.setVolume(v * 100),
        setMuted: (m: boolean) => m
          ? playerRef.current?.mute()
          : playerRef.current?.unMute(),
        setPlaybackRate: (r: number) => playerRef.current?.setPlaybackRate(r),
        getDuration: () => playerRef.current?.getDuration() ?? 0,
        getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
        get isReady() { return isAdapterReady; },
      }),
      [isAdapterReady]
    );

    useEffect(() => {
      if (!containerRef.current) return;
      let destroyed = false;

      loadYouTubeAPI().then(() => {
        if (destroyed || !containerRef.current) return;

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,        // Use custom controls
            disablekb: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (e: any) => {
              const duration = e.target.getDuration();
              setIsAdapterReady(true);
              onReady(duration);

              // Poll for time updates (YT API has no onTimeUpdate)
              timeUpdateInterval.current = setInterval(() => {
                if (playerRef.current) {
                  onTimeUpdate(playerRef.current.getCurrentTime());
                }
              }, 250);
            },
            onStateChange: (e: any) => {
              switch (e.data) {
                case window.YT.PlayerState.PLAYING:
                  onBuffering(false);
                  break;
                case window.YT.PlayerState.BUFFERING:
                  onBuffering(true);
                  break;
                case window.YT.PlayerState.ENDED:
                  onEnded();
                  break;
                case window.YT.PlayerState.PAUSED:
                  onBuffering(false);
                  break;
              }
            },
            onError: (e: any) => {
              const messages: Record<number, string> = {
                2: 'Invalid video ID.',
                5: 'HTML5 player error.',
                100: 'Video not found or private.',
                101: 'Embedding not allowed for this video.',
                150: 'Embedding not allowed for this video.',
              };
              onError(messages[e.data] ?? `YouTube error ${e.data}`);
            },
          },
        });
      });

      return () => {
        destroyed = true;
        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
        try {
          playerRef.current?.destroy();
        } catch {
          /* ignore YT iframe destroy DOM errors */
        }
        playerRef.current = null;
        setIsAdapterReady(false);
      };
    }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="YouTube video player"
        title="YouTube video player"
      />
    );
  }
);
