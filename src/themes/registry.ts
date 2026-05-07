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

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

export const THEMES: Partial<Record<ThemeId, Theme>> = {
  'modre-nebe':   modreNebeTheme,
  'bila':         bilaTheme,
  'temna-cerven': temnaCervenTheme,
  'sci-fi':       sciFiTheme,
  'vesmirna-lod': vesmirnaLodTheme,
  'priroda':      prirodaTheme,
  'pergamen':     pergamenTheme,
  'nemrtvi':      nemrtviTheme,
  'ctyri-zivly':  ctyriZivlyTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME]!;
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES).filter(Boolean) as Theme[];
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
