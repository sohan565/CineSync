import React from 'react';
import { SearchCategory } from '@/types/search';
import { cn } from '@/lib/utils';

interface SearchFilterTabsProps {
  selected: SearchCategory;
  onSelect: (category: SearchCategory) => void;
}

const CATEGORIES: Array<{ id: SearchCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'youtube', label: 'Trailers' },
];

export function SearchFilterTabs({ selected, onSelect }: SearchFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter search results by category"
      className="flex gap-1 overflow-x-auto border-b border-border pb-2"
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
              isSelected
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
