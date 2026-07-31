'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchService } from '@/services/search-service';
import { SearchResultItem, SearchCategory } from '@/types/search';

export function useSearch(initialQuery = '', initialCategory: SearchCategory = 'all') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);

  // Debounce query changes by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading, error } = useQuery<SearchResultItem[], Error>({
    queryKey: ['search', debouncedQuery, category],
    queryFn: () => SearchService.searchMedia(debouncedQuery, category),
    staleTime: 60_000,
  });

  return {
    query,
    setQuery,
    category,
    setCategory,
    results,
    isLoading,
    error,
  };
}
