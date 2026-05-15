import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { IkarosDiscussion, IkarosDiscussionPost } from '@/shared/types';

const PREFIX = '/ikaros-discussions';
export const DISCUSSIONS_KEY = ['discussions'] as const;

/**
 * Spec 3.4 — React Query hooky modulu diskuzí: čtení, CRUD, vlákno příspěvků,
 * workflow akce a moderace.
 */

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: DISCUSSIONS_KEY });
  qc.invalidateQueries({ queryKey: ['pending-actions'] });
}

// ─── Čtení ─────────────────────────────────────────────────────────────────

/** Seznam diskuzí dostupných přihlášenému (BE filtruje dle přístupu). */
export function useDiscussions() {
  return useQuery({
    queryKey: [...DISCUSSIONS_KEY, 'all'],
    queryFn: () => api.get<IkarosDiscussion[]>(PREFIX),
    staleTime: 20_000,
  });
}

export function useDiscussion(id: string | undefined) {
  return useQuery({
    queryKey: [...DISCUSSIONS_KEY, 'detail', id],
    queryFn: () => api.get<IkarosDiscussion>(`${PREFIX}/${id}`),
    enabled: !!id,
  });
}

export function useDiscussionPosts(id: string | undefined) {
  return useQuery({
    queryKey: [...DISCUSSIONS_KEY, 'posts', id],
    queryFn: () => api.get<IkarosDiscussionPost[]>(`${PREFIX}/${id}/posts`),
    enabled: !!id,
  });
}

export interface DiscussionMember {
  id: string;
  username: string;
}

export interface DiscussionMembers {
  managers: DiscussionMember[];
  invited: DiscussionMember[];
  joinRequests: DiscussionMember[];
}

/** Resolvovaní členové diskuze — jen pro manažera/admina (manage panel). */
export function useDiscussionMembers(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...DISCUSSIONS_KEY, 'members', id],
    queryFn: () => api.get<DiscussionMembers>(`${PREFIX}/${id}/members`),
    enabled: !!id && enabled,
  });
}

// ─── CRUD diskuze ──────────────────────────────────────────────────────────

export function useCreateDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; description: string }) =>
      api.post<IkarosDiscussion>(PREFIX, dto),
    onSuccess: () => invalidate(qc),
  });
}

export interface PatchDiscussionDto {
  title?: string;
  description?: string;
  bulletin?: string;
  isOpen?: boolean;
}

export function usePatchDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PatchDiscussionDto }) =>
      api.patch<IkarosDiscussion>(`${PREFIX}/${id}`, dto),
    onSuccess: () => invalidate(qc),
  });
}

// ─── Vlákno příspěvků ──────────────────────────────────────────────────────

export function useAddPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.post<IkarosDiscussionPost>(`${PREFIX}/${id}/posts`, { content }),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postId }: { id: string; postId: string }) =>
      api.delete(`${PREFIX}/${id}/posts/${postId}`),
    onSuccess: () => invalidate(qc),
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: ({
      id,
      postId,
      reason,
    }: {
      id: string;
      postId: string;
      reason: string;
    }) => api.post(`${PREFIX}/${id}/posts/${postId}/report`, { reason }),
  });
}

// ─── Like / oblíbené ───────────────────────────────────────────────────────

export function useToggleLikeDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ isLiked: boolean; likeCount: number }>(
        `${PREFIX}/${id}/toggle-like`,
      ),
    onSuccess: () => invalidate(qc),
  });
}

export function useToggleFavoriteDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ isFavorite: boolean }>(`${PREFIX}/${id}/toggle-favorite`),
    onSuccess: () => invalidate(qc),
  });
}

// ─── Manažeři / pozvánky / přístup ─────────────────────────────────────────

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      api.post<IkarosDiscussion>(`${PREFIX}/${id}/invite`, { userId }),
    onSuccess: () => invalidate(qc),
  });
}

export function useAddManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      api.post<IkarosDiscussion>(`${PREFIX}/${id}/managers/${userId}`),
    onSuccess: () => invalidate(qc),
  });
}

export function useRemoveManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      api.delete(`${PREFIX}/${id}/managers/${userId}`),
    onSuccess: () => invalidate(qc),
  });
}

export function useRequestJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosDiscussion>(`${PREFIX}/${id}/join-request`),
    onSuccess: () => invalidate(qc),
  });
}

// ─── Workflow / moderace (Zpracovat renderery) ─────────────────────────────

export function useApproveDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`${PREFIX}/${id}/approve`),
    onSuccess: () => invalidate(qc),
  });
}

export function useRejectDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`${PREFIX}/${id}/reject`, { reason }),
    onSuccess: () => invalidate(qc),
  });
}

export function useResolveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      discussionId,
      userId,
      accept,
    }: {
      discussionId: string;
      userId: string;
      accept: boolean;
    }) =>
      api.post(
        `${PREFIX}/${discussionId}/join-request/${userId}/resolve`,
        { accept },
      ),
    onSuccess: () => invalidate(qc),
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      deletePost,
    }: {
      reportId: string;
      deletePost: boolean;
    }) => api.post(`${PREFIX}/reports/${reportId}/resolve`, { deletePost }),
    onSuccess: () => invalidate(qc),
  });
}
