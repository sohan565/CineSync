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

export interface AgoraRemotePeer {
  uid: string | number;
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
  const [remoteUsers, setRemoteUsers] = useState<AgoraRemotePeer[]>([]);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  // Initialize AgoraRTC Client dynamically on client side
  useEffect(() => {
    if (!slug || !user || !appId) return;

    let isMounted = true;

    async function initAgora() {
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        // Suppress debug logs
        AgoraRTC.setLogLevel(3);

        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = agoraClient;
        if (isMounted) setClient(agoraClient);

        // Remote user published media
        agoraClient.on('user-published', async (remoteUser, mediaType) => {
          await agoraClient.subscribe(remoteUser, mediaType);
          setRemoteUsers((prev) => {
            const filtered = prev.filter((u) => u.uid !== remoteUser.uid);
            return [
              ...filtered,
              {
                uid: remoteUser.uid,
                audioTrack: remoteUser.audioTrack,
                videoTrack: remoteUser.videoTrack,
                hasAudio: Boolean(remoteUser.audioTrack),
                hasVideo: Boolean(remoteUser.videoTrack),
              },
            ];
          });

          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
        });

        // Remote user unpublished media
        agoraClient.on('user-unpublished', (remoteUser, mediaType) => {
          setRemoteUsers((prev) =>
            prev.map((u) => {
              if (u.uid === remoteUser.uid) {
                return {
                  ...u,
                  hasAudio: mediaType === 'audio' ? false : u.hasAudio,
                  hasVideo: mediaType === 'video' ? false : u.hasVideo,
                };
              }
              return u;
            })
          );
        });

        // Remote user left
        agoraClient.on('user-left', (remoteUser) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
        });

        // Join room channel
        const displayName = user?.displayName || 'User';
        const userId = user?.id || Math.random().toString(36).substring(2, 7);
        const uid = `${displayName}-${userId.substring(0, 5)}`;

        if (slug) {
          await agoraClient.join(appId, slug, null, uid);
          if (isMounted) setJoined(true);
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
    if (!client || !joined) return;
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      if (!localAudioTrack) {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        await client.publish([audioTrack]);
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
  }, [client, joined, localAudioTrack, isMicOn]);

  // ── Toggle Camera ───────────────────────────────────────────────────────────

  const toggleCam = useCallback(async () => {
    if (!client || !joined) return;
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      if (!localVideoTrack) {
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: { width: 640, height: 360, frameRate: 24 },
        });
        setLocalVideoTrack(videoTrack);
        await client.publish([videoTrack]);
        setIsCamOn(true);
        toast.success('Camera enabled.');
      } else {
        const nextState = !isCamOn;
        await localVideoTrack.setEnabled(nextState);
        setIsCamOn(nextState);
        toast.info(nextState ? 'Camera enabled.' : 'Camera turned off.');
      }
    } catch {
      toast.error('Camera permission blocked or device in use.');
    }
  }, [client, joined, localVideoTrack, isCamOn]);

  // ── Toggle Screen Share ───────────────────────────────────────────────────

  const toggleScreenShare = useCallback(async () => {
    if (!client || !joined) return;
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      if (isScreenSharing) {
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          localVideoTrack.close();
          setLocalVideoTrack(null);
        }
        setIsScreenSharing(false);
        toast.info('Screen sharing stopped.');
      } else {
        const screenTrack = await AgoraRTC.createCustomVideoTrack({
          mediaStreamTrack: (await navigator.mediaDevices.getDisplayMedia({ video: true })).getVideoTracks()[0],
        });

        screenTrack.getMediaStreamTrack().onended = () => {
          setIsScreenSharing(false);
          toast.info('Screen sharing stopped.');
        };

        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          localVideoTrack.close();
        }

        setLocalVideoTrack(screenTrack);
        await client.publish([screenTrack]);
        setIsScreenSharing(true);
        toast.success('Screen sharing started!');
      }
    } catch {
      toast.error('Screen sharing was cancelled.');
    }
  }, [client, joined, isScreenSharing, localVideoTrack]);

  return {
    client,
    joined,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    hasAppId: Boolean(appId),
  };
}
