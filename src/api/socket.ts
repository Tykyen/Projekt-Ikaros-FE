import { io, type Socket } from "socket.io-client";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let socket: Socket | null = null;

/**
 * Lazy singleton Socket.IO klient. BE běží na default namespace `/` a očekává
 * JWT v `auth.token`. Viz `Projekt-ikaros/docs/websocket-api.md` pro seznam eventů.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  const token = localStorage.getItem("ikaros.jwt") ?? undefined;

  socket = io(baseUrl, {
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: true,
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
