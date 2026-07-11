# bug — 12 Admin & platforma · dosažená L2 / cílová L2–L3 [auto]

Oblast: `docs/bug-plan/12-admin.md` (AD-01…AD-55). Styl bug, registr `docs/bug-audit.md` (prefix N-).
BE `modules/admin` (controller, service, stats/growth/costs, friendships, hierarchy, audit repo/schema), `stats`, `data-export`, `upload`, `images`, `system-presets`.
FE `features/admin` (PlatformAdminPage, OverviewTab, UsersAdminTab/UsersTable, AuditLogTab, SearchIndexTab, RoleGuard, hooks useAdminUsers/useAdminStats/useSearchIndex) + router `/admin`.

## Souhrn
**0 nových nálezů.** Oblast je silně pre-auditovaná (N-6a kontrakt, UM-01/07 upload, R-05 admin-permissions delegace, D-053 PJ removal, N-AD-01/02, FIX-1/68/72). Statické čtení BE↔FE potvrdilo, že kritické `[auto]` body sedí. Několik bodů bug-planu je **zastaralých vůči HEAD** (plán psán proti staršímu stavu) — viz 🔓. Jediná drobnost (reset friendship cooldownu bez auditu) je **explicitně přiznaná v kódu** jako záměrná-zatím → nehlásím jako nový nález.

---

## 🆕 NOVÉ nálezy
Žádné.

---

## ♻️ Známé / opravené (NEHLÁSÍM jako nové) — potvrzeno proti HEAD

- **Deletion-request URL drift** (bug-plan „Známá rizika", AD-14) → **OPRAVENO = N-6a.** FE `useAdminUsers.ts` volá `POST /admin/users/:id/request-deletion` (:232), `POST …/cancel-deletion` (:255), admin-permissions přes `api.patch` (:288) = BE controller (`request-deletion` :211, `cancel-deletion` :233, `@Patch admin-permissions` :252). Žádný 404, metody sedí.
- **SVG avatar whitelist** (AD-43 + bug-plan riziko) → **NEPLATÍ.** `upload.service.ts uploadUserImage` (:615-620) i `uploadImageToFolder` (:489-494) povolují jen jpeg/png/gif/webp; `image/svg+xml` záměrně vynecháno (UM-01, komentáře :22/44/488). SVG XSS vektor uzavřen. `assertMagicBytes` (:85) navíc magic-byte kontrola.
- **getUsers in-memory `hasPendingDeletion` filtr → nekonzistentní paginace** (`admin.service.ts:154`, total=`result.total` ale items filtrované po stránce) → **ZNÁMÝ DLUH** (`docs/dluhy.md:145-146` „getUsers filtruje až po vytažení stránky"). FIX-1 komentář (:149-152) to přiznává. Nehlásím.
- **AD-25 ACTION_LABELS drift** → **OK (verifikováno).** FE `AdminAuditAction` (`shared/types/index.ts:210`) je **nadmnožina** BE typu; `AuditLogTab` Record je exhaustivní (tsc baseline čistý). Každá akce, kterou BE umí zapsat, má FE label → žádný `undefined`. Rozdíl = FE-only `FRIENDSHIP_COOLDOWN_RESET`, **přiznaný komentářem** (index.ts:208 „BE ho zatím nikde neemituje").
- **Audit-log paginace** (AD-26/27) → **konzistentní.** `admin-audit-log.repository.ts:34-44` `skip=(page-1)*limit`, `total=countDocuments(filter)` nad **stejným** filtrem (na rozdíl od getUsers) → total sedí s items. `targetType` filtr předáván (:32). Schema `timestamps.createdAt` + sort `{createdAt:-1}` (schema :11, repo :38) funguje.

## 🔓 Planý poplach / zastaralý bug-plan (bod ≠ HEAD)

- **AD-03** (očekává `@Roles(Superadmin)` na admin-permissions, Admin→403 z guardu) → **ZASTARALÉ.** HEAD má `@Roles(Superadmin, Admin)` (controller :253-254) + service-level `canManageAdmins` gate (service :693-714, feature **R-05**). Admin bez `canManageAdmins` dostane 403 `INSUFFICIENT_ROLE` ze service, ne z guardu; `canManageAdmins` flag smí měnit jen Superadmin (`SUPERADMIN_ONLY_FLAG` :709-714). Korektní, jen jiná architektura než plán.
- **AD-05** (očekává `@Roles(Superadmin, Admin, PJ)`, PJ smí recent-pages) → **ZASTARALÉ.** HEAD **odebral PJ** (D-053, controller :401-404 „globální UserRole.PJ(3) zrušen"). Endpoint je Sa/Admin only. Záměr.
- **AD-19** (fallback `PRESENCE_THRESHOLD_HOURS` = 25 h) → **kód používá 24 h** (`admin-stats.service.ts:41-45`, `>0 ? hours : 24`). Navíc DTO komentář (`admin-stats-overview.dto.ts:11`) říká „25 h", ale FE label i kód = 24 h → kosmetický doc-drift, ne bug.

---

## Prošlé body (ověřeno OK, L1–L2)

- **A. Přístup/role (AD-01…16):** class `@UseGuards(JwtAuthGuard)` + per-metoda `AdminGuard` (`admin.controller.ts:58/71…`). `AdminGuard` hází `ForbiddenException` při `!user || role>Admin` (AD-01/07, guard :17-22). `StatsController` class `@UseGuards(JwtAuthGuard, AdminGuard)` (AD-04, stats.controller :30). `RolesGuard` hází při chybějícím requiredRoles=passthrough / při nesouladu 403 (AD-15, roles.guard :22/28). `hierarchy.ts` `assertCanChangeRole` self→`SELF_MODIFICATION`, Admin nesmí měnit/povyšovat adm (AD-08/09/16, :49-67); `assertCanModerate` Admin vs Admin→403, DELETE/UNDELETE vyžaduje `canModerateContent`→`MISSING_PERMISSION` (AD-10/11, :80-108). `setAdminPermissions` SELF_FORBIDDEN + NOT_ADMIN (AD-12, service :715/727). `requestUserDeletion`/`cancelUserDeletion` reloadují `actorFull` z DB pro canModerateContent (N-AD-01, service :543/643). FE `RoleGuard` `[Superadmin,Admin]`→jinak `ForbiddenPage` (AD-06, RoleGuard :14, router :256). FE `UsersTable` perms sekce jen `canSeePerms && role===Admin && !isSelf` (AD-13, :329). FE `useAdminSetAdminPermissions` = `api.patch` (AD-14, useAdminUsers :288).
- **B. Statistiky/audit (AD-17…28):** `getOverview` 9× `safe()` v `Promise.all` (AD-17/18, admin-stats.service :53-89, safe :101-111). `audit()` best-effort try/catch bez rethrow (AD-24, service :86-108). `onUserDeletionRequested` skip při `isModeration` (AD-28, :860). FE `useAdminStats` staleTime 60 s (AD-21, :16). FE `OverviewTab` isError→`role="alert"`, data undefined→`?? 0` (AD-20, :38/49-140). FE `AuditLogTab` LIMIT 20, `ACTION_CLASS`/`LABELS` exhaustivní (AD-22/25/26).
- **C. Search index (AD-29…34):** `POST /stats/search/rebuild` `@HttpCode(202)`, `void coordinator.rebuildIndex().catch(logError)` (AD-29, stats.controller :50-62). `reindex` bez slug/pageId→`{message}` bez DB; se slug→`findAll()` (AD-30/N-39b známé, :64-82). FE `useSearchIndexStats` refetchInterval 5000 + invalidate po rebuild (AD-31, useSearchIndex :23-40). FE `SearchIndexTab` tlačítko `disabled={rebuild.isPending}` + ConfirmDialog (AD-32, :48/95). `api.post` na 202 nehází (axios default validateStatus 2xx). `lastEmbeddedAtUtc` null→'—' (AD-34, :30-32).
- **D. Upload (AD-35…45):** `POST /upload/image` inline `user.role > Admin`→403 (AD-35, upload.controller :119). `content-image` bez role gate (AD-36, :157). `POST /upload` `findChannelForUpload(channelId,user.id)` (AD-37, :81). `uploadImageToFolder` Cloudinary fail→`saveImageToDisk` fallback (AD-38, service :535-543). `BACKEND_BASE_URL ?? 'http://localhost:3000'` (AD-39, :572-574). `uploadUserImage` deterministický `public_id:'main'` overwrite webp, fail→`BadGatewayException` bez disk fallbacku (AD-40, :628-661). `deleteImage`/`deleteAttachments` best-effort (AD-41, :727-758). `@OnEvent('chat.global.message.deleted')` handler (AD-42, :772). `CLOUDINARY_URL` chybí→log error + cloudName='' (AD-44, :138-140). `ImagesController` čte `CLOUDINARY_CLOUD_NAME` (AD-45 config-drift risk, :12-13 — [human], už v plánu).
- **E. Data export (AD-46…50):** `GET /data-export/me` jen `JwtAuthGuard`, self (AD-46, controller :17-27). Export mapuje explicitní pole bez `passwordHash`/`bannedAt`/`adminPermissions` (AD-49, service :88-104); `adminAuditLog` bez before/after (AD-47, :124-129). 7× paralelní DB bez `safe()` → 500 na partial fail (AD-48, :39-55 — dokumentované riziko bug-planu). Friends limit 1000 (AD-50, :49).
- **F. Skin/presety (AD-54/55):** `system-presets` controller bez guardu, veřejné (AD-54, controller :6-24). `findAll` jen `{system,displayName}`, `findOne` plný, in-memory (AD-55, service :31-42). AD-51/52/53 (ThemeSwitcher v IkarosLayout) = čistě [human], neověřováno staticky.

## Neprošel plně (nižší priorita)
- AD-51/52/53 ThemeSwitcher umístění/gating — [human] vizuální, mimo [auto].
- Mrtvé enum hodnoty audit akcí (`DELETE`/`UNDELETE`/`PERMISSIONS_CHANGE`/`DELETION_REACTIVATED`/`HARD_DELETE` v BE typu nikde nezapisované — grep 0 usage; reálně se používají `ACCOUNT_DELETE_REQUEST`/`ADMIN_PERMISSIONS_CHANGE`/`ACCOUNT_SELF_REACTIVATE`/`ACCOUNT_HARD_DELETE`) — kosmetický legacy dead-code na obou stranách, ne bug.
- `resetCooldown` (`admin-friendships.service.ts:76-94`) maže rejected friendship **bez audit zápisu** — accountability gap, ale **přiznaný** ve `shared/types/index.ts:208` jako záměrné-zatím → nehlásím jako nový.

## PROOF-REQUESTy
- **AD-17/18** (L3): spustit `admin-stats.service.spec.ts` — ověřit safe() izolaci (1 metrika hodí → ostatní 0, endpoint 200).
- **AD-08…12/16** (L3): `admin.service.spec.ts` + `hierarchy.spec.ts` — hierarchy guardy a SELF_FORBIDDEN/NOT_ADMIN.
- **AD-40** (M7, gap): `upload.service.spec.ts` netestuje `uploadUserImage` (avatar pipeline, deterministic publicId, webp, žádný disk fallback) — doplnit červený→zelený.
- (volitelně) M7: audit friendship `resetCooldown` — pokud produkt chce accountability, doplnit `FRIENDSHIP_COOLDOWN_RESET` do BE typu + `audit()` volání + test.
