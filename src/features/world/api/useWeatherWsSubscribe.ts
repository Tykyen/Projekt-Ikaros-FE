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
import { useSocketEvent } from '@/features/chat/api/useSocket';
import type { WeatherGenerator, WeatherResult } from '@/shared/types';
import { weatherGeneratorsKey } from './useWeatherGenerators';

interface WeatherUpdatedPayload {
  worldId: string;
  generatorId: string;
  generatorName?: string;
  weather: WeatherResult;
}

export function useWeatherWsSubscribe(worldId: string): void {
  const qc = useQueryClient();

  useSocketEvent<WeatherUpdatedPayload>('weather:updated', (event) => {
    if (!worldId || event.worldId !== worldId) return;

    qc.setQueryData<WeatherGenerator[]>(
      weatherGeneratorsKey(worldId),
      (old) => {
        if (!old) return old;
        return old.map((g) =>
          g.id === event.generatorId
            ? { ...g, currentWeather: event.weather }
            : g,
        );
      },
    );
  });
}
