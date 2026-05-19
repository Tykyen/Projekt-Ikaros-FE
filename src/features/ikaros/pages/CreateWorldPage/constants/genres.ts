import type { ThemeId } from '@/themes/types';
import { DEFAULT_WORLD_THEME } from '@/themes/registry';

/**
 * 5.7a — herní žánry pro wizard tvorby světa. Reforma vzhledů světa
 * (krok 5.7) vrací wizard k původnímu seznamu 11 žánrů + „Vlastní".
 *
 * `world.genre` ukládá `label` (zpětně kompatibilní se staršími světy).
 * `theme` — výchozí vzhled světa pro žánr; dokud nevzniknou žánrové skiny
 * (kroky 5.7b–5.7l), všechny míří na `ikaros`. Volba „Vlastní" → `ikaros`.
 */
export interface GenreOption {
  label: string;
  description: string;
  /** 5.0 — výchozí motiv světa pro tento žánr. */
  theme: ThemeId;
}

export const GENRES: GenreOption[] = [
  { label: 'Fantasy', description: 'Svět magie, mytologie a nadpřirozených sil.', theme: 'fantasy' },
  { label: 'Dark Fantasy', description: 'Fantasy s temným, krutým nebo hororovým nádechem.', theme: 'dark-fantasy' },
  { label: 'Sci-Fi', description: 'Svět technologie, budoucnosti, vesmíru a spekulativní vědy.', theme: 'vesmir' },
  { label: 'Cyberpunk', description: 'Technologická dystopie, korporace, síť, sociální rozklad.', theme: 'cyberpunk' },
  { label: 'Steampunk', description: 'Průmyslová estetika, pára, ozubená kola, viktoriánská technika.', theme: 'steampunk' },
  { label: 'Post-apokalypsa', description: 'Svět po kolapsu civilizace.', theme: 'apokalypsa' },
  { label: 'Horor', description: 'Strach, bezmoc, neznámo, psychický tlak.', theme: 'horor' },
  { label: 'Mystery', description: 'Pátrání, vyšetřování, odhalování tajemství.', theme: 'mystery' },
  { label: 'Historický', description: 'Svět opřený o historické období.', theme: 'historie' },
  { label: 'Současnost', description: 'Příběh v současném nebo nedávném světě bez nadpřirozena.', theme: 'moderni' },
  { label: 'Western', description: 'Divoký západ, hranice civilizace, pistole a prach.', theme: 'western' },
];

export const GENRE_CUSTOM_LABEL = 'Vlastní';

/** 5.7a — výchozí motiv, když žánr není znám (Vlastní / starší svět). */
export const GENRE_FALLBACK_THEME: ThemeId = DEFAULT_WORLD_THEME;

/** 5.0 — odvodí výchozí motiv světa ze žánru (`world.genre` / label). */
export function themeForGenre(genre: string | undefined): ThemeId {
  const found = GENRES.find((g) => g.label === genre);
  return found?.theme ?? GENRE_FALLBACK_THEME;
}
