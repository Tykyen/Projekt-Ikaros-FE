# bug 06 — Svět: základ, členové, nastavení · dosažená L2 (statika+kontrakt), cílová L3

Styl **bug** (registr `docs/bug-audit.md`, prefix N-). READ-ONLY. Oblast prošla už 3 koly
bug-huntingu (N-15..N-18) + plným auditem 2026-06-20 (FIX-17..22, N-07/09, R-RUN-01/W-RUN-01
leak-safe gateway payloady). Naprostá většina SZ-01..65 reflektuje už zapracované opravy.

## Nové nálezy

### N-RUN-06-01 🆕 🟠 — [A. Vytvoření & slug] Alokace slugu ignoruje `previousSlugs` → hijack starých URL cizího světa
- **Kde:**
  - `backend/src/modules/worlds/repositories/worlds.repository.ts:79-106` `renameSlug` — collision check jen `findOne({ slug: newLower, _id: { $ne: worldId } })`; `previousSlugs` jiných světů NEkontroluje.
  - `…/worlds.repository.ts:35-40` `existsBySlug` (volá `create()` :479 + `isSlugAvailable()` :445) — countuje jen pole `slug`, ne `previousSlugs`.
  - `…/schemas/world.schema.ts:9,96` — `unique` je jen na `slug`; `previousSlugs` má obyč. index (bez unikátnosti/cross-fieldu).
- **Rozpor s kontraktem:** `worlds.service.ts:722-725` docstring renameSlug + plán SZ-09 tvrdí „unique mezi `worlds` (i mezi `previousSlugs` jiných světů)". Kód to nevynucuje.
- **Dopad:** Svět B se přejmenuje `dragon-realm`→`dragon-kingdom` (previousSlugs=["dragon-realm"]). Svět A pak vezme slug `dragon-realm` (create i rename projdou). `findByCurrentOrPreviousSlug('dragon-realm')` → `findBySlug` matchne A první → staré bookmarky/odkazy B na `/svet/dragon-realm` tiše vedou na CIZÍ svět A (redirect-hijack + mrtvý redirect B). FE live-check (SZ-07/15) hlásí previousSlug jako „volný" → konzistentní díra.
- **Návrh:** collision check v `renameSlug` + `existsBySlug`/`isSlugAvailable` rozšířit na `$or:[{slug},{previousSlugs}]`; ideálně i partial unique index. (Nízko-střední, čistě BE repo.)
- **Klasifikace:** 🆕 — v registru ani dluhy.md není (N-38 je slug PAGE, jiná doména). L2.

### N-RUN-06-02 🆕 🟡 — [B. Membership] `transferOwnership` není transakční (mimo TOCTOU rollback)
- **Kde:** `backend/src/modules/worlds/worlds.service.ts:2096-2190` — sekvence: promote newOwner→PJ (:2132) · demote oldOwner→PomocnyPJ (:2143) · `worldsRepo.update ownerId` (:2148). Rollback existuje JEN pro TOCTOU „newOwner mezitím opustil svět" (:2164-2182); selhání DB mezi promote a update ownerId nemá kompenzaci.
- **Dopad:** Pád po promote/demote, ale před/při zápisu `ownerId` → svět má 2× PJ (nebo starého ownera jako PomocnyPJ) při nezměněném `ownerId`. Nízké (replSet stabilní), ale nekonzistentní invariant „1 owner = 1 PJ".
- **Návrh:** obalit celý transfer `session.withTransaction` (fallback jako `approveAccessRequest` D-061), NEBO přeuspořádat: zapsat `ownerId` první, role po. Stejná třída jako **D-R-AUDIT-CREATE-TX** (dluhy.md) a ext-43 durability.
- **Klasifikace:** 🆕 (konkrétní místo), ale ♻️ třídou (durabilita) — kryje ext-43 styl. L1.

## Známé, NEhlásím jako nové
- **D-R-AUDIT-CREATE-TX** (dluhy.md:76) — `create()` :449-563 netransakční seed řetěz. Beze změny.
- **ext-41 checkpoint** — `world-news.repository.ts:79` offset-paginace `sort({date:-1})` (date = STRING) bez `_id` tiebreaku → duplicity/skip na hranici stran. Už seed v ext-41 (RUN).
- **N-07** (members leak) ✅ — `worlds.controller.ts:331` OptionalJwtAuthGuard + service `getMembers` :1136 `findByIdForRequester` (private→404). Ověřeno.
- **N-15** ✅ — transfer už neemituje `world.membership.changed` (:2185 komentář); jen `world.updated`.
- **N-16** ✅ — `WorldLayout.tsx:369` isPJ zahrnuje `membership.role >= PomocnyPJ`.
- **N-18** ✅ — `assertMembershipInWorld` (service :1443) volán v controlleru u leave/role/group/character/akj/free.

## Spec-drift v plánu (NE kódový bug — bug-plan text zastaralý vůči záměrné opravě)
- SZ-43: plán říká Korektor vidí tab „Vzhled"; kód (`WorldSettingsPage.tsx:203`) ho záměrně posunul na PomocnyPJ+ (sdílený motiv = brand světa; BE `update()` :628-640 to vynucuje `canManageMembers`). Konzistentní BE+FE.
- SZ-37: `assertMember` (:2212) blokuje `< Hrac` (tj. i Ctenar), plán zmiňuje jen Zadatel. Moot — diary-schema-versions endpointy konzumuje jen PJ-only `WorldDiarySchemaEditorPage` (FE `useDiarySchema.ts`).
- SZ-49: `WorldMembersPage` je „hráči" adresář (`isWorldPlayer`: postava NEBO Korektor+), ne jen „Zadatel skryt".

## Co jsem prošel (plná hloubka L1, kontrakt L2)
- BE worlds: controller (593 ř., všechny guardy/DTO), service (2369 ř., celá — create/update/slug/join/access-request approve+reject+cancel/members/settings/akj/calendar-defaults/role+group+character+akj+free/theme/pj-avatar/softDelete+restore+listDeleted/leave/transfer/diary-schema-versions/canAdmin+canManage+canEdit/character event listenery/owner-hardDeleted), gateway (154 ř. — leak-safe emity, JWT handleConnection), repos worlds + world-membership (updateRoleIfChanged atomic ✓) + schema/indexy.
- BE universe: gateway (signál bez mapy ✓ SZ-63), service (visibility filtr + assertCanView/Manage), controller (guardy).
- BE world-news: service (463 ř. — scope gate FIX-22, assertCanWrite, immutable worldId, moderation), controller (toPublic strip createdBy ✓ SZ-56), repository (buildFilter FIX-22b).
- FE: WorldLayout, WorldContext, useWorldStatus, useWorldAccessSocket (SZ-64), useWorldSocket, worldNavConfig (buildFullWorldNav/hidden/essential SZ-59), useWorlds (useWorld ObjectId vs slug SZ-16), WorldMembershipGuard (SZ-33/34), WorldSettingsPage (tab gating SZ-43), WorldNewsPage (SZ-57/58), WorldMembersPage+isWorldPlayer (SZ-49/50), MembershipTab (SZ-27/28), update-member DTO (@IsIn 0-5 SZ-31), ThemeTab (null bg SZ-47).

## PROOF-REQUESTy
- **P1 (N-RUN-06-01):** e2e/jest — rename světa B slug→jiný (previousSlug X), pak `POST /worlds` NEBO `PATCH /worlds/:idA/slug` s X → dnes projde; assert že MÁ vrátit 409. Ověřit, že `/worlds/slug/X` po tom nemíří na A přes previousSlugs B.
- **P2:** unit `isSlugAvailable(previousSlugOfOtherWorld)` → dnes `true`, má být `false`.
- **P3 (N-RUN-06-02):** fault-injection na `worldsRepo.update(ownerId)` po promote → assert invariant „1 PJ vlastník" (dnes 2× PJ).
- Nespuštěno M3 (existující jest oblasti worlds/universe/world-news) — doporučeno pro potvrzení L3 u SZ-01..65.
