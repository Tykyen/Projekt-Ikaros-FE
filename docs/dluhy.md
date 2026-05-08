# Technické dluhy

## Otevřené

### D-003 — BE endpoint `PATCH /api/users/me { themeId }` neexistuje
**Soubor:** `src/themes/useThemeSync.ts` — outbound sync useEffect
**Problém:** FE volá `api.patch('/users/me', { themeId })` při změně tématu, ale backend tento endpoint nepodporuje. FE chytá 404 a tichý `console.warn`, takže UX není narušen — ale theme se nepersistuje cross-device.
**Dopad:** Střední — funkčnost themingu funguje per-device přes localStorage; cross-device synchronizace chybí dokud BE nepřidá endpoint.
**Řešení:** BE-tým přidá `themeId: string` field do User entity, `PATCH /api/users/me` accept tento field, GET `/api/auth/me` (`/users/me`) vrátí ho v response.
**Kdy:** Po dokončení Iterace A, koordinace s BE-týmem v rámci dalšího sprintu.

---

### D-004 — `currentUserAtom` neobsahuje `themeId` field
**Soubor:** `src/types/index.ts` — User type / `src/store/authStore.ts` — currentUserAtom
**Problém:** Po BE změně (D-003) bude `User.themeId` vrácen z `/auth/me`, ale FE typ ho neobsahuje. Initial sync v `useThemeSync` ho čte přes type cast `(user as { themeId?: string }).themeId` — funkční ale bez type safety.
**Dopad:** Nízký — kód funguje, jen type cast místo proper typu.
**Řešení:** Po D-003 přidat `themeId?: ThemeId` do `User` typu v `src/types/index.ts`. Odstranit type cast v `useThemeSync.ts`.
**Kdy:** Při řešení D-003.

---

### D-001 — `window.location.href` při selhání refreshe
**Soubor:** `src/api/client.ts` — response interceptor  
**Problém:** Při selhání token refreshe (nebo chybějícím refresh tokenu) se provádí `window.location.href = '/login'` — tvrdý reload místo React Router navigate. Ztratí se router state.  
**Dopad:** Nízký — funkčně správně, jen UX drobnost.  
**Řešení:** Exportovat router z `router.tsx` a volat `router.navigate('/login')` místo `window.location.href`.  
**Kdy:** Při práci na 0.4 nebo auth fázi.

---

### D-005 — `currentUserAtom` plnohodnotná hydratace přes `/api/users/me`
**Soubor:** `src/api/hooks/useAuthBootstrap.ts` (vytvořen v 1.1)
**Problém:** Po refreshi stránky FE hydratuje `currentUserAtom` jen z JWT decode (id, email, username, role, characterPath, ikarosSkin). Ostatní pole (`displayName`, `avatarUrl`, `themeSettings`, `chatPreferences`, …) zůstanou prázdná dokud uživatel manuálně nenavštíví profilovou stránku.
**Dopad:** Nízký — hlavička v 1.1 vystačí s `username` + `role`. Pro 1.3 (profil + avatar) je nutné `/me` volání při bootstrapu.
**Řešení:** V `useAuthBootstrap` po JWT decode zavolat `GET /api/users/me` a přepsat `currentUserAtom` plnou odpovědí. Doplnit error handling (401 → logout flow).
**Kdy:** Krok 1.3 Uživatelský profil.

---

### D-007 — `User` typ má `passwordHash` field, ale `Omit<User, 'passwordHash'>` v `AuthResponse`
**Soubor:** `src/types/index.ts` — `User` interface
**Problém:** FE typ `User` definuje `passwordHash` (no-op — BE ho nikdy nevrací), `AuthResponse.user` má `Omit<User, 'passwordHash'>`. Drobná inkonzistence — FE nikdy `passwordHash` nepotřebuje.
**Dopad:** Velmi nízký — kód funguje, jen typové smetí.
**Řešení:** Odstranit `passwordHash` z `User` typu, smazat `Omit` v `AuthResponse`.
**Kdy:** Kdykoli při dotyku auth typů (např. v 1.2 nebo 1.3).

---

### D-008 — Anon dostupnost veřejných endpointů (BE controller-level guards)
**Soubor:** `Projekt-ikaros/backend/src/modules/{ikaros-articles,ikaros-gallery,ikaros-discussions,ikaros-news}/*.controller.ts`
**Problém:** Krok 1.1 udělal IkarosLayout veřejný (anon vidí články, galerii, diskuze, novinky). Nutné ověřit, že BE controllery `GET` endpointy nemají `@UseGuards(JwtAuthGuard)` na třídní úrovni — jinak anon dostane 401.
**Dopad:** Střední — pokud guard existuje, anon vidí prázdný layout místo obsahu.
**Řešení:** Audit controllerů, BE patch (přesun guardů na write endpointy / `@Public()` decorator na read endpointy).
**Kdy:** Kroky 3.2-3.4 (Články / Galerie / Diskuze) — kdy se reálně data plní z FE.

---

### D-009 — BE `code` field v error responses napříč moduly
**Soubor:** `Projekt-ikaros/backend/src/modules/**/*.{service,controller}.ts`
**Problém:** Krok 1.2 zavádí `ConflictException` s `code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN'` pro field-level mapping na FE. Ostatní moduly stále vracejí jen `message` string, který je křehké parsovat (lokalizace, překlepy).
**Dopad:** Nízký — ovlivní jen chyby, kde FE chce field-level mapping. Většina chyb si vystačí s banner message.
**Řešení:** Zavést konvenci `{ statusCode, message, code: '<DOMAIN>_<REASON>' }` napříč moduly. Postupné rolování při dotyku.
**Kdy:** Postupné — kdykoli BE patch dotyká error response.

---

### D-010 — GDPR souhlas + Podmínky použití při registraci
**Soubor:** `src/components/auth/RegisterModal.tsx` (1.2) + nová legal stránka
**Problém:** RegisterModal v 1.2 nemá checkbox "Souhlasím s podmínkami". Pro evropskou veřejnou platformu (GDPR) je to právní požadavek před produkčním nasazením.
**Dopad:** Pro MVP / interní testování nízký. Pro veřejné nasazení vysoký (právní riziko).
**Řešení:** Vytvořit statickou stránku `/podminky` (text dodá PJ / právní konzultace), přidat checkbox do RegisterModalu (zod refine `accepted: true`), uložit `acceptedTermsAt` do `User` entity (BE patch).
**Kdy:** Před produkčním nasazením — samostatný spec.

---

### D-011 — Captcha / honeypot proti registračním botům
**Soubor:** `src/components/auth/RegisterModal.tsx` (1.2) + BE `auth` modul
**Problém:** RegisterModal v 1.2 chrání jen rate limitem (10/min/IP). Pro veřejnou platformu nedostatečné — botnety s tisíci IP projdou.
**Dopad:** Pro MVP nízký. Pro veřejné nasazení střední (spam účty).
**Řešení:** hCaptcha (free, GDPR-friendly) nebo Cloudflare Turnstile (free). Honeypot field (skryté pole, pokud vyplněno → odmítnout) jako levný bonus.
**Kdy:** Před produkčním nasazením.

---

### D-012 — E-mail verifikace po registraci
**Soubor:** BE `auth` modul + FE `RegisterModal`
**Problém:** Po registraci v 1.2 je uživatel auto-loginován bez ověření e-mailu. Útočník může registrovat na cizí adresy.
**Dopad:** Střední — umožňuje fake účty + může spam citizens (toxické stížnosti od majitelů e-mailů).
**Řešení:** Verifikace e-mailem se sdílenou mailer infrastrukturou z 1.7 Reset hesla. Po registraci pošle ověřovací link, `User.emailVerifiedAt` field. Funkčnost gate-ovaná na verified (např. odesílání zpráv).
**Kdy:** Po dokončení 1.7 (sdílí mailer infra). Samostatný spec.

---

---

## Uzavřené

### D-002 — Toast "Spojení obnoveno" při prvním připojení
**Soubor:** `src/api/hooks/useSocket.ts` — `useSocketInit`  
**Opraveno v:** 0.6 — `wasConnected.current = true` přesunuto na konec efektu, toast se nyní zobrazí jen při REconnect.
