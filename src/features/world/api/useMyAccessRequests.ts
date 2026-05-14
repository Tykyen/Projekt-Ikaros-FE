import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { MyWorldAccessRequest } from '@/shared/types';

/**
 * Spec 2.4 — pending access requesty current logged-in usera (světy, kde
 * čeká na schválení vstupu). Pre-membership entita (mimo `world_memberships`).
 */
export function useMyAccessRequests() {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['worlds', 'my-access-requests'],
    queryFn: () =>
      api.get<MyWorldAccessRequest[]>('/worlds/my-access-requests'),
    enabled: !!token,
    staleTime: 60_000,
  });
}
