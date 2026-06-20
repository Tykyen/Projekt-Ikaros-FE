# log-hygiene / 09-security-audit-trail — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem veškerý security audit-trail kód HEAD:
- `admin/interfaces/admin-audit-log.interface.ts` — typ `AdminAuditAction`, `AuditTargetType`, `RecordAuditInput`
- `admin/schemas/admin-audit-log.schema.ts` — Mongo schema, indexy
- `admin/repositories/admin-audit-log.repository.ts` — `record()` + `listPaginated()` + `toEntity()`
- `admin/admin.service.ts` — 14 volání `audit()`/`auditRepo.record()`, všechny akce
- `admin/admin.controller.ts` — guardy, endpointy
- `ikaros-news/ikaros-news.service.ts` — `auditNews()` helper
- `auth/auth.service.ts` — login flow (failed login? logging coverage)
- `common/guards/roles.guard.ts` — authz denial logging
- `common/guards/admin.guard.ts` — authz denial logging
- `common/guards/jwt-auth.guard.ts` — ban/delete enforcement
- `worlds/worlds.service.ts` — `transferOwnership()` — bez auditu
- M-SCAN výstup (logs.txt) — přehled runtime taintu

## Dosažená L vs cílová L

- Cíl dle plánu: `AUD`/`INJ` na **L2–L3**
- Dosaženo: **L3 statická** (coverage + taint + dosažitelnost v prod + branching) pro všechny osy; bez L5 runtime (PROOF-REQUEST viz níže)

## Nálezy

### LH-RUN-01 — [AUD] `createUser` admin bez audit záznamu
Kde: `admin/admin.service.ts:159–195`
Dopad: Admin vytvoří uživatelský účet (s libovolnou rolí) bez stopy v `admin_audit_log`. Akce `USER_CREATE` je definována v `AdminAuditAction` (interface.ts:3), ale nikde se nevolá. Forenzně: nelze doložit, kdo a kdy účet vytvořil, ani s jakou rolí.
Návrh: Po `usersRepo.save()` přidat `await this.audit(actor, { id: user.id, username: user.username }, 'USER_CREATE', null, { role: user.role }, undefined)`. Shodný vzor jako ban/role-change.
L3 · 🆕

### LH-RUN-02 — [AUD] `transferOwnership` světa bez audit záznamu
Kde: `worlds/worlds.service.ts:1818–1911`
Dopad: Předání vlastnictví světa (PJ-přepis) — klíčová bezpečnostní akce — se neloguje vůbec (žádný `AdminAuditLog`, žádný `this.logger`). Admin audit log pokrývá jen `admin/` modul; world-level operace jsou mimo. Forenzně: nelze doložit, kdo a kdy převzal svět.
Návrh: (a) přidat `AdminAuditLog` záznam přes eventEmitter event `world.ownership.transferred` → AdminService listener (vzor `user.deletion.requested`), nebo (b) jednodušší: `this.logger.log()` s `worldId/oldOwnerId/newOwnerId` (ne osobní data — jen IDs). Varianta (b) je rychlá, ale neskladatelná pro forenziku; doporučuji (a).
L3 · 🆕

### LH-RUN-03 — [AUD] failed login bez audit záznamu
Kde: `auth/auth.service.ts:181–192`
Dopad: Špatné heslo (INVALID_CREDENTIALS) → vyhazuje `UnauthorizedException`, ale **bez jakéhokoli logu** — ani `logger.warn`. Throttler (rate-limit) existuje a zpomalí brute-force, ale v logu nezbyde žádná stopa o opakovaných pokusech. Detekce průniku z logů nemožná.
Návrh: Přidat `this.logger.warn('login.failed', { userId: user?.id })` (jen `userId` nebo `null` — bez identifieru/hesla). Pokud user nenalezen → logovat `this.logger.warn('login.unknown.identifier')` (bez identifieru samotného — zamezí PII + log injection).
L3 · 🆕

### LH-RUN-04 — [INJ] failed login bez user-input v logu — POZITIVNÍ NÁLEZ
Kde: `auth/auth.service.ts:176–240`
Dopad: V celé login flow se **neloguje** `dto.identifier` (username/email vstup uživatele). Pozitivní: žádné riziko log injection přes username s `\n`. Kód loguje jen `user.id` (DB ID) nebo nic.
Verdikt: ✅ OK — žádný nález.
L3 · 🆕

### LH-RUN-05 — [AUD] RolesGuard `return false` bez logu — přijatelné
Kde: `common/guards/roles.guard.ts:21`
Dopad: `requiredRoles.includes(user.role)` → `false` → tichý 403 (HttpExceptionFilter to zachytí a pošle klientovi). V logu na serveru nezůstane stopa o zamítnuté authz. Jak plán zmiňuje: jde o nice-to-have (každý 403 by logoval = šum).
Verdikt: ⚖️ by-design (objem šumu vs. hodnota stopy). Viz K-LOG10 komentář v plánu.
L3 · ♻️

### LH-RUN-06 — [AUD] AdminGuard denial bez logu — přijatelné
Kde: `common/guards/admin.guard.ts:17–20`
Dopad: `user.role > UserRole.Admin` → `ForbiddenException` (NOT_PLATFORM_ADMIN). Zachytí HttpExceptionFilter a zaloguje server-side stack. Není to tichá denial — exception = logger.error přes filtr.
Verdikt: ✅ OK — exception filter zaloguje (http-exception.filter.ts:113).
L3 · ♻️

### LH-RUN-07 — [AUD] `PERMISSIONS_CHANGE` action je mrtvý typ
Kde: `admin/interfaces/admin-audit-log.interface.ts:12`
Dopad: `'PERMISSIONS_CHANGE'` definována v union type, ale nikde v kódu se nevolá. Pouze `'ADMIN_PERMISSIONS_CHANGE'` (admin.service.ts:672) je používaná. Dead code — riziko: v budoucnu někdo omylem použije špatný action name a bude mismatch při filtraci.
Návrh: Odstranit `'PERMISSIONS_CHANGE'` z union nebo přidat komentář proč existuje.
L1 · 🆕

### LH-RUN-08 — [AUD/PII] `actorUsername`/`targetUsername` v audit logu — username, ne email
Kde: `admin/schemas/admin-audit-log.schema.ts:16,18`
Dopad: Audit log persistuje `actorUsername` a `targetUsername` (username string, NE email). PII balance je správná — username je volené jméno, ne osobní kontaktní údaj. Záznamy `before`/`after` neobsahují email ani passwordHash (ověřeno přes všechna volání `audit()`).
Verdikt: ✅ OK — vzor správný.
L3 · ♻️

### LH-RUN-09 — [AUD] ikaros-news `auditNews` selhání loguje `String(e)` — drobný INJ risk
Kde: `ikaros-news/ikaros-news.service.ts:71`
Dopad: `this.logger.warn(\`Audit novinky selhal: ${String(e)}\`)` — error objekt `e` může obsahovat MongoDB error message s potenciálně nestandardními hodnotami; `String(e)` ale typicky dává `Error: ...message...` bez citlivých dat. Nízké riziko — e je interní Mongo error, ne user input. Ale neshoduje se se vzorem `logWarn(this.logger, ...)` zavedeným LH-01.
Návrh: Nahradit `logWarn(this.logger, 'Audit novinky selhal', e)` (konzistentní se standardním wrapperem).
L2 · 🆕

## PROOF-REQUEST

**PR-09-01** — `LH-RUN-03` (failed login bez stopy): Runtime stdout capture (L5) — spusť `auth.service.spec.ts` s `login()` se špatným heslem a zachyť stdout → ověř žádný Logger call. Prostředí: `createTestApp` nebo unit test s Logger spy. Aktuálně staticky ověřeno (L3); L5 potvrdí/vyvrátí.

**PR-09-02** — `LH-RUN-01` (createUser bez auditu): Integrace test — volej `POST /admin/users`, ověř `admin_audit_log.countDocuments({action:'USER_CREATE'})` = 0 (před opravou). Nespouštím bez live DB — PROOF-REQUEST.

**PR-09-03** — `LH-RUN-02` (world transfer bez auditu): Integrace test — volej `POST /worlds/:id/transfer-ownership`, ověř absenci logu/audit záznamu. PROOF-REQUEST.
