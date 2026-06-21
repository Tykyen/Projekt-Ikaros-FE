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
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.2.
 */
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getSocket } from "@/features/chat/api/socket";
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
  useEffect(() => {
    if (!sceneId) return;
    const socket = getSocket();

    socket.emit("map:join", sceneId);

    return () => {
      socket.emit("map:leave", sceneId);
    };
  }, [sceneId]);

  // 10.2i — reconnect: socket.io po (re)connectu má prázdné rooms → musíme
  // re-join scene room (jinak přestaneme dostávat broadcasty) a spustit
  // forced catch-up. `connect` se emituje až PO (re)connectu, takže když je
  // socket při mountu už připojený, initial se nevyvolá (žádný duplicate).
  useEffect(() => {
    const socket = getSocket();
    const handler = (): void => {
      if (sceneId) socket.emit("map:join", sceneId);
      onReconnect?.();
    };
    socket.on("connect", handler);
    return () => {
      socket.off("connect", handler);
    };
  }, [sceneId, onReconnect]);

  // S-02 — BE MapsGateway posílá `error` při selhání operace (forbidden /
  // scéna neexistuje / neautentizováno). Bez listeneru byla akce tichý no-op
  // bez zpětné vazby; toast dá uživateli vědět, že operace neprošla.
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: { code?: string; message?: string }): void => {
      toast.error(payload?.message ?? "Operace na mapě se nezdařila.");
    };
    socket.on("error", handler);
    return () => {
      socket.off("error", handler);
    };
  }, []);

  // Listener: map:operation (per-scene broadcast)
  useEffect(() => {
    if (!onOperation) return;
    const socket = getSocket();
    const handler = (payload: MapOperationBroadcast): void =>
      onOperation(payload);
    socket.on("map:operation", handler);
    return () => {
      socket.off("map:operation", handler);
    };
  }, [onOperation]);

  // Listener: map:reassigned (private cross-scene přesun)
  useEffect(() => {
    if (!onReassigned) return;
    const socket = getSocket();
    const handler = (payload: MapReassignedBroadcast): void =>
      onReassigned(payload);
    socket.on("map:reassigned", handler);
    return () => {
      socket.off("map:reassigned", handler);
    };
  }, [onReassigned]);

  // Listener: map:spotlight (PJ ukázal na token — ephemeral)
  useEffect(() => {
    if (!onSpotlight) return;
    const socket = getSocket();
    const handler = (payload: MapSpotlightBroadcast): void =>
      onSpotlight(payload);
    socket.on("map:spotlight", handler);
    return () => {
      socket.off("map:spotlight", handler);
    };
  }, [onSpotlight]);

  // Listener: map:pinged (kdokoli pingnul — ephemeral). BE posílá poziční args.
  useEffect(() => {
    if (!onPing) return;
    const socket = getSocket();
    const handler = (x: number, y: number, userName: string): void =>
      onPing(x, y, userName);
    socket.on("map:pinged", handler);
    return () => {
      socket.off("map:pinged", handler);
    };
  }, [onPing]);

  // Listener: map:rulered (kdokoli měří — ephemeral). BE přidává authenticated
  // userId (klíč per-uživatel, ne z payloadu).
  useEffect(() => {
    if (!onRuler) return;
    const socket = getSocket();
    const handler = (payload: {
      userId: string;
      userName: string;
      line: RulerLine | null;
    }): void => onRuler(payload.userId, payload.userName, payload.line);
    socket.on("map:rulered", handler);
    return () => {
      socket.off("map:rulered", handler);
    };
  }, [onRuler]);

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
