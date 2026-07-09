/**
 * 16.2b-2 — mutace komunitního bestiáře (tvorba, lore, staty, schválení, klon,
 * diskuse). Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCommunityBestie,
  updateCommunityLore,
  proposeStatblock,
  approveStatblock,
  approveBeast,
  cloneCommunityBestie,
  addBestieComment,
} from '../api/komunitniBestiarApi';
import type {
  CreateCommunityBestiePayload,
  UpdateLorePayload,
  ProposeStatblockPayload,
  CloneCommunityPayload,
  CreateBestieCommentPayload,
} from '../types';

export function useKomunitniBestiarMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-bestiar' ||
        q.queryKey[0] === 'komunitni-bestie',
    });

  const create = useMutation({
    mutationFn: (payload: CreateCommunityBestiePayload) =>
      createCommunityBestie(payload),
    onSuccess: invalidateAll,
  });

  const updateLore = useMutation({
    mutationFn: (vars: { id: string; patch: UpdateLorePayload }) =>
      updateCommunityLore(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const propose = useMutation({
    mutationFn: (vars: { id: string; payload: ProposeStatblockPayload }) =>
      proposeStatblock(vars.id, vars.payload),
    onSuccess: invalidateAll,
  });

  const approveSb = useMutation({
    mutationFn: (vars: { id: string; systemId: string }) =>
      approveStatblock(vars.id, vars.systemId),
    onSuccess: invalidateAll,
  });

  const approveBst = useMutation({
    mutationFn: (id: string) => approveBeast(id),
    onSuccess: invalidateAll,
  });

  const clone = useMutation({
    mutationFn: (vars: { id: string; payload: CloneCommunityPayload }) =>
      cloneCommunityBestie(vars.id, vars.payload),
  });

  return { create, updateLore, propose, approveSb, approveBst, clone };
}

export function useAddBestieComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: CreateBestieCommentPayload }) =>
      addBestieComment(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      void qc.invalidateQueries({
        queryKey: ['bestie-comments', vars.id],
      }),
  });
}
