# Checkpoint — role/08 Svět: chat / zvuky / emoty

**RUN:** RUN-2026-07-11-1213 · **styl:** role (registr `docs/role-audit.md`, prefix R-)
**Oblast:** `docs/role-plan/08-svet-chat-zvuky.md`
**Dosažená L:** L2 (statika M1 + kontrakt M4 pro prahy/enum; testy odkázány, nespuštěny)
**Cílová L:** role body L2+, bezpečnost (ES/OW/LK) L3+, kritické hranice M8→L4

---

## Záběr (přečteno do plné statické hloubky L1–L3)

BE (kanonický `Projekt-ikaros/backend`):
- `modules/chat/chat.service.ts` (celých 2449 ř. — všechny permission helpery + M-metody)
- `modules/chat/chat.controller.ts`, `chat-feed.controller.ts`, `scheduled-messages.controller.ts`, `scheduled-messages.job.ts`
- `modules/chat/chat.gateway.ts` (presence, sound:play/stop, message/channel/group/unread eventy)
- `gateways/app.gateway.ts` (`room:join` R-04 gate)
- `modules/sounds/sounds.service.ts` + `sounds.controller.ts` + `world-sounds.controller.ts`
- `modules/emotes/emotes.service.ts` + `emotes.controller.ts`

FE: `features/world/chat/components/WorldChatRoom.tsx` (`isManager`), `SoundBroadcastButton.tsx` + `ChannelComposer.tsx` (gating), grep parity.

Nedočteno do L3 (reziduum L1): `chat-presence.service.ts` (jen in-memory presence store — identita/role gate žije v gateway+service, pokryto), chat DTO (accessMode enum — okrajové).

---

## Nálezy

### 🆕 R-RUN — [PA/DD/PC] ScheduledMessagesController.create bez access gate
- **Kde:** `backend/src/modules/chat/scheduled-messages.controller.ts:48-83` (`@Post()` create) — `@UseGuards(JwtAuthGuard)` (jen login), pak `repo.create({ worldId (z route), channelId (z DTO), ownerId... })`. **Žádný** membership gate světa, **žádný** `hasChannelAccess(dto.channelId)`, **ani** kontrola, že `channelId` patří do `worldId`.
- **Úryvek:** validuje jen `sendAt` v budoucnu + neprázdný obsah + `assertAttachmentsOrigin`; přímo `this.repo.create(...)`.
- **Dopad:** jakýkoli přihlášený uživatel (i nečlen světa) založí pending „scheduled" zprávu do LIBOVOLNÉHO (worldId, channelId) — vč. neexistujícího kanálu. Reálný chat-inject je **blokován při odeslání**: `ScheduledMessagesJob.sendDue` (`scheduled-messages.job.ts:29`) odesílá přes `ChatService.sendMessage`, které vynucuje `hasChannelAccess` (`chat.service.ts:1245`) → při chybějícím přístupu ForbiddenException → status `failed`. Zbývá tedy **storage/DoS abuse** (junk pending záznamy do cizích světů/kanálů) + chybějící fail-fast. Confidentiality/integrity kanálů drží send-time gate.
- **Osa:** `PA` (create není gated jako send) · `DD` (zámek jen na jedné vrstvě — send, ne create) · `PC` (dvoje dveře do kanálu, jen jedny zamčené).
- **Návrh:** v `create` doplnit `chatService`-mirror gate PŘED `repo.create`: (a) membership světa, (b) `hasChannelAccess(dto.channelId, user.id)`, (c) `channel.worldId === worldId`. Fail-fast + zamezí junk záznamům. `findMine` (ownerId filtr) i `cancel` (`ownerId || worldAdminBypass`, `:98-106`) jsou OK.
- **Závažnost:** 🟡 nízká (mitigováno send-time revalidací). **L2.**

### 🆕 R-RUN — [OR/PA] Unread bez manager bypassu → PJ nedostane badge na soukromé character konverzaci
- **Kde:** `chat.service.ts:1766-1768` (`getUnreadCounts`) a `:1808` (`broadcastUnreadUpdate`) filtrují přes `hasAccessGivenMembership` (bez manager bypassu), zatímco `getGroupsWithChannels` (`:278`) a `hasChannelAccess` (`:153`) PJ+/elevated pustí do `members`/character kanálů přes `isWorldManagerByUserId`.
- **Dopad:** PJ/PomocnyPJ (a elevated Admin), který NENÍ v `allowedMemberIds` soukromé character konverzace (`ensureCharacterChannel` dává `allowedMemberIds:[userId]` jen hráče), ji **vidí v sidebaru**, ale nedostane unread count ani živý `chat:unread` bump. Over-restrikce / UX nekonzistence; **žádný leak** (směr je „PJ dostane míň").
- **Osa:** `OR` `PA`. **Návrh:** sjednotit unread access s `getGroupsWithChannels` (manager → count všech kanálů světa), nebo vědomě přijmout jako UX dluh.
- **Závažnost:** ⚪/🟡 nízká. **L2.**

### 🆕 R-RUN — [BY] WS sound/presence gate ignoruje elevaci admina (nekonzistence bypassu)
- **Kde:** `chat.gateway.ts:215` (`sound:play`), `:236` (`sound:stop`), `handleChannelJoin:111` a `getChannelPresence` → `chat.service.ts:977` `resolveChannelPresenceRole` vrací `null`, když `membership` chybí (`:987`). Naproti tomu `canManageChat` (`:115`) obchází přes `worldAdminBypass`.
- **Dopad:** elevated platform Admin BEZ world membershipu nepustí zvuk / neseeduje presence, i když jinde v chatu má manager bypass. Nekonzistence elevačního modelu vůči WS sound gate. Extrémně okrajové (admin obvykle není účastník jeskyně).
- **Osa:** `BY`. **Závažnost:** ⚪ kosmetika. **L2.**

---

## Potvrzeno bez nové díry (známé R-xx / delta parity — NEhlásím jako nové)

- **CH-08 / N-19 (♻️ ✅L2):** `broadcastUnreadUpdate` (`:1808`) i `getUnreadCounts` (`:1767`) filtrují `hasAccessGivenMembership` — Čtenář bez přístupu nedostane badge. Drží.
- **CH-09 / N-20 (♻️ ✅L2):** `syncLinkedChannelMembers` (`:2202-2244`) — `isStaff = role>=PomocnyPJ`, `shouldHave = isStaff || linkedWorldGroup===currentGroup` → PomocnyPJ s `group=null` NEodebrán z linked `members` kanálu. Drží.
- **CH-11 / N-9 (♻️ ✅L2):** `sound:play/stop` identita z `client.data.userId` (ověřený JWT handshake, `chat.gateway.ts:49-57`), gate `worldRole < PomocnyPJ → return`. Spoof userId nemožný.
- **CH-17/18 / R-04 (♻️ ✅L2):** `app.gateway.ts:37-43` `room:join chat:{id}` → `canJoinChannelRoom` (`chat.service.ts:178`) vynucuje `hasChannelAccess` pro world kanály; `!userId` blok PŘED world/global větví (FIX-1B). `user:` room self-only (`:48-53`).
- **CH-19 / W-4 (♻️ ✅):** `chat.gateway.ts:307-337, 371-419` — channel/group created/updated/reordered emitují leak-safe `{worldId}` signál, ne metadata skrytého kanálu.
- **CH-05/06/07 (♻️ ✅L2):** `canManageChat` (`:111`, GlobalAdmin-bypass || role>=PomocnyPJ) gatuje create/update/delete/reorder skupin i kanálů; `assertWorldChannel` (`:101`) odmítne globální kanál. FE `isManager` (`WorldChatRoom.tsx:67`) = `world.elevated || role>=PomocnyPJ` → `canManage` gate na tlačítka = parita.
- **CH-12 (♻️ ✅L2):** sounds — `assertCanManageWorld` (PomocnyPJ+) na world CRUD, `assertIsAdmin` (role<=Admin) na global; `assertIsMember` na read (R-RUN-01 z minulého běhu). Controllery volají asserty před každou akcí.
- **CH-13 (♻️ ✅):** FE `SoundBroadcastButton` gated `canManage` (PomocnyPJ+), BE `sound:play` PomocnyPJ+ = parita (komentáře „jen PJ" = volné názvosloví, ne práh PJ(5)).
- **CH-14/15/16 (♻️ ✅L2):** emotes — `assertIsMember` (role!==Zadatel → Ctenar+ použije emote), `assertWorldCanManage` (PomocnyPJ+ world CRUD), `assertGlobalCanManage` (role<=Admin global). `copy` ověří manage NA OBOU světech (`emotes.controller.ts:158-160`).
- **CH-01/03/04 (♻️ ✅L2):** `hasChannelAccess` (`:143`) — `members`→allowedMemberIds (+ manager), jinak `hasAccessGivenMembership` (`:188`): Zadatel→false, `all`→Hrac+, jinak allowedRoles. REST getMessages/sendMessage/getChannelPresence/markAsRead/toggleReaction všechny gatují `hasChannelAccess`.

## Doc-only (kód OK, plán/matice nepřesné) — známé

- **C08-1 (♻️):** matice ř.81 „číst veřejný kanál Ctenar ✅", ale `accessMode:'all'` vyžaduje `role>=Hrac` (`:198`) → Ctenar nevidí globální kanál. Už zaevidováno jako doc fix v registru (ř.121). Nehlásím znovu.

---

## Pokrytí matice (G)

Řádky matice ověřeny proti kódu: číst veřejný/`members`/`role` kanál ✅ (`hasChannelAccess`), unread badge bez přístupu ⛔ ✅ (N-19), create/edit kanál PomocnyPJ+ ✅, `sound:play` PomocnyPJ+ ✅, použít emote Ctenar+ ✅, CRUD world emote/sound PomocnyPJ+ ✅, CRUD global emote/sound Admin+ ✅. Žádná buňka nezůstala ⬜ (autoritativní BE strana).

## PROOF-REQUESTy (pro +proof vrstvu / M7/M8)

1. **M8 red-team scheduled create:** nečlen světa `POST /worlds/{cizí}/chat/scheduled {channelId: restricted}` → dnes 201 (pending); ověřit, že job dá `failed` (ne odešle). Po fixu: create sám 403.
2. **M7 gap-fill:** členská matice `getUnreadCounts` × `members`/character kanál — PJ ne-v-allowedMemberIds: doložit chování (badge chybí) + rozhodnout záměr/oprava.
3. **M8 room:join chat leak (regrese R-04):** hráč mimo `allowedMemberIds` `room:join chat:{id}` → `{error}` (nedostane `chat:message`). Round-trip.
