/**
 * 10.2c — load + sync aktuální scény pro current usera.
 *
 * Flow:
 *   1. `useQuery` fetch `GET /maps/active?worldId=` (per-user resolve dle
 *      `WorldMembership.currentSceneId`)
 *   2. Po načtení: `useMapSocket` join scene room
 *   3. Live update přes `applyOperationToScene` v `onOperation` callback —
 *      lokální mutation Query cache (`queryClient.setQueryData`) bez refetch
 *   4. Catch-up: pokud incoming seqNumber > lastSeen+1, fetch missed ops
 *      a aplikovat v pořadí
 *
 * 404 `MAP_NO_ACTIVE_SCENE` → data: null (empty state v UI)
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.1, §3.2, §3.3.
 */
import { useCallback, useRef } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import axios from "axios";
import { getActiveMapScene } from "../api/mapApi";
import { applyOperationToScene } from "../utils/applyOperationToScene";
import { catchUpScene } from "../utils/catchUpScene";
import { useMapSocket } from "./useMapSocket";
import type {
  MapScene,
  MapOperationBroadcast,
  MapSpotlightBroadcast,
} from "../types";

/** Query key factory — exportováno pro `useReassignmentListener` invalidate. */
export const mapSceneQueryKey = (worldId: string): QueryKey => [
  "map",
  "active",
  worldId,
];

interface UseMapSceneOptions {
  /** 10.2f-3 — callback při `map:spotlight` (PJ ukázal na token). */
  onSpotlight?: (tokenId: string) => void;
}

interface UseMapSceneResult {
  scene: MapScene | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  /**
   * Refetch — typicky po `map:reassigned` (PJ přesunul hráče na jinou scénu)
   * nebo manual reload.
   */
  refetch: () => void;
  /** 10.2f-3 — PJ emit spotlight (broadcast ostatním na scéně). */
  emitSpotlight: (tokenId: string) => void;
}

export function useMapScene(
  worldId: string | null,
  options?: UseMapSceneOptions,
): UseMapSceneResult {
  const queryClient = useQueryClient();
  const lastSeqRef = useRef<number>(0);

  const query = useQuery<MapScene | null>({
    queryKey: worldId ? mapSceneQueryKey(worldId) : ["map", "active", "none"],
    enabled: Boolean(worldId),
    queryFn: async () => {
      if (!worldId) return null;
      try {
        const scene = await getActiveMapScene(worldId);
        lastSeqRef.current = scene.lastSeqNumber;
        return scene;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // MAP_NO_ACTIVE_SCENE — hráč není přiřazený / scéna byla smazána
          return null;
        }
        throw err;
      }
    },
    // Drží data v cache i během refetch (smooth UI po reconnect)
    staleTime: 30_000,
  });

  const scene = query.data ?? null;

  /**
   * WS callback — incoming op patches scénu v cache.
   * Pokud seqNumber gap → catch-up GET /operations?since=lastSeq.
   */
  const onOperation = useCallback(
    async (payload: MapOperationBroadcast): Promise<void> => {
      if (!worldId || !scene) return;
      if (payload.sceneId !== scene.id) return; // event z jiné scény (race)

      const expectedSeq = lastSeqRef.current + 1;
      if (payload.seqNumber === expectedSeq) {
        // Happy path — sequential
        const next: MapScene = {
          ...applyOperationToScene(scene, payload.op),
          lastSeqNumber: payload.seqNumber,
        };
        lastSeqRef.current = payload.seqNumber;
        queryClient.setQueryData(mapSceneQueryKey(worldId), next);
      } else if (payload.seqNumber > expectedSeq) {
        // Gap — chyběla mi 1+ ops (WS reorder, krátký disconnect, etc.)
        try {
          const result = await catchUpScene(scene, lastSeqRef.current);
          if (result === "too-big") {
            void query.refetch();
            return;
          }
          lastSeqRef.current = result.lastSeqNumber;
          queryClient.setQueryData(mapSceneQueryKey(worldId), result);
        } catch (err) {
          console.error("[useMapScene] catch-up failed", err);
          void query.refetch();
        }
      }
      // payload.seqNumber < expectedSeq → duplicate/stale, ignorujeme
    },
    [worldId, scene, queryClient, query],
  );

  /**
   * 10.2i — forced catch-up po WS reconnectu. Socket.io se sám znovupřipojí,
   * ale když za klidu na scéně nepřijde žádný nový `map:operation`, gap se
   * nikdy nedetekuje → bez tohoto bych tiše držel zastaralý stav.
   */
  const onReconnect = useCallback(async (): Promise<void> => {
    if (!worldId || !scene) return;
    try {
      const result = await catchUpScene(scene, lastSeqRef.current);
      if (result === "too-big") {
        void query.refetch();
        return;
      }
      lastSeqRef.current = result.lastSeqNumber;
      queryClient.setQueryData(mapSceneQueryKey(worldId), result);
    } catch (err) {
      console.error("[useMapScene] reconnect catch-up failed", err);
      void query.refetch();
    }
  }, [worldId, scene, queryClient, query]);

  // Stabilní wrapper, ať se WS listener nereregistruje každý render.
  const spotlightCb = options?.onSpotlight;
  const handleSpotlight = useCallback(
    (p: MapSpotlightBroadcast) => spotlightCb?.(p.tokenId),
    [spotlightCb],
  );
  const { emitSpotlight } = useMapSocket({
    sceneId: scene?.id ?? null,
    onOperation,
    onReconnect,
    onSpotlight: spotlightCb ? handleSpotlight : undefined,
  });

  return {
    scene,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    emitSpotlight,
  };
}
