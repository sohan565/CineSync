'use client';

import React from 'react';
import { SearchResultItem } from '@/types/search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchResultCardProps {
  item: SearchResultItem;
  onSelect: (item: SearchResultItem) => void;
  canControl?: boolean;
}

export function SearchResultCard({
  item,
  onSelect,
  canControl = true,
}: SearchResultCardProps) {
  return (
    <article
      className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition-all hover:border-emerald-500/40 hover:shadow-md"
      aria-label={`Search result: ${item.title}`}
    >
      {/* Poster Thumbnail */}
      <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.posterUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {item.voteAverage && (
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[10px] font-bold text-yellow-400 backdrop-blur-xs">
            ★ {item.voteAverage.toFixed(1)}
          </span>
        )}
      </div>

      {/* Info & Actions */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-bold text-foreground">
              {item.title}
            </h4>
            <Badge variant="outline" className="capitalize text-[10px]">
              {item.mediaType}
            </Badge>
          </div>

          {item.releaseYear && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {item.releaseYear}
            </p>
          )}

          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {item.overview}
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canControl}
            onClick={() => onSelect(item)}
            aria-label={`Play ${item.title} trailer in room`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Play in Room
          </Button>
        </div>
      </div>
    </article>
  );
}
