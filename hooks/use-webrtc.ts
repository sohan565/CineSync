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
  const localStreamRef = useRef<MediaStream | null>(null);
  const speakerDetectorRef = useRef<ActiveSpeakerDetector | null>(null);

  // Sync ref
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // ── Create or get Peer Connection ──────────────────────────────────────────

  const getOrCreatePeerConnection = useCallback(
    (peerId: string) => {
      let pc = peerConnectionsRef.current.get(peerId);
      if (pc) return pc;

      pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(peerId, pc);

      // Attach local tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc?.addTrack(track, localStreamRef.current!);
        });
      }

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

      // Handle Remote Stream Track
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
          setRemotePeers((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      };

      return pc;
    },
    [slug, user]
  );

  // ── Signaling Handler ───────────────────────────────────────────────────────

  const handleSignal = useCallback(
    async (signal: WebRTCSignalPayload) => {
      if (!slug || !user) return;
      const { senderId, type, sdp, candidate, mediaState: remoteState } = signal;

      const pc = getOrCreatePeerConnection(senderId);

      if (type === 'offer' && sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        WebRTCService.sendSignal(slug, {
          type: 'answer',
          senderId: user.id,
          targetId: senderId,
          sdp: answer,
        });
      } else if (type === 'answer' && sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (type === 'candidate' && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => null);
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
      }
    },
    [slug, user, getOrCreatePeerConnection]
  );

  // Subscribe to signals
  useEffect(() => {
    if (!slug || !user) return;

    const cleanup = WebRTCService.subscribeToSignals(slug, user.id, handleSignal);
    return () => {
      cleanup();
    };
  }, [slug, user, handleSignal]);

  // ── Toggle Microphone ───────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    try {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mediaState.isCamOn });
        setLocalStream(stream);
        setMediaState((prev) => ({ ...prev, isMicOn: true }));

        // Attach active speaker detector
        speakerDetectorRef.current?.destroy();
        speakerDetectorRef.current = new ActiveSpeakerDetector(stream, (isSpeaking) => {
          setMediaState((prev) => ({ ...prev, isSpeaking }));
          if (slug && user) {
            WebRTCService.sendSignal(slug, {
              type: 'state-sync',
              senderId: user.id,
              targetId: '',
              mediaState: { ...mediaState, isSpeaking },
            });
          }
        });
        toast.success('Microphone enabled.');
      } else {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !mediaState.isMicOn;
          setMediaState((prev) => ({ ...prev, isMicOn: audioTrack.enabled }));
        } else {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const newAudioTrack = audioStream.getAudioTracks()[0];
          localStream.addTrack(newAudioTrack);
          setMediaState((prev) => ({ ...prev, isMicOn: true }));
        }
      }

      // Broadcast state sync
      if (slug && user) {
        WebRTCService.sendSignal(slug, {
          type: 'state-sync',
          senderId: user.id,
          targetId: '',
          mediaState: { ...mediaState, isMicOn: !mediaState.isMicOn },
        });
      }
    } catch {
      toast.error('Microphone permission denied or device not found.');
    }
  }, [localStream, mediaState, slug, user]);

  // ── Toggle Camera ───────────────────────────────────────────────────────────

  const toggleCam = useCallback(async () => {
    try {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: mediaState.isMicOn, video: true });
        setLocalStream(stream);
        setMediaState((prev) => ({ ...prev, isCamOn: true }));
        toast.success('Camera enabled.');
      } else {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !mediaState.isCamOn;
          setMediaState((prev) => ({ ...prev, isCamOn: videoTrack.enabled }));
        } else {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = videoStream.getVideoTracks()[0];
          localStream.addTrack(newVideoTrack);
          setMediaState((prev) => ({ ...prev, isCamOn: true }));
        }
      }

      if (slug && user) {
        WebRTCService.sendSignal(slug, {
          type: 'state-sync',
          senderId: user.id,
          targetId: '',
          mediaState: { ...mediaState, isCamOn: !mediaState.isCamOn },
        });
      }
    } catch {
      toast.error('Camera permission denied or device not found.');
    }
  }, [localStream, mediaState, slug, user]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

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
  };
}
