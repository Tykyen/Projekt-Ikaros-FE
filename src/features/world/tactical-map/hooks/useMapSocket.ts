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
import { useEffect } from 'react';
import { getSocket } from '@/features/chat/api/socket';
import type {
  MapOperationBroadcast,
  MapReassignedBroadcast,
} from '../types';

interface UseMapSocketOptions {
  /** ID scény, na které se klient nachází. `null` → žádný join. */
  sceneId: string | null;
  /** Callback při příchozí `map:operation` (po BE DB commit). */
  onOperation?: (payload: MapOperationBroadcast) => void;
  /** Callback při private `map:reassigned` (cross-scene přesun mě). */
  onReassigned?: (payload: MapReassignedBroadcast) => void;
}

export function useMapSocket({
  sceneId,
  onOperation,
  onReassigned,
}: UseMapSocketOptions): void {
  useEffect(() => {
    if (!sceneId) return;
    const socket = getSocket();

    socket.emit('map:join', sceneId);

    return () => {
      socket.emit('map:leave', sceneId);
    };
  }, [sceneId]);

  // Listener: map:operation (per-scene broadcast)
  useEffect(() => {
    if (!onOperation) return;
    const socket = getSocket();
    const handler = (payload: MapOperationBroadcast): void => onOperation(payload);
    socket.on('map:operation', handler);
    return () => {
      socket.off('map:operation', handler);
    };
  }, [onOperation]);

  // Listener: map:reassigned (private cross-scene přesun)
  useEffect(() => {
    if (!onReassigned) return;
    const socket = getSocket();
    const handler = (payload: MapReassignedBroadcast): void => onReassigned(payload);
    socket.on('map:reassigned', handler);
    return () => {
      socket.off('map:reassigned', handler);
    };
  }, [onReassigned]);
}
