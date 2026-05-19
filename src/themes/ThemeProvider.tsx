import { useEffect, type PropsWithChildren } from 'react';
import { useAtomValue } from 'jotai';
import { themeAtom, platformThemePreviewAtom } from './state';
import { applyTheme } from './applyTheme';
import { useThemeSync } from './useThemeSync';
import { currentUserAtom } from '@/shared/store/authStore';
import type { UserThemeSettings } from '@/shared/types';

export function ThemeProvider({ children }: PropsWithChildren) {
  const themeId = useAtomValue(themeAtom);
  const user = useAtomValue(currentUserAtom);
  const preview = useAtomValue(platformThemePreviewAtom);

  // Krok 5.9 — uživatelské barevné override platformy (přístupnost).
  // Editor publikuje náhled; jinak se čte uložené `themeSettings`.
  const settings = user?.themeSettings as UserThemeSettings | undefined;
  const overrides = preview ? preview.overrides : settings?.overrides;
  const overridesKey = overrides ? JSON.stringify(overrides) : '';

  useEffect(() => {
    void applyTheme(themeId, overrides ? { overrides } : undefined);
    // overridesKey v deps — stabilní string místo měnící se reference.
  }, [themeId, overridesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useThemeSync();

  return <>{children}</>;
}
