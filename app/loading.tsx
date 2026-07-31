import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald border-t-transparent"></div>
        <p className="text-sm font-semibold text-muted-foreground">Loading CineSync...</p>
      </div>
    </div>
  );
}
