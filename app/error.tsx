'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-recover from browser extension / media iframe DOM removeChild conflicts
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('not a child') ||
      error.name === 'NotFoundError'
    ) {
      console.warn('Auto-recovering from DOM removeChild mutation error:', error);
      reset();
    } else {
      console.error('Unhandled App Router Error:', error);
    }
  }, [error, reset]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        Try again
      </button>
    </div>
  );
}
