# checkpoint role / 03-svet-membership — RUN-2026-07-11-1213

STATUS: DONE (READ-ONLY, statika L1-L3)
Auditor: agent (full-audit sweep, oblast 03)

## Záběr přečten
- BE `worlds.service.ts` (2369 ř.) — VŠECHNY metody oblasti do plné hloubky:
  join/requestAccess/cancel/approve/reject + `assertCanModerateAccessRequests`,
  getMembers/enrichMembers, updateMemberRole/Group/Character/Akj/Free/MyTheme/MyPjAvatar,
  softDelete/restore/listDeleted, leave, transferOwnership, requestCharacter,
  assertMember/assertMembershipInWorld, canAdminWorld/canManageMembers/canEditWorldData,
  applyDetailScope, elevate/deElevate/getElevationStatus/enrichElevation, character listenery.
- BE `worlds.controller.ts` (593 ř.) — všechny @UseGuards + `assertMembershipInWorld` pre-checky.
- BE `worlds.gateway.ts` (154 ř.), `world-access-request.provider.ts` (113 ř.),
  `repositories/world-membership.repository.ts` (toEntity mapper), `dto/update-member.dto.ts`,
  `common/utils/world-elevation.ts` (`worldAdminBypass`).
- FE `WorldMembershipGuard.tsx`, `WorldLayout.tsx` (isPJ/isPJForNav/elevation/navBypass),
  `MembersTab.tsx`, `MemberRow.tsx`, `useWorldStatus.ts`, `ZpracovatTab.tsx`.

## Dosažená L vs cílová L
- Většina SM-01..22 + T-1..3 na **L2** (statické čtení obou stran + parita).
- Bezpečnostní osy (ES/OW/LK): cíl L3+, dosaženo **L2** (tento průchod READ-ONLY, žádný
  red-team/runtime; L3/L4 zůstává na PROOF-REQUEST níže).
- Ověřeno jako OPRAVENÉ oproti minulým vlnám (NEhlásím jako nové):
  - R-03/SM-10 strop role — přítomen `worlds.service.ts:1481-1506` + **FIX-20** (isGlobalAdmin už
    ceiling neobchází → známé SEC-27/bug06 N-3 pokryto). ✅L2
  - SEC-21/bug06 N-2 (updateMemberCharacter self-spoofing) — **FIX-18** ownership check
    `worlds.service.ts:1619-1635` (self-assign jen vlastní ne-NPC postava). ✅L2
  - SEC-26/R-RUN-1 (elevace nepokrývala governance) — **FIX-19** `worldAdminBypass` v
    `canAdminWorld:2230`, `assertCanModerateAccessRequests:1115`, `updateCalendarDefaults:1346`. ✅L2
  - R-01 (FE `role<=3`) — WorldLayout nyní `role<=UserRole.Admin` + elevation, žádný magický 3. ✅L2
  - N-18 assertMembershipInWorld na VŠECH membership endpointech; SM-11 `@IsIn([0..5])`;
    SM-05 private→404 (`applyDetailScope`); SM-15/R-19 owner self-leave→`WORLD_OWNER_CANNOT_LEAVE`;
    SM-16 transfer owner-only + RC-R3 rollback. ✅L2

---

## NÁLEZY

### R-RUN — [PC/LK] getMembers REST bez field-whitelistu → per-user privátní pole tečou všem co-členům 🆕 🟠
- **Osa:** `LK` `PC` (P2 path-consistency, P3 DD) · SM-14/matice „getMembers"
- **Kde:** `worlds.service.ts:1128-1139` (`getMembers` → `findByWorldId` → `enrichMembers`, žádné
  stripování polí) + mapper `repositories/world-membership.repository.ts:215-259` (`toEntity` vrací
  plný dokument). Endpoint `worlds.controller.ts:331-357` (`GET :id/members`, OptionalJwt → member+).
- **Úryvek (toEntity):** `themeUserOverrides`, `themeAdjust`, `currentSceneId`, `chatChannelOrder`,
  `chatLastActiveChannelId`, `chatPinnedOrder`, `chatExpandedGroups`, `chatGroupOrder`,
  `jailedDiceSkins`, `diceSkinMapping`, `readerFont*`, `akj` — vše se posílá v poli členů.
- **Dopad:** Každý člen (i Ctenar/Zadatel s membershipem) přes `GET /worlds/:id/members` čte
  **self-only stav** ostatních: `currentSceneId` = per-hráč přiřazení scény taktické mapy (game-state
  leak, tm_assignment), `chatChannelOrder`/`chatLastActiveChannelId`/`chatPinnedOrder` = **ID kanálů**
  člena (recon restricted channel ID cross-member), `akj` = clearance úroveň, + osobní motiv/skiny.
  **Path-consistency:** WS dveře (`worlds.gateway.ts:65-80 handleMembershipChanged`) byly VĚDOMĚ
  zhardnuté na leak-safe signál `{membershipId}` právě proto, že „membership nese per-user privátní
  data" — REST dveře ale vrací plný dokument. Jedny dveře ze dvou zamčené (WR-09-B kryl jen WS).
- **Návrh:** `toPublicMembers` whitelist (analogie `toPublicSettings:1210`) — u cizích členů ponech
  jen render-nutná pole (role, group, avatarUrl, characterPath, pjPersonaAvatarUrl, chatColor,
  chatFont/Size, username z enrich); self-only pole strip (nebo plná pole jen pro `m.userId===requester`
  a staff). N-7 kryl JEN guard (kdo smí list), ne field-scope.
- **Klasifikace:** 🆕 (N-7/WR-09-B se týkají guardu/WS, ne REST field-whitelistu) · **L1**

### R-RUN — [ES/OW] leave() bez owner-protection na kick path → PomocnyPJ vykopne VLASTNÍKA (owner-ghost svět) 🆕 🟠
- **Osa:** `ES` (vertikální) + integrita ownershipu · rozšiřuje známý R-RUN-02 (ten explicitně „ne-owner")
- **Kde:** `worlds.service.ts:1925-1975` (`leave`). Kick větev `:1938` jen `canManageMembers`
  (PomocnyPJ+); owner-ochrana `:1956` je `membership.userId === requester.id && world.ownerId ===
  requester.id` → platí **jen na SELF-leave vlastníka**, ne na kick cizího membershipu.
- **Úryvek:** `if (membership.userId === requester.id && world.ownerId === requester.id) throw
  WORLD_OWNER_CANNOT_LEAVE;` → PomocnyPJ volá `DELETE /worlds/:w/members/:ownerMembershipId`
  (owner = jiný userId) → gate nesepne → `membershipRepo.delete(ownerMembership)`.
- **Dopad:** Insider PomocnyPJ(4) smaže membership **vlastníka** světa. `world.ownerId` dál ukazuje na
  usera **bez membershipu** = owner-ghost: svět bez funkčního vlastníka (transferOwnership vyžaduje
  `ownerId===requester`, ale ten nemá membership → nemůže nic; nikdo nový nemůže převzít bez Admin
  restore). Závažnější než R-RUN-02 (kick co-PJ), stejný kořen = leave() nemá ceiling ani owner-guard.
  FE `MemberRow.tsx:54` (`removable = ... && membership.role !== PJ`) skrývá tlačítko, ale API drží.
- **Návrh:** V `leave()` na kick path: (a) zákaz smazat membership, kde `membership.userId ===
  world.ownerId` (kromě transferu); (b) role-ceiling jako R-03 (`membership.role < requesterRole`
  pro ne-ownera/ne-admina).
- **Klasifikace:** 🆕 (owner-kick facet; R-RUN-02 pokrýval jen co-PJ ne-owner) · **L2**

### R-RUN — [OR/LK] de-elevated platform Admin vidí VŠECHNY world access-requesty, ale approve → 403 (elevation drift) 🆕 🟡
- **Osa:** `OR` `LK` `BY` · SM-06/SM-08
- **Kde:** provider `world-access-request.provider.ts:103-112` (`scopeForUser`: `role===Admin/Sa` →
  `undefined` = **global scope**, bezpodmínečně, bez ohledu na elevaci) ↔ gate
  `worlds.service.ts:1107-1126` (`assertCanModerateAccessRequests`: approve/reject vyžaduje
  `worldAdminBypass` /owner/co-PJ → **de-elevated admin dostane 403**).
- **Dopad:** ZpracovatTab (`ZpracovatTab.tsx`) ukáže de-elevated adminovi VŠECHNY pending AR napříč
  všemi světy (worldName/slug + username/avatar žadatele), ale klik approve/reject → 403. (1) leak
  identit žadatelů + které světy mají pending join adminovi, který dle R-20 elevation modelu má být
  „mimo governance, dokud se nenahodí"; (2) parity: vidí, nemůže. Elevation rework (2026-06-21) zhardnul
  gate, ale provider scope zůstal owner/global bez elevace. (Pozn.: provider dostává jen `(userId,role)`,
  ne `elevatedWorldIds` → strukturálně dnes elevaci ani ověřit nemůže.)
- **Návrh:** provider pro admin scope respektovat elevaci (protáhnout `elevatedWorldIds`/dotaz na
  `elevationService`), nebo AR queue pro admina omezit na elevované světy; sjednotit s R-20 modelem.
- **Klasifikace:** 🆕 (elevation-model drift; 06-20 footnote ¹ byl pre-elevation, neregistrován jako R-xx) · **L2**

### R-RUN-01 — [OR] co-PJ (role=PJ, ne owner) AR moderaci SMÍ, ale v ZpracovatTabu ji nevidí ♻️ 🟡
- **Osa:** `OR` `PA` · SM-06/SM-08 — **ZNÁMÉ, STÁLE OTEVŘENÉ**
- **Kde:** gate `worlds.service.ts:1121` (`membership.role >= WorldRole.PJ` → smí) ↔ provider
  `world-access-request.provider.ts:110` (`findByOwnerId` → co-PJ scope prázdný) ↔ gateway
  `worlds.gateway.ts:102-105` (`world.access.requested` emit jen `user:{ownerId}`).
- **Dopad:** co-PJ (po transferu / více PJ) nedostane AR do fronty ani WS notifikaci; approve funguje jen
  s ručně dodaným requestId. Beze změny od 06-20/07-05. **L2**

### R-RUN-02 — [ES] leave() bez role-ceiling → PomocnyPJ kickne co-PJ (role=PJ, ne-owner) ♻️ 🟠
- **Osa:** `ES` · SM-15b — **ZNÁMÉ, STÁLE OTEVŘENÉ** (viz R-RUN owner-kick výše = jeho ostřejší facet)
- **Kde:** `worlds.service.ts:1938-1953` — kick path jen `canManageMembers`, žádný ceiling na cílový
  `membership.role`. **L2**

---

## Matice role × akce (verdikty L2; změny oproti 06-20 tučně)
| Akce | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ-non-owner | owner | Admin(de-elev) | Admin(elev) |
|------|-------|---------|--------|------|----------|-----------|--------------|-------|----------------|-------------|
| GET private svět | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(shell) | ✅ |
| moderovat AR | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅(nevidí¹) | ✅ | ⛔(vidí queue²) | ✅ |
| změnit roli člena | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅⁺ | ✅ | ✅ | ⛔ | ✅ |
| kick člena ≥ vlastní role | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | 🐛³ | 🐛³ | ✅ | ⛔ | ✅ |
| **kick VLASTNÍKA** | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | **🐛⁴** | **🐛⁴** | — | ⛔ | ✅? |
| číst plný membership (self-pole cizích) | 🚫 | **🐛⁵** | **🐛⁵** | **🐛⁵** | 🐛⁵ | ✅ | ✅ | ✅ | ✅ | ✅ |
| transfer ownership | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| soft-delete svět | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ⛔ | ✅ |

`¹` R-RUN-01 (BE smí, FE queue prázdná). `²` R-RUN nový (vidí all AR, approve→403). `³` R-RUN-02.
`⁴` R-RUN owner-kick (nový). `⁵` R-RUN getMembers field-leak (nový). `⁺` PomocnyPJ se stropem (R-03).

## PROOF-REQUEST
- **PR-1 (M8, getMembers leak):** jako Ctenar `GET /worlds/:id/members` → assert, že response NEobsahuje
  `currentSceneId`/`chatChannelOrder`/`themeUserOverrides` cizích členů. Dnes je obsahuje → nález reálný. L4.
- **PR-2 (M8, owner-kick):** PomocnyPJ `DELETE /worlds/:w/members/:ownerMembershipId` → očekáváme 400
  (owner nelze kicknout), dnes 200 + owner-ghost. L4.
- **PR-3 (M8, de-elev admin AR):** de-elevated Admin `GET /pending-actions?type=world_access_request`
  → dnes vidí all; `POST approve` → 403. Potvrzuje R-RUN drift. L4.
- **PR-4 (M8, R-RUN-02):** PomocnyPJ kick co-PJ (role=PJ ne-owner) → 200 (má být 403). L4.

## Pokrytí
SM-01..22 + T-1..3 + F-matice: kompletně čteno (BE+FE), L2. Nové nálezy 3× 🆕 (1× 🟠 leak getMembers,
1× 🟠 owner-kick, 1× 🟡 elevation-AR drift), 2× ♻️ známé stále otevřené (R-RUN-01, R-RUN-02).
Fixed od minule ověřeno: R-03/FIX-20, FIX-18, FIX-19/SEC-26, R-01.
