import { create } from 'zustand';
import { UserProfile } from '@/types/auth';
import { Room, RoomMember } from '@/types/room';
import { PlayerState, MediaSource, DEFAULT_PLAYER_STATE } from '@/types/player';

import { ChatMessage, TypingUser } from '@/types/chat';

// ── UI Slice ──────────────────────────────────────────────────────────────────

export interface UIState {
  mode: 'STANDARD' | 'THEATER' | 'FOCUS';
  activeModal: 'AUTH' | 'CREATE_ROOM' | 'JOIN_ROOM' | 'LOBBY' | 'TMDB' | 'SETTINGS' | 'MEDIA_INPUT' | null;
}

// ── Full Store ────────────────────────────────────────────────────────────────

interface AppStore {
  // Auth slice
  user: UserProfile | null;
  setUser: (user: UserProfile | Partial<UserProfile> | null) => void;

  // UI slice
  ui: UIState;
  setUI: (ui: Partial<UIState>) => void;

  // Room slice
  currentRoom: Room | null;
  members: RoomMember[];
  userRooms: Room[];
  setCurrentRoom: (room: Room | null) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMember: (userId: string, patch: Partial<RoomMember>) => void;
  setUserRooms: (rooms: Room[]) => void;

  // Player slice
  playerState: PlayerState;
  currentMedia: MediaSource | null;
  setPlayerState: (patch: Partial<PlayerState>) => void;
  setCurrentMedia: (media: MediaSource | null) => void;
  resetPlayer: () => void;

  // Chat slice
  messages: ChatMessage[];
  pinnedMessage: ChatMessage | null;
  typingUsers: TypingUser[];
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setPinnedMessage: (message: ChatMessage | null) => void;
  setTypingUser: (user: TypingUser, isTyping: boolean) => void;
  removeMessage: (messageId: string) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  setUser: (userUpdate) => {
    if (userUpdate === null) {
      set({ user: null });
      return;
    }
    const current = get().user;
    if (current && !('id' in userUpdate && 'isGuest' in userUpdate)) {
      set({ user: { ...current, ...(userUpdate as Partial<UserProfile>) } });
    } else {
      set({ user: userUpdate as UserProfile });
    }
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  ui: {
    mode: 'STANDARD',
    activeModal: null,
  },
  setUI: (uiUpdate) =>
    set((state) => ({ ui: { ...state.ui, ...uiUpdate } })),

  // ── Room ──────────────────────────────────────────────────────────────────
  currentRoom: null,
  members: [],
  userRooms: [],

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setMembers: (members) => set({ members }),

  addMember: (member) =>
    set((state) => {
      const exists = state.members.some((m) => m.userId === member.userId);
      if (exists) return state;
      return { members: [...state.members, member] };
    }),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  updateMember: (userId, patch) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, ...patch } : m
      ),
    })),

  setUserRooms: (rooms) => set({ userRooms: rooms }),

  // ── Player ────────────────────────────────────────────────────────────────
  playerState: DEFAULT_PLAYER_STATE,
  currentMedia: null,

  setPlayerState: (patch) =>
    set((state) => ({
      playerState: { ...state.playerState, ...patch },
    })),

  setCurrentMedia: (media) => set({ currentMedia: media }),

  resetPlayer: () =>
    set({
      playerState: DEFAULT_PLAYER_STATE,
      currentMedia: null,
    }),

  // ── Chat ──────────────────────────────────────────────────────────────────
  messages: [],
  pinnedMessage: null,
  typingUsers: [],

  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),

  setMessages: (messages) =>
    set({
      messages,
      pinnedMessage: messages.find((m) => m.isPinned) ?? null,
    }),

  setPinnedMessage: (message) => set({ pinnedMessage: message }),

  setTypingUser: (typingUser, isTyping) =>
    set((state) => {
      if (isTyping) {
        const filtered = state.typingUsers.filter((u) => u.userId !== typingUser.userId);
        return { typingUsers: [...filtered, typingUser] };
      } else {
        return { typingUsers: state.typingUsers.filter((u) => u.userId !== typingUser.userId) };
      }
    }),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
      pinnedMessage: state.pinnedMessage?.id === messageId ? null : state.pinnedMessage,
    })),

  clearChat: () =>
    set({
      messages: [],
      pinnedMessage: null,
      typingUsers: [],
    }),
}));
