/**
 * Pomocné funkce pro přílohy chatu (krok 4.3b) — klasifikace, validace
 * výběru, formátování velikosti. Limity zrcadlí BE (`GlobalChatService`).
 */

/** Limit příloh na zprávu — zvlášť pro obrázky a dokumenty (spec 4.3b). */
export const ATTACHMENT_LIMITS = {
  maxImages: 10,
  maxDocs: 4,
  maxBytes: 10 * 1024 * 1024,
} as const;

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const DOC_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Hodnota `accept` pro `<input type="file">`. */
export const ACCEPT_ATTR =
  'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,' +
  '.pdf,.txt,.md,.doc,.docx';

/** Zařadí soubor podle MIME; `null` = nepodporovaný typ. */
export function classifyFile(file: File): 'image' | 'document' | null {
  if (IMAGE_MIME.has(file.type)) return 'image';
  if (DOC_MIME.has(file.type)) return 'document';
  // Některé prohlížeče u .md/.txt vrací prázdný `type` — fallback dle přípony.
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'md' || ext === 'txt') return 'document';
  return null;
}

/** Lidsky čitelná velikost — „1,4 MB" / „820 kB" / „512 B". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Ověří, zda lze soubor přidat k už vybraným přílohám. Vrací českou chybovou
 * hlášku, nebo `null` když je výběr v pořádku.
 */
export function validatePick(existing: File[], file: File): string | null {
  const kind = classifyFile(file);
  if (!kind) return `Nepodporovaný typ souboru: ${file.name}`;
  if (file.size > ATTACHMENT_LIMITS.maxBytes) {
    return `Soubor je větší než 10 MB: ${file.name}`;
  }
  const images = existing.filter((f) => classifyFile(f) === 'image').length;
  const docs = existing.filter((f) => classifyFile(f) === 'document').length;
  if (kind === 'image' && images >= ATTACHMENT_LIMITS.maxImages) {
    return 'Maximálně 10 obrázků na zprávu';
  }
  if (kind === 'document' && docs >= ATTACHMENT_LIMITS.maxDocs) {
    return 'Maximálně 4 dokumenty na zprávu';
  }
  return null;
}
