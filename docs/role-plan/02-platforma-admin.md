# 02 — Platforma / admin & správci obsahu

Globální (platformová) oprávnění, kde se mísí tři vrstvy: **role** (`role <= Admin`), **správci
obsahu** (`SpravceClanku/Galerie/Diskuzi` = 10/11/12) a **granular `adminPermissions`**
(`canManageAdmins / canModerateContent / canEditPlatformPages`). Klíčová audit otázka: která z těch
tří vrstev **skutečně** něco gatuje, a sedí to FE↔BE? Granular flagy jsou na FE jen ke *správě*
(toggly), guardy jsou „BE-side" ([AdminDeleteUserModal.tsx:15]) — takže jejich reálné vynucení je
neověřené (kandidát K-R5).

**BE:** `admin` (controller s AdminGuard / RolesGuard), `stats`, `data-export`, `images`, `upload`,
`ikaros-articles/gallery/discussions/news/events` (assertAdmin)
**FE:** `features/admin` (RoleGuard, PlatformAdminPage, UsersTab, UsersTable), `features/ikaros/pages`
(Article/Gallery/Discussion DetailPage — REVIEWER_ROLES)

---

## A. Admin endpointy & guardy (`PA` `ES`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PL-01 | `admin.controller` má controller-level `JwtAuthGuard` + endpoint-level `AdminGuard` (role<=2) NEBO `RolesGuard + @Roles`. Ověřit, že **každý** endpoint má jeden z těch dvou (žádný jen JwtAuthGuard) `[auto]` | `ES` | M1 | ⬜ |
| PL-02 | `PATCH /admin/users/:id/admin-permissions` = `RolesGuard + @Roles(Superadmin)` — **jen Superadmin(1)**, ne Admin(2). Red-team: Admin zkusí měnit granular práva → 403 `[auto]` | `PA` | M8 | ⬜ |
| PL-03 | **RM-15 aplikace:** najít každý `@UseGuards(RolesGuard)` v admin/ikaros a ověřit, že má i `@Roles(...)`. Guard bez dekorátoru propustí všechny `[auto]` | `ES` | M1 | ⬜ |
| PL-04 | `PATCH /admin/users/:id/role` (AdminGuard) — může Admin povýšit na Superadmin? Ověřit hierarchii (Admin nesmí vytvořit/povýšit Superadmina ani sebe) `[auto]` | `ES` | M1 | ⬜ |
| PL-05 | `POST /admin/users/:id/ban`, `/admin/users` (create), audit-log, stats — AdminGuard (role<=2). Ověřit, že žádný neprosákne na PJ/Spravce `[auto]` | `PA` | M1 | ⬜ |
| PL-06 | `GET /admin/recent-pages` = `@Roles(Superadmin, Admin, PJ)` — pozor: `PJ` tady je **globální** UserRole(3), který D-053 zrušil. Ověřit, zda je to mrtvá/funkční podmínka (vazba na R-01) `[auto]` | `EN` | M1 | ⬜ |

---

## B. Granular adminPermissions — vynucuje je vůbec někdo? (`PA` — kandidát K-R5)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PL-07 | `canManageAdmins` — BE: gatuje udělení/odebrání admin práv jiným? FE: [UsersTable.tsx:173] podmiňuje zobrazení toggle. Ověřit, že BE assert **skutečně** kontroluje `canManageAdmins`, ne jen `role<=Admin` `[auto]` | `PA` `DD` | M1 | ✅ **R-05 opraveno (A)** — dřív nečteno; nově gatuje admin-permissions endpoint (Admin-manager smí delegovat moderaci) |
| PL-08 | `canModerateContent` — kde se **čte** na BE? Ikaros `assertAdmin` ([ikaros-articles.service.ts:63]) kontroluje `role<=Admin \|\| SpravceClanku`, **ne** `canModerateContent`. → flag možná vestigiální. Grepnout BE čtení flagu `[auto]` | `PA` | M1 | ✅ **vynucuje se** ([hierarchy.ts:100](../Projekt-ikaros/backend/src/modules/admin/helpers/hierarchy.ts#L100) — Admin potřebuje pro user DELETE/UNDELETE); ikaros obsah gatuje Spravce* role, ne tento flag — to je OK |
| PL-09 | `canEditPlatformPages` — kde se čte na BE? (platform pages = `/ikaros/*` editace?) Pokud nikde → mrtvý flag → dluh `[auto]` | `PA` | M1 | ✅ **R-05** — nikde nečteno = mrtvý flag → FE toggle **skryt**, BE field ponechán jako dluh |
| PL-10 | Pokud granular flagy **nic** nevynucují, ale FE je zobrazuje jako funkční toggly → klamavé UI (admin myslí, že uděluje právo, které neexistuje). Eskalovat jako nález/dluh `[auto]` | `PA` | M1 | 🐛→✅ **R-05** (canManageAdmins dotaženo, canEditPlatformPages skryt) |

---

## C. Správci obsahu (Spravce* 10/11/12) & ikaros obsah (`PA` `PC`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PL-11 | Články: BE `assertAdmin` = `role<=Admin \|\| SpravceClanku(10)` ([ikaros-articles.service.ts:63]) ↔ FE `REVIEWER_ROLES` ([ArticleDetailPage.tsx:32]) = `[Superadmin, Admin, SpravceClanku]` (+ historicky PJ?). Ověřit **shodu seznamů** `[auto]` | `PA` `EN` | M2 | ⬜ |
| PL-12 | Galerie: BE `assertAdmin` = `role<=Admin \|\| SpravceGalerie(11)` ↔ FE `REVIEWER_ROLES` ([GalleryDetailPage.tsx:26]). Shoda? `[auto]` | `PA` | M2 | ⬜ |
| PL-13 | Diskuze: BE `assertAdmin` = `role<=Admin \|\| SpravceDiskuzi(12)` ↔ FE `REVIEWER_ROLES` ([DiscussionDetailPage.tsx:37]). Shoda? `[auto]` | `PA` | M2 | ⬜ |
| PL-14 | **N-14 regrese:** PJ (globální role 3) **nesmí** být v žádném `ADMIN_ROLES`/`REVIEWER_ROLES` (PJ je world role, ne platforma). Ověřit, že FE REVIEWER_ROLES neobsahuje hodnotu pro globálního PJ `[auto]` | `EN` | M1 | ⬜ |
| PL-15 | Ikaros-events: BE `assertCanWrite` = **GlobalAdmin only** (ne Spravce). Ověřit, že FE gating events je taky jen Admin+ (ne Spravce*) `[auto]` | `PA` | M2 | ⬜ |
| PL-16 | Ikaros obsah read (`OptionalJwt`): anon vidí jen `approved`/`published`; draft/pending filtruje **service** (ne jen FE). Red-team: anon `GET /ikaros/articles/:id` na pending → 404/filtr `[auto]` | `LK` `DD` | M8 | ⬜ |

---

## D. Diskuze — visibility & ownership (`OW` `LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PL-17 | `canAccessDiscussion` ([ikaros-discussions.service.ts:114]) = GlobalAdmin \|\| (approved && (isOpen \|\| creator \|\| manager \|\| invited)). 404 (ne 403) když nemá přístup (anti-leak). Ověřit obě strany `[auto]` | `LK` `OW` | M4 | ⬜ |
| PL-18 | Update diskuze: `isManagerOrAdmin` (creator/manager/admin). Red-team: cizí přihlášený uživatel PATCH cizí diskuze → 403 `[auto]` | `OW` | M8 | ⬜ |
| PL-19 | Delete diskuze: `assertCreatorOrAdmin`. Ověřit, že manager (ne creator) **nesmí** smazat, jen editovat `[auto]` | `OW` | M1 | ⬜ |
| PL-20 | FE `DiscussionDetailPage` — uzamčená/invited diskuze: zobrazí jen tlačítka odpovídající přístupu; non-invited nevidí obsah (BE 404 → FE generic „nenalezeno/přístup odepřen") `[auto]` | `LK` | M1 | ⬜ |

---

## E. Matice persona × akce (platforma)

| Akce / persona | guest | Ikarus | SpravceClanku | SpravceGalerie | SpravceDiskuzi | Admin | Superadmin |
|---|---|---|---|---|---|---|---|
| číst published článek/galerii | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| schválit/odmítnout **článek** | 🔒 | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ✅ |
| schválit/odmítnout **galerii** | 🔒 | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ✅ |
| schválit/odmítnout **diskuzi** | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| `POST /ikaros/events` | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `/admin` panel (users/stats/ban) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| změnit `adminPermissions` jiného | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| změnit roli uživatele | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅⁺ | ✅ |
| editovat **cizí** diskuzi | 🔒 | ⛔/✅ᵒ | ⛔ | ⛔ | ✅(manager) | ✅ | ✅ |

`⁺` Admin smí měnit role, ale ne na/ze Superadmin (PL-04 ověřit). `✅ᵒ` = jen vlastní/manager (PL-18).

> **Delta parity (platforma):**
> - PL-07/08/09 granular flagy — FE: zobrazuje toggly · BE: čte je vůbec? · **⚠️ K-R5** (ověřit vynucení)
> - PL-11/12/13 REVIEWER_ROLES — FE seznam ↔ BE assertAdmin seznam · **ověřit shodu** (riziko driftu)
> - PL-06/14 globální PJ(3) v `@Roles`/REVIEWER · **⚠️ vazba R-01/N-14**
> - ostatní → vyplnit při exekuci.

---

## Test coverage gaps

- `roles.guard` bez specu (RM-16) — kritické zrovna pro admin-permissions (Superadmin-only).
- Red-team M8: „Admin zkusí admin-permissions endpoint" (PL-02) — nemá test.
- BE: test, že `assertAdmin` ikaros modulů odmítne Spravce *jiného* typu (SpravceGalerie na článek).
- FE: REVIEWER_ROLES ↔ BE seznam — žádný kontraktní test (drift riziko).

---

## Známá rizika

- **RP-1 (`PA`/K-R5)** — granular `adminPermissions` mohou být **klamavé UI**: FE je nabízí jako funkční toggly, ale pokud je BE assert nečte, admin uděluje neexistující právo. Buď je dotáhnout (BE enforce), nebo skrýt/označit jako WIP.
- **RP-2 (`EN`)** — `@Roles(... PJ)` a REVIEWER_ROLES počítají s globálním PJ(3), kterého D-053 zrušila (R-01/N-14). Mrtvá podmínka, ale matoucí; při budoucím re-use hodnoty 3 = tichá eskalace.
- **RP-3 (`ES`)** — RolesGuard bez `@Roles` v admin/ikaros = propustí všechny (PL-03). Plošně grepnout.
