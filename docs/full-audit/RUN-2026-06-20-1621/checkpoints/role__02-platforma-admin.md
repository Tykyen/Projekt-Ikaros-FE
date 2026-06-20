# role / 02-platforma-admin — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteny a ověřeny:
- BE: `admin.controller.ts`, `admin.service.ts`, `helpers/hierarchy.ts`, `admin.guard.ts`, `roles.guard.ts`
- BE: `ikaros-articles.service.ts` + `controller.ts`, `ikaros-gallery.service.ts` + `controller.ts`, `ikaros-discussions.service.ts` + `controller.ts`, `ikaros-events.service.ts` + `controller.ts`, `ikaros-news.service.ts` + `ikaros-categories.controller.ts`
- BE: `data-export.controller.ts`
- FE: `ArticleDetailPage.tsx`, `GalleryDetailPage.tsx`, `DiscussionDetailPage.tsx`, `AkcePage.tsx`, `RoleGuard.tsx`, `router.tsx` (admin routes), `UsersTable.tsx`

Osy pokryty: `PA`, `ES`, `LK`, `OW`, `BY`, `EN`, `ST`, `DD`, `PC`

## Dosažená L vs cílová L

- PL-01..06 (AdminGuard/RolesGuard sweep): **L2** — staticky ověřeno, všechny endpointy mají guard
- PL-07..10 (granular adminPermissions): **L2** — R-05 opraveno, stav ověřen
- PL-11..15 (Správci obsahu + ikaros): **L2** — parita FE↔BE ověřena; nový nález PL-21 (viz níže)
- PL-16 (anon read): **L2** staticky; L4 PROOF-REQUEST (viz níže)
- PL-17..20 (diskuze visibility/ownership): **L1** — 403 vs 404 problém (viz PL-17); nový nález addPost access gap

Cílová L: L2+ standardní, L3+ bezpečnostní, L4 M8 kritické — **dosaženo L2 na většině, 2 nové nálezy L1/L2**

## Nálezy

### R-RUN-01 — [PA][LK][DD] `addPost` nemá `canAccessDiscussion` check → cizí může přidat post do uzavřené diskuze · 🆕

- **Kde:** `ikaros-discussions.service.ts:496-521` (metoda `addPost`)
- **Podstata:** `addPost` ověřuje jen `discussion.isApproved` (řádek 508), ale NEvolá `canAccessDiscussion`. Kdo zná `discussionId` uzavřené (closed, not-open, invited-only) schválené diskuze, může přes `POST /ikaros-discussions/:id/posts` přidat příspěvek bez pozvání.
- **Kontrast:** `getPosts` (řádek 483) a `findById` (řádek 259) `canAccessDiscussion` volají; `addPost` ne — vzor přerušen.
- **Dopad:** Horizontální eskalace (OW): nepozvaný uživatel píše do soukromé diskuze. Nutné znát `discussionId` (není hádatelné, ale bývalý člen/link-šiřitel ho zná).
- **Návrh:** Přidat `if (!this.canAccessDiscussion(discussion, authorId, role, username)) throw ForbiddenException(...)` jako první check po ověření existence + isApproved. Caller: controller předává jen `user.id + user.username`, chybí `user.role` — nutno přidat do signatury `addPost` a controlleru.
- **Závažnost:** 🟠 střední — insider/link leak do uzavřené diskuze
- **L:** L1 (statické čtení)
- **Klasifikace:** 🆕

---

### R-RUN-02 — [LK][ST] `findById` diskuze vrací 403 (leak existence) místo 404 pro nepovolenou nebo neschválenou diskuzi · 🆕

- **Kde:** `ikaros-discussions.service.ts:259-266` (`findById`) a `ikaros-discussions.service.ts:483-487` (`getPosts`)
- **Podstata:** Dle auth-leak-policy by nepřístupný zdroj měl vrátit 404 (maskovat existenci). Kód místo toho hází `ForbiddenException` (403 DISCUSSION_ACCESS_DENIED). Totéž platí pro `getPosts` (řádek 484). Plán PL-17 explicitně říká „404 (ne 403) když nemá přístup (anti-leak)."
- **Kontrast:** `ikaros-articles.service.ts:227` a `ikaros-gallery.service.ts:178` oba hází 403 pro non-published; plan PL-16 je označen jako „403 vs 404 — kód dle auth-leak-policy správně, plán chce 404" (doc fix), ale pro diskuze je situace jiná: diskuze jsou soukromé (invited), takže 403 prozrazuje existenci soukromé diskuze.
- **Dopad:** Existence soukromé diskuze (closed, invited-only, nebo pending) je prozrazena přes 403. Pro otevřené schválené diskuze to neplatí (public); škodlivé pro invited-only uzavřené diskuze. Závažnost nízká-střední.
- **Návrh:** V `findById` a `getPosts`: místo `throw ForbiddenException(...)` při `!canAccessDiscussion` hodit `NotFoundException({ code: 'DISCUSSION_NOT_FOUND' })`. Aplikovat jen pro uzavřené/neschválené (admin always sees all).
- **Závažnost:** 🟡 nízká — leak existence soukromé diskuze
- **L:** L1
- **Klasifikace:** 🆕

---

### R-RUN-03 — [PA][BY] `isAdmin` v ikaros-articles/gallery/discussions má hardcoded `username === 'Tyky'` backdoor bez analogie na FE · 🆕

- **Kde:**
  - `ikaros-articles.service.ts:60` — `return ADMIN_ROLES.includes(role) || username === 'Tyky'`
  - `ikaros-gallery.service.ts:98` — `... || username === 'Tyky'`
  - `ikaros-discussions.service.ts:92` — `return ADMIN_ROLES.includes(role) || username === 'Tyky'`
  - FE: `ArticleDetailPage.tsx:288`, `GalleryDetailPage.tsx:224`, `DiscussionDetailPage.tsx:103` — kontrolují jen `REVIEWER_ROLES.includes(user.role)`, **bez username check**
- **Podstata:** BE dává uživateli s `username === 'Tyky'` (case-sensitive) plný admin přístup k ikaros obsahu (schvalovat/odmítat/editovat/mazat) bez ohledu na jeho roli. FE tento bypass nezná → FE Tykymu NEzobrazí admin tlačítka, ale BE ho pustí.
  - **Eskalace riziko:** Kdokoli, kdo si změní username na `Tyky`, má admin bypass v ikaros obsahu. `username` se mění přes admin-schválenou žádost (normální uživatel), nebo přímo Adminem. Pokud admin změní někomu jméno na `Tyky`, ten člověk dostane backdoor.
- **Dopad:** Nekonzistence FE↔BE (FE skryje tlačítka, BE pustí) — Tyky musí volat API přímo. Bezpečnostní riziko: username-as-privilege je anti-pattern (není RBAC), náchylné na rename útoky.
- **Návrh:** Odebrat `|| username === 'Tyky'` z `isAdmin` (Tyky je Superadmin = má roli, nepotřebuje username bypass). Zkontrolovat, zda má Tyky Superadmin roli v DB.
- **Závažnost:** 🟡 nízká (Tyky je důvěryhodný SA, ale anti-pattern) / 🟠 střední z pohledu rename útoku
- **L:** L2 (statický + FE↔BE kontrast)
- **Klasifikace:** 🆕

---

## Verifikace existujících nálezů (R-05, R-10, area00-K2) — stav potvrzen

- **R-05 ✅** — `setAdminPermissions` v `admin.service.ts:601-676`: canManageAdmins dotaženo (Admin s flagem smí delegovat moderaci, canManageAdmins jen Superadmin). FE `UsersTable.tsx:88-94` správně. POTVRZENO L2.
- **R-10 ✅** — `ArticleDetailPage.tsx:36-40` REVIEWER_ROLES = [Superadmin, Admin, SpravceClanku] bez PJ. Komentář ř. 29-35 opravený. POTVRZENO L2.
- **area00-K2 ✅** — `admin.controller.ts:347` `@Roles(UserRole.Superadmin, UserRole.Admin)` bez PJ. POTVRZENO L2.

## Ověření bodů plánu (matice)

| Bod | Stav | Poznámka |
|-----|------|---------|
| PL-01 | ✅ L2 | Každý endpoint v `admin.controller.ts` má `@UseGuards(AdminGuard)` nebo `@UseGuards(RolesGuard)+@Roles`. Class-level `@UseGuards(JwtAuthGuard)` + endpoint-level guardy OK. |
| PL-02 | ✅ L2 | `PATCH /admin/users/:id/admin-permissions` = `@UseGuards(RolesGuard) @Roles(Superadmin, Admin)` + service dovnitř ověří canManageAdmins. Superadmin-only pro `canManageAdmins` flag. |
| PL-03 | ✅ L2 | Sweep: `recent-pages` má `@Roles(...)`, `admin-permissions` má `@Roles(...)`. Žádný `RolesGuard` bez `@Roles` v admin/ikaros modulech nalezen. |
| PL-04 | ✅ L2 | `assertCanChangeRole` hierarchy.ts:44-68: Admin nesmí na/ze Superadmin, self-change deny. Hierarchie OK. |
| PL-05 | ✅ L2 | `ban/unban/bulk-ban/bulk-role/create/audit-log` = `AdminGuard` (role<=2). Žádný PJ/Spravce prosáknutí. |
| PL-06 | ✅ L2 | `recent-pages` = `@Roles(Superadmin, Admin)` — PJ odstraněn (area00-K2 fix). |
| PL-07 | ✅ L2 | `canManageAdmins` dotaženo v R-05. |
| PL-08 | ✅ L2 | `canModerateContent` čte `hierarchy.ts:99` pro DELETE/UNDELETE. |
| PL-09 | ✅ L2 | `canEditPlatformPages` skryt v UI, BE field ponechán jako dluh. |
| PL-10 | ✅ L2 | R-05 opraveno. |
| PL-11 | ✅ L2 | BE `ADMIN_ROLES` = [SA, Admin, SpravceClanku] ↔ FE REVIEWER_ROLES = [SA, Admin, SpravceClanku]. Parita OK. |
| PL-12 | ✅ L2 | BE [SA, Admin, SpravceGalerie] ↔ FE [SA, Admin, SpravceGalerie]. Parita OK. |
| PL-13 | ✅ L2 | BE [SA, Admin, SpravceDiskuzi] ↔ FE [SA, Admin, SpravceDiskuzi]. Parita OK. |
| PL-14 | ✅ L2 | REVIEWER_ROLES neobsahuje globální PJ(3). R-10 opraveno. |
| PL-15 | ✅ L2 | `ikaros-events.service.ts:35-40` `assertCanWrite` = Superadmin||Admin only. FE `AkcePage.tsx:31-33` `isAdmin` = Admin||Superadmin. Parita OK. |
| PL-16 | ✅ L2 staticky | Anon na `GET /ikaros-articles/:id` pending → 403 (viz articles.service:227). Service filter OK. PROOF-REQUEST pro L4 viz níže. |
| PL-17 | 🐛 L1 | `findById` hází 403 místo 404 pro nepovolenou diskuzi → R-RUN-02. |
| PL-18 | ✅ L2 | `patch` diskuze = `isManagerOrAdmin` (creator/manager/admin). Cizí přihlášený → 403. |
| PL-19 | ✅ L2 | Delete diskuze = jen via `reject` endpoint = `assertAdmin`. Manager nesmí smazat. |
| PL-20 | ✅ L1 | FE `DiscussionDetailPage` ukazuje jen autorizované akce (isReviewer gate). BE access check konzistentní. |

## Nové nálezy — shrnutí

| ID | Závažnost | Osa | Stav | Popis |
|----|-----------|-----|------|-------|
| R-RUN-01 | 🟠 střední | OW PC | 🆕 | `addPost` bez `canAccessDiscussion` → nepozvaný uživatel píše do soukromé diskuze |
| R-RUN-02 | 🟡 nízká | LK ST | 🆕 | `findById`/`getPosts` diskuze vrací 403 místo 404 (leak existence) |
| R-RUN-03 | 🟡–🟠 | PA BY | 🆕 | `username === 'Tyky'` hardcoded backdoor v ikaros-articles/gallery/discussions |

## PROOF-REQUEST

### PR-02-01 — PL-16: anon `GET /ikaros/articles/:id` na pending → ověřit 403/404 kód

**Co spustit:**
```bash
# 1. Nalézt ID pending článku (nebo vytvořit přes admin)
# 2. Request bez JWT:
curl -s -o /dev/null -w "%{http_code}" https://www.projekt-ikaros.com/api/ikaros-articles/<pending-id>
# Očekávaný výsledek: 403 (articles vrací 403, ne 404 — dle kódu service:227)
```
**Co dokáže:** Potvrdí, že BE skutečně filtruje pending na service vrstvě (ne jen FE), a upřesní 403 vs 404 status kód pro cases vs auth-leak-policy.
**Úroveň:** L4 (live proof)

### PR-02-02 — R-RUN-01: `addPost` bypass access check

**Co spustit:**
```bash
# 1. Vytvořit closed diskuzi (isOpen=false, invited-only), přidat jednoho member
# 2. Jiný přihlášený user (ne creator, ne invited, ne manager, ne admin):
curl -X POST https://www.projekt-ikaros.com/api/ikaros-discussions/<id>/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"<p>test</p>"}'
# Očekávaný výsledek po opravě: 403
# Aktuální výsledek: 200 (přidá post bez access check)
```
**Co dokáže:** Red-team M8 potvrzení díry.
**Úroveň:** L4 (live proof nebo BE jest test)

### PR-02-03 — R-RUN-03: username rename útok

**Co spustit:**
```bash
# Admin přejmenuje testovacího Ikarusu na 'Tyky':
PATCH /api/admin/users/<userId>/username  # (nebo jiný admin endpoint)
# Pak tento user volá: PATCH /api/ikaros-articles/<id>/approve
# s tokenem Ikarus (ne Admin/SA)
# Očekávaný výsledek: 403 (Ikarus nesmí schvalovat)
# Aktuální výsledek: 200 (isAdmin vrátí true pro username='Tyky')
```
**Co dokáže:** Potvrdí rename útok přes username backdoor.
**Úroveň:** L4 (red-team M8)
