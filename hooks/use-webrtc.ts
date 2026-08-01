'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MediaStreamState,
  PeerStream,
  STUN_SERVERS,
  WebRTCSignalPayload,
} from '@/types/webrtc';
import { WebRTCService } from '@/services/webrtc-service';
import { ActiveSpeakerDetector } from '@/lib/webrtc/active-speaker';
import { useAppStore } from '@/hooks/use-store';
import { toast } from '@/hooks/use-toast';

export function useWebRTC(slug: string | null) {
  const user = useAppStore((s) => s.user);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, PeerStream>>(new Map());
  const [mediaState, setMediaState] = useState<MediaStreamState>({
    isMicOn: false,
    isCamOn: false,
    isScreenSharing: false,
    isSpeaking: false,
  });

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaStateRef = useRef<MediaStreamState>(mediaState);
  const speakerDetectorRef = useRef<ActiveSpeakerDetector | null>(null);
  // Track whether we are currently negotiating to avoid glare
  const negotiatingRef = useRef<Set<string>>(new Set());

  // Helper to drain queued ICE candidates after setRemoteDescription
  const drainIceCandidates = async (peerId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidatesQueueRef.current.get(peerId) || [];
    if (queue.length > 0) {
      for (const candidate of queue) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => null);
      }
      iceCandidatesQueueRef.current.delete(peerId);
    }
  };

  // Keep refs in sync so callbacks always see latest values
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    mediaStateRef.current = mediaState;
  }, [mediaState]);

  // ── Broadcast our current media state to all peers ──────────────────────────

  const broadcastState = useCallback(
    (state: MediaStreamState) => {
      if (!slug || !user) return;
      WebRTCService.sendSignal(slug, {
        type: 'state-sync',
        senderId: user.id,
        targetId: '',
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        mediaState: state,
      });
    },
    [slug, user]
  );

  // ── Send offer to a specific peer ─────────────────────────────────────────

  const sendOffer = useCallback(
    async (pc: RTCPeerConnection, peerId: string) => {
      if (!slug || !user) return;
      // Prevent glare: only one offer at a time per peer
      if (negotiatingRef.current.has(peerId)) return;
      negotiatingRef.current.add(peerId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        WebRTCService.sendSignal(slug, {
          type: 'offer',
          senderId: user.id,
          targetId: peerId,
          sdp: offer,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          mediaState: mediaStateRef.current,
        });
      } catch {
        /* ignore transient negotiation errors */
      } finally {
        negotiatingRef.current.delete(peerId);
      }
    },
    [slug, user]
  );

  // ── Create or get Peer Connection ─────────────────────────────────────────

  const getOrCreatePeerConnection = useCallback(
    (peerId: string) => {
      let pc = peerConnectionsRef.current.get(peerId);
      if (pc) return pc;

      pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(peerId, pc);

      // Attach current local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc?.addTrack(track, localStreamRef.current!);
        });
      }

      // Re-negotiate whenever tracks change (fires automatically after addTrack)
      pc.onnegotiationneeded = async () => {
        await sendOffer(pc!, peerId);
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && slug && user) {
          WebRTCService.sendSignal(slug, {
            type: 'candidate',
            senderId: user.id,
            targetId: peerId,
            candidate: event.candidate,
          });
        }
      };

      // ── Robust remote stream handling ──────────────────────────────────────
      // We maintain a single persistent remoteStream per peer and add/remove
      // tracks into it instead of replacing the stream object.
      // This avoids the video element losing its srcObject reference on re-render.
      const remoteStream = new MediaStream();

      pc.ontrack = (event) => {
        // Add the incoming track into the persistent stream
        const track = event.track;

        // Remove any existing track of the same kind to avoid duplicates
        remoteStream.getTracks().forEach((t) => {
          if (t.kind === track.kind) {
            remoteStream.removeTrack(t);
          }
        });
        remoteStream.addTrack(track);

        // When a track ends (e.g. camera turned off), remove it from the stream
        track.onended = () => {
          remoteStream.removeTrack(track);
          // Force React state update so VideoTile re-evaluates live tracks
          setRemotePeers((prev) => {
            const next = new Map(prev);
            const existing = next.get(peerId);
            if (existing) {
              next.set(peerId, { ...existing, stream: remoteStream, isCamOn: false });
            }
            return next;
          });
        };

        setRemotePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId) || {
            peerId,
            displayName: 'Peer',
            avatarUrl: null,
            stream: remoteStream,
            isMicOn: true,
            isCamOn: true,
            isSpeaking: false,
          };
          next.set(peerId, { ...existing, stream: remoteStream });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        const state = pc?.connectionState;
        if (state === 'failed') {
          // ICE failed — try restarting ICE (handles mobile network changes)
          pc?.restartIce();
        }
        if (state === 'disconnected') {
          // Give 5s for the peer to reconnect before cleaning up
          setTimeout(() => {
            if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed' || pc?.connectionState === 'closed') {
              pc.close();
              peerConnectionsRef.current.delete(peerId);
              iceCandidatesQueueRef.current.delete(peerId);
              setRemotePeers((prev) => {
                const next = new Map(prev);
                next.delete(peerId);
                return next;
              });
            }
          }, 5000);
        }
      };

      return pc;
    },
    [slug, user, sendOffer]
  );

  // ── Propagate a new track to ALL existing peer connections ─────────────────
  // After adding a track, onnegotiationneeded fires automatically → new offer

  const propagateTrackToAllPeers = useCallback(
    (track: MediaStreamTrack, stream: MediaStream) => {
      peerConnectionsRef.current.forEach((pc, peerId) => {
        const senders = pc.getSenders();
        const existingSender = senders.find((s) => s.track?.kind === track.kind);
        if (existingSender) {
          // Replace existing sender track (avoids re-negotiation if kind matches)
          existingSender.replaceTrack(track).catch(() => {
            // replaceTrack failed, fall back to addTrack (will trigger onnegotiationneeded)
            if (!senders.some((s) => s.track?.id === track.id)) {
              pc.addTrack(track, stream);
            }
          });
        } else {
          pc.addTrack(track, stream);
          // onnegotiationneeded fires automatically → sendOffer(pc, peerId)
        }
        void peerId; // suppress unused var warning
      });
    },
    []
  );

  // ── Remove a track from ALL existing peer connections ─────────────────────

  const removeTrackFromAllPeers = useCallback((trackId: string) => {
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      const sender = senders.find((s) => s.track?.id === trackId);
      if (sender) {
        try { pc.removeTrack(sender); } catch { /* ignore */ }
      }
    });
  }, []);

  // ── Signaling Handler ─────────────────────────────────────────────────────

  const handleSignal = useCallback(
    async (signal: WebRTCSignalPayload) => {
      if (!slug || !user) return;
      const { senderId, type, sdp, candidate, mediaState: remoteState } = signal;

      if (type === 'offer' && sdp) {
        const pc = getOrCreatePeerConnection(senderId);
        try {
          // If we're in the middle of an offer, rollback first
          if (pc.signalingState === 'have-local-offer') {
            await pc.setLocalDescription({ type: 'rollback' });
          }
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainIceCandidates(senderId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          WebRTCService.sendSignal(slug, {
            type: 'answer',
            senderId: user.id,
            targetId: senderId,
            sdp: answer,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          });
          // Reply with our own state so the offerer knows our media state
          broadcastState(mediaStateRef.current);
        } catch { /* ignore stale negotiation */ }

      } else if (type === 'answer' && sdp) {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.signalingState !== 'stable') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await drainIceCandidates(senderId, pc);
          } catch { /* ignore */ }
        }

      } else if (type === 'candidate' && candidate) {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => null);
        } else {
          const queue = iceCandidatesQueueRef.current.get(senderId) || [];
          queue.push(candidate);
          iceCandidatesQueueRef.current.set(senderId, queue);
        }

      } else if (type === 'state-sync' && remoteState) {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(senderId) || {
            peerId: senderId,
            displayName: signal.displayName || 'Peer',
            avatarUrl: signal.avatarUrl ?? null,
            stream: null,
            isMicOn: remoteState.isMicOn,
            isCamOn: remoteState.isCamOn,
            isSpeaking: remoteState.isSpeaking,
          };
          next.set(senderId, {
            ...existing,
            displayName: signal.displayName || existing.displayName,
            avatarUrl: signal.avatarUrl !== undefined ? signal.avatarUrl : existing.avatarUrl,
            isMicOn: remoteState.isMicOn,
            isCamOn: remoteState.isCamOn,
            isSpeaking: remoteState.isSpeaking,
          });
          return next;
        });

        const stateWithHello = remoteState as MediaStreamState & { hello?: boolean };
        if (stateWithHello.hello) {
          // A new peer announced themselves — initiate offer to them
          const pc = getOrCreatePeerConnection(senderId);
          if (localStreamRef.current) {
            // Ensure tracks are added before offering
            const senders = pc.getSenders();
            localStreamRef.current.getTracks().forEach((track) => {
              if (!senders.some((s) => s.track?.id === track.id)) {
                pc.addTrack(track, localStreamRef.current!);
              }
            });
          }
          // If tracks were already present, onnegotiationneeded fires
          // but if not, send offer directly
          if (!localStreamRef.current || localStreamRef.current.getTracks().length === 0) {
            await sendOffer(pc, senderId);
          }
          // Reply with our own state
          broadcastState(mediaStateRef.current);
        }
      }
    },
    [slug, user, getOrCreatePeerConnection, sendOffer, broadcastState]
  );

  // Subscribe to signals + send hello on mount
  useEffect(() => {
    if (!slug || !user) return;

    const cleanup = WebRTCService.subscribeToSignals(slug, user.id, handleSignal);

    // Announce ourselves after subscription is active
    const helloTimer = setTimeout(() => {
      WebRTCService.sendSignal(slug, {
        type: 'state-sync',
        senderId: user.id,
        targetId: '',
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        mediaState: { ...mediaStateRef.current, hello: true } as MediaStreamState,
      });
    }, 600);

    // ── Heartbeat re-announce every 15s ───────────────────────────────────────
    // Ensures late-joiners or reconnected clients see us, without flooding
    const heartbeatTimer = setInterval(() => {
      WebRTCService.sendSignal(slug, {
        type: 'state-sync',
        senderId: user.id,
        targetId: '',
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        mediaState: { ...mediaStateRef.current, hello: true } as MediaStreamState,
      });
    }, 15_000);

    return () => {
      clearTimeout(helloTimer);
      clearInterval(heartbeatTimer);
      cleanup();
    };
  }, [slug, user, handleSignal]);

  // ── Toggle Microphone ─────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error('Media devices (mic/cam) are not available in this browser context.');
      return;
    }

    try {
      let isMicOn = false;
      if (!localStreamRef.current) {
        // No stream yet — create one with audio only
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        isMicOn = true;

        // Attach active speaker detector
        speakerDetectorRef.current?.destroy();
        speakerDetectorRef.current = new ActiveSpeakerDetector(stream, (isSpeaking) => {
          setMediaState((prev) => {
            const next = { ...prev, isSpeaking };
            mediaStateRef.current = next;
            broadcastState(next);
            return next;
          });
        });

        // Propagate new audio track to all existing peers
        stream.getAudioTracks().forEach((track) => propagateTrackToAllPeers(track, stream));
        toast.success('Microphone enabled.');

      } else if (mediaStateRef.current.isMicOn) {
        // Turn mic OFF — stop and remove the hardware track
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          removeTrackFromAllPeers(track.id);
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        isMicOn = false;
        toast.info('Microphone turned off.');

      } else {
        // Turn mic ON — get new audio track
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack && localStreamRef.current) {
          localStreamRef.current.addTrack(newAudioTrack);
          propagateTrackToAllPeers(newAudioTrack, localStreamRef.current);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          isMicOn = true;
          toast.success('Microphone enabled.');
        }
      }

      const nextState = { ...mediaStateRef.current, isMicOn };
      setMediaState(nextState);
      mediaStateRef.current = nextState;
      broadcastState(nextState);
    } catch (err: unknown) {
      console.error('Microphone error:', err);
      toast.error('Microphone permission denied or device not found.');
    }
  }, [slug, user, propagateTrackToAllPeers, removeTrackFromAllPeers, broadcastState]);

  // ── Toggle Camera ─────────────────────────────────────────────────────────

  const toggleCam = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error('Media devices (mic/cam) are not available in this browser context.');
      return;
    }

    try {
      const videoConstraints = {
        width: { ideal: 640 },
        height: { ideal: 360 },
        frameRate: { ideal: 24 },
      };

      let isCamOn = false;
      if (!localStreamRef.current) {
        // No stream yet — create one with video (and audio if mic is on)
        const constraints: MediaStreamConstraints = { video: videoConstraints };
        if (mediaStateRef.current.isMicOn) {
          constraints.audio = true;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: mediaStateRef.current.isMicOn,
          });
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        isCamOn = true;

        // Propagate all tracks to existing peers
        stream.getTracks().forEach((track) => propagateTrackToAllPeers(track, stream));
        toast.success('Camera enabled.');

      } else if (mediaStateRef.current.isCamOn) {
        // Turn cam OFF — stop hardware camera
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          removeTrackFromAllPeers(track.id);
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        isCamOn = false;
        toast.info('Camera turned off.');

      } else {
        // Turn cam ON — get new video track
        let videoStream: MediaStream;
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        } catch {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack && localStreamRef.current) {
          localStreamRef.current.addTrack(newVideoTrack);
          propagateTrackToAllPeers(newVideoTrack, localStreamRef.current);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          isCamOn = true;
          toast.success('Camera enabled.');
        }
      }

      const nextState = { ...mediaStateRef.current, isCamOn };
      setMediaState(nextState);
      mediaStateRef.current = nextState;
      broadcastState(nextState);
    } catch (err: unknown) {
      console.error('Camera error:', err);
      toast.error('Camera permission denied or device not found.');
    }
  }, [slug, user, propagateTrackToAllPeers, removeTrackFromAllPeers, broadcastState]);

  // ── Toggle Screen Share ───────────────────────────────────────────────────

  const toggleScreenShare = useCallback(async () => {
    try {
      let isScreenSharing = false;
      if (mediaStateRef.current.isScreenSharing) {
        isScreenSharing = false;
        toast.info('Screen sharing stopped.');
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        screenStream.getVideoTracks()[0].onended = () => {
          const nextState = { ...mediaStateRef.current, isScreenSharing: false };
          setMediaState(nextState);
          mediaStateRef.current = nextState;
          broadcastState(nextState);
          toast.info('Screen sharing stopped.');
        };

        localStreamRef.current = screenStream;
        setLocalStream(screenStream);

        screenStream.getTracks().forEach((track) => propagateTrackToAllPeers(track, screenStream));
        isScreenSharing = true;
        toast.success('Screen sharing started!');
      }

      const nextState = { ...mediaStateRef.current, isScreenSharing };
      setMediaState(nextState);
      mediaStateRef.current = nextState;
      broadcastState(nextState);
    } catch {
      toast.error('Screen sharing was cancelled.');
    }
  }, [slug, user, propagateTrackToAllPeers, broadcastState]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      speakerDetectorRef.current?.destroy();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    localStream,
    remotePeers: Array.from(remotePeers.values()),
    mediaState,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
}
