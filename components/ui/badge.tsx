import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  danger: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  outline: 'border border-border text-muted-foreground',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
