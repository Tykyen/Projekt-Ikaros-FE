# 05 — Chat, pošta, notifikace

Pokrývá globální real-time chat (Hospoda + Rozcestí I.–III.), soukromou poštu (Ikaros Messages), notifikační centrum (feed chatů + události + ke zpracování) a PWA push notifikace. Oblast je silně real-time — WS kontrakt je klíčový rizikový faktor.

**BE:** `global-chat` (GlobalChatGateway, GlobalChatService, CleanMessagesJob, CleanupInactiveUsersJob), `ikaros-messages` (IkarosMessagesGateway, IkarosMessagesService, SystemEventsListener), `push` (PushService, PushController)
**FE:** `features/chat` (ChatPage, RozcestiPage, ChatRoom, MessageList, ChatInput, useGlobalChat, useSocket, usePresenceHeartbeat), `features/ikaros/pages/MailPage` (MailList, MailDetail, ComposeModal), `features/notifications` (NotificationCenter, ChatFeedTab, EventsTab, PushToggle, usePush, useChatFeed, useEvents)
**Routy:** `/chat`, `/chat/rozcesti`, `/chat/rozcesti2`, `/chat/rozcesti3`, `/ikaros/posta`

---

## A. Globální chat — Hospoda

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-01 | `GET /global-chat/messages?room=hospoda` vyfiltruje smazané zprávy (`isDeleted=true`) z výsledku `[auto]` | M3 | ⬜ |
| CP-02 | `GET /global-chat/messages` filtruje whispery — neúčastník (`visibleTo` neobsahuje jeho `userId` ani není sender) je nevidí `[auto]` | M3 | ⬜ |
| CP-03 | `GET /global-chat/messages` ukazuje odesílateli jeho vlastní whisper, i když není v `visibleTo` `[auto]` | M3 | ⬜ |
| CP-04 | `POST /global-chat/messages` bez přihlášení → 401 (`JwtAuthGuard` na controlleru) `[auto]` | M4 | ⬜ |
| CP-05 | `POST /global-chat/messages` s prázdným `content` a bez `attachments` → 400 `GLOBAL_CHAT_EMPTY_MESSAGE` `[auto]` | M3 | ⬜ |
| CP-06 | `POST /global-chat/messages` uloží `color`, `replyToId`, `attachments` z DTO; `worldId=null`, `expiresAt=now+1h` `[auto]` | M3 | ⬜ |
| CP-07 | Po `POST /global-chat/messages` přijde zpráva přes WS `chat:message` do roomy `chat:{channelId}` — FE `ChatRoom.handleMessage` ji přidá do cache `[auto]` | M5 | ⬜ |
| CP-08 | WS `chat:message` event odpovídá kontraktorovi v `docs/websocket-api.md` §3 — payload `ChatMessage` `[auto]` | M5 | ⬜ |
| CP-09 | `DELETE /global-chat/messages/:id` bez role Admin/Superadmin → 403 (`AdminGuard`) `[auto]` | M4 | ⬜ |
| CP-10 | `DELETE /global-chat/messages/:id` soft-deletuje zprávu a emituje WS `chat:message:deleted`; FE `handleDeleted` nastaví `isDeleted=true, content=null` v cache `[auto]` | M3 | ⬜ |
| CP-11 | Smazaná zpráva s přílohami → BE v eventu `chat.global.message.deleted` předá `attachments` pro Cloudinary úklid `[auto]` | M3 | ⬜ |
| CP-12 | `GET /global-chat/room-info` vrátí `channelId` + seznam přítomných (`users`); autentizace povinná `[auto]` | M4 | ⬜ |
| CP-13 | `GET /global-chat/rooms/presence` vrátí `Record<RoomKey, number>` bez auth (veřejné) — FE volá v `useRoomPresenceCounts` `[auto]` | M2 | ⬜ |
| CP-14 | WS `chat:rooms:presence` broadcast přichází po každém join/leave/cleanup; FE `useRoomPresenceCounts` nastaví cache a odznak navigace `[auto]` | M5 | ⬜ |
| CP-15 | Limit zpráv v historii: `GET /global-chat/messages?limit=999` → BE omezí na max 100 `[auto]` | M3 | ⬜ |
| CP-16 | `POST /global-chat/upload` bez přihlášení → 401; s přihlášením vrátí `ChatAttachment` `[auto]` | M4 | ⬜ |
| CP-17 | Příloha s URL cizí domény → 400 `GLOBAL_CHAT_INVALID_ATTACHMENT`; příloha mimo folder `global-chat/` taktéž `[auto]` | M3 | ⬜ |
| CP-18 | Max 10 obrázkových příloh + 4 dokumentové — překročení → 400 `[auto]` | M3 | ⬜ |
| CP-19 | `CleanMessagesJob` (cron á 2 h) maže zprávy starší 2 h + čistí Cloudinary přílohy; `getAllChannelIds()` vrátí IDs všech 4 místností `[auto]` | M1 | ⬜ |
| CP-20 | `chat:limit` query param `?limit=0` → BE dosadí default 50 (neuhne na 0) `[auto]` | M1 | ⬜ |

## B. Rozcestí (roleplay místnosti)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-21 | FE emituje `chat:room:join` s `{ room, username, userId }` při mountu `ChatRoom` (Rozcestí); BE gateway ignoruje neznámý `room` klíč `[auto]` | M5 | ⬜ |
| CP-22 | WS `chat:presence` payload při joinu nese `avatarUrl` (účet) + `characterName`/`characterAvatarUrl` (postava z profilu) — kontrakt dle docs §3 `[auto]` | M5 | ⬜ |
| CP-23 | Jeden socket může být přítomný ve více místnostech najednou (multi-room, krok 4.2d §1) — dedup dle `userId` při výpisu `[auto]` | M3 | ⬜ |
| CP-24 | Odchod z jedné místnosti (`chat:room:leave`) neodebere uživatele z ostatních místností `[auto]` | M3 | ⬜ |
| CP-25 | `handleDisconnect` (zavření socketu) odebere socket ze VŠECH místností a odbroadcastne `chat:presence` `leave` + `chat:rooms:presence` `[auto]` | M3 | ⬜ |
| CP-26 | `CleanupInactiveUsersJob` (cron á 5 min, threshold 60 min) odebere neaktivní sockety; po cleanup jde `chat:presence` s `reason: 'timeout'`; FE zobrazí overlay auto-odhlášení `[auto]` | M1 | ⬜ |
| CP-27 | `chat:heartbeat` obnovuje `lastSeen`; socket s heartbeaty 50 min + 50 min nepadá do cleanup při 60min threshold `[auto]` | M3 | ⬜ |
| CP-28 | `usePresenceHeartbeat` posílá `chat:heartbeat` á 5 min jen pokud `enabled=true` (je přihlášen); při unmountu/odhlášení interval clearuje `[auto]` | M1 | ⬜ |
| CP-29 | `GET /global-chat/rooms/:room/environment` vrátí `{ style, placeId }` — default `fantasy/1` před první změnou `[auto]` | M1 | ⬜ |
| CP-30 | `PUT /global-chat/rooms/:room/environment` za `RolesGuard` — jen platformová role (Superadmin/Admin/SpravceX); Hráč → 403 `[auto]` | M4 | ⬜ |
| CP-31 | WS `chat:room:environment` broadcast po REST PUT: payload `{ room, style, placeId }` odpovídá docs §3 `[auto]` | M5 | ⬜ |
| CP-32 | Prostředí místnosti je in-memory — restart serveru ho resetuje na default (dokumentováno, není bug, ale nutno ověřit) `[human]` | M1 | ⬜ |
| CP-33 | FE `useRoomEnvironment` se pro Hospodu nevolá (`enabled: room !== 'hospoda'`) `[auto]` | M3 | ⬜ |

## C. Whisper

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-34 | `ikaros:whisper` WS emit — socket musí být evidovaný v `connectedUsers` (po `join`); jinak ignorováno `[auto]` | M1 | ⬜ |
| CP-35 | Whisper bez textu a bez příloh → ignorováno (gateway guard před `sendWhisper`) `[auto]` | M3 | ⬜ |
| CP-36 | Whisper se uloží do správného kanálu dle `room` payloadu; fallback = první místnost socketu `[auto]` | M3 | ⬜ |
| CP-37 | WS `chat:message` pro whisper jde do `user:{userId}` roomu (jen pro `visibleTo` účastníky) — NE do `chat:{channelId}` roomy `[auto]` | M5 | ⬜ |
| CP-38 | WS `chat:message` payload pro whisper obsahuje vyplněné `visibleTo: [senderId, toUserId]` `[auto]` | M2 | ⬜ |

## D. Emoji reakce a reply

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-39 | `chat:reaction:toggle` — neznámý/neevidovaný socket ignorován; emoji > 16 znaků ignorováno `[auto]` | M3 | ⬜ |
| CP-40 | Uživatel reagující podruhé stejným emoji → odebere reakci; emptied emoji key se smaže z objektu `[auto]` | M3 | ⬜ |
| CP-41 | Na whisper reakci smí jen účastník (`visibleTo`); neoprávněný → tiché ignorování (ne 403) `[auto]` | M3 | ⬜ |
| CP-42 | Po `toggleReaction` jde WS `chat:message:reaction` s `{ messageId, channelId, reactions }` — veřejná zpráva do `chat:{channelId}`, whisper do `user:{userId}` účastníků `[auto]` | M5 | ⬜ |
| CP-43 | FE `handleReaction` nastaví `reactions` v cache bez refetche; `useToggleReaction` emituje `chat:reaction:toggle` se správným `room` `[auto]` | M3 | ⬜ |
| CP-44 | `replyToId` → BE dotáhne `replyToPreview` (max 120 znaků) a `replyToSenderName`; smazaný/systémový/cross-channel target → silent fallback (bez replyTo polí) `[auto]` | M3 | ⬜ |
| CP-45 | FE `useSendMessage` propíše `replyToId` do payloadu; FE `ChatRoom` resetuje `replyTo` po odeslání `[auto]` | M3 | ⬜ |

## E. Pošta (soukromé zprávy — Ikaros Messages)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-46 | `GET /ikaros-messages/inbox` bez přihlášení → 401 `[auto]` | M4 | ⬜ |
| CP-47 | `POST /ikaros-messages` — příjemce s `profileVisibility='friends'` odmítne zprávu od ne-přítele (403 `RECIPIENT_FRIENDS_ONLY`) `[auto]` | M3 | ⬜ |
| CP-48 | Admin/Superadmin obchází friend-only check (D-057); systémový odesílatel (bez `role`) taktéž `[auto]` | M3 | ⬜ |
| CP-49 | Odpověď ve vlákně (`replyToId` vyplněno) — ověří se účast odesílatele; jiný účastník → 403 `[auto]` | M3 | ⬜ |
| CP-50 | Kořen vlákna dostane `conversationId = vlastní _id` přes druhý update call `[auto]` | M3 | ⬜ |
| CP-51 | `GET /ikaros-messages/conversation/:id` vrátí celé vlákno vzestupně; cizí `userId` → 403; prázdné vlákno → 404 `[auto]` | M3 | ⬜ |
| CP-52 | `GET /ikaros-messages/conversation/:id` filtruje zprávy smazané per-user (`deletedByRecipient`/`deletedBySender`) `[auto]` | M3 | ⬜ |
| CP-53 | `GET /ikaros-messages/:id` označí zprávu jako přečtenou (`isRead=true`) pro recipienta; odesílatel `isRead` nemění `[auto]` | M3 | ⬜ |
| CP-54 | `DELETE /ikaros-messages/:id` je soft delete (nastaví `deletedByRecipient` nebo `deletedBySender`); cizí uživatel → 403 `[auto]` | M3 | ⬜ |
| CP-55 | Po odeslání zprávy jde WS `ikaros:new-message` do `user:{recipientId}` — payload `{ messageId, subject, senderName }` dle docs §7 `[auto]` | M5 | ⬜ |
| CP-56 | **Drift WS kontrakt:** docs §7 uvádí payload `{ messageId, subject, senderName, actionType }`, ale BE gateway emituje jen `{ messageId, subject, senderName }` — `actionType` chybí `[auto]` | M5 | ⬜ |
| CP-57 | FE `useUnreadCount` invaliduje `mailKeys.unread` i `mailKeys.inbox` po přijetí `ikaros:new-message`; fallback poll á 60 s `[auto]` | M1 | ⬜ |
| CP-58 | `GET /ikaros-messages/unread-count` vrátí `{ unreadCount, systemUnread }` — FE `useUnreadCount` mapuje na badge `[auto]` | M2 | ⬜ |
| CP-59 | FE `useMessageDetail` po načtení detailu invaliduje badge i inbox (odznák se snižuje) `[auto]` | M1 | ⬜ |
| CP-60 | FE `MailDetail` zobrazí celé vlákno přes `useConversation(message.conversationId)` — vlákno je vzestupné (nejstarší nahoře) `[human]` | M1 | ⬜ |
| CP-61 | `SystemEventsListener` odesílá systémovou zprávu při `world.access.approved` a `world.character.assigned` — `senderId='system'` (bez role → obchází friend-only) `[auto]` | M1 | ⬜ |

## F. Notifikační centrum

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-62 | `NotificationCenter` se otevírá/zavírá zvonem v headeru (atom `centerOpenAtom`); Escape zavře drawer `[auto]` | M1 | ⬜ |
| CP-63 | Otevření draweru nuluje badge `chatFeedUnseenAtom` (`setUnseen(0)`) `[auto]` | M1 | ⬜ |
| CP-64 | Záložka „Ke zpracování" se zobrazí jen pokud `pending.total > 0`; po vyprázdnění fronty auto-přepne na „Chaty" `[auto]` | M1 | ⬜ |
| CP-65 | `ChatFeedTab` — `useChatFeed` volá `GET /chat/feed` s cursor paginací (`before`); server vrací jen kanály s přístupem `[auto]` | M2 | ⬜ |
| CP-66 | `useChatFeedLive` — WS `chat:feed:bump` invaliduje `chatFeedKeys.all` a tiká badge; listener je registrovaný jednou v root layoutu `[auto]` | M5 | ⬜ |
| CP-67 | WS `chat:feed:bump` payload = `{ worldId }` (leak-safe, bez obsahu zprávy) — dle docs §1 `[auto]` | M5 | ⬜ |
| CP-68 | `EventsTab` — `useEvents` volá `GET /ikaros-messages/inbox?system=true`; WS `ikaros:new-message` invaliduje `eventsKeys.all` `[auto]` | M5 | ⬜ |
| CP-69 | `ChatFeedItem` typ na FE je `ChatMessage & { worldName, channelName }` — ověřit, že BE `GET /chat/feed` skutečně vrací `worldName` a `channelName` `[auto]` | M2 | ⬜ |
| CP-70 | `preview()` funkce: isDiceRoll má přednost → „🎲 Hod kostkou"; prázdný text + příloha → „📎 Příloha"; jinak text; null → „…" `[auto]` | M3 | ⬜ |
| CP-71 | `formatWhen()` funkce: < 1 min → „teď"; minuty/hodiny/dny; > 7 dní → datum `[auto]` | M3 | ⬜ |

## G. PWA push

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| CP-72 | `GET /push/vapid-public-key` vrátí `{ publicKey }` bez autentizace (veřejný endpoint) `[auto]` | M4 | ⬜ |
| CP-73 | `POST /push/subscribe` vyžaduje JWT; upsertuje subscription dle endpointu (idempotentní) `[auto]` | M4 | ⬜ |
| CP-74 | `POST /push/unsubscribe` vyžaduje JWT; smaže subscription dle `endpoint` + `userId` `[auto]` | M4 | ⬜ |
| CP-75 | `PushService.sendToSubscriptions` automaticky smaže subscription při HTTP 404/410 z push serveru `[auto]` | M3 | ⬜ |
| CP-76 | `usePush` — flow: `Notification.requestPermission` → `pushManager.subscribe` → `POST /push/subscribe`; klíče `p256dh`/`auth` z `sub.toJSON().keys` `[auto]` | M1 | ⬜ |
| CP-77 | `PushToggle` — na zařízeních bez `PushManager`/`serviceWorker` se komponent nevykreslí (`supported=false`) `[auto]` | M1 | ⬜ |
| CP-78 | `PushToggle` — při odepřeném oprávnění (`Notification.permission === 'denied'`) zobrazí text „Zakázáno v prohlížeči" místo tlačítka `[auto]` | M1 | ⬜ |
| CP-79 | Service worker (`sw.js`) — příjem `push` eventu: parsuje JSON payload, zobrazí notifikaci; fallback při chybě JSON → `event.data.text()` `[auto]` | M1 | ⬜ |
| CP-80 | Service worker — `notificationclick`: fokusuje existující okno nebo otevře nové na `payload.url`; zavře notifikaci `[auto]` | M1 | ⬜ |
| CP-81 | `notifyAll` v `GlobalChatService` — každá nová globální zpráva spouští push všem subscriptions (fire-and-forget, chyba neblokuje odpověď) `[auto]` | M1 | ⬜ |
| CP-82 | **D-029** — `manifest.webmanifest` uvádí `favicon.webp` pro 192×192 i 512×512; `maskable` purpose je přiřazena jednomu záznamu bez safe-zone paddingu — rozmazaný launcher icon `[auto]` | M1 | ⬜ |
| CP-83 | **D-030** — chybí `GET /push/subscriptions` endpoint a FE přehled zařízení; `PushToggle` spravuje jen aktuální zařízení bez výpisu ostatních `[auto]` | M1 | ⬜ |

---

## Test coverage gaps

- **FE `usePush`** — žádný unit test; kritické flow (subscribe/unsubscribe/denied/unsupported) není automaticky ověřeno.
- **FE `ChatRoom`** — žádný integrační test pro WS handlery (`handlePresence`, `handleMessage`, `handleReaction`, kicked overlay); testováno jen `useGlobalChat` izolovaně.
- **FE `NotificationCenter`** / `ChatFeedTab` / `EventsTab` — žádný komponentový test.
- **FE `useChatFeedLive`** — WS `chat:feed:bump` listener a badge inkrement není unit testem pokryt (jen `feedFormat.spec.ts` pokrývá pure funkce).
- **BE `SystemEventsListener`** — žádný spec soubor; `world.access.approved` a `world.character.assigned` handlery jsou bez testu.
- **BE `CleanMessagesJob`** a `CleanupInactiveUsersJob` — žádné testy (cron jobs); nepřímé pokrytí přes `GlobalChatGateway.cleanupInactive` unit test.
- **BE `IkarosMessagesGateway`** — chybí spec; JWT parsing při `handleConnection` a `ikaros:new-message` emit bez testu.
- **FE `MailDetail`** — žádný test; thread render, soft-delete flow a confirm dialog nekryty.
- **CP-56 drift** (`actionType` v `ikaros:new-message` payload): docs §7 pole, BE NEemituje — nutno prověřit a opravit docs nebo BE.

---

## Známá rizika

- **WS kontrakt drift `ikaros:new-message`** (CP-56): Dokumentace §7 udává pole `actionType` v payloadu, ale `IkarosMessagesGateway` ho neemituje. FE listenery (`useMail`, `useEvents`) pole nepoužívají — funkčně bez dopadu, ale kontrakt nesedí. Riziko: budoucí FE kód spoléhající na `actionType` potichu dostane `undefined`.
- **`notifyAll` na každou Hospoda zprávu** (CP-81): Každá globální zpráva spustí push na **všechny** subscriptions v DB. Při větší uživatelské základně to může být výkonnostní a rate-limit problém (`findAll()` bez batchingu, `Promise.all` paralelně — viz `SCALE_WARNING_THRESHOLD` v repository). Dnes nízká zátěž, ale architektura není škálovatelná.
- **In-memory prostředí Rozcestí** (CP-32): Restart BE serveru resetuje `environments` mapu — uživatelé v místnostech vidí stará data, dokud někdo neprovede nový `PUT environment`. Řešení by vyžadovalo persistence (DB nebo Redis). Dokumentováno v docs.
