'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';
import { LoginInput } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (data: LoginInput) => {
    await login(data);
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
        aria-label="Login page"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your watch rooms
          </p>
        </div>

        <LoginForm onSubmit={handleLogin} onSuccess={handleSuccess} />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-emerald-500 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Create account
          </Link>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-2">or</span>
          </div>
        </div>

        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-md border border-border bg-transparent py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Continue as Guest
        </Link>
      </main>
    </div>
  );
}
