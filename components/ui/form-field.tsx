'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  hint?: string;
}

export function FormField({
  id,
  label,
  error,
  children,
  className,
  required,
  hint,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1 text-xs font-medium text-red-400"
        >
          <svg
            className="h-3 w-3 flex-shrink-0"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 9a1 1 0 110-2 1 1 0 010 2zm0-6a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 3z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
