# error-contract / 04-auth-leak — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno:
- Guardy: `JwtAuthGuard`, `AdminGuard`, `RolesGuard`, `OptionalJwtAuthGuard`
- `HttpExceptionFilter` (catch-all, post-F1)
- `worlds.service.ts` — `applyDetailScope` (no-leak 404 pro private svět)
- `pages.service.ts` — `assertCanViewWorld` (403 `WORLD_ACCESS_DENIED` pro nečlena privátního světa)
- `chat.service.ts` — `assertCanViewWorldChat` (403 `WORLD_ACCESS_DENIED` pro nečlena)
- `characters.service.ts` + `characters.controller.ts` — žádný world-level gate na read endpointech
- `sounds.service.ts` + `world-sounds.controller.ts` — žádný world-level gate na `findByWorld`
- `campaign.service.ts` — `getWorldRole` (403 `NOT_A_MEMBER` pro nečlena)
- `world-calendar-config.service.ts` — `assertCanRead` + `assertCanWrite` (403 `NOT_WORLD_MEMBER` pro nečlena)
- `auth-leak-policy.md` (BE rules)
- FE: `client.ts` interceptor, `WorldLayout`, `WorldNotFound`, `PageViewerPage`, `PublicUserProfilePage`
- Scanner výstup `errors.txt` (RUN 2026-06-20)

## Dosažená L vs cílová L

- **Cílová L:** L4 (e2e shape probe + parity)
- **Dosažená L:** L3 (statická analýza + dosažitelnost + kontext; bez live infra — viz PROOF-REQUEST)

## Nálezy

### EC-RUN-01 — `AL` Čistá existence leak: characters read endpointy bez world-level gate — neautentizovaný/nečlenský read ze soukromého světa

**Kde:**
- `characters.controller.ts:52-57` — `GET /worlds/:worldId/characters/directory` — **bez jakéhokoliv guardu** (ani JWT). `getDirectory()` nevolá žádný world-privacy check.
- `characters.controller.ts:37-42` — `GET /worlds/:worldId/characters` — JwtAuthGuard, ale `findByWorld()` nekontroluje world privacy.
- `characters.controller.ts:70-81` — `GET /worlds/:worldId/characters/:slug` — JwtAuthGuard, ale `findBySlug()` nekontroluje world privacy.
- `characters.controller.ts:44-50` — `GET /worlds/:worldId/characters/players` — JwtAuthGuard, bez world-privacy check.
- `characters.controller.ts:59-68` — `GET /worlds/:worldId/characters/by-user/:userId` — JwtAuthGuard, `findByUser()` vrací null bez privacy check.

**Dopad:**
- `/directory`: **Kdokoliv včetně neautentizovaných** (anonymní HTTP request) dostane jméno, slug, imageUrl všech postav **privátního světa** — žádný JWT ani membership check. Spec tento endpoint označil jako "Veřejný adresář postav" (roadmap.md:177), ale nedomyslel interakci s `accessMode=private`.
- `/characters` (list + slug + players): Jakýkoliv přihlášený uživatel (mimo svět) dostane `CharacterPublicView` postav privátního světa.
- **Kontrast:** `pages.service` a `chat.service` mají shodnou situaci (R-09b) opravenu — `assertCanViewWorld` vracející 403. Characters modul tuto opravu nedostal.

**Závažnost:** 🟠 (leak reálně dosažitelný bez členství; directory dokonce bez JWT)

**Návrh:**
- `/directory`: přidat `OptionalJwtAuthGuard` + kontrolu `world.accessMode` — privátní svět bez JWT → 403 anon anti-leak; s JWT ale bez membership → 403 `WORLD_ACCESS_DENIED`.
- `/characters`, `/characters/:slug`, `/players`: doplnit `assertCanViewWorld` vzor z `pages.service` (403 `WORLD_ACCESS_DENIED` pro nečlena privátního světa, per auth-leak-policy „auth-required, existuje ale není můj → 403").

**L3** · 🆕

---

### EC-RUN-02 — `AL` Sounds world endpoint bez world-level gate

**Kde:** `world-sounds.controller.ts:37-42` — `GET /worlds/:worldId/sounds` — JwtAuthGuard, ale `findByWorld()` (`sounds.service.ts:52-54`) nekontroluje world privacy.

**Dopad:** Přihlášený nečlen privátního světa dostane seznam zvuků. Méně citlivé než postavy, ale konzistentně chybí world-level gate. Comparátor: `assertCanManageWorld` (write operace) gate na PomocnyPJ+, ale read žádný.

**Závažnost:** 🟡 (zvuky jsou méně citlivá data, ale princip nekonzistence)

**Návrh:** Přidat world-member check do `findByWorld` nebo jako middleware v controlleru (vzor: campaign `getWorldRole`/`NOT_A_MEMBER`).

**L3** · 🆕

---

### EC-RUN-03 — `AL` Nekonzistence 403 vs 404 pro private svět na různých vrstvách (worlds vs pages/chat)

**Kde:**
- `worlds.service.ts:199-213` (`applyDetailScope`) — přihlášený nečlen privátního světa → **404** `WORLD_NOT_FOUND` (záměrné no-leak chování, viz komentář)
- `pages.service.ts:841-863` (`assertCanViewWorld`) — přihlášený nečlen → **403** `WORLD_ACCESS_DENIED` (záměrné dle komentáře na ř. 839: "403 dle rozhodnutí")
- `chat.service.ts:205-226` (`assertCanViewWorldChat`) — přihlášený nečlen → **403** `WORLD_ACCESS_DENIED`

**Dopad:** Hráč, který se dostal do privátního světa nepřímou cestou (přímý odkaz na stránku), dostane na `/worlds/slug/:slug` 404 (→ `WorldNotFound`), ale na `/worlds/:worldId/pages/:slug` 403 (→ `AccessDenied`). FE WorldLayout zobrazí `WorldNotFound` pro oba případy (testuje `!world`), ale subpage (PageViewerPage) zobrazí `AccessDenied` pokud worldId existuje v contextu z jiné cache. Konzistentní jen náhodou.

**Závažnost:** ⚖️ (odlišné záměrné rozhodnutí ve dvou vrstvách — by-design, ale nedokumentované jako architektonické rozhodnutí; cross-ref K-EC6)

**Návrh:** Kodifikovat rozhodnutí: buď world-detail vždy 404 (silná ochrana, `pages/chat` přejdou na 404 taktéž), nebo vždy 403 pro auth-required (per policy). Aktuální stav = nekonsistentní, ale obranně-přijatelný.

**L3** · ♻️ (K-EC6 eskalace)

---

### EC-RUN-04 — `AL` JwtAuthGuard vrací 401 pro anonymní přístup, policy říká 403

**Kde:** `jwt-auth.guard.ts` — passport-jwt AuthGuard default: missing/invalid token → **401 UnauthorizedException** (bez override `handleRequest`).

**Auth-leak-policy.md řádek 9:** "Anonymní (bez JWT) | 403 anti-leak"

**Dopad:** Anonymní request na chráněný endpoint dostane 401, ne 403. FE interceptor na 401 spustí refresh cycle → selže → `logoutAndRedirectToLogin()`. Z pohledu uživatele funguje (redirect na login), ale:
- FE refresh na 401 u anonymního requestu je zbytečný RTT (refresh cookie chybí → refresh selže hned)
- Info o existenci endpointu může být inferencována z `401 vs 403`

**Závažnost:** 🟡 (funkčně neviditelné uživateli — FE redirect funguje; minimální info-leak; refresh je zbytečný RTT)

**Návrh:** Aktualizovat dokumentaci auth-leak-policy.md aby odlišovala "missing token → 401" (správné pro FE refresh) vs "invalid token + forbidden resource → 403". Alternativně přijmout aktuální stav jako by-design.

**L3** · 🆕 (⚖️ by-design)

---

### EC-RUN-05 — `AL` RolesGuard `false` → 403 bez doménového `code`

**Kde:** `roles.guard.ts:21` — `return false` → NestJS default `ForbiddenException({message:'Forbidden',statusCode:403})` bez `code` → filtr fallback `code='FORBIDDEN'` (generický).

Použito: `admin.controller.ts:196,344` + `global-chat.controller.ts:180`.

**Dopad:** Admin endpoint vrátí `{error:{code:'FORBIDDEN',message:'Forbidden'}}` — FE zobrazí generickou hlášku (toast). Aktuálně admin endpointy nemají FE-side domain-code handling pro 403 → generic fallback je OK.

**Závažnost:** 🟡 (admin UI, edge case, funkčně přijatelné)

**Návrh:** Přidat `throw new ForbiddenException({code:'INSUFFICIENT_ROLE', message:'Nedostatečná oprávnění'})` do `canActivate` místo `return false`, nebo doplnit doménový kód do NestJS guard via `handleRequest` override.

**L3** · ♻️ (K-EC6 osa kontrolní bod "Guard bez kódu")

---

## PROOF-REQUEST

**PR-04-1** `M-SHAPE` pro characters module: supertest `GET /worlds/{private-worldId}/characters/directory` bez JWT → assert 403 (ne 200). Aktuálně predikuji 200 — čtením ověřeno, nutný live e2e k potvrzení.

**PR-04-2** `M-SHAPE` pro sounds: supertest `GET /worlds/{private-worldId}/sounds` s valid JWT (non-member) → assert 403. Predikuji 200.

**PR-04-3** `M-SHAPE` parita worlds vs pages: supertest `GET /worlds/slug/{private-slug}` (non-member JWT) → 404; pak `GET /worlds/{worldId}/pages/{slug}` (non-member JWT) → 403. Ověří live nekonzistenci EC-RUN-03.

**PR-04-4** Smoke: anonymní `GET /worlds/{worldId}/characters/directory` → HTTP 200 v prod (unauthenticated curl). Pokud 200 → EC-RUN-01 potvrzena live.
