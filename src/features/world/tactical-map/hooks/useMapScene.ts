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
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { parseApiError } from "@/shared/api";
import { getActiveMapScene, postMapOperation } from "../api/mapApi";
import { applyOperationToScene } from "../utils/applyOperationToScene";
import { catchUpScene } from "../utils/catchUpScene";
import { useMapSocket } from "./useMapSocket";
import type { RulerLine } from "../components/MapRulerLayer";
import type {
  MapScene,
  MapOperation,
  MapOperationBroadcast,
  MapSpotlightBroadcast,
  MapDiceRoll,
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
  /**
   * 10.2j — notifikace o LIVE hodu kostkou (jen happy-path seq, NE catch-up replay).
   * Konzument (TacticalMapView) spustí overlay viditelným hodům. Catch-up větev
   * záměrně NEvolá → po reconnectu nevlétnou staré kostky.
   */
  onLiveDiceRoll?: (roll: MapDiceRoll) => void;
  /**
   * 10.2m — callback při `map:pinged` (kdokoli pingnul plochu). Souřadnice
   * v map-space. Konzument přidá ephemeral marker do `layer-pings`.
   */
  onPing?: (x: number, y: number, userName: string) => void;
  /** 15.3 — callback při `map:rulered` (kdokoli měří pravítkem). */
  onRuler?: (userId: string, userName: string, line: RulerLine | null) => void;
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
  /** 10.2m — emit ping na plochu (map-space x/y). Broadcast ostatním na scéně. */
  emitPing: (x: number, y: number, userName: string) => void;
  /** 15.3 — emit pravítka (`line=null` = konec měření). Broadcast ostatním. */
  emitRuler: (line: RulerLine | null, userName: string) => void;
  /**
   * 10.2j — persist hodu kostkou jako `dice.roll` op (optimistic + rollback).
   * No-op když chybí aktivní scéna. Overlay spouští volající (F2), tohle jen
   * zapíše op do scény + cache (WS dorovná ostatní klienty).
   */
  rollDice: (op: Extract<MapOperation, { type: "dice.roll" }>) => void;
}

export function useMapScene(
  worldId: string | null,
  options?: UseMapSceneOptions,
): UseMapSceneResult {
  const queryClient = useQueryClient();
  const lastSeqRef = useRef<number>(0);
  const onLiveDiceRoll = options?.onLiveDiceRoll;

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
   * 10.2j — `dice.roll` mutace. Optimistic přes `applyOperationToScene` +
   * rollback (pattern `effectMutation`/`fogMutation` z `TacticalMapView`).
   * Base = FRESH cache (`prev`), ne closure `scene` (staleness při rychlé
   * sekvenci hodů). WS broadcast dorovná ostatní klienty; dedup podle roll.id
   * v patcheru zajistí idempotenci optimistic + broadcast.
   */
  const diceMutation = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onMutate: ({ op }) => {
      if (!worldId) return { prev: null };
      const prev = queryClient.getQueryData<MapScene>(
        mapSceneQueryKey(worldId),
      );
      if (prev) {
        queryClient.setQueryData(
          mapSceneQueryKey(worldId),
          applyOperationToScene(prev, op),
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (worldId && ctx?.prev) {
        queryClient.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
      }
      toast.error(`Hod selhal: ${parseApiError(err)}`);
    },
  });

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
        if (payload.op.type === "dice.roll") {
          onLiveDiceRoll?.(payload.op.roll);
        }
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
    [worldId, scene, queryClient, query, onLiveDiceRoll],
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
  const { emitSpotlight, emitPing, emitRuler } = useMapSocket({
    sceneId: scene?.id ?? null,
    onOperation,
    onReconnect,
    onSpotlight: spotlightCb ? handleSpotlight : undefined,
    onPing: options?.onPing,
    onRuler: options?.onRuler,
  });

  return {
    scene,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    emitSpotlight,
    emitPing,
    emitRuler,
    rollDice: (op) => {
      if (scene) diceMutation.mutate({ sceneId: scene.id, op });
    },
  };
}
