import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { IkarosEvent } from '@/shared/types';

const KEY = ['ikaros-events'];

export function useIkarosEvents() {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<IkarosEvent[]>('/ikaros-events'),
    enabled: !!token,
    staleTime: 60_000,
    placeholderData: [],
  });
}

export function useUpcomingIkarosEvents(limit = 5) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: [...KEY, 'upcoming', limit],
    queryFn: () =>
      api.get<IkarosEvent[]>(`/ikaros-events/upcoming?limit=${limit}`),
    enabled: !!token,
    staleTime: 60_000,
    placeholderData: [],
  });
}

interface CreateIkarosEventDto {
  title: string;
  date: string;
  description?: string;
  imageUrl?: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  confirmable?: boolean;
}

export function useCreateIkarosEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIkarosEventDto) =>
      api.post<IkarosEvent>('/ikaros-events', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

interface UpdateIkarosEventDto {
  title?: string;
  date?: string;
  description?: string;
  imageUrl?: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  confirmable?: boolean;
}

export function useUpdateIkarosEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateIkarosEventDto }) =>
      api.put<IkarosEvent>(`/ikaros-events/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteIkarosEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/ikaros-events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useToggleIkarosEventRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosEvent>(`/ikaros-events/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
