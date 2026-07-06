/**
 * FE hooky pro 16.6 — uložení/načtení „hry" v Campu (1 slot per hráč).
 *
 * Saved game je platformový (ne per-svět) snímek: styl + lokace scény +
 * posledních ~20 zpráv. Načtení hry nastaví sdílený blok „Tady jste skončili"
 * (`StartHere`) nad živý log místnosti — BE ho odbroadcastne WS
 * `chat:room:startHere` (+ `chat:room:environment` pro styl/lokaci).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { useSocketEvent } from './useSocket';
import { chatQueryKeys } from './useGlobalChat';
import type { CampSavedGame, RoomKey, StartHere, StartHereEvent } from '../lib/types';

/** Query klíč slotu uložené hry — 1 per hráč (nezávislý na místnosti). */
export const SAVED_GAME_KEY = ['global-chat', 'saved-game'] as const;

/**
 * Uložená hra hráče (16.6) — `null` když hráč zatím nic neuložil.
 * Živě aktualizovaná mutacemi `useSaveGame` / `useDeleteSavedGame`.
 */
export function useSavedGame() {
  return useQuery({
    queryKey: SAVED_GAME_KEY,
    queryFn: () => api.get<CampSavedGame | null>('/global-chat/saved-game'),
  });
}

/**
 * Uloží aktuální scénu místnosti jako hru hráče (přepíše existující slot).
 * BE vrací `201 CampSavedGame`; nasypeme ho rovnou do cache slotu.
 */
export function useSaveGame(room: RoomKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<CampSavedGame>(`/global-chat/rooms/${room}/save-game`),
    onSuccess: (data) => {
      qc.setQueryData(SAVED_GAME_KEY, data);
    },
    onError: (err) => {
      toast.error(`Uložení hry selhalo: ${parseApiError(err)}`);
    },
  });
}

/**
 * Načte uloženou hru → BE nastaví scénu i blok „Tady jste skončili" a
 * odbroadcastne WS `chat:room:startHere` + `chat:room:environment` všem
 * přítomným. Vrací `200 CampSavedGame` (potvrzení, co se načetlo).
 */
export function useLoadGame() {
  return useMutation({
    mutationFn: () =>
      api.post<CampSavedGame>('/global-chat/saved-game/load'),
    onError: (err) => {
      toast.error(`Načtení hry selhalo: ${parseApiError(err)}`);
    },
  });
}

/**
 * Smaže slot uložené hry hráče. BE vrací `200`; cache slotu vynulujeme na `null`.
 */
export function useDeleteSavedGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/global-chat/saved-game'),
    onSuccess: () => {
      qc.setQueryData(SAVED_GAME_KEY, null);
    },
    onError: (err) => {
      toast.error(`Smazání uložené hry selhalo: ${parseApiError(err)}`);
    },
  });
}

/**
 * Aktuální blok „Tady jste skončili" místnosti (16.6) — sdílený stav pro
 * všechny přítomné. Čte se z cache klíče `chatQueryKeys(room).startHere`;
 * plní ho WS `chat:room:startHere` (set při načtení hry, `null` při rotaci
 * scény / clearu). REST se nevolá — jediný zdroj je WS, proto `enabled:false`.
 *
 * @returns aktuální `StartHere`, nebo `null` když blok nesvítí.
 */
export function useStartHere(room: RoomKey): StartHere | null {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: chatQueryKeys(room).startHere,
    queryFn: () => null as StartHere | null,
    enabled: false,
    initialData: null as StartHere | null,
  });

  useSocketEvent<StartHereEvent>('chat:room:startHere', (e) => {
    if (e.room === room) {
      qc.setQueryData(chatQueryKeys(room).startHere, e.startHere);
    }
  });

  return query.data ?? null;
}
