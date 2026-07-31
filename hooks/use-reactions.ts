'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ReactionService } from '@/services/reaction-service';
import { FloatingParticle, ReactionEventPayload } from '@/types/reaction';
import { useAppStore } from '@/hooks/use-store';

const COMBO_RESET_MS = 1500;
const PARTICLE_LIFESPAN_MS = 2500;
const MAX_PARTICLES = 50;

export function useReactions(slug: string | null) {
  const user = useAppStore((s) => s.user);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  // Combo tracker state per emoji
  const comboRef = useRef<{ emoji: string; count: number; timer: ReturnType<typeof setTimeout> | null }>({
    emoji: '',
    count: 0,
    timer: null,
  });

  const addParticle = useCallback((payload: ReactionEventPayload) => {
    const particle: FloatingParticle = {
      id: payload.id,
      emoji: payload.emoji,
      userId: payload.userId,
      senderName: payload.senderName,
      comboCount: payload.comboCount,
      xPercent: payload.xPercent,
      sizePx: Math.min(48, 24 + Math.min(payload.comboCount, 10) * 2.4),
      createdAt: Date.now(),
    };

    setParticles((prev) => {
      const updated = [...prev, particle];
      if (updated.length > MAX_PARTICLES) {
        return updated.slice(updated.length - MAX_PARTICLES);
      }
      return updated;
    });

    // Schedule particle removal after lifespan
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particle.id));
    }, PARTICLE_LIFESPAN_MS);
  }, []);

  // Subscribe to realtime reactions from room members
  useEffect(() => {
    if (!slug) return;

    const cleanup = ReactionService.subscribeToReactions(slug, (payload) => {
      addParticle(payload);
    });

    return () => {
      cleanup();
    };
  }, [slug, addParticle]);

  // Trigger a reaction locally and broadcast
  const triggerReaction = useCallback(
    (emoji: string) => {
      if (!slug || !user) return;

      // Handle combo count
      let currentCombo = 1;
      if (comboRef.current.emoji === emoji) {
        currentCombo = comboRef.current.count + 1;
      }

      if (comboRef.current.timer) clearTimeout(comboRef.current.timer);
      comboRef.current = {
        emoji,
        count: currentCombo,
        timer: setTimeout(() => {
          comboRef.current = { emoji: '', count: 0, timer: null };
        }, COMBO_RESET_MS),
      };

      const xPercent = Math.floor(Math.random() * 80) + 10; // 10% to 90%
      const payload: ReactionEventPayload = {
        id: Math.random().toString(36).substring(2, 9),
        emoji,
        userId: user.id,
        senderName: user.displayName,
        comboCount: currentCombo,
        xPercent,
        sentAt: Date.now(),
      };

      // Render particle locally immediately
      addParticle(payload);

      // Broadcast to room members
      ReactionService.broadcastReaction(slug, payload);
    },
    [slug, user, addParticle]
  );

  return {
    particles,
    triggerReaction,
  };
}
