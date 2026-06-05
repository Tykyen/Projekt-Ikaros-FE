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
import type {
  CreateBestiePayload,
  UpdateBestiePayload,
  CloneBestiePayload,
} from '../types';

export function useBestieMutations(
  // C-33 — worldId se po přechodu na predicate-invalidaci už nečte, ale necháváme
  // ho v signatuře (volající ho předávají pozicně). Prefix `_` = záměrně nepoužité.
  _worldId: string | null,
  systemId: string | null,
) {
  const queryClient = useQueryClient();
  // C-33 — system/user-scope bestie jsou cross-world; klíč ['bestiar', worldId,
  // systemId] nese worldId, takže přesný klíč by minul ostatní otevřené světy se
  // stejnými globálními/uživatelskými bestiemi. Invaliduj všechny světy téhož systému.
  const invalidate = () =>
    queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'bestiar' && q.queryKey[2] === (systemId ?? 'none'),
    });

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
