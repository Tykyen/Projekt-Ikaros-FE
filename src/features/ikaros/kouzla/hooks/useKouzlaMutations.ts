/**
 * 21.5c — mutace komunitního katalogu kouzel (tvorba, lore, staty, schválení,
 * smazání, diskuse). Invaliduje list i detail po zápisu. Vzor: bestiář.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCommunitySpell,
  updateSpellLore,
  proposeSpellStatblock,
  approveSpellStatblock,
  approveSpell,
  deleteCommunitySpell,
  addSpellComment,
} from '../api/kouzlaApi';
import type {
  CreateCommunitySpellPayload,
  UpdateSpellLorePayload,
  ProposeSpellStatblockPayload,
  CreateSpellCommentPayload,
} from '../types';

export function useKouzlaMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-kouzla' ||
        q.queryKey[0] === 'komunitni-kouzlo',
    });

  const create = useMutation({
    mutationFn: (payload: CreateCommunitySpellPayload) =>
      createCommunitySpell(payload),
    onSuccess: invalidateAll,
  });

  const updateLore = useMutation({
    mutationFn: (vars: { id: string; patch: UpdateSpellLorePayload }) =>
      updateSpellLore(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const propose = useMutation({
    mutationFn: (vars: { id: string; payload: ProposeSpellStatblockPayload }) =>
      proposeSpellStatblock(vars.id, vars.payload),
    onSuccess: invalidateAll,
  });

  const approveSb = useMutation({
    mutationFn: (vars: { id: string; systemId: string }) =>
      approveSpellStatblock(vars.id, vars.systemId),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveSpell(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCommunitySpell(id),
    onSuccess: invalidateAll,
  });

  return { create, updateLore, propose, approveSb, approve, remove };
}

export function useAddSpellComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: CreateSpellCommentPayload }) =>
      addSpellComment(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      void qc.invalidateQueries({
        queryKey: ['kouzlo-comments', vars.id],
      }),
  });
}
