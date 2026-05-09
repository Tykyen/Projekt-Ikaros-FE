import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import type { AvailabilityResponse } from '@/shared/types';

const DEBOUNCE_MS = 400;

/**
 * Live debounced check, zda je username v BE dostupný pro registraci.
 * Vrátí TanStack Query result. Enabled jen když value vypadá rozumně
 * (3-32 znaků, bez @) — jinak `available: false` z BE early return.
 */
export function useCheckUsername(value: string) {
  const debounced = useDebouncedValue(value, DEBOUNCE_MS);
  const enabled =
    debounced.length >= 3 &&
    debounced.length <= 32 &&
    !debounced.includes('@');

  return useQuery<AvailabilityResponse>({
    queryKey: ['check-username', debounced],
    queryFn: () =>
      api.get<AvailabilityResponse>('/auth/check-username', { u: debounced }),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Live debounced check, zda je e-mail v BE dostupný pro registraci.
 */
export function useCheckEmail(value: string) {
  const debounced = useDebouncedValue(value, DEBOUNCE_MS);
  const enabled =
    debounced.length >= 5 &&
    debounced.length <= 255 &&
    debounced.includes('@');

  return useQuery<AvailabilityResponse>({
    queryKey: ['check-email', debounced],
    queryFn: () =>
      api.get<AvailabilityResponse>('/auth/check-email', { e: debounced }),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}
