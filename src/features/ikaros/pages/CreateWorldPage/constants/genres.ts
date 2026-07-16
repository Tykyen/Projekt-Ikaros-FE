/**
 * 5.7a — herní žánry pro wizard tvorby světa.
 *
 * 19.3b — zdroj pravdy přesunut do `shared/rpg/genres.ts` (žánr filtrují i
 * nábory, není to už wizard-only věc). Tady zůstává re-export pod původními
 * jmény; chování beze změny.
 */
export type { GenreOption } from '@/shared/rpg/genres';
export {
  GENRES,
  GENRE_CUSTOM_LABEL,
  GENRE_FALLBACK_THEME,
  themeForGenre,
} from '@/shared/rpg/genres';
