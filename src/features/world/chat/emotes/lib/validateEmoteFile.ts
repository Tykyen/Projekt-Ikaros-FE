/**
 * Krok 6.4 — FE guard pro upload obrázku emote.
 *
 * BE Cloudinary endpoint přijme cokoli; FE guard chrání UX: rozumný typ,
 * rozumná velikost (≤ 512 KB). Render přes Cloudinary transformaci omezí
 * dimension na 128×128 (`buildEmoteUrl`), takže velký zdroj se nakonec
 * zobrazí malý — ale není důvod nahrávat 5 MB obrázek.
 */

export const ACCEPTED_EMOTE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const;

/** 512 KB. */
export const MAX_EMOTE_BYTES = 512 * 1024;

export type EmoteValidationError =
  | { code: 'INVALID_TYPE'; message: string }
  | { code: 'TOO_LARGE'; message: string };

export interface EmoteValidationResult {
  ok: boolean;
  error?: EmoteValidationError;
}

export function validateEmoteFile(file: File): EmoteValidationResult {
  if (!(ACCEPTED_EMOTE_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TYPE',
        message: 'Povolené formáty: PNG, JPG, GIF, WebP.',
      },
    };
  }
  if (file.size > MAX_EMOTE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'TOO_LARGE',
        message: 'Maximální velikost je 512 KB.',
      },
    };
  }
  return { ok: true };
}
