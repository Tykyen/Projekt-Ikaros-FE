export type ThemeId =
  | 'modre-nebe'
  | 'zlaty-standard'
  | 'sci-fi'
  | 'bila'
  | 'vesmirna-lod'
  | 'priroda'
  | 'pergamen'
  | 'nemrtvi'
  | 'ctyri-zivly'
  | 'vesmirna-bitva'
  | 'hospoda'
  | 'severske-runy'
  | 'indiane'
  | 'africke'
  | 'arabsky-svet'
  | 'kyberpunk'
  | 'postapo'
  | 'temna-cerven'
  | 'magie'
  | 'mesic'
  | 'slunce'
  // Krok 5.0g — port 16 žánrových skinů ze starého Matrixu.
  | 'fantasy'
  | 'heroic'
  | 'urban-fantasy'
  | 'soft-sci-fi'
  | 'biopunk'
  | 'post-postapo'
  | 'dystopie'
  | 'military'
  | 'psycho'
  | 'lovecraft'
  | 'thriller'
  | 'alt-historie'
  | 'steampunk'
  | 'dieselpunk'
  | 'weird'
  | 'grimdark';

/**
 * `platform` — jen platforma Ikaros · `world` — jen světy (krok 5.0) ·
 * `both` — obojí. `listThemes(scope)` filtruje `scope === arg || 'both'`.
 */
export type ThemeScope = 'platform' | 'world' | 'both';

export type ThemeFonts = {
  display?: string;
  logo?: string;
  body?: string;
};

export type ThemeReducedMotion = 'safe' | 'heavy';

export type Theme = {
  id: ThemeId;
  name: string;
  scope: ThemeScope;
  atmosphere: string;
  vars: Record<string, string>;
  fonts: ThemeFonts;
  thumbnail: string;
  background: string | null;
  decorationsModule: () => Promise<unknown>;
  reducedMotion?: ThemeReducedMotion;
};
