# role / 03-svet-membership — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20 · Auditor: agent (full-audit sweep)

---

## Pokrytí

Prošel jsem kompletní kód:

**BE:**
- `worlds.service.ts` (2088 ř.) — všechny metody oblasti: `joinPublic`, `requestAccess`, `cancelAccessRequest`, `approveAccessRequest`, `rejectAccessRequest`, `assertCanModerateAccessRequests`, `getMembers`, `leave`, `softDelete`, `restore`, `listDeleted`, `updateMemberRole`, `updateMemberAkj`, `updateMemberGroup`, `updateMemberFree`, `updateMemberCharacter`, `updateMyTheme`, `updateMyPjAvatar`, `transferOwnership`, `requestCharacter`, `assertMember`, `assertMembershipInWorld`, `canAdminWorld`, `canManageMembers`, `applyDetailScope`
- `worlds.controller.ts` (562 ř.) — všechny guardy, @UseGuards, assertMembershipInWorld pre-checky
- `worlds.gateway.ts` (143 ř.) — WS eventy membership
- `world-access-request.provider.ts` (113 ř.) — scopeForUser, canHandle
- `dto/update-member.dto.ts` — `@IsIn([0,1,2,3,4,5])` validace

**FE:**
- `WorldMembershipGuard.tsx` — minWorldRole, fallbackGlobalRoles, redirectTo
- `WorldLayout.tsx` — isPJ, isPJForNav, userRole v ctxValue, WS membership invalidation
- `MembersTab.tsx` + `MemberRow.tsx` — viewerRole gate, editable/removable, roleOptions
- `WorldMembersPage.tsx` — isWorldPlayer filtr (Zadatel excluded)
- `JoinCTA.tsx` — accessMode varianty
- `WorldAccessRequestRenderer.tsx` + `ZpracovatTab.tsx` — approve/reject UI
- `useWorldStatus.ts` — member/pending-access/non-member stav
- `useWorldSocket.ts` — WS invalidace membership po změně
- `useWorldAccessSocket.ts` — WS eventy access-requested/approved/rejected/cancelled

---

## Dosažená L vs cílová L

| Bod | Cílová L | Dosaženo | Poznámka |
|-----|----------|----------|----------|
| SM-01 join accessMode guard | L2 | **L2** | BE: public→Ctenar, closed→403, other→400; FE: JoinCTA dle accessMode |
| SM-02 access-request consistency | L1 | **L2** | BE + FE parita dle accessMode |
| SM-03 duplicity 409 | L2 | **L2** | existing membership + pending AR |
| SM-04 FE WorldStatus | L2 | **L2** | useWorldStatus: member/pending-access/non-member |
| SM-05 private → 404 | L2 | **L2** | applyDetailScope: NotFoundException (not 403) |
| SM-06 AR moderace scope | L2 | **L2** | assertCanModerateAccessRequests: owner OR co-PJ |
| SM-07 cross-world AR | L2 | **L2** | `ar.worldId !== worldId` → 404 |
| SM-08 AR moderace FE parity | L2 | **🐛 R-RUN-01** | scopeForUser = owner-only → co-PJ nevidí AR v ZpracovatTabu |
| SM-09 role change Hrac→403 | L2 | **L2** | canManageMembers: PomocnyPJ+ |
| SM-10 strop role eskalace | L3 | **L3** | R-03 opraveno: strop v updateMemberRole + 3 testy |
| SM-11 role enum mimo rozsah | L2 | **L2** | @IsIn([0,1,2,3,4,5]) |
| SM-12 cizí membershipId | L2 | **L2** | assertMembershipInWorld N-18 (controller pre-check) |
| SM-13 AKJ Hrac nesmí měnit | L2 | **L2** | updateMemberAkj: canManageMembers |
| SM-14 MembersTab PomocnyPJ+ UI | L2 | **L2** | viewerRole gate |
| SM-15 owner nesmí self-leave | L2 | **L2** | 400 WORLD_OWNER_CANNOT_LEAVE |
| SM-15b kick PJ (ne owner) | L2 | **🐛 R-RUN-02** | leave() bez role-ceiling pro cílový membership |
| SM-16 transfer non-owner → 403 | L2 | **L2** | isOwner check, non-owner → 403 |
| SM-17 softDelete PomocnyPJ→403 | L2 | **L2** | canAdminWorld: jen PJ+ |
| SM-18 ownership ≠ role PJ | L2 | **L2** | transferOwnership owner-only, role PJ nestačí |
| SM-19 Zadatel assertMember | L2 | **L2** | assertMember: role < Hrac → 403 |
| SM-20 FE Zadatel dashboard | L1 | **L1** | status='member' pro Zadatel (by-design N-17) |
| SM-21 request-character flow | L2 | **L2** | Ctenar→Zadatel, Hrac+→400, non-member→404 |
| SM-22 Zadatel v adresáři | L2 | **L2** | isWorldPlayer filtr + FE WorldMembersPage |
| T-1 stale isPJ po transferu | L2 | **L2** | world.updated WS → invalidate ['worlds'] → ctxValue |
| T-2 promote live propagace | L1 | **L1** | membership:changed WS → ['worlds','my'] invalidation |
| T-3 demote cizího 403 | L1 | **L1** | BE drží 403; FE toast/refetch závisí na konzumentovi |

---

## Nálezy

### R-RUN-01 — AR moderace: co-PJ nevidí žádosti v ZpracovatTabu (FE over-restrikce) 🟡
- **Osa:** `OR` `PA` (SM-06/SM-08)
- **Kde:**
  - BE service `worlds.service.ts:901-910` — `assertCanModerateAccessRequests`: owner OR co-PJ (role >= PJ v daném světě) SMÍ approve/reject
  - BE provider `world-access-request.provider.ts:103-112` — `scopeForUser`: vrací jen `worldsRepo.findByOwnerId(userId)` → co-PJ (člen s rolí PJ, ale není `world.ownerId`) má prázdný scope → ZpracovatTab mu nezobrazí žádné AR
  - Gateway `worlds.gateway.ts:87-92` — `world:access-requested` → emit jen do `user:{ownerId}` → co-PJ nedostane WS notifikaci o nové žádosti
- **Dopad:** Co-PJ (neprvní PJ, viz transferOwnership) SMÍ approve/reject dle BE, ale FE mu AR nikdy neukáže ani neoznámí. Musí znát requestId (přes jiný kanál) nebo refresh. UX bloker pro multi-PJ světy.
- **Návrh:**
  1. `scopeForUser` rozšířit: kromě `findByOwnerId` přidat světy, kde user má membership s `role >= WorldRole.PJ`
  2. Gateway `handleAccessRequested` emitovat i do `user:{coJPId}` pro všechny co-PJ daného světa
- **Klasifikace:** 🆕 (nový nález, dosud neregistrován)
- **L1** (čtení kódu); dynamicky neověřeno

---

### R-RUN-02 — `leave()` bez role-ceiling → PomocnyPJ/PJ může kicknout co-PJ (ne-owner) 🟠
- **Osa:** `ES` (vertikální eskalace), sousedí s R-03
- **Kde:**
  - BE service `worlds.service.ts:1660-1683` — `leave()`: pokud `membership.userId !== requester.id` → jen `canManageMembers` (PomocnyPJ+). Chybí kontrola, že **cílový** membership.role < requester membership.role
  - R-03 fix v `updateMemberRole:1265-1272` přidal strop `role >= requesterRole || membership.role >= requesterRole` → ale analogický strop v `leave()` chybí
  - FE `MemberRow.tsx:54` — `removable = editable && membership.role !== WorldRole.PJ` → blokuje kick PJ přes UI
- **Konkrétní scénář:** PomocnyPJ(4) volá `DELETE /worlds/:wId/members/:pjMembershipId` (kde cíl má role=5, ale `world.ownerId !== cíl.userId` = co-PJ). BE povolí, co-PJ vyhozen ze světa.
- **Dopad:** Insider útok — PomocnyPJ nebo nižší PJ může odebrat co-PJ, kter[...] zvýšil (R-03 blokuje povýšení, ale kicknutí ne). Blast radius = jeden svět, vyžaduje PomocnyPJ membership.
- **Návrh:** V `leave()` doplnit kontrolu analogicky R-03: pokud requester není owner ani GlobalAdmin, cílový `membership.role < requesterMembership.role` (nelze kicknout rovného ani výše postaveného).
- **Klasifikace:** 🆕 (nový nález)
- **L2** (strukturálně ověřeno: guard kód + analogie R-03)

---

### Ověřeno bez díry (výběr)

- **SM-01** `joinPublic`: closed→403 WORLD_CLOSED, non-public→400 WORLD_NOT_PUBLIC, public→Ctenar; existing member→409; existing AR→409 ✅L2
- **SM-05** `applyDetailScope`: private+anon→404; private+non-member+no-AR→404; private+AR-holder→pass ✅L2
- **SM-10** R-03 strop: `role >= requesterRole || membership.role >= requesterRole` + owner immutable ✅L3 (3 testy)
- **SM-11** `@IsIn([0,1,2,3,4,5])` DTO → role=99/-1→400 ✅L2
- **SM-12** `assertMembershipInWorld`: `membership.worldId !== worldId` → 404 ✅L2
- **SM-16** `transferOwnership`: `isOwner=false`→403 FORBIDDEN ✅L2
- **SM-17** `softDelete`: `canAdminWorld` = jen PJ membership (5+); PomocnyPJ(4)→false ✅L2
- **SM-22** `isWorldPlayer`: explicitní `role === Zadatel → false` ✅L2
- **T-1** `world:updated` WS → `invalidateQueries(['worlds'])` → ctxValue `userRole` refetch ✅L2

---

## PROOF-REQUEST

### PR-1 — SM-08 / R-RUN-01: co-PJ scope runtime ověření (M8)
- **Co spustit:** Jest test nebo ruční request: (1) svět s owner=A, co-PJ=B (role=5, není owner), (2) requester=C pošle AR; (3) GET `/pending-actions?type=world_access_request` jako B → měl by vidět AR ale nedostane nic (scope=empty); (4) POST approve s `requestId` + `worldId` jako B → BE 200 OK (assertCanModerateAccessRequests projde)
- **Co dokáže:** Potvrdí, že FE UX je blokovaný (prázdný Zpracovat) ale BE approve projde → R-RUN-01 = reálný

### PR-2 — SM-15b / R-RUN-02: kick co-PJ runtime ověření (M8)
- **Co spustit:** `DELETE /api/worlds/:worldId/members/:coPjMembershipId` jako PomocnyPJ (kde cíl je role=PJ, není owner) → očekáváme 403, dostaneme 200
- **Co dokáže:** Prokáže, že leave() nemá role-ceiling → R-RUN-02 = reálný (L4 potvrzení)

### PR-3 — T-2 live propagace membership role (M5)
- **Co spustit:** Živý test: PJ povýší hráče na PomocnyPJ; nový PomocnyPJ v jeho prohlížeči dostane PJ nav-items bez reloadu (WS `world:membership:changed` → invalidate `['worlds','my']`)
- **Co dokáže:** Ověří real-time T-2 (over-restrikce nebo OK)

---

## Matice role × akce — verdikty (L2 dosaženo)

| Akce | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ-non-owner | owner(PJ) | Admin/SA |
|------|-------|---------|--------|------|----------|-----------|--------------|-----------|----------|
| GET private svět | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST join (public) | 🔒 | ⛔ | — | — | — | — | — | — | ✅ |
| POST access-request (open/private) | 🔒 | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| approve/reject AR | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ⚠️¹ |
| změnit roli člena | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅⁺ | ✅ | ✅ | ⛔² |
| změnit AKJ | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ⛔² |
| odejít ze světa | 🔒 | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ⛔ | — |
| kicknout člena ≥ vlastní role | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | 🐛⁴ | 🐛⁴ | ✅ | ⛔² |
| transfer ownership | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔² |
| soft-delete svět | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ⛔² |
| restore world | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |

`¹` Admin vidí AR v provideru (scope=global), ale `assertCanModerateAccessRequests` vrátí 403 (není owner ani co-PJ) → **Admin vidí AR v UI ale nemůže schválit** ⚠️ nízká inkonzistence (provider scope vs BE gate).
`²` Admin/SA — governance R-20: canAdminWorld bez membership → false → 403.
`⁺` PomocnyPJ se stropem: nesmí udělit roli >= své vlastní.
`⁴` R-RUN-02: BE nemá role-ceiling v leave() → FE blokuje UI ale API call projde.
