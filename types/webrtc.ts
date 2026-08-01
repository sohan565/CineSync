// ─── WebRTC & Media Communication Types ─────────────────────────────────────

export interface MediaStreamState {
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export interface PeerStream {
  peerId: string;
  displayName: string;
  avatarUrl?: string | null;
  stream: MediaStream | null;
  isMicOn: boolean;
  isCamOn: boolean;
  isSpeaking: boolean;
}

export type WebRTCSignalType = 'offer' | 'answer' | 'candidate' | 'state-sync' | 'hello';

export interface WebRTCSignalPayload {
  type: WebRTCSignalType;
  senderId: string;
  targetId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdp?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  candidate?: any;
  mediaState?: MediaStreamState;
}

export const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    // 1. Free Public STUN Nodes (For direct P2P discovery)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },

    // 2. Free OpenRelay / Metered TURN Relay Servers (Port 80 & 443 TCP/UDP bypass for 4G/5G Mobile & CGNAT Firewalls)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turns:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};
