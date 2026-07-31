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
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
