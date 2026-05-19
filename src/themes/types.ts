export type ThemeId =
  // 21 platformových motivů (vzhled platformy Ikaros).
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
  // Krok 5.7 — světové vzhledy (reforma vzhledů světa).
  | 'ikaros'
  | 'fantasy'
  | 'dark-fantasy'
  | 'vesmir'
  | 'cyberpunk'
  | 'steampunk'
  | 'apokalypsa'
  | 'horor'
  | 'mystery'
  | 'historie'
  | 'moderni'
  | 'western';

/**
 * `platform` — jen platforma Ikaros · `world` — jen světy (krok 5.0) ·
 * `both` — obojí. `listThemes(scope)` filtruje `scope === arg || 'both'`.
 */
export type ThemeScope = 'platform' | 'world' | 'both';

/** Krok 5.7a — JS canvas efekt vrstvený nad pozadím skinu. */
export type ThemeEffect = 'matrix-rain';

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
  /** Krok 5.7a — volitelný JS canvas efekt (Matrix rain u `ikaros`). */
  effect?: ThemeEffect;
};
