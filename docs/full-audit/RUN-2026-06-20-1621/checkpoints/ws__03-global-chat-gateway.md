# ws / 03-global-chat-gateway — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20 · Auditor: agent (read-only)

---

## Pokrytí

Prošel jsem veškerý kód oblasti 03 do plné statické hloubky:

**BE:**
- `global-chat.gateway.ts` (458 ř.) — všechny `@SubscribeMessage` handlery, `@OnEvent` handlery, `registerPresence`/`unregisterPresence`, `cleanupInactive`, `setEnvironment`
- `global-chat.service.ts` (441 ř.) — `sendWhisper`, `sendMessage`, `resolveReply`, `toggleReaction`, `validateAttachments`, `assertNotEmpty`
- `global-chat.gateway.spec.ts` (435 ř.) — ověřena pokrytost každé testové skupiny

**FE:**
- `ChatRoom.tsx` (523 ř.) — join/leave/reconnect lifecycle, WS listenery (`chat:message`, `chat:message:deleted`, `chat:message:reaction`, `chat:presence`, `chat:typing`)
- `useGlobalChat.ts` (159 ř.) — hooks `useRoomPresenceCounts`, `useToggleReaction`, `useSendMessage` atd.
- `usePresenceHeartbeat.ts` (22 ř.) — heartbeat 5 min
- `RozcestiPage.tsx` (112 ř.) — `chat:room:environment` listener, `useRoomEnvironment` REST seed
- `lib/types.ts` (155 ř.) — FE typy PresenceEvent, EnvironmentEvent, ChatMessage, ReactionEvent…

---

## Dosažená L vs cílová L

| Oblast | Cílová L (plán) | Dosažená L | Poznámka |
|---|---|---|---|
| GCH-01 W-10 (userId z JWT) | L3 | **L3** ✅ | test `global-chat.gateway.spec.ts:60-81` ověřuje spoofing + neautentizovaný socket |
| GCH-02 (room whitelist) | L1 | **L3** ✅ | testováno spec:104-111 |
| GCH-03 (multi-room leave isolation) | L1 | **L3** ✅ | spec:127-143 |
| GCH-04 (presence payload parita) | L1 | **L2** ✅ | statická parita BE emit ↔ FE PresenceEvent typ ověřena |
| GCH-05 (isSystem flag) | L1 | **L2** ✅ | BE ukládá `isSystem:true`, FE typ to má, visual rendering ověřen čtením |
| GCH-06 (heartbeat {} tolerantní) | L1 | **L3** ✅ | spec:263-278 |
| GCH-07 (cleanup cron → timeout reason) | L1 | **L3** ✅ | spec:279-300 |
| GCH-08 (navigace bez leave) | L1 | **L2** ✅ | confirmed: joinRoom/leaveRoom explicitní, unmount nemá leave |
| GCH-09 (whisper jen user:{id}) | L1 | **L2** ✅ | gateway:403-412, service:331 `visibleTo:[from.id, toUserId]` |
| GCH-10 (N-31 FE channelId filtr) | L2 | **L2** ✅ | ChatRoom.tsx:148 filtr |
| GCH-11 (content volitelné s attachments) | L1 | **L3** ✅ | spec:380-406 |
| GCH-12 (příloha validace doména/folder) | L1 | **L2** ✅ | service.ts:107-138 validateAttachments |
| GCH-13 (replyToId scope) | ⚠️ | **L3** ✅ | service.spec.ts:470-490 testuje cross-channel + smazaný + systémový → silent fallback |
| GCH-14 (reaction limit + idempotence) | L1 | **L3** ✅ | spec:329-337 emoji limit, service.spec toggleReaction |
| GCH-15 (chat:message:reaction payload) | L2 | **L2** ✅ | gateway:437-449 emit event shape = FE ReactionEvent |
| GCH-16 (whisper reaction leak) | L2 | **L3** ✅ | spec:355-365 ověřuje per-user:{id} routing |
| GCH-17 (N-30 room counts konzistence) | L2 | **L2** ✅ | REST za JwtAuthGuard, WS `server.emit` bez auth |
| GCH-18 (counts broadcast neautentizovaným) | L1 | **L2** ✅ | `server.emit` je plošný — počty místností nejsou citlivé |
| GCH-19 (environment in-memory reset) | ⚠️ | **L2** — nový detail viz níže | refetch při reconnectu chybí |
| GCH-20 (chat:message:deleted parita) | L2 | **L2** ✅ | global + world chat shodný tvar, room targeting OK |

---

## Nálezy

### W-RUN-01 — [PL] `chat:message:deleted` v ChatRoom chybí channelId filtr · kosmetika ♻️

- **Kde:** `ChatRoom.tsx:157-168` (`handleDeleted`)
- **Dopad:** Prakticky nulový — `chat:message:deleted` jde na BE do `chat:{channelId}` roomu, takže klient event dostane jen pokud je v tom konkrétním WS roomu. Ale na rozdíl od `ChannelView.tsx:326` (world chat, kde je filtr `if (e.channelId !== channelId) return`) a `handleMessage:148` (globální chat, kde filtr je) — `handleDeleted` v globálním chatu filtr nemá.
- **Riziko:** Pokud by uživatel měl oba ChatRoom a ChannelView naráz aktivní a sdíleli stejný socket (sdílený socket je záměrný), event z jednoho by mohl v krajním případě zaklepat na cache druhého — ale díky unikátnosti MongoDB ObjectId a rozdílných `keys.messages` query klíčů se nic nestane.
- **Návrh:** Přidat `if (channelId && e.channelId !== channelId) return;` (jako v ChannelView). Konsistence kódu.
- **L1** · ♻️ (kosmetika — kód style inconsistency, ne security)

---

### W-RUN-02 — [LC] Reconnect nevyvolá refetch prostředí (GCH-19 doloženo) · nízká ⚠️ ♻️

- **Kde:** `ChatRoom.tsx:262-279` (reconnect handler), `RozcestiPage.tsx:42-58`
- **Dopad:** Po BE restartu → environment in-memory reset na `fantasy/1`. FE drží React Query cache z předchozí session. `useSocketReconnect` v ChatRoom invaliduje jen `keys.messages`; environment klíč `chatQueryKeys(room).environment` není invalidován. Výsledek: klienti vidí stale prostředí Rozcestí dokud (a) neudělá někdo nový `PUT` nebo (b) navigují pryč a zpět. Kosmetický, matoucí pro "správce prostředí".
- **Návrh:** Do reconnect callbacku v ChatRoom (nebo do `RozcestiPage` vlastní `useSocketReconnect`) přidat `qc.invalidateQueries({ queryKey: keys.environment })`. Nebo přejít z in-memory na DB persistence (jiný scope).
- **L2** · ♻️ (preexistující ⚠️ z plánu, nyní doloženo kódem)

---

### W-RUN-03 — [PL] `typing:start/stop` v globálním chatu — characterName se nebere z profilu ⚠️ 🆕

- **Kde:** `ChatRoom.tsx:365-371` (emit), `chat.gateway.ts:136-161` (handler), `ChatRoom.tsx:234` (FE filtr)
- **Dopad:** FE posílá `{ channelId, characterName: user.username }` (= přihlašovací jméno účtu). Pro Rozcestí je to nekonzistentní — ostatní presence data (senderName, `chat:presence` payload) se berou z profilu postavy (přes `resolveSenderIdentity`). Ukazatel psaní v Rozcestí zobrazí přihlašovací jméno místo jména postavy. Nízký dopad, ale je to payload nekonzistence vůči zbytku presence systému.
- **Poznámka:** FE filtr `if (e.characterName === user?.username) return` (line 234) funguje — nezobrazí svůj vlastní typing indicator, ale název "characterName" v payloadu je sémanticky nesprávný, je to username.
- **Návrh:** Posílat `characterName: user.characterName || user.username` (FE `currentUser` drží `characterName` pokud ho profil má). Nebo přijmout jako by-design (Hospoda = účet, Rozcestí = postava by-profile ale typing BI-design = účet).
- **L1** · 🆕

---

## Potvrzená oprava W-10 (GCH-01) — ověřeno L3

`global-chat.gateway.ts:199,218` — `handleHospodaJoin` i `handleRoomJoin` používají `client.data.userId` z JWT, payloadový `userId` se pro room join NEPOUŽÍVÁ. Komentář v kódu explicitně odkazuje na W-10. Test `spec:60-81` testuje spoofing (útočník s `{ userId: 'victim' }` joinne `user:u1`, ne `user:victim`). **Oprava platná, W-10 ✅.**

---

## Potvrzená oprava GCH-13 (replyToId scope) — ověřeno L3

`global-chat.service.ts:213-232` (`resolveReply`) — validuje `target.channelId !== channelId` → silent fallback `{}`. Test `service.spec.ts:470-490` pokrývá null + cross-channel + smazaný + systémový. **GCH-13 ✅ L3.**

---

## PROOF-REQUEST

Žádné vrstvy L4 (round-trip testy) nebyly v plánu pro tuto oblast vyžadovány. Existující L3 pokrytí (gateway.spec 35 testů, service.spec) je dostatečné pro cílovou hloubku.

Dvě otevřené položky s `⚠️` v plánu (GCH-13, GCH-19) jsou nyní doloženy staticky (L2/L3) — GCH-13 uzavřeno, GCH-19 doloženo jako reálný gap (W-RUN-02).

Živá infrastruktura (BE restart / BE cron cleanup / socket disconnect real-time) nebyla testována — neoznačuji za hotové na L4:

> **PROOF-REQUEST-03-A:** BE restart test — ověřit, že po `nest --watch` restartu klients se reconnectem správně re-joinnou do `chat:{channelId}` a `user:{id}` (W-10 side-effect: ChatGateway nastaví userId při prvním handleConnection — validovat, že se po reconnectu `client.data.userId` znovu nastaví). Vyžaduje živé prostředí.
>
> **PROOF-REQUEST-03-B:** Multi-tab dedup presence — ověřit, že dva tabu stejného uživatele správně dedupují presence v UI (viz `getPresence()` `seen.has(userId)` filtr). Vyžaduje živé prohlížeče.
