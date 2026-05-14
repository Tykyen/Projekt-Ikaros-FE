import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import type { AvailabilityResponse } from '@/shared/types';

const DEBOUNCE_MS = 350;
const SLUG_REGEX = /^[a-z0-9-]+$/;

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * 2.3 D-NEW-slug-check — live debounced check, zda je `slug` volný pro
 * vytvoření nového světa. Volá `GET /worlds/slug-available?slug=`.
 *
 * Hook vrací jednu z `SlugStatus`:
 *  - `idle` — žádný slug nebo příliš krátký (< 2)
 *  - `invalid` — slug nesplňuje regex / délku (BE check by selhal)
 *  - `checking` — debouncovaný fetch běží
 *  - `available` — volné
 *  - `taken` — obsazené
 */
export function useSlugAvailability(slug: string): SlugStatus {
  const debounced = useDebouncedValue(slug, DEBOUNCE_MS);

  const formatValid =
    debounced.length >= 2 &&
    debounced.length <= 40 &&
    SLUG_REGEX.test(debounced);

  const query = useQuery<AvailabilityResponse>({
    queryKey: ['worlds', 'slug-available', debounced],
    queryFn: () =>
      api.get<AvailabilityResponse>('/worlds/slug-available', {
        slug: debounced,
      }),
    enabled: formatValid,
    staleTime: 30_000,
    retry: false,
  });

  if (slug.length === 0) return 'idle';
  if (!formatValid) return 'invalid';
  if (slug !== debounced || query.isFetching) return 'checking';
  if (query.data?.available === true) return 'available';
  if (query.data?.available === false) return 'taken';
  return 'idle';
}
