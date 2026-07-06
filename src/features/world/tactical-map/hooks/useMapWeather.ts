/**
 * 10.2i — počasí na taktické mapě.
 *
 * Zdroj pravdy = `World.activeMapWeather` (co PJ „vyslal" z generátoru). Hook:
 *   - čte aktuální počasí z `useWorldContext().world`,
 *   - joinne `world:{worldId}` room (i hráč — `weather:updated` jde do world roomu)
 *     a re-joinne po WS reconnectu,
 *   - poslouchá `weather:updated` → patchne `World` query cache (panel + atmosféra
 *     se překreslí; `weather:null` = PJ vypnul počasí),
 *   - drží per-user toggle vizuálních efektů (localStorage),
 *   - PJ akce: vyslat počasí generátoru na mapu / vypnout.
 *
 * Spec: docs/arch/phase-10/spec-10.2i.md (i-2).
 */
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/features/chat/api/socket";
import { useSocketReconnect } from "@/features/chat/api/useSocket";
import { useWorldContext } from "@/features/world/context/WorldContext";
import {
  useBroadcastWeather,
  useClearMapWeather,
} from "@/features/world/api/useWeatherGenerators";
import type { ActiveMapWeather, WeatherResult, World } from "@/shared/types";

const LS_FX_KEY = "ikr-map-weather-fx";

function loadFx(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(LS_FX_KEY);
    return raw == null ? true : (JSON.parse(raw) as boolean);
  } catch {
    return true;
  }
}

/** WS `weather:updated` payload (BE `maps.gateway` → `world:{worldId}`). */
interface WeatherUpdatedPayload {
  worldId: string;
  generatorId: string | null;
  generatorName: string | null;
  weather: WeatherResult | null;
}

export interface UseMapWeatherResult {
  weather: ActiveMapWeather | null;
  /** Per-user přepínač vizuální atmosféry (LS-persist). */
  fxEnabled: boolean;
  toggleFx: () => void;
  /** PJ — vyšle počasí generátoru na mapu (broadcast target:map). */
  setWeather: (generatorId: string) => void;
  /** PJ — vypne počasí na mapě. */
  clearWeather: () => void;
  isMutating: boolean;
}

export function useMapWeather(): UseMapWeatherResult {
  const { worldId, world } = useWorldContext();
  const queryClient = useQueryClient();
  const broadcast = useBroadcastWeather(worldId);
  const clear = useClearMapWeather(worldId);

  const [fxEnabled, setFxEnabled] = useState<boolean>(loadFx);
  const toggleFx = useCallback(() => {
    setFxEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_FX_KEY, JSON.stringify(next));
      } catch {
        /* private mode / quota */
      }
      return next;
    });
  }, []);

  // `weather:updated` jde do `world:{worldId}` — room join/leave (i re-join po
  // reconnectu) drží výhradně `useWorldSocket` (WorldLayout, jediný vlastník
  // W-7/W-9). FIX-1 — dřívější vlastní `room:join`/`room:leave` tady nebyl
  // ref-counted → odchod z mapy zavolal `room:leave` i za WorldLayout a
  // vykopl z roomu celý zbytek světa (dashboard přestal dostávat updates).
  //
  // FIX-5 — reconnect fallback: `weather:updated` zmeškaný během výpadku je
  // pryč (žádný replay), takže po reconnectu refetchujeme `World` query, ať
  // se `activeMapWeather` dorovná i bez dalšího live eventu.
  useSocketReconnect(() => {
    if (!worldId) return;
    void queryClient.invalidateQueries({ queryKey: ["worlds"] });
  });

  // listener: patch World query cache (slug i id variant — match dle world.id)
  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();
    const handler = (payload: WeatherUpdatedPayload): void => {
      if (payload.worldId !== worldId) return;
      const next: ActiveMapWeather | null =
        payload.weather && payload.generatorId
          ? {
              generatorId: payload.generatorId,
              generatorName: payload.generatorName ?? "",
              weather: payload.weather,
              setAt: new Date().toISOString(),
            }
          : null;
      queryClient.setQueriesData<World>({ queryKey: ["worlds"] }, (old) =>
        old && old.id === worldId ? { ...old, activeMapWeather: next } : old,
      );
    };
    socket.on("weather:updated", handler);
    return () => {
      socket.off("weather:updated", handler);
    };
  }, [worldId, queryClient]);

  const setWeather = useCallback(
    (generatorId: string) => {
      broadcast.mutate({ id: generatorId, target: "map" });
    },
    [broadcast],
  );
  const clearWeather = useCallback(() => {
    clear.mutate();
  }, [clear]);

  return {
    weather: world?.activeMapWeather ?? null,
    fxEnabled,
    toggleFx,
    setWeather,
    clearWeather,
    isMutating: broadcast.isPending || clear.isPending,
  };
}
