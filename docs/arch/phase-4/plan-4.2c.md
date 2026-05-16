# Plán 4.2c — Chat: presence & přítomnost

Implementační plán ke [spec-4.2c.md](./spec-4.2c.md). Pořadí: BE → FE
(FE §4/§5 závisí na BE eventech/endpointech).

## Část A — Backend (`Projekt-ikaros/backend/src/modules/global-chat`)

> Samostatný git repozitář — commit zvlášť, jen na vyžádání.

### A1 — `global-chat.gateway.ts`
- `broadcastRoomCounts()` (private) — `{ [room]: getPresence(room).length }`
  pro všechny `ROOM_KEYS`, `server.emit('chat:rooms:presence', counts)`.
- `getRoomCounts(): Record<RoomKey, number>` (public) — pro REST.
- `registerPresence` / `unregisterPresence` — na konci `broadcastRoomCounts()`.
- `@SubscribeMessage('chat:heartbeat')` `handleHeartbeat(client)` — záznam
  `connectedUsers.get(client.id)` → `lastSeen = new Date()`.
- `cleanupInactive` — **bez** `socket.disconnect(true)`. Nově: smazat záznam,
  `server.to(chat:channel).emit('chat:presence', {action:'leave', ...})`,
  pak `broadcastRoomCounts()`.

### A2 — `global-chat.controller.ts`
- `@Get('rooms/presence')` → `globalChatGateway.getRoomCounts()`.

### A3 — `cleanup-inactive-users.job.ts`
- Cron `EVERY_HOUR` → `EVERY_5_MINUTES`. Threshold `HOUR_MS` beze změny.

### A4 — Testy + docs
- `global-chat.gateway.spec.ts` — heartbeat aktualizuje `lastSeen`;
  `cleanupInactive` neodpojuje socket + broadcastuje leave; counts broadcast.
- `global-chat.controller.spec.ts` — `rooms/presence`.
- `docs/websocket-api.md` — doplnit `chat:heartbeat`, `chat:rooms:presence`.

## Část B — Frontend (`Projekt-ikaros-FE`)

### B1 — §1 Self-include
- `ChatRoom.tsx` — `users` memo: doplnit aktuálního uživatele, pokud chybí.

### B2 — §3 Narativní hlášky
- nový `lib/presenceMessages.ts` — `presenceLine(room, action, name)`.
- `ChatRoom.tsx` `handlePresence` — texty hlášek přes `presenceLine`.
- `lib/presenceMessages.spec.ts`.

### B3 — §2 Tlačítko Odejít
- `ChatRoom.tsx` header — tlačítko „Odejít" → `useNavigate()` → `/`.
  Leave emit řeší stávající cleanup effect při unmountu.
- `ChatRoom.module.css` — `.leave`; `@media (max-width:768px)` jen ikona.

### B4 — §4 Počty v nav
- `lib/types.ts` — `RoomPresenceCounts = Record<RoomKey, number>`.
- `api/useGlobalChat.ts` — `useRoomPresenceCounts()`: REST
  `GET /global-chat/rooms/presence` + interně `useSocketEvent('chat:rooms:presence')`
  → `setQueryData` na sdíleném klíči.
- `IkarosLayout.tsx` `SidebarContent` — `CHAT_ROOMS` položky: badge počtu
  (reuse `s.navItemBadge`), nula = skryté.

### B5 — §5 Auto-logout
- `ChatRoom.tsx`:
  - `useEffect` `setInterval` 5 min → `socket.emit('chat:heartbeat')`.
  - manuální `joinRoom()` extrahovaný z join effectu (reuse pro „Vrátit se").
  - stav `kicked` — `handlePresence` leave s vlastním `userId` → `setKicked(true)`.
  - overlay „Byl jsi odhlášen pro neaktivitu" + tlačítko „Vrátit se"
    (`setKicked(false)` + `joinRoom()`).
- `ChatRoom.module.css` — overlay styl.

### B6 — Testy
- `presenceMessages.spec.ts`, self-include v `ChatRoom`, `useRoomPresenceCounts`.

## Část C — Po implementaci
- `mobil-desktop` audit (§2 header, §4 badge, §5 overlay) — i pro side-task #1.
- `napoveda` skill — chat dostal Odejít / auto-logout / počty.
- `roadmap-fe.md` — přidat a zaškrtnout krok 4.2c.
- Spec/plán: označit `Stav` jako hotové.

## Otevřené body k potvrzení
- Heartbeat 5 min / threshold 60 min / cron 5 min — interval heartbeatu
  musí být `< threshold`; 5 min dává ~12 signálů na okno, bezpečná rezerva.
