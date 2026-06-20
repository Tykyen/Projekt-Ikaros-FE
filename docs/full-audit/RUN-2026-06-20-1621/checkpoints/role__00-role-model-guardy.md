# role / 00-role-model-guardy — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20 · Auditor: Claude Sonnet 4.6 · READ-ONLY

---

## Pokrytí

### Prošlé soubory (statické čtení L1-L2)

**BE:**
- `common/guards/jwt-auth.guard.ts` — R-07 fix ✅, `.id` místo `.sub`, ban gate
- `common/guards/optional-jwt-auth.guard.ts` — handleRequest vrací undefined (bezchybné)
- `common/guards/admin.guard.ts` — `user.role > UserRole.Admin` → 403
- `common/guards/roles.guard.ts` — `if (!requiredRoles) return true` (RM-15)
- `common/decorators/roles.decorator.ts`, `current-user.decorator.ts`, `allow-pending-deletion.decorator.ts`
- `modules/users/interfaces/user.interface.ts` — UserRole enum BE (legacy 3–8 zachovány)
- `modules/worlds/interfaces/world-membership.interface.ts` — WorldRole enum BE 0–5
- `modules/admin/admin.controller.ts` — všechny `@UseGuards(RolesGuard)` mají `@Roles`
- `modules/global-chat/global-chat.controller.ts` — class JwtAuthGuard + @Roles na RolesGuard
- `modules/search/search.controller.ts` — class JwtAuthGuard; AdminGuard endpointy OK
- `modules/worlds/worlds.controller.ts` — OptionalJwtAuthGuard; private data za user-check
- `modules/worlds/worlds.repository.ts` — `findAll` filtruje `public/open` (RM-13 OK)
- `modules/worlds/worlds.service.ts` — canAdminWorld, canManageMembers, assertMember, R-20 OK
- `modules/pages/pages.service.ts` — findByWorld R-09 FIX OVĚŘEN (per-page assertAccess)
- `main.ts` — `whitelist: true, forbidNonWhitelisted: true` (RM-26 mitigováno)
- `common/guards/*.spec.ts` — jwt-auth, optional-jwt-auth, admin mají spec; roles.guard NEMÁ

**FE:**
- `shared/types/index.ts` (UserRole 1,2,9-12; WorldRole 0-5; AdminPermissions interface)
- `shared/store/authStore.ts` — `currentUserAtom: User | null`, hydratace null-safe
- `features/admin/components/RoleGuard.tsx` — `!user || !roles.includes(user.role)` → ForbiddenPage
- `features/admin/components/WorldMembershipGuard.tsx` — loading→Spinner; fallbackGlobalRoles; `worldRole != null && worldRole >= minWorldRole`; redirectTo
- `features/admin/components/WorldMembershipGuard.spec.tsx` — 4+ testy (Sa/Admin/PJ/Hrac/Zadatel)
- `app/router.tsx` — `memberOnly()` wrapper Ctenar default; requireAuth loader; RoleGuard na admin/*
- `app/layout/WorldLayout/WorldLayout.tsx` — `isPJForNav` / `isPJ` / `isGlobalAdmin` derivace
- `features/world/context/WorldContext.tsx` — `userRole: WorldRole | null` (null = non-member)
- `features/world/pages/WorldSettingsPage/tabs/MembersTab.tsx` — R-20 fix ✅
- `features/ikaros/pages/ArticleDetailPage.tsx` — R-10 fix ✅ (bez UserRole.PJ)
- `features/world/pages/WorldWeatherPage/modals/WeatherSetsModal.tsx` — `|| true` (area00-K4 dluh)
- `features/world/campaign/components/*.tsx`, `shop/components/*.tsx`, `EventsPage.tsx`, `CurrencyPage.tsx`, `WorldNewsPage.tsx`, `WorldDashboardPage` columns, `WorldSettingsPage.tsx` — `?? WorldRole.Zadatel` (area00-K3 dluh, 7 výskytů)

---

## Dosažená L vs cílová L

| Oblast | Cílová L | Dosažená L | Poznámka |
|--------|----------|------------|---------|
| A. Globální role enum & hierarchie (RM-01..07) | L2+ | L2 | enum parita ověřena staticky; RM-07 null safe ✅ |
| B. World role enum & hierarchie (RM-08..11) | L2+ | L2 | WorldRole 0-5 1:1; fallback null ✅; Zadatel blokován ✅ |
| C. BE guardy (RM-12..16) | L3 | L2/L3 | jwt/optional/admin L3 (mají spec); roles.guard L1 (NO spec = RM-16 gap) |
| C. FE guardy (RM-17..20) | L2+ | L2/L3 | WorldMembershipGuard L3 (spec); RoleGuard L1 (NO spec); router čtení L2 |
| D. Bypass vzory (RM-21..24) | L2+ | L2 | owner/GlobalAdmin/PomocnyPJ staticky ověřeny obě strany |
| E. Matice role × guard (cross-cutting) | L2 | L2 | matice v plánu verifikována statickým čtením |
| F. Defense-in-depth (RM-25..30) | L2+ | L2 | service last-line-of-defense OK; forbidNonWhitelisted ✅; search/embedding filtruje ✅ |

**Kritické gap L3→L4:** roles.guard (RM-16), RoleGuard FE (RM-17) nemají testy; žádný red-team (M8) neproběhl.

---

## Nálezy

### 🟡 Nízká (registry/dokumentace nesrovnalost)

**R-ROLE-00-N1 — TL;DR tabulka v role-audit.md nesouhlasí s tělem dokumentu pro R-09 a R-10**
· Osa: `EN` (dokumentace drift)
· Kde: `docs/role-audit.md` řádky 24-25 (TL;DR tabulka: `🐛 potvrzeno`) vs. řádky 82+88 (tělo: `✅ opraveno`)
· Dopad: audit status matoucí — fix je ověřen v kódu (pages.service.ts:155-165 pro R-09; ArticleDetailPage.tsx:36-39 pro R-10), ale TL;DR tabulka stále říká `🐛 potvrzeno`. Kdokoli čte TL;DR nabyde dojmu, že leaky jsou otevřené.
· Návrh: Aktualizovat TL;DR tabulku: R-09 → `✅ opraveno (R-09b + per-page assertAccess)`, R-10 → `✅ opraveno`.
· L1 · 🆕

---

### ⬜ Test gap (bez nového nálezu v kódu, ale gap v jistotě)

**R-ROLE-00-T1 — `roles.guard.ts` nemá spec (RM-16)**
· Kde: `common/guards/` — jwt-auth.guard.spec.ts, optional-jwt-auth.guard.spec.ts, admin.guard.spec.ts existují; `roles.guard.spec.ts` CHYBÍ
· Dopad: klíčové chování „bez `@Roles` → guard propustí všechny" není testované; případná regrese (přidání RolesGuard class-level bez @Roles) neprojde CI.
· Návrh: M7 gap-fill: test metadata-empty (propustí) + @Roles(Superadmin) (blokuje Ikarus) + @Roles(Superadmin, Admin) (pustí obě).
· L1 (chybí L3) · 🆕

**R-ROLE-00-T2 — `RoleGuard.tsx` (FE) nemá spec (RM-17)**
· Kde: `features/admin/components/RoleGuard.tsx` — WorldMembershipGuard.spec.tsx existuje, RoleGuard spec CHYBÍ
· Dopad: základní guard na `/admin` a `/ikaros/admin/emotes` bez testu — „role mimo seznam → ForbiddenPage" neověřeno automaticky.
· Návrh: M7 gap-fill: test user=null→Forbidden, user.role ne v listu→Forbidden, user.role v listu→children.
· L1 (chybí L3) · 🆕

---

### ✅ Potvrzeno bez nového nálezu

| Bod | Výsledek | L |
|-----|----------|---|
| RM-01 UserRole enum FE↔BE drift | FE zná 1,2,9-12; BE má legacy 3-8 (záměr D-053, RM-01 OK - diff je dokumentovaný záměr) | L2 |
| RM-02 Hierarchie globálních rolí `<=` | AdminGuard: `role > Admin(2)` → 403; FE: `<= UserRole.Admin`; žádný `>=` na globální roli | L2 |
| RM-03 R-01 fix | `<= UserRole.Admin` na obou místech WorldLayout.tsx:279,316 ✅ | L2 |
| RM-04 UserRole.Zakaz FE | Grep FE src: `UserRole.Zakaz` se nikde nepoužívá; ban přes `401 BANNED` client.ts:47 ✅ | L2 |
| RM-05 SpravceClanku/Galerie/Diskuzi (10/11/12) | FE i BE shodné hodnoty; REVIEWER_ROLES BE bez PJ ✅ | L2 |
| RM-06 AdminPermissions FE↔BE | Interface identický (3 pole, default false); setter+gate v admin.service ✅ | L2 |
| RM-07 currentUserAtom null-safe | `User | null` atomWithStorage; RoleGuard: `!user` catch; WorldMembershipGuard: `user && ...` | L2 |
| RM-08 WorldRole FE↔BE 1:1 | Zadatel0/Ctenar1/Hrac2/Korektor3/PomocnyPJ4/PJ5 — shodné obě strany | L2 |
| RM-09 Hierarchie world rolí `>=` | Všude `>= WorldRole.X`; `membership.role ?? -1` fallback | L2 |
| RM-10 Zadatel bez přístupu | `assertMember`: `role < WorldRole.Hrac` → 403 (blokuje 0+1); WorldMembershipGuard: `>= Ctenar` | L2 |
| RM-11 userRole null fallback | WorldContext.tsx: default `userRole: null`; WorldMembershipGuard: `worldRole != null &&` | L2 |
| RM-12 JwtAuthGuard (DELETED/BANNED/PENDING) | Plně funkční po R-07+R-08 opravách; request.user.id ✅ | L2 |
| RM-13 OptionalJwtAuthGuard žádný private leak | findAll() filtruje public/open; findByIdForRequester kontroluje user; getMembers: world-brána před daty | L2 |
| RM-14 AdminGuard + JwtAuthGuard pořadí | admin.controller class JwtAuthGuard; per-method AdminGuard; search class JwtAuthGuard; stats class [Jwt,Admin] | L2 |
| RM-15 RolesGuard bez @Roles | 3 výskyty RolesGuard, všechny s @Roles (admin.controller:196,344; global-chat.controller:180) ✅ | L2 |
| RM-16 roles.guard chybí spec | CONFIRMED gap — viz R-ROLE-00-T1 | L1 |
| RM-17 FE RoleGuard role seznam ↔ BE AdminGuard | `roles=[Sa,Admin]` shoduje s BE `role > Admin(2)` → 403; emotes taktéž | L2 |
| RM-18 FE WorldMembershipGuard defaulty | loading→Spinner; null user → fallback fails → redirectTo; `worldRole != null` ✅ | L2/L3 |
| RM-19 memberOnly pokryje sub-routy | Všechny `/svet/:slug/*` sub-routy za `memberOnly()` nebo explicitním `WorldMembershipGuard` | L2 |
| RM-20 requireAuth kryje přihlášené routy | chat/profil/posta/oblibene/akce/diskuze/admin → loader: requireAuth ✅ | L2 |
| RM-21 GlobalAdmin bypass parita | BE: `role <= Admin` ve assertMember, applyDetailScope; FE: `<= UserRole.Admin` v isPJ/isGlobalAdmin | L2 |
| RM-22 Owner bypass | BE: ownerId check v transferOwnership, assertCanModerateAR, OWNER_CANNOT_LEAVE; FE: world.ownerId === currentUser.id v isPJ | L2 |
| RM-23 PomocnyPJ(4) bypass nuance | canManageMembers = PJ(admin) OR PomocnyPJ(4); FE isPJ = `>= PomocnyPJ` — parita ✅ | L2 |
| RM-24 MembersTab GlobalAdmin UI elevation | R-20 fix: `viewerRole = userRole ?? Zadatel` (admin bez staff = Zadatel, nevidí PJ akce) ✅ | L2 |
| RM-25 Last line of defense = service | pages/worlds/characters service assert*; guard = rychlý filtr; WS by service (chat.service canJoinChannelRoom) | L2 |
| RM-26 DTO whitelist past | `forbidNonWhitelisted: true` v main.ts → 400 místo tichého dropu ✅ | L2 |
| RM-27 Repo mapper whitelist | toEntity mapper whitelist obecně OK (D-066 znám); per-role pole = doménové oblasti 04-08 | L2 |
| RM-28 Inventura dveří na zdroj | Základ (REST/search ověřeno pro pages+worlds); WS/export detail = doménové oblasti | L2 |
| RM-29 Search jako boční kanál | search.controller: JwtAuthGuard + worldId povinný + findVisibleSlugs filtr → N-35 kryje ✅ | L2 |
| RM-30 WS jako boční kanál | AppGateway.room:join gatuje `chat:` prefix; oblast 09 detail | L2 |
| area00-K3 `?? Zadatel(0)` | 7 výskytů (StoryboardView, CampaignView, ShopView, WeatherPage, EventsPage, CurrencyPage, MembersTab, WorldSettingsPage) — přijatý dluh v registru | L1 |
| area00-K4 WeatherSetsModal `|| true` | Stále přítomno (:330); přijatý dluh; parent kontroluje `readOnly` | L1 |

---

## PROOF-REQUEST

### PR-1 — roles.guard.ts správnost „metadata-empty → propustí"
**Co spustit:** Jest spec pro `RolesGuard`:
```bash
# Vytvořit common/guards/roles.guard.spec.ts s testy:
# 1. requiredRoles = undefined → canActivate = true (default-pass risk)
# 2. requiredRoles = [Superadmin] + user.role = Ikarus(9) → false
# 3. requiredRoles = [Superadmin, Admin] + user.role = Admin(2) → true
# 4. user = undefined + requiredRoles = [Sa] → false
npx jest roles.guard --runInBand
```
**Co prokáže:** L3 — že guard chování sedí na kód; a že „default-pass" je vědomé (není to díra, když RolesGuard je vždy doplněn @Roles).

### PR-2 — RoleGuard.tsx FE testování
**Co spustit:**
```bash
# Vytvořit features/admin/components/RoleGuard.spec.tsx
# test: user=null → ForbiddenPage; user.role=Ikarus → Forbidden (ne v [Sa,Admin]); user.role=Sa → children
npx vitest run --reporter=verbose src/features/admin/components/RoleGuard
```
**Co prokáže:** L3 — FE guard gate.

### PR-3 — Paritu FE↔BE prahů na kritické hranici (M8 minimum)
**Co spustit:** Ruční request mimo FE:
```bash
# 1. Přihlásit se jako Hrac světa X → získat JWT token
# 2. Zavolat POST /api/worlds/{id}/members/{mId}/role s {role: 5 (PJ)}
#    - očekávání: 403 FORBIDDEN (R-03 fix)
# 3. Zavolat GET /api/search?worldId={id}&q=test jako ne-člen privátního světa
#    - očekávání: 404 WORLD_NOT_FOUND
# 4. Zavolat GET /api/worlds/{id}/members jako anon (bez tokenu)
#    - očekávání: 200 (OptionalJwtAuthGuard - public metadata; private → 404)
```
**Co prokáže:** L4 pro RM-10, RM-21, RM-23 na reálných hranicích.

---

## Souhrn stavu oblasti

Cílová hloubka L2+; **dosaženo L2 na všech 30 bodech** (RM-01..30). L3 jen na bodech s existujícím spec (jwt-auth/optional-jwt/admin guard + WorldMembershipGuard). L4 neproběhlo (M8 chybí).

**Nové nálezy:** 1 registrační nesrovnalost (R-ROLE-00-N1 🟡 nízká) + 2 test-gapy (R-ROLE-00-T1, T2 ⬜). Žádný bezpečnostní nález.

Všechny předchozí bezpečnostní nálezy (R-01..R-20) ověřeny v kódu jako opravené. Registry TL;DR update potřebuje R-09+R-10.
