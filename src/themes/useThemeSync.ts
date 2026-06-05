import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { themeAtom } from './state';
import { currentUserAtom } from '@/shared/store/authStore';
import { api } from '@/shared/api/client';
import type { ThemeId } from './types';
import type { User } from '@/shared/types';

export function useThemeSync(): void {
  const user = useAtomValue(currentUserAtom);
  const [themeId, setThemeId] = useAtom(themeAtom);
  const qc = useQueryClient();
  const previous = useRef<ThemeId | null>(null);
  const initialSynced = useRef(false);

  // Pokud má localStorage uloženou hodnotu (uživatel si již někdy theme zvolil),
  // bere se přednost před BE — chrání proti race conditioně, kdy se rychle
  // refreshne stránka před doběhnutím debounced PATCH (BE má stále starou hodnotu).
  // Pokud localStorage je prázdné (čerstvé zařízení), BE výhrává (cross-device sync).
  const hadStoredThemeAtMount = useRef<boolean>(
    typeof window !== 'undefined' && window.localStorage.getItem('ikaros.theme') !== null,
  );

  // Initial sync.
  // 1.3a: čteme z `user.themeId` (nové explicitní pole). Fallback na legacy
  // `themeSettings.themeId` pro existující dokumenty před migrací.
  useEffect(() => {
    if (!user) return;
    if (initialSynced.current) return;
    initialSynced.current = true;

    const legacyId = (
      user.themeSettings as { themeId?: string } | undefined
    )?.themeId;
    const userThemeId = user.themeId ?? legacyId;

    if (!userThemeId || userThemeId === themeId) {
      previous.current = themeId;
      return;
    }

    if (hadStoredThemeAtMount.current) {
      // Local wins — push localStorage hodnotu do BE, ať se BE dorovná.
      api.patch('/users/me', { themeId }).catch((err: unknown) => {
        console.warn('[theme] BE catchup sync failed:', err);
      });
      previous.current = themeId;
    } else {
      // Fresh device — BE wins.
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
      // 1.3a: posíláme nové explicitní `themeId`. BE DTO ho akceptuje.
      api
        .patch('/users/me', { themeId })
        .then(() => {
          // C-28 — promítni změnu i do ['users','me'] cache → ProfileHeader
          // „Globální motiv" + currentUserAtom (přes hydration bridge).
          qc.setQueryData<User>(['users', 'me'], (old) =>
            old ? { ...old, themeId } : old,
          );
        })
        .catch((err: unknown) => {
          console.warn('[theme] BE sync failed:', err);
        });
    }, 500);

    return () => clearTimeout(handle);
  }, [themeId, user, qc]);
}
