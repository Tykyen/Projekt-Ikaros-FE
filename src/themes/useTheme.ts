import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { themeAtom } from './state';
import { getTheme } from './registry';
import type { ThemeId } from './types';

export function useTheme() {
  const [themeId, setThemeId] = useAtom(themeAtom);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setThemeId(id);
      // applyTheme is invoked by ThemeProvider's effect on themeId change.
    },
    [setThemeId],
  );

  return {
    themeId,
    theme: getTheme(themeId),
    setTheme,
  };
}
