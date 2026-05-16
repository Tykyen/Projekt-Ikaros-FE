# Implementační plán — krok 4.1 Hospoda (globální chat `/chat`)

**Datum:** 2026-05-16
**Status:** ✅ Implementováno (2026-05-16)
**Spec:** [`spec-4.1.md`](./spec-4.1.md)
**Větev:** `main` (FE i BE repo) — autor explicitně chce práci rovnou v `main`, bez feature větví

---

## Pořadí: nejdřív BE, pak FE

BE změny (Step 1) jsou malé a FE na nich staví (color v payloadu, `userId` v presence).
Implementují se první, ať FE kóduje proti hotovému kontraktu.

---

## Step 1 — BE: barva textu + `userId` v presence (repo `Projekt-ikaros`)

**Soubory:**
- `backend/src/modules/global-chat/dto/create-global-message.dto.ts` — přidat `@IsOptional() @IsHexColor() color?: string`.
- `backend/src/modules/global-chat/global-chat.service.ts` — `sendMessage`: `color: dto.color ?? null` do save objektu (dnes chybí). `sendWhisper`: nový param `color?: string`, uložit.
- `backend/src/modules/global-chat/global-chat.gateway.ts` — `ikaros:whisper` payload `{ toUserId, content, color? }`, předat `color` do `sendWhisper`. `chat:presence` emit (join i leave): doplnit `userId` → `{ userId, username, action }`.
- `backend/src/modules/global-chat/global-chat.service.spec.ts` — testy: `color` projde do zprávy / whisperu; `undefined` → `null`.
- `Projekt-ikaros/docs/websocket-api.md` §3 — aktualizovat payloady `ikaros:whisper` a `chat:presence`.

**Příkaz:**
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros   # zůstáváme na main
# … editace …
cd backend && npm run test -- global-chat && npm run build
```

**Acceptance kroku:** BE testy zelené, build prochází. `chat:presence` nese `userId`.

---

## Step 2 — FE: typy + lib (`features/chat/lib/`)

**Soubory:**
- `src/features/chat/lib/types.ts` — `ChatMessage`, `RoomInfo` (`{ channelId, users: ChatUser[] }`), `ChatUser` (`{ userId, username, avatarUrl? }`), `PresenceEvent`, `TypingEvent`.
- `src/features/chat/lib/emotes.ts` — `EMOTES: Record<string,string>` (~25 shortcodů, tematicky hospoda: `:beer:`🍺 `:dice:`🎲 `:fire:`🔥 `:cheers:`🥂 `:skull:`💀 …) + `parseEmotes(text): string`.
- `src/features/chat/lib/chatColorGuard.ts` — `guardChatColor(hex, surfaceEl): string`: spočítá relativní luminanci barvy a `--theme-surface`, kontrast < 4.5:1 → posun světlosti barvy do čitelného pásma; krajně vrátí `var(--theme-text)`.

**Acceptance kroku:** `emotes.test.ts` + `chatColorGuard.test.ts` zelené.

---

## Step 3 — FE: API vrstva (`features/chat/api/useGlobalChat.ts`)

**Soubory:**
- `src/features/chat/api/useGlobalChat.ts`:
  - `useRoomInfo()` — `GET /global-chat/room-info`, query key `['global-chat','room-info']`.
  - `useChatHistory()` — `GET /global-chat/messages?limit=50`, key `['global-chat','messages']`.
  - `useSendMessage()` — mutace `POST /global-chat/messages { content, color }`.
  - `useDeleteMessage()` — mutace `DELETE /global-chat/messages/:id`.

**Acceptance kroku:** `useGlobalChat.test.ts` — query klíče + mutace.

---

## Step 4 — FE: prezentační komponenty

**Soubory (každá + `*.module.css`):**
- `MessageItem.tsx` — varianty: systémová / veřejná / whisper / smazaná. Obsah přes
  `parseEmotes`, barva přes `guardChatColor`. Seskupování (prop `grouped`). Admin koš tlačítko.
- `MessageList.tsx` — scroll kontejner, auto-scroll na konec, empty stav, výpočet
  seskupení (stejný autor < 3 min).
- `ChatInput.tsx` — pole + výběr cíle (Všem / → uživatel), Enter odešle, prázdné neodešle.
  Při whisper cíli třída `--whisper` na orámování. Emituje `typing:start/stop`.
- `UserList.tsx` — panel přítomných (avatar + jméno); na mobilu varianta „sheet".
- `TypingIndicator.tsx` — 3 pulzující tečky + text se skloňováním.

**Acceptance kroku:** `MessageItem.test.tsx`, `ChatInput.test.tsx`, `TypingIndicator.test.tsx` zelené.

---

## Step 5 — FE: `ChatRoom` + `ChatPage`

**Soubory:**
- `src/features/chat/components/ChatRoom.tsx` — kompozice + veškerá socket logika:
  mount → `useRoomInfo` + `useChatHistory`, `emit('room:join', 'chat:'+channelId)`,
  `emit('chat:hospoda:join', {username,userId})`. Listenery `chat:message`,
  `chat:message:deleted`, `chat:presence`, `chat:typing` přes `useSocketEvent`.
  Unmount → `chat:hospoda:leave` + `room:leave`.
- `src/features/chat/pages/ChatPage.tsx` — přepis stubu: render `<ChatRoom />`.

**Acceptance kroku:** `/chat` zobrazí Hospodu, zprávy a presence fungují v 2 oknech.

---

## Step 6 — FE: sidebar v `IkarosLayout`

**Soubory:**
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — `CHAT_ROOMS`: `hospoda` → `to: '/chat'`;
  Rozcestí I.–III. dostanou `disabled: true`. Render (ř. 205-218): disabled položka =
  `<span>` s třídou `navItemDisabled` + popisek „Brzy" místo `NavLink`.
- `IkarosLayout.module.css` — `.navItemDisabled` (snížená opacita, `cursor: default`).

**Acceptance kroku:** sidebar — Hospoda vede na `/chat`, Rozcestí neklikatelné s „Brzy".

---

## Step 7 — Nápověda + mobil-desktop

**Soubory:**
- Spustit skill `napoveda` — doplní sekci Hospoda do `/ikaros/napoveda`.
- Spustit skill `mobil-desktop` — ověří layout na mobilu i desktopu, doladí CSS.

---

## Závěrečný checklist

- [ ] BE: `npm run test -- global-chat` + `npm run build` (repo `Projekt-ikaros`)
- [ ] FE build prochází (`npm run build`)
- [ ] FE lint prochází (`npm run lint`)
- [ ] FE testy prochází (`npm run test:run`)
- [ ] Smoke: 2 účty / 2 okna — veřejná zpráva, whisper, typing, presence, mazání adminem, emote, theme switch, mobil
- [ ] `roadmap-fe.md` — krok 4.1 odškrtnut, „Pokec" odstraněn/odložen
- [ ] Commity dle konvence

---

## Commit strategie

Commituje se rovnou do `main` (obě repa) — bez feature větví, dle rozhodnutí autora.

- Commit 1 (repo BE `Projekt-ikaros`): `feat(global-chat): color v message DTO + userId v presence eventu`
- Commit 2–N (repo FE): per logický celek — lib, api, komponenty, ChatRoom+page, sidebar.
  Každý samostatně revertovatelný (`git revert <sha>`).

Commituji jen na výslovný pokyn autora — ne automaticky po každém kroku.
