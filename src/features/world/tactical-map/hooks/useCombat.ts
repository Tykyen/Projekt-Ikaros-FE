/**
 * 10.2f — combat tracker hook pro iniciativní lištu.
 *
 * Derivuje seřazený seznam bojovníků a mapuje akce na `combat.*` / `token.*`
 * operace (Operations API z 10.2-prep-1). Optimistic apply + invalidate,
 * stejný pattern jako `useTokenUpdate`.
 *
 * `combatants` = tokeny `inCombat` seřazené **živě** dle `initiative` desc
 * (i za boje — bod 1: auto-přeřazení dle čísla; bod 3: nový token zařazený do
 * boje se hned objeví). `combat.order` snapshot se pro zobrazení NEpoužívá.
 * `nextTurn()` počítá další tah z živého pořadí a posílá explicitní `tokenId`
 * + `round` (wrap → round+1); FE tak řídí pořadí tahů.
 *
 * Plán: docs/arch/phase-10/plan-10.2f.md (f-1/C); revize live-sort 2026-05-30.
 */
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postMapOperation } from '../api/mapApi';
import { applyOperationToScene } from '../utils/applyOperationToScene';
import { mapSceneQueryKey } from './useMapScene';
import { sortByInitiativeDesc } from '../utils/initiativeOrder';
import { isPcToken } from '../utils/isPcToken';
import type { MapScene, MapToken, MapOperation } from '../types';

export interface UseCombatResult {
  /** Bojovníci v zobrazovaném pořadí (Stav A sort / Stav B order). */
  combatants: MapToken[];
  /** 10.2f — „mimo boj" tokeny (inCombat=false), sorted. Lišta je zobrazí
   *  ztlumené za oddělovačem; visibility dle role řeší InitiativeBar
   *  (PC = PJ i hráč, NPC/bestie = jen PJ). */
  bench: MapToken[];
  isActive: boolean;
  round: number;
  currentTokenId: string | null;
  /** Zahájí boj v aktuálním pořadí `combatants`. */
  start: () => void;
  /** Posun na další tah (živé pořadí; po posledním → round++). */
  nextTurn: () => void;
  /** Skok na konkrétní token (PJ). */
  jumpTo: (tokenId: string) => void;
  /** Ukončí boj. */
  end: () => void;
  isPending: boolean;
}

export function useCombat(
  scene: MapScene | null,
  worldId: string,
): UseCombatResult {
  const qc = useQueryClient();
  const sceneId = scene?.id ?? '';
  const key = mapSceneQueryKey(worldId);

  const combat = scene?.combat ?? null;
  const isActive = !!combat?.isActive;

  // Živé pořadí — vždy dle aktuální initiative (i za boje). NEpoužívá
  // combat.order snapshot, aby se změna čísla i nově zařazený token projevily
  // okamžitě (body 1 + 3, user feedback 2026-05-30).
  // PC jsou v boji VŽDY (nelze vyřadit); NPC/bestie jen když `inCombat`.
  const combatants = useMemo<MapToken[]>(() => {
    if (!scene) return [];
    return sortByInitiativeDesc(
      scene.tokens.filter((t) => isPcToken(t) || t.inCombat),
    );
  }, [scene]);

  // Mimo boj = jen NPC/bestie s inCombat=false (PC tam nikdy nejsou).
  const bench = useMemo<MapToken[]>(() => {
    if (!scene) return [];
    return sortByInitiativeDesc(
      scene.tokens.filter((t) => !isPcToken(t) && !t.inCombat),
    );
  }, [scene]);

  // Combat op (combat.start/turn/end) — optimistic + invalidate.
  const opMutation = useMutation({
    mutationFn: (op: MapOperation) => postMapOperation(sceneId, op),
    onMutate: (op) => {
      const prev = qc.getQueryData<MapScene | null>(key);
      if (prev) qc.setQueryData(key, applyOperationToScene(prev, op));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });

  const round = combat?.round ?? 0;
  const currentTokenId = combat?.currentTokenId ?? null;

  return {
    combatants,
    bench,
    isActive,
    round,
    currentTokenId,
    start: () =>
      opMutation.mutate({
        type: 'combat.start',
        orderTokenIds: combatants.map((t) => t.id),
      }),
    // Další tah z živého pořadí: najdi current, jdi na další; po posledním
    // → round+1. FE řídí pořadí (explicitní tokenId + round).
    nextTurn: () => {
      if (combatants.length === 0) return;
      const idx = combatants.findIndex((t) => t.id === currentTokenId);
      const nextIdx = (idx + 1) % combatants.length;
      const wrap = idx >= 0 && nextIdx === 0;
      opMutation.mutate({
        type: 'combat.turn',
        tokenId: combatants[nextIdx].id,
        round: wrap ? round + 1 : round,
      });
    },
    jumpTo: (tokenId) =>
      opMutation.mutate({ type: 'combat.turn', tokenId, round }),
    end: () => opMutation.mutate({ type: 'combat.end' }),
    isPending: opMutation.isPending,
  };
}
