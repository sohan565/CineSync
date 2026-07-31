'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RoomService } from '@/services/room-service';
import { useAppStore } from '@/hooks/use-store';
import { CreateRoomInput, JoinRoomInput } from '@/lib/validations/room';
import { Room, RoomWithMembers } from '@/types/room';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const roomKeys = {
  all: ['rooms'] as const,
  detail: (slug: string) => ['rooms', 'detail', slug] as const,
  userRooms: (userId: string) => ['rooms', 'user', userId] as const,
};

// ── useRoom — fetch single room with members ──────────────────────────────────

export function useRoom(slug: string | null) {
  return useQuery<RoomWithMembers, Error>({
    queryKey: roomKeys.detail(slug ?? ''),
    queryFn: () => RoomService.getRoom(slug!),
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: 1,
  });
}

// ── useUserRooms — list rooms the user has joined ────────────────────────────

export function useUserRooms(userId: string | null) {
  const setUserRooms = useAppStore((s) => s.setUserRooms);

  return useQuery<Room[], Error>({
    queryKey: roomKeys.userRooms(userId ?? ''),
    queryFn: async () => {
      const rooms = await RoomService.listUserRooms(userId!);
      setUserRooms(rooms);
      return rooms;
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
}

// ── useCreateRoom ─────────────────────────────────────────────────────────────

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const setUserRooms = useAppStore((s) => s.setUserRooms);

  return useMutation<Room, Error, CreateRoomInput>({
    mutationFn: (input) => {
      if (!user || user.isGuest) {
        throw new Error('You must be signed in to create a room.');
      }
      return RoomService.createRoom(input, user.id);
    },
    onSuccess: (newRoom) => {
      // Optimistically prepend the new room to user rooms list
      const prev = queryClient.getQueryData<Room[]>(
        roomKeys.userRooms(user?.id ?? '')
      ) ?? [];
      const updated = [newRoom, ...prev];
      queryClient.setQueryData(roomKeys.userRooms(user?.id ?? ''), updated);
      setUserRooms(updated);
    },
  });
}

// ── useJoinRoom ───────────────────────────────────────────────────────────────

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const setCurrentRoom = useAppStore((s) => s.setCurrentRoom);
  const setMembers = useAppStore((s) => s.setMembers);

  return useMutation<RoomWithMembers, Error, JoinRoomInput>({
    mutationFn: (input) => {
      if (!user) throw new Error('You must be signed in or choose a guest name.');
      return RoomService.joinRoom(input, user.id);
    },
    onSuccess: (roomWithMembers) => {
      const { members, ...room } = roomWithMembers;
      setCurrentRoom(room);
      setMembers(members);
      queryClient.setQueryData(roomKeys.detail(room.slug), roomWithMembers);
    },
  });
}

// ── useLeaveRoom ──────────────────────────────────────────────────────────────

export function useLeaveRoom() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const setCurrentRoom = useAppStore((s) => s.setCurrentRoom);
  const setMembers = useAppStore((s) => s.setMembers);

  return useMutation<void, Error, { roomId: string; slug: string }>({
    mutationFn: ({ roomId }) => {
      if (!user) throw new Error('Not authenticated.');
      return RoomService.leaveRoom(roomId, user.id);
    },
    onSuccess: (_, { slug }) => {
      setCurrentRoom(null);
      setMembers([]);
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(slug) });
      queryClient.invalidateQueries({
        queryKey: roomKeys.userRooms(user?.id ?? ''),
      });
    },
  });
}

// ── useDeleteRoom ─────────────────────────────────────────────────────────────

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);

  return useMutation<void, Error, { roomId: string; slug: string }>({
    mutationFn: ({ roomId }) => {
      if (!user) throw new Error('Not authenticated.');
      return RoomService.deleteRoom(roomId, user.id);
    },
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(slug) });
      queryClient.invalidateQueries({
        queryKey: roomKeys.userRooms(user?.id ?? ''),
      });
    },
  });
}
