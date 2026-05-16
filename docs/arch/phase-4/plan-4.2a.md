# Implementační plán — krok 4.2a Rozcestí (`/chat/rozcesti*`)

**Datum:** 2026-05-16
**Status:** ✅ Implementováno (2026-05-16) — čeká na smoke test
**Spec:** [`spec-4.2a.md`](./spec-4.2a.md)
**Větev:** `main` (obě repa) — rozhodnuto autorem, bez feature větví (jako 4.1).

---

## Odchylky od specu (odhaleno při psaní plánu)

| # | Spec říká | Plán mění na | Důvod |
|---|---|---|---|
| A | §4.3 — změna prostředí přes WS `emit('chat:room:environment')` | **REST** `PUT /global-chat/rooms/:room/environment` (auth + role guard), BE pak WS broadcastne | WS gateway nemá auth → roli nelze ověřit; FE-poskytnutá role je nedůvěryhodná. REST má `JwtAuthGuard` + role guard. |
| B | §4.5 — „registr kanálů" obecně | `connectedUsers` v gateway se rozšíří o `channelId`; `getPresence(channelId)` filtruje | Dnes jedna globální mapa → 3 Rozcestí by sdílela seznam přítomných. |

Obě odchylky jsou v souladu s cílem specu, jen zpřesňují mechanismus. Změnu prostředí
přes REST je navíc lepší pro budoucí perzistenci (4.2b+).

---

## Pořadí: BE → FE

BE definuje kontrakt (kanály, presence per-channel, environment endpoint). FE na něm staví.

---

## Step 1 — BE: víc kanálů (repo `Projekt-ikaros`)

**Cíl:** `GlobalChatService` zná 4 kanály — `hospoda` + `rozcesti-1/2/3` — místo jednoho.

**Soubory:**
- `backend/src/modules/global-chat/global-chat.service.ts`:
  - `globalChannelId: string` → `private channels = new Map<RoomKey, string>()`
    (`RoomKey = 'hospoda' | 'rozcesti-1' | 'rozcesti-2' | 'rozcesti-3'`).
  - `onModuleInit` — zajistí všechny 4 záznamy v `chatchannels` (`findGlobal` rozšířit
    nebo lookup dle `name`; Rozcestí kanály `isGlobal: true`, jména „Rozcestí I./II./III.").
  - `getGlobalChannelId()` → `getChannelId(room: RoomKey): string`.
  - `getMessages` / `sendMessage` / `deleteMessage` — přijmou `room: RoomKey`,
    operují nad `getChannelId(room)`. Validace neznámého `room` → 404.
- `backend/src/modules/global-chat/global-chat.service.spec.ts` — testy: 4 kanály
  inicializované, zprávy filtrované dle správného `channelId`, izolace mezi kanály.

**Acceptance:** BE testy zelené; 4 kanály v DB; zpráva v `rozcesti-1` se nevrátí pro `hospoda`.

---

## Step 2 — BE: presence per-channel + prostředí místnosti

**Soubory:**
- `backend/src/modules/global-chat/global-chat.gateway.ts`:
  - `connectedUsers` hodnota rozšířena o `channelId` (resp. `room: RoomKey`).
  - Nové handlery `chat:room:join` / `chat:room:leave` — payload
    `{ room, username, userId }`. Stejná logika jako `chat:hospoda:*`, navíc uloží
    `room`. `chat:hospoda:*` **zůstává beze změny** (rozhodnutí specu §9.3).
  - `getPresence(room: RoomKey)` — filtruje `connectedUsers` dle `room`.
  - Nová metoda `broadcastEnvironment(room, env)` — emit `chat:room:environment`
    do `chat:{channelId}` (volá ji controller po REST změně).
  - In-memory `environments = new Map<RoomKey, { style, placeId }>()`, default
    `{ style: 'fantasy', placeId: '1' }`; `getEnvironment(room)`.
- `Projekt-ikaros/docs/websocket-api.md` §3 — doplnit `chat:room:join/leave`,
  `chat:room:environment`, Rozcestí kanály.

**Acceptance:** gateway test — `getPresence` izolovaná per room; `broadcastEnvironment` emituje.

---

## Step 3 — BE: REST endpointy pro Rozcestí

**Soubory:**
- `backend/src/modules/global-chat/global-chat.controller.ts`:
  - `room-info`, `messages`, `messages POST`, `messages DELETE` — přijmou
    `?room=` query (default `hospoda` → zpětná kompatibilita Hospody).
  - `GET /global-chat/rooms/:room/environment` — vrátí `{ style, placeId }`.
  - `PUT /global-chat/rooms/:room/environment` — `JwtAuthGuard` + **role guard**
    (Superadmin/Admin/SpravceClanku/SpravceGalerie/SpravceDiskuzi). Body
    `{ style, placeId }`. Uloží do gateway mapy + `gateway.broadcastEnvironment(...)`.
- `dto/set-room-environment.dto.ts` — NOVÉ: `@IsIn(['fantasy','scifi','mystic']) style`,
  `placeId` string `'1'..'20'`.
- Role guard — ověřit existující `RolesGuard`/dekorátor; pokud není, nový
  `PlatformStaffGuard` (povolí 5 rolí výše). `AdminGuard` nestačí — pouští jen Admin/Superadmin.

**Acceptance:** `PUT environment` jako běžný `Uživatel` → 403; jako Správce → 200 + WS broadcast.

---

## Step 4 — FE: data lokací (`features/chat/lib/`)

**Soubory:**
- `src/features/chat/lib/rozcestiPlaces.ts` — NOVÉ: `ROZCESTI_PLACES: Record<Style,
  Place[]>` z `ROZCESTI_PLACES` starého Matrixu (`Projekt-ikaros/.. nebo C:\Matrix\Matrix`).
  `Place = { id, name, image }`. Přípony `.png` → `.webp`. Helper `placeImageUrl(style, place)`
  — fantasy `/images/rozcesti/{img}`, scifi/mystic `/images/rozcesti/{style}/{img}`.
- `src/features/chat/lib/rozcestiDescriptions/{fantasy,scifi,mystic}.ts` — NOVÉ:
  doslovná kopie 60 popisů ze starého `descriptions/*.ts` (klíče `'1'`–`'20'`).
- `src/features/chat/lib/rozcestiDescriptions/index.ts` — sloučí do
  `ROZCESTI_DESCRIPTIONS: Record<Style, Record<string,string>>`.

**Acceptance:** `rozcestiPlaces.test.ts` — 3×20 lokací, každá má obrázek i popis (60/60).

---

## Step 5 — FE: typy + API vrstva (parametrizace kanálem)

**Soubory:**
- `src/features/chat/lib/types.ts` — `RoomKey` typ; `RoomEnvironment`
  (`{ style, placeId }`); `EnvironmentEvent` (WS `chat:room:environment` payload).
- `src/features/chat/api/useGlobalChat.ts`:
  - `useRoomInfo`, `useChatHistory`, `useSendMessage`, `useDeleteMessage` — přijmou
    `room: RoomKey`, query klíče `['global-chat', room, ...]` (dnes bez `room`).
    Hospoda volá s `'hospoda'` → klíče zpětně rozšířené, žádná regrese chování.
  - `useRoomEnvironment(room)` — `GET .../rooms/:room/environment`.
  - `useSetRoomEnvironment(room)` — mutace `PUT .../rooms/:room/environment`.

**Acceptance:** `useGlobalChat.test.ts` — query klíče nesou `room`; mutace cílí správný endpoint.

---

## Step 6 — FE: refaktor `ChatRoom` na parametrizovaný

**Soubory:**
- `src/features/chat/components/ChatRoom.tsx`:
  - Props: `room: RoomKey`, `roomName: string`, `icon: ReactNode`,
    `environment?: { node: ReactNode; backgroundUrl?: string }` (volitelný — Hospoda
    ho nemá, Rozcestí dodá záhlaví scény + pozadí).
  - `ROOM_NAME` konstanta → prop `roomName`. `Beer` ikona → prop `icon`.
  - WS join: pro `room === 'hospoda'` ponechat `chat:hospoda:join/leave`
    (beze změny); pro Rozcestí `chat:room:join/leave` s `{ room, ... }`.
  - Query klíče `MESSAGES_KEY`/`ROOM_INFO_KEY` → odvozené z `room`.
  - Systémové hlášky „přichází do hospody" → text dle `roomName`.
  - Když je `environment` zadané — vykreslí `environment.node` pod `header` a nastaví
    `backgroundUrl` jako pozadí `.room` (modifier class `s.scene`).
- `ChatRoom.module.css` — `.scene` (pozadí ilustrace + vinětový/grain overlay),
  `.scenePanel` (poloprůhledné panely + `backdrop-filter`), crossfade pozadí. Viz §4.7 specu.
- `src/features/chat/pages/ChatPage.tsx` — `<ChatRoom room="hospoda" roomName="Interdimenzionální hospoda" icon={<Beer/>} />`.

**Acceptance:** `/chat` (Hospoda) funguje beze změny — smoke + `ChatRoom.test.tsx`.

---

## Step 7 — FE: Rozcestí — stránka, záhlaví, popis

**Soubory (každá komponenta + `*.module.css`):**
- `src/features/chat/pages/RozcestiPage.tsx` — NOVÉ: čte `:roomId` z routy
  (`rozcesti`→`rozcesti-1`, `rozcesti2`→`rozcesti-2`, `rozcesti3`→`rozcesti-3`),
  neznámé → redirect/404. Drží stav prostředí (z `useRoomEnvironment` + WS
  `chat:room:environment` listener). Renderuje `<ChatRoom room=… environment=… />`.
- `src/features/chat/components/RozcestiHeader.tsx` — NOVÉ: 2 „kartuše" (styl + lokace)
  + 📖 tlačítko. Pro roli bez oprávnění read-only (zámek + tooltip). Změna volá
  `useSetRoomEnvironment`. Styl/lokace dle §4.7 — ne nativní `<select>` look.
- `src/features/chat/components/RozcestiDescription.tsx` — NOVÉ: accordion panel
  se slovním popisem aktivní lokace (`ROZCESTI_DESCRIPTIONS`).
- `src/features/chat/lib/rozcestiRooms.ts` — NOVÉ: mapa `roomId` (URL) ↔ `RoomKey`
  ↔ `roomName` (Rozcestí I./II./III.).

**Acceptance:** `RozcestiPage.test.tsx`, `RozcestiHeader.test.tsx` zelené; změna lokace
u jednoho klienta se přes WS projeví u druhého.

---

## Step 8 — FE: routy + sidebar

**Soubory:**
- `src/app/router.tsx` — za `chat` (ř. 152) přidat 3 routy `chat/rozcesti`,
  `chat/rozcesti2`, `chat/rozcesti3` → `p(RozcestiPage)`, `loader: requireAuth`.
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — `CHAT_ROOMS` (ř. 92–96): zrušit
  `disabled: true` u Rozcestí I.–III. Render disabled větve může zůstat (už se netrefí).

**Acceptance:** sidebar — Rozcestí I.–III. klikatelné, badge „Brzy" pryč, vedou na správné routy.

---

## Step 9 — Nápověda + mobil-desktop

- Skill `napoveda` — doplní sekci Rozcestí do `/ikaros/napoveda`.
- Skill `mobil-desktop` — ověří layout Rozcestí (záhlaví scény, 📖 panel, pozadí)
  na 375 / 768 / 1440, doladí CSS.

---

## Závěrečný checklist

- [ ] BE: `npm run test -- global-chat` + `npm run build` (repo `Projekt-ikaros`)
- [ ] FE: `npm run build`, `npm run lint`, `npm run test:run`
- [ ] Smoke 2 účty / 2 okna: izolace 3 místností; sdílené prostředí (styl+lokace);
      role-gating (Uživatel vs Správce); whisper, typing, presence; theme switch; mobil
- [ ] Regrese Hospody (`/chat`) — zprávy, whisper, presence beze změny
- [ ] 60/60 lokací — obrázek i popis
- [ ] `roadmap-fe.md` — krok 4.2 přečíslovat na 4.2a (hotovo) / 4.2b (zbývá)
- [ ] Commity dle konvence

## Commit strategie

Per logický celek, samostatně revertovatelné:
- BE: `feat(global-chat): víc kanálů + presence per-channel + Rozcestí environment`
- FE: po krocích — data lokací, api, ChatRoom refaktor, Rozcestí komponenty, routy+sidebar.

Commituji jen na výslovný pokyn autora.

---

## Rozhodnutí autora

1. **Větev:** bez feature větví — práce rovnou v `main` (obě repa), jako 4.1. ✅
2. **Role guard:** delegováno na implementaci — použít existující BE mechanismus,
   pokud je; jinak nový `PlatformStaffGuard`. ✅
