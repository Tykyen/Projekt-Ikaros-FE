import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '../client';
import { accessTokenAtom } from '../../store/authStore';
import { useSocketEvent } from './useSocket';
import type { UnreadCountResponse } from '../../types';

const QUERY_KEY = ['messages', 'unread-count'];

export function useUnreadCount() {
  const token = useAtomValue(accessTokenAtom);
  const queryClient = useQueryClient();

  // Real-time invalidace při nové zprávě
  useSocketEvent('ikaros:new-message', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  });

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<UnreadCountResponse>('/ikaros-messages/unread-count'),
    enabled: !!token,
    staleTime: 60_000,
    refetchInterval: 60_000, // fallback polling — socket je primární
  });
}
