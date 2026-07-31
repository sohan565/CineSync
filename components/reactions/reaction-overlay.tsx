'use client';

import React from 'react';
import { FloatingParticle } from '@/types/reaction';
import { cn } from '@/lib/utils';

interface ReactionOverlayProps {
  particles: FloatingParticle[];
  className?: string;
}

export function ReactionOverlay({ particles, className }: ReactionOverlayProps) {
  if (particles.length === 0) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden z-30',
        className
      )}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bottom-4 flex flex-col items-center animate-[floatUp_2.5s_ease-out_forwards]"
          style={{
            left: `${particle.xPercent}%`,
          }}
        >
          {/* Combo badge */}
          {particle.comboCount > 1 && (
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-black shadow-md animate-bounce">
              {particle.comboCount}x
            </span>
          )}

          {/* Emoji */}
          <span
            className="drop-shadow-md select-none"
            style={{ fontSize: `${particle.sizePx}px` }}
          >
            {particle.emoji}
          </span>

          {/* Sender label */}
          <span className="truncate max-w-[80px] rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white/80 backdrop-blur-xs">
            {particle.senderName}
          </span>
        </div>
      ))}
    </div>
  );
}
