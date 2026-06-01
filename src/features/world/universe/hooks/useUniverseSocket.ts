// 10.1d — real-time sync vesmírné mapy.
// BE emituje `universe:updated` jako pouhý SIGNÁL `{ worldId }` (bez dat —
// jinak by hráč v `world:{worldId}` roomu viděl po drátě i skrytá tělesa).
// Hook: join room (+ reconnect re-join), listener → invaliduje query → refetch
// `GET /universe`, který je server-side filtrovaný dle visibility.
// `suspended` (edit mód) = draft má přednost; signál se NEaplikuje (žádný
// refetch), jen rozsvítí `staleFromRemote` (badge „mapa byla mezitím změněna").
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/features/chat/api/socket';
import { universeQueryKey } from '../api/useUniverse';

interface UniverseUpdatedSignal {
  worldId: string;
}

export interface UseUniverseSocketResult {
  /** True, pokud během edit módu dorazila cizí změna mapy. */
  staleFromRemote: boolean;
  clearStale: () => void;
}

export function useUniverseSocket(
  worldId: string,
  suspended: boolean,
): UseUniverseSocketResult {
  const queryClient = useQueryClient();
  const [staleFromRemote, setStaleFromRemote] = useState(false);

  // listener čte aktuální `suspended` přes ref (bez re-subscribe).
  const suspendedRef = useRef(suspended);
  useEffect(() => {
    suspendedRef.current = suspended;
  }, [suspended]);

  const clearStale = useCallback(() => setStaleFromRemote(false), []);

  // room join + reconnect re-join
  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();
    const room = `world:${worldId}`;
    socket.emit('room:join', room);
    const onConnect = (): void => {
      socket.emit('room:join', room);
    };
    socket.on('connect', onConnect);
    return () => {
      socket.emit('room:leave', room);
      socket.off('connect', onConnect);
    };
  }, [worldId]);

  // listener
  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();
    const handler = (signal: UniverseUpdatedSignal): void => {
      if (!signal || signal.worldId !== worldId) return;
      if (suspendedRef.current) {
        setStaleFromRemote(true);
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: universeQueryKey(worldId),
      });
    };
    socket.on('universe:updated', handler);
    return () => {
      socket.off('universe:updated', handler);
    };
  }, [worldId, queryClient]);

  return { staleFromRemote, clearStale };
}
