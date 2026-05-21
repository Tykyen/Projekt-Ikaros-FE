import type { WorldEmoteSet } from '@/features/world/chat/lib/renderChatContent';
import type { WorldEmote } from './types';
import { buildEmoteUrl } from './buildEmoteUrl';

/**
 * Krok 6.4 — sjednotí globální + per-svět emoty do mapy pro `renderChatContent`.
 *
 * **Per-svět má prioritu** — pokud kolidují shortcode, svět přebíjí globální.
 * Důvod: PJ světa může chtít „přepsat" globální `:smile:` vlastní variantou
 * specifickou pro svůj svět.
 *
 * Mapa je `shortcode (lowercase) → transformed URL`. Renderer matchuje
 * `:shortcode:` regex case-insensitive, takže klíče jsou lowercased.
 */
export function mergeEmoteSets(
  worldEmotes: WorldEmote[],
  globalEmotes: WorldEmote[],
): WorldEmoteSet {
  const byShortcode = new Map<string, string>();
  // Globální nejdřív, per-svět je přepíše.
  for (const e of globalEmotes) {
    byShortcode.set(e.shortcode.toLowerCase(), buildEmoteUrl(e.imageUrl));
  }
  for (const e of worldEmotes) {
    byShortcode.set(e.shortcode.toLowerCase(), buildEmoteUrl(e.imageUrl));
  }
  return { byShortcode };
}
