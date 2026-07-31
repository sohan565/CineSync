// ─── Search & Discovery Domain Types ──────────────────────────────────────────

export type SearchCategory = 'all' | 'movie' | 'tv' | 'youtube';

export interface SearchResultItem {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl?: string;
  releaseYear?: string;
  voteAverage?: number;
  mediaType: 'movie' | 'tv' | 'youtube';
  youtubeUrl: string;
  youtubeId: string;
}

export interface SearchQueryInput {
  query: string;
  category: SearchCategory;
}
