import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { themeAtom } from './state';
import { currentUserAtom } from '../store/authStore';
import { api } from '../api/client';
import type { ThemeId } from './types';

export function useThemeSync(): void {
  const user = useAtomValue(currentUserAtom);
  const themeId = useAtomValue(themeAtom);
  const previous = useRef<ThemeId | null>(null);

  useEffect(() => {
    if (!user) {
      previous.current = themeId;
      return;
    }
    if (previous.current === null) {
      previous.current = themeId;
      return; // initial mount, neposílat
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
