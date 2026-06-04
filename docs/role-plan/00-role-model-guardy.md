# 00 — Role model & guardy (cross-cutting základ)

Fundament celého auditu: **co je vůbec role**, jak se čísluje, jaký směr má hierarchie, kde sedí
GlobalAdmin/owner/PomocnyPJ bypass, a jaký **guard** rozhoduje na BE ↔ jaký **gating** na FE. Všechny
ostatní oblasti (01–09) stojí na tom, že tahle vrstva sedí. Pokud se enum/práh/bypass rozejde tady,
projeví se to jako falešný nález ve všech doménách.

**BE:** `common/guards/*` (jwt-auth, optional-jwt-auth, admin, roles), `common/decorators/*`
(@Roles, @AllowPendingDeletion, @CurrentUser), `users/interfaces/user.interface.ts` (UserRole +
AdminPermissions), `worlds/interfaces/world-membership.interface.ts` (WorldRole)
**FE:** `shared/types/index.ts` (UserRole, WorldRole, AdminPermissions), `features/admin/components`
(RoleGuard, WorldMembershipGuard), `app/router.tsx` (requireAuth/memberOnly), `app/layout/WorldLayout`
(isPJ/isPJForNav derivace), `shared/store/authStore.ts` (currentUserAtom)

---

## A. Globální role — enum & hierarchie

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| RM-01 | `UserRole` enum FE [index.ts:6] ↔ BE [user.interface.ts:1]: shodné jsou jen 1,2,9,10,11,12. BE drží navíc legacy 3–8. Ověřit, že rozdíl je **záměrný** (D-053) a žádný FE kód nečte hodnotu 3–8 jako globální roli `[auto]` | `EN` | M2 | ⬜ |
| RM-02 | Hierarchie globálních rolí = **nižší číslo vyšší moc**; „GlobalAdmin" = `role <= Admin(2)`. Ověřit, že žádný BE/FE check nepoužije `>=` směr na globální roli `[auto]` | `EN` | M1 | ⬜ |
| RM-03 | FE prahy `currentUser.role <= 3` ([WorldLayout.tsx:272](../Projekt-ikaros-FE/src/app/layout/WorldLayout/WorldLayout.tsx#L272), [:298]) — `3` = globální PJ, který FE enum nezná → **R-01**. Najít všechny výskyty `role <= N` na FE a ověřit, že N nemíří na neexistující enum hodnotu `[auto]` | `EN` | M1 | ✅ R-01 opraveno (`<= UserRole.Admin`; jediné 2 výskyty, AccessBoard `<= WorldRole.PomocnyPJ` je OK) |
| RM-04 | `Zakaz(8)` je BE-only (FE enum nemá). Ban se na FE řeší přes `401 BANNED` ([client.ts:46]), ne přes globální roli. Ověřit, že FE nikde nečeká `UserRole.Zakaz` `[auto]` | `EN` `LK` | M1 | ⬜ |
| RM-05 | `SpravceClanku/Galerie/Diskuzi` (10/11/12) FE↔BE shodné hodnoty; používají se ve `REVIEWER_ROLES`/`assertAdmin` (oblast 02) `[auto]` | `EN` | M2 | ⬜ |
| RM-06 | `AdminPermissions` ({canManageAdmins, canModerateContent, canEditPlatformPages}) — FE [index.ts:21] ↔ BE [user.interface.ts:16] shodný tvar; default vše `false`; měnit smí jen Superadmin `[auto]` | `EN` `PA` | M2 | ⬜ |
| RM-07 | `currentUserAtom` ([authStore.ts:7]) hydratuje `role` z `/users/me`; do hydratace je `role` undefined → ověřit, že gating defaultuje na **nejnižší** práva (ne „undefined projde") `[auto]` | `PA` | M1 | ⬜ |

---

## B. World role — enum & hierarchie

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| RM-08 | `WorldRole` enum FE [index.ts:324] ↔ BE [world-membership.interface.ts:9]: Zadatel0/Ctenar1/Hrac2/Korektor3/PomocnyPJ4/PJ5 — **1:1 shoda** (na rozdíl od UserRole) `[auto]` | `EN` | M2 | ⬜ |
| RM-09 | Hierarchie world rolí = **vyšší číslo víc moci** (opačně než globální). Prahy: read=Ctenar(1), hra=Hrac(2), edit=Korektor(3), staff=PomocnyPJ(4), admin=PJ(5) `[auto]` | `EN` | M1 | ⬜ |
| RM-10 | `Zadatel(0)` = pending, **bez přístupu**. Ověřit, že je všude gated jako non-member (ne jako Ctenar): `assertMember`/`memberOnly` ho musí odmítnout `[auto]` | `PA` `LK` | M1 | ⬜ |
| RM-11 | FE `WorldContext.userRole` ([WorldContext.tsx:16]) = `membership.role`; non-member = `null`. Gating čte `(userRole ?? -1) >= WorldRole.X` → ověřit fallback `-1` (nikdy ne `0`=Zadatel) `[auto]` | `PA` | M1 | ⬜ |

---

## C. Guardy (BE) ↔ guardy (FE)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| RM-12 | BE `JwtAuthGuard` [jwt-auth.guard.ts]: povinný JWT (401 bez), navíc account-state gate — `isDeleted`→401 DELETED, `deletionRequestedAt && !@AllowPendingDeletion`→401 DELETION_PENDING; lastSeen update `[auto]` | `LK` | M3 | ⬜ |
| RM-13 | BE `OptionalJwtAuthGuard` [optional-jwt-auth.guard.ts]: token chybí/invalid → `user=undefined` (nepadá). Ověřit, že **žádný** endpoint za ním nevrací per-user/privátní data bez kontroly `user` `[auto]` | `LK` `BY` | M4 | ⬜ |
| RM-14 | BE `AdminGuard` [admin.guard.ts]: hardcoded `role <= Admin(2)` → 403 jinak. Ověřit, že nečte `@Roles` (to je RolesGuard) a že je vždy za `JwtAuthGuard` `[auto]` | `PA` | M3 | ⬜ |
| RM-15 | BE `RolesGuard` [roles.guard.ts]: metadata-driven `@Roles(...)`; **pokud metadata chybí → projde** (`if (!requiredRoles) return true`). Najít každý controller s RolesGuard **bez** `@Roles` = díra `[auto]` | `ES` | M1 | ⬜ |
| RM-16 | BE guard pokrytí testy: `admin/jwt-auth/optional-jwt` mají spec, **`roles.guard` NEMÁ** → gap-fill kandidát (M7) `[auto]` | — | M3 | ⬜ |
| RM-17 | FE `RoleGuard` ([RoleGuard.tsx]): `roles: UserRole[]`, mimo → `<ForbiddenPage/>`. Použití `/admin`, `/ikaros/admin/emotes` ([router.tsx:190]). Ověřit, že seznam rolí = BE AdminGuard/RolesGuard ekvivalent `[auto]` | `PA` | M2 | ⬜ |
| RM-18 | FE `WorldMembershipGuard` ([WorldMembershipGuard.tsx]): loading→Spinner; `fallbackGlobalRoles` (Sa/Admin) projde bez membership; `userRole >= minWorldRole` projde; `redirectTo`→tichý redirect; jinak Forbidden. Ověřit defaulty `[auto]` | `PA` `LK` | M3 | ⬜ |
| RM-19 | FE `memberOnly()` wrapper ([router.tsx:105]) — sub-routy `/svet/:slug/*` vyžadují `>= Ctenar`, non-member redirect na dashboard (ne Forbidden = anti-leak). Ověřit, že **každá** chráněná sub-routa je obalená `[auto]` | `LK` | M1 | ⬜ |
| RM-20 | FE `requireAuth` loader ([router.tsx:121]) — bez tokenu redirect `/?openLogin=1` + uloží intent. Ověřit, že kryje všechny přihlášené-only routy (profil, pošta, diskuze, oblíbené, akce) `[auto]` | `LK` | M1 | ⬜ |

---

## D. Bypass vzory (konzistence napříč obě strany)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| RM-21 | **GlobalAdmin bypass** (`role <= Admin(2)`): BE ho má jako **první větev** ve většině `assert*` (worlds/pages/characters/maps/…). FE ekvivalent = `isGlobalAdmin` ([WorldLayout.tsx:302], [MembersTab.tsx:56]). Ověřit, že kde BE bypass má, FE ho má taky (a naopak) `[auto]` | `BY` | M1 | ⬜ |
| RM-22 | **Owner bypass**: `world.ownerId === userId` — BE u `transferOwnership`/`assertCanModerateAccessRequests`; FE u `isPJ`/`isPJForNav`. Owner ≠ PJ role (owner je vždy PJ membership, ale logika ownershipu je zvlášť). Ověřit, že owner-only akce (transfer, nesmí odejít) sedí obě strany `[auto]` | `BY` `PA` | M1 | ⬜ |
| RM-23 | **PomocnyPJ(4) bypass nuance**: staff bypass má u page-level AKJ, ale **ne** u tab-level (oblast 04). Tady ověřit jen, že `>= PomocnyPJ` práh je na FE `isPJ` derivaci shodný s BE `canManageMembers`/`canManageChat`/staff asserty `[auto]` | `BY` | M2 | ⬜ |
| RM-24 | FE `MembersTab` ([MembersTab.tsx:56]) mapuje GlobalAdmin → `viewerRole = PJ` (UI only, BE autoritativní). Ověřit, že tahle UI-povýšená role **nikdy** neobchází BE 403 (jen zobrazí taby) `[auto]` | `BY` `ES` | M1 | ⬜ |

---

## E. Matice role × guard (cross-cutting)

Demonstrace povinného formátu na nejnižší vrstvě — **který guard pustí kterou personu**. Buňka =
očekávaný výsledek průchodu guardem (ne konkrétní endpoint; ten řeší oblasti 01–09).

| Guard / persona | guest | Ikarus | Admin/Sa | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ | owner |
|---|---|---|---|---|---|---|---|---|---|---|
| `OptionalJwtAuthGuard` (read) | ✅* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `JwtAuthGuard` (přihlášený) | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `JwtAuthGuard` + banned/deleted | 🔒 | ⛔ | ⛔ | — | — | — | — | — | — | — |
| `AdminGuard` (`role<=2`) | 🔒 | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| `RolesGuard @Roles(Superadmin)` | 🔒 | ⛔ | ✅** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| `memberOnly(Ctenar)` (FE) | redirect | redirect | ✅(fallback) | 🙈 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

`*` jen pro public/open zdroj — private vrací 🚫 404. `**` jen Superadmin(1), ne Admin(2) — viz RM-15
(metadata musí být přesné). 🙈 = Zadatel je „member" v DB, ale `assertMember`/gating ho odmítá (RM-10).

> **Delta parity (cross-cutting):**
> - `role <= 3` práh (RM-03) — FE: počítá s globálním PJ(3) · BE: enum drží 3, ale migrace nepřiřazuje · **🐛 R-01**
> - GlobalAdmin bypass (RM-21) — FE: `role <= 2` · BE: `role <= Admin(2)` · **✅ parita** (ověřit u všech assertů)
> - ostatní řádky → vyplnit při exekuci, prázdná buňka zůstat nesmí.

---

## F. Defense-in-depth & inventura přístupových cest (`DD` / `PC` základ)

Cross-cutting základ pro perspektivy P2/P3. Tady se **neřeší** konkrétní zdroj — definuje se
**princip a kostra inventury**, kterou pak každá doménová oblast (04/05/07/08/09) vyplní pro svůj zdroj.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| RM-25 | **Last line of defense = service.** Ověřit, že role-gate není **jen** v controlleru/guardu, ale i v service `assert*`. Controller guard obejde: WS gateway, interní service→service volání, jiný controller sdílející service `[auto]` | `DD` | M1 | ⬜ |
| RM-26 | **DTO whitelist past.** `ValidationPipe({ whitelist: true })` tiše dropne neznámá pole (paměť: BE restart). Ověřit, že gating se **nespoléhá** na to, že pole nedorazí — musí ho odmítnout explicitně `[auto]` | `DD` `ES` | M1 | ⬜ |
| RM-27 | **Repo mapper whitelist.** `toEntity`/`toToken` jsou explicitní whitelist mappery (D-066) — pole gated rolí musí být i tam, jinak se buď ztratí (OR), nebo prosákne (LK). Ověřit u zdrojů s per-role poli `[auto]` | `DD` | M1 | ⬜ |
| RM-28 | **Inventura dveří na zdroj.** Pro každý chráněný zdroj sestavit seznam **všech** cest: `REST GET · REST mutace · WS event · search index · embedding · directory/slugs · favorite/bump · data-export`. Prázdné políčko cesty = neprověřené dveře `[auto]` | `PC` | M1 | ⬜ |
| RM-29 | **Search/embedding jako boční kanál.** MeiliSearch index + embedding chunks musí respektovat stejný access filtr jako REST (N-35/N-37 třída). Ověřit, že indexer i query mají `worldId` + access check `[auto]` | `PC` `LK` | M1 | ⬜ |
| RM-30 | **WS jako boční kanál.** Gateway emit/join musí ctít stejný role/membership gate jako REST (W-3/W-10 třída). Detail → oblast 09; tady jen princip + odkaz `[auto]` | `PC` `BY` | M5 | ⬜ |

### Šablona inventury cest (vyplní doménové oblasti)

| Zdroj | REST GET | REST mutace | WS | search | embedding | slugs/dir | favorite | export | zámek na vrstvě |
|---|---|---|---|---|---|---|---|---|---|
| *(příklad: Page)* | assertAccess | assertCanWrite | — | ⚠️N-35 | ⚠️N-13 | ⚠️N-37 | ⚠️N-36 | ? | service |
| ... | | | | | | | | | |

> 💡 **Proč tabulka dveří:** nejtěžší leaky nejsou „špatná role na endpointu", ale „**zapomenuté dveře**".
> Zdroj má 6 cest, 5 zamčených — a tu šestou (search) nikdo neprojde, protože myslí v REST.

---

## Test coverage gaps

- `roles.guard.ts` nemá spec (jediný ze 4 guardů) → M7 kandidát: `@Roles` set/unset + metadata-empty díra (RM-15).
- `WorldMembershipGuard` (z bug-planu): chybí test pro `redirectTo` s `:worldSlug` tokenem a pro `fallbackGlobalRoles` bez membership.
- `RoleGuard` — ověřit existenci testu pro „role mimo seznam → ForbiddenPage".
- Žádný test neověřuje **paritu** prahů FE↔BE (to je vlastní třída — M7 matice-řízený test).

---

## Známá rizika

- **RR-1 (`EN`) `role <= 3` past (R-01)** — vestigiální práh; dnes neškodný, ale tiká pro budoucí globální roli na hodnotě 3.
- **RR-2 (`ES`) RolesGuard bez `@Roles`** — pokud někde guard je, ale dekorátor chybí, guard **propustí všechny** (RM-15). Nutné grepnout každý výskyt RolesGuard.
- **RR-3 (`BY`) UI-povýšená role** ([MembersTab.tsx:56] GlobalAdmin→PJ) — neškodné jen dokud BE zůstává autoritativní; kdyby FE někde rozhodoval bez BE re-checku, povýšení by se stalo eskalací.
- **RR-4 (`EN`) dva směry hierarchie** — globální `<=` vs world `>=`. Mísení (např. omylem `worldRole <= X`) je tichá inverze oprávnění.
