'use client';

import { useState, useCallback, useRef } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

// ── Singleton store (module-level) ────────────────────────────────────────────
// Avoids needing a Context provider while keeping the hook simple.

type Listener = (toasts: Toast[]) => void;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

function addToast(message: string, variant: ToastVariant, duration = 3500) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, variant }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, duration);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

// ── Public hook ───────────────────────────────────────────────────────────────

export function useToast() {
  const [, rerender] = useState(0);
  const listenerRef = useRef<Listener | null>(null);

  if (!listenerRef.current) {
    listenerRef.current = () => rerender((n) => n + 1);
    listeners.add(listenerRef.current);
  }

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (listenerRef.current) {
      listeners.delete(listenerRef.current);
    }
  }, []);

  // React 18 compatible cleanup via useEffect is handled in ToastContainer
  return {
    toasts,
    toast: {
      success: (msg: string) => addToast(msg, 'success'),
      error: (msg: string) => addToast(msg, 'error'),
      info: (msg: string) => addToast(msg, 'info'),
    },
    dismiss: removeToast,
    cleanup,
  };
}

// ── Imperative helper (usable outside React) ──────────────────────────────────

export const toast = {
  success: (msg: string) => addToast(msg, 'success'),
  error: (msg: string) => addToast(msg, 'error'),
  info: (msg: string) => addToast(msg, 'info'),
};
