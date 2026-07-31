'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthNavBar } from '@/components/auth/auth-navbar';
import { SearchModal } from '@/components/search/search-modal';
import { Button } from '@/components/ui/button';

import { SettingsModal } from '@/components/settings/settings-modal';

import { NotificationBell } from '@/components/notifications/notification-bell';

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6"
        role="banner"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold text-foreground transition hover:opacity-80"
          aria-label="CineSync home"
        >
          <svg
            className="h-6 w-6 text-emerald-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-lg">CineSync</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSearchOpen(true)}
            aria-label="Search movies and trailers"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            🔍 Search
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ⚙️ Settings
          </Button>

          <NotificationBell />

          <nav aria-label="Main navigation">
            <AuthNavBar />
          </nav>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
