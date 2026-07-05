# Plán 16.6 — implementační (file diff FE + BE)

**Spec:** [spec-16.6.md](spec-16.6.md) · **Návrh:** [proto-16.6-camp.html](proto-16.6-camp.html)
**Status:** 🟡 k realizaci · **Datum:** 2026-07-05

Pořadí: **BE (jeden provázaný modul, dělám sám)** → **FE (types kontrakt sám, pak komponenty přes agenty)** → docs → verify. BE/FE se v jedné agent-dávce nemíchá ([[feedback_no_mixed_be_fe_batch]]).

---

## Fáze 0 — rename mapa (název = žánr)

| room | default žánr | default název |
|---|---|---|
| camp-1 | fantasy | **Fantasy camp** |
| camp-2 | mystic | **Mystery camp** |
| camp-3 | scifi | **Sci-fi camp** |

Interní klíče `camp-1/2/3`, routy `/chat/camp[2,3]`, WS eventy — **beze změny**. Mění se jen zobrazené názvy + přidává dynamika v hlavičce.

---

## Fáze 1 — BE (`Projekt-ikaros/backend/src/modules/global-chat/`)

### 1a. `global-chat.service.ts`
- `ROOM_DEFS` názvy: „Camp I./II./III." → „Fantasy camp / Mystery camp / Sci-fi camp".
- `CAMP_DEFAULT_GENRE: Record<RoomKey,'fantasy'|'scifi'|'mystic'>` (hospoda vynechá) — `camp-1:fantasy, camp-2:mystic, camp-3:scifi`.
- `genreLabel(style)` + `roomName(room, style)` → „Fantasy camp" atd. (název z aktuálního žánru).
- `randomPlaceId(): string` → '1'..'20' (deterministicky náhodné, `Math.random` OK v service).
- **Saved-game CRUD** (nová kolekce, přes nový repo nebo přímo model):
  - `saveGame(userId, room)` → snapshot posledních **20** zpráv (`getMessages` filtruj `!isSystem && (visibleTo prázdné)`), namapuj na `SavedChatLine {senderName, content, color, createdAt}` + `{room, style, placeId}` z gateway env → **upsert dle userId**.
  - `getSavedGame(userId)` → doc | null.
  - `loadGame(userId)` → načte doc; přes gateway `setEnvironment(room, {style,placeId})` + `setStartHere(room, {lines, byUserName, at})`; vrátí doc. (Load nastaví env místnosti z uloženého — dočasný override.)
  - `deleteSavedGame(userId)`.
- **Admin defaults** (trvalý žánr): `getRoomDefaults()` / `setRoomDefault(room, style)` — perzistentní (malá kolekce `camp-room-config` nebo reuse settings). Cron čte odtud (fallback `CAMP_DEFAULT_GENRE`).

### 1b. `schemas/camp-saved-game.schema.ts` (NOVÝ, vzor `anon-ban.schema.ts`)
```ts
@Schema({ collection: 'campsavedgames' })
class CampSavedGameSchemaClass {
  @Prop({ required: true, unique: true, index: true }) userId: string;
  @Prop({ required: true }) room: string;      // camp-1/2/3
  @Prop({ required: true }) style: string;      // fantasy|scifi|mystic
  @Prop({ required: true }) placeId: string;
  @Prop({ type: [Object], default: [] }) messages: SavedChatLine[];
  @Prop({ required: true }) savedAt: Date;
}
```
`SavedChatLine = {senderName, content, color, createdAt}`. Unique `userId` → 1 slot (upsert).
Volitelně `schemas/camp-room-config.schema.ts` (room→style default) pro admin override.

### 1c. `global-chat.gateway.ts`
- `DEFAULT_ENVIRONMENT` per room: default žánr z `CAMP_DEFAULT_GENRE` + placeId '1' (ne natvrdo fantasy/1). `getEnvironment(room)` fallback = `{style: default(room), placeId:'1'}`.
- **`startHere` stav:** `private readonly startHere = new Map<RoomKey, StartHere>()`. `getStartHere(room)`, `setStartHere(room, data)` (broadcast `chat:room:startHere`), `clearStartHere(room)`.
- `setEnvironment` beze změny (broadcast environment).
- Rotace helper `applyRotation(room)`: `setEnvironment(room, {style: default(room), placeId: randomPlaceId()})` + `clearStartHere(room)` (+ broadcast obojí).

### 1d. `camp-rotation.job.ts` (NOVÝ, vzor `clean-messages.job.ts`)
```ts
@Cron('0 0,12 * * *')  // 00:00 a 12:00
rotate() { for (camp-1/2/3) gateway.applyRotation(room); }
```

### 1e. `global-chat.controller.ts`
- `POST rooms/:room/save-game` (member) → `service.saveGame(user.id, room)`.
- `GET saved-game` (member) → `service.getSavedGame(user.id)`.
- `POST saved-game/load` (member) → `service.loadGame(user.id)` (načte do místnosti z uloženého room).
- `DELETE saved-game` (member) → `service.deleteSavedGame(user.id)`.
- `GET rooms/defaults` (member — jen čtení) + `PUT rooms/:room/default` (`@Roles(Admin,Superadmin)`) → admin default žánr.
- Guest (anon) na save/load → 403 (member gate, jako upload).

### 1f. `global-chat.module.ts`
- `MongooseModule.forFeature` + `CampSavedGameSchema` (+ config schema).
- `providers`: `CampRotationJob`.

### 1g. `docs/websocket-api.md`
- `chat:room:startHere` (BE→) + poznámka o rotaci.

### 1h. BE testy
- rotace (default žánr + random place + startHere clear), saveGame snapshot (20, bez system/whisper), upsert 1-slot, loadGame nastaví env+startHere, auth (guest 403, hráč PUT default 403, admin OK).

### 1i. ⚠️ Presence bug (uživatelský report — prověřit v tomto průchodu)
- Ověřit: vstup do Campu neoznačí uživatele jako přítomného v Hospodě. Zkoumat `registerPresence` (`record.rooms`), `getRoomCounts`, a FE (`ChatRoom` join, případné mountování Hospody na pozadí, badge „Chat (N)"). Pokud bug potvrzen → opravit + `chybovy-denik` CH-xxx.

---

## Fáze 2 — FE (`src/features/chat/`) — types sám, komponenty přes agenty

### 2a. `lib/types.ts` (SÁM — sdílený kontrakt, první)
- `SavedChatLine {senderName; content; color: string|null; createdAt: string}`.
- `CampSavedGame {room: RoomKey; style: RoomStyle; placeId: string; messages: SavedChatLine[]; savedAt: string}`.
- `StartHere {lines: SavedChatLine[]; byUserName: string; at: string}`.
- WS `StartHereEvent extends StartHere { room: RoomKey }`.

### 2b. `lib/campPlaces.ts` (SÁM — sdílený)
- `CAMP_DEFAULT_GENRE: Record<'camp-1'|'camp-2'|'camp-3', RoomStyle>`.
- `genreLabel(style): 'Fantasy camp'|'Mystery camp'|'Sci-fi camp'`.
- `randomPlaceId()` (FE nepotřebuje — rotaci dělá BE; případně jen helper pro test).

### 2c. Agent FE-1 — `CampHeader.tsx` + `.module.css`
- Žánr **štítek** (`genreBadge`: ikona + „Camp" + žánr) místo STYL selectu.
- Staff: přepínač žánru (override) + přerušovaný odznáček „⟳ dočasně". Hráč: štítek read-only.
- Lokace select (staff) / statický text (hráč) — jako dnes.
- Tlačítka **📜 Uložit hru** / **📂 Načíst hru** (pečeti) — props `onSave`/`onLoad`/`canSave`/`hasSaved`; vedle 📖.
- Vše `--theme-*` (lint:colors ✓). Ikony žánru: 🏰/🔮/🚀 (nebo lucide).

### 2d. Agent FE-2 — `StartHereBlock.tsx` + `.module.css`
- Read-only blok „Tady jste skončili" nad logem: hlavička (pečeť ornament + titul + „uloženo … · lokace" + × zavřít), řádky snímku, oddělovač „— pokračujete —".
- Props `startHere: StartHere | null`, `onClose`. Barvy z tokenů (sépie = `--theme-text-muted`/`--theme-heading` α; pečeť = `--theme-accent` nebo data-ALLOW dekor).

### 2e. Agent FE-3 — `api/useSavedGame.ts` + WS napojení
- `useSavedGame()` (GET), `useSaveGame(room)`, `useLoadGame()`, `useDeleteSavedGame()` (mutace + invalidace).
- WS `chat:room:startHere` → `startHere` do query cache per room (klíč v `chatQueryKeys`).

### 2f. Agent FE-4 — nav rename + `campRooms.ts`
- `CAMP_ROUTES` name: „Fantasy/Mystery/Sci-fi camp".
- `IkarosLayout` `CHAT_ROOMS` label: dtto (stabilní domovský žánr — varianta A).

### 2g. `pages/CampPage.tsx` (SÁM — integrace)
- Default env = `CAMP_DEFAULT_GENRE[room]` + placeId '1'.
- `roomName` = `genreLabel(env.style)` (dynamický z aktuálního žánru).
- Zapojit save/load (`useSavedGame`) → předat do `CampHeader`; `startHere` do `StartHereBlock` (přes `ChatRoom` scene node nebo nad MessageList).
- `StartHereBlock` render nad logem (přes `ChatRoom` — přidat volitelný `scene.startHereNode` nebo lokální umístění).

### 2h. FE testy (agent)
- `campPlaces` default žánr + genreLabel; `CampHeader` hráč štítek vs staff override, save disabled u prázdna, load disabled bez slotu; `StartHereBlock` render + close; useSavedGame WS startHere.

---

## Fáze 3 — docs
- `funkce` (Camp: zamčený žánr, rotace, uložení/načtení, rename), `napoveda` (hráčský výtah), `roadmap2.md` 16.6 (pivot: chat log ne taktická mapa; rename; rotace).

## Fáze 4 — verify
- FE `lint`, `lint:colors`, `tsc -b`, `build`, `test:run`. BE `tsc`, `lint`, jest (`--runInBand`). `mobil-desktop`. ⚠️ BE restart nutný ([[feedback_be_restart_required]]).

---

## Rizika impl.
- **Rename dosah:** grep „Camp I."/„Camp II."/„Camp III." napříč FE+BE+docs, ať nezůstane starý název. Testy s hardcoded „Camp I." přepsat.
- **`ChatRoom` roomName dynamický:** dnes `CampPage` posílá statický `name` z `CAMP_ROUTES`. Změna na `genreLabel(env.style)` — ověřit, že remount na `key={room}` + env WS překreslí hlavičku.
- **Load mění sdílené env:** broadcast všem; ověřit, že ne-load uživatel v místnosti dostane environment + startHere event.
