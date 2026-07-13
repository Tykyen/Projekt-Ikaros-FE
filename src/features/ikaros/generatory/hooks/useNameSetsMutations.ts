/**
 * 21.2a — mutace jmenných sad (tvorba, úprava, schválení, smazání).
 * Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createNameSet,
  updateNameSet,
  approveNameSet,
  deleteNameSet,
} from '../api/nameSetsApi';
import type { CreateNameSetPayload, UpdateNameSetPayload } from '../types';

export function useNameSetsMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'name-sets' || q.queryKey[0] === 'name-set',
    });

  const create = useMutation({
    mutationFn: (payload: CreateNameSetPayload) => createNameSet(payload),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: UpdateNameSetPayload }) =>
      updateNameSet(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveNameSet(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNameSet(id),
    onSuccess: invalidateAll,
  });

  return { create, update, approve, remove };
}
