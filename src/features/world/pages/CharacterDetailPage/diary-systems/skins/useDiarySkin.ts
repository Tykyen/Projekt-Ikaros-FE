/**
 * 16.2c — Hook pro skin deníku (per uživatel × svět).
 *
 * Zdroj pravdy = `WorldMembership.diarySkin` (z `['worlds','my']` query přes
 * `useWorldStatus`). Když člen volbu nemá (nebo je neplatná), resolvuje se
 * default dle `world.system` (`resolveDefaultSkin`).
 *
 * Setter zapisuje přes `members/me/theme` (`useUpdateMyWorldTheme`) +
 * optimisticky upraví cache `['worlds','my']`, takže `data-diary-skin`
 * přepne okamžitě bez čekání na refetch. Při chybě se cache vrátí.
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { useUpdateMyWorldTheme } from '@/features/world/api/useUpdateMyWorldTheme';
import type { MyWorldEntry } from '@/shared/types';
import {
  type DiarySkinId,
  isDiarySkin,
  resolveDefaultSkin,
} from './registry';

interface UseDiarySkinResult {
  /** Aktivní skin (členova volba, nebo default dle systému). */
  skin: DiarySkinId;
  /** True, pokud člen má vlastní (explicitní) volbu skinu. */
  isExplicit: boolean;
  /** Změní skin člena (self). Optimistic + persist přes BE. */
  setSkin: (next: DiarySkinId) => void;
  /** True během běžícího zápisu. */
  isPending: boolean;
}

const MY_WORLDS_KEY = ['worlds', 'my'] as const;

/**
 * @param worldId Mongo ObjectId světa (z `WorldContext`). Prázdný = hook
 *   běží bez efektu (skin = default; svět ještě neloaded).
 */
export function useDiarySkin(worldId: string): UseDiarySkinResult {
  const { world } = useWorldContext();
  const { membership } = useWorldStatus(worldId);
  const qc = useQueryClient();
  const mutation = useUpdateMyWorldTheme(worldId);

  const stored = membership?.diarySkin;
  const isExplicit = isDiarySkin(stored);
  const skin: DiarySkinId = isExplicit
    ? stored
    : resolveDefaultSkin(world?.system);

  const setSkin = useCallback(
    (next: DiarySkinId) => {
      if (next === skin && isExplicit) return;

      // Optimistic — přepiš diarySkin v ['worlds','my'] cache hned.
      const prev = qc.getQueryData<MyWorldEntry[]>(MY_WORLDS_KEY);
      if (prev) {
        qc.setQueryData<MyWorldEntry[]>(
          MY_WORLDS_KEY,
          prev.map((e) =>
            e.world.id === worldId
              ? { ...e, membership: { ...e.membership, diarySkin: next } }
              : e,
          ),
        );
      }

      mutation.mutate(
        { diarySkin: next },
        {
          onError: () => {
            // Rollback na předchozí cache; finální pravda dorazí refetchem.
            if (prev) qc.setQueryData(MY_WORLDS_KEY, prev);
          },
        },
      );
    },
    [skin, isExplicit, qc, worldId, mutation],
  );

  return { skin, isExplicit, setSkin, isPending: mutation.isPending };
}
