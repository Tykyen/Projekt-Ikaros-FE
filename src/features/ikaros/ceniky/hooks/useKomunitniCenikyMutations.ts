/**
 * 21.5f — mutace komunitních ceníků (tvorba, úprava, schválení, smazání,
 * komentář). Invaliduje list i detail po zápisu.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPriceList,
  updatePriceList,
  approvePriceList,
  deletePriceList,
  createPriceListComment,
} from '../api/cenikyApi';
import type {
  CreatePriceListPayload,
  UpdatePriceListPayload,
  CreatePriceListCommentPayload,
} from '../types';

export function useKomunitniCenikyMutations() {
  const qc = useQueryClient();
  const invalidateAll = () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'komunitni-ceniky' ||
        q.queryKey[0] === 'komunitni-cenik',
    });

  const create = useMutation({
    mutationFn: (payload: CreatePriceListPayload) => createPriceList(payload),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: UpdatePriceListPayload }) =>
      updatePriceList(vars.id, vars.patch),
    onSuccess: invalidateAll,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePriceList(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePriceList(id),
    onSuccess: invalidateAll,
  });

  return { create, update, approve, remove };
}

export function useAddCenikComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: CreatePriceListCommentPayload }) =>
      createPriceListComment(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      void qc.invalidateQueries({
        queryKey: ['komunitni-cenik-comments', vars.id],
      }),
  });
}
