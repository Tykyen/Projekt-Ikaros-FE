# Checkpoint: role / 00-role-model-guardy

RUN: RUN-2026-07-11-1213 · READ-ONLY · Oblast 00 (Role model & guardy, cross-cutting základ)
Registr: `docs/role-audit.md` (prefix R-) · Plán: `docs/role-plan/00-role-model-guardy.md`

## Dosažená vs cílová hloubka
- **Dosaženo: L2** (statické čtení M1 + kontrakt/enum diff M2 + lint-proof `check-elevation-bypass.mjs` zelený).
- **Cíl:** role body L2+, bezpečnost (ES/OW/LK) L3+, kritické hranice L4 (M8). → **mezera:** guard/auth jest (M3) NEspuštěn, žádný red-team (M8), `roles.guard` bez spec (M7 kandidát). Viz PROOF-REQUESTy.

## Rozsah projitý do plné hloubky (L1-L3 statika)
BE: `common/guards/{jwt-auth,optional-jwt-auth,admin,roles,guest-or-member}.guard.ts`, `common/decorators/{roles,allow-pending-deletion,current-user}.decorator.ts`, `common/interfaces/request-user.interface.ts`, `common/utils/world-elevation.ts`, `users/interfaces/user.interface.ts` (UserRole+AdminPermissions), `worlds/interfaces/world-membership.interface.ts` (WorldRole), `auth/strategies/jwt.strategy.ts`, `scripts/check-elevation-bypass.mjs`.
FE: `shared/types/index.ts` (UserRole/WorldRole/AdminPermissions), `shared/types/userRoleLabels.ts`, `shared/store/authStore.ts`, `features/admin/components/{RoleGuard,WorldMembershipGuard}.tsx`, `features/world/context/WorldContext.tsx`, `app/router.tsx` (requireAuth/memberOnly), `app/layout/WorldLayout/WorldLayout.tsx` (isPJ/isPJForNav/elevation).
Cross-cutting osy: RolesGuard sweep (všech 5 užití), globální `role >=` sweep (BE+FE), legacy 3-8 write-side sweep (BE non-spec).

---

## NÁLEZY

### R-RUN-01 — Self-registrace přiřazuje legacy `UserRole.Hrac`(5) místo `Ikarus`(9)  🆕 🟠 STŘEDNÍ
- **[osa]** `EN` (enum drift, write-side — přesně RM-01)
- **Kde:** BE [auth.service.ts:147](../../../../../Projekt-ikaros/backend/src/modules/auth/auth.service.ts#L147) `register()` → `role: UserRole.Hrac` (BE enum Hrac = **5**). Souběžný default schématu [user.schema.ts:29](../../../../../Projekt-ikaros/backend/src/modules/users/schemas/user.schema.ts#L29) `default: UserRole.Hrac`.
  - **Kontrast (správně):** admin-create [admin.service.ts:227](../../../../../Projekt-ikaros/backend/src/modules/admin/admin.service.ts#L227) `role: UserRole.Ikarus`(9); auth **spec mock** [auth.service.spec.ts:33](../../../../../Projekt-ikaros/backend/src/modules/auth/auth.service.spec.ts#L33) `role: UserRole.Ikarus` (test drží záměr Ikarus, ale neasertuje hodnotu předanou do `save()` → drift proklouzl — vzor „mock drift" jako R-07).
  - **Kánon:** D-053 migrovala globální role 3–7 → 9 (Ikarus); „běžný přihlášený uživatel = Ikarus(9)" (role-plan matice). FE enum [index.ts:6](../../../../src/shared/types/index.ts#L6) i `ROLE_LABELS` [userRoleLabels.ts:8](../../../../src/shared/types/userRoleLabels.ts#L8) znají jen 1,2,9,10,11,12,99 — **hodnota 5 neexistuje**.
- **Dopad:** Každý self-registrovaný uživatel má v DB globální roli 5 (legacy, migrace ji měla eliminovat). Není to eskalace (5 i 9 = nepriv., všechny globální gaty jedou `<= Admin(2)`), ale: (a) **data-integrita** — DB akumuluje role-5 účty, které D-053 zrušila; (b) **FE display** — `ROLE_LABELS[5] === undefined` → RoleChip/popisek role prázdný pro každého self-reg usera (admin Uživatelé, profil); (c) jakýkoli pozitivní FE `role === UserRole.Ikarus` u self-reg usera nesedí. Kaskáduje i do `scheduled-messages` (ownerRole = user.role → 5).
- **Návrh:** `register()` + schema default → `UserRole.Ikarus`. Spec doplnit assert `save(objectContaining({ role: UserRole.Ikarus }))`, jinak drift zůstane skrytý. Zvážit data-fix migraci existujících role-5 účtů → 9. **Neopravovat bez souhlasu** (mění registrační chování).
- **L:** L2 (potvrzeno cross-ref: admin-create + spec mock + ROLE_LABELS). Doporučeno M3 (auth.service.spec role assert) → L3.

### R-RUN-02 — Legacy-value rezidua (fallback/default hodnoty 3–8 v živém kódu)  🆕 🟡 NÍZKÁ
- **[osa]** `EN` (write-side drift, kosmetika/rezidua)
- **Kde:**
  - Enrichment fallbacky `?? UserRole.Hrac`(5): [maps.gateway.ts:89](../../../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L89), [friendships.service.ts:260/333/407](../../../../../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L260), [friendships-pending-action.provider.ts:74](../../../../../Projekt-ikaros/backend/src/modules/friendships/friendships-pending-action.provider.ts#L74).
  - Mrtvý default `UserRole.PJ`(3): [scheduled-message.schema.ts:18](../../../../../Projekt-ikaros/backend/src/modules/chat/schemas/scheduled-message.schema.ts#L18) `ownerRole` (controller [scheduled-messages.controller.ts:77](../../../../../Projekt-ikaros/backend/src/modules/chat/scheduled-messages.controller.ts#L77) vždy nastaví `user.role` → default se nikdy nepoužije).
  - Stale komentář [scenario-templates.controller.ts:28](../../../../../Projekt-ikaros/backend/src/modules/campaign/scenario-templates.controller.ts#L28) „Role gate: PJ+ (`role <= UserRole.PJ`)" — gate byl R-15 ODSTRANĚN, kód dnes používá `<= UserRole.Admin`; komentář lže + odkazuje legacy PJ(3).
- **Dopad:** Žádný runtime (fallbacky se hydratují reálnou rolí, default je dead-code, komentář nemá exekuci). Riziko = matoucí (legacy hodnoty 3–8 jako by byly „normální"); fallback Hrac(5), pokud by se hit, dá prázdný FE label. Čistě hygiena/čitelnost.
- **Návrh:** fallbacky → `UserRole.Ikarus`; schema default → `Ikarus` (nebo required bez defaultu); opravit stale komentář scenario-templates. Kosmetické.
- **L:** L1.

---

## Ověřeno bez díry (známé NEhlásím jako nové — kontext registru)

**A. Globální role — enum & hierarchie**
- RM-02/03 ✅ AdminGuard `user.role > UserRole.Admin` → 403 (`<=` směr). FE práh R-01 opraven: WorldLayout [WorldLayout.tsx:319](../../../../src/app/layout/WorldLayout/WorldLayout.tsx#L319) `role <= UserRole.Admin`; **žádný** další FE `\.role (op) <číslo>` (grep 0), žádný FE `role >= UserRole.Ikarus/Guest` (grep 0 → Guest(99)/Zakaz(8) neprojdou).
- RM-01 ⚠️→ **write-side díra = R-RUN-01** (read-side FE čistý). Guest=99 přidán do **obou** enumů konzistentně (FE index.ts:15 ↔ BE user.interface.ts:23).
- RM-04 ✅ Ban se nyní vynucuje (R-08): login + `JwtAuthGuard` [jwt-auth.guard.ts:51](../../../../../Projekt-ikaros/backend/src/common/guards/jwt-auth.guard.ts#L51) `bannedAt` → 401 BANNED.
- RM-05/06 ✅ Spravce 10/11/12 + AdminPermissions {canManageAdmins,canModerateContent,canEditPlatformPages} FE↔BE shodný tvar + DEFAULT_ADMIN_PERMISSIONS všechny false.
- RM-07 ✅ `currentUserAtom` (atomWithStorage); RoleGuard `!user || !roles.includes` → Forbidden (null = nejnižší práva).

**B. World role**
- RM-08/09 ✅ WorldRole 0–5 FE [index.ts:420] ↔ BE [world-membership.interface.ts:9] 1:1.
- RM-10 ✅ Zadatel(0): WorldMembershipGuard `worldRole >= minWorldRole` (Ctenar=1) → 0>=1 false → gated.
- RM-11 ✅ WorldContext.userRole = membership.role|null; gating `(membership?.role ?? -1)` (WorldLayout:324/328/372) — fallback -1, nikdy 0.

**C. Guardy**
- RM-12 ✅ JwtAuthGuard: R-07 opraven (`request.user?.id`), account-state gate ŽIVÝ (deleted/banned/pending) + **navíc** role-freshness (`request.user.role = user.role`, SESS) + elevation lookup (role<=Admin).
- RM-13 ✅ OptionalJwtAuthGuard: PT-35e — deleted/banned → degradace na anon (`user=undefined`), role fresh z DB. (Pending-deletion záměrně negatuje — public read-only, dokumentováno.)
- RM-14 ✅ AdminGuard hardcoded `> UserRole.Admin` → 403; nečte @Roles.
- RM-15 ✅ **RolesGuard sweep:** 5 živých užití (admin.controller 253/401, global-chat 233/298, platform-chat 38, platform-documents 33, admin-tasks 33) — **každé má @Roles** → žádný „metadata chybí → projde" hole.
- RM-16 ⚠️ `roles.guard.ts` **stále bez spec** (guards dir: admin/jwt-auth/optional-jwt/guest-or-member mají spec, roles NE) → PROOF-REQUEST M7.
- RM-17 ✅ RoleGuard FE roles=[Superadmin,Admin] na /admin routách (router.tsx 256/266/277/287).
- RM-18 ✅ WorldMembershipGuard: loading→Spinner; elevation (`world.elevated===true`) + owner (`world.ownerId===user.id`) bypass; `worldRole>=minWorldRole`; redirectTo/Forbidden.
- RM-19/20 ✅ memberOnly() default Ctenar + parametr minWorldRole (kalendar→PomocnyPJ, timeline/pocasi→Hrac), redirectTo `/svet/:worldSlug`; requireAuth loader saveLoginIntent→`?openLogin=1`.

**D. Bypass (R-20 elevation model)**
- RM-21 ✅ GlobalAdmin bypass sjednocen pod **elevation**: BE `worldAdminBypass(user,worldId)` [world-elevation.ts:11], guardy plní `elevatedWorldIds` jen pro role<=Admin; FE `world.elevated` (WorldLayout isElevatedHere, WorldMembershipGuard). Lint `check-elevation-bypass.mjs` **spuštěn → ZELENÝ** (žádný neošetřený přímý bypass; guard zapojen v `lint:check`).
- RM-22 ✅ Owner bypass: WorldMembershipGuard [WorldMembershipGuard.tsx:63] + WorldLayout isPJ/isPJForNav `world.ownerId===currentUser.id`.
- RM-23/24 ✅ PomocnyPJ práh `>= WorldRole.PomocnyPJ` FE isPJ derivace; admin→PJ inflace odebrána (R-20 FE).

**Auth chain integrita (mimo osy, nové od auditu):** JwtStrategy [jwt.strategy.ts:20] vrací `.id` (ne `.sub`, R-07); guest token → `role: UserRole.Guest`(99) + `isGuest:true`; GuestOrMemberGuard pustí guesta jen s validním tokenem (member gate skip), guest 99 neprojde žádný role/admin gate → dvojitá pojistka. ✅

## Přijatý dluh (registr, NEhlásím nově)
area00-K2 (mrtvé @Roles PJ recent-pages) ✅ opraveno · area00-K3 (`?? WorldRole.Zadatel(0)` fallback 5 FE souborů, latentní) · area00-K4 (WeatherSetsModal `isGlobalAdmin||true`).

---

## PROOF-REQUESTy (pro dosažení cílové L)
1. **[M7/L3-L4]** `roles.guard.spec.ts` neexistuje → gap-fill test: `@Roles` set/unset (metadata-empty → `return true` díra RM-15) + role in/out seznamu → status. Trvalá pojistka.
2. **[M3/L3]** Spustit BE guard/auth jest (`jwt-auth.guard.spec`, `admin.guard.spec`, `optional-jwt-auth.guard.spec`, `guest-or-member.guard.spec`) proti HEAD — potvrdit zelené po elevation/guest změnách.
3. **[M3/L3 → R-RUN-01]** `auth.service.spec.ts` doplnit assert role předané do `save()` (dnes mock = Ikarus, ale hodnota se neasertuje → drift skrytý). Reprodukuje R-RUN-01.
4. **[M8/L4]** Red-team: guest token na non-Hospoda endpoint (403?), spoof role mimo enum, PomocnyPJ→role=PJ strop (R-03 regrese), de-elevated admin na world-scoped mutaci (worldAdminBypass drží?).

## Pokrytí
Osy A/B/C/D + E-matice + F (DD/PC princip) přečteny do L1-L2. Kód v záběru 100% projit staticky. 2 nové nálezy (1× 🟠 EN write-side, 1× 🟡 rezidua), 0 nové 🔴. Zbytek = ověřeno bez díry / známý dluh.
