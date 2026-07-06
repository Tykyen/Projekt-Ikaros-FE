/**
 * 9.4-I — WebSocket subscribe na `weather:updated` socket event.
 *
 * BE emituje při broadcast (`maps.gateway` @OnEvent('weather.updated') →
 * socket `weather:updated`). FE patchne jediný generátor
 * v cache (žádný refetch) → karta se okamžitě překreslí v jiném tabu/zařízení.
 *
 * Mount na `WorldWeatherPage`. Cleanup v `useSocketEvent` handle (off na unmount).
 */
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent, useSocketReconnect } from '@/features/chat/api/useSocket';
import type { WeatherGenerator, WeatherResult } from '@/shared/types';
import { weatherGeneratorsKey } from './useWeatherGenerators';

interface WeatherUpdatedPayload {
  worldId: string;
  // W-6 — BE u clear (PJ vypnul počasí na mapě, 10.2i) posílá null.
  generatorId: string | null;
  generatorName?: string | null;
  weather: WeatherResult | null;
}

export function useWeatherWsSubscribe(worldId: string): void {
  const qc = useQueryClient();

  // FIX-5 — reconnect fallback: `weather:updated` zmeškaný během výpadku je
  // pryč (žádný replay) → po reconnectu refetch, ať karty generátorů dorovnají
  // stav bez čekání na další live broadcast.
  useSocketReconnect(() => {
    if (!worldId) return;
    void qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) });
  });

  useSocketEvent<WeatherUpdatedPayload>('weather:updated', (event) => {
    if (!worldId || event.worldId !== worldId) return;
    // Clear (`generatorId`/`weather` = null) se týká mapové atmosféry, ne karet
    // generátorů (N-39) → karty nech beze změny.
    if (!event.generatorId || !event.weather) return;
    const { generatorId, weather } = event;

    qc.setQueryData<WeatherGenerator[]>(
      weatherGeneratorsKey(worldId),
      (old) => {
        if (!old) return old;
        return old.map((g) =>
          g.id === generatorId ? { ...g, currentWeather: weather } : g,
        );
      },
    );
  });
}
