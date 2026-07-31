'use client';

import React, { useState } from 'react';
import { RoomMember, UserRole } from '@/types/room';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Role config ───────────────────────────────────────────────────────────────

const roleConfig: Record<
  UserRole,
  { label: string; variant: 'success' | 'info' | 'default'; order: number }
> = {
  host: { label: 'Host', variant: 'success', order: 0 },
  cohost: { label: 'Co-host', variant: 'info', order: 1 },
  guest: { label: 'Guest', variant: 'default', order: 2 },
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function MemberAvatar({
  member,
  size = 'md',
}: {
  member: RoomMember;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  const initial = member.displayName.charAt(0).toUpperCase();

  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={`${member.displayName}'s avatar`}
        className={cn('rounded-full object-cover ring-2 ring-border', sizeClass)}
        loading="lazy"
      />
    );
  }

  const hue = member.userId
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center rounded-full font-bold ring-2 ring-border',
        sizeClass
      )}
      style={{ background: `hsl(${hue} 60% 30%)`, color: `hsl(${hue} 80% 80%)` }}
    >
      {initial}
    </div>
  );
}

// ── Member Row ────────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: RoomMember }) {
  const role = roleConfig[member.role];

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="relative flex-shrink-0">
        <MemberAvatar member={member} />
        {/* Online indicator */}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card"
          aria-label="Online"
          title="Online"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {member.displayName}
          {member.isGuest && (
            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
              (guest)
            </span>
          )}
        </span>
        {member.isReady && (
          <span className="text-[10px] text-emerald-400">✓ Ready</span>
        )}
      </div>

      <Badge variant={role.variant}>{role.label}</Badge>
    </li>
  );
}

// ── Members List ──────────────────────────────────────────────────────────────

interface MembersListProps {
  members: RoomMember[];
  className?: string;
  /** Collapse/expand on mobile */
  collapsible?: boolean;
}

export function MembersList({
  members,
  className,
  collapsible = false,
}: MembersListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Sort: host → cohost → guest, then alphabetically within each group
  const sorted = [...members].sort((a, b) => {
    const orderDiff = roleConfig[a.role].order - roleConfig[b.role].order;
    if (orderDiff !== 0) return orderDiff;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => collapsible && setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls="members-list"
        className={cn(
          'flex items-center justify-between gap-2 py-2 text-left',
          collapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        )}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {members.length}
          </span>
          {collapsible && (
            <svg
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform',
                isExpanded ? 'rotate-180' : ''
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </div>
      </button>

      {/* List */}
      {isExpanded && (
        <ul
          id="members-list"
          className="divide-y divide-border"
          aria-label={`${members.length} room member${members.length !== 1 ? 's' : ''}`}
        >
          {sorted.length === 0 ? (
            <li className="py-4 text-center text-xs text-muted-foreground">
              No members yet
            </li>
          ) : (
            sorted.map((m) => <MemberRow key={m.userId} member={m} />)
          )}
        </ul>
      )}
    </div>
  );
}

// ── Compact Avatar Stack (for room cards / header) ────────────────────────────

export function MemberAvatarStack({
  members,
  max = 4,
}: {
  members: RoomMember[];
  max?: number;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div
      className="flex items-center"
      aria-label={`${members.length} member${members.length !== 1 ? 's' : ''}`}
    >
      {visible.map((m, i) => (
        <div
          key={m.userId}
          className="-ml-2 first:ml-0"
          style={{ zIndex: visible.length - i }}
          title={m.displayName}
        >
          <MemberAvatar member={m} size="sm" />
        </div>
      ))}
      {overflow > 0 && (
        <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-card">
          +{overflow}
        </div>
      )}
    </div>
  );
}
