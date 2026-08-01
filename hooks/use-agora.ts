'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';
import { useAppStore } from '@/hooks/use-store';
import { toast } from '@/hooks/use-toast';

export interface AgoraPeer {
  uid: string;
  displayName: string;
  audioTrack?: IAgoraRTCRemoteUser['audioTrack'];
  videoTrack?: IAgoraRTCRemoteUser['videoTrack'];
  hasAudio: boolean;
  hasVideo: boolean;
}

export function useAgora(slug: string | null) {
  const user = useAppStore((s) => s.user);

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | ILocalVideoTrack | null>(null);
  const [remotePeers, setRemotePeers] = useState<AgoraPeer[]>([]);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  // Initialize Agora client on mount
  useEffect(() => {
    if (!slug || !appId) return;

    let isMounted = true;

    async function initAgora() {
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        AgoraRTC.setLogLevel(3);

        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = agoraClient;
        if (isMounted) setClient(agoraClient);

        // Remote user published track
        agoraClient.on('user-published', async (remoteUser, mediaType) => {
          await agoraClient.subscribe(remoteUser, mediaType);

          const uidStr = String(remoteUser.uid);
          const namePart = uidStr.split('---')[0] || 'Peer';

          setRemotePeers((prev) => {
            const existing = prev.find((p) => p.uid === uidStr);
            const updated: AgoraPeer = {
              uid: uidStr,
              displayName: namePart,
              audioTrack: remoteUser.audioTrack || existing?.audioTrack,
              videoTrack: remoteUser.videoTrack || existing?.videoTrack,
              hasAudio: mediaType === 'audio' ? true : (existing?.hasAudio ?? false),
              hasVideo: mediaType === 'video' ? true : (existing?.hasVideo ?? false),
            };
            return [...prev.filter((p) => p.uid !== uidStr), updated];
          });

          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
        });

        // Remote user unpublished track
        agoraClient.on('user-unpublished', (remoteUser, mediaType) => {
          const uidStr = String(remoteUser.uid);
          setRemotePeers((prev) =>
            prev.map((p) => {
              if (p.uid === uidStr) {
                return {
                  ...p,
                  hasAudio: mediaType === 'audio' ? false : p.hasAudio,
                  hasVideo: mediaType === 'video' ? false : p.hasVideo,
                };
              }
              return p;
            })
          );
        });

        // Remote user left
        agoraClient.on('user-left', (remoteUser) => {
          const uidStr = String(remoteUser.uid);
          setRemotePeers((prev) => prev.filter((p) => p.uid !== uidStr));
        });

        // Join Agora RTC channel
        const displayName = user?.displayName || 'Guest';
        const userId = user?.id || Math.random().toString(36).substring(2, 7);
        const agoraUid = `${displayName}---${userId}`;

        if (slug) {
          await agoraClient.join(appId, slug, null, agoraUid);
          if (isMounted) setIsJoined(true);
        }
      } catch (err: unknown) {
        console.error('Agora connection error:', err);
      }
    }

    initAgora();

    return () => {
      isMounted = false;
      const c = clientRef.current;
      if (c) {
        c.leave().catch(() => null);
        c.removeAllListeners();
      }
    };
  }, [slug, user, appId]);

  // ── Toggle Microphone ───────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    if (!clientRef.current || !isJoined) return;
    const c = clientRef.current;
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      if (!localAudioTrack) {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        await c.publish([audioTrack]);
        setIsMicOn(true);
        toast.success('Microphone enabled.');
      } else {
        const nextState = !isMicOn;
        await localAudioTrack.setEnabled(nextState);
        setIsMicOn(nextState);
        toast.info(nextState ? 'Microphone enabled.' : 'Microphone muted.');
      }
    } catch {
      toast.error('Microphone permission blocked or device not found.');
    }
  }, [isJoined, localAudioTrack, isMicOn]);

  // ── Toggle Camera ───────────────────────────────────────────────────────────

  const toggleCam = useCallback(async () => {
    if (!clientRef.current || !isJoined) return;
    const c = clientRef.current;
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      if (!localVideoTrack) {
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: { width: 640, height: 360, frameRate: 24 },
        });
        setLocalVideoTrack(videoTrack);
        await c.publish([videoTrack]);
        setIsCamOn(true);
        toast.success('Camera enabled.');
      } else {
        const nextState = !isCamOn;
        await localVideoTrack.setEnabled(nextState);
        setIsCamOn(nextState);
        toast.info(nextState ? 'Camera enabled.' : 'Camera turned off.');
      }
    } catch {
      toast.error('Camera permission blocked or in use by another app.');
    }
  }, [isJoined, localVideoTrack, isCamOn]);

  // ── Toggle Screen Share ───────────────────────────────────────────────────

  const toggleScreenShare = useCallback(async () => {
    if (!clientRef.current || !isJoined) return;
    const c = clientRef.current;
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      if (isScreenSharing) {
        if (localVideoTrack) {
          await c.unpublish([localVideoTrack]);
          localVideoTrack.close();
          setLocalVideoTrack(null);
        }
        setIsScreenSharing(false);
        toast.info('Screen sharing stopped.');
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const videoTrack = displayStream.getVideoTracks()[0];

        const screenTrack = await AgoraRTC.createCustomVideoTrack({
          mediaStreamTrack: videoTrack,
        });

        videoTrack.onended = () => {
          setIsScreenSharing(false);
          toast.info('Screen sharing stopped.');
        };

        if (localVideoTrack) {
          await c.unpublish([localVideoTrack]);
          localVideoTrack.close();
        }

        setLocalVideoTrack(screenTrack);
        await c.publish([screenTrack]);
        setIsScreenSharing(true);
        toast.success('Screen sharing started!');
      }
    } catch {
      toast.error('Screen sharing was cancelled.');
    }
  }, [isJoined, isScreenSharing, localVideoTrack]);

  return {
    client,
    isJoined,
    localAudioTrack,
    localVideoTrack,
    remotePeers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    hasAppId: Boolean(appId),
  };
}
