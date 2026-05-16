import { io, type Socket } from 'socket.io-client';
import { getDefaultStore } from 'jotai';
import { accessTokenAtom } from '@/shared/store/authStore';
import { socketStatusAtom } from '../store/socketStore';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  // Vrátit existující instanci bez ohledu na `connected` — socket.io si stavy
  // connecting/reconnecting řeší interně. Recyklace jediné instance brání tomu,
  // aby paralelní `getSocket()` volání během navazování spojení vytvořila víc
  // socketů (pak by listenery a room:join skončily na různých instancích).
  // Nová instance vznikne jen po `disconnectSocket()` (které `socket` nuluje).
  if (socket) return socket;

  const token = getDefaultStore().get(accessTokenAtom) ?? undefined;

  socket = io(baseUrl, {
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket'],
  });

  const store = getDefaultStore();
  socket.on('connect', () => store.set(socketStatusAtom, 'connected'));
  socket.on('disconnect', () => store.set(socketStatusAtom, 'disconnected'));
  socket.on('connect_error', () => store.set(socketStatusAtom, 'error'));

  store.set(socketStatusAtom, 'connecting');
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  getDefaultStore().set(socketStatusAtom, 'disconnected');
}

/**
 * 1.5 D-052 — force reconnect socketu po změně hiddenPresence
 * (server čte flag z DB při handleConnection, takže reconnect ho aplikuje).
 */
export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
}
