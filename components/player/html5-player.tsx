'use client';

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from 'react';
import { PlayerAdapter } from '@/types/player';
import { MediaSourceType } from '@/types/room';

import type Hls from 'hls.js';

// ── HLS.js dynamic import (avoids SSR issues) ─────────────────────────────────

async function getHls() {
  const mod = await import('hls.js');
  return mod.default;
}

// ── HTML5Player ───────────────────────────────────────────────────────────────

interface HTML5PlayerProps {
  url: string;
  sourceType: MediaSourceType;
  onReady: (duration: number) => void;
  onTimeUpdate: (position: number) => void;
  onBuffering: (isBuffering: boolean) => void;
  onEnded: () => void;
  onError: (message: string) => void;
}

export type HTML5PlayerHandle = PlayerAdapter;

export const HTML5Player = forwardRef<HTML5PlayerHandle, HTML5PlayerProps>(
  function HTML5Player(
    { url, sourceType, onReady, onTimeUpdate, onBuffering, onEnded, onError },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isAdapterReady, setIsAdapterReady] = useState(false);

    // Expose adapter interface
    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          const v = videoRef.current;
          if (v) {
            const p = v.play();
            if (p !== undefined) {
              p.catch(() => null);
            }
          }
        },
        pause: () => { videoRef.current?.pause(); },
        seekTo: (s: number) => { if (videoRef.current) videoRef.current.currentTime = s; },
        setVolume: (v: number) => { if (videoRef.current) videoRef.current.volume = v; },
        setMuted: (m: boolean) => { if (videoRef.current) videoRef.current.muted = m; },
        setPlaybackRate: (r: number) => { if (videoRef.current) videoRef.current.playbackRate = r; },
        getDuration: () => videoRef.current?.duration ?? 0,
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        get isReady() { return isAdapterReady; },
      }),
      [isAdapterReady]
    );

    const handleMediaLoaded = () => {
      const v = videoRef.current;
      if (v && v.duration && !isNaN(v.duration)) {
        setIsAdapterReady(true);
        onReady(v.duration);
      }
    };

    // Attach HLS.js or native src
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !url) return;

      setIsAdapterReady(false);
      let hlsInstance: Hls | null = null;

      if (sourceType === 'hls') {
        getHls().then((HlsClass) => {
          if (!HlsClass.isSupported()) {
            // Safari supports HLS natively
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            } else {
              onError('HLS streams are not supported in this browser.');
            }
            return;
          }

          hlsInstance = new HlsClass({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hlsInstance;
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);

          hlsInstance.on(HlsClass.Events.ERROR, (_, data) => {
            if (data.fatal) {
              onError(`Stream error: ${data.details}`);
            }
          });
        });
      } else {
        // MP4 or local blob URL
        video.src = url;
        video.load();
      }

      return () => {
        if (hlsInstance) {
          try { hlsInstance.destroy(); } catch { /* ignore */ }
        }
        hlsRef.current = null;
        if (video) {
          try {
            video.pause();
            video.src = '';
          } catch {
            /* ignore DOM cleanup errors */
          }
        }
        setIsAdapterReady(false);
      };
    }, [url, sourceType]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <video
        ref={videoRef}
        className="h-full w-full rounded-xl object-contain bg-black cursor-pointer"
        playsInline
        preload="auto"
        aria-label="Video player"
        onLoadedMetadata={handleMediaLoaded}
        onLoadedData={handleMediaLoaded}
        onCanPlay={handleMediaLoaded}
        onTimeUpdate={() => {
          if (videoRef.current) onTimeUpdate(videoRef.current.currentTime);
        }}
        onWaiting={() => onBuffering(true)}
        onPlaying={() => onBuffering(false)}
        onEnded={onEnded}
        onError={() => {
          const err = videoRef.current?.error;
          const msgs: Record<number, string> = {
            1: 'Playback aborted.',
            2: 'Network error loading video.',
            3: 'Video decoding failed.',
            4: 'Browsers cannot decode MKV container files natively. Please select an MP4 or WEBM file, or click 🖥️ Share Screen to stream your movie!',
          };
          onError(msgs[err?.code ?? 0] ?? 'Unknown playback error.');
        }}
      />
    );
  }
);
