import type { Theme, ThemeId, ThemeScope } from './types';
import { modreNebeTheme } from './themes/modre-nebe';

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

export const THEMES: Partial<Record<ThemeId, Theme>> = {
  'modre-nebe': modreNebeTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME]!;
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES).filter(Boolean) as Theme[];
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
