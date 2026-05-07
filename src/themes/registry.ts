import type { Theme, ThemeId, ThemeScope } from './types';
import { modreNebeTheme } from './themes/modre-nebe';
import { bilaTheme } from './themes/bila';
import { temnaCervenTheme } from './themes/temna-cerven';

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

export const THEMES: Partial<Record<ThemeId, Theme>> = {
  'modre-nebe':   modreNebeTheme,
  'bila':         bilaTheme,
  'temna-cerven': temnaCervenTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME]!;
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES).filter(Boolean) as Theme[];
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
