/**
 * 7.2 — Parse YouTube URL → videoId. Podporuje:
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/embed/ID
 *  - https://www.youtube.com/shorts/ID
 *  - holé `ID` (11 znaků, hex+dash+underscore) → vrátí přímo
 */
export function parseYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Holé ID — 11 znaků [a-zA-Z0-9_-]
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match) return match[1];
  }
  return null;
}

/** Normalizovaná watch URL — pro `youtubeUrl` field v BE (display only). */
export function buildYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
