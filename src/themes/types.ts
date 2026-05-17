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
  | 'slunce';

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
