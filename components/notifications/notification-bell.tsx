'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  slug?: string | null;
  className?: string;
}

export function NotificationBell({ slug = null, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications(slug);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-black shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Activity notifications"
          className="absolute right-0 top-11 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Activity Feed
            </h3>
            {notifications.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto p-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No recent activity.
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
