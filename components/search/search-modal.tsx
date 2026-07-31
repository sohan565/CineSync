'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/use-search';
import { SearchFilterTabs } from '@/components/search/search-filter-tabs';
import { SearchResultCard } from '@/components/search/search-result-card';
import { SearchResultItem } from '@/types/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (url: string, title: string) => void;
  canControl?: boolean;
}

export function SearchModal({
  isOpen,
  onClose,
  onSelectMedia,
  canControl = true,
}: SearchModalProps) {
  const { query, setQuery, category, setCategory, results, isLoading } = useSearch();

  const handleSelect = (item: SearchResultItem) => {
    if (onSelectMedia) {
      onSelectMedia(item.youtubeUrl, item.title);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Movies & Trailers"
      description="Find movies, TV series, or YouTube videos to watch together."
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Search Bar Input */}
        <div className="relative">
          <Input
            id="media-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, genres, or keywords…"
            autoFocus
            className="pl-9"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Category Tabs */}
        <SearchFilterTabs selected={category} onSelect={setCategory} />

        {/* Results List */}
        <div className="max-h-[50dvh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col gap-3 py-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 w-full rounded-xl bg-muted" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <span className="text-3xl" aria-hidden="true">🎬</span>
              <p className="text-sm font-semibold">No media found</p>
              <p className="text-xs">Try searching for a different keyword or category.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onSelect={handleSelect}
                  canControl={canControl}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
