# bug / 05-chat-posta — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Soubory prošlé staticky (M1/M2/M4/M5):

**FE:**
- `src/features/chat/components/ChatRoom.tsx`
- `src/features/chat/api/useGlobalChat.ts`
- `src/features/chat/api/usePresenceHeartbeat.ts`
- `src/features/chat/lib/types.ts`
- `src/features/ikaros/api/useMail.ts`
- `src/features/ikaros/pages/MailPage/MailDetail.tsx`
- `src/features/notifications/api/useChatFeed.ts`
- `src/features/notifications/api/useEvents.ts`
- `src/features/notifications/api/usePush.ts`
- `src/features/notifications/api/usePushSubscriptions.ts`
- `src/features/notifications/components/NotificationCenter.tsx`
- `src/features/notifications/components/ChatFeedTab.tsx`
- `src/features/notifications/components/PushToggle.tsx`
- `src/features/notifications/components/PushDevicesList.tsx`
- `src/features/notifications/lib/feedFormat.ts`
- `src/features/notifications/types.ts`
- `public/sw.js`

**BE:**
- `backend/src/modules/global-chat/global-chat.controller.ts`
- `backend/src/modules/global-chat/global-chat.gateway.ts`
- `backend/src/modules/global-chat/global-chat.service.ts`
- `backend/src/modules/global-chat/clean-messages.job.ts`
- `backend/src/modules/global-chat/cleanup-inactive-users.job.ts`
- `backend/src/modules/ikaros-messages/ikaros-messages.controller.ts`
- `backend/src/modules/ikaros-messages/ikaros-messages.gateway.ts`
- `backend/src/modules/ikaros-messages/ikaros-messages.service.ts`
- `backend/src/modules/ikaros-messages/system-events.listener.ts`
- `backend/src/modules/push/push.controller.ts`
- `backend/src/modules/push/push.service.ts`
- `docs/websocket-api.md` (sekce §3 GlobalChat + §7 IkarosMessages)

### Osy prošlé:
A (Hospoda), B (Rozcestí), C (Whisper), D (Reakce/Reply), E (Pošta), F (Notifikační centrum), G (Push)

### M-metody aplikované:
- M1 (statické čtení) — všechny soubory výše
- M2 (kontrakt FE↔BE) — typy ChatMessage/RoomInfo/ChatFeedItem/PushDevice vs BE DTO
- M4 (auth gating) — JwtAuthGuard/AdminGuard/RolesGuard na každém endpointu
- M5 (WS kontrakt) — BE emit vs docs/websocket-api.md §3 + §7 + FE listenery

## Dosažená L vs cílová L

L2 dosaženo (obě strany cross-ref + WS kontrakt) / cílová L3.
L3 by vyžadoval spuštění BE/FE testů — chybí live infra.

Pozn.: Oblast byla z velké části prověřena v 3. kole bug-huntingu (N-30/31/32/33/34).
Tato kontrola ověřila opravy a prošla celý záběr znovu čerstvě. 5 předchozích nálezů
(N-30/32 ✅ opraveno; N-31 ✅ opraveno; N-33/34 ✅ opraveno) potvrzeny jako platné.

## Nálezy

### Opravené nálezy potvrzeny:
- **N-30** (rooms/presence 401 anon) — FE enabled: !!token → ✅ opraveno (L2)
- **N-31** (whisper v cizí místnosti) — ChatRoom.tsx:148 channelId guard → ✅ opraveno (L2)
- **N-32** (ghost uživatel) — presence leave filtr jen userId → ✅ opraveno (L2)
- **N-33** (events invalidace) — useEvents.ts:27 p?.system guard → ✅ opraveno (L2)
- **N-34** (race conversationId) — ikaros-messages.service.ts:70 předgenerovaný _id → ✅ opraveno (L2)

---

### N-RUN-05-01 — Docs drift: `ikaros:new-message` payload obsahuje `actionType`, BE emituje `system`
- **Kde:** `docs/websocket-api.md:199` × `ikaros-messages.gateway.ts:37-43`
- **Důkaz:** Docs §7 uvádějí `{ messageId, subject, senderName, actionType: string }`. BE emituje `{ messageId, subject, senderName, system: boolean }`. Pole `actionType` v BE neexistuje vůbec.
- **Dopad:** FE `useEvents` správně čte `p?.system` (funguje), `useUnreadCount` hook nepoužívá `actionType` (funguje). Kontrakt dokumentace lže → budoucí kód spoléhající na `actionType` dostane `undefined`. Testovací skupina dostane wrong docs.
- **Návrh:** Aktualizovat docs §7: nahradit `actionType: string` za `system: boolean`. (1 řádek)
- **L2** (BE kód × docs × FE cross-ref)
- **Klasifikace:** 🔓 otevřený (CP-56 z plánu oblasti — vědomý drift, docs neaktualizovány)

---

### N-RUN-05-02 — CP-13: `GET /global-chat/rooms/presence` stále za `JwtAuthGuard` (spec říká veřejné)
- **Kde:** `global-chat.controller.ts:69` (class-level `@UseGuards(JwtAuthGuard)`) × `global-chat.controller.ts:90` (`getRoomPresenceCounts` bez `@Public()` override)
- **Důkaz:** Spec CP-13 říká endpoint je veřejný (bez auth). N-30 "opravil" FE tím, že disabled query pro anon uživatele (`enabled: !!token`). Ale BE endpoint zůstal za JwtAuthGuard — anonymní request stále dostane 401. Spec nesplněn na BE úrovni.
- **Dopad:** Anonymní uživatelé (nepřihlášení) nevidí odznak počtu přítomných v navigaci — drobný UX defekt.
- **Návrh:** Buď (A) přidat `@Public()` dekorátor na `getRoomPresenceCounts` (endpoint skutečně veřejný dle spec); nebo (B) rozhodnutí: spec CP-13 přepsat na "vyžaduje auth" a FE stav je záměrný. N-30 fix byl jen FE-side, BE-side otevřeno.
- **L2** (statický důkaz + kontrakt)
- **Klasifikace:** 🟡 · 🆕 nový (N-30 fix nezahrnul BE stranu)

---

### N-RUN-05-03 — Race: `chat:presence` join broadcast odchází BEZ avataru/charakteru při rychlém multi-room joinu
- **Kde:** `global-chat.gateway.ts:236-295` (`registerPresence`) — komentář u `isNew` říká "záznam sync před await", ale broadcast je až PO profile awaitu
- **Důkaz:** Pokud socket joinuje dvě místnosti rychle po sobě (hospoda + rozcestí):
  - Join #1: isNew=true → record vytvoří sync, pak AWAIT profilu (asynchronní)
  - Join #2: isNew=false (record exists, ale profile ještě načítá) → skipne profile load → broadcast s `avatarUrl=undefined, characterName=undefined`
  - Join #1 dokončí: doplní `record.avatarUrl/characterName`, ale broadcast #1 byl správný (čekal)
  - **Výsledek:** Přítomní v místnosti #2 vidí uživatele BEZ avataru/charakteru dokud neudělají refresh/reconnect.
- **Dopad:** Kosmetický — absence avataru v presence listu při rychlém multi-room joinu. Neopravuje se bez refetche.
- **Návrh:** Po dokončení profile load emitovat update presence event (nebo REST endpoint pro refresh). Alternativa: REST `GET /room-info` funguje jako fallback (FE ho volá při mountu).
- **L1** (logická analýza kódu, bez živého testu)
- **Klasifikace:** 🟡 · 🆕 nový

---

### N-RUN-05-04 — `D-030` (CP-83) je implementován — plán oblasti zastaralý
- **Kde:** `push.controller.ts:54-57` (`GET /push/subscriptions`, `DELETE /push/subscriptions/:id`) + `PushDevicesList.tsx` + `usePushSubscriptions.ts`
- **Důkaz:** Oblast plán říká "D-030 — chybí `GET /push/subscriptions` endpoint a FE přehled zařízení". Při kontrole kódu: endpoint existuje, FE komponent `PushDevicesList` implementován s odhlašovacím tlačítkem, `usePushSubscriptions` hook hotový.
- **Dopad:** Žádný bugový dopad — pouze informace pro aktualizaci area plánu.
- **Návrh:** Aktualizovat `05-chat-posta.md` — CP-83 jako ✅ implementováno (D-030 vyřešen).
- **L2** (kód × plan docs)
- **Klasifikace:** 🟡 · 🆕 nový (nesrovnalost plán × realita)

---

## Klíčová ověření bez nálezu (L2):

| CP | Bod | Výsledek |
|---|---|---|
| CP-01/02/03 | isDeleted filtr + whisper viditelnost | ✅ `getMessages`: `!m.isDeleted` + `visibleTo` filtr (service.ts:201-205) |
| CP-04 | POST messages bez auth → 401 | ✅ class-level JwtAuthGuard |
| CP-05 | prázdná zpráva → 400 | ✅ `assertNotEmpty` + `GLOBAL_CHAT_EMPTY_MESSAGE` |
| CP-06 | color/replyToId/attachments uloženy, worldId=null, expiresAt=now+1h | ✅ service.ts:264-279 |
| CP-07/08 | WS chat:message do chat:{channelId} nebo user:{userId} | ✅ gateway handleGlobalMessageCreated |
| CP-09 | DELETE bez Admin → 403 | ✅ AdminGuard na metodě |
| CP-10/11 | soft-delete + WS + Cloudinary cleanup | ✅ service.ts:374-393, upload.service.ts:651-655 |
| CP-15 | limit=999 → max 100 | ✅ `Math.min(..., 100)` |
| CP-17/18 | příloha validace (doména + folder + max počet) | ✅ validateAttachments |
| CP-19 | CleanMessagesJob á 2h + Cloudinary | ✅ EVERY_2_HOURS cron + deleteAttachments |
| CP-20 | limit=0 → 50 | ✅ `opts.limit > 0 ? opts.limit : 50` |
| CP-23/24 | multi-room presence, leave per-místnost | ✅ Set<RoomKey> rooms |
| CP-25 | handleDisconnect odebere ze VŠECH rooms | ✅ for...of record.rooms |
| CP-26/27 | CleanupInactiveUsersJob á 5min threshold 60min | ✅ |
| CP-28 | heartbeat clearInterval na unmount | ✅ cleanup fn |
| CP-34 | whisper vyžaduje evidovaný socket | ✅ `if (!sender || ...)` |
| CP-39/40 | reakce toggle + dedup emoji | ✅ service.ts:402-438 |
| CP-41 | reakce na whisper jen účastník | ✅ `visibleTo.includes(userId)` |
| CP-44 | replyToPreview max 120 znaků, smazaný fallback | ✅ `slice(0,120)` + silent fallback |
| CP-47/48 | friend-only check + Admin bypass | ✅ assertCanMessageRecipient |
| CP-50/51 | conversationId = vlastní _id (N-34 fix) | ✅ predefined rootId |
| CP-53 | GET detail → isRead=true | ✅ service.ts:170-172 |
| CP-55 | WS ikaros:new-message do user:{recipientId} | ✅ gateway:37 |
| CP-57/59 | useUnreadCount + useMessageDetail invalidují badge | ✅ |
| CP-62/63/64 | NC open/Escape/setUnseen(0)/todo auto-switch | ✅ |
| CP-65/66/67 | useChatFeed cursor paginace, feed:bump listener, leak-safe payload | ✅ |
| CP-68 | useEvents invaliduje jen system zprávy (N-33 fix) | ✅ |
| CP-69 | chatFeedItem má worldName+channelName z BE | ✅ chat.service.ts:884-886 |
| CP-70/71 | preview() isDiceRoll prio; formatWhen teď/min/h/d/datum | ✅ |
| CP-72 | VAPID endpoint bez auth | ✅ controller bez JwtAuthGuard |
| CP-73/74 | subscribe/unsubscribe za JwtAuthGuard | ✅ |
| CP-75 | auto-smazání subscriptions 404/410 | ✅ push.service.ts:152-154 |
| CP-76 | usePush flow: requestPermission → subscribe → POST | ✅ |
| CP-77/78 | pushSupported guard + denied text | ✅ PushToggle.tsx |
| CP-79/80 | sw.js push event + notificationclick | ✅ |
| CP-81 | notifyAll fire-and-forget | ✅ (jen pro veřejné zprávy, ne whisper) |
| CP-82 | D-029 — PWA ikony opraveny (viz bug-audit.md) | ✅ |

## PROOF-REQUEST

1. **PR-05-A (M3 BE):** `npx jest --maxWorkers=2 --testPathPattern=global-chat` — ověřit zelené testy pro service + gateway (spec filtr isDeleted, limit cap, whisper visibleTo, reaction toggle).
2. **PR-05-B (M3 BE):** `npx jest --maxWorkers=2 --testPathPattern=ikaros-messages` — ověřit zelené testy service (conversationId, friend-only, softDelete).
3. **PR-05-C (M3 FE):** `vitest run --project '!storybook' -- chat` + `notifications` — ověřit useGlobalChat.spec.tsx + feedFormat.spec.ts zelené.
4. **PR-05-D (e2e/manual):** Ověřit N-RUN-05-03 (race condition avatar): otevřít Hospodu + ihned přejít do Rozcestí, sledovat presence event v síťovém debug — avatarUrl=undefined?
5. **PR-05-E (manual):** Ověřit CP-13 / N-RUN-05-02: anonymní request na `GET /global-chat/rooms/presence` → dostane 401 nebo 200?
