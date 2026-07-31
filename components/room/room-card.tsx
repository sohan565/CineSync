import React from 'react';
import Link from 'next/link';
import { Room, RoomPrivacy } from '@/types/room';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ── Privacy helpers ───────────────────────────────────────────────────────────

const privacyConfig: Record<
  RoomPrivacy,
  { label: string; variant: 'success' | 'info' | 'warning'; icon: string }
> = {
  public: { label: 'Public', variant: 'success', icon: '🌍' },
  unlisted: { label: 'Unlisted', variant: 'info', icon: '🔗' },
  password: { label: 'Protected', variant: 'warning', icon: '🔒' },
};

// ── Room Card ─────────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: Room;
  /** Show "Enter" (already member) vs "Join" (new) */
  isMember?: boolean;
  onLeave?: (roomId: string, slug: string) => void;
}

export function RoomCard({ room, isMember = false, onLeave }: RoomCardProps) {
  const privacy = privacyConfig[room.privacy];

  return (
    <article
      className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-emerald-500/5 hover:shadow-md"
      aria-label={`Watch room: ${room.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-foreground">
            {room.name}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            #{room.slug}
          </p>
        </div>
        <Badge variant={privacy.variant}>
          <span aria-hidden="true">{privacy.icon}</span>
          {privacy.label}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {room.memberCount ?? 0} member{room.memberCount !== 1 ? 's' : ''}
        </span>

        {room.permissionMode === 'open' && (
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Open controls
          </span>
        )}

        <span className="ml-auto">
          {new Date(room.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/room/${room.slug}`} className="flex-1">
          <Button
            variant={isMember ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
          >
            {isMember ? 'Enter Room' : 'Join'}
          </Button>
        </Link>

        {isMember && onLeave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLeave(room.id, room.slug)}
            aria-label={`Leave room ${room.name}`}
            className="text-muted-foreground hover:text-red-400"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </Button>
        )}
      </div>
    </article>
  );
}
