import { io, type Socket } from 'socket.io-client';
import { getDefaultStore } from 'jotai';
import { accessTokenAtom } from '@/shared/store/authStore';
import { anonSessionAtom } from '../store/anonSession';
import { socketGenerationAtom, socketStatusAtom } from '../store/socketStore';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  // Vrátit existující instanci bez ohledu na `connected` — socket.io si stavy
  // connecting/reconnecting řeší interně. Recyklace jediné instance brání tomu,
  // aby paralelní `getSocket()` volání během navazování spojení vytvořila víc
  // socketů (pak by listenery a room:join skončily na různých instancích).
  // Nová instance vznikne jen po `disconnectSocket()` (které `socket` nuluje).
  if (socket) return socket;

  // Členský token má přednost; 15.8 — host použije guest token (Hospoda).
  const store0 = getDefaultStore();
  const token =
    store0.get(accessTokenAtom) ?? store0.get(anonSessionAtom)?.token ?? undefined;

  socket = io(baseUrl, {
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: true,
    // W-8 / D-NEW-WS-UPGRADE — polling-first (default Socket.IO pořadí).
    // Začni pollingem (projde přes každou proxy), pak engine.io upgraduje na WS.
    // Pozor: websocket-first ('websocket' jako první) hází za proxy do konzole
    // „WebSocket is closed before the connection is established" — failnutý
    // přímý WS handshake, po kterém teprve spadne na polling. Polling-first
    // je tišší a proxy-friendly; když WS upgrade nejde, real-time jede dál na pollingu.
    transports: ['polling', 'websocket'],
  });

  const store = getDefaultStore();
  socket.on('connect', () => store.set(socketStatusAtom, 'connected'));
  socket.on('disconnect', () => store.set(socketStatusAtom, 'disconnected'));
  socket.on('connect_error', () => store.set(socketStatusAtom, 'error'));
  // F5 (EC-06) — globální záchyt server-push `error` eventů. Bez něj se chyba
  // z gateway bez vlastního listeneru tiše ztratí (dřív řešila jen taktická mapa).
  // Komponenty s vlastním UX (mapa: toast) si event navíc odchytí samy.
  socket.on('error', (payload: unknown) => {
    console.error('[socket] server error event', payload);
  });

  store.set(socketStatusAtom, 'connecting');
  // D-AUDIT-2026-07-11 — signál „vznikla nová instance" pro effecty, které
  // na instanci drží listenery / room membership (re-bind vzor, viz socketStore).
  store.set(socketGenerationAtom, store.get(socketGenerationAtom) + 1);
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  // D-AUDIT-2026-07-11 (socket-swap listener leak) — centrální úklid swapu:
  // stará instance zahodí VŠECHNY listenery (komponentní i vlastní z getSocket).
  // Bez toho by na mrtvé instanci visely handlery až do cleanup fáze effectů
  // (a při jakémkoli pozdním eventu by běžely dvojitě vedle handlerů nové
  // instance). Component cleanupy pak volají `.off` už jen jako no-op.
  socket?.removeAllListeners();
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
