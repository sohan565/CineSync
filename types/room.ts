// ─── Room Domain Types ────────────────────────────────────────────────────────
// Single source of truth for all room-related TypeScript interfaces.
// Mapped 1-to-1 from Database Schema (docs/05-Database/Database-Schema.md).

// ── Enums (mirroring PostgreSQL custom types) ────────────────────────────────

export type UserRole = 'host' | 'cohost' | 'guest';
export type RoomPrivacy = 'public' | 'unlisted' | 'password';
export type PermissionMode = 'open' | 'host_only';
export type MediaSourceType = 'youtube' | 'mp4' | 'hls' | 'local';

// ── Current Media State (stored as JSONB in rooms.current_media) ─────────────

export interface CurrentMedia {
  url: string;
  title?: string;
  sourceType: MediaSourceType;
  /** Playback position in seconds */
  position: number;
  /** true = playing, false = paused */
  isPlaying: boolean;
  updatedAt: string; // ISO timestamp
}

// ── Core Entities ─────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  slug: string;
  name: string;
  hostId: string;
  privacy: RoomPrivacy;
  passwordHash: string | null;
  permissionMode: PermissionMode;
  currentMedia: CurrentMedia | Record<string, never>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Joined from profiles — display name of the host */
  hostDisplayName?: string;
  /** Computed: current member count */
  memberCount?: number;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: UserRole;
  isReady: boolean;
  joinedAt: string;
  lastSeenAt: string;
  /** Joined from profiles */
  displayName: string;
  avatarUrl: string | null;
  /** Guest flag from profiles */
  isGuest: boolean;
}

export interface SavedRoom {
  id: string;
  userId: string;
  roomId: string;
  createdAt: string;
  room?: Room;
}

// ── Service Layer DTOs ────────────────────────────────────────────────────────

export interface CreateRoomDTO {
  name: string;
  privacy: RoomPrivacy;
  permissionMode: PermissionMode;
  password?: string;
  hostId: string;
}

export interface JoinRoomDTO {
  slug: string;
  userId: string;
  password?: string;
}

export interface RoomWithMembers extends Room {
  members: RoomMember[];
}

// ── Store Slice ───────────────────────────────────────────────────────────────

export interface RoomSlice {
  currentRoom: Room | null;
  members: RoomMember[];
  userRooms: Room[];
  setCurrentRoom: (room: Room | null) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMember: (userId: string, patch: Partial<RoomMember>) => void;
  setUserRooms: (rooms: Room[]) => void;
}
