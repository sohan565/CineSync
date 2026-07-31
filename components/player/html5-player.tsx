'use client';

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
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
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const postGainRef = useRef<GainNode | null>(null);
    const [isAdapterReady, setIsAdapterReady] = useState(false);
    const readyFiredRef = useRef(false);

    // Build VLC-style audio processing chain:
    // source → preGain → compressor → postGain → destination
    // The compressor prevents clipping while the dual-gain stages
    // provide headroom for truly loud, clean amplification.
    const initAudioBoost = () => {
      const v = videoRef.current;
      if (!v || gainNodeRef.current) return;
      try {
        const webkitAudioCtx = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const AudioContextClass = window.AudioContext || webkitAudioCtx;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaElementSource(v);

        // Pre-gain: drives signal into compressor
        const preGain = ctx.createGain();
        preGain.gain.value = 1.0;

        // Compressor: prevents clipping and maximizes perceived loudness
        // (same approach VLC uses for clean amplification)
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;  // Start compressing at -24dB
        compressor.knee.value = 12;        // Soft knee for natural sound
        compressor.ratio.value = 8;        // 8:1 compression ratio
        compressor.attack.value = 0.003;   // 3ms attack (fast, catches peaks)
        compressor.release.value = 0.15;   // 150ms release (smooth)

        // Post-gain (make-up gain): boosts compressed signal back up
        const postGain = ctx.createGain();
        postGain.gain.value = 1.0;

        // Chain: source → preGain → compressor → postGain → speakers
        source.connect(preGain);
        preGain.connect(compressor);
        compressor.connect(postGain);
        postGain.connect(ctx.destination);

        audioCtxRef.current = ctx;
        gainNodeRef.current = preGain;
        compressorRef.current = compressor;
        postGainRef.current = postGain;
      } catch {
        /* Ignore if already connected or blocked */
      }
    };

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
        setVolume: (v: number) => {
          const el = videoRef.current;
          if (!el) return;
          if (v > 1.0) {
            initAudioBoost();
            el.volume = 1.0;

            // Split the boost across pre-gain and post-gain for clean loudness:
            // Pre-gain drives the compressor harder (more compression = louder perceived)
            // Post-gain adds make-up gain after compression
            const boostFactor = v; // e.g. 1.5 = 150%, 2.0 = 200%
            if (gainNodeRef.current && postGainRef.current) {
              gainNodeRef.current.gain.value = boostFactor * 1.5; // Drive compressor
              postGainRef.current.gain.value = boostFactor;       // Make-up gain
            }

            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
              audioCtxRef.current.resume().catch(() => null);
            }
          } else {
            el.volume = v;
            if (gainNodeRef.current) {
              gainNodeRef.current.gain.value = 1.0;
            }
            if (postGainRef.current) {
              postGainRef.current.gain.value = 1.0;
            }
          }
        },
        setMuted: (m: boolean) => { if (videoRef.current) videoRef.current.muted = m; },
        setPlaybackRate: (r: number) => { if (videoRef.current) videoRef.current.playbackRate = r; },
        getDuration: () => videoRef.current?.duration ?? 0,
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        get isReady() { return isAdapterReady; },
      }),
      [isAdapterReady]
    );

    // Stable callback that fires onReady exactly once per URL load
    const handleMediaLoaded = useCallback(() => {
      const v = videoRef.current;
      if (v && v.duration && !isNaN(v.duration) && isFinite(v.duration) && !readyFiredRef.current) {
        readyFiredRef.current = true;
        setIsAdapterReady(true);
        onReady(v.duration);
      }
    }, [onReady]);

    // Attach HLS.js or native src when URL changes
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !url) return;

      // Reset ready state for new URL
      readyFiredRef.current = false;
      setIsAdapterReady(false);
      let hlsInstance: Hls | null = null;

      if (sourceType === 'hls') {
        getHls().then((HlsClass) => {
          if (!HlsClass.isSupported()) {
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
        // MP4, WebM, or local blob URL
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
        readyFiredRef.current = false;
        setIsAdapterReady(false);
      };
    }, [url, sourceType, onError]);

    return (
      <video
        ref={videoRef}
        className="h-full w-full rounded-xl object-contain bg-black"
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
            4: 'Browsers cannot play MKV files natively. Use an MP4/WebM file, or click 🖥️ Share Screen to stream your movie!',
          };
          onError(msgs[err?.code ?? 0] ?? 'Unknown playback error.');
        }}
      />
    );
  }
);
