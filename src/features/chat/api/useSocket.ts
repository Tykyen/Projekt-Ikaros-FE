import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { getSocket, disconnectSocket } from './socket';
import { accessTokenAtom } from '@/shared/store/authStore';
import { anonSessionAtom } from '../store/anonSession';
import { socketGenerationAtom, socketStatusAtom } from '../store/socketStore';
import type { Socket } from 'socket.io-client';

/** Řídí životní cyklus socketu podle auth stavu — volat jednou v root layoutu. */
export function useSocketInit(): void {
  const token = useAtomValue(accessTokenAtom);
  // 15.8 — host (guest session) se taky připojí (Hospoda); členský token přednost.
  const anon = useAtomValue(anonSessionAtom);
  const effectiveToken = token ?? anon?.token ?? null;
  const status = useAtomValue(socketStatusAtom);
  const wasConnected = useRef(false);

  useEffect(() => {
    if (!effectiveToken) {
      disconnectSocket();
      return;
    }
    getSocket();
  }, [effectiveToken]);

  // Toast při ztrátě spojení (jen když předtím bylo connected)
  useEffect(() => {
    if (status === 'disconnected' && wasConnected.current) {
      toast.warning('Ztratilo se spojení se serverem...');
    }
    if (status === 'connected' && wasConnected.current) {
      toast.success('Spojení obnoveno'); // jen při REconnect
    }
    if (status === 'connected') {
      wasConnected.current = true; // nastavit AŽ na konci
    }
  }, [status]);
}

/** Vrací socket instanci — volat jen pokud je uživatel přihlášen. */
export function useSocket(): Socket {
  return getSocket();
}

/**
 * W-7 — spustí `onReconnect` po každém (re)connectu socketu. Socket.IO po
 * reconnectu zahodí VŠECHNY rooms; ruční `room:join` se sám neobnoví, takže
 * bez tohoto by listenery žily, ale server by do roomu nic neposílal (klient
 * „oslepne"). Použij pro re-emit `room:join` / `map:join-world` apod.
 *
 * `connect` se emituje až PO (re)connectu — když je socket při mountu už
 * připojený, initial se nevyvolá (žádný duplicate s mount-join useEffectem).
 */
export function useSocketReconnect(onReconnect: () => void): void {
  const ref = useRef(onReconnect);
  useEffect(() => {
    ref.current = onReconnect;
  }, [onReconnect]);

  // S-RUN-04 (plný audit 2026-06-20) — sledujeme `socketStatusAtom` (stejně jako
  // useSocketEvent): po `reconnectSocket()` (toggle neviditelnosti v Soukromí)
  // vznikne NOVÁ socket instance. S prázdnými deps by handler zůstal viset na
  // staré odpojené instanci a re-join callbacky (~14 call-sites: world chat,
  // ChannelView, mapy, friendships, events…) by se po reconnectu nespustily →
  // real-time slepota do F5. Re-registrací na změnu stavu se obnoví.
  // D-AUDIT-2026-07-11 — navíc `socketGenerationAtom`: kryje swap, při kterém
  // status skončí na stejné hodnotě (např. reconnect během 'connecting').
  const status = useAtomValue(socketStatusAtom);
  const generation = useAtomValue(socketGenerationAtom);
  useEffect(() => {
    const socket = getSocket();
    const handler = (): void => ref.current();
    socket.on('connect', handler);
    return () => {
      socket.off('connect', handler);
    };
  }, [status, generation]);
}

/** Přihlásí se k socket eventu a odhlásí při unmount. */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
): void {
  const handlerRef = useRef(handler);
  // Socket může být během života komponenty vyměněn — `useSocketInit` ho
  // zahodí, dokud není auth token, a po jeho načtení vytvoří nový. Sledujeme
  // proto socket stav a po každé změně listener přeregistrujeme na aktuální
  // instanci; jinak by zůstal viset na mrtvém socketu (viz počty místností).
  // D-AUDIT-2026-07-11 — navíc `socketGenerationAtom` (nová instance = nová
  // generace): kryje swap, při kterém status skončí na stejné hodnotě.
  const status = useAtomValue(socketStatusAtom);
  const generation = useAtomValue(socketGenerationAtom);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getSocket();
    const cb = (data: T) => handlerRef.current(data);
    socket.on(event, cb);
    return () => { socket.off(event, cb); };
  }, [event, status, generation]);
}
