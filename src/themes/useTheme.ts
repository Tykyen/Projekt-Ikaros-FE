import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { themeAtom } from './state';
import { applyTheme } from './applyTheme';
import { getTheme } from './registry';
import type { ThemeId } from './types';

export function useTheme() {
  const [themeId, setThemeId] = useAtom(themeAtom);

  const setTheme = useCallback(
    async (id: ThemeId) => {
      setThemeId(id);
      await applyTheme(id);
    },
    [setThemeId],
  );

  return {
    themeId,
    theme: getTheme(themeId),
    setTheme,
  };
}
