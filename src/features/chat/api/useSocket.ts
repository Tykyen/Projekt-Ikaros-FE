import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { getSocket, disconnectSocket } from './socket';
import { accessTokenAtom } from '@/shared/store/authStore';
import { socketStatusAtom } from '../store/socketStore';
import type { Socket } from 'socket.io-client';

/** Řídí životní cyklus socketu podle auth stavu — volat jednou v root layoutu. */
export function useSocketInit(): void {
  const token = useAtomValue(accessTokenAtom);
  const status = useAtomValue(socketStatusAtom);
  const wasConnected = useRef(false);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }
    getSocket();
  }, [token]);

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
  const status = useAtomValue(socketStatusAtom);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getSocket();
    const cb = (data: T) => handlerRef.current(data);
    socket.on(event, cb);
    return () => { socket.off(event, cb); };
  }, [event, status]);
}
