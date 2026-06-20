# bug / 07-svet-chat — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Soubory prošlé staticky (L1–L2)
**BE:**
- `chat.service.ts` (celý, ~1900 ř.) — sendMessage, deleteGroup, reorderGroups/Channels, syncLinkedChannelMembers, broadcastUnreadUpdate, markAsRead, getUnreadCounts, getFeed, searchMessages, hasChannelAccess, canJoinChannelRoom, ensureWorldChat, event listenery
- `chat.gateway.ts` (celý) — handleConnection (JWT→userId), handleChannelJoin (W-3), handleSoundPlay/Stop (N-9 fix), všechny @OnEvent handlery, handleUnreadUpdated payload
- `chat.presence.service.ts` — interface pouze (impl ověřena nepřímo)
- `chat-group.repository.ts` (celý) — toEntity mapper (SC-04)
- `chat-channel.repository.ts` (celý) — toEntity mapper (SC-05)
- `chat-message.repository.ts` (celý) — toEntity mapper, findFeed, findByChannelId, countAfter/countMentionsAfter, softDelete, addReaction, removeReaction
- `chat-message.schema.ts` — schema fields vs interface
- `emotes.service.ts` (celý) — create, delete, copy, applyUpdate, SC-66-69
- `emotes.gateway.ts` (celý) — SC-70
- `emotes-repository.ts` (celý) — SC-66 toEntity
- `sounds.service.ts` (celý) — SC-64-65
- `sounds.repository.ts` (excerpty) — findGlobalByUrlOrName

**FE:**
- `chat/lib/types.ts` — ChatGroup, ChatChannel, ChannelUnread (SC-06, SC-07)
- `chat/api/useWorldChat.ts` (celý) — applyUnreadEvent, useUnreadSync (SC-23, SC-32)
- `chat/api/useOptimisticSend.ts` (celý) — retry payload (SC-56)
- `chat/components/WorldChatRoom.tsx` (celý) — WS listenery, unread/mention sync, activeChannelId
- `chat/components/ChannelView.tsx` (~350 ř.) — WS lifecycle, handleMessage dedup (SC-19), handleDeleted, handleTyping (SC-44)
- `chat/emotes/api/useWorldEmotes.ts` (celý) — SC-71, SC-75 ověření
- `chat/emotes/api/useGlobalEmotes.ts` (celý) — SC-70
- `world/hooks/useWorldSocket.ts` (celý) — room:join pro SC-75
- `world/pages/WorldEmotesAdminPage/WorldEmotesAdminPage.tsx` (celý) — SC-75 ověření
- `world/sounds/player/youtubeId.ts` + spec — SC-62
- `chat/dice/lib/rollEngine.ts` (celý) — SC-46, SC-47, SC-54, SC-55
- `chat/dice/lib/dicePayload.ts` (celý) — SC-49, SC-50
- `gateways/app.gateway.ts` (celý) — R-04 chat room gate

### Osy prošlé
A (struktura kanálů), B (zprávy — odeslání, edit, delete, mentions, whisper, reakce, retry), C (presence, typing), D (kostky), E (zvuky), F (emoty), G (appearance/feed)

### M-metody použité
M1 (statické čtení), M2 (kontrakt FE↔BE — toEntity mappers, typy), M5 (WS emit/listener logika)

---

## Dosažená L vs cílová L

- **Dosaženo: L2** (statické čtení + cross-ref kontrakt FE↔BE; WS emit/listener logika staticky ověřena)
- **Cílová L:** L3 (existující testy zelené) — M3 NEPROVEDENO (spuštění jest/vitest)
- **Důvod:** read-only mandát + nespustitelné testy bez živé infry; statická analýza vyčerpávající

---

## Nálezy

### N-RUN-01 — 🟡 FE `ChatChannel` typ chybí `linkedMemberUserId` (SC-05 / SC-06 type drift)
- **Kde:** `src/features/world/chat/lib/types.ts:35-51` vs BE `chat-channel.interface.ts:20`
- **Popis:** BE interface `ChatChannel` deklaruje `linkedMemberUserId?: string`, FE typ ho neobsahuje. BE pole se přenáší v JSON odpovědi `GET /worlds/:id/chat/groups` ale TS ho FE odřezuje.
- **Dopad:** Nízký — FE nikde pole nepoužívá (grep: 0 výskytů v FE src). BE ho využívá jen interně pro obohacení portrétu (enrich proběhne na BE, imageUrl dorazí správně). Potenciální problém pokud by FE kdykoli potřeboval `linkedMemberUserId` — tichá ztráta bez TS chyby.
- **Návrh:** Doplnit `linkedMemberUserId?: string` do FE `ChatChannel` typu jako dokumentaci kontraktu.
- **L1** — statické čtení obou stran
- **Klasifikace:** 🆕

### N-RUN-02 — 🟡 SC-75 NEPLATÍ — WorldEmotesAdminPage room:join zajišťuje WorldLayout (verifikace)
- **Kde:** `src/features/world/pages/WorldEmotesAdminPage/WorldEmotesAdminPage.tsx` + `src/features/world/hooks/useWorldSocket.ts:34`
- **Popis:** Plán hrozil rizikem SC-75 (admin emotes stránka bez `room:join world:{id}`). Po přečtení `useWorldSocket.ts` je jasné, že `WorldLayout` volá `useWorldSocket` (mountuje pro VŠECHNY stránky světa) a tím joinne `world:{id}` room. `WorldEmotesAdminPage` je pod `WorldLayout` → emote WS eventy dorazí.
- **Dopad:** Žádný bug. SC-75 je false alarm za aktuálního routovacího stromu.
- **Návrh:** Přidat komentář do `useWorldEmotes.ts` (řádek 19) zmiňující, že `WorldLayout/useWorldSocket` drží room za stránky světa, ne jen `WorldChatRoom`.
- **L2** — statické cross-ref WorldLayout → useWorldSocket → room:join
- **Klasifikace:** 🔓 otevřený (plán ho označil jako riziko) → ZAVŘEN jako false positive

### N-RUN-03 — 🟠 SC-56 POTVRZENO — retry selhané dice zprávy vynechá `dicePayload`/`diceSkin`
- **Kde:** `src/features/world/chat/api/useOptimisticSend.ts:148-161`
- **Popis:** `retry()` sestaví `payload` ručně z `ChatMessage` polí, ale `dicePayload` a `diceSkin` vynechá. Retry pošle POST na BE bez `dicePayload` → BE nastaví `dicePayload: null`, ale `isDiceRoll` může zůstat `true` přes DICE_REGEX fallback pokud `content` matchuje formát. Výsledek: zpráva v DB má `isDiceRoll: true`, ale `dicePayload: null` → `parseDicePayload(null)` vrátí null → FE renderuje `DiceMessageFallback` (text) místo 3D scény pro ostatní klienty. Odesílateli se zpráva zobrazí správně (z optimistic `dicePayload`), ostatní uvidí degradovanou verzi.
- **Dopad:** Tichá regrese bez chybové hlášky. Postiženo: pouze retry selhané dice zprávy (vzácná situace — vyžaduje výpadek sítě + retry). Blast radius: jen 3D kostková scéna → fallback text u ostatních uživatelů.
- **Návrh:** Do `retry()` doplnit `dicePayload: message.dicePayload ?? undefined` a `diceSkin: message.diceSkin ?? undefined`. Oba jsou součástí `SendWorldMessagePayload`. Jednořádková oprava.
- **L2** — statické čtení obou stran + cross-ref BE DICE_REGEX fallback
- **Klasifikace:** 🔓 otevřený (je v plánu jako SC-56 „Známá rizika" sekci)

### N-RUN-04 — 🟡 chat.gateway `handleUnreadUpdated` emituje bez `mentionCount` (by-design ověřeno)
- **Kde:** `backend/src/modules/chat/chat.gateway.ts:373-383`
- **Popis:** `chat:unread` WS event emituje `{ channelId, count }` bez `mentionCount`. FE typ `ChannelUnreadEvent = ChannelUnread` vyžaduje `mentionCount: number`.
- **Ověření:** `applyUnreadEvent` drží `prevMention` pro increment events (`count: -1`) a pro absolutní (`count: 0`) použije `event.mentionCount ?? 0 = 0` → mention dot správně zmizí po markAsRead WS event. `ws-audit.md:164` to explicitně označil za by-design (K-3/WCH-06). Mention dot není plně real-time — záměr, dožene REST seedem.
- **Dopad:** Žádný funkční bug — chování je záměrné a zdokumentované.
- **L2** — statické cross-ref + ověření applyUnreadEvent logiky
- **Klasifikace:** 🔓 otevřený (byl v WCH-06) → ZAVŘEN jako by-design

### N-RUN-05 — ✅ N-19 fix ověřen platný (broadcastUnreadUpdate)
- **Kde:** `backend/src/modules/chat/chat.service.ts:1430-1448`
- **Popis:** `broadcastUnreadUpdate` nyní volá `hasAccessGivenMembership(channel, m.userId, m)` — stejná logika jako `getGroupsWithChannels`. Čtenář (role < Hrac) a Zadatel (role == 0) nedostanou `chat:unread` badge pro kanály, kam nemají přístup.
- **L2** — statické čtení; předchozí bug (N-19) potvrzen jako opravený

### N-RUN-06 — ✅ N-20 fix ověřen platný (syncLinkedChannelMembers)
- **Kde:** `backend/src/modules/chat/chat.service.ts:1836-1871`
- **Popis:** `syncLinkedChannelMembers` nyní kontroluje `isStaff = membership.role >= PomocnyPJ`. Pokud `isStaff`, userId zůstane v `allowedMemberIds` linked kanálů bez ohledu na `currentGroup=null`. PomocnyPJ nebude odstraněn při každé změně membership.
- **L2** — statické čtení; bug N-20 potvrzen jako opravený

### N-RUN-07 — ✅ R-04 chat room join gate ověřen platný (SC-39 / whisper)
- **Kde:** `backend/src/gateways/app.gateway.ts:37-43` + `chat.service.ts:155-163`
- **Popis:** `room:join chat:{id}` prochází `canJoinChannelRoom` gate. Identita z JWT `client.data.userId`. Nečlen privátního world kanálu nedostane přístup do WS roomu a nevidí zprávy ani přes WS.
- **L2** — statické čtení obou stran

### N-RUN-08 — ✅ SC-66 emotes toEntity ověřen (tags default + worldId as string)
- **Kde:** `backend/src/modules/emotes/repositories/custom-emotes.repository.ts:15-29`
- **Popis:** `tags: (doc.tags as string[]) ?? []` (default na [] pokud chybí), `worldId: doc.worldId ? String(doc.worldId) : null`. Pole `name`, `shortcode`, `imageId`, `imageUrl` mappovány.
- **L2** — statické čtení; SC-66 OK

### N-RUN-09 — ✅ N-9 (sound:play userId spoofing) ověřen opravený
- **Kde:** `backend/src/modules/chat/chat.gateway.ts:187-212`
- **Popis:** `sound:play` a `sound:stop` handlery berou `userId` z `client.data.userId` (JWT handshake), ne z klientského payloadu. Role check `resolveChannelPresenceRole` volán s ověřeným userId.
- **L2** — statické čtení; N-9 potvrzen jako opravený

### N-RUN-10 — ✅ SC-09 deleteGroup kaskáda ověřena
- **Kde:** `backend/src/modules/chat/chat.service.ts:419-451`
- **Popis:** `deleteGroup` iteruje kanály, volá `softDeleteByChannelId(ch.id)` na zprávy, `channelRepo.delete(ch.id)`, emituje `chat.channel.deleted` pro každý kanál. Skupinový event `chat.group.deleted` přijde po všech kanálových. SC-09 OK.
- **L2** — statické čtení

---

## Přehled pokrytých SC bodů

| SC | Status | L |
|----|--------|---|
| SC-01 | ✅ getGroupsWithChannels přes hasAccessGivenMembership; role gate + world gate | L2 |
| SC-02 | ✅ lazy seed `ensureWorldChat` v getGroupsWithChannels; idempotentní | L2 |
| SC-03 | ✅ `@OnEvent('world.settings.updated')` → syncWorldGroupChannels | L2 |
| SC-04 | ✅ toEntity ChatGroup mapper — color, iconKey, linkedWorldGroup | L2 |
| SC-05 | 🐛 toEntity ChatChannel chybí linkedMemberUserId ve FE typu → N-RUN-01 (nízký) | L2 |
| SC-06 | ✅ jinak kompletní; viz N-RUN-01 | L2 |
| SC-07 | ✅ ChatGroup FE typ má color, iconKey, linkedWorldGroup (N-21 opraveno) | L2 |
| SC-08 | ✅ canManageChat gate v createChannel | L2 |
| SC-09 | ✅ viz N-RUN-10 | L2 |
| SC-10 | ✅ reorderGroups — groupIds.has(id) check; INVALID_GROUP_ID | L2 |
| SC-11 | ✅ reorderChannels — groupIds.size > 1 → MIXED_GROUPS | L2 |
| SC-12 | ✅ handleChannelCreated → emit `{ worldId }` → FE invalidateGroups | L2 |
| SC-13 | ✅ handleGroupsReordered + handleChannelsReordered → FE invalidateGroups | L2 |
| SC-14 | ✅ updateChannel target.worldId !== channel.worldId → CHAT_FORBIDDEN | L2 |
| SC-15 | ✅ `@OnEvent('world.membership.removed')` → syncLinkedChannelMembers(null) | L2 |
| SC-17 | ✅ hasChannelAccess v sendMessage gate | L2 |
| SC-18 | ✅ findByNonce → vrátí existující zprávu; partialFilterExpression index | L2 |
| SC-19 | ✅ handleMessage dedup dle id, pak nonce swap | L2 |
| SC-20 | ✅ retry posílá stejný nonce → BE findByNonce vrátí existující | L2 |
| SC-21 | ✅ MENTION_REGEX + usersRepo.findByUsernames + membershipRepo.findByCharacterPathsAndWorld | L2 |
| SC-22 | ✅ @all/@here → resolveChannelRecipients | L2 |
| SC-23 | ✅ applyUnreadEvent zachovává prevMention pro increment; mentionCount v ChannelItem | L2 |
| SC-24 | ✅ whisper → gateway emituje do `user:{id}` roomů; getMessages filtruje visibleTo | L2 |
| SC-25 | ✅ isDiceRoll → CHAT_DICE_NOT_EDITABLE; vlastní nebo canManageChat | L2 |
| SC-26 | ✅ dice → canManageChat; non-dice → ownership | L2 |
| SC-27 | ✅ isDeleted: true, content: '*Zpráva...*'; handleDeleted FE nastaví isDeleted lokálně | L2 |
| SC-28 | ✅ overrideName → canManageChat gate; CHAT_NPC_FORBIDDEN | L2 |
| SC-29 | ✅ lastMessagePreview: '📎 Příloha' pro attachment-only | L2 |
| SC-30 | ✅ toggleReaction → hasChannelAccess; emit chat.message.updated | L2 |
| SC-31 | ✅ broadcastUnreadUpdate — hasAccessGivenMembership (N-19 fix) | L2 |
| SC-32 | ✅ markAsRead → lastMessage; emit chat.unread.updated count:0 | L2 |
| SC-33 | ✅ findByChannelId limit=min(req,100); sort desc then reverse | L2 |
| SC-38 | ✅ enrichTombstoneSenders batch; 60s cache in UsersService | L2 |
| SC-39 | ✅ chat:channel:join → resolveChannelPresenceRole; R-04 room gate | L2 |
| SC-40 | ✅ handleDisconnect presence.leaveAll; stillPresent check | L2 |
| SC-41 | ✅ handleConnection — JWT → user:{id} join; tolerantní na chybějící token | L2 |
| SC-42 | ✅ presence.leaveAll + leave jen pokud !stillPresent | L2 |
| SC-43 | ✅ typingTimeouts Map; auto-stop 5s timeout; typing:stop clearuje | L2 |
| SC-44 | ✅ handleTyping: `e.characterName === currentUser.username` filter | L2 |
| SC-46 | ✅ rollFate: 4×secureRandomInt(3)-1; sum; symbols | L2 |
| SC-47 | ✅ d100: tens=0,ones=0→sum=100; jinak tens+ones | L2 |
| SC-49 | ✅ buildFatePayload: total=sum+modifier; overpressure z total; total≥7 → non-null | L2 |
| SC-50 | ✅ parseDicePayload: chybí type/faces/sum/total → null | L2 |
| SC-51 | ✅ isDiceRoll = !!dicePayload OR DICE_REGEX (legacy fallback) | L2 |
| SC-52 | ✅ diceSkin v toEntity a v save; vrátí se klientům | L2 |
| SC-53 | ✅ isFreshRoll file existuje; staticky neověřena implementace | L1 |
| SC-54 | ✅ rejection sampling: buf[0] < limit; smyčka | L2 |
| SC-55 | ✅ rollPool: type pool-d${sides}; rollMixedDice: faceTypes[] stejné délky | L2 |
| SC-56 | 🐛 retry vynechává dicePayload/diceSkin → N-RUN-03 | L2 |
| SC-57 | ✅ handleSoundPlay — resolveChannelPresenceRole >= PomocnyPJ | L2 |
| SC-58 | ✅ N-9 opraveno — userId z client.data (JWT), ne payload | L2 |
| SC-59 | ✅ emit do `chat:{channelId}`; FE filtruje dle channelId v handleru | L2 |
| SC-62 | ✅ extractYoutubeId — null pro invalid; testy pokrývají YT formáty | L2 |
| SC-64 | ✅ findGlobalByUrlOrName — case-insensitive regex na name, exact URL | L2 |
| SC-65 | ✅ approveNomination: status='pending' check; rejectNomination+reason | L2 |
| SC-66 | ✅ toEntity: tags??[], worldId as string|null | L2 |
| SC-67 | ✅ count >= limit → 409; findByShortcode collision | L2 |
| SC-68 | ✅ applyUpdate: idChanged !== urlChanged → EMOTE_IMAGE_PAIR_REQUIRED | L2 |
| SC-69 | ✅ copy: emote.worldId !== sourceWorldId → 404; target limit; collision | L2 |
| SC-70 | ✅ emote:created → world:{id}; emote:created-global → broadcast; FE subscribed | L2 |
| SC-71 | ✅ useWorldEmotes onCreated: emote.worldId !== worldId → skip | L2 |
| SC-75 | ✅ FALSE ALARM — WorldLayout/useWorldSocket drží world:{id} room | L2 |
| SC-76 | ✅ hasChannelAccess-like gate; CHAT_NOT_MEMBER 403 | L1 |
| SC-77 | ✅ partial update — jen DTO poslaná pole | L1 |
| SC-78 | ✅ color/customFont/customFontSize server-fill z membership | L2 |
| SC-79 | ✅ chat:feed:bump — jen { worldId } signál; FE refetchne /chat/feed | L2 |
| SC-80 | ✅ findFeed: $or visibleTo filter pro member channels | L2 |

---

## PROOF-REQUEST

### PR-1 — M3: spustit BE chat testy
```
cd backend && npx jest --maxWorkers=2 --testPathPattern="chat"
```
Ověřit: všechny chat.service.spec.ts + chat.gateway.spec.ts + chat-message.repository.spec.ts zelené. Zejména N-19/N-20 regresní testy.

### PR-2 — M3: spustit FE vitest pro chat
```
cd frontend && vitest run --project '!storybook' src/features/world/chat
```
Ověřit: applyUnreadEvent testy zelené (SC-23); rollEngine.spec.ts zelené (SC-46,47,54,55); emotes spec zelené.

### PR-3 — M7 (gap-fill): napsat test pro SC-56 retry dice payload
Pokud PR-2 neodhalí stávající test pro `useOptimisticSend.retry` s dice payload → napsat:
- retry selhané zprávy s `dicePayload` + `diceSkin` → payload poslaný na server obsahuje obě pole
- Lokace: nový test v `useOptimisticSend.spec.ts` (nebo přidat do stávajícího souboru)

### PR-4 — SC-28 NPC role gate e2e smoke
Hráč odešle zprávu s `overrideName` → BE vrátí 403 CHAT_NPC_FORBIDDEN.
(Nelze staticky ověřit bez živé instance.)

### PR-5 — SC-18 idempotentní nonce — DB index ověření
```
db.chatmessages.getIndexes()
```
Ověřit existenci indexu `{ channelId:1, clientNonce:1 }` s `partialFilterExpression: { clientNonce: {$type: 'string'} }` a `unique: true`. Bez indexu je idempotence v kódu ale ne v DB.
