import { useEffect, type PropsWithChildren } from 'react';
import { useAtomValue } from 'jotai';
import { themeAtom } from './state';
import { applyTheme } from './applyTheme';
import { useThemeSync } from './useThemeSync';

export function ThemeProvider({ children }: PropsWithChildren) {
  const themeId = useAtomValue(themeAtom);

  useEffect(() => {
    void applyTheme(themeId);
  }, [themeId]);

  useThemeSync();

  return <>{children}</>;
}
