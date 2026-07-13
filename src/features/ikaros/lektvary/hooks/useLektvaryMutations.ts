/**
 * 21.5b — mutace komunitního katalogu lektvarů (tvorba, jádro, staty,
 * schválení, smazání, diskuse). Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCommunityPotion,
  updatePotionLore,
  proposePotionStatblock,
  approvePotionStatblock,
  approvePotion,
  deleteCommunityPotion,
  addPotionComment,
} from '../api/lektvaryApi';
import type {
  CreateCommunityPotionPayload,
  UpdatePotionLorePayload,
  ProposePotionStatblockPayload,
  CreatePotionCommentPayload,
} from '../types';

export function useLektvaryMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-lektvary' ||
        q.queryKey[0] === 'komunitni-lektvar',
    });

  const create = useMutation({
    mutationFn: (payload: CreateCommunityPotionPayload) =>
      createCommunityPotion(payload),
    onSuccess: invalidateAll,
  });

  const updateLore = useMutation({
    mutationFn: (vars: { id: string; patch: UpdatePotionLorePayload }) =>
      updatePotionLore(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const propose = useMutation({
    mutationFn: (vars: {
      id: string;
      payload: ProposePotionStatblockPayload;
    }) => proposePotionStatblock(vars.id, vars.payload),
    onSuccess: invalidateAll,
  });

  const approveSb = useMutation({
    mutationFn: (vars: { id: string; systemId: string }) =>
      approvePotionStatblock(vars.id, vars.systemId),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePotion(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCommunityPotion(id),
    onSuccess: invalidateAll,
  });

  return { create, updateLore, propose, approveSb, approve, remove };
}

export function useAddPotionComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: CreatePotionCommentPayload }) =>
      addPotionComment(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      void qc.invalidateQueries({
        queryKey: ['lektvar-comments', vars.id],
      }),
  });
}
