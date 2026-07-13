/**
 * 21.5e — mutace komunitního katalogu předmětů (tvorba, jádro, staty,
 * schválení, smazání, diskuse). Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCommunityItem,
  updateItemLore,
  proposeItemStatblock,
  approveItemStatblock,
  approveItem,
  deleteCommunityItem,
  addItemComment,
} from '../api/predmetyApi';
import type {
  CreateCommunityItemPayload,
  UpdateItemLorePayload,
  ProposeItemStatblockPayload,
  CreateItemCommentPayload,
} from '../types';

export function usePredmetyMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-predmety' ||
        q.queryKey[0] === 'komunitni-predmet',
    });

  const create = useMutation({
    mutationFn: (payload: CreateCommunityItemPayload) =>
      createCommunityItem(payload),
    onSuccess: invalidateAll,
  });

  const updateLore = useMutation({
    mutationFn: (vars: { id: string; patch: UpdateItemLorePayload }) =>
      updateItemLore(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const propose = useMutation({
    mutationFn: (vars: { id: string; payload: ProposeItemStatblockPayload }) =>
      proposeItemStatblock(vars.id, vars.payload),
    onSuccess: invalidateAll,
  });

  const approveSb = useMutation({
    mutationFn: (vars: { id: string; systemId: string }) =>
      approveItemStatblock(vars.id, vars.systemId),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveItem(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCommunityItem(id),
    onSuccess: invalidateAll,
  });

  return { create, updateLore, propose, approveSb, approve, remove };
}

export function useAddItemComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: CreateItemCommentPayload }) =>
      addItemComment(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      void qc.invalidateQueries({
        queryKey: ['predmet-comments', vars.id],
      }),
  });
}
