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

  // ── Send offer to a specific peer ─────────────────────────────────────────

  const sendOffer = useCallback(
    async (pc: RTCPeerConnection, peerId: string) => {
      if (!slug || !user) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        WebRTCService.sendSignal(slug, {
          type: 'offer',
          senderId: user.id,
          targetId: peerId,
          sdp: offer,
          mediaState: mediaStateRef.current,
        });
      } catch {
        /* ignore transient negotiation errors */
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

      // Re-negotiate whenever tracks change
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

      // Handle incoming Remote Stream Tracks
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId) || {
            peerId,
            displayName: 'Peer',
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
        if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed') {
          pc.close();
          peerConnectionsRef.current.delete(peerId);
          iceCandidatesQueueRef.current.delete(peerId);
          setRemotePeers((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      };

      return pc;
    },
    [slug, user, sendOffer]
  );

  // ── Propagate a new track to ALL existing peer connections ─────────────────

  const propagateTrackToAllPeers = useCallback(
    (track: MediaTrack, stream: MediaStream) => {
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const alreadySending = senders.some((s) => s.track?.id === track.id);
        if (!alreadySending) {
          pc.addTrack(track, stream);
        }
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
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainIceCandidates(senderId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          WebRTCService.sendSignal(slug, {
            type: 'answer',
            senderId: user.id,
            targetId: senderId,
            sdp: answer,
          });
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
          // Queue candidates arriving before remote description is set (crucial for mobile networks)
          const queue = iceCandidatesQueueRef.current.get(senderId) || [];
          queue.push(candidate);
          iceCandidatesQueueRef.current.set(senderId, queue);
        }

      } else if (type === 'state-sync' && remoteState) {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(senderId) || {
            peerId: senderId,
            displayName: 'Peer',
            stream: null,
            isMicOn: remoteState.isMicOn,
            isCamOn: remoteState.isCamOn,
            isSpeaking: remoteState.isSpeaking,
          };
          next.set(senderId, {
            ...existing,
            isMicOn: remoteState.isMicOn,
            isCamOn: remoteState.isCamOn,
            isSpeaking: remoteState.isSpeaking,
          });
          return next;
        });

        // ✅ KEY FIX: When a new peer announces themselves ("hello"),
        // establish a PeerConnection immediately so dynamic track updates work later
        const stateWithHello = remoteState as MediaStreamState & { hello?: boolean };
        if (stateWithHello.hello) {
          const pc = getOrCreatePeerConnection(senderId);
          await sendOffer(pc, senderId);
        }
      }
    },
    [slug, user, getOrCreatePeerConnection, sendOffer]
  );

  // Subscribe to signals
  useEffect(() => {
    if (!slug || !user) return;

    const cleanup = WebRTCService.subscribeToSignals(slug, user.id, handleSignal);

    // ✅ KEY FIX: Announce ourselves so existing peers with streams send us offers
    // Small delay to ensure subscription is active before broadcasting
    const helloTimer = setTimeout(() => {
      WebRTCService.sendSignal(slug, {
        type: 'state-sync',
        senderId: user.id,
        targetId: '',          // broadcast to all
        mediaState: { ...mediaStateRef.current, hello: true } as MediaStreamState,
      });
    }, 800);

    return () => {
      clearTimeout(helloTimer);
      cleanup();
    };
  }, [slug, user, handleSignal]);

  // ── Toggle Microphone ─────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    try {
      let isMicOn = false;
      if (!localStreamRef.current) {
        // No stream yet — create one with audio only
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setLocalStream(stream);
        isMicOn = true;

        // Attach active speaker detector
        speakerDetectorRef.current?.destroy();
        speakerDetectorRef.current = new ActiveSpeakerDetector(stream, (isSpeaking) => {
          setMediaState((prev) => {
            const next = { ...prev, isSpeaking };
            mediaStateRef.current = next;
            if (slug && user) {
              WebRTCService.sendSignal(slug, {
                type: 'state-sync',
                senderId: user.id,
                targetId: '',
                mediaState: next,
              });
            }
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
        isMicOn = false;
        toast.info('Microphone turned off.');

      } else {
        // Turn mic ON — get new audio track
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack && localStreamRef.current) {
          localStreamRef.current.addTrack(newAudioTrack);
          propagateTrackToAllPeers(newAudioTrack, localStreamRef.current);
          isMicOn = true;
          toast.success('Microphone enabled.');
        }
      }

      const nextState = { ...mediaStateRef.current, isMicOn };
      setMediaState(nextState);
      mediaStateRef.current = nextState;

      // Broadcast state
      if (slug && user) {
        WebRTCService.sendSignal(slug, {
          type: 'state-sync',
          senderId: user.id,
          targetId: '',
          mediaState: nextState,
        });
      }
    } catch {
      toast.error('Microphone permission denied or device not found.');
    }
  }, [slug, user, propagateTrackToAllPeers, removeTrackFromAllPeers]);

  // ── Toggle Camera ─────────────────────────────────────────────────────────

  const toggleCam = useCallback(async () => {
    try {
      const videoConstraints = {
        width: { ideal: 640 },
        height: { ideal: 360 },
        frameRate: { ideal: 24 },
      };

      let isCamOn = false;
      if (!localStreamRef.current) {
        // No stream yet — create one with video (and audio if mic is on)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: mediaStateRef.current.isMicOn,
          video: videoConstraints,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        isCamOn = true;

        // Propagate all tracks to existing peers
        stream.getTracks().forEach((track) => propagateTrackToAllPeers(track, stream));
        toast.success('Camera enabled.');

      } else if (mediaStateRef.current.isCamOn) {
        // Turn cam OFF — stop hardware camera (turns off webcam LED)
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          removeTrackFromAllPeers(track.id);
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
        isCamOn = false;
        toast.info('Camera turned off.');

      } else {
        // Turn cam ON — get new video track
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack && localStreamRef.current) {
          localStreamRef.current.addTrack(newVideoTrack);
          propagateTrackToAllPeers(newVideoTrack, localStreamRef.current);
          isCamOn = true;
          toast.success('Camera enabled.');
        }
      }

      const nextState = { ...mediaStateRef.current, isCamOn };
      setMediaState(nextState);
      mediaStateRef.current = nextState;

      // Broadcast state
      if (slug && user) {
        WebRTCService.sendSignal(slug, {
          type: 'state-sync',
          senderId: user.id,
          targetId: '',
          mediaState: nextState,
        });
      }
    } catch {
      toast.error('Camera permission denied or device not found.');
    }
  }, [slug, user, propagateTrackToAllPeers, removeTrackFromAllPeers]);

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
          if (slug && user) {
            WebRTCService.sendSignal(slug, {
              type: 'state-sync',
              senderId: user.id,
              targetId: '',
              mediaState: nextState,
            });
          }
          toast.info('Screen sharing stopped.');
        };

        localStreamRef.current = screenStream;
        setLocalStream(screenStream);

        // Propagate screen share tracks to all existing peers
        screenStream.getTracks().forEach((track) => propagateTrackToAllPeers(track, screenStream));
        isScreenSharing = true;
        toast.success('Screen sharing started!');
      }

      const nextState = { ...mediaStateRef.current, isScreenSharing };
      setMediaState(nextState);
      mediaStateRef.current = nextState;

      // Broadcast state
      if (slug && user) {
        WebRTCService.sendSignal(slug, {
          type: 'state-sync',
          senderId: user.id,
          targetId: '',
          mediaState: nextState,
        });
      }
    } catch {
      toast.error('Screen sharing was cancelled.');
    }
  }, [slug, user, propagateTrackToAllPeers]);

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

// Helper type alias
type MediaTrack = MediaStreamTrack;
