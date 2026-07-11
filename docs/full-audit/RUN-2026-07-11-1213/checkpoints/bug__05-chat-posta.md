# bug — 05 Chat/pošta/notifikace · dosažená L1–L2 (read-only, bez běhu testů)

> Cílová L (plán README): tlačit kritické cesty na L3/L4. Read-only auditor →
> statika L1 (logika) + L2 (kontrakt FE↔BE, WS emit/listener, auth guardy).
> Testy nespouštěny (mandát read-only) → L3/L4 označeno jako PROOF-REQUEST.
> Pozn.: plán `05-chat-posta.md` je proti kódu ZASTARALÝ — „Rozcestí I.–III."
> už neexistuje (přejmenováno na Camp 16.6), přibyl guest systém (15.8),
> Voice krčma (17.6), anon-ban, camp-rotation. CP-body verifikovány proti
> AKTUÁLNÍMU kódu, ne proti liteře plánu.

## 🆕 NOVÉ NÁLEZY

### N-RUN-05a — 🟠 Přílohy globálního chatu se při expiraci NIKDY neuklidí z Cloudinary (TTL index předbíhá 2h cron)
- **Osa:** A. Globální chat — úklid (CP-19) / GDPR retence příloh
- **Kde:**
  - `backend/src/modules/chat/schemas/chat-message.schema.ts:82` — `ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })` (Mongo TTL index)
  - `backend/src/modules/global-chat/global-chat.service.ts:438` — `expiresAt = now + MESSAGE_TTL_MS` (`MESSAGE_TTL_MS = HOUR_MS` = **1 h**, ř.115)
  - `backend/src/modules/global-chat/clean-messages.job.ts:24,29` — cron á 2 h, `olderThan = now − HOURS_2_MS` (**2 h**), `pruneChannel(channelId, olderThan, 100)`
  - `backend/src/modules/chat/repositories/chat-message.repository.ts:287` — filtr `createdAt: { $lt: olderThan }`; jen mazané dokumenty vrací `attachments` k `deleteAttachments`
- **Důkaz (řetěz):** Zpráva vzniká v T s `expiresAt = T+1 h`. Mongo TTL monitor (běží ~á 60 s) doc **fyzicky smaže v ~T+1 h**. Cron `CleanMessagesJob` hledá `createdAt < now−2 h`; jenže jakýkoli takový doc měl `expiresAt = createdAt+1 h < now−1 h`, tj. TTL ho smazal už dávno. `pruneChannel` proto reálně **nikdy nenajde dokument** → `attachments = []` → `uploadService.deleteAttachments()` se pro expirované zprávy nespustí. Jediná další cesta úklidu (`@OnEvent('chat.global.message.deleted')` v `upload.service.ts:772`) pokrývá **jen ruční Admin delete**, ne přirozenou expiraci.
- **Dopad:** Obrázky a dokumenty nahrané do Hospody/Campu (folder `global-chat/`) **zůstávají na Cloudinary natrvalo** i poté, co efemérní zpráva (TTL 1 h) zmizí. (a) trvalý růst úložiště / náklad; (b) privacy/GDPR — uživatel sdílí soubor v „mizící" 1h zprávě, ale asset zůstane veřejně dosažitelný přes přímou Cloudinary URL neomezeně (viz i dluh D-NEW-UM02 — chat média mají veřejnou URL). Plán CP-19 tuto cestu považuje za funkční — realita s TTL indexem ji činí mrtvou.
- **Návrh:** buď (a) prodloužit cron `olderThan` NAD TTL nemá smysl (TTL vždy vyhraje) → správně: **napojit Cloudinary úklid na expiraci**, ne na cron. Varianty: TTL sundat a mazání dělat výhradně cronem (createdAt+attachments v jednom kroku), NEBO přidat `@OnEvent`/change-stream hook na TTL delete (Mongo TTL delete ale event nevydá) → prakticky: **zrušit TTL index pro global-chat kanály a nechat expiraci na cronu** (který sbírá `attachments`), s kratším intervalem než 1 h; nebo evidovat přílohy zvlášť a mazat je periodicky podle `expiresAt`. Rozhodnutí architektonické → k diskuzi.
- **L:** L2 (statický řetěz: TTL index + service TTL + cron filtr + repo sémantika + absence alt. cesty). Není v registru `bug-audit.md` (N-1…N-42) ani v `dluhy.md`. **Klasifikace: 🆕**
- **PROOF-REQUEST (→L3):** e2e/db test — vlož global zprávu s přílohou, posuň čas > 1 h, ověř že (1) doc zmizel TTL, (2) Cloudinary asset stále existuje (mock `deleteAttachments` NEbyl volán). Alternativně jednotkový test `CleanMessagesJob` s dokumenty mladšími 1 h ukáže, že `pruneChannel` nemaže nic s přílohami.

## ⚠️ Drobné (neescalováno)
- `global-chat.service.ts:332-337` `getMessages` — filtr `visibleTo`/`isDeleted` se aplikuje AŽ po DB `limit` → při hodně whisperech může uživatel dostat < 50 viditelných zpráv, i když další viditelné leží těsně za oknem. Kosmetické, L1.
- CP-56 drift (`actionType` v `ikaros:new-message`) — BE nyní emituje `system` (N-33), `actionType` neemituje; FE listenery ho nepoužívají. **♻️ známé** (plán CP-56 + registr N-33). Funkčně bez dopadu.
- `notifyAll` na každou Hospoda zprávu (CP-81) — **♻️ známé** (`dluhy.md` ř.109, škálování push).

## Co jsem prošel (plná hloubka L1-L2)
**BE global-chat:** controller (guardy: `GuestOrMemberGuard` na třídě, `AdminGuard` na delete/anon-ban, `RolesGuard`+`@Roles` na PUT environment/default — CP-04/09/30 OK), service (sendMessage/sendWhisper/getMessages visibility CP-02/03, validateAttachments doména+folder+počty CP-17/18, resolveReply viditelnost FIX-38 CP-44, deleteMessage CP-10/11, toggleReaction CP-39-42, saveGame/loadGame/rotace 16.6b), gateway (presence multi-room, handleDisconnect/cleanupInactive CP-25/26, heartbeat CP-27, whisper connectedUsers guard CP-34-38, reaction emoji≤16 CP-39, voice 17.6, WS emit scope user:{id} vs chat:{channelId} CP-37/42 OK), oba joby (clean + cleanup-inactive), DTO (create-global-message).
**BE ikaros-messages:** service (friend-only D-057 + admin/system bypass CP-47/48, conversationId N-34 fix CP-50, getConversation per-user delete filtr CP-51/52, getById mark-read CP-53, softDelete CP-54), controller (JwtAuthGuard CP-46), gateway (JWT handshake→user:{id}, emit `ikaros:new-message`+`system` CP-55/56), system-events.listener (world.access.approved / world.character.assigned CP-61), DTO.
**BE push:** service (subscribe rotace scoped FIX-7, sendToSubscriptions 404/410 cleanup CP-75, notifyAll kategorie filtr, TTL/topic transport), controller (vapid public bez auth CP-72, subscribe/unsubscribe/subscriptions/delete za JWT CP-73/74 + D-030 endpoint).
**FE:** useGlobalChat (CP-07/13/33/43/45, N-30 gate), ChatRoom (WS handlery, N-31 channelId filtr + N-32 leave filtr OK, join/leave/reconnect), usePresenceHeartbeat (CP-28), useMail (unread/detail invalidace CP-57/59), useEvents (N-33 system filtr CP-68 + auto-mark-read), useChatFeed/Live (CP-65/66/67), usePush + PushToggle (CP-76/77/78), NotificationCenter (CP-62/63/64), MailDetail (CP-60), sw.js (push/notificationclick/pushsubscriptionchange CP-79/80).
**Kontrakt:** typing:start/stop→chat:typing přes `chat.gateway.ts:151-193` (global chat sdílí generický handler přes `chat:{channelId}` room; bez membership gate, efemérní — OK).

## Nedosaženo (read-only limit)
- M3/M6 (běh vitest/jest) nespuštěn → L3 nikde reálně nepotvrzeno testem tento běh; existující specy (global-chat.service/gateway/controller, push, ikaros-messages.service) jsou přítomné, ale neběžely.
- CP-32 (in-memory prostředí Camp reset po restartu) = `[human]`, nelze staticky doběhnout.
