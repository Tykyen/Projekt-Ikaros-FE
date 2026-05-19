import type { Theme, ThemeId, ThemeScope } from './types';
import { modreNebeTheme } from './themes/modre-nebe';
import { bilaTheme } from './themes/bila';
import { temnaCervenTheme } from './themes/temna-cerven';
import { sciFiTheme } from './themes/sci-fi';
import { vesmirnaLodTheme } from './themes/vesmirna-lod';
import { prirodaTheme } from './themes/priroda';
import { pergamenTheme } from './themes/pergamen';
import { nemrtviTheme } from './themes/nemrtvi';
import { ctyriZivlyTheme } from './themes/ctyri-zivly';
import { vesmirnaBitvaTheme } from './themes/vesmirna-bitva';
import { hospodaTheme } from './themes/hospoda';
import { severskeRunyTheme } from './themes/severske-runy';
import { indianeTheme } from './themes/indiane';
import { africkeTheme } from './themes/africke';
import { arabskySvetTheme } from './themes/arabsky-svet';
import { kyberpunkTheme } from './themes/kyberpunk';
import { postapoTheme } from './themes/postapo';
import { magieTheme } from './themes/magie';
import { mesicTheme } from './themes/mesic';
import { slunceTheme } from './themes/slunce';
import { zlatyStandardTheme } from './themes/zlaty-standard';
// Krok 5.7 — světové vzhledy (reforma vzhledů světa).
import { ikarosTheme } from './themes/ikaros';
import { fantasyTheme } from './themes/fantasy';
import { darkFantasyTheme } from './themes/dark-fantasy';
import { vesmirTheme } from './themes/vesmir';
import { cyberpunkTheme } from './themes/cyberpunk';
import { steampunkTheme } from './themes/steampunk';
import { apokalypsaTheme } from './themes/apokalypsa';
import { hororTheme } from './themes/horor';
import { mysteryTheme } from './themes/mystery';
import { historieTheme } from './themes/historie';
import { moderniTheme } from './themes/moderni';
import { westernTheme } from './themes/western';

/** Platformový výchozí motiv (vzhled platformy Ikaros). */
export const DEFAULT_THEME: ThemeId = 'modre-nebe';
/** Krok 5.7 — výchozí vzhled světa (fallback pro `themeForGenre` i světy). */
export const DEFAULT_WORLD_THEME: ThemeId = 'ikaros';

// 21 platformových motivů + světové vzhledy (krok 5.7).
export const THEMES: Record<ThemeId, Theme> = {
  'modre-nebe':     modreNebeTheme,
  'zlaty-standard': zlatyStandardTheme,
  'sci-fi':         sciFiTheme,
  'bila':           bilaTheme,
  'vesmirna-lod':   vesmirnaLodTheme,
  'priroda':        prirodaTheme,
  'pergamen':       pergamenTheme,
  'hospoda':        hospodaTheme,
  'nemrtvi':        nemrtviTheme,
  'temna-cerven':   temnaCervenTheme,
  'ctyri-zivly':    ctyriZivlyTheme,
  'vesmirna-bitva': vesmirnaBitvaTheme,
  'severske-runy':  severskeRunyTheme,
  'indiane':        indianeTheme,
  'africke':        africkeTheme,
  'arabsky-svet':   arabskySvetTheme,
  'kyberpunk':      kyberpunkTheme,
  'postapo':        postapoTheme,
  'magie':          magieTheme,
  'mesic':          mesicTheme,
  'slunce':         slunceTheme,
  // Krok 5.7 — světové vzhledy.
  'ikaros':         ikarosTheme,
  'fantasy':        fantasyTheme,
  'dark-fantasy':   darkFantasyTheme,
  'vesmir':         vesmirTheme,
  'cyberpunk':      cyberpunkTheme,
  'steampunk':      steampunkTheme,
  'apokalypsa':     apokalypsaTheme,
  'horor':          hororTheme,
  'mystery':        mysteryTheme,
  'historie':       historieTheme,
  'moderni':        moderniTheme,
  'western':        westernTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME];
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES);
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
