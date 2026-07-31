// ─── Media URL Parser ─────────────────────────────────────────────────────────
// Detects media source type from a URL and extracts relevant metadata.
// Pure functions — safe to unit test with no DOM/network dependencies.

import { ParsedMediaUrl } from '@/types/player';
import { MediaSourceType } from '@/types/room';

// ── YouTube patterns ──────────────────────────────────────────────────────────

const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

export function extractYouTubeId(url: string): string | null {
  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${
    typeof window !== 'undefined' ? window.location.origin : ''
  }&autoplay=0&rel=0&modestbranding=1`;
}

// ── HLS patterns ──────────────────────────────────────────────────────────────

const HLS_PATTERNS = [/\.m3u8(\?.*)?$/i, /\/hls\//i];

function isHLS(url: string): boolean {
  return HLS_PATTERNS.some((p) => p.test(url));
}

// ── MP4/direct video ──────────────────────────────────────────────────────────

const MP4_EXTENSIONS = /\.(mp4|webm|ogg|mov|mkv|avi)(\?.*)?$/i;

function isMp4(url: string): boolean {
  return MP4_EXTENSIONS.test(url);
}

// ── Title guesser from URL ────────────────────────────────────────────────────

function guessTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // e.g. "my-cool-video.mp4" → "my cool video"
    const filename = parsed.pathname.split('/').pop() ?? '';
    return filename
      .replace(/\.[a-z0-9]+$/i, '')   // strip extension
      .replace(/[-_]/g, ' ')          // replace separators
      .replace(/\s+/g, ' ')
      .trim()
      || parsed.hostname;
  } catch {
    return 'Video';
  }
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseMediaUrl(rawUrl: string): ParsedMediaUrl | null {
  const url = rawUrl.trim();
  if (!url) return null;

  // Blob / Local file
  if (url.startsWith('blob:')) {
    return {
      sourceType: 'local',
      canonicalUrl: url,
      titleGuess: 'Local Video File',
    };
  }

  // Validate it's at least a plausible URL
  let validated: string;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    validated = u.href;
  } catch {
    return null;
  }

  // YouTube
  const youtubeId = extractYouTubeId(validated);
  if (youtubeId) {
    return {
      sourceType: 'youtube',
      canonicalUrl: buildYouTubeEmbedUrl(youtubeId),
      youtubeId,
      titleGuess: `YouTube — ${youtubeId}`,
    };
  }

  // HLS
  if (isHLS(validated)) {
    return {
      sourceType: 'hls',
      canonicalUrl: validated,
      titleGuess: guessTitleFromUrl(validated),
    };
  }

  // Direct video file
  if (isMp4(validated)) {
    return {
      sourceType: 'mp4',
      canonicalUrl: validated,
      titleGuess: guessTitleFromUrl(validated),
    };
  }

  // Unknown — default to mp4 adapter (will fail gracefully with an error)
  return {
    sourceType: 'mp4',
    canonicalUrl: validated,
    titleGuess: guessTitleFromUrl(validated),
  };
}

// ── Source type label helper ──────────────────────────────────────────────────

export const SOURCE_LABELS: Record<MediaSourceType, string> = {
  youtube: 'YouTube',
  mp4: 'Direct Video',
  hls: 'Live Stream',
  local: 'Local File',
};

export const SOURCE_COLORS: Record<MediaSourceType, string> = {
  youtube: 'danger',
  mp4: 'info',
  hls: 'warning',
  local: 'default',
};
