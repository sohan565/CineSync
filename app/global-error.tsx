'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
        <h2 className="text-3xl font-extrabold text-destructive">Fatal Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
        >
          Reset Application
        </button>
      </body>
    </html>
  );
}
