'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  hasError?: boolean;
  ariaDescribedBy?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ariaDescribedBy, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground',
          'placeholder:text-muted-foreground/60',
          'outline-none ring-0 transition-all duration-150',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-border',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
