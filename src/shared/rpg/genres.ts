import type { ThemeId } from '@/themes/types';
import { DEFAULT_WORLD_THEME } from '@/themes/registry';

/**
 * 5.7a — herní žánry. Zdroj pravdy pro wizard tvorby světa i pro platformové
 * katalogy, které žánr filtrují (nábory 19.3b).
 *
 * ⚠️ **Ukládá se `label`, ne id** (`world.genre === 'Dark Fantasy'`) — zpětná
 * kompatibilita se staršími světy. Nepřejmenovávat labely bez migrace.
 *
 * ⚠️ **Žánr ≠ motiv.** Žánr je datový fakt (o čem se hraje), motiv je vizuální
 * volba (jak to vypadá). Kryjí se skoro 1:1, ale filtrovat se smí jen podle
 * žánru — viz spec 19.3 §12.2.
 *
 * `theme` — výchozí vzhled světa pro žánr; volba „Vlastní" → `ikaros`.
 *
 * Historie: 19.3b — přesunuto z `CreateWorldPage/constants/genres.ts`; wizard
 * re-exportuje beze změny chování.
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

/** Labely 11 registry žánrů — validace do platformové entity (parita BE `@IsIn`). */
export const GENRE_LABELS: readonly string[] = GENRES.map((g) => g.label);

/** Je žánr jeden z 11 známých? („Vlastní" / custom text světa → false.) */
export function isKnownGenre(genre: string | undefined): boolean {
  return !!genre && GENRE_LABELS.includes(genre);
}
