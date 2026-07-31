// ─── Reaction Domain Types ───────────────────────────────────────────────────

export const DEFAULT_REACTION_EMOJIS = ['❤️', '🔥', '🍿', '😂', '👏', '🎉', '😱', '💯'] as const;
export type PresetEmoji = (typeof DEFAULT_REACTION_EMOJIS)[number];

export interface FloatingParticle {
  id: string;
  emoji: string;
  userId: string;
  senderName: string;
  comboCount: number;
  xPercent: number; // 10% to 90% horizontal position
  sizePx: number;   // 24px to 48px based on combo
  createdAt: number;
}

export interface ReactionEventPayload {
  id: string;
  emoji: string;
  userId: string;
  senderName: string;
  comboCount: number;
  xPercent: number;
  sentAt: number;
}
