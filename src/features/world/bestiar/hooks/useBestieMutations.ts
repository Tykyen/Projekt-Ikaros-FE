/**
 * 10.2d-prep-B — TanStack Mutation hooks pro bestie CRUD + clone.
 * Automaticky invaliduje useBestiar query po success.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBestie,
  updateBestie,
  deleteBestie,
  cloneBestie,
  restoreBestie,
} from '../api/bestiarApi';
import { bestiarQueryKey } from './useBestiar';
import type {
  CreateBestiePayload,
  UpdateBestiePayload,
  CloneBestiePayload,
} from '../types';

export function useBestieMutations(
  worldId: string | null,
  systemId: string | null,
) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: bestiarQueryKey(worldId, systemId) });

  return {
    create: useMutation({
      mutationFn: (payload: CreateBestiePayload) => createBestie(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: UpdateBestiePayload }) =>
        updateBestie(id, patch),
      onSuccess: invalidate,
    }),
    softDelete: useMutation({
      mutationFn: (id: string) => deleteBestie(id),
      onSuccess: invalidate,
    }),
    restore: useMutation({
      mutationFn: (id: string) => restoreBestie(id),
      onSuccess: invalidate,
    }),
    clone: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: CloneBestiePayload }) =>
        cloneBestie(id, payload),
      onSuccess: invalidate,
    }),
  };
}
