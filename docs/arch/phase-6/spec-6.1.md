# Spec 6.1 — Světový chat: shell + kanály

**Status:** ✅ Hotovo (2026-05-19)
**Rozsah:** FE (nová stránka world chatu + zakládání kanálů a konverzací) + BE (presence world chatu, `imageUrl` kanálu, `lastMessagePreview` konverzace)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE)
**Velikost:** odhad ~22 FE souborů / ~1500 ř. + ~6 BE souborů / ~200 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** roadmapa `docs/roadmap-fe.md` (Fáze 6), spec 4.1 (Hospoda — vzor), BE modul `chat`

---

## 0. Názvosloví — kanál vs. konverzace

Sjednocení pojmů (rozhodnutí PJ 2026-05-19, dle starého Matrixu). **Tři vrstvy:**

| Vrstva | Kontejner (sbalovací) | Místnost (chat) |
|---|---|---|
| BE entita / FE kód | `ChatGroup` | `ChatChannel`, `channelId` |
| Stará roadmapa | „skupina" | „kanál" |
| **UI + tyto docs (závazné)** | **„kanál"** | **„konverzace"** |

- **Kanál** = vizuální skupina v sidebaru s ikonou/obrázkem („Evropani", „MI6").
  Sbaluje se, sám se v něm nechatuje.
- **Konverzace** = chatovací místnost uvnitř kanálu („Evropani Herní"). Tady se píšou
  zprávy, má `accessMode`, připíná se.
- **Kód a WS zůstávají na BE názvech** (`ChatChannel`, `channelId`, `chat:channel:*`)
  — mění se jen uživatelské popisky a docs. Níže v textu: `ChatGroup` = kanál,
  `ChatChannel` = konverzace.

---

## 1. Cíl

Postavit funkční chat uvnitř světa na route `/svet/:worldSlug/chat` — 3-panelový layout
(**sidebar kanálů a konverzací | zprávy | přítomní**) s přepínáním kanálů, real-time provozem,
živou presence, nepřečtenými odznaky a připínáním oblíbených konverzací. Součástí je i
**zakládání kanálů a konverzací PJ** (vtaženo z kroku 6.5) — aby svět nezůstal jen u dvou
automatických konverzací. Nahrazuje stub `WorldChatPage.tsx`.

---

## 2. Kontext / motivace

BE modul `chat` (`worlds/:worldId/chat/*`) je z velké části hotový — CRUD kanálů/
konverzací/zpráv, accessMode, reakce, read status, soft-delete. FE má hotovou prezentační vrstvu z
fáze 4 (`MessageList`, `MessageItem`, `ChatInput`, `UserList`, `TypingIndicator`).
`WorldChatPage.tsx` je dnes jen stub `<WorldStubPage area="chat" />`. Bez tohoto kroku je
sekce „Chat" v navigaci světa mrtvá.

**Rozhodnutí z brainstormu (2026-05-19, PJ):**
- Architektura → **paralelní `WorldChatRoom`** (viz §3.3 / §4.1). Fáze 4 se nemění.
- Třetí panel → **živá presence** — vyžaduje dostavbu BE world `ChatGateway` (§4.7 A).
- Rozsah → **vtáhnout zakládání kanálů a konverzací** do 6.1 (§4.6). Editace/mazání/
  reorder kanálů a konverzací zůstává v 6.5.
- Vzhled → **layout a struktura dle starého Matrixu** (`Matrix/frontend/src/components/Chat`),
  ale skinováno **našimi theme tokeny** (`--theme-*`) — jako Hospoda 4.1. Žádné natvrdo
  zadané barvy ze starého Matrixu (drží pravidlo `base.md` + precedens 4.1).

**Rozhodnutí z review plánu (2026-05-19, PJ):**
- Zakládání kanálů/konverzací → **jen `PomocnyPJ` a výš** (stávající BE `canManageChat`).
  Hráč si konverzaci nezaloží.
- 1:1 kanály → **vidí všichni PJ+** — `PomocnyPJ`/`PJ` (i `Admin`) vidí všechny kanály
  světa včetně soukromých 1:1 (jako „PJ vidí všechny šepoty"). Kryje `canManageChat`.
- Globální kanál (`accessMode: 'all'`) → přístup **až od role `Hrac` (≥ 2)** — `Zadatel`
  a `Ctenar` ho nevidí. Platí pro všechny `all` kanály (§4.7 C).
- 1:1 kanály → **hromadná akce** „založ 1:1 se všemi hráči" (§4.6), ne ruční po jednom.
- Mazání zpráv → **zapojeno už v 6.1** (reuse mazacího UI z fáze 4, PJ/Admin moderace);
  reply/reakce/editace/přílohy zůstávají 6.2.

---

## 3. Audit současného stavu

### 3.1 Backend — modul `chat` (`worlds/:worldId/chat`, `JwtAuthGuard`)

REST endpointy (hotové):

| Endpoint | Účel |
|---|---|
| `GET groups` | `getGroupsWithChannels` — kanály s vnořenými konverzacemi |
| `POST groups` | vytvoření kanálu (PJ/Admin) — DTO `{ name, order? }` |
| `PATCH/DELETE groups/:groupId` | editace / mazání kanálu |
| `POST groups/:groupId/channels` | vytvoření konverzace — DTO `{ name, accessMode?, allowedRoles?, allowedMemberIds?, order?, type? }` |
| `PATCH/DELETE channels/:channelId` | editace / mazání konverzace |
| `GET channels/:channelId/messages?before=&limit=` | historie zpráv (cursor) |
| `POST channels/:channelId/messages` | odeslání zprávy |
| `PATCH/DELETE messages/:messageId` | editace / mazání zprávy |
| `POST channels/:channelId/read` | označit konverzaci přečtenou |
| `GET unread` | nepřečtené počty per konverzace |
| `PUT messages/:messageId/reactions/:emoji` | toggle reakce |

WebSocket — world `ChatGateway` (default namespace):

| Směr | Event | Payload |
|---|---|---|
| → BE | `room:join` / `room:leave` | string `chat:{channelId}` (`AppGateway`) |
| → BE | `typing:start` / `typing:stop` | `{ channelId, characterName }` |
| BE → | `chat:message` / `:updated` / `:deleted` | `ChatMessage` resp. `{ messageId, channelId }` |
| BE → | `chat:typing` | `{ channelId, characterName, isTyping }` |
| BE → | `chat:channel:created/updated/deleted` | broadcast do `world:{worldId}` |
| BE → | `chat:group:created/updated/deleted` | broadcast do `world:{worldId}` |
| BE → | `chat:unread` | `{ channelId, count }` do `user:{userId}` |

Schémata:
- `ChatGroup` — `worldId, name, order`. **Žádný `imageUrl` / ikona / barva.**
- `ChatChannel` — `groupId, worldId, name, isGlobal, accessMode ('all'|'roles'|'members'),
  allowedRoles: number[], allowedMemberIds: string[], lastMessageAt, order, isDeleted, type`.
- `world.created` event → auto-zakládá kanál „Globální" (konverzace „obecný", `all`) +
  kanál „Postavy" (konverzace „hráči", `all`).
- `User.chatPreferences: Record<string, unknown>` — volný objekt, lze do něj uložit
  `pinnedChannelIds` (jako starý Matrix).

### 3.2 Frontend — připravená infra

- [`WorldChatPage.tsx`](../../../src/features/world/pages/WorldChatPage.tsx) — stub.
- Routa `/svet/:worldSlug/chat` (`memberOnly` guard) — existuje.
- [`features/chat/`](../../../src/features/chat/) — fáze 4: `ChatRoom`, `MessageList`,
  `MessageItem`, `ChatInput`, `UserList`, `TypingIndicator`, `EmojiPickerPopover`,
  socket hooky, `lib/types.ts`, `lib/emotes.ts`, `lib/chatColorGuard.ts`.
- `MessageList` / `MessageItem` / `ChatInput` / `UserList` / `TypingIndicator` jsou
  **prezentačně generické** — reuse beze změny.

### 3.3 Nesrovnalosti (rozhodnuto v brainstormu)

| # | Nález | Rozhodnutí |
|---|---|---|
| 1 | `ChatRoom` (fáze 4) je svázaný s `global-chat` modulem (jiné REST/WS API, `myRoomsAtom`, 60min auto-kick, Rozcestí scéna) — není to jen přejmenování `room`→`channelId` | **Paralelní `WorldChatRoom`** + vlastní world API vrstva; reuse jen prezentačních komponent. Fáze 4 se nemění → nulové riziko regrese |
| 2 | World `ChatGateway` **nemá presence** — žádné join/leave tracking, žádný `chat:presence`. Třetí panel layoutu nemá zdroj | **BE dostavba** — presence do world `ChatGateway` + REST seed (§4.7 A) |
| 3 | `ChatGroup` nemá `imageUrl` — PJ chce obrázek u kanálu | **BE úprava** — `imageUrl` na `ChatGroup` + upload endpoint (§4.7 B) |
| 4 | Roadmapa 6.1 nepočítala se zakládáním kanálů/konverzací (to bylo 6.5) | Na přání autora **vtaženo do 6.1** (§4.6); editace/mazání/reorder zůstává 6.5 |
| 5 | Per-user připnuté konverzace nemají vyhrazené pole | Uloží se do `User.chatPreferences.pinnedChannelIds` (volný objekt) — ověřit PATCH user endpoint v plánu |

---

## 4. Návrh řešení

### 4.1 Struktura souborů

```
src/features/world/chat/                # nová world-chat doména
├── pages/
│   └── WorldChatPage.tsx               # přepis stubu → 3-panel layout
├── components/
│   ├── WorldChatRoom.tsx               # kompozice: sidebar + konverzace + presence panel
│   ├── ChannelSidebar.tsx              # 6.1b — kanály → konverzace, sbalování, pinned sekce
│   ├── ChannelGroup.tsx                # 1 kanál: hlavička (obrázek/barva) + konverzace
│   ├── ChannelItem.tsx                 # 1 konverzace: jméno, náhled zprávy, unread, pin
│   ├── ChannelView.tsx                 # aktivní konverzace: header + MessageList + ChatInput
│   ├── ChannelMemberPanel.tsx          # 6.1d — presence panel (roster dle role)
│   ├── CreateGroupDialog.tsx           # 4.6 — zakládání kanálu (+ obrázek)
│   └── CreateChannelDialog.tsx         # 4.6 — zakládání konverzace (accessMode + členové)
├── api/
│   ├── useWorldChat.ts                 # React Query: groups, messages, send, read, unread
│   ├── useChannelPresence.ts           # presence per konverzace (REST seed + WS)
│   └── usePinnedChannels.ts            # 6.1c — pinned z chatPreferences
└── lib/
    └── types.ts                        # ChatGroup, ChatChannel, WorldChatMessage, …
```

Reuse beze změny: `features/chat/components/{MessageList,MessageItem,ChatInput,UserList,
TypingIndicator}` + `features/chat/api/{socket,useSocket}` + `lib/{emotes,chatColorGuard}`.

### 4.2 Datový tok

**Mount `WorldChatPage`:**
1. `GET /worlds/:id/chat/groups` → kanály s konverzacemi (BE filtruje dle `accessMode` + role).
2. `GET /worlds/:id/chat/unread` → nepřečtené počty per konverzace.
3. WS: `emit('room:join', 'world:' + worldId)` → příjem `chat:channel:*` / `chat:group:*`.
4. Vybere se aktivní konverzace (poslední / první přístupná) → tok §4.3.

**Přepnutí konverzace (`ChannelView`):**
1. `GET channels/:id/messages?limit=50` → historie.
2. WS: `emit('room:join', 'chat:' + channelId)`; opuštění předchozí → `room:leave`.
3. WS presence: `emit('chat:channel:join', { channelId })` (BE — §4.7 A).
4. `POST channels/:id/read` → vynuluje unread dané konverzace.

**Listenery:** `chat:message` (append, dedupe dle `id`), `chat:message:deleted`
(soft-delete → „Zpráva byla smazána"), `chat:typing`, `chat:presence` (panel přítomných),
`chat:channel:*` / `chat:group:*` (živá aktualizace sidebaru), `chat:unread` (badge).

### 4.3 Sidebar — `ChannelSidebar` (6.1b + 6.1c)

- Hierarchie **kanál → konverzace** (`ChatGroup` → `ChatChannel`); kanály sbalovací
  (stav per kanál).
- **Barevné kódování kanálů** — barva odvozená z názvu/pořadí kanálu (deterministický
  hash → token z palety `--theme-*`), volitelně obrázek kanálu (§4.7 B) jako mini-thumb
  v hlavičce.
- Konverzace nese ikonu dle `accessMode` (🌐 `all` / 🔒 `roles` / 👥 `members`), jméno,
  **náhled poslední zprávy** (zkrácený text pod názvem, jako starý Matrix), unread
  badge, na hover tlačítko 📌 (pin). Náhled = `lastMessagePreview` z BE (§4.7 E).
- **Připnuté konverzace** — horní sekce „Připnuté" nad kanály; pin/unpin ukládá
  `usePinnedChannels` do `chatPreferences.pinnedChannelIds` (debounced PATCH user).
- PJ/Pomocný PJ: tlačítko „+ Kanál" a v kanálu „+ Konverzace" → dialogy §4.6.

### 4.4 Presence panel — `ChannelMemberPanel` (6.1d) — jen PJ/Pomocný PJ

Třetí panel = **roster členů konverzace grupovaný dle world role** (jako starý Matrix —
viz screenshot). Tři sbalovací sekce:

| Sekce | World role |
|---|---|
| **Vypravěči** | `PJ` (5), `PomocnyPJ` (4) |
| **Korektoři** | `Korektor` (3) |
| **Ostatní** | `Hrac` (2), `Ctenar` (1), `Zadatel` (0) |

- Roster = členové s přístupem ke konverzaci (`allowedMemberIds`, resp. členové světa
  u `all`/`roles`). Každý člen: avatar, jméno, **zelená tečka = právě přítomen** (živá
  presence z `chat:presence`, seed REST §4.7 A). Přítomní řazeni nad offline v rámci
  sekce.
- Reuse `UserList` (rozšíří se o sekce + online indikátor).
- **Časové štítky** „naposledy viděn" u členů — relativní čas (`teď` / `8 h` /
  `21. 4.`) barevně dle stáří (zelená / žlutá / červená). Zdroj `User.lastSeenAt`
  (udržuje jwt guard), respektuje „neviditelný" mód (`hiddenPresence`). Viz §11.

**Viditelnost dle role:** panel se **renderuje jen pro `PomocnyPJ` a výš** — pro běžné
hráče je zbytečný a layout se jim zužuje na **2 panely** (sidebar | zprávy). Presence WS
(`chat:channel:join`) **emitují všichni** včetně hráčů — jinak by PJ v panelu hráče
neviděl; pouze *zobrazení* panelu je gated rolí. Na mobilu (jen PJ/Pomocný PJ) panel
sbalený za tlačítkem v headeru konverzace (side-sheet).

### 4.5 Read status (6.1e)

Unread počty: REST seed `GET unread` + živá aktualizace `chat:unread`. Badge u konverzace
v sidebaru, souhrnný badge u nav-položky „Chat" světa (suma napříč konverzacemi). Otevření
konverzace → `POST channels/:id/read`. Soft-deleted zprávy: `MessageItem` už umí
(„Zpráva byla smazána").

### 4.6 Zakládání kanálů a konverzací (PJ — vtaženo z 6.5)

Gating: `PomocnyPJ` a výš (world role). Reuse BE `POST groups` / `POST groups/:id/channels`.
- **`CreateGroupDialog`** (titulek „Nový kanál") — název, volitelný obrázek (upload §4.7 B).
- **`CreateChannelDialog`** (titulek „Nová konverzace") — název, kanál, `accessMode`:
  - `all` → globální kanál (všichni členové světa),
  - `roles` → výběr `allowedRoles` (multiselect world rolí),
  - `members` → výběr `allowedMemberIds` (multiselect členů světa) — pokrývá
    skupinovou konverzaci, 1:1 PJ↔člen i custom konverzaci (typy 2–4 z brainstormu).
- **Hromadné 1:1** — akce „založit 1:1 se všemi hráči": FE projde členy světa s rolí
  `Hrac+` a pro každého bez existujícího 1:1 kanálu založí `members` kanál
  `[zakládající PJ, hráč]`. Idempotentní (přeskočí už existující). Bez BE bulk
  endpointu — FE smyčka nad `POST groups/:id/channels`.
- Po úspěchu se sidebar aktualizuje přes `chat:group:created` / `chat:channel:created`.

**Mimo 6.1:** editace/mazání kanálů a konverzací, drag-drop reorder → krok 6.5.

### 4.7 Backend úpravy (repo `Projekt-ikaros`)

**A) Presence world chatu** — world `ChatGateway`:
- `@SubscribeMessage('chat:channel:join' / ':leave')` → in-memory mapa
  `channelId → Set<{ userId, username, avatarUrl, worldRole }>`; broadcast `chat:presence`
  (`{ channelId, userId, username, avatarUrl, worldRole, action }`) do `chat:{channelId}`.
  `worldRole` (z membership) nese presence kvůli grupování panelu dle role (§4.4).
- `handleDisconnect` → odebrat klienta ze všech kanálů + broadcast `leave`.
- REST seed: `GET worlds/:id/chat/channels/:channelId/presence` → aktuální seznam.
- `websocket-api.md` aktualizovat.

**B) `imageUrl` na `ChatGroup`:**
- `chat-group.schema.ts` — `@Prop() imageUrl?: string`.
- `CreateGroupDto` / `UpdateGroupDto` — `@IsOptional() @IsUrl() imageUrl?: string`.
- Upload obrázku: reuse existující upload infry (Cloudinary, folder `chat-groups/`) —
  ověřit v plánu, zda stačí stávající endpoint, nebo přidat `POST .../groups/upload`.

**C) Role floor globálního kanálu:**
- `hasChannelAccess` — pro `accessMode: 'all'` vyžadovat `membership.role >= WorldRole.Hrac`
  (≥ 2). `Zadatel`/`Ctenar` `all` kanály nevidí. `members`/`roles` beze změny.
- `getGroupsWithChannels` (§4.7 D) tím automaticky `all` kanály odfiltruje
  Čtenáři/Žadateli.
- `chat.service.spec.ts` — Čtenář nevidí `all` kanál; Hráč ano.

**D) `getGroupsWithChannels` filtruje dle přístupu** — dnes vrací **všechny** kanály
světa bez ohledu na `accessMode` (únik privátních konverzací na FE). Metoda dostane
`requesterId` + `requesterRole`, konverzace přefiltruje přes `hasChannelAccess`; PJ+
(`canManageChat`) vidí vše (rozhodnutí 1:1 viditelnosti). Controller `GET groups`
předá `user`.

**E) Náhled poslední zprávy konverzace** (sidebar 6.1b):
- `chat-channel.schema.ts` — `@Prop({ type: String }) lastMessagePreview?: string`.
- `sendMessage` — po uložení zprávy aktualizovat na konverzaci `lastMessagePreview`
  (zkrácený `content` ~80 znaků; u dice/příloh bez textu fallback popisek) vedle
  stávajícího `lastMessageAt`.
- `getGroupsWithChannels` pole vrací → FE ho zobrazí. Soft-delete náhled neaktualizuje
  (drobná staleness, akceptováno — viz riziko §8).

**Dopad na BE testy:** `chat.service.spec.ts` — `imageUrl` projde do kanálu;
`lastMessagePreview` se aktualizuje při `sendMessage`; access filtr (`members`/`all`
floor); nový gateway/presence spec na join/leave/disconnect + `worldRole` v payloadu.

### 4.8 Vzhled — přizpůsobení žánru světa

Layout dle starého Matrixu (`Matrix/frontend/src/components/Chat` — `ChatSidebar`,
`ChatArea`, `ChatUserList`): 3 sloupce (hráč 2), sbalovací kanály, pinned sekce,
barevné kódování.

**Chat dědí skin/žánr světa.** Svět má aktivní skin (12 skinů, kroky 5.7–5.9). Chat se
renderuje uvnitř world layoutu pod jeho `[data-theme]` scope → barvy, plochy a typografie
se **automaticky** vezmou ze skinu žánru. Nad rámec barev žánr nese i **grafické úpravy**
(ornamenty, textury panelů, tvar bublin/řádků, ikony kanálů) — ty se ladí v
`frontend-design` auditu. Drží se pravidlo originality skinů (`feedback_skin_originality`)
a izolace (`feedback_theme_isolation`) — žánrová grafika je scoped na skin, žádný globální
edit, žádná recyklace ornamentů mezi žánry.

⚠️ **Scope:** token-level skinování je zdarma (chat je token-based). Per-žánrové
*grafické* ornamenty/textury napříč 12 skiny — `frontend-design` audit vyrobí **seznam
potřebných assetů per žánr**; obrázkové ornamenty a assety **dodá autor na vyžádání**
(CSS-only ornamenty kreslím sám). 6.1 garantuje korektní token-level skin pro každý žánr
hned; assetové ornamenty se doplní po dodání assetů (neblokuje zbytek 6.1).

Mobil: sidebar (a u PJ presence panel) kolaps na side-sheet → `mobil-desktop`.

**Design audit:** detailní vizuální směr → [`design-6.1.md`](design-6.1.md) (koncept
„Depeše", signature „nit kanálu", skin-hook strategie, seznam assetů). Plán z něj čerpá.

---

## 5. Out of scope

- Editace/mazání kanálů a konverzací, drag-drop reorder → **krok 6.5**.
- Reply / reakce / whisper / přílohy / editace zpráv / NPC mód / RP datum / barva
  textu → **krok 6.2** (6.1 jen zobrazí zprávy a umí odeslat prostý text).
- Dice roll → **6.3**, custom emotes → **6.4**.
- Avatar postavy ve zprávě → **fáze 8** (6.1 = avatar účtu).
- Auto-synchronizace členství světové družiny ↔ `allowedMemberIds` konverzace → dluh
  (`D-NEW-channel-group-sync`), zapíše se přes skill `dluh`.
- **Časové štítky last-seen** u offline členů v presence panelu → dluh
  (`D-NEW-chat-last-seen`) — vyžaduje perzistentní sledování poslední aktivity.
- Fulltextové hledání ve zprávách → fáze 13.1.
- Ikona/barva kanálu jako editovatelné pole (6.1 barvu jen odvozuje, obrázek nastaví
  při zakládání) → plná správa 6.5.

---

## 6. Acceptance kritéria

1. `/svet/:worldSlug/chat` zobrazí 3-panelový chat; stub `WorldChatPage` nahrazen.
2. Sidebar vykreslí kanály → konverzace s náhledem poslední zprávy; nepřístupné
   konverzace se nezobrazí.
3. Přepnutí konverzace načte historii a real-time napojí WS room.
4. Odeslaná textová zpráva se real-time objeví všem v konverzaci.
5. Typing indikátor funguje per konverzace.
6. Presence panel se zobrazí **jen PJ/Pomocnému PJ**, roster grupovaný dle world role
   (Vypravěči / Korektoři / Ostatní) s indikací přítomnosti; hráč vidí 2-panel layout.
7. Připnutí konverzace přetrvá reload (`chatPreferences.pinnedChannelIds`).
8. Unread badge u konverzace i u nav-položky „Chat"; otevření konverzace unread vynuluje.
9. Soft-deleted zpráva se zobrazí jako „Zpráva byla smazána".
10. PJ/Pomocný PJ umí založit kanál (+ obrázek) a konverzaci všech tří `accessMode`;
    hromadná akce „1:1 se všemi hráči" funguje.
11. Sidebar reaguje živě na `chat:group:*` / `chat:channel:*`.
12. Chat se skinuje dle žánru/skinu světa (token-level minimum); funguje na mobilu i desktopu.
13. BE: world `ChatGateway` vysílá `chat:presence` (s `worldRole`); `ChatGroup` má
    `imageUrl`; `ChatChannel` má `lastMessagePreview`.
14. Mazání zpráv (PJ/Admin) funguje a propíše se WS.
15. Nápověda (`/ikaros/napoveda`) aktualizována o světový chat + role/oprávnění.

---

## 7. Test plán

**Automated (Vitest + RTL):**
- `useWorldChat.spec.ts` — query klíče, mutace send/read.
- `usePinnedChannels.spec.ts` — pin/unpin, debounced persist.
- `ChannelSidebar.spec.tsx` — hierarchie, sbalování, pinned sekce, filtr přístupu.
- `ChannelItem.spec.tsx` — unread badge, pin toggle, ikona accessMode.
- `CreateChannelDialog.spec.tsx` — accessMode přepíná pole rolí/členů, validace.
- `ChannelMemberPanel.spec.tsx` — sekce přítomní vs. členové.

**Automated (BE — Jest):**
- `chat.service.spec.ts` — `imageUrl` u kanálu; `lastMessagePreview` po `sendMessage`;
  access filtr (`members`/`all` floor).
- nový gateway/presence spec — `chat:channel:join/leave`, `disconnect` cleanup,
  `chat:presence` s `worldRole`.

**Manuální smoke (2 prohlížeče / 2 účty):** přepínání konverzací; real-time zpráva tam i
zpět; typing; presence join/leave grupovaná dle role; náhled poslední zprávy v sidebaru;
unread badge; pin; založení kanálu+konverzace PJ; mazání zprávy; theme switch; mobil
layout (375/768/1440).

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| `getGroupsWithChannels` nefiltruje konverzace dle přístupu uživatele | Stř. | Únik nepřístupných konverzací | BE fix §4.7 D — filtr přes `hasChannelAccess` |
| Presence in-memory mapa se rozsype při více instancích BE | Nízká | Nepřesná presence | MVP single-instance; pozn. do dluhů |
| Reuse `ChatInput` táhne whisper/přílohy UI, které 6.1 nechce | Stř. | Předčasné featury | `ChatInput` dostane props na skrytí; plný feature set zapne 6.2 |
| Upload obrázku kanálu — chybí vhodný endpoint | Nízká | Blok §4.7 B | Reuse `POST /upload/image` (ověřeno — existuje) |
| `lastMessagePreview` neaktuální po smazání poslední zprávy | Nízká | Drobná staleness v sidebaru | Akceptováno pro MVP; náhled se opraví další zprávou |
| Vtažení zakládání kanálů nafoukne krok | Vysoká | Delší dodávka | Editace/mazání/reorder explicitně mimo (6.5) |
| Per-žánrové grafické ornamenty napříč 12 skiny | Vysoká | Velký rozsah | 6.1 garantuje token-level skin; obrázkové assety dodá autor na vyžádání dle seznamu z frontend-design auditu |

**Rollback:** revert; `WorldChatPage` zpět na stub. Žádná migrace dat (presence in-memory,
`imageUrl` aditivní, `pinnedChannelIds` ve volném objektu).

---

## 9. Otázky / rozhodnutí

Rozhodnuto v brainstormu (§2 / §3.3). Otevřené k potvrzení ve spec review:
- **Roster vs. jen presence** v třetím panelu — navrženy obě sekce (§4.4). OK?
- **Upload obrázku kanálu** — reuse stávající upload vs. nový endpoint → dořeší plán.
- **6.5 po vtažení zakládání** — zůstává mu editace/mazání/reorder + ikona/barva kanálu.

---

**Po schválení specu:** `frontend-design` audit (3-panel layout, sidebar, dialogy),
pak implementační plán `plan-6.1.md` (CLI / file diff pro FE i BE).

---

## 11. Dodatek 6.1g — automatické zakládání kanálů (2026-05-19)

Doplněno po review autorem — chat má vznikat se světem, ne čistě ručně.

**Co se mění (BE `chat` modul):**
- **Výchozí kanály při `world.created`** — `seedDefaultGroups`: kanál „Globální"
  (konverzace „globální") + kanál „Postavy" (konverzace „hráči", `accessMode: all`).
  Konverzace „obecný" přejmenována na „globální".
- **Kanál za světovou družinu** — `@OnEvent('world.settings.updated')` →
  `syncWorldGroupChannels` diffne `settings.customGroups` proti existujícím
  `ChatGroup.linkedWorldGroup`; za každou novou družinu založí kanál + `members`
  konverzaci (`allowedMemberIds` = členové družiny + `PomocnyPJ+`). Emituje
  `chat.group.created` / `chat.channel.created` → FE sidebar se aktualizuje živě.
- **Backfill** — `onApplicationBootstrap`: světy bez chat kanálů dostanou výchozí
  sadu, existující družiny své kanály. Idempotentní (běží při každém startu BE).
- Nové pole `ChatGroup.linkedWorldGroup` — vazba auto-kanálu na družinu.

**Záměrná omezení:**
- Družina odebraná z `customGroups` **nemaže** svůj kanál (neničíme historii).
- Změna *členství* družiny neaktualizuje `allowedMemberIds` auto-konverzace →
  dluh `D-NEW-channel-group-sync` (zúžen jen na tuto průběžnou synchronizaci).

**Pozn.:** „skupina" = `ChatGroup` (kanál). Družina = světová skupina hráčů
(`customGroups` ve `WorldSettings`), oddělený koncept — viz §0.

---

## 12. Dodatek — „naposledy viděn" v presence panelu (2026-05-19)

Doplněno po review — presence panel ukazuje i čas poslední aktivity (jako starý
Matrix), ne jen online/offline.

- **BE:** `User.lastSeenAt` už existoval a udržuje ho `JwtAuthGuard` (stamp na
  každém requestu). Vystaveno přes `publicProfile` → `enrichMembers` →
  `GET /worlds/:id/members`. **Respektuje `hiddenPresence`** — „neviditelný" mód
  → `lastSeenAt` se neposílá.
- **FE:** `formatLastSeen` (`lib/lastSeen.ts`) — relativní čas + barevné pásmo
  (`online`/`recent` zelená, `week` žlutá, `old` červená, `unknown` ztlumená).
  `ChannelMemberPanel` ho zobrazuje vlevo u každého člena.
- Uzavírá dluh `D-NEW-chat-last-seen` — nevyžádal si žádné nové tracking infra.
