'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GuestForm } from '@/components/auth/guest-form';
import { useAuth } from '@/hooks/use-auth';
import { GuestInput } from '@/lib/validations/auth';

interface GuestEntryPageProps {
  redirectTo?: string;
}

export function GuestEntryModal({ redirectTo = '/' }: GuestEntryPageProps) {
  const router = useRouter();
  const { setGuestProfile } = useAuth();

  const handleGuest = async (data: GuestInput) => {
    await setGuestProfile(data);
  };

  const handleSuccess = () => {
    router.push(redirectTo);
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Join as Guest</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No account needed. Pick a name and jump in.
        </p>
      </div>

      <GuestForm onSubmit={handleGuest} onSuccess={handleSuccess} />

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Want to save rooms?{' '}
        <Link
          href="/register"
          className="font-semibold text-emerald-500 hover:underline"
        >
          Create a free account
        </Link>
      </div>
    </div>
  );
}
