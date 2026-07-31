'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast, Toast, ToastVariant } from '@/hooks/use-toast';

// ── Individual Toast ──────────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:
    'border-red-500/30 bg-red-500/10 text-red-300',
  info:
    'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        variantStyles[toast.variant]
      )}
    >
      {variantIcons[toast.variant]}
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="ml-1 flex-shrink-0 opacity-60 hover:opacity-100 focus-visible:outline-none"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Toast Container (global) ──────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, dismiss, cleanup } = useToast();

  useEffect(() => cleanup, [cleanup]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-6 right-4 z-[9999] flex max-w-sm flex-col gap-2 sm:right-6"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
