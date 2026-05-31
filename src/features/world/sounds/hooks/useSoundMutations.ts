/**
 * 13.3 — Sound mutace (create / update / delete / import / nominate + admin).
 *
 * Invaliduje relevantní query klíče po úspěchu (world list, global, pending).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { soundsApi } from '../api/soundsApi';
import type { CreateSoundDto, UpdateSoundDto } from '../types';

export function useSoundMutations(worldId: string | null) {
  const qc = useQueryClient();
  const invalidateWorld = () =>
    qc.invalidateQueries({ queryKey: ['sounds', 'world', worldId] });
  const invalidateGlobal = () =>
    qc.invalidateQueries({ queryKey: ['sounds', 'global'] });
  const invalidatePending = () =>
    qc.invalidateQueries({ queryKey: ['sounds', 'pending'] });

  return {
    create: useMutation({
      mutationFn: (dto: CreateSoundDto) =>
        soundsApi.create(worldId as string, dto),
      onSuccess: invalidateWorld,
    }),
    update: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateSoundDto }) =>
        soundsApi.update(worldId as string, id, dto),
      onSuccess: invalidateWorld,
    }),
    remove: useMutation({
      mutationFn: (id: string) => soundsApi.remove(worldId as string, id),
      onSuccess: invalidateWorld,
    }),
    importGlobal: useMutation({
      mutationFn: (globalId: string) =>
        soundsApi.importGlobal(worldId as string, globalId),
      onSuccess: invalidateWorld,
    }),
    nominate: useMutation({
      mutationFn: (id: string) => soundsApi.nominate(worldId as string, id),
      onSuccess: () => {
        invalidateWorld();
        invalidatePending();
      },
    }),
    approve: useMutation({
      mutationFn: (id: string) => soundsApi.approve(id),
      onSuccess: () => {
        invalidatePending();
        invalidateGlobal();
      },
    }),
    reject: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        soundsApi.reject(id, reason),
      onSuccess: invalidatePending,
    }),
  };
}
