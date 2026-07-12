/**
 * 10.2c — WS hook pro taktickou mapu.
 *
 * Reusuje existující `getSocket()` z `features/chat/api/socket.ts` —
 * jediný sdílený `socket.io-client` instance napříč chat + mapou.
 * (Předtím spec uvažovala separátní socket — řešeno NE, sdílíme.)
 *
 * Mount fáze: emit `map:join` (po BE-side scéna+world authorization gate).
 * Unmount: emit `map:leave`.
 *
 * Listeners (subscribe vždy fresh handler v useEffect):
 *   - `map:operation` — incoming op od jiných klientů na téže scéně
 *   - `map:reassigned` — private emit pro current usera (PJ ho přesunul)
 *
 * D-AUDIT-2026-07-11 (socket-swap listener leak) — listenery jedou přes
 * swap-safe `useSocketEvent`/`useSocketReconnect`; ruční `socket.on` bez
 * sledování instance zůstal po `reconnectSocket()` viset na mrtvém socketu
 * (mapa oslepla, re-join se nespustil). Join/leave emit effect sleduje
 * `socketGenerationAtom`, aby unmount `map:leave` mířil na ŽIVOU instanci.
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.2.
 */
import { useCallback, useEffect } from "react";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { getSocket } from "@/features/chat/api/socket";
import { socketGenerationAtom } from "@/features/chat/store/socketStore";
import {
  useSocketEvent,
  useSocketReconnect,
} from "@/features/chat/api/useSocket";
import type { RulerLine } from "../components/MapRulerLayer";
import type {
  MapOperationBroadcast,
  MapReassignedBroadcast,
  MapSpotlightBroadcast,
} from "../types";

interface UseMapSocketOptions {
  /** ID scény, na které se klient nachází. `null` → žádný join. */
  sceneId: string | null;
  /** Callback při příchozí `map:operation` (po BE DB commit). */
  onOperation?: (payload: MapOperationBroadcast) => void;
  /**
   * 10.2i — callback po WS (re)connectu. Volá se až na socket `connect`
   * event (ne při initial mountu, pokud je socket už připojený) → typicky
   * po výpadku. Slouží k forced catch-up zmeškaných operací.
   */
  onReconnect?: () => void;
  /** Callback při private `map:reassigned` (cross-scene přesun mě). */
  onReassigned?: (payload: MapReassignedBroadcast) => void;
  /** 10.2f-3 — callback při `map:spotlight` (PJ ukázal na token). */
  onSpotlight?: (payload: MapSpotlightBroadcast) => void;
  /**
   * 10.2m — callback při `map:pinged` (kdokoli pingnul plochu). Souřadnice
   * `x`/`y` jsou v mapa-space (transform root). BE emituje poziční argumenty.
   */
  onPing?: (x: number, y: number, userName: string) => void;
  /**
   * 15.3 — callback při `map:rulered` (kdokoli měří pravítkem). `line=null` =
   * měření skončilo (vyčistit). `userId` z autentizace (BE), klíč per-uživatel.
   */
  onRuler?: (userId: string, userName: string, line: RulerLine | null) => void;
}

export interface UseMapSocketResult {
  /** 10.2f-3 — PJ emit spotlight (broadcast ostatním na scéně). */
  emitSpotlight: (tokenId: string) => void;
  /** 10.2m — emit ping na plochu (mapa-space x/y). Broadcast ostatním na scéně. */
  emitPing: (x: number, y: number, userName: string) => void;
  /** 15.3 — emit pravítka (`line=null` = konec měření). Broadcast ostatním. */
  emitRuler: (line: RulerLine | null, userName: string) => void;
}

export function useMapSocket({
  sceneId,
  onOperation,
  onReconnect,
  onReassigned,
  onSpotlight,
  onPing,
  onRuler,
}: UseMapSocketOptions): UseMapSocketResult {
  // D-AUDIT-2026-07-11 — `socketGenerationAtom` v deps: po swapu instance se
  // effect re-runne (leave na starou = neškodný no-op, join na novou), takže
  // pozdější unmount `map:leave` odejde na ŽIVÝ socket. Bez toho by nová
  // instance po odchodu z mapy zůstala v scene roomu (BE dedup nemá leave).
  const socketGeneration = useAtomValue(socketGenerationAtom);
  useEffect(() => {
    if (!sceneId) return;
    const socket = getSocket();

    socket.emit("map:join", sceneId);

    return () => {
      socket.emit("map:leave", sceneId);
    };
  }, [sceneId, socketGeneration]);

  // 10.2i — reconnect: socket.io po (re)connectu má prázdné rooms → musíme
  // re-join scene room (jinak přestaneme dostávat broadcasty) a spustit
  // forced catch-up. `connect` se emituje až PO (re)connectu, takže když je
  // socket při mountu už připojený, initial se nevyvolá (žádný duplicate).
  // Swap-safe přes `useSocketReconnect` (dřív ruční listener na mrtvé instanci).
  useSocketReconnect(() => {
    if (sceneId) getSocket().emit("map:join", sceneId);
    onReconnect?.();
  });

  // S-02 — BE MapsGateway posílá `error` při selhání operace (forbidden /
  // scéna neexistuje / neautentizováno). Bez listeneru byla akce tichý no-op
  // bez zpětné vazby; toast dá uživateli vědět, že operace neprošla.
  useSocketEvent<{ code?: string; message?: string }>("error", (payload) => {
    toast.error(payload?.message ?? "Operace na mapě se nezdařila.");
  });

  // Listener: map:operation (per-scene broadcast)
  useSocketEvent<MapOperationBroadcast>("map:operation", (payload) => {
    onOperation?.(payload);
  });

  // Listener: map:reassigned (private cross-scene přesun)
  useSocketEvent<MapReassignedBroadcast>("map:reassigned", (payload) => {
    onReassigned?.(payload);
  });

  // Listener: map:spotlight (PJ ukázal na token — ephemeral)
  useSocketEvent<MapSpotlightBroadcast>("map:spotlight", (payload) => {
    onSpotlight?.(payload);
  });

  // Listener: map:pinged (kdokoli pingnul — ephemeral). BE posílá POZIČNÍ args
  // → nejde přes `useSocketEvent` (předává jen 1. argument); ruční registrace
  // s re-bindem přes `socketGenerationAtom` (swap-safe) + cleanup stejné reference.
  useEffect(() => {
    if (!onPing) return;
    const socket = getSocket();
    const handler = (x: number, y: number, userName: string): void =>
      onPing(x, y, userName);
    socket.on("map:pinged", handler);
    return () => {
      socket.off("map:pinged", handler);
    };
  }, [onPing, socketGeneration]);

  // Listener: map:rulered (kdokoli měří — ephemeral). BE přidává authenticated
  // userId (klíč per-uživatel, ne z payloadu).
  useSocketEvent<{
    userId: string;
    userName: string;
    line: RulerLine | null;
  }>("map:rulered", (payload) => {
    onRuler?.(payload.userId, payload.userName, payload.line);
  });

  const emitSpotlight = useCallback(
    (tokenId: string): void => {
      if (!sceneId) return;
      getSocket().emit("map:spotlight", { sceneId, tokenId });
    },
    [sceneId],
  );

  const emitPing = useCallback(
    (x: number, y: number, userName: string): void => {
      if (!sceneId) return;
      getSocket().emit("map:ping", { sceneId, x, y, userName });
    },
    [sceneId],
  );

  const emitRuler = useCallback(
    (line: RulerLine | null, userName: string): void => {
      if (!sceneId) return;
      getSocket().emit("map:ruler", { sceneId, line, userName });
    },
    [sceneId],
  );

  return { emitSpotlight, emitPing, emitRuler };
}
