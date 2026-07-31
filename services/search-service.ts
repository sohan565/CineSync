import { SearchResultItem, SearchCategory } from '@/types/search';

// Seed catalog for instant search & offline demo mode
const FEATURED_CATALOG: SearchResultItem[] = [
  {
    id: 'yt-1',
    title: 'Big Buck Bunny',
    overview: 'A large and lovable rabbit deals with bullying forest creatures in this open-source classic.',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
    releaseYear: '2008',
    voteAverage: 8.5,
    mediaType: 'movie',
    youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    youtubeId: 'aqz-KE-bpKQ',
  },
  {
    id: 'yt-2',
    title: 'Inception — Official Trailer',
    overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&q=80',
    releaseYear: '2010',
    voteAverage: 8.8,
    mediaType: 'movie',
    youtubeUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    youtubeId: 'YoHD9XEInc0',
  },
  {
    id: 'yt-3',
    title: 'Interstellar — Main Trailer',
    overview: 'When Earth becomes uninhabitable, a team of astronauts travels through a wormhole in search of a new home for humanity.',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&q=80',
    releaseYear: '2014',
    voteAverage: 8.7,
    mediaType: 'movie',
    youtubeUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    youtubeId: 'zSWdZVtXT7E',
  },
  {
    id: 'yt-4',
    title: 'Stranger Things — Season Trailer',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and a strange little girl.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
    releaseYear: '2016',
    voteAverage: 8.6,
    mediaType: 'tv',
    youtubeUrl: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
    youtubeId: 'b9EkMc79ZSU',
  },
  {
    id: 'yt-5',
    title: 'Cyberpunk 2077 — Night City Trailer',
    overview: 'Explore the neon-drenched metropolis of Night City in an open-world action adventure.',
    posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
    releaseYear: '2020',
    voteAverage: 8.3,
    mediaType: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=qICbYN712iE',
    youtubeId: 'qICbYN712iE',
  },
  {
    id: 'yt-6',
    title: 'Tears of Steel — Sci-Fi Short',
    overview: 'In a dystopian future, a group of scientists and soldiers gather in Amsterdam to stage a desperate last stand against invading robots.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80',
    releaseYear: '2012',
    voteAverage: 7.9,
    mediaType: 'movie',
    youtubeUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
    youtubeId: 'R6MlUcmOul8',
  },
];

export class SearchService {
  /**
   * Search media catalog by query string and optional category filter.
   */
  static async searchMedia(
    query: string,
    category: SearchCategory = 'all'
  ): Promise<SearchResultItem[]> {
    // Artificial 200ms delay to simulate network call & test loading states
    await new Promise((resolve) => setTimeout(resolve, 200));

    const q = query.trim().toLowerCase();

    let results = FEATURED_CATALOG;

    if (q) {
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.overview.toLowerCase().includes(q)
      );
    }

    if (category !== 'all') {
      results = results.filter((item) => item.mediaType === category);
    }

    return results;
  }
}
