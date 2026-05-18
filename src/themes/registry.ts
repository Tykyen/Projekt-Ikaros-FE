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
// Krok 5.0g — 16 žánrových skinů portovaných ze starého Matrixu.
import { fantasyTheme } from './themes/fantasy';
import { heroicTheme } from './themes/heroic';
import { urbanFantasyTheme } from './themes/urban-fantasy';
import { softSciFiTheme } from './themes/soft-sci-fi';
import { biopunkTheme } from './themes/biopunk';
import { postPostapoTheme } from './themes/post-postapo';
import { dystopieTheme } from './themes/dystopie';
import { militaryTheme } from './themes/military';
import { psychoTheme } from './themes/psycho';
import { lovecraftTheme } from './themes/lovecraft';
import { thrillerTheme } from './themes/thriller';
import { altHistorieTheme } from './themes/alt-historie';
import { steampunkTheme } from './themes/steampunk';
import { dieselpunkTheme } from './themes/dieselpunk';
import { weirdTheme } from './themes/weird';
import { grimdarkTheme } from './themes/grimdark';

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

// Plný registry — 37 motivů (21 původních + 16 žánrových z 5.0g).
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
  // Krok 5.0g — žánrové skiny.
  'fantasy':        fantasyTheme,
  'heroic':         heroicTheme,
  'urban-fantasy':  urbanFantasyTheme,
  'soft-sci-fi':    softSciFiTheme,
  'biopunk':        biopunkTheme,
  'post-postapo':   postPostapoTheme,
  'dystopie':       dystopieTheme,
  'military':       militaryTheme,
  'psycho':         psychoTheme,
  'lovecraft':      lovecraftTheme,
  'thriller':       thrillerTheme,
  'alt-historie':   altHistorieTheme,
  'steampunk':      steampunkTheme,
  'dieselpunk':     dieselpunkTheme,
  'weird':          weirdTheme,
  'grimdark':       grimdarkTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME];
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES);
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
