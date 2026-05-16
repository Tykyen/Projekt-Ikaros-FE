# Spec 4.2d — Chat: multi-room presence

Revize presence z 4.2c. Mění **model přítomnosti** z „jsi v místnosti, když na
ni koukáš" na „jsi v místnosti, dokud z ní explicitně neodejdeš".

## Změna modelu

| | 4.2c (dnes) | 4.2d (nově) |
|---|---|---|
| Přítomnost drží | komponenta `ChatRoom` (mount/unmount) | stav „jsem uvnitř" na socketu |
| Vstup | otevření stránky místnosti | otevření stránky místnosti |
| Odchod | opuštění stránky | tlačítko Odejít / 60 min timeout / zavření appky |
| Víc místností zároveň | ne (jedna na socket) | ano |

## §1 — BE: multi-room presence

`connectedUsers` dnes drží `Map<socketId, {..., room: RoomKey}>` — jedna
místnost na socket. Nově:

```
Map<socketId, { lastSeen, username, userId, rooms: Set<RoomKey> }>
```

- `registerPresence(client, room, …)` — přidá `room` do `rooms` setu (záznam
  vytvoří, pokud chybí). Idempotentní.
- `unregisterPresence(client, room)` — odebere **jednu** `room`. Prázdný set →
  smaže celý záznam socketu.
- `getPresence(room)` — sockety, jejichž `rooms` obsahuje `room`; dedup dle
  `userId` (uživatel může mít víc socketů / tabů).
- `getRoomCounts()` — počet **unikátních userId** per místnost.

### Zavření / reload / ztráta spojení → `handleDisconnect`
Socket se odpojí → `OnGatewayDisconnect` ho odebere ze **všech** místností
(`chat:presence` `leave` s `reason: 'disconnect'` + `chat:rooms:presence`).

> Revize oproti původnímu návrhu: spec nejdřív počítal s „duchem" (záznam
> přežije odpojení až do 60min cleanupu) a `handleDisconnect` vynechával.
> Integrační ladění ukázalo, že **reload stránky = nový socket** — bez
> `handleDisconnect` se z každého reloadu hromadily duch-záznamy a držely
> počty přítomných („odejdu a počet zůstane"). `handleDisconnect` se proto
> přidal. Multi-room funguje dál: dokud je appka otevřená, socket žije a
> uživatel je přítomný všude, kam vstoupil.

## §2 — BE: hlášky příchodu/odchodu jako systémové zprávy

Hláška „X přišel" se má uchovat → uloží se jako zpráva do kanálu (vidí ji i
pozdější příchozí; TTL 1 h jako ostatní zprávy).

- `ChatMessage` dostane `isSystem?: boolean`. Pro systémovou zprávu je
  `content` = text hlášky, `senderId`/`senderName` = prázdné / `'system'`.
- Při join/leave BE uloží systémovou zprávu (`messageRepo.save`) a emitne ji
  přes `chat:message` (stejně jako běžnou).
- Text hlášky generuje BE — `presenceLine(room, action, name)` se přesune
  z FE na BE (krčmářský tón Hospody vs. poutnický Rozcestí, viz 4.2c §3).
- ⚠️ FE `lib/presenceMessages.ts` + jeho test se ruší (logika je nově na BE).

## §3 — BE: presence broadcast `server.to()`

`registerPresence` / `unregisterPresence` / `cleanupInactive` /
`handleDisconnect` — `chat:presence` posílat přes `server.to(channel)` místo
`client.to(channel)`, aby joiner/leaver viděl i **vlastní** hlášku.

## §4 — FE: odchod jen explicitní + globální heartbeat

- `ChatRoom` — **zrušit `leave` v cleanup effectu**. Opuštění stránky už
  z místnosti neodhlašuje. `joinRoom` při mountu zůstává (vstup).
- Heartbeat (4.2c §5) — přesunout z `ChatRoom` do `IkarosLayout` (nový hook
  `usePresenceHeartbeat`). Běží, dokud je uživatel přihlášen — `ChatRoom`
  nemusí být mountnutý (jsi „v Hospodě", ale koukáš na Úvodník).
- Tlačítko „Odejít" v hlavičce `ChatRoom` — nově emituje `leave` té
  místnosti (místo pouhé navigace na `/`), pak naviguje na `/`.

## §5 — FE: systémové zprávy v chatu

- `ChatMessage` typ + `isSystem`. `ChatRoom` `items` memo: zpráva s
  `isSystem` → `{ kind: 'system', text: content, … }`.
- Zrušit lokální `systemLines` `useState` + tvorbu hlášek v `handlePresence`.
  `handlePresence` nově jen aktualizuje seznam přítomných (`chat:presence`),
  hláška přijde samostatně přes `chat:message`.

## §6 — FE: navigace — počty + odchod

- Počet přítomných u Hospody / Rozcestí I.–III. **vždy** (i „0") — ✅ hotovo
  (`roomCount` / `roomCountActive`).
- U místnosti, kde uživatel zrovna je, malé „×" pro odchod přímo z nav.
  Klientský stav „moje místnosti" — jotai atom `myRoomsAtom: Set<RoomKey>`
  (joinRoom přidá, leave odebere).

## §7 — Reload stránky

Reload = nový socket. Starý socket se odpojí → `handleDisconnect` (§1) ho
odebere ze všech místností. Nový socket joinuje znovu místnost, kterou
uživatel otevřel. Žádné duch-záznamy se nehromadí; počty zůstávají přesné.

## §8 — Seznam přítomných: účet (Hospoda) vs. postava (Rozcestí)

Splňuje roadmap krok **4.2b**.

- **Hospoda** — přítomní se zobrazují účtem: `username` + `avatarUrl`
  (Osobní karta). Beze změny oproti dnešku.
- **Rozcestí I.–III.** — přítomní se zobrazují postavou: `characterName`
  + `characterAvatarUrl` z profilu uživatele. Kdo postavu nevyplnil →
  fallback na účet (`username` / `avatarUrl`).

**BE:**
- `connectedUsers` záznam / `getPresence` / `chat:presence` rozšířit o
  `characterName?`, `characterAvatarUrl?`.
- Zdroj dat: BE načte z profilu uživatele při joinu (autoritativní — FE je
  neposílá, klient nemůže lhát o cizí postavě). `registerPresence` →
  async DB lookup, nebo dávkové dotažení v `getPresence`.

**FE:**
- `ChatUser` rozšířit o `characterName?`, `characterAvatarUrl?`.
- `UserList` — pro Rozcestí preferovat postavu, pro Hospodu účet. `ChatRoom`
  předá režim (`room === 'hospoda'`).

**K potvrzení:** týká se to **jen seznamu přítomných**, nebo i jmen
u zpráv a hlášek v Rozcestí (autor = `characterName`)? Tento spec řeší
zatím jen seznam přítomných (to, co bylo na screenshotu).

## §9 — Opravy z integračního ladění

Vyšlo najevo až při testování s běžícím BE/FE:

- **`handleDisconnect`** přidán (viz §1) — odpojení/reload socketu = odchod
  ze všech místností. Bez něj zombie záznamy držely počty.
- **`chat:presence` `reason`** (`timeout` | `disconnect` | `explicit`) —
  overlay auto-odhlášení na FE se spustí **jen** pro `timeout`, ne pro reload.
- **`useSocketEvent` re-registrace** — listener se po výměně socketu
  (`useSocketInit` ho zahodí, dokud není auth token) přeregistruje na
  aktuální instanci (sleduje `socketStatusAtom`). Bez toho `chat:rooms:presence`
  nedorazil do navigace — listener visel na mrtvém socketu.
- **Účtový `avatarUrl` v presence** — BE presence nese i avatar účtu (nejen
  postavu), jinak Hospoda zobrazovala jen iniciály.
- **Pořadí v `unregisterPresence`** — hláška „opouští" se uloží/odešle ještě
  než socket opustí WS kanál; jinak by ji odcházející na své stránce neviděl.
- **`saveSystemMessage`** — `senderName: 'system'` (ne prázdný řetězec —
  schema má `required: true`).
- **Re-join guard** — překlik mezi stránkami už v místnosti negeneruje nový
  `join` ani hlášku (`joinRoom` přeskočí místnost v `myRoomsAtom`, BE navíc
  ignoruje re-join socketu, který už v místnosti je).
- **Posuvník chatu** — tenký tematizovaný (`MessageList`).

## Dopad na 4.2c

- §1/§3 nahrazují 4.2c §1 (self-include — `server.to()` ho řeší elegantněji,
  joiner se vidí přes vlastní `chat:presence`).
- §4 mění 4.2c §2 (Odejít) a §5 (heartbeat).
- §2/§5 nahrazují 4.2c §3 (narativní hlášky — text se stěhuje na BE).

## Testy

- BE: multi-room register/unregister (víc místností na socket, leave odebere
  jednu), `getRoomCounts` + `getPresence` dedup dle `userId`, systémová zpráva
  uložena při join/leave, `presenceLine` per room/action, Rozcestí presence
  nese `characterName`.
- FE: `items` zařadí `isSystem` zprávu jako system, `myRoomsAtom` join/leave,
  `ChatRoom` neemituje leave při unmountu, `UserList` zobrazí postavu
  v Rozcestí a účet v Hospodě.

## Stav

- [x] Schváleno
- [x] Implementováno (2026-05-16)
