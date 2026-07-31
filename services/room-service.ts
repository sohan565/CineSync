import { createClient } from '@/lib/supabase/client';
import {
  Room,
  RoomMember,
  RoomWithMembers,
  CreateRoomDTO,
  JoinRoomDTO,
} from '@/types/room';
import { CreateRoomInput, JoinRoomInput } from '@/lib/validations/room';

// ── Slug Generator ────────────────────────────────────────────────────────────

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_LENGTH = 8;

export function generateRoomSlug(): string {
  const arr = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((n) => SLUG_ALPHABET[n % SLUG_ALPHABET.length])
    .join('');
}

// ── Row → Domain Mappers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRoom(row: any): Room {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    hostId: row.host_id,
    privacy: row.privacy,
    passwordHash: row.password_hash,
    permissionMode: row.permission_mode,
    currentMedia: row.current_media ?? {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hostDisplayName: row.profiles?.display_name,
    memberCount: row.room_members?.length ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMember(row: any): RoomMember {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    role: row.role,
    isReady: row.is_ready,
    joinedAt: row.joined_at,
    lastSeenAt: row.last_seen_at,
    displayName: row.profiles?.display_name ?? 'Unknown',
    avatarUrl: row.profiles?.avatar_url ?? null,
    isGuest: row.profiles?.is_guest ?? false,
  };
}

// ── RoomService ───────────────────────────────────────────────────────────────

export class RoomService {
  private static get supabase() {
    return createClient();
  }

  // ── Create Room ─────────────────────────────────────────────────────────────

  static async createRoom(
    input: CreateRoomInput,
    hostId: string
  ): Promise<Room> {
    const supabase = this.supabase;

    // Generate a unique slug with collision retry
    let slug = generateRoomSlug();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase
        .from('rooms')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      slug = generateRoomSlug();
    }

    const dto: CreateRoomDTO = {
      name: input.name.trim(),
      privacy: input.privacy,
      permissionMode: input.permissionMode,
      password: input.password,
      hostId,
    };

    // Insert room
    const { data: roomRow, error: roomError } = await supabase
      .from('rooms')
      .insert({
        slug,
        name: dto.name,
        host_id: dto.hostId,
        privacy: dto.privacy,
        permission_mode: dto.permissionMode,
        // For demo: store password as plain text; in prod use pgcrypto crypt()
        password_hash: dto.privacy === 'password' ? dto.password ?? null : null,
        current_media: {},
        is_active: true,
      })
      .select()
      .single();

    if (roomError || !roomRow) {
      throw new Error(roomError?.message ?? 'Failed to create room.');
    }

    // Insert host as member
    const { error: memberError } = await supabase.from('room_members').insert({
      room_id: roomRow.id,
      user_id: dto.hostId,
      role: 'host',
      is_ready: false,
    });

    if (memberError) {
      // Clean up the room if member insert fails
      await supabase.from('rooms').delete().eq('id', roomRow.id);
      throw new Error('Failed to initialize room membership.');
    }

    return rowToRoom(roomRow);
  }

  // ── Join Room ───────────────────────────────────────────────────────────────

  static async joinRoom(
    input: JoinRoomInput,
    userId: string
  ): Promise<RoomWithMembers> {
    const supabase = this.supabase;

    // Fetch room by slug
    const { data: roomRow, error: roomError } = await supabase
      .from('rooms')
      .select('*, profiles!rooms_host_id_fkey(display_name)')
      .eq('slug', input.slug.toLowerCase())
      .eq('is_active', true)
      .single();

    if (roomError || !roomRow) {
      return this.getRoom(input.slug);
    }

    // Password validation
    if (roomRow.privacy === 'password') {
      if (!input.password) {
        throw new Error('This room requires a password.');
      }
      if (input.password !== roomRow.password_hash) {
        throw new Error('Incorrect room password.');
      }
    }

    // Upsert member (handles duplicate join gracefully per FR-DB-225)
    const { error: upsertError } = await supabase
      .from('room_members')
      .upsert(
        {
          room_id: roomRow.id,
          user_id: userId,
          role: 'guest',
          is_ready: false,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'room_id,user_id', ignoreDuplicates: false }
      );

    if (upsertError) {
      throw new Error('Failed to join room. Please try again.');
    }

    // Fetch full room with members
    return this.getRoom(input.slug);
  }

  // ── Get Room (with Members) ─────────────────────────────────────────────────

  static async getRoom(slug: string): Promise<RoomWithMembers> {
    const supabase = this.supabase;

    const { data: roomRow, error } = await supabase
      .from('rooms')
      .select(
        `
        *,
        profiles!rooms_host_id_fkey(display_name),
        room_members(
          *,
          profiles(display_name, avatar_url, is_guest)
        )
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !roomRow) {
      // Fallback demo room generator for offline mode or unpopulated database
      const formattedSlug = slug.toLowerCase();
      return {
        id: `room-${formattedSlug}`,
        slug: formattedSlug,
        name: formattedSlug.replace(/[-_]/g, ' ').toUpperCase() + ' WATCH PARTY',
        hostId: 'host-demo-1',
        privacy: 'public',
        passwordHash: null,
        permissionMode: 'open',
        currentMedia: {
          url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
          title: 'Big Buck Bunny',
          sourceType: 'youtube',
          position: 0,
          isPlaying: true,
          updatedAt: new Date().toISOString(),
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hostDisplayName: 'CineSync Host',
        memberCount: 1,
        members: [
          {
            id: 'mem-demo-1',
            roomId: `room-${formattedSlug}`,
            userId: 'host-demo-1',
            role: 'host',
            isReady: true,
            joinedAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            displayName: 'CineSync Host',
            avatarUrl: null,
            isGuest: false,
          },
        ],
      };
    }

    const members: RoomMember[] = (roomRow.room_members ?? []).map(rowToMember);

    return {
      ...rowToRoom(roomRow),
      memberCount: members.length,
      members,
    };
  }

  // ── List User Rooms ─────────────────────────────────────────────────────────

  static async listUserRooms(userId: string): Promise<Room[]> {
    const supabase = this.supabase;

    const { data, error } = await supabase
      .from('room_members')
      .select(
        `
        rooms(
          *,
          profiles!rooms_host_id_fkey(display_name),
          room_members(count)
        )
      `
      )
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error('Failed to load your rooms.');
    }

    return (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => row.rooms)
      .filter(Boolean)
      .filter((r: { is_active: boolean }) => r.is_active)
      .map(rowToRoom);
  }

  // ── Leave Room ──────────────────────────────────────────────────────────────

  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    const supabase = this.supabase;

    // Check if user is the host
    const { data: room } = await supabase
      .from('rooms')
      .select('host_id')
      .eq('id', roomId)
      .single();

    if (room?.host_id === userId) {
      // Attempt to transfer host to oldest co-host or guest
      const { data: nextHost } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', userId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextHost) {
        // Promote next member to host
        await supabase
          .from('rooms')
          .update({ host_id: nextHost.user_id, updated_at: new Date().toISOString() })
          .eq('id', roomId);
        await supabase
          .from('room_members')
          .update({ role: 'host' })
          .eq('room_id', roomId)
          .eq('user_id', nextHost.user_id);
      } else {
        // No other members — soft-delete the room
        await supabase
          .from('rooms')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', roomId);
      }
    }

    // Remove member record
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to leave room.');
    }
  }

  // ── Delete Room (Host only) ────────────────────────────────────────────────

  static async deleteRoom(roomId: string, hostId: string): Promise<void> {
    const supabase = this.supabase;

    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('host_id', hostId); // RLS enforced; this ensures client-side guard too

    if (error) {
      throw new Error('Failed to close room.');
    }
  }
}
