# Checkpoint — ws / 03-global-chat-gateway (GlobalChatGateway)

Datum: 2026-07-11 · Auditor: READ-ONLY · Styl: ws (prefix W-) · Registr: docs/ws-audit.md
Záběr: `backend/src/modules/global-chat/global-chat.{gateway,service,controller}.ts` +
FE `features/chat/**` (ChatRoom, useGlobalChat, usePresenceHeartbeat, useSavedGame, CampPage),
`features/voice/api/useVoicePresence.ts`, `features/chat/lib/types.ts`.

## Verdikt
**1 nový nález (🆕, 🟠 střední) — spoofing zobrazovaného jména registrovaného uživatele z payloadu.**
Zbytek oblasti drží: W-10 opraveno a ověřeno, GCH-13/GCH-19 dořešeny/kosmetické. Nové eventy od data
plánu (17.6 voice, 16.6 startHere, my-rooms) mají konzistentní FE↔BE kontrakt (L2).

---

## 🆕 W-12 (navrhované) — Global chat: presence username + whisper senderName registrovaného uživatele z klientského payloadu (🟠 střední, identity/impersonace)

**Osa:** `AU` · Sourozenec **W-3** (world chat, stejná třída — identita z payloadu). W-10 opravil `userId`
(→ join `user:{id}` z JWT), ALE **displayované jméno registrovaného uživatele zůstalo z payloadu.**

**Citace:**

`global-chat.gateway.ts:316-319` (a shodně `:351-353` v `handleRoomJoin`):
```ts
    // 15.8 — host: jméno anonym{N} z OVĚŘENÉHO tokenu, ne z payloadu (anti-spoof).
    const username = data.isGuest
      ? (data.anonName ?? payload.username)
      : payload.username;      // ← registrovaný: jméno z PAYLOADU, neověřené
```
→ uloží se do `PresenceRecord.username` (`registerPresence`, gateway.ts:518-525) a broadcastuje se v
`chat:presence { username, action:'join' }` (gateway.ts:557-564) + v systémové hlášce „X vchází/opouští"
(`presenceLine`, saveSystemMessage). Zobrazí se v seznamu PŘÍTOMNÍ (`getPresence` → REST `room-info`).

Whisper dědí tutéž payloadovou identitu:
`global-chat.gateway.ts:625,643-646` — `sender.username` → `sendWhisper(from.username=…)` →
`global-chat.service.ts:202-204`:
```ts
    // Hospoda i Voice krčma (17.6) = globální pokec pod účtem (ne postavou).
    if (room === 'hospoda' || room === 'voice-krcma') {
      return { senderName: username, senderAvatarUrl: avatarUrl };  // senderName = payload username
    }
```
→ `message.senderName` whisperu = útočníkem zvolené jméno; doručeno oběti přes
`chat.global.message.created` → `user:{visibleTo}` (gateway.ts:696-699).

**Symptom / dopad:** přihlášený uživatel pošle `chat:hospoda:join { username:'<cizí jméno>', userId:<vlastní JWT> }`
→ v Hospodě vystupuje pod cizím jménem v: (a) seznamu PŘÍTOMNÍ, (b) systémových hláškách vchází/opouští,
(c) **senderName whisperu** (soukromá zpráva „od" důvěryhodného jména = nejhorší, impersonace v DM).
`userId` je správně z JWT → **žádná eskalace práv ani leak cizích roomů** (to řeší W-10); jde čistě
o integritu **zobrazovaného jména**. Camp whispery většinou bezpečné (`senderName = characterName` z DB,
fallback na payload jen když uživatel nemá postavu). Veřejné zprávy přes REST `POST /messages` jsou v pořádku —
`sendMessage` bere `user.username` z JWT (`RequestUser`), ne z payloadu.

**Root cause:** `resolveSenderIdentity` si už načítá DB profil (`usersService.findById`, service.ts:190) kvůli
avataru, ALE pro Hospodu/Voice použije **předaný payload `username`** místo autoritativního `profile.username`
(User má `username`, user.interface.ts:61 — je k dispozici). Guest má anti-spoof (jméno z tokenu), registrovaný
uživatel — u kterého na reputaci nejvíc záleží — ne. Nekonzistence = spíš opomenutí než vědomé přijetí.

**Návrh:** presence username i whisper senderName pro Hospodu/Voice brát z ověřeného zdroje —
`profile.username` z `findById` (BE ho stejně načítá), NE z payloadu. Payloadové `username` smí sloužit
max. jako fallback při selhání lookupu. FE už reálné jméno posílá (ChatRoom:288-290/313-316), takže
změna je bez dopadu na legitimní klienty. Sladit s W-3.

**Úroveň:** L2 (přečteno obě strany, cesta doložena; bez round-trip testu). **Stav:** ⬜ navrženo.

---

## ♻️ Známé — potvrzeno opravené / dořešené (NEHLÁSIT jako nové)

- **W-10 (GCH-01) — OPRAVENO ✅.** `handleHospodaJoin`/`handleRoomJoin` nyní berou `userId` výhradně
  z `client.data.userId` (ověřený JWT handshake nastavený ChatGateway na sdíleném socketu); bez něj
  `return` (gateway.ts:310-315, 342-348). `client.join(\`user:${userId}\`)` (gateway.ts:533) tak joinuje
  vlastní room. `voice:*` handlery stejně (gateway.ts:387,409,421). Registr W-10 = ✅ opraveno — sedí.
- **GCH-13 (replyToId scope) — DOŘEŠENO (FIX-38).** `resolveReply` (service.ts:345-376) validuje
  `channelId` shodu, `isDeleted`, `isSystem` a **whisper `visibleTo` scope** (nelze „přeposlat" cizí šepot
  do veřejné zprávy). Doc měl ⚠️ — kód to řeší.
- **GCH-19 (environment in-memory reset) — kosmetické.** FE `useRoomEnvironment` (useGlobalChat.ts:150-157)
  refetchuje REST `GET .../environment` při mountu → po restartu BE dostane default konzistentně;
  cron rotace srovná lokaci. Známé ⚠️, bez dopadu.
- **W-7 třída (reconnect re-join) — pro global chat PŘÍTOMNO ✅.** ChatRoom `useSocketReconnect`
  (ChatRoom.tsx:283-300, „C-05") re-joinuje `room:join chat:{id}` + `chat:hospoda:join`/`chat:room:join`
  + invaliduje historii. Voice re-join taktéž (useVoicePresence.ts:59-61).

## Kontrakt nových eventů (od data plánu 2026-06-04) — L2 OK
- `chat:my-rooms` (RoomKey[]) → IkarosLayout.tsx:864 · `chat:room:startHere` ({room,startHere}) →
  useSavedGame.ts:96 · `chat:room:environment` ({room,style,placeId}) → CampPage.tsx:97 /
  useGlobalChat.ts · `chat:voice:presence` / `chat:voice:state` → useVoicePresence.ts:34/39.
  Payload tvary sedí s `features/chat/lib/types.ts` (EnvironmentEvent/StartHereEvent/VoiceRosterEvent/
  VoiceStateEvent). Voice roster/state broadcast do `chat:{channelId}` (ne per-user) — nese jen
  userId/username/avatar/muted/cam = necitlivé, OK.

## Nižší kandidát (nízká jistota, spíš by-design)
- **Reconnect = join/leave spam.** Po reálném reconnectu (nový `client.id`) je presence record pryč →
  `registerPresence` bere `alreadyInRoom=false` → broadcast `chat:presence action:'join'` + uloží systémovou
  hlášku „X vchází" (gateway.ts:553-575); starý socket předtím `handleDisconnect` → „leave". Síťový záškub
  mobilu tak generuje dvojici hlášek vchází/opouští + zápis do DB (1h TTL). Vychází z disconnect-based
  presence modelu (stejné jako world ChannelView) → pravděpodobně přijaté. Neescalováno na W-.

## Test coverage (pozn.)
- `global-chat.gateway.spec.ts` existuje (~35 t.). Doc chtěl ověřit test na spoofing `userId` (W-10 —
  přidán regresní test dle registru) a whisper-leak filtr. **Username-spoof (W-12) test chybí** — po opravě
  doplnit round-trip: join s cizím `username` → whisper → ověřit, že `senderName` je z DB profilu, ne payload.
