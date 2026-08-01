'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/hooks/use-store';
import { RoomMember } from '@/types/room';
import { RoomService } from '@/services/room-service';

export function useRoomMembers(
  slug: string | null,
  roomId: string | null,
  initialMembers: RoomMember[] = []
) {
  const user = useAppStore((s) => s.user);
  const storeMembers = useAppStore((s) => s.members);
  const setMembers = useAppStore((s) => s.setMembers);

  const [members, setLocalMembers] = useState<RoomMember[]>(
    storeMembers.length > 0 ? storeMembers : initialMembers
  );

  // Sync state to local state and Zustand store
  const updateMembersList = useCallback(
    (newList: RoomMember[]) => {
      // Deduplicate by userId
      const uniqueMap = new Map<string, RoomMember>();
      newList.forEach((m) => uniqueMap.set(m.userId, m));
      const deduplicated = Array.from(uniqueMap.values());

      setLocalMembers(deduplicated);
      setMembers(deduplicated);
    },
    [setMembers]
  );

  // Fetch updated room members from database
  const refreshMembers = useCallback(async () => {
    if (!slug) return;
    try {
      const roomData = await RoomService.getRoom(slug);
      if (roomData?.members) {
        updateMembersList(roomData.members);
      }
    } catch {
      /* ignore offline errors */
    }
  }, [slug, updateMembersList]);

  // Initial sync & auto-join room membership
  useEffect(() => {
    if (!slug || !user) return;

    let isMounted = true;

    async function autoJoinAndFetch() {
      try {
        // Ensure local user is registered in the room_members table
        const updatedRoom = await RoomService.joinRoom({ slug: slug! }, user!.id);
        if (isMounted && updatedRoom?.members) {
          updateMembersList(updatedRoom.members);
        }
      } catch {
        if (isMounted && initialMembers.length > 0) {
          updateMembersList(initialMembers);
        }
      }
    }

    autoJoinAndFetch();

    return () => {
      isMounted = false;
    };
  }, [slug, user, initialMembers, updateMembersList]);

  // Real-time Postgres Changes & Presence Subscription
  useEffect(() => {
    if (!slug || !roomId) return;

    const supabase = createClient();
    const topic = `room-members:${slug}`;

    // Clean up pre-cached channel if any
    const existingChannel = supabase.getChannels().find(
      (ch) => ch.topic === topic || ch.topic === `realtime:${topic}`
    );
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase.channel(topic, {
      config: {
        presence: { key: user?.id || 'guest' },
      },
    });

    // 1. Listen for room_members table insertions, updates, and deletions
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          refreshMembers();
        }
      )
      // 2. Listen for Realtime Presence joins/leaves
      .on('presence', { event: 'sync' }, () => {
        refreshMembers();
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        refreshMembers();
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        refreshMembers();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            userId: user?.id,
            displayName: user?.displayName,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, roomId, user, refreshMembers]);

  return members;
}
