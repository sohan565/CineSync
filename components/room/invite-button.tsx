'use client';

import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface InviteButtonProps {
  slug: string;
  className?: string;
}

export function InviteButton({ slug, className }: InviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const getInviteUrl = () =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${slug}`
      : `/room/${slug}`;

  const handleCopy = async () => {
    const url = getInviteUrl();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers without Clipboard API
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link. Try copying it manually.');
    }
  };

  const inviteUrl = getInviteUrl();

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {/* URL display */}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <svg
          className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span
          className="truncate font-mono text-xs text-muted-foreground"
          title={inviteUrl}
          aria-label="Invite link"
        >
          {inviteUrl}
        </span>
      </div>

      {/* Copy button */}
      <Button
        variant={copied ? 'primary' : 'secondary'}
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy invite link'}
        className="flex-shrink-0 transition-all"
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy Link
          </>
        )}
      </Button>
    </div>
  );
}
