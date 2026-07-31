'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function AuthNavBar() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div
        className="h-8 w-24 animate-pulse rounded-md bg-muted"
        role="status"
        aria-label="Loading user session"
      />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          Sign In
        </Link>
        <Link href="/register">
          <Button variant="primary" size="sm">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-500 ring-2 ring-emerald-500/30"
          aria-hidden="true"
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:flex sm:flex-col">
          <span className="text-xs font-semibold leading-none text-foreground">
            {user.displayName}
          </span>
          {user.isGuest && (
            <span className="mt-0.5 text-[10px] text-muted-foreground">Guest</span>
          )}
        </div>
      </div>

      {!user.isGuest ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          Sign Out
        </Button>
      ) : (
        <Link href="/register">
          <Button variant="primary" size="sm">
            Sign Up Free
          </Button>
        </Link>
      )}
    </div>
  );
}
