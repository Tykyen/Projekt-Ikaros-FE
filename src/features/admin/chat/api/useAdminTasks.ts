import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { AdminTask, StaffMember } from '../lib/types';

const BASE = '/admin-chat/tasks';

export const adminTaskKeys = {
  list: ['admin-chat', 'tasks'] as const,
  staff: ['admin-chat', 'staff'] as const,
};

/** Všechny úkoly týmu (veřejné mezi adminy). */
export function useAdminTasks() {
  return useQuery({
    queryKey: adminTaskKeys.list,
    queryFn: () => api.get<AdminTask[]>(BASE),
  });
}

/** Všichni členové týmu správy (Superadmin+Admin) — i bez úkolů. */
export function useAdminStaff() {
  return useQuery({
    queryKey: adminTaskKeys.staff,
    queryFn: () => api.get<StaffMember[]>(`${BASE}/staff`),
  });
}

/** Nový úkol. `ownerId` použije jen superadmin (úkol cizímu adminovi). */
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { text: string; ownerId?: string }) =>
      api.post<AdminTask>(BASE, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminTaskKeys.list }),
  });
}

/** Úprava úkolu (text nebo odškrtnutí). BE gate: owner nebo superadmin. */
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      text?: string;
      done?: boolean;
    }) => api.patch<AdminTask>(`${BASE}/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminTaskKeys.list }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminTaskKeys.list }),
  });
}
