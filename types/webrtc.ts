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
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};
