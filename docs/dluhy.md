# Technické dluhy

> **Souhrn k 2026-05-08 (po 1.3a + dluh-cleanup):**
> - **Uzavřené:** D-001, D-002, D-003, D-004, D-005, D-007, D-008, D-009 (částečně), D-010, D-011 (honeypot část), D-013, D-014, D-015, D-016 (částečně), D-018, D-020 — **15 dluhů řešeno alespoň částečně**
> - **Stále otevřené (čekají na PJ rozhodnutí / externí závislost):** D-011 (full captcha provider), D-012 (mailer SMTP)
>
> Drobné nedořešené části jsou zaznamenány u jednotlivých záznamů níže.

## Otevřené

### D-022 — Anonymous mobile layout: main content zúžen na ~95px
**Soubor:** `src/app/layout/IkarosLayout/IkarosLayout.module.css` (řádek 143-145 a 371-380)
**Problém:** Na anonymous user (logged-out) na mobile (≤768px viewport) má main content jen ~59-95px width. Pravidlo `.shellAnon .body { grid-template-columns: var(--sidebar-w, 280px) 1fr }` (specificita 2-0-0) přepíše mobile media query `.body { grid-template-columns: 1fr }` (specificita 1-0-0 — media query nezvyšuje specificitu selektoru). Tedy `.shellAnon` mobile zachová 280px sidebar slot + 95px main, i když `.sidebar { display: none }`.
**Dopad:** Střední — všechny skiny (welcome card zúžený na 52px, paragraph nečitelný) když anonymous user otevře aplikaci na mobile. Authenticated mobile (přihlášený user) je OK.
**Reprodukce:** localhost dev, incognito (anonymous), viewport 375×812 — welcome card width 52px.
**Řešení:** přidat `.shellAnon` do mobile media query:
```css
@media (max-width: 768px) {
  .body,
  .shellAnon .body { grid-template-columns: 1fr; }
  ...
}
```
Triviální 1-řádkový fix shared layoutu.
**Kdy:** Při dalším shared layout patch (samostatný spec není nutný, ale shared edit vyžaduje souhlas dle memory `feedback_theme_isolation.md`).

---

### D-021 — Tyky header avatar specificity hack opakovaný per-tématu
**Soubor:** `src/themes/themes/<theme>/decorations.css` (zlaty-standard, sci-fi; budoucí luxury upgrades)
**Problém:** `UserAvatar.module.css` má `.sm { width: 32px }` se specificitou 0,1,0. `IkarosLayout.module.css` má `.avatar { width: 20px }` s totožnou specificitou — UserAvatar vyhrává díky pozdějšímu načtení v cascade. Každé luxury téma musí proto duplikovat scoped fix `[data-theme="..."] [class*="headerBtn"] [class*="avatar"] { width: 18px }`. Aktuálně už 2× (zlaty-standard + sci-fi); každé další téma kopíruje stejné 4 řádky.
**Dopad:** Nízký — funkčně OK, ale duplikace + technický dluh; při dalším luxury theme upgrade riziko zapomenutí.
**Řešení:** Jedna z možností (vyžaduje souhlas, zasahuje shared):
  - (a) Přidat `xs` size (18-20px) do `UserAvatar` + použít `<UserAvatar size="xs">` v IkarosLayout headeru.
  - (b) Zvýšit specificitu `IkarosLayout.module.css` na `.headerBtn .avatar { width: 20px }` — překoná `UserAvatar.module.css .sm` 32px globálně, fix jednorázový.
**Kdy:** Před dalším luxury theme upgrade NEBO dříve, samostatný spec/plán; oba přístupy = úprava shared modulu, vyžaduje schválení.

---

### D-011 — Captcha provider integrace
**Soubor:** `src/components/auth/RegisterModal.tsx` + BE `auth` modul
**Stav:** Honeypot field implementován (FE skryté pole + BE DTO `@MaxLength(0)` validace v `RegisterDto`). Plný captcha provider (hCaptcha / Turnstile) **stále chybí**.
**Dopad zbytkový:** Honeypot odfiltruje naivní boty, ale dedikované scraper boty s headless browserem ho obejdou. Pro produkci nezbytné dodat reálnou captchu.
**Blokátor:** PJ musí rozhodnout provider (hCaptcha free + GDPR-friendly / Cloudflare Turnstile / Friendly Captcha) a založit účet (site key + secret v `.env`).
**Kdy:** Před prod nasazením, samostatný spec.

---

### D-012 — E-mail verifikace po registraci (full flow)
**Soubor:** BE `auth` + `mailer` moduly + FE verify route
**Stav:** Mailer skeleton zaveden (`MailerService` stub v `modules/mailer/`), `auth.service.register` ho volá při registraci (zatím loguje URL místo skutečného odeslání). `User.emailVerified` flag připravený. **Plný flow chybí:**
- Není `EmailVerificationToken` schema (token + hash + TTL)
- Není endpoint `GET /auth/email/verify?token=...`
- Není FE route `/email-verify`
- MailerService je stub (nepoužívá reálný SMTP)
**Blokátor:** Resend / SES / Mailgun účet + API klíč. Dokončí 1.7 (Reset hesla) — sdílí stejnou mailer infru.
**Kdy:** Krok 1.7.

---

## Částečně řešené (zbývající práce)

### D-009 — BE `code` field v error responses (rolling)
**Soubor:** `Projekt-ikaros/backend/src/modules/**/*.service.ts`
**Stav:** Pattern aplikovaný na 7 míst napříč moduly (`admin.service`, `worlds.service` 2×, `users.service`, `characters.service`, `pages.service`, `ikaros-messages.service`). Codes: `EMAIL_TAKEN`, `USERNAME_TAKEN`, `WORLD_SLUG_TAKEN`, `WORLD_ALREADY_MEMBER`, `CHARACTER_SLUG_TAKEN`, `PAGE_SLUG_TAKEN`, `JOIN_REQUEST_RESOLVED`.
**Zbývá:** `NotFoundException`, `ForbiddenException`, `BadRequestException` v dotyčných modulech. Postupné rolování při BE patchích — žádný blokátor.

---

### D-016 — BE auth audit (rolling)
**Soubor:** `Projekt-ikaros/backend/src/modules/{worlds,npc-templates,maps,universe}/*.controller.ts`
**Stav:** **4 read-modules** dostaly `OptionalJwtAuthGuard` na findAll/findBySlug/findOne (worlds), findAll/findOne (npc-templates), findByWorld/findActive/findById (maps), findByWorld (universe). Write endpointy v timeline / world-weather / world-calendar-config už guards měly před auditem.
**Zbývá ověřit:** `world-news` (PUBLIC catalog — záměr), `users.profile/:id` a `users.exists/:username` (PUBLIC pro registrační UX — záměr), `map-templates` (PUBLIC katalog — záměr), `IkarosNews` (PUBLIC — záměr), `system-presets` (PUBLIC — záměr). Tyto endpointy ZŮSTÁVÁJÍ veřejné — ne security holes.
**Zbývá zvážit:** Variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model — samostatný spec po 1.3c.
**Soubor:** `Projekt-ikaros/backend/src/modules/{timeline,world-weather,world-calendar-config,maps,map-templates,worlds,users,...}/*.controller.ts`
**Problém:** Audit při D-008 (1.2g) odhalil, že **43 endpointů** v BE nemá žádný JWT guard. Některé jsou legitně public (`auth/login`, `auth/register`, `auth/refresh`, `IkarosNews findAll`, `push/vapid-public-key`, `system-presets`), ale **většina pravděpodobných security holes**:
- `timeline.create/update/delete` — kdokoli může editovat timeline ve světech
- `world-weather.create/update/delete/generate/setCurrentWeather/broadcast` — kdokoli může měnit počasí
- `world-calendar-config.put` — kdokoli může měnit kalendářovou konfiguraci
- `worlds.findAll/findBySlug/findOne/getMembers` — list/detail světů (může být legit public, vyžaduje rozhodnutí)
- `users.profile/:id`, `users.exists/:username` — public profil + check (legit pro registrační UX, ale potenciální user enumeration)
- `npc-templates.findAll/findOne` — read templates (asi auth?)
- `maps.findByWorld/findActive/findById`, `map-templates.findAll/findById` — read maps (auth?)

**Dopad:** Vysoký — neoprávněná úprava produkčních dat ve světech. Každý endpoint vyžaduje per-endpoint rozhodnutí (public vs auth), ne mechanický refactor.

**Řešení:** Plný BE audit. Pro každý unguarded endpoint rozhodnout: (a) přidat `@UseGuards(JwtAuthGuard)` pokud má být chráněný; (b) nechat bez guardu pokud má být public (a explicitně doložit komentářem v controlleru). Po dokončení zvážit přechod na variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model.

**Kdy:** Před produkčním nasazením. Vyžaduje aktivní review s PJ, ne autonomní implementace. Samostatný spec. **Blokátor:** Per-endpoint rozhodnutí (~43 voleb) musí dodat PJ — Claude nemůže autonomně rozhodnout, které world endpointy mají být public (např. veřejný katalog světů) vs chráněné. Doporučuju otevřít samostatný spec `1.3d-be-auth-audit.md` po dokončení 1.3b/c, kde projdeme ekndpoint po endpointu.

---

### D-012 — E-mail verifikace po registraci
**Soubor:** BE `auth` modul + FE `RegisterModal`
**Problém:** Po registraci v 1.2 je uživatel auto-loginován bez ověření e-mailu. Útočník může registrovat na cizí adresy.
**Dopad:** Střední — umožňuje fake účty + může spam citizens (toxické stížnosti od majitelů e-mailů).
**Řešení:** Verifikace e-mailem se sdílenou mailer infrastrukturou z 1.7 Reset hesla. Po registraci pošle ověřovací link, `User.emailVerified` field (přidán v 1.3a, default `false`). Funkčnost gate-ovaná na verified (např. odesílání zpráv).
**Kdy:** Po dokončení 1.7 (sdílí mailer infra). **Status 1.3a:** `emailVerified: boolean` field je v User schemě připravený. Změna emailu (PATCH /me s polem `email`) byla **odebrána z 1.3a** a přesunuta do 1.7, takže `emailVerified` zůstává nedotčený dokud nepřijde mailer. **Závislost:** Resend (nebo SES/Mailgun) účet + API klíč v `.env` — viz roadmap 1.7.

---

---

## Uzavřené

### D-001 — `window.location.href` při selhání refreshe → 404
**Soubor:** `src/api/client.ts` — response interceptor
**Opraveno v:** 1.2c — helper `logoutAndRedirectToLogin()` volá `router.navigate('/?openLogin=1')` + ukládá `LOGIN_INTENT_KEY` do sessionStorage (mimic `requireAuth` loaderu). Při auditu zjištěno, že route `/login` neexistuje — původní kód vedl uživatele na 404, ne jen na tvrdý reload. Po loginu skončí na původní cestě (deep-link).

---

### D-007 — `passwordHash` v `User` typu
**Soubor:** `src/types/index.ts`
**Opraveno v:** 1.1 — `passwordHash` field z `User` interface odstraněn, `Omit<User, 'passwordHash'>` v `AuthResponse.user` zrušen na `User`. Cleanup zaznamenán dodatečně v 1.2c.

---

### D-013 — BE chybí `.env.example` + slabé default secrets
**Soubor:** `Projekt-ikaros/backend/.env.example`
**Opraveno v:** 1.2d — `.env.example` rozšířen z 8 ř. na ~40 ř.: kompletní seznam 13 proměnných seskupených do sekcí (Runtime / Database / Auth / Push / Cloudinary), komentáře v češtině, instrukce pro generaci secrets (`openssl rand -hex 32`, `npx web-push generate-vapid-keys`). Odložené části: Joi schema validation = nový dluh **D-015**. Generace prod secrets zůstává jako deployment TODO (mimo kódový dluh).

---

### D-003 — BE endpoint `PATCH /api/users/me { themeId }` neexistuje
**Soubor:** `Projekt-ikaros/backend/src/modules/users/users.controller.ts` + `src/themes/useThemeSync.ts`
**Opraveno v:** 1.2e — nový endpoint `PATCH /api/users/me` s `JwtAuthGuard` přijímající `UpdateUserDto`. Theme se ukládá do `User.themeSettings.themeId` (existující freeform JSON; **žádná schema změna, žádná migrace**). Username change přes tento endpoint zakázán (Superadmin musí použít `/users/:id`). FE refactor `useThemeSync.ts`: read přes `user.themeSettings?.themeId`, send `{ themeSettings: { themeId } }`. +1 BE unit test (themeId merge).

---

### D-004 — `currentUserAtom` neobsahuje `themeId` field
**Soubor:** `src/types/index.ts` — User type / `src/themes/useThemeSync.ts`
**Opraveno v:** 1.2e — řešeno cestou C: top-level `themeId` field na User typu **nevytvořen**. Místo toho theme čteno z existujícího `user.themeSettings.themeId` přes type cast `(user.themeSettings as { themeId?: string } | undefined)?.themeId`. Akceptovatelný kompromis pro freeform JSON storage; přidání typed field by zvýšilo vazbu mezi `User` typem a theme registry bez praktického přínosu.

---

### D-014 — `LOGIN_INTENT_KEY` duplicitní hardcode na 4 místech
**Soubor:** `src/router.tsx`, `src/components/auth/LoginModal.tsx`, `src/components/auth/RegisterModal.tsx`, `src/api/client.ts` → sjednoceno v `src/auth/loginIntent.ts`
**Opraveno v:** 1.2h — nový shared modul `src/auth/loginIntent.ts` s exportem `LOGIN_INTENT_KEY` + helpery `saveLoginIntent(target)` a `consumeLoginIntent(): string | null`. Refactor 4 produkčních míst, smazán duplicitní lokální `isSafeRedirect` helper z LoginModal/RegisterModal (zahrnut v `consumeLoginIntent`). Sjednocen drobný drift filtru `target !== '/'` mezi client.ts a router.tsx. Defensive validace `isSafeRelativePath` při save i consume (XSS protection). Test soubory ponechány na string literal (testují observable storage state, ne implementaci).

---

### D-008 — Anon dostupnost veřejných endpointů (BE controller-level guards)
**Soubor:** `Projekt-ikaros/backend/src/modules/ikaros-{articles,gallery,discussions}/*.controller.ts` + nový `backend/src/common/guards/optional-jwt-auth.guard.ts`
**Opraveno v:** 1.2g — nový `OptionalJwtAuthGuard` (lokální opt-in pattern) jako "měkký" JWT guard: validní token populuje `req.user`, chybějící/invalid token nech projít s `req.user = undefined`. Class-level `@UseGuards(JwtAuthGuard)` přesunut na method-level: read endpointy (`findAll`, `findById`, `getPosts`) mají `OptionalJwtAuthGuard`, write/admin endpointy mají `JwtAuthGuard`. Service signatury read metod přijímají `role`/`username` jako optional; `findById` pro anon na non-Published / closed-pending vrací `NotFoundException` (no enumeration). +15 nových unit testů (anon scénáře). `ikaros-news` byl už správně (method-level pattern). Audit při tomto kroku odhalil další security holes v BE → nový dluh **D-016**.

---

### D-002 — Toast "Spojení obnoveno" při prvním připojení
**Soubor:** `src/api/hooks/useSocket.ts` — `useSocketInit`  
**Opraveno v:** 0.6 — `wasConnected.current = true` přesunuto na konec efektu, toast se nyní zobrazí jen při REconnect.

---

### D-005 — `currentUserAtom` plnohodnotná hydratace přes `/api/users/me`
**Soubor:** `src/api/hooks/useAuth.ts` + `src/components/auth/AuthBootstrap.tsx`
**Opraveno v:** 1.3a — nový hook `useCurrentUserHydration` v `useAuth.ts` volá `GET /users/me` (TanStack Query, klíč `['users', 'me']`) ihned po startu provider tree, přepíše `currentUserAtom` plnohodnotnými daty. `AuthBootstrap` mountuje obě fáze v root stromu (`main.tsx`). Po D-020 cleanup (viz níže) je `useAuthBootstrap` zúžen pouze na cleanup expirovaných tokenů; data v `currentUserAtom` přicházejí výhradně z `/me`.

---

### D-015 — BE Joi config validation (fail-fast při startu)
**Soubor:** `Projekt-ikaros/backend/src/app.module.ts` — `ConfigModule.forRoot`
**Opraveno v:** 1.3a / dluh cleanup — přidán `joi` (~50 KB), `validationSchema` s 13 proměnnými. Povinné: `MONGODB_URI`, `JWT_SECRET` (min 16 znaků), `JWT_REFRESH_SECRET` (min 16, **disallow shody s JWT_SECRET**), `JWT_REFRESH_TTL_DAYS`, `JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL`. Volitelné s warning logem při chybění: `VAPID_*` (push notifikace se vypnou), `CLOUDINARY_*` (image upload se vypne). `validate` callback validuje + logguje warningy přes Logger; `abortEarly: false` reportuje všechny chyby najednou. BE 816/816 testů projde.

---

### D-018 — BE validace `themeId` proti theme registry
**Soubor:** `Projekt-ikaros/backend/src/modules/users/dto/update-user.dto.ts`
**Opraveno v:** 1.3a / dluh cleanup — `UpdateUserDto.themeId` zúžen z volného `IsString` na `IsIn(VALID_THEME_IDS)` enum (21 ID kopírovaných z FE registry). Komentář upozorňuje na duplicity SSoT (FE `themes/registry.ts`). BE odmítne neplatné theme ID s 400 (class-validator).

---

### D-020 — JWT vs `/me` dedup (cleanup po D-005)
**Soubor:** `src/api/hooks/useAuth.ts` + `src/api/hooks/useAuth.spec.tsx`
**Opraveno v:** 1.3a / dluh cleanup — `useAuthBootstrap` dříve zapisoval **minimal user** z JWT decode do `currentUserAtom`. Data byla subset `/users/me` (chybělo avatar, bio, themeId, …) a vedla k UI flashům po prvním fetch. `useAuthBootstrap` teď řeší pouze cleanup expirovaného tokenu; `currentUserAtom` zůstává `null` až do prvního úspěšného `/me` fetch (typicky 50-200 ms). Header komponenty mají `if (!user) return null;` ochranu, žádná regrese. Test suite aktualizována (4 testy, jeden přepsaný — JWT decode už v atomu nepíše).

---

### D-010 — GDPR souhlas + Podmínky použití při registraci (částečně)
**Soubor:** BE `User` schema + `RegisterDto` + `auth.service` ; FE `registerSchema`, `RegisterModal`, `TermsPage`, router
**Opraveno v:** 1.3a / dluh cleanup — kompletní **kostra** flow:
- BE: `User.acceptedTermsAt` Date field (default undefined), `RegisterDto.acceptedTerms` (`@Equals(true)` přes `@IsOptional` pro zpětnou kompatibilitu), `AuthService.register` zapíše čas souhlasu při registraci.
- FE: `registerSchema.acceptedTerms` zod refine na `true` (povinný checkbox), `RegisterModal` zobrazuje checkbox s linkem na `/podminky`, target="_blank".
- Nová stránka `TermsPage.tsx` na `/podminky` s **placeholder textem** (5 sekcí: účel, GDPR, pravidla, smazání účtu, změny). Před prod nasazením musí PJ dodat finální právní text.

**Zbytkový blokátor:** PJ dodává finální text Podmínek použití (právní konzultace doporučená). Před prod také zvážit přepnutí `acceptedTerms` z optional na required na BE.

---

### D-011 — Honeypot proti registračním botům (částečně, captcha čeká)
**Soubor:** `RegisterDto.hp` + `registerSchema.hp` + `RegisterModal` skryté pole
**Opraveno v:** 1.3a / dluh cleanup — **honeypot část**:
- BE: `RegisterDto.hp` (`@IsOptional() @MaxLength(0)`) — pokud bot vyplní, validace odmítne s 400.
- FE: `registerSchema.hp` (`z.string().max(0)`) + skryté pole v `RegisterModal` (offscreen `position: absolute; left: -9999px`).

Honeypot odfiltruje **naivní boty** (hloupý form scraping). Pro produkci stále nutný plný captcha provider — viz **D-011 v sekci „Otevřené"**.

---

### D-009 — BE `code` field v error responses (částečně, rolling)
**Soubor:** `admin.service.ts`, `worlds.service.ts` (2×), `users.service.ts`, `characters.service.ts`, `pages.service.ts`, `ikaros-messages.service.ts`
**Opraveno v:** 1.3a / dluh cleanup — **7 míst** napříč moduly přepsáno z `throw new ConflictException('msg')` na `throw new ConflictException({ statusCode, message, code: '<CODE>' })`. Codes přidané: `EMAIL_TAKEN`, `USERNAME_TAKEN`, `WORLD_SLUG_TAKEN`, `WORLD_ALREADY_MEMBER`, `CHARACTER_SLUG_TAKEN`, `PAGE_SLUG_TAKEN`, `JOIN_REQUEST_RESOLVED`.

Zbývá: ostatní HttpException typy (NotFound/Forbidden/BadRequest) — viz **D-009 v sekci „Otevřené"**.

---

### D-016 — BE auth audit (částečně, rolling)
**Soubor:** `worlds.controller.ts`, `npc-templates.controller.ts`, `maps.controller.ts`, `universe.controller.ts`
**Opraveno v:** 1.3a / dluh cleanup — **4 read-moduly** dostaly `OptionalJwtAuthGuard` (z 1.2g `D-008`) na all read endpointech (`findAll/findBySlug/findOne` v worlds, `findAll/findOne` v npc-templates, `findByWorld/findActive/findById` v maps, `findByWorld` v universe). Audit potvrdil, že write endpointy v timeline / world-weather / world-calendar-config **už měly** `JwtAuthGuard` na class-level.

Public endpointy ponechány bez guardu se záměrem (komentář v controlleru): `world-news`, `users.profile/:id`, `users.exists/:username`, `map-templates`, `IkarosNews`, `system-presets`, `push/vapid-public-key`.

Zbývá: zvážit Variantu B (`APP_GUARD` + `@Public()`) pro vynucený opt-in model — samostatný spec.
