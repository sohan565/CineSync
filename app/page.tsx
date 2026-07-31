import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/site-header';
import { GuestEntryModal } from '@/components/auth/guest-entry-modal';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 py-12 text-center">
        {/* Hero */}
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Watch Videos Together in{' '}
            <span className="text-emerald-500">Perfect Sync</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mx-auto sm:text-lg">
            Browser-based social watch party with sub-second playback sync, live chat,
            emoji reactions, and WebRTC voice & video calls.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/room/demo-room"
              className="rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              + Create Watch Room
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Sign In / Dashboard
            </Link>
          </div>
        </div>

        {/* Guest quick-entry card */}
        <div className="mt-16">
          <GuestEntryModal redirectTo="/room/demo-room" />
        </div>
      </main>
    </>
  );
}
