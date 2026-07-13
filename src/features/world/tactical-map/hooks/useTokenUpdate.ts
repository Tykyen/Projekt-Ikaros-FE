/**
 * 10.2e C4 — token.update mutation hook.
 *
 * Optimistic apply + invalidate scene query po success.
 *
 * D-LAUNCH-GAP — HP/injury damage-heal tlačítka posílají RELATIVNÍ
 * `hpDelta`/`injuryDelta` (jen bestie tokeny) místo absolutního
 * `patch.currentHp`: absolutní set z klientské cache = lost update dvou
 * souběžných zásahů (last-write-wins na stale bázi). Server deltu aplikuje
 * atomicky s clampem a v 201 response vrací op s normalizovaným ABSOLUTNÍM
 * `patch.currentHp`/`patch.injury` — ta je zdroj pravdy a přepíše
 * optimistický odhad v cache (WS broadcast téže op ji pak idempotentně
 * potvrdí i ostatním klientům).
 *
 * Plán: docs/arch/phase-10/plan-10.2e.md C4.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postMapOperation } from '../api/mapApi';
import { applyOperationToScene } from '../utils/applyOperationToScene';
import { mapSceneQueryKey } from './useMapScene';
import type { MapScene, MapToken } from '../types';

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Optimistický ABSOLUTNÍ patch z delta payloadu — mirror BE clampu
 * (currentHp 0..maxHp, injury ≥ 0). Počítá se z ČERSTVÉ cache (ne z props
 * volajícího panelu); slouží jen k okamžitému redraw, autoritativní hodnota
 * přijde v 201 response.
 */
function optimisticDeltaPatch(
  scene: MapScene,
  tokenId: string,
  hpDelta?: number,
  injuryDelta?: number,
): Partial<MapToken> {
  const tok = scene.tokens.find((t) => t.id === tokenId);
  if (!tok) return {};
  const patch: Partial<MapToken> = {};
  if (hpDelta !== undefined) {
    const max = toNum(tok.maxHp);
    const raw = toNum(tok.currentHp) + hpDelta;
    patch.currentHp =
      max > 0 ? Math.min(max, Math.max(0, raw)) : Math.max(0, raw);
  }
  if (injuryDelta !== undefined) {
    patch.injury = Math.max(0, toNum(tok.injury) + injuryDelta);
  }
  return patch;
}

export function useTokenUpdate(sceneId: string, worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      tokenId: string;
      /** Absolutní set polí. U delta volání vynech (BE vyžaduje prázdný). */
      patch?: Partial<MapToken>;
      /**
       * D-LAUNCH-GAP — relativní změna HP (damage/heal, JEN bestie tokeny).
       * Nekombinovat s `patch` (BE 400). Viz hlavička souboru.
       */
      hpDelta?: number;
      /** D-LAUNCH-GAP — relativní změna `injury` (vzor hpDelta). */
      injuryDelta?: number;
      /**
       * 10.2j — přeskočí `invalidateQueries` po úspěchu. Použij když běží
       * paralelně jiná optimistická operace na téže scéně (typicky `dice.roll`
       * u iniciativního hodu) — invalidate refetch by jinak sestřelil ještě
       * nepersistovaný hod z logu. Optimistic patch + WS broadcast stačí.
       */
      skipInvalidate?: boolean;
    }) =>
      postMapOperation(sceneId, {
        type: 'token.update',
        tokenId: payload.tokenId,
        patch: payload.patch ?? {},
        // undefined klíče axios při JSON serializaci zahodí → BE je nevidí.
        hpDelta: payload.hpDelta,
        injuryDelta: payload.injuryDelta,
      }),
    onMutate: ({ tokenId, patch, hpDelta, injuryDelta }) => {
      const key = mapSceneQueryKey(worldId);
      const prev = qc.getQueryData<MapScene | null>(key);
      if (prev) {
        const optimistic =
          hpDelta !== undefined || injuryDelta !== undefined
            ? optimisticDeltaPatch(prev, tokenId, hpDelta, injuryDelta)
            : (patch ?? {});
        qc.setQueryData(
          key,
          applyOperationToScene(prev, {
            type: 'token.update',
            tokenId,
            patch: optimistic,
          }),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
      }
    },
    onSuccess: (data, vars) => {
      // Delta op — 201 response nese op s normalizovaným ABSOLUTNÍM
      // `patch.currentHp`/`patch.injury` (finální DB stav po atomickém
      // clampu). Přepiš jím optimistický odhad — pod souběhem mohl být mimo.
      if (vars.hpDelta !== undefined || vars.injuryDelta !== undefined) {
        const key = mapSceneQueryKey(worldId);
        const prev = qc.getQueryData<MapScene | null>(key);
        if (prev) {
          qc.setQueryData(key, applyOperationToScene(prev, data.op));
        }
      }
      if (vars.skipInvalidate) return;
      void qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
    },
  });
}
