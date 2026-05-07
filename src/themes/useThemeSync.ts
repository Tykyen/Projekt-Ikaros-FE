import { useEffect, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { themeAtom } from './state';
import { currentUserAtom } from '../store/authStore';
import { api } from '../api/client';
import type { ThemeId } from './types';

export function useThemeSync(): void {
  const user = useAtomValue(currentUserAtom);
  const [themeId, setThemeId] = useAtom(themeAtom);
  const previous = useRef<ThemeId | null>(null);
  const initialSynced = useRef(false);

  // Initial sync: pokud user má themeId a liší se od localStorage, BE výhrává
  useEffect(() => {
    if (!user) return;
    if (initialSynced.current) return;
    initialSynced.current = true;

    const userThemeId = (user as { themeId?: string }).themeId;
    if (userThemeId && userThemeId !== themeId) {
      setThemeId(userThemeId as ThemeId);
      previous.current = userThemeId as ThemeId;
    }
  }, [user, themeId, setThemeId]);

  // Outbound sync: na změnu posílá PATCH (debounced 500ms)
  useEffect(() => {
    if (!user) {
      previous.current = themeId;
      return;
    }
    if (previous.current === null) {
      previous.current = themeId;
      return;
    }
    if (previous.current === themeId) return;
    previous.current = themeId;

    const handle = setTimeout(() => {
      api.patch('/users/me', { themeId }).catch((err: { response?: { status?: number } }) => {
        if (err?.response?.status === 404) {
          console.warn('[theme] BE sync skipped — endpoint /users/me theme not implemented yet');
          return;
        }
        console.warn('[theme] BE sync failed:', err);
      });
    }, 500);

    return () => clearTimeout(handle);
  }, [themeId, user]);
}
