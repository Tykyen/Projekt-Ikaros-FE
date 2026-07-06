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

  // reconnect refetch — `world:{id}` room join/leave (i re-join po reconnectu)
  // drží výhradně `useWorldSocket` (WorldLayout, jediný vlastník W-7/W-9); tady
  // se dřív dělal vlastní `room:join`/`room:leave`, ale bez ref-countingu →
  // odchod z Universe mapy zavolal `room:leave` i za WorldLayout a vykopl
  // dashboard z roomu (FIX-1). Zůstává jen `connect` listener, který po
  // reconnectu refetchne zmeškaný `universe:updated` signál (S-RUN-03).
  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();
    const onConnect = (): void => {
      // S-RUN-03 — re-join sám nestačí: signál `universe:updated` zmeškaný
      // během výpadku je pryč → po reconnectu refetch (mimo edit mód, kde má
      // draft přednost a jen rozsvítíme badge „mapa byla mezitím změněna").
      if (suspendedRef.current) {
        setStaleFromRemote(true);
      } else {
        void queryClient.invalidateQueries({
          queryKey: universeQueryKey(worldId),
        });
      }
    };
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [worldId, queryClient]);

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
