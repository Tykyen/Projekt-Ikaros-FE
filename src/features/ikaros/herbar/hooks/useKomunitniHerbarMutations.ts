/**
 * 21.5a — mutace komunitního herbáře (tvorba, úprava, schválení, smazání).
 * Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPlant,
  updatePlant,
  approvePlant,
  deletePlant,
} from '../api/herbarApi';
import type { CreatePlantPayload, UpdatePlantPayload } from '../types';

export function useKomunitniHerbarMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-herbar' ||
        q.queryKey[0] === 'komunitni-plant',
    });

  const create = useMutation({
    mutationFn: (payload: CreatePlantPayload) => createPlant(payload),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: UpdatePlantPayload }) =>
      updatePlant(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePlant(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePlant(id),
    onSuccess: invalidateAll,
  });

  return { create, update, approve, remove };
}
