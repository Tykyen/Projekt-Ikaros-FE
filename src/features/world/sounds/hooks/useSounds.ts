/**
 * 13.3 — Sounds query hooky (TanStack Query).
 */
import { useQuery } from '@tanstack/react-query';
import { soundsApi } from '../api/soundsApi';

/** Zvuky světa (všechny statusy — list per-world). */
export function useWorldSounds(worldId: string | null) {
  return useQuery({
    queryKey: ['sounds', 'world', worldId],
    queryFn: () => soundsApi.listWorld(worldId as string),
    enabled: Boolean(worldId),
  });
}

/** Globální schválené zvuky (zdroj pro import). */
export function useGlobalSounds(enabled = true) {
  return useQuery({
    queryKey: ['sounds', 'global'],
    queryFn: () => soundsApi.listGlobal(),
    enabled,
  });
}

/** Nominace čekající na schválení (Admin+). */
export function usePendingSounds(enabled = true) {
  return useQuery({
    queryKey: ['sounds', 'pending'],
    queryFn: () => soundsApi.listPending(),
    enabled,
  });
}
