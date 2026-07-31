'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/hooks/use-auth';
import { RegisterInput } from '@/lib/validations/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (data: RegisterInput) => {
    await register(data);
  };

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand */}
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-extrabold text-foreground">
        <svg className="h-6 w-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        CineSync
      </Link>

      <main
        className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl"
        aria-label="Registration page"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save rooms, preferences, and watch history
          </p>
        </div>

        <RegisterForm onSubmit={handleRegister} onSuccess={handleSuccess} />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-emerald-500 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
