/**
 * 2.3 — Žánry pro výběr ve formuláři. Pokud uživatel zvolí `Vlastní`,
 * v UI se zobrazí free-text input a do `world.genre` se propíše ten
 * volný řetězec.
 */
export const GENRES = [
  'Fantasy',
  'Sci-Fi',
  'Cyberpunk',
  'Post-apokalypsa',
  'Horror',
  'Mystery',
  'Historický',
  'Moderní / Současný',
  'Western',
  'Vlastní',
] as const;

export const GENRE_CUSTOM_LABEL = 'Vlastní';
export type GenreOption = (typeof GENRES)[number];
