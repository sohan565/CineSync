'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Prevent closing on backdrop click */
  persistent?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  persistent = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const descId = description
    ? `modal-desc-${title.replace(/\s+/g, '-').toLowerCase()}`
    : undefined;

  // Sync open state with <dialog> element
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
      // Move focus into dialog
      const firstFocusable = el.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else if (!isOpen && el.open) {
      el.close();
    }
  }, [isOpen]);

  // Handle Escape key and native close event
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const handleClose = () => onClose();
    const handleCancel = (e: Event) => {
      if (persistent) e.preventDefault();
    };

    el.addEventListener('close', handleClose);
    el.addEventListener('cancel', handleCancel);
    return () => {
      el.removeEventListener('close', handleClose);
      el.removeEventListener('cancel', handleCancel);
    };
  }, [onClose, persistent]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (persistent) return;
      if (e.target === dialogRef.current) onClose();
    },
    [onClose, persistent]
  );

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={handleBackdropClick}
      className={cn(
        // Reset browser default styles
        'backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        // Positioning & sizing
        'fixed inset-0 m-auto max-h-[90dvh] w-full max-w-md overflow-y-auto',
        // Visual style
        'rounded-xl border border-border bg-card p-6 shadow-2xl',
        'text-foreground outline-none',
        // Animation
        'animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-xl font-bold text-foreground">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {children}
    </dialog>
  );
}
