# Spec 4.1 — Hospoda (globální chat `/chat`)

**Status:** Draft — čeká na schválení
**Rozsah:** FE (nová stránka chatu) + drobná BE úprava (barva textu + `userId` v presence)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE), větev `feat/krok-4.1-hospoda`
**Velikost:** odhad ~13 FE souborů / ~700 ř. + ~5 BE souborů / ~40 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-16
**Souvisí:** roadmapa `docs/roadmap-fe.md` (Fáze 4), BE `Projekt-ikaros/docs/websocket-api.md` §3 GlobalChatGateway

---

## 1. Cíl

Postavit funkční globální chat **Hospoda** na route `/chat` — interdimenzionální místnost pro
celou platformu. Real-time veřejné zprávy, soukromé šeptání (whisper), seznam přítomných,
indikátory psaní a textové emotes (`:shortcode:`). FE běží na našich design tokenech a
respektuje aktivní platformový theme. Nahrazuje stub `ChatPage.tsx`.

---

## 2. Kontext / motivace

Fáze 1–3 (Ikaros platforma) je hotová. Fáze 4 přidává globální chat. BE část
(`GlobalChatGateway` + `GlobalChatController`) **už existuje a běží** — chybí jen FE.
`ChatPage.tsx` je dnes jednořádkový stub. Sidebar v `IkarosLayout` už na chat odkazuje,
ale na neexistující routy. Bez tohoto kroku je sekce „Chat" v navigaci mrtvá.

---

## 3. Audit současného stavu

### 3.1 Backend — hotový, FE se na něj jen napojuje

REST (`GlobalChatController`, prefix `/api/global-chat`):

| Endpoint | Vrací / přijímá |
|---|---|
| `GET /global-chat/room-info` | `{ channelId: string, users: {userId,username}[] }` |
| `GET /global-chat/messages?before=&limit=` | `ChatMessage[]` — historie, TTL zpráv 1 h, default limit 50, max 100 |
| `POST /global-chat/messages` | body `{ content: string(1–4000), visibleTo?: string[] }` → `ChatMessage` |
| `DELETE /global-chat/messages/:id` | jen Admin/Superadmin (`AdminGuard`) |

WebSocket (Socket.io, výchozí namespace):

| Směr | Event | Payload |
|---|---|---|
| → BE | `room:join` / `room:leave` | string `chat:{channelId}` (AppGateway) |
| → BE | `chat:hospoda:join` | `{ username, userId }` — presence + vstup do `user:{userId}` |
| → BE | `chat:hospoda:leave` | `{ username }` |
| → BE | `ikaros:whisper` | `{ toUserId, content }` |
| → BE | `typing:start` / `typing:stop` | `{ channelId, characterName }` (ChatGateway) |
| BE → | `chat:message` | `ChatMessage` (veřejná → room `chat:{id}`; whisper → `user:{id}`) |
| BE → | `chat:message:deleted` | `{ messageId, channelId }` |
| BE → | `chat:presence` | `{ username, action: 'join'\|'leave' }` |
| BE → | `chat:typing` | `{ channelId, characterName, isTyping }` |

`ChatMessage` (relevantní pole): `id, channelId, senderId, senderName, senderAvatarUrl?,
content, isDeleted, visibleTo?, reactions, createdAt, expiresAt`.

### 3.2 Frontend — připravená infra

- [`router.tsx:152`](../../../src/app/router.tsx) — route `path: 'chat'` už existuje, chráněná `requireAuth`.
- [`ChatPage.tsx`](../../../src/features/chat/pages/ChatPage.tsx) — stub `[stub] Hospoda`.
- [`features/chat/api/socket.ts`](../../../src/features/chat/api/socket.ts) + [`useSocket.ts`](../../../src/features/chat/api/useSocket.ts) — singleton socket, JWT auth, hooky `useSocket()`, `useSocketEvent(event, handler)`.
- [`shared/api/client.ts`](../../../src/shared/api/client.ts) — axios + React Query.
- [`shared/store/authStore.ts`](../../../src/shared/store/authStore.ts) — `currentUserAtom` (`id, username, avatarUrl, chatColor, role`).
- [`IkarosLayout.tsx:84-89`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — `CHAT_ROOMS` odkazuje na `/chat/hospoda` (404) + Rozcestí I.–III. (404).

### 3.3 Nesrovnalosti (rozhodnuto s autorem)

| # | Nález | Rozhodnutí |
|---|---|---|
| 1 | Roadmap zmiňuje kanál „Pokec", BE má jen 1 globální kanál | 4.1 = **jen Hospoda**, „Pokec" z roadmapy odstranit/odložit |
| 2 | Sidebar odkazuje na neexistující routy | Hospoda → `/chat`; Rozcestí I.–III. → **disabled** položky (popisek „Brzy") do kroku 4.2 |
| 3 | `:shortcode:` emotes nemají BE zdroj (`EmotesGateway` je world-scoped) | Statický **klientský** set shortcodů, bez BE |
| 4 | BE `CreateGlobalMessageDto` nemá pole `color` — barva textu se neukládá | **Vyřešeno v 4.1** — DTO + služba + whisper se doplní o `color`; `ChatMessage.color` v interface už existuje. Viz §4.7 |
| 5 | `chat:presence` event nenese `userId`, jen `username` | **Vyřešeno v 4.1** — gateway doplní `userId` do payloadu; FE drží seznam přímo z eventů, bez refetche. Viz §4.7 |

> Dluhy #4 a #5 byly na žádost autora **vtaženy do scope 4.1** místo odložení — obě
> jsou malé BE úpravy a bez nich by chat fungoval polovičatě (žádná barva, „duchové"
> v seznamu nebo zbytečné refetche). 4.1 tím přestává být čistě FE krok.

---

## 4. Návrh řešení

### 4.1 Struktura souborů

```
src/features/chat/
├── pages/
│   └── ChatPage.tsx              # přepis stubu → Hospoda
├── components/
│   ├── ChatRoom.tsx              # kompozice: header + zprávy + userlist + input
│   ├── MessageList.tsx           # scrollovací seznam + auto-scroll + empty stav
│   ├── MessageItem.tsx           # 1 zpráva: systémová / veřejná / whisper, emote render
│   ├── ChatInput.tsx             # textové pole + výběr cíle (Všem / → uživatel) + odeslat
│   ├── UserList.tsx              # panel přítomných (avatar + jméno)
│   └── TypingIndicator.tsx       # „X píše…" se skloňováním
├── api/
│   └── useGlobalChat.ts          # React Query hooky (room-info, messages, send, delete)
├── lib/
│   ├── emotes.ts                 # mapa :shortcode: → emoji + parser textu
│   ├── chatColorGuard.ts         # kontrast guard pro chatColor vůči --theme-surface
│   └── types.ts                  # FE typy (ChatMessage, RoomInfo, ChatUser)
└── *.module.css                  # CSS moduly per komponenta
```

### 4.2 Datový tok

**Mount `ChatPage`:**
1. `GET /global-chat/room-info` → `channelId` + `users`.
2. `GET /global-chat/messages?limit=50` → historie (vzestupně dle `createdAt`).
3. WS: `emit('room:join', 'chat:' + channelId)` → vstup do kanálu.
4. WS: `emit('chat:hospoda:join', { username, userId })` → presence + `user:{id}` room.

**Listenery (`useSocketEvent`):**
- `chat:message` → append do seznamu (dedupe dle `id`).
- `chat:message:deleted` → zpráva se přebarví na „Zpráva byla smazána".
- `chat:presence` → přidá/odebere uživatele v seznamu přímo z payloadu (`{ userId, username, action }`).
- `chat:typing` → přidá/odebere jméno z množiny „píšících" (auto-expirace 5 s).

**Odeslání:**
- Veřejná: `POST /global-chat/messages { content, color }`. `color` = `currentUser.chatColor`
  z profilu. Zpráva se vykreslí až přijde WS echo `chat:message` (žádné optimistické
  duplikáty). Input se po `Enter` vyčistí hned.
- Whisper: `emit('ikaros:whisper', { toUserId, content, color })`. BE doručí přes
  `chat:message` do `user:{id}` roomu obou stran; FE rozpozná whisper podle vyplněného
  `visibleTo`.

**Typing:** `emit('typing:start', { channelId, characterName: username })` při psaní
(debounce — start po prvním znaku, stop po 3 s nečinnosti nebo po odeslání).

**Unmount:** `emit('chat:hospoda:leave', { username })` + `emit('room:leave', ...)`.
Socket samotný se nezavírá — je sdílený singleton.

### 4.3 Emotes — `lib/emotes.ts`

Statická mapa cca 20–30 shortcodů → emoji (`:beer:`→🍺, `:smile:`→😄, `:dice:`→🎲,
`:heart:`→❤️, `:fire:`→🔥 …). Parser nahradí `:shortcode:` v textu zprávy při renderu
v `MessageItem`. Žádný BE, žádný stav. Tematicky laděno k hospodě (pivo, kostky, oheň…).

### 4.4 Vzhled — „ať sedí s naší prací"

- CSS moduly + tokeny z [`themes/_shared/tokens.css`](../../../src/themes/_shared/tokens.css)
  (`--sp-*`, `--text-*`, `--transition-*`), barvy z `--theme-*` proměnných → chat se
  **automaticky přebarví podle aktivního theme** (hospoda, kyberpunk, …). Žádné natvrdo
  zadané barvy ze starého Matrixu.
- Layout: hlavička (název místnosti + počet přítomných), pod ní 2 sloupce — zprávy (široký)
  + seznam přítomných (úzký), dole vstupní lišta. Na mobilu seznam přítomných sklápěcí
  (nebo skrytý za tlačítkem), sloupce se skládají pod sebe → ověří `mobil-desktop` skill.
- Před implementací proběhne **frontend-design audit** (mezi schválením specu a impl. plánem).

### 4.5 Sidebar — `IkarosLayout`

`CHAT_ROOMS` se upraví: `hospoda` → `to: '/chat'`; Rozcestí I.–III. dostanou příznak
`disabled` → vykreslí se jako neaktivní s popiskem „Brzy" (aktivují se v kroku 4.2).

### 4.6 Mazání zpráv (Admin)

Admin/Superadmin vidí u cizí zprávy tlačítko koš → `DELETE /global-chat/messages/:id`.
Gating čistě dle `currentUser.role` (Superadmin/Admin). Smazání potvrdí WS event všem.

### 4.7 Backend úpravy (repo `Projekt-ikaros`)

Dvě malé úpravy, které dořeší dluhy #4 a #5. `ChatMessage` interface i pole
`color`/`color: null` v `GlobalChatService` save objektech **už existují** — jde jen o
průchod hodnoty od klienta a doplnění `userId` do presence eventu.

**A) Barva textu zpráv (dluh #4):**
- `CreateGlobalMessageDto` — přidat `@IsOptional() @IsHexColor() color?: string`.
- `GlobalChatService.sendMessage` — uložit `color: dto.color ?? null` (dnes implicitně `null`).
- `ikaros:whisper` WS payload rozšířit o `color?: string`; `GlobalChatGateway.handleWhisper`
  ho předá do `sendWhisper`, ta uloží `color`.
- `websocket-api.md` §3 — zaktualizovat payload `ikaros:whisper`.

**B) `userId` v presence eventu (dluh #5):**
- `GlobalChatGateway` — `chat:presence` emit (join i leave) doplnit o `userId`:
  `{ userId, username, action }`.
- `websocket-api.md` §3 — zaktualizovat payload `chat:presence`.

Tím odpadá FE refetch `room-info` na každý presence event — seznam přítomných se
udržuje přímo z `chat:presence`. `room-info` se volá jen jednou při mountu.

**Dopad na BE testy:** `global-chat.service.spec.ts` — doplnit ověření, že `color`
projde do uložené zprávy; gateway test na `userId` v presence payloadu.

### 4.8 Design (výstup `frontend-design` auditu)

- **Řádkový „deník", ne bubliny.** Zprávy jsou řádky (čas · jméno · obsah), ne
  bubliny vlevo/vpravo — sedí k serif/pergamen estetice Ikara.
- **Seskupování:** po sobě jdoucí zprávy téhož autora do 3 min sdílí hlavičku
  (jméno + čas jen u první; u dalších se čas ukáže na hover).
- **Whisper** vizuálně odlišený — odsazení, kurzíva, levý okraj `--theme-border-burgundy`,
  podklad `--theme-surface-soft`, prefix ikona.
- **Systémové zprávy** vystředěné, `--text-sm`, `--theme-text-muted`.
- **Vstupní lišta:** při zvoleném cíli whisper se **orámování pole přebarví** na whisper
  akcent — vizuální pojistka proti omylem veřejné zprávě.
- **Typing** = 3 pulzující tečky (CSS keyframes) nad vstupní lištou.
- **Motion:** nová zpráva fade+slide-up 120 ms; jinak střídmě.
- **Mobil:** jeden sloupec, „přítomní" sbalení do chipu v hlavičce → sheet.
- **Barva textu — kontrast guard:** obsah zprávy se renderuje v `chatColor`, ale util
  spočítá kontrast vůči `--theme-surface` aktivního theme; barvy s nedostatečným
  kontrastem (< 4.5:1) se posunou ve světlosti do čitelného pásma, krajně fallback na
  `--theme-text`. Zajišťuje čitelnost napříč všemi tématy. → soubor `lib/chatColorGuard.ts`.

---

## 5. Out of scope

- Kanál „Pokec" a jakýkoli druhý globální kanál (BE nepodporuje).
- Rozcestí I.–III. — samostatný krok 4.2 (zde jen disabled položky v sidebaru).
- UI pro **výběr** barvy textu — `chatColor` se čte z profilu, color-picker se zde nepřidává
  (jen se barva konzumuje a odesílá; vlastní nastavení barvy řeší profil / krok 4.2).
- Reply, reakce emoji, přílohy — krok 4.3.
- Infinite scroll do historie přes `?before=` (4.1 načte posledních 50; starší se neřeší).
- Vlastní (custom) emotes uploadované uživateli — globální chat je nemá.
- Push notifikace o nových zprávách — BE je už posílá, FE side se zde nemění.

---

## 6. Acceptance kritéria

1. ✅ `/chat` zobrazí Hospodu; stub `ChatPage` je nahrazen.
2. ✅ Po vstupu se načte historie (posledních 50 zpráv) a seznam přítomných.
3. ✅ Odeslaná veřejná zpráva se real-time objeví všem připojeným.
4. ✅ Whisper dorazí jen odesílateli a cíli; je vizuálně odlišený.
5. ✅ Seznam přítomných se aktualizuje při příchodu/odchodu uživatele.
6. ✅ Indikátor psaní se zobrazí ostatním a do 5 s zmizí.
7. ✅ `:shortcode:` emotes se v textu vykreslí jako emoji.
8. ✅ Text zprávy se zobrazí v barvě odesílatele (`chatColor`); kontrast guard zajistí čitelnost na všech tématech; platí i pro whisper.
9. ✅ `chat:presence` nese `userId`; seznam přítomných se aktualizuje bez refetche `room-info`.
10. ✅ Admin/Superadmin umí smazat cizí zprávu; mazání se propíše všem.
11. ✅ Chat respektuje aktivní platformový theme (tokeny `--theme-*`).
12. ✅ Funguje na mobilu i desktopu (ověří `mobil-desktop`).
13. ✅ Sidebar: Hospoda vede na `/chat`, Rozcestí I.–III. jsou disabled.
14. ✅ Nápověda (`/ikaros/napoveda`) aktualizována o sekci Hospoda.

---

## 7. Test plán

**Automated (Vitest + RTL):**
- `emotes.test.ts` — parser nahradí známé shortcody, neznámé nechá, escapuje hrany.
- `chatColorGuard.test.ts` — nízký kontrast → posun světlosti; krajní případ → fallback.
- `useGlobalChat.test.ts` — query klíče, mutace `sendMessage`/`deleteMessage`.
- `MessageItem.test.tsx` — render veřejné / systémové / whisper / smazané zprávy.
- `ChatInput.test.tsx` — výběr cíle, Enter odešle, prázdná zpráva neodešle.
- `TypingIndicator.test.tsx` — skloňování (1 / 2–4 / 5+).

**Automated (BE — Jest, repo `Projekt-ikaros`):**
- `global-chat.service.spec.ts` — `sendMessage` uloží `color` z DTO; `sendWhisper` uloží
  `color`; `color` chybí → `null`.
- gateway test — `chat:presence` payload obsahuje `userId`.

**Manuální smoke (2 prohlížeče / 2 účty):**
- Veřejná zpráva tam i zpět; barva textu odpovídá `chatColor`; whisper vidí jen 2 strany;
  typing indikátor; presence join/leave; mazání adminem; emote render; theme switch;
  mobil layout.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| `typing:start/stop` obsluhuje `ChatGateway` — nemusí broadcastovat pro globální kanál | Stř. | Typing nefunguje | Ověřit v impl. plánu; fallback bez typingu (degradace, ne blok) |
| WS echo vlastní zprávy zpožděné → uživatel nevidí hned co napsal | Nízká | UX | Dedupe dle `id`; případně lehký optimistický stav (rozhodne plán) |
| BE změna `chat:presence` payloadu rozbije jiného konzumenta eventu | Nízká | Regrese | Přidání pole je zpětně kompatibilní; ověřit grepem konzumenty `chat:presence` |
| `chat:hospoda:leave` se nepošle při zavření tabu | Stř. | „Duch" v seznamu | BE má `cleanup-inactive-users.job` — sebevyčistí |

**Rollback:** revert větve `feat/krok-4.1-hospoda`; `ChatPage` zpět na stub. Žádná migrace dat.

---

## 9. Otázky k autorovi

Žádné — autor delegoval, volby:
- Rozsah kanálů → **jen Hospoda** (1 kanál).
- Whisper → **zařazen do 4.1**.
- Rozcestí v sidebaru → **disabled položky** s popiskem „Brzy".
- Dluhy #4 (barva textu) a #5 (`userId` v presence) → **vtaženy do scope 4.1** (drobné BE úpravy, §4.7).
- Vzhled → respektovat aktivní theme + naše tokeny (ze zadání „ať sedí s naší prací").

---

**Po schválení specu:** spustím `frontend-design` audit, pak napíšu implementační plán
`plan-4.1.md` (přesné CLI / file diff pro FE i BE).
