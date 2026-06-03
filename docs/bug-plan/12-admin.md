# 12 — Admin & platforma

Platformový admin hub (`/admin`): správa uživatelů, role hierarchie, audit log, statistiky, search-index monitoring, upload pipeline (Cloudinary) a GDPR data export. Skin selector žije v pravém panelu layoutu (IkarosLayout), nikoli v PlatformAdminPage.

**BE:** `admin` (controller, service, admin-stats.service, hierarchy helper, audit-log repository), `stats` (search-index hub), `data-export`, `upload`, `images`, `system-presets`
**FE:** `features/admin` (PlatformAdminPage, OverviewTab, UsersAdminTab, AuditLogTab, SearchIndexTab, RoleGuard), `themes/ThemeSwitcher` (skin selector v pravém panelu), routy `/admin`, `/admin/dungeon-builder`, `/ikaros/admin/emotes`

---

## A. Admin přístup & role gating

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AD-01 | `GET /admin/stats/overview` je chráněn `AdminGuard` (role ≤ 2); PJ (role=3) dostane 403 `[auto]` | M4 | ⬜ |
| AD-02 | `GET /admin/users`, `PATCH /admin/users/:id/role`, `POST /admin/users` — všechny mají `AdminGuard`; neautentizovaný požadavek → 401 `[auto]` | M4 | ⬜ |
| AD-03 | `PATCH /admin/users/:id/admin-permissions` má `RolesGuard` + `@Roles(Superadmin)` — Admin (role=2) dostane 403 (RolesGuard vrací `false`, nikoliv `ForbiddenException`) `[auto]` | M4 | ⬜ |
| AD-04 | `GET /stats/search` a `POST /stats/search/rebuild` mají na controlleru `@UseGuards(JwtAuthGuard, AdminGuard)` — PJ dostane 403 `[auto]` | M4 | ⬜ |
| AD-05 | `GET /admin/recent-pages` má `@Roles(Superadmin, Admin, PJ)` — Hrac (role=5) dostane 403; PJ smí `[auto]` | M4 | ⬜ |
| AD-06 | FE `RoleGuard` na routě `/admin` porovnává `user.role` s `[Superadmin, Admin]`; jiná role zobrazí `ForbiddenPage` (ne redirect na login) `[auto]` | M4 | ⬜ |
| AD-07 | `AdminGuard.canActivate` vyhazuje `ForbiddenException` (ne vrací `false`) při chybějícím `user` objektu — nezanechává endpoint nezabezpečený `[auto]` | M4 | ⬜ |
| AD-08 | `assertCanChangeRole`: Admin nesmí měnit roli jiného Admina ani povýšit kohokoliv na Admin+ — obojí → 403 `INSUFFICIENT_ROLE` `[auto]` | M4 | ⬜ |
| AD-09 | `assertCanChangeRole`: Self-change i pro Superadmina → 403 `SELF_MODIFICATION` `[auto]` | M4 | ⬜ |
| AD-10 | `assertCanModerate`: Admin DELETE bez `canModerateContent` → 403 `MISSING_PERMISSION`; s příznakem → OK `[auto]` | M4 | ⬜ |
| AD-11 | `assertCanModerate`: Admin nesmí banovat jiného Admina → 403; Superadmin smí `[auto]` | M4 | ⬜ |
| AD-12 | `setAdminPermissions` (service): Self-edit Superadminem → 400 `SELF_FORBIDDEN`; cílový user není Admin → 400 `NOT_ADMIN` `[auto]` | M4 | ⬜ |
| AD-13 | FE `UsersTable`: sekce `adminPermissions` checkboxů se zobrazí jen pro `isSuperadmin && u.role === Admin && !isSelf` — běžný Admin je nevidí `[human]` | M4 | ⬜ |
| AD-14 | FE `useAdminSetAdminPermissions` volá `POST` na `/admin/users/:id/admin-permissions` — BE endpoint je `PATCH`; zkontrolovat shodu HTTP metody `[auto]` | M4 | ⬜ |
| AD-15 | `RolesGuard`: když metadata `requiredRoles` chybí (dekorátor `@Roles` nedán), guard propustí bez kontroly — nezpůsobí nežádoucí otevřené endpointy `[auto]` | M4 | ⬜ |
| AD-16 | Superadmin nesmí měnit vlastní roli ani se banovat — service volá `assertCanChangeRole`/`assertCanModerate` vždy s `actor.id === target.id` → 403 `[auto]` | M4 | ⬜ |

## B. Statistiky & audit log

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AD-17 | `AdminStatsService.getOverview`: každá metrika obalena `safe()` — výjimka jednoho repozitáře → metrika=0, ostatní nedotčené, endpoint vrátí 200 `[auto]` | M1 | ⬜ |
| AD-18 | Všech 9 dílčích volání v `getOverview` běží paralelně (`Promise.all`) — výjimka u více metrik zároveň stále vrátí 200 se všemi chybovými=0 `[auto]` | M1 | ⬜ |
| AD-19 | `PRESENCE_THRESHOLD_HOURS` ENV nevalidní nebo chybějící → fallback 25 hodin; záporná hodnota → fallback 25 `[auto]` | M1 | ⬜ |
| AD-20 | FE `OverviewTab`: při `isError=true` zobrazí `role="alert"`; data=undefined → metriky padají na `?? 0`, nevyhazuje runtime chybu `[auto]` | M1 | ⬜ |
| AD-21 | FE `useAdminStats`: `staleTime=60_000` — dashboard nespouští zbytečné refetche při rychlém přepínání tabů `[human]` | M1 | ⬜ |
| AD-22 | `GET /admin/audit-log`: filtr `action`, `actorId`, `targetId`, `targetType` kombinovaně — repozitář aplikuje jen předané parametry, prázdný string není filtrován `[auto]` | M1 | ⬜ |
| AD-23 | Audit log je read-only (GET); service nemá žádný write endpoint pro audit — přímé zápisy jsou možné jen přes interní `audit()` helper `[human]` | M1 | ⬜ |
| AD-24 | `audit()` helper je best-effort (`try/catch` bez re-throw) — výjimka auditního repozitáře nesmí blokovat business logiku (ban, role change atd.) `[auto]` | M1 | ⬜ |
| AD-25 | FE `AuditLogTab`: `ACTION_LABELS`/`ACTION_CLASS` obsahují všechny hodnoty `AdminAuditAction` — chybějící klíč by způsobil `undefined` label nebo CSS chybu při renderování nového type `[human]` | M1 | ⬜ |
| AD-26 | Paginace audit logu: `limit` max 100 (controller), FE posílá `limit=20`; strana 2 offsetována správně `skip=(page-1)*limit` `[auto]` | M1 | ⬜ |
| AD-27 | `listAuditLog` v controlleru přijímá `targetType` jako query param a předává ho do repozitáře — filter `targetType` funguje `[auto]` | M1 | ⬜ |
| AD-28 | `onUserDeletionRequested` event handler: pokud `isModeration=true`, skip (admin akce auditovaná synchronně) — žádný double-audit `[auto]` | M1 | ⬜ |

## C. Search index monitoring

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AD-29 | `POST /stats/search/rebuild` vrátí 202 okamžitě; rebuild běží asynchronně (`void coordinator.rebuildIndex()`) — chyba logovaná, nehodí 500 klientovi `[auto]` | M1 | ⬜ |
| AD-30 | `POST /stats/search/reindex`: bez `slug` ani `pageId` → vrátí `{ message }` bez DB volání; s `slug` → hledá přes `findAll()` (potenciálně pomalé — celá kolekce stránek) `[human]` | M1 | ⬜ |
| AD-31 | FE `SearchIndexTab`: `refetchInterval=5000` — stats se live obnovují během rebuildu; po úspěšném rebuild se invaliduje query key `[auto]` | M1 | ⬜ |
| AD-32 | FE `SearchIndexTab`: rebuild tlačítko disabled při `rebuild.isPending`; ConfirmDialog zabrání dvojitému odeslání `[auto]` | M1 | ⬜ |
| AD-33 | FE `useRebuildSearchIndex` volá `POST /stats/search/rebuild`; BE vrátí 202 (ne 200) — zkontrolovat že axios/fetch nevyhodí jako chybu `[human]` | M1 | ⬜ |
| AD-34 | FE `SearchIndexStats` typ má pole `lastEmbeddedAtUtc` jako optional string — pokud BE vrátí `null`, FE zobrazí `'—'` (ne crash) `[auto]` | M1 | ⬜ |

## D. Upload pipeline (Cloudinary, avatary, assety)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AD-35 | `POST /upload/image` má inline role check `user.role > UserRole.Admin` (ne guard) — hodnota `role` pochází z JWT payload; Admin (role=2) propuštěn, PJ (role=3) → 403 `[auto]` | M4 | ⬜ |
| AD-36 | `POST /upload/content-image` nemá role check — každý přihlášený smí nahrát obrázek do rich-textu; správné dle spec `[human]` | M5 | ⬜ |
| AD-37 | `POST /upload` (chat file) ověřuje `channelId` + `findChannelForUpload` před uplodem — neoprávněný uživatel nemůže nahrát do cizího kanálu `[human]` | M5 | ⬜ |
| AD-38 | `uploadImageToFolder` (gallery/platform/content): Cloudinary fail → disk fallback (`saveImageToDisk`), vrací `/static/<folder>/...` URL; nehodí BadGatewayException `[auto]` | M1 | ⬜ |
| AD-39 | Disk fallback `saveImageToDisk`: `BACKEND_BASE_URL` chybí v ENV → fallback `http://localhost:3000`; produkční URL musí být nastavena `[human]` | M5 | ⬜ |
| AD-40 | `uploadUserImage` (avatar): deterministický `public_id="main"` s `overwrite=true` → žádné orphan assety; při Cloudinary failu nedochází k disk fallbacku (hodí BadGatewayException) `[auto]` | M1 | ⬜ |
| AD-41 | `deleteImage` / `deleteAttachments` jsou best-effort — chyba Cloudinary destroy se jen loguje; neblokuje mazání zprávy ani prune job `[auto]` | M1 | ⬜ |
| AD-42 | `handleGlobalMessageDeleted` handler (event `chat.global.message.deleted`) — bez tohoto handleru by přílohy globálního chatu zůstaly orphan na Cloudinary po smazání zprávy `[auto]` | M1 | ⬜ |
| AD-43 | MIME whitelist: `image/svg+xml` je povolen pro avatary `uploadUserImage` — SVG může obsahovat JS (XSS riziko při inline zobrazení); Cloudinary transformace (WebP convert) SVG nezpracuje `[human]` | M5 | ⬜ |
| AD-44 | `CLOUDINARY_URL` chybí → service zaloguje error a `cloudName=""` zůstane prázdný; upload volání selžou s BadGatewayException; server nespustí → systémová kontrola ENV `[human]` | M5 | ⬜ |
| AD-45 | `GET /images/*` (ImagesController) čte `CLOUDINARY_CLOUD_NAME` jako separátní ENV proměnnou (oproti `CLOUDINARY_URL` v UploadService) — risk drift při přejmenování ENV `[human]` | M5 | ⬜ |

## E. Data export (GDPR)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AD-46 | `GET /data-export/me` chráněn `JwtAuthGuard` (bez AdminGuard) — každý autentizovaný uživatel smí exportovat vlastní data `[auto]` | M4 | ⬜ |
| AD-47 | Export obsahuje `adminAuditLog` (záznamy kde `targetId=userId`, max 100) — uživatel vidí moderační akce nad sebou; `before`/`after` nejsou v exportu (privacy filter) `[human]` | M1 | ⬜ |
| AD-48 | `exportForUser`: 7 paralelních DB volání; selžou-li všechna najednou, výjimka se propaguje a endpoint vrátí 500 (na rozdíl od AdminStats, zde není `safe()` wrapper) `[human]` | M1 | ⬜ |
| AD-49 | Export neobsahuje `passwordHash` — `usersRepo.findById` vrátí plný User, ale `DataExportService` mapuje jen explicitní pole (bez `passwordHash`, `bannedAt`, `adminPermissions`) `[auto]` | M1 | ⬜ |
| AD-50 | `exportForUser` přijímá přátelství až 1000 (`listAcceptedForUser(userId, 1, 1000)`) — při >1000 přátelích dojde k tichému useknuti bez varování `[human]` | M1 | ⬜ |

## F. Skin selector & platformová nastavení

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AD-51 | Skin selector (ThemeSwitcher) žije v `IkarosLayout` pravém panelu pod sekcí „Administrace" — není součástí `PlatformAdminPage` tabů (odchylka od mockupů, záměrná) `[human]` | M5 | ⬜ |
| AD-52 | ThemeSwitcher je přístupný každému přihlášenému (není role-gated) — každý hráč si může změnit vlastní skin; správné dle spec `[human]` | M5 | ⬜ |
| AD-53 | Pravý panel se skrývá na `/chat*` cestách (`isChat` flag) — ThemeSwitcher tam není dostupný; uživatel nemůže změnit skin ve světovém chatu bez opuštění stránky `[human]` | M5 | ⬜ |
| AD-54 | `GET /system-presets` a `GET /system-presets/:system` nemají žádný auth guard — veřejné (anonymní) endpointy; správné dle spec `[auto]` | M4 | ⬜ |
| AD-55 | `system-presets.service.findAll()` vrací jen `{ system, displayName }` (bez `schema[]`) — šetří bandwidth; `findOne()` vrací plný preset; žádná DB závislost (in-memory) `[auto]` | M1 | ⬜ |

---

## Test coverage gaps

- **`AdminService.banUser/unbanUser`** — žádný unit test banování; chybí case: ban je idempotentní (409 ALREADY_BANNED) a ban-refresh-token revoke.
- **`AdminService.setAdminPermissions`** — žádný test v `admin.service.spec.ts`; NOT_ADMIN case (target není Admin) nekrytý.
- **`AdminService.bulkBan/bulkUnban/bulkRoleChange`** — žádné unit testy; best-effort (partial success) scénáře nekryty.
- **`AdminService.requestUserDeletion / cancelUserDeletion`** — žádné unit testy; SOLE_PJ_BLOCK scénář nekryt.
- **`DataExportService`** — žádné unit testy; partial failure (jedno DB volání selže) není kryto.
- **FE `AuditLogTab`** — žádné testy; `ACTION_LABELS` drift při přidání nového `AdminAuditAction` není zachycen.
- **FE `SearchIndexTab`** — žádné testy; rebuild flow (disabled tlačítko, ConfirmDialog, toast) není kryto.
- **FE `UsersAdminTab` + `UsersTable`** — žádné testy; bulk toolbar, ban modal, admin-permissions toggle nekryty.
- **`upload.service.spec.ts`**: `uploadUserImage` není testován vůbec (avatar pipeline s deterministickým publicId, overwrite, webp format).

## Známá rizika

- **FE/BE URL drift u deletion-request** (AD-35 oblast): FE `useAdminRequestDeletion` volá `POST /admin/users/:id/deletion-request`, ale BE controller endpoint je `POST /admin/users/:id/request-deletion` — invertovaný tvar segmentu; pokud axios nevrací 404, tiché selhání. Nutno ověřit.
- **SVG v avatar upload whitelist** (AD-43): `image/svg+xml` je povolen pro chat přílohy i galerii (ale nikoliv pro `uploadUserImage`). Cloudinary v image resource_type konvertuje SVG jen pokud má explicitní transformaci — bez ní může vrátit originální SVG; při inline zobrazení v prohlížeči XSS riziko.
- **DataExportService bez graceful degradace** (AD-48): Na rozdíl od `AdminStatsService`, export nemá `safe()` wrapper. Výpadek jednoho repozitáře (např. auditRepo) hodí 500 místo partial exportu — GDPR dopad (uživatel nemůže získat svá data).
