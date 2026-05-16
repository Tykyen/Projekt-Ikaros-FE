# Plán 4.2d — Chat: multi-room presence

Implementační plán ke [spec-4.2d.md](./spec-4.2d.md). Pořadí: BE → FE.
§8 řeší **jen seznam přítomných** (potvrzeno schválením specu — jména
u zpráv/hlášek zůstávají beze změny).

## Část A — Backend (`Projekt-ikaros`)

### A1 — `connectedUsers` multi-room (`global-chat.gateway.ts`)
- Záznam: `{ lastSeen, username, userId, characterName?, characterAvatarUrl?,
  rooms: Set<RoomKey> }`.
- `registerPresence` — přidá `room` do `rooms` (záznam vytvoří, pokud chybí),
  obnoví `lastSeen`.
- `unregisterPresence(client, room)` — odebere jednu `room`; prázdný set →
  smaže záznam. `handleHospodaLeave` → room `'hospoda'`.
- `getPresence(room)` / `getRoomCounts()` — filtr `rooms.has(room)`, dedup
  dle `userId`.

### A2 — Systémové zprávy (`ChatMessage.isSystem`)
- `chat-message.interface.ts` + schema — `isSystem?: boolean`.
- `presence-messages.ts` (nový) — `presenceLine(room, action, name)` (port
  z FE `lib/presenceMessages.ts`).
- `GlobalChatService.saveSystemMessage(room, text)` — uloží zprávu
  `isSystem:true`, `senderId:'system'`, emit `chat.global.message.created`
  (reuse stávající broadcast → `chat:message`).
- Gateway register/unregister volá `saveSystemMessage` (fire-and-forget).

### A3 — `chat:presence` přes `server.to()`
- register/unregister/cleanup — `server.to(channel)` místo `client.to()`.

### A4 — §8 character data v presence
- Gateway dostane `UsersService` (nebo repo) — při joinu načte
  `characterName` + `characterAvatarUrl`, uloží do `connectedUsers` záznamu.
- `getPresence` + `chat:presence` join je nesou.

### A5 — Testy + docs
- `global-chat.gateway.spec.ts` — multi-room register/unregister, dedup,
  presence s character daty.
- `global-chat.service.spec.ts` — `saveSystemMessage`.
- `websocket-api.md` — `chat:presence` payload (+ character pole), poznámka
  o systémových zprávách.

## Část B — Frontend (`Projekt-ikaros-FE`)

### B1 — Odchod jen explicitní (`ChatRoom.tsx`)
- Zrušit `return () => { …leave… }` v join effectu. `joinRoom` zůstává.
- `handleLeave` — emit `leave` té místnosti + `navigate('/')`.

### B2 — Globální heartbeat
- `usePresenceHeartbeat()` (nový) — `setInterval` `chat:heartbeat`, volá se
  v `IkarosLayout`.
- `ChatRoom` — heartbeat effect odstranit.

### B3 — Systémové zprávy v chatu
- `types.ts` `ChatMessage` + `isSystem?: boolean`.
- `ChatRoom` `items` memo — `isSystem` zpráva → `{ kind: 'system' }`.
- Zrušit `systemLines` `useState` + tvorbu hlášek v `handlePresence`
  (zůstane jen update seznamu přítomných).
- Smazat `lib/presenceMessages.ts` + `.spec.ts` (logika je na BE).

### B4 — `myRoomsAtom` + odchod z nav
- `myRoomsAtom: Set<RoomKey>` (jotai) — `joinRoom` přidá, `leave` odebere.
- `IkarosLayout` nav — místnost v `myRoomsAtom` → „×" tlačítko → emit `leave`
  + úprava atomu.

### B5 — §8 účet vs. postava (`UserList`)
- `ChatUser` + `characterName?`, `characterAvatarUrl?`.
- `UserList` — prop režimu; Rozcestí preferuje postavu (fallback účet),
  Hospoda účet. `ChatRoom` předá dle `room`.

### B6 — Testy
- `presenceUsers` (zůstává), `myRoomsAtom`, `UserList` režim, `items` se
  `isSystem`.

## Část C — Po implementaci
- `mobil-desktop` audit (nav „×", UserList postava).
- `napoveda` — Rozcestí = postava, multi-room chování.
- `roadmap-fe.md` — krok 4.2d + zaškrtnout 4.2b (splněno §8).
- Stav spec/plán.

## Pozn. k 4.2c
- 4.2c `presenceMessages.ts`/self-include logika se ruší/nahrazuje — viz
  „Dopad na 4.2c" ve specu. Roadmap 4.2c zůstává (byl reálně dodán),
  4.2d je jeho revize.
