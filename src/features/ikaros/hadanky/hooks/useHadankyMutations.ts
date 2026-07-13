/**
 * 21.5d — mutace komunitního katalogu hádanek (tvorba, úprava, schválení,
 * smazání, diskuse). Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCommunityRiddle,
  updateCommunityRiddle,
  approveRiddle,
  deleteCommunityRiddle,
  addRiddleComment,
} from '../api/hadankyApi';
import type {
  CreateRiddlePayload,
  UpdateRiddlePayload,
  CreateRiddleCommentPayload,
} from '../types';

export function useHadankyMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-hadanky' ||
        q.queryKey[0] === 'komunitni-hadanka',
    });

  const create = useMutation({
    mutationFn: (payload: CreateRiddlePayload) =>
      createCommunityRiddle(payload),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: UpdateRiddlePayload }) =>
      updateCommunityRiddle(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveRiddle(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCommunityRiddle(id),
    onSuccess: invalidateAll,
  });

  return { create, update, approve, remove };
}

export function useAddRiddleComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: CreateRiddleCommentPayload }) =>
      addRiddleComment(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      void qc.invalidateQueries({
        queryKey: ['hadanka-comments', vars.id],
      }),
  });
}
