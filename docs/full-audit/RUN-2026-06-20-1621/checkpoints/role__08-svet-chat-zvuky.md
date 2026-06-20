# role / 08-svet-chat-zvuky — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem veškerý kód v záběru:
- BE: `chat.service.ts` (celý), `chat.controller.ts`, `chat.gateway.ts`, `app.gateway.ts`, `sounds.service.ts`, `sounds.controller.ts` (globální), `world-sounds.controller.ts`, `emotes.service.ts`, `emotes.controller.ts`, `emotes.gateway.ts`, `chat-feed.controller.ts`
- FE: `WorldChatRoom.tsx`, `ChannelView.tsx`, `ChannelComposer.tsx`, `SoundBroadcastButton.tsx`, `ChannelSidebar.tsx`, `SoundsPage.tsx`, `WorldEmotesAdminPage.tsx`, `EmoteCard.tsx`, `EmoteGrid.tsx`, `router.tsx` (zvuky/emote route)

Osy: `PA`, `ST`, `LK`, `PC`, `BY`, `EN`, `DD`, `OR`

## Dosažená L vs cílová L

- CH-01/02: ✅L2 — `hasChannelAccess` / `hasAccessGivenMembership` ověřeny staticky, logika sedí (`members`→whitelist+isWorldManager bypass, `all`→Hrac+, `role`→allowedRoles, `'public'` neexistuje — jen 3 módy)
- CH-03/04 (red-team): ⏭️ PROOF-REQUEST — nelze staticky
- CH-05: ✅L2 — `canManageChat` = GlobalAdmin || membership.role >= PomocnyPJ; GET groups prochází `assertCanViewWorldChat` (world-level brána) + per-channel filter; CREATE/UPDATE/DELETE/reorder volají `canManageChat`
- CH-06: ✅L2 — `assertWorldChannel` hází `CHAT_GLOBAL_NOT_SUPPORTED` pokud `!channel.worldId`
- CH-07: ✅L2 — FE `isManager = userRole >= PomocnyPJ` → `canManage` prop → podmíněné `+` tlačítko, GroupDialog, ChannelDialog
- CH-08: ✅L2 — `broadcastUnreadUpdate` používá `hasAccessGivenMembership` (stejná logika jako čtení); N-19 fix drží
- CH-09: ✅L2 — `syncLinkedChannelMembers` explicitně kontroluje `isStaff = membership.role >= PomocnyPJ`; N-20 fix drží
- CH-10: ⬜ L1 — staticky `world.membership.changed` event volá `syncLinkedChannelMembers` ihned; `world.membership.removed` taky; nezkoušeno živě
- CH-11: ✅L2 — `sound:play`/`sound:stop` berou `client.data.userId` (JWT handshake), volají `resolveChannelPresenceRole` → gate `< PomocnyPJ` return; N-9 fix drží; PomocnyPJ+ má `isWorldManager` bypass do `members` kanálů
- CH-12: ✅L2 — `assertCanManageWorld` (PomocnyPJ+, GlobalAdmin bypass) na POST/PUT/DELETE/import/nominate v `WorldSoundsController`; `assertIsAdmin` (GlobalAdmin) na globálním `SoundsController`
- CH-13: ✅L2 — FE `{canManage && <SoundBroadcastButton>}` kde `canManage = isManager = userRole >= PomocnyPJ`
- CH-14: ✅L2 — `assertIsMember` (member && role > Zadatel) pro GET emotes; `assertWorldCanManage` (PomocnyPJ+) pro CRUD
- CH-15: ✅L2 — world emote CRUD = `assertWorldCanManage` (PomocnyPJ+); global emote CRUD = `assertGlobalCanManage` (Admin+); router `ikaros/admin/emotes` = requireAuth + FE kontroluje `UserRole.Admin`
- CH-16: ⏭️ PROOF-REQUEST — red-team nelze staticky; staticky gate vypadá správně
- CH-17: ✅L2 — R-04 opraveno; `AppGateway.room:join` gatuje `chat:` prefix přes `canJoinChannelRoom` + JWT `client.data.userId`
- CH-18: ✅L2 — `chat:channel:join` (presence) bere `client.data.userId` (JWT), volá `resolveChannelPresenceRole`; neověřuje channel access, jen membership — ale presence je read-only WS stav, ne message leak
- CH-19: ✅L2 — `handleChannelCreated` emituje `{ worldId }` signál (bez metadata kanálu); W-4 fix drží

**Nový nález:** CH-12-read (viz R-RUN-01 níže)

## Nálezy

### R-RUN-01 — `GET /worlds/:worldId/sounds` bez membership checku 🔴🟡 (nízká-střední, LK)
- **Osa:** `LK` `ST`
- **Kde:** `world-sounds.controller.ts:37-42` (`@Get() findAll`) + `sounds.service.ts:52-54` (`findByWorld`) — obě bez membership/access check; třída `@UseGuards(JwtAuthGuard)` jen ověří login
- **Dopad:** Každý přihlášený uživatel (i nečlen světa) může GET `/worlds/:worldId/sound` a dostat celou zvukovou databázi světa (včetně názvů skladeb, YT URL). Srovnání: emoty mají `assertIsMember` (≥ Ctenar) na čtení, zvuky nemají nic. Nečlen nemá `worldId` v UI, ale zná-li ho (z jiného kanálu/sdíleného odkazu), seznam přečte. Závažnost: nízká (YT URL nejsou tajná), ale nekonzistentní s emoty a membership model.
- **Návrh:** Přidat `assertCanManageWorld` nebo `assertIsMember` ekvivalent na `GET` i `GET :id` ve `WorldSoundsController`. Konzistence se `EmotesController` (assertIsMember).
- **L1** (statické čtení)
- **Klasifikace:** 🆕

### R-RUN-02 — `resolveChannelPresenceRole` neověřuje channel access (CH-18 hraniční případ) ⚠️ (nízká, DD)
- **Osa:** `DD` `PC`
- **Kde:** `chat.gateway.ts:96-100` (`chat:channel:join` presence handler) — volá `resolveChannelPresenceRole` která vrátí world role, ale NEověří `hasChannelAccess` pro daný kanál
- **Dopad:** Uživatel bez přístupu ke kanálu (např. hráč u `accessMode:'members'` kanálu, kde není v `allowedMemberIds`) může emitovat `chat:channel:join` a přidat se do presence listu kanálu. PJ pak vidí v panelu „Přítomní" hráče, který kanál ve skutečnosti nečte. Netěče obsah zpráv (WS message room je za `canJoinChannelRoom` gate); je to jen presence metadata leak.
- **Míra:** Nízká — presence panel je PJ-only; hráč dostane prázdný presence výsledek; zprávy mu nedorazí. Ale existence persony v presence = existence leaku.
- **Návrh:** Přidat `hasChannelAccess` check před voláním `presence.join` — nebo přijmout jako by-design (presence = optimistický, message gate = autoritativní).
- **L1** (statické čtení)
- **Klasifikace:** 🆕

## Stav bodů plánu (celkový)

| # | Status | L |
|---|--------|---|
| CH-01 | ✅ ověřeno | L2 |
| CH-02 | ✅ ověřeno | L2 |
| CH-03 | ⏭️ PROOF-REQUEST | — |
| CH-04 | ⏭️ PROOF-REQUEST | — |
| CH-05 | ✅ ověřeno | L2 |
| CH-06 | ✅ ověřeno | L2 |
| CH-07 | ✅ ověřeno | L2 |
| CH-08 | ✅ ověřeno | L2 |
| CH-09 | ✅ ověřeno | L2 |
| CH-10 | ✅ L1 (event-driven, nezkoušeno živě) | L1 |
| CH-11 | ✅ ověřeno | L2 |
| CH-12 | 🐛 R-RUN-01 (read bez member check) | L1 |
| CH-13 | ✅ ověřeno | L2 |
| CH-14 | ✅ ověřeno | L2 |
| CH-15 | ✅ ověřeno | L2 |
| CH-16 | ⏭️ PROOF-REQUEST | — |
| CH-17 | ✅ ověřeno (R-04 opraveno) | L2 |
| CH-18 | ⚠️ R-RUN-02 (presence bez access gate) | L1 |
| CH-19 | ✅ ověřeno | L2 |

**Předchozí nálezy z registru (vlna 2):**
- R-04 (CH-17): ✅ opraveno a ověřeno (`canJoinChannelRoom` gate)
- „CH-01..19 bez díry": Potvrzuji pro většinu; nové nálezy R-RUN-01 a R-RUN-02 jsou nové (vlna 2 to minula).

## PROOF-REQUEST

### PR-1: Red-team CH-03 — hráč bez allowedMemberIds dostane 403 na `GET messages`
```
POST /worlds/:worldId/chat/groups/:groupId/channels  (PJ token, accessMode:'members', allowedMemberIds:[])
GET  /worlds/:worldId/chat/channels/:channelId/messages  (Hrac token)
→ očekáváno: 403 CHAT_FORBIDDEN
```
Dokazuje: `hasChannelAccess` members branch skutečně blokuje.

### PR-2: Red-team CH-04 — hráč pod prahem role kanálu dostane 403
```
PATCH /worlds/:worldId/chat/channels/:channelId (PJ token, accessMode:'role', allowedRoles:[WorldRole.PomocnyPJ])
POST  /worlds/:worldId/chat/channels/:channelId/messages (Hrac token)
→ očekáváno: 403 CHAT_FORBIDDEN
```
Dokazuje: `hasAccessGivenMembership` role branch blokuje.

### PR-3: Red-team CH-16 — hráč CRUD world emote dostane 403
```
POST /emotes/:worldId (Hrac token)
→ očekáváno: 403 NOT_WORLD_HELPER_PJ
DELETE /emotes/:worldId/:id (Hrac token)
→ očekáváno: 403
```
Dokazuje: `assertWorldCanManage` blokuje Hrace.

### PR-4: Red-team R-RUN-01 — nečlen čte zvuky světa
```
GET /worlds/:worldId/sounds (token = přihlášený uživatel, který NENÍ členem světa)
→ skutečné: 200 (chybí membership gate)
→ očekávané po opravě: 403
```
Dokazuje rozsah nálezu R-RUN-01.
