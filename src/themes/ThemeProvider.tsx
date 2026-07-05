import { useEffect, type PropsWithChildren } from 'react';
import { useAtomValue } from 'jotai';
import {
  themeAtom,
  platformThemePreviewAtom,
  worldThemeActiveAtom,
} from './state';
import { applyTheme } from './applyTheme';
import { useThemeSync } from './useThemeSync';
import { currentUserAtom } from '@/shared/store/authStore';
import type { UserThemeSettings } from '@/shared/types';

export function ThemeProvider({ children }: PropsWithChildren) {
  const themeId = useAtomValue(themeAtom);
  const user = useAtomValue(currentUserAtom);
  const preview = useAtomValue(platformThemePreviewAtom);
  // Dokud je mountnutý WorldLayout, `:root` vlastní svět — globální apply se
  // přeskočí, aby nepřepsal world skin (race po opuštění profilu, viz atom).
  const worldThemeActive = useAtomValue(worldThemeActiveAtom);

  // Krok 5.9 — uživatelské barevné override platformy (přístupnost).
  // Editor publikuje náhled; jinak se čte uložené `themeSettings`.
  const settings = user?.themeSettings as UserThemeSettings | undefined;
  const overrides = preview ? preview.overrides : settings?.overrides;
  const overridesKey = overrides ? JSON.stringify(overrides) : '';

  useEffect(() => {
    if (worldThemeActive) return;
    void applyTheme(themeId, overrides ? { overrides } : undefined);
    // overridesKey v deps — stabilní string místo měnící se reference.
  }, [themeId, overridesKey, worldThemeActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spec 5.9c — velikost rozhraní. `zoom` na <html> zvětší CELOU app (px i rem,
  // portály/modaly taky) → jeden ovladač pokryje platformu, světy i chaty.
  // Platí i uvnitř WorldLayout, proto NENÍ pod `worldThemeActive` gate. Mapa se
  // vrací na 1:1 přes `--ui-scale` (viz TacticalMapView.module.css).
  const uiScale = preview?.uiScale ?? settings?.uiScale ?? 1;
  useEffect(() => {
    const el = document.documentElement;
    if (uiScale && uiScale !== 1) {
      el.style.setProperty('--ui-scale', String(uiScale));
      el.style.setProperty('zoom', String(uiScale));
    } else {
      el.style.removeProperty('--ui-scale');
      el.style.removeProperty('zoom');
    }
  }, [uiScale]);

  useThemeSync();

  return <>{children}</>;
}
