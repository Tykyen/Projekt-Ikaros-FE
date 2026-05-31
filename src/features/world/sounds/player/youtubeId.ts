/**
 * 13.3 — Extrakce YouTube video ID z URL.
 *
 * Pokrývá běžné tvary: watch?v=, youtu.be/, embed/, /v/, shorts/, music.
 * Vrací 11znakové video ID nebo null (nevalidní vstup).
 */
const YT_ID_RE =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?(?:.*&)?v=)|music\.youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/;

export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Holé 11znakové ID (uživatel vloží jen ID).
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(YT_ID_RE);
  return match ? match[1] : null;
}

/** Více URL → seznam validních video ID (zahodí nevalidní). */
export function extractYoutubeIds(urls: Array<string | null | undefined>): string[] {
  return urls
    .map((u) => extractYoutubeId(u))
    .filter((id): id is string => id !== null);
}
