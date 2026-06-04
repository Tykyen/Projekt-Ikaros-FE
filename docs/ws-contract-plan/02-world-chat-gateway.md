# 02 — World chat (ChatGateway)

Nejhustší gateway: 6 příchozích handlerů + 12 `@OnEvent` mostů. Pokrývá zprávy, kanály/skupiny, presence, typing, zvuky uvnitř světového chatu. Doménová logika (CRUD, role, mentions) je v [`bug-plan/07`](../bug-plan/07-svet-chat.md) — tady řešíme **výhradně WS přenos**: payload parita, room targeting, anti-spoofing.

**BE:** `modules/chat/chat.gateway.ts`
**FE:** `features/world/chat/components/ChannelView.tsx`, `WorldChatRoom.tsx`, `api/useWorldChat.ts`, `api/useChannelPresence.ts`, `components/SoundBroadcastButton.tsx`, `SoundNowPlayingBanner.tsx`

---

## A. Zprávy — `chat:message` / updated / deleted

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WCH-01 | `chat.message.created` → BE rozhoduje room: **whisper** (`visibleTo`) jde jen do `user:{id}` příjemců, veřejná do `chat:{channelId}`. Ověřit, že whisper se NEemituje i do `chat:{channelId}` (jinak leak ostatním v kanálu) `[auto]` | `RM` `LK` | M3 | ✅L1 |
| WCH-02 | **Payload parita `chat:message`**: BE posílá plný `ChatMessage` (po `toEntity`). FE `ChannelView:307` ho přidává do cache. Ověřit, že všechna pole, která FE renderuje (`diceSkin`, `overrideName`, `attachments`, `senderIsDeleted`, `mentions`), jsou v emitovaném objektu — ne osekaná verze `[auto]` | `PL` | M2 | ✅L2 |
| WCH-03 | Optimistic dedup: FE odešle zprávu REST + dostane ji zpět WS echem. Dedup dle `clientNonce`. Ověřit, že emitovaný `chat:message` nese `clientNonce` (jinak se echo nezdedupuje → duplikát) `[auto]` | `PL` | M3 | ✅L1 |
| WCH-04 | `chat:message:updated` (`ChannelView:308`) — payload je celý updatovaný `ChatMessage`; FE swapne v cache dle `_id`. Ověřit shodu klíče ID (`_id` vs `id`) mezi emitem a FE lookupem `[auto]` | `PL` | M2 | ✅L2 |
| WCH-05 | `chat:message:deleted` — BE `{ channelId, messageId }`, FE `ChannelView:309` čte `{ messageId, channelId }`. Ověřit, že FE filtruje dle `channelId` (smazání v jiném kanálu nemaže v aktuálním) `[auto]` | `PL` `RM` | M2 | ✅L2 |

> **Výsledek A:** Whisper směrování čisté — `visibleTo.length > 0` → jen `user:{id}` příjemců, jinak `chat:{channelId}` ([chat.gateway.ts:235-243](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L235)), žádný dual-emit. Message payload je plný `ChatMessage` (jeden objekt, ne osekaný).

---

## B. `chat:unread` — payload drift kandidát 🔴

> **Hlavní podezření této oblasti.** BE inventura: `chat.unread.updated` → emit `chat:unread` do `user:{id}` s payloadem **`{ channelId, count }`** (chat.gateway:363–372). FE inventura: `useWorldChat.ts:208` čte **`{ channelId, count, mentionCount }`**. `mentionCount` ve výčtu BE payloadu **chybí** → kandidát na tichý drift.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WCH-06 | **Ověřit reálný payload `chat:unread`**: emituje BE `mentionCount`? Pokud ne, jak FE `applyUnreadEvent` reaguje na `undefined` mentionCount — zachová `prevMention` (SC-23: „BE neposílá mentionCount u −1")? Doložit čtením obou stran `[auto]` | `PL` | M2 | ⚖️ |
| WCH-07 | Sentinel `count: -1` (increment) vs absolutní `count: 0` (markAsRead) — FE musí rozlišit a u `-1` jen inkrementovat, u `0` vynulovat. Ověřit, že payload nese dost informace pro toto rozhodnutí `[auto]` | `PL` | M3 | ✅L3 |
| WCH-08 | `chat:unread` jde do `user:{id}` — broadcast jen členům s přístupem k `accessMode` kanálu (N-19 fix: vyloučen Žadatel i Čtenář). Ověřit, že emit nejde plošně do `chat:{channelId}` `[auto]` | `RM` `LK` | M3 | ✅L2 |
| WCH-09 | `markAsRead` → `chat.unread.updated { count: 0 }` → FE okamžitě vynuluje badge. Round-trip test: emit interní event → ověřit `chat:unread` do správného `user:{id}` s `count:0` `[auto]` | `PL` `RM` | M8 | ✅L3 |

> **Výsledek B (K-3 = BY-DESIGN, ne bug):** `chat:unread` emit nese **jen `{ channelId, count }`** ([chat.gateway.ts:369](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L369)); service emituje `count:0` (markRead) nebo `count:-1` (increment sentinel) — **`mentionCount` se přes WS nikdy neposílá**. FE [`applyUnreadEvent`](../../src/features/world/chat/api/useWorldChat.ts#L162) to **vědomě** řeší: u `-1` zachová `prevMention`, jinak `event.mentionCount ?? 0`. Dokumentováno (`D-NEW-chat-mention-sidebar-dot 2026-05-21`) + testováno (`useWorldChat.spec.ts`). **Důsledek:** mention dot se na novou @zmínku přes WS nezvýší (jen unread count), dožene se refetchem. Akceptované omezení. Drobný typový dluh: `useSocketEvent<ChannelUnread>` typuje `mentionCount` povinně, reálně nepřichází (ošetřeno `?? 0`).

---

## C. Kanály & skupiny — `chat:channel:*`, `chat:group:*`, reorder

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WCH-10 | `chat:channel:created/updated/deleted` jdou do `world:{worldId}`. FE `WorldChatRoom:128–130` invaliduje groups cache. **RM riziko:** musí být v `world:{id}` roomu → drží ho jen WorldChatRoom mount. Stránka admin emotes / jiná část světa to nemusí mít `[auto]` | `RM` | M5 | ✅L1 |
| WCH-11 | `chat:group:created/updated/deleted` — totéž do `world:{id}`. Ověřit payload: `created/updated` nese celý objekt, `deleted` nese `{ channelId, groupId }` resp. groupId (parita s FE `WorldChatRoom:131–133`) `[auto]` | `PL` `RM` | M2 | ✅L2 |
| WCH-12 | `chat:groups:reordered` / `chat:channels:reordered` (WorldChatRoom:137–138) — payload nese nové pořadí (`items[]`); ostatní klienti vidí přeřazení bez refreshe. Round-trip parita `items[]` `[auto]` | `PL` | M3 | ✅L1 |
| WCH-13 | **Access filtr u channel eventů:** `chat:channel:created` pro `accessMode:'roles'` kanál jde do `world:{id}` **všem** ve světě (i hráči bez role). Ověřit, zda hráč díky tomu nevidí existenci skrytého kanálu (leak metadat), nebo zda FE/BE filtruje `[auto]` | `LK` `RM` | M4 | ⚠️ W-4 |

> **Výsledek C:** Channel/group eventy → `world:{worldId}`, FE jen invaliduje cache (nečte payload přímo) → refetch je server-filtrovaný (SC-01). **W-4 (nízká):** `chat.channel.created` ([chat.service.ts:335](../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L335)) posílá **celý objekt** skrytého (`accessMode:'roles'`) kanálu do `world:{id}` všem → metadata po drátě i klientům bez přístupu (UI je nezobrazí, ale jsou ve WS frame). Fix = leak-safe signál místo dat (vzor `universe:updated`/`chat:feed:bump`).

---

## D. Presence & typing

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WCH-14 | `chat:channel:join` (FE `ChannelView:197` posílá `{ channelId, userId, username, avatarUrl }`) — BE **ignoruje klientský `userId` pro roli**, resolvuje `worldRole` z membershipu serverem (`resolveChannelPresenceRole`). Ověřit anti-spoofing: hráč nemůže poslat cizí userId a získat PJ presence `[auto]` | `AU` | M3 | 🐛 W-3 |
| WCH-15 | `chat:presence` emit do `chat:{channelId}` nese **server-doplněný** `worldRole` (ne z klienta). FE `useChannelPresence:32` ho používá pro PJ panel. Payload parita `action: 'join'\|'leave'` `[auto]` | `PL` `AU` | M2 | ⚠️ W-3 |
| WCH-16 | Presence leave při disconnectu jen pokud uživateli nezůstal jiný socket (multi-tab dedup, `ChatPresenceService.leaveAll`) — ověřit, že přepnutí kanálu v druhém tabu neshodí presence v prvním `[auto]` | `LC` | M3 | ✅L1 |
| WCH-17 | `typing:start` → `chat:typing { isTyping:true }` do `chat:{channelId}`, auto-clear timeout 5 s; `typing:stop` clearuje timeout + `isTyping:false`. Ověřit, že odpojení během psaní timeout uklidí (žádný leaknutý setTimeout) `[auto]` | `LC` | M3 | ✅L2 |
| WCH-18 | FE typing guard: vlastní username se filtruje (`ChannelView` — `if characterName === currentUser return`) → vlastní psaní se nezobrazí. Ověřit, že porovnání sedí na poli, které BE v `chat:typing` posílá (`characterName`) `[auto]` | `PL` | M1 | ✅L1 |

> **Výsledek D — NÁLEZ W-3 (presence spoofing):** `handleChannelJoin` ([chat.gateway.ts:92-94](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L92)) resolvuje roli podle **`payload.userId`** (klientský), ne `client.data.userId` z JWT. Komentář „klientu se nevěří" je zavádějící — roli sice počítá z membershipu, ale **pro userId deklarovaný klientem**. Hráč pošle cizí `userId` → falešná presence s cizí identitou/rolí v PJ panelu. **Nekonzistence s N-9** (sound handler ve stejném souboru opraven na `client.data.userId`). Typing handlery mají stejnou ephemeral důvěru v `characterName` (triviální, neřeší se). Disconnect typing cleanup ✅ ([:57-63](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L57)).

---

## E. Zvuky — `sound:play` / `sound:stop` (anti-spoofing N-9)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WCH-19 | **N-9 anti-spoofing:** FE `SoundBroadcastButton:33` posílá `{ channelId, userId, youtubeUrl, name, loop }` — BE ale identitu bere z **`client.data.userId` (JWT)**, ne z payloadu `userId`. Ověřit, že payloadový `userId` je reálně ignorován (hráč s cizím userId roli nezíská) `[auto]` | `AU` | M3 | ✅L2 |
| WCH-20 | Role gate `sound:play` ≥ PomocnyPJ přes `resolveChannelPresenceRole`; neautorizovaný emit **tiše ignorován** (no error, no broadcast). Ověřit, že hráč nedostane chybu ani nepustí zvuk `[auto]` | `AU` | M3 | ✅L2 |
| WCH-21 | `chat:sound:playing` dorazí **všem** v `chat:{channelId}` včetně PJ samotného; FE `SoundNowPlayingBanner:62` filtruje dle `channelId`. Payload parita `{ channelId, youtubeUrl, name, loop }` `[auto]` | `PL` `RM` | M2 | ✅L2 |
| WCH-22 | `chat:sound:stopped` → `{ channelId }`; FE banner zastaví přehrávač. Ověřit, že `sound:stop` z banneru (`SoundNowPlayingBanner:89`) i z tlačítka (`SoundBroadcastButton:45`) posílá konzistentní payload `[auto]` | `PL` | M2 | ✅L2 |
| WCH-23 | **Sound gateway nemá testy** — N-9 role gate a anti-spoofing netestováno. Gap-fill M7: test `sound:play` jako hráč (ignorováno) vs PomocnyPJ (broadcast) `[auto]` | `AU` | M7 | ⚠️ gap |

> **Výsledek E:** Zvuky **vzorně** anti-spoofed — `userId = client.data.userId` z JWT ([chat.gateway.ts:194,215](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L194)), payloadový `userId` se **vůbec nečte**, role `< PomocnyPJ` → tiché `return`. Payloady `chat:sound:playing/stopped` sedí. ⚠️ Role gate cesta netestovaná (gap-fill M7) — kontrast s W-3, kde stejný anti-spoofing u presence **chybí**.

---

## F. Feed bump

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WCH-24 | `chat.feed.notify` → `chat:feed:bump { worldId }` do `user:{id}` příjemců (13.2a). **Leak-safe:** bez obsahu zprávy. Vlastní zprávy se odesílateli neposílají. Ověřit, že payload neobsahuje obsah/sender (jen `worldId`) `[auto]` | `LK` `PL` | M2 | ✅L2 |
| WCH-25 | FE `useChatFeed:47` na `chat:feed:bump` refetchne `/chat/feed` (server-filtrovaný). Ověřit, že FE nepředpokládá data z eventu (event je jen signál) `[auto]` | `PL` | M1 | ✅L1 |

> **Výsledek F:** `chat:feed:bump` nese **jen `{ worldId }`** ([chat.gateway.ts:251-257](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L251)) — leak-safe signál, FE refetchne filtrovaný feed. Vzor, který by W-4 (channel:created) měl převzít.

---

## Test coverage gaps

- `chat.gateway.spec.ts` (~30 testů) pokrývá presence + `sound:play` N-9 částečně — ověřit, zda pokrývá **anti-spoofing payloadového userId** (WCH-19) a role-tiché-ignorování (WCH-20).
- **`chat:unread` payload (WCH-06/07) netestováno round-tripem** — to je nejpravděpodobnější drift.
- Reorder eventy (WCH-12) — jen happy path; chybí parita `items[]`.

## Známá rizika (předběžná)

- **WCH-06 `chat:unread` / `mentionCount`:** BE výčet payloadu neuvádí `mentionCount`, FE ho čte. Buď FE defenzivně drží `prevMention` (pak OK), nebo se mention badge po WS eventu tiše resetuje. **Nutno doložit čtením `applyUnreadEvent` + reálného emitu.**
- **WCH-10/13 room+access:** channel/group eventy do `world:{id}` všem ve světě — riziko (a) hráč mimo WorldChatRoom je nedostane (stale), (b) hráč v roomu uvidí metadata kanálu, kam nemá přístup. Dvě protichůdná rizika, obě reálná.
