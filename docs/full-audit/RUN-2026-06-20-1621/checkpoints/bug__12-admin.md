# bug / 12-admin — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem veškerý kód v záběru oblasti:

**BE:**
- `admin.controller.ts` — všechny endpointy, guardy
- `admin.service.ts` — veškerá business logika (ban/unban/delete/cancel/role/permissions/audit)
- `admin-stats.service.ts` — getOverview + safe() wrapper
- `admin-friendships.service.ts` — listByUser/byPair/resetCooldown
- `helpers/hierarchy.ts` + `hierarchy.spec.ts` — assertCanChangeRole/assertCanModerate
- `repositories/admin-audit-log.repository.ts` + spec
- `admin.service.spec.ts` — pokrytí testů
- `stats.controller.ts` — search index monitoring, guardy
- `upload.controller.ts` + `upload.service.ts` — MIME whitelist, magic-byte, Cloudinary/disk fallback, event handlers
- `data-export.controller.ts` + `data-export.service.ts` — GDPR export
- `images.controller.ts` — redirect endpoint, ENV
- `system-presets.controller.ts` + service — anonymní endpointy
- `common/guards/admin.guard.ts` + `roles.guard.ts`
- `auth/strategies/jwt.strategy.ts` — JWT payload obsah

**FE:**
- `features/admin/api/useAdminUsers.ts` — všechny mutace + queries
- `features/admin/api/useAdminStats.ts` + `adminStats.types.ts`
- `features/admin/api/useSearchIndex.ts`
- `features/admin/components/RoleGuard.tsx`
- `features/admin/components/OverviewTab/OverviewTab.tsx`
- `features/admin/components/SearchIndexTab/SearchIndexTab.tsx`
- `features/admin/users/components/AuditLogTab/AuditLogTab.tsx`
- `features/admin/users/components/UsersTab/UsersTable.tsx`
- `features/admin/users/components/UsersTab/UsersFilters.tsx`
- `features/admin/components/UsersAdminTab/UsersAdminTab.tsx`
- `features/admin/pages/PlatformAdminPage.tsx`
- `app/router.tsx` — RoleGuard na /admin routě
- `shared/types/index.ts` — AdminAuditAction FE typ
- `shared/api/client.ts` — axios klient, 2xx handling

## Dosažená L vs cílová L

Cílová hloubka: L2 (M4 authn/authz osa) + L1 (zbývající osy).

Dosaženo:
- A (Auth & role gating): L2 — staticky přečteno + kontrakt RequestUser/JWT/guard
- B (Stats & audit log): L1/L2 — přečteno + porovnáno typy
- C (Search index): L1 — přečteno
- D (Upload pipeline): L1 — přečteno, svg XSS ošetřeno (UM-01 hotovo)
- E (Data export): L1 — přečteno
- F (Skin selector): L1 — přečteno

L3 (test coverage) není možné dosáhnout bez spuštění testů, jelikož unit testy pro banUser/requestUserDeletion/cancelUserDeletion chybí (prázdné v spec).

## Nálezy

### 🔴 Kritické

**N-AD-01** — [A/auth] `requestUserDeletion` a `cancelUserDeletion`: Admin s `canModerateContent=true` VŽDY dostane `MISSING_PERMISSION` · Kde: `admin.service.ts:471,561` × `helpers/hierarchy.ts:98-104` · Dopad: Oprávnění `canModerateContent` nelze fakticky delegovat na Adminy — DELETE/UNDELETE akcí zůstávají doménou pouze Superadmina, přestože spec říká jinak. `actor` přichází jako `RequestUser` (z JWT payload bez `adminPermissions`); service ho castuje `as unknown as User` ale `adminPermissions` v JWT payload není (JwtStrategy:19-25 nevrací). `setAdminPermissions` to řeší správně (findById actora), `banUser/requestUserDeletion/cancelUserDeletion` ne. · Návrh: načíst actora z DB před `assertCanModerate` pro DELETE/UNDELETE akce (jako v `setAdminPermissions:613`). · L2 · 🆕

**N-AD-02** — [A/kontrakt] FE param `hasPendingRequest` ≠ BE `hasPendingDeletion`: filtr „Čeká na smazání" je dead code · Kde: `useAdminUsers.ts:107` posílá `hasPendingRequest=true`; `admin.controller.ts:83` očekává `hasPendingDeletion` → BE dostane `undefined` → filtr se nikdy neaktivuje → admin vidí vždy VŠECHNY uživatele bez filtrování · Dopad: Admin nemůže zobrazit seznam uživatelů čekajících na smazání · Návrh: sjednotit na `hasPendingDeletion` (BE je canonical, FE params přejmenovat) · L2 · 🆕

### 🟠 Závažné

**N-AD-03** — [B/typ drift] `AuditLogTab` nezná `ACCOUNT_*` audit akce → undefined label + undefined CSS class při renderování · Kde: `AuditLogTab.tsx:7-31` ACTION_LABELS/ACTION_CLASS (FE `AdminAuditAction`); FE typ (`shared/types/index.ts:173-184`) nezahrnuje `ACCOUNT_DELETE_REQUEST`, `ACCOUNT_DELETE_CANCEL`, `ACCOUNT_SELF_DELETE_REQUEST`, `ACCOUNT_SELF_REACTIVATE`, `ACCOUNT_HARD_DELETE` — přitom BE (`admin-audit-log.interface.ts`) tyto hodnoty definuje a service je emituje. Při zobrazení takového záznamu: `<span class="undefined">undefined</span>` · Dopad: Audit log zůstane vizuálně rozbité pro moderační delete akce · Návrh: Synchronizovat FE `AdminAuditAction` typ s BE rozhraním; doplnit ACTION_LABELS + ACTION_CLASS záznamy pro chybějící hodnoty · L2 · 🆕

**N-AD-04** — [B/typ drift] `FRIENDSHIP_COOLDOWN_RESET` je v FE `AdminAuditAction` + `ACTION_LABELS` / `ACTION_CLASS`, ale BE nikde tuto hodnotu nevydává (admin-friendships.service neaudituje resetCooldown) · Kde: `AuditLogTab.tsx:14,27`; `shared/types/index.ts:181`; `admin-friendships.service.ts` — žádný `auditRepo.record()` volání · Dopad: mrtvý kód, matoucí při auditu (naznačuje feature, která není implementována); BE by mohl klouzat opačně pokud se audit přidá se špatným názvem · Návrh: (a) přidat audit volání do `resetCooldown`; nebo (b) odstranit z FE typy pokud záměrně nechceme logovat · L1 · 🆕

**N-AD-05** — [D/ENV drift] `images.controller.ts:13` čte `CLOUDINARY_CLOUD_NAME` jako separátní ENV proměnnou; `upload.service.ts:138` parsuje `CLOUDINARY_URL` (connection string). Jsou to **dvě různé proměnné** — pokud admin nastaví jen `CLOUDINARY_URL`, image proxy redirectuje na `https://res.cloudinary.com//image/upload/...` (cloud_name prázdný → broken URL) · Kde: `images.controller.ts:13`; `upload.service.ts:147` · Dopad: `/images/*` redirect endpoint vrací broken URL pro každý request · Návrh: V `ImagesController` parsovat `CLOUDINARY_URL` stejným způsobem jako `UploadService`, nebo extrahovat cloud name přes shared token · L2 · ♻️ (AD-45 z plánu, nyní potvrzeno staticky)

### 🟡 Menší

**N-AD-06** — [B/pagination] `getUsers`: `total` je z DB (před in-memory filtrem `!u.isDeleted`); `items` jsou po filtru → strana X může mít méně položek než limit → FE `totalPages = ceil(total/limit)` se nadpočítá → poslední stránka(y) se jeví plné, ale jsou prázdné · Kde: `admin.service.ts:120-130`; komentář v kódu to uznává jako debt · Dopad: kosmetický, špatný count stránek; hard limit 100/page omezuje dopad · Poznámka: Kód na to upozorňuje sám (`// refactor do query je dluh`) — zaznamenávám pro úplnost; FE `total` přichází v odpovědi a používá se pro výpočet stránek · L1 · 🆕 (acknowledged debt, nevyřešeno)

**N-AD-07** — [C/search] `POST /stats/search/reindex` hledá stránku přes `findAll()` (cross-world) a pak `p.slug === body.slug`; slug je unikátní jen per-world → při kolizi zaindexuje náhodnou stránku · Kde: `stats.controller.ts:74-75` · Toto odpovídá **N-39b** v bug-audit.md (🟡 existující nález, potvrzuji stejnou variantu) · ♻️

## PROOF-REQUEST

PR-12-01: Spustit `jest --testPathPattern=admin.service.spec.ts --maxWorkers=2` a ověřit, že absence testů `banUser`, `requestUserDeletion`, `cancelUserDeletion` je skutečná mezera. Pak napsat unit test `Admin s canModerateContent=true volá requestUserDeletion → ověřit zda projde nebo hodí MISSING_PERMISSION` — tím se potvrdí N-AD-01 nebo vyvratí pokud existuje DB load, na který jsem nepřišel.

PR-12-02: E2E: přihlásit se jako Admin s `canModerateContent=true`, odeslat `POST /admin/users/:id/request-deletion` → zkontrolovat HTTP status (očekáváme 403 = bug potvrzen, 200 = bug vyvrácen).

PR-12-03: E2E: odeslat `GET /admin/users?hasPendingRequest=true` → ověřit zda BE vrátí filtrovaný seznam nebo vše (potvrdí N-AD-02).

PR-12-04: E2E / manuálně: nechat adminovi smazat jiného uživatele → zkontrolovat AuditLog záložku v `/admin?tab=audit` — pokud zobrazí `undefined` label = N-AD-03 potvrzeno.
