# Spec D-053 — Role architecture cleanup (cross-repo)

**Status:** Draft — čeká na schválení
**Rozsah:** FE + BE + datová migrace — velké
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend), bez větve („hodíme to do mainu" — viz volba autora)
**Velikost:** odhad ~50 souborů změněno (BE 30, FE 14, migrace 1, testy ~10), ~700 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-13
**Souvisí:** [spec-3.6a-role-matrix.md](../../phase-3/spec-3.6a-role-matrix.md) (UI Nápovědy odhalila zmatek), [memory/project-roles-architecture](../../../../../../Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/project_roles_architecture.md), bývalý dluh D-048/D-054 (kosmetický filtr dropdownu)

---

## 1. Cíl

Sjednotit datový model rolí dle dvouúrovňové architektury: **globální** (`User.role` = platformní oprávnění) a **world** (`WorldMembership.role` = oprávnění v konkrétním světě). Odstranit z `UserRole` enumu hodnoty, které jsou world-scoped (PJ/Korektor/Hrac/Ctenar/Zadatel), doplnit do `WorldRole` chybějící `Ctenar`, přejmenovat `WorldRole.Pending` → `WorldRole.Zadatel`, migrovat existující data v Mongu. Po refactoru je každá role v jednom enumu a všechny BE checky pracují se správnou úrovní.

---

## 2. Kontext / motivace

- **Aktuální stav je sémanticky špatný.** `UserRole` enum sdružuje 11 hodnot, ale 5 z nich (PJ/Korektor/Hrac/Ctenar/Zadatel) je world-scoped — patří do `WorldRole`. Důsledky:
  - Default nového uživatele je `UserRole.Hrac` (BE `auth.service.ts:145`, schema default), ačkoli logicky má být `Ikarus` (base platformní uživatel).
  - BE auth checks typu `@Roles(UserRole.Superadmin, UserRole.Admin, UserRole.PJ)` (`admin.controller.ts:310`) mají dvojí význam — co znamená „globální PJ"?
  - Admin dropdown v ADMINISTRACI historicky nabízel world role jako globální (vyřešeno kosmeticky v D-054 filtrací; podstata zůstala).
- **Chybí role `Ctenar`** ve `WorldRole` enumu, přestože matice v Nápovědě ji vyžaduje (pasivní účastník světa, vidí ale nemá postavu). User specifikoval 2026-05-13.
- **`WorldRole.Pending` je nepřesný název** — sémanticky to je „Žadatel" (čeká na schválení PJ), nikoli generický „pending". Sjednotit s UI labelem.
- **Bez refactoru:**
  - Nelze přidat `Ctenar` do WorldRole bez kolize (Korektor=1, Ctenar by potřeboval index, který kolikud nikde nepřebije).
  - Default role nového uživatele zůstává matoucí.
  - Dvouúrovňový model existuje jen v UI Nápovědy (3.6a), v datech ne — drift bude růst.

---

## 3. Audit současného stavu

### Sdílené definice

- **FE:** [src/shared/types/index.ts:1-13](../../../../src/shared/types/index.ts#L1-L13) (`UserRole`), [:267-273](../../../../src/shared/types/index.ts#L267-L273) (`WorldRole`).
- **BE:** `backend/src/modules/users/interfaces/user.interface.ts:22-34` (`UserRole`), `backend/src/modules/worlds/interfaces/world-membership.interface.ts:1-7` (`WorldRole`).

```ts
// Stav před refactorem (BE i FE identický shape)
enum UserRole {
  Superadmin    = 1,
  Admin         = 2,
  PJ            = 3,   // ← world-scoped, NEPATŘÍ sem
  Korektor      = 4,   // ← world-scoped
  Hrac          = 5,   // ← world-scoped + chybný default
  Ctenar        = 6,   // ← world-scoped
  Zadatel       = 7,   // ← world-scoped
  Ikarus        = 9,   // ← chybí v naming („Ikaros" v UI)
  SpravceClanku = 10,
  SpravceGalerie= 11,
  SpravceDiskuzi= 12,
}

enum WorldRole {
  Pending   = -1,   // ← rename na Zadatel
  Hrac      = 0,
  Korektor  = 1,
  PomocnyPJ = 2,
  PJ        = 3,
  // ← chybí Ctenar
}
```

### Kvantitativní scope

| Repo | Použití `UserRole.*` | Použití `WorldRole.*` |
|---|---:|---:|
| FE | 14 souborů (~30 referencí) | 0 |
| BE | 34 souborů (~80 referencí) | 24 souborů (~50 referencí) |

### Klíčová BE místa, která je třeba revidovat

- **`backend/src/modules/auth/auth.service.ts:145`** — registrace nového uživatele s `role: UserRole.Hrac`. Změnit na `UserRole.Ikarus`.
- **`backend/src/modules/admin/admin.service.ts:151,155`** — admin-create user default `UserRole.Hrac`. Změnit na `UserRole.Ikarus`.
- **`backend/src/modules/admin/admin.controller.ts:310`** — `@Roles(UserRole.Superadmin, UserRole.Admin, UserRole.PJ)`. PJ je world-scoped, v globálním guardu nedává smysl. Analyzovat endpoint a zúžit na `Superadmin/Admin` (případně + dedikovaný membership-based check pro endpointy, kde fakticky stačí být PJ aspoň v jednom světě).
- **`backend/src/modules/admin/helpers/hierarchy.ts:*`** — numerické porovnání `role <= UserRole.Admin` zachovat (Superadmin=1, Admin=2 ≤ 2 = staff). Funguje i po smazání ostatních hodnot.
- **`backend/src/modules/campaign/campaign.service.ts:63`** — `if (userRole <= UserRole.Admin) return WorldRole.PJ` — staff má v každém světě „PJ pravomoci". Zachovat.
- **`backend/src/modules/users/schemas/user.schema.ts:24`** — `@Prop({ type: Number, enum: UserRole, default: UserRole.Hrac })` — změnit default na `UserRole.Ikarus`. Mongoose enum validation po refactoru odmítne staré hodnoty 3-7 (bez migrace = boot fail u stávajících uživatelů).
- **BE užití `WorldRole.Pending`** (asi 8 míst v chat.service, game-events, emotes) — refactor rename na `WorldRole.Zadatel`.

### Klíčová FE místa

- **`src/shared/types/index.ts`** — definice obou enumů.
- **`src/shared/types/userRoleLabels.ts`** — ROLE_LABELS + ASSIGNABLE_ROLES (po D-054 už zúžen, ale labels obsahuje všechny → zúžit).
- **`src/features/users/components/shared/RoleChip.tsx`** + stories — mapování `UserRole → barva/label`. Smazat world role.
- **`src/app/router.tsx:133,172,180`** — `RoleGuard roles={[UserRole.Superadmin, UserRole.Admin, UserRole.PJ]}`. PJ tu zase nedává smysl jako globální → zúžit na Sa+Admin (nebo přidat dedikovaný membership-based guard).
- **`src/features/admin/users/components/UsersTab/BulkToolbar.tsx:36`** — `useState<UserRole>(UserRole.Hrac)` — změnit na `Ikarus`.
- **`src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx`** — žádná změna (už používá jen globální subset).

### Existující datová pole

- **`User.role`** v DB drží číselnou hodnotu z `UserRole` enumu. Po refactoru lze najít existující záznamy s `role ∈ {3,4,5,6,7}` (world role chybně uložené jako globální) — všechny jsou logicky „základní uživatel", tj. **migrace na `Ikarus = 9`**.
- **`WorldMembership.role`** v DB drží číselnou hodnotu z `WorldRole`. Po renumber je třeba bumpnout všechny hodnoty.

---

## 4. Návrh řešení

### 4.1 Cílový stav enumů (FE + BE identicky)

```ts
// GLOBÁLNÍ — User.role
export enum UserRole {
  Superadmin     = 1,
  Admin          = 2,
  Ikarus         = 9,    // base uživatel (default při registraci)
  SpravceClanku  = 10,
  SpravceGalerie = 11,
  SpravceDiskuzi = 12,
}

// WORLD — WorldMembership.role
export enum WorldRole {
  Zadatel   = 0,   // čeká na schválení PJ (dříve Pending = -1)
  Ctenar    = 1,   // pasivní účastník — vidí (NOVÉ)
  Hrac      = 2,   // aktivní hráč + postava
  Korektor  = 3,   // edit textů
  PomocnyPJ = 4,   // zástupce PJ
  PJ        = 5,   // vlastník světa
}
```

**Klíčová rozhodnutí:**

1. **Renumberace `WorldRole` všech hodnot.** Pending (-1) → 0; ostatní bumpneme +2 (aby `Ctenar` měl smysluplnou pozici 1). Konzistentní vzestupná hierarchie 0–5, žádné záporné. Numerické porovnání BE (`< WorldRole.PJ`, `>= WorldRole.PomocnyPJ`, ...) zůstává sémanticky korektní — TypeScript při kompilaci dopočítá nové hodnoty.
2. **Smazání world rolí z `UserRole`.** Hodnoty 3–7 zmizí z enumu (TypeScript), v BE Mongoose schema enum validation odmítne uložit. Migrace je **povinná** před deployem.
3. **Default `User.role` = `UserRole.Ikarus`** (nikoli Hrac). Backfill: existující záznamy s role∈{3,4,5,6,7} přemapovat na 9. Žádný uživatel neztrácí přístup (Ikarus má stejná oprávnění jako bývalý Hrac — žádná).
4. **Žádný GlobalRole sub-enum.** UserRole sám o sobě po refactoru obsahuje jen globální hodnoty. Single source of truth.

### 4.2 Migration script (BE)

`backend/src/database/migrations/d053-role-cleanup.ts` — standalone script, spustitelný `npm run migrate:d053`.

Pseudokód:
```ts
// 1. User collection: world role → Ikarus
const userResult = await usersCollection.updateMany(
  { role: { $in: [3, 4, 5, 6, 7] } },
  { $set: { role: 9 } }
);
log(`Updated ${userResult.modifiedCount} users to Ikarus.`);

// 2. WorldMembership collection: renumber
// POŘADÍ od nejvyšší k nejnižší, aby se hodnoty nepřekrývaly
const renumberMap = [
  { from: 3,  to: 5 },  // PJ
  { from: 2,  to: 4 },  // PomocnyPJ
  { from: 1,  to: 3 },  // Korektor
  { from: 0,  to: 2 },  // Hrac
  { from: -1, to: 0 },  // Pending → Zadatel
];
for (const { from, to } of renumberMap) {
  const r = await membershipsCollection.updateMany({ role: from }, { $set: { role: to } });
  log(`WorldMembership role ${from} → ${to}: ${r.modifiedCount}`);
}

// 3. Audit log: jeden záznam shrnující migraci
await auditLogsCollection.insertOne({
  action: 'MIGRATION_D053_ROLE_CLEANUP',
  actorId: 'system',
  metadata: { userMigrated: userResult.modifiedCount, ...},
  timestamp: new Date(),
});
```

**Bezpečnostní opatření:**
- Dry-run mode (`--dry-run`) — log počty bez zápisu.
- Idempotentní — opakované spuštění detekuje a skipne (zkontroluje existující záznam audit logu s action `MIGRATION_D053_ROLE_CLEANUP`).
- Backup před spuštěním (`mongodump`).
- Maintenance mode BE před migrací (return 503 nebo prostě BE down).

### 4.3 BE změny — soubory

Hlavní commits:

1. **`feat(roles): cleanup UserRole + WorldRole enum (D-053)`**
   - `users/interfaces/user.interface.ts` — UserRole enum bez 3-7.
   - `worlds/interfaces/world-membership.interface.ts` — WorldRole nová podoba.
   - `users/schemas/user.schema.ts:24` — default `UserRole.Ikarus`.
   - `auth/auth.service.ts:145` — registrace `role: UserRole.Ikarus`.
   - `admin/admin.service.ts:151,155` — admin-create default `UserRole.Ikarus`.
   - `admin/admin.controller.ts:310` — `@Roles(Superadmin, Admin)` (smazat PJ).
   - Všechna `WorldRole.Pending` → `WorldRole.Zadatel` (rename — IDE refactor).
   - Update `matrix-world.seed.ts`.

2. **`feat(roles): migration script for D-053`**
   - `database/migrations/d053-role-cleanup.ts` — standalone.
   - `package.json` — `"migrate:d053": "ts-node src/database/migrations/d053-role-cleanup.ts"`.

3. **`test(roles): update auth + admin + world tests for D-053`**
   - Update všech `.spec.ts` které referencují smazané hodnoty (`UserRole.Hrac`, `WorldRole.Pending`, hardcoded `role: 0|1|2|3|-1`).
   - Add migration script test (mock DB, ověřit přemapování).

### 4.4 FE změny — soubory

1. **`feat(roles): cleanup UserRole + WorldRole enum (D-053)`**
   - `src/shared/types/index.ts` — oba enumy.
   - `src/shared/types/userRoleLabels.ts` — ROLE_LABELS bez smazaných hodnot.
   - `src/features/users/components/shared/RoleChip.tsx` — mapování bez smazaných.
   - `src/features/users/components/shared/RoleChip.stories.tsx` — odstranit PJ/Hrac storypartem.
   - `src/features/admin/users/components/UsersTab/BulkToolbar.tsx:36` — default state `UserRole.Ikarus`.
   - `src/app/router.tsx:133,172,180` — RoleGuard zúžit (analyzovat per endpoint).
   - `src/app/layout/IkarosLayout/IkarosLayout.tsx:173` — `Sa || Admin` — beze změny (už nepoužívá PJ).

2. **`test(roles): update FE tests for D-053`**
   - HelpPage, AdminUsersPage, RoleChip storyperty, helpers tests.

### 4.5 Deploy sekvence (production)

1. Backup DB.
2. BE maintenance mode (vrátit 503 ze health endpointu, frontend zobrazí maintenance modal).
3. Spustit migration script (`--dry-run` první, pak ostrý).
4. Ověřit audit log řádek + counts.
5. Deploy BE + FE (oba musí být deployed se stejnou enum verzí).
6. Vypnout maintenance.
7. Smoke test: registrace nového uživatele (ověř `role = 9`), přihlášení existujícího, admin tab.

---

## 5. Out of scope

1. **Audit historických admin akcí přes audit log** — staré akce, kde role figuruje (např. `ROLE_CHANGE before=PJ after=Hrac`), zachovat as-is. Migration script audit log řádky nepřepisuje.
2. **Granular admin permissions refactor** — `AdminPermissions` flagy (D-033) zachovat beze změny.
3. **Membership-based check pro endpointy, kde `@Roles(...PJ)` historicky znamenalo „někdo, kdo je PJ aspoň v jednom světě"** — pokud takový endpoint existuje (analyzovat per případ v impl. plánu), buď zúžit guard nebo přidat dedikovaný `IsAnyPJGuard`. Per-endpoint rozhodnutí v plánu.
4. **JWT token formát** — pole `role` v payloadu zůstane stejné (UserRole číslo). Existující tokeny v dobu deploy budou stále validní (Ikarus má rolu 9, Superadmin 1, Admin 2 — nezměnily se); pokud tam jsou tokeny s `role ∈ {3,4,5,6,7}`, JWT strategy je má brát jako valid (Mongoose validation projde, ale stará hodnota v JWT ≠ DB hodnota → strategy přemapuje na `Ikarus`). Per-spec doplnit fallback v `JwtStrategy.validate`.
5. **Role-aware UI v jednotlivých světech** — fáze 5+ (světová vrstva). D-053 jen vyčistí enumy; nasazení nových rolí (Ctenar reálně funkční) je úkol fáze 5.

---

## 6. Acceptance kritéria

1. ✅ `UserRole` enum (FE i BE) obsahuje **jen 6 hodnot**: Superadmin, Admin, Ikarus, SpravceDiskuzi, SpravceClanku, SpravceGalerie.
2. ✅ `WorldRole` enum (FE i BE) obsahuje **6 hodnot**: Zadatel, Ctenar, Hrac, Korektor, PomocnyPJ, PJ (numericky 0–5).
3. ✅ Default `User.role` při registraci/admin-create = `UserRole.Ikarus` (9), ne Hrac.
4. ✅ Migration script úspěšně přemapuje na DEV testovací DB; opakované spuštění je idempotentní (skip).
5. ✅ Existující users s `role ∈ {3,4,5,6,7}` po migraci mají `role = 9`.
6. ✅ Existující WorldMemberships po migraci mají `role` přemapovaný dle tabulky §4.2.
7. ✅ `npm run build` + `npm run lint` + `npm run test:run` zelené v FE i BE.
8. ✅ BE testy zachovají coverage (≥ 950 testů jako dnes, +/- migration script tests).
9. ✅ Smoke: registrace nového uživatele → DB má `role = 9`.
10. ✅ Smoke: existující Tyky (Superadmin) se přihlásí beze změny.
11. ✅ Smoke: `/ikaros/uzivatele` admin tab — dropdown role-change nabízí jen globální, role-filtr funguje.
12. ✅ `/ikaros/napoveda?sekce=role` — beze změny obsahu (3.6a už používá jen globální subset).
13. ✅ Audit log obsahuje řádek `MIGRATION_D053_ROLE_CLEANUP` s counts.
14. ✅ Žádný TypeScript `as any` v refactoru — type-safe diff.

---

## 7. Test plán

### Automated

**BE:**
- Existující auth/admin/hierarchy/world tests refaktorovat (rename `UserRole.Hrac` → `UserRole.Ikarus`; `WorldRole.Pending` → `WorldRole.Zadatel`; numerické asserce přepsat).
- Nový test pro migration script (`d053-role-cleanup.spec.ts`):
  - in-memory mongo, předem nasazení users (5 ks s role 3-7, 1 ks role 1, 1 ks role 9), memberships (různé role 0-3 + 1× -1) → spustit script → asserce.
  - Druhé spuštění → no-op (idempotence).
- Test pro JwtStrategy fallback (stará role v tokenu → mapped to Ikarus + audit warning log).

**FE:**
- Update `HelpPage.spec.tsx` (drobné — už nepoužívá smazané role).
- Update `RoleChip.spec` (pokud existuje).
- Update `AdminUsersPage.spec` (asserce dropdownu).
- Žádné nové testy nutné nad rámec aktualizace.

### Manuální smoke (production-like)

1. DEV: spustit `npm run migrate:d053 --dry-run` → ověřit counts, žádný zápis.
2. DEV: spustit ostrou migraci → audit log řádek + counts.
3. DEV: registrace nového Hráče → DB má role=9.
4. DEV: existující Tyky (Superadmin, role=1) se přihlásí → unaffected.
5. DEV: admin tab — role dropdown, filter, bulk role-change — všechno funguje.
6. DEV: HelpPage role sekce — 2 matice render, žádný regres.

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| Migration script padne uprostřed (např. timeout) | Nízká | Vysoký | Backup před, idempotence umožní re-run; per-step transactions; mongo session pro batch |
| Existující JWT tokeny obsahují smazané role hodnoty (3-7) | Vysoká | Střední | JwtStrategy fallback mapuje na Ikarus + warning log; uživatel se přihlásí, dostane nový JWT s aktuální DB hodnotou |
| BE/FE deploy out-of-sync (jeden má starou enum, druhý novou) | Střední | Vysoký | Strict deploy order: backup → migrate → deploy BE → deploy FE; krátký maintenance window |
| Test coverage poklesne kvůli refactoru | Střední | Nízký | Refactor zachová asserce, jen rename; explicitní review per test |
| Endpoint, který historicky vyžadoval `@Roles(PJ)`, zlomí se po smazání | Nízká | Vysoký | Per-endpoint analýza v impl. plánu (sekce „Audit @Roles dekorátorů"); buď zúžit nebo nahradit membership-guard |
| Migrace nedostupná pro produkční DB (chybí mongodump access) | Nízká | Vysoký | Předem ověřit ops procedury; PJ pověřit zálohou před start |

**Rollback plán:**
1. Restore DB ze zálohy (mongorestore).
2. Revert BE+FE commits.
3. Redeploy.

Časový odhad rollbacku: ~10-15 minut (záleží na velikosti DB).

---

## 9. Otázky k autorovi

Autor delegoval (volby ber v `jdeme na to` modu). Defaultní volby:

- **Q1 — Endpointy s `@Roles(...PJ)` v BE:** Analyzovat per případ v impl. plánu. Default: pokud endpoint nepotřebuje konkrétní svět, zúžit na `Sa/Admin`; pokud potřebuje, přidat `IsAnyPJGuard` (lookup `WorldMembership.role >= PJ` aspoň v jednom světě).
- **Q2 — JwtStrategy fallback pro staré role:** Implementovat (mapuje smazané hodnoty na Ikarus + warning log). Alternativa: invalidovat všechny JWT a force re-login — agresivnější, ale čistší. Default: fallback.
- **Q3 — Numerace WorldRole:** Renumberace 0–5 (Zadatel→Ctenar→Hrac→Korektor→PomPJ→PJ). Alternativy: nechat Pending=-1 a přidat Ctenar=0.5 (nelze, integer), nebo Ctenar=4 (mimo logiku). Default: čistá 0–5.
- **Q4 — Místo umístění specu:** `phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md` (side-task pattern, cleanup nesouvisí s konkrétní fází). Plán dorazí jako `plan-d053-role-architecture-cleanup.md` ve stejné složce.
- **Q5 — Větev:** Bez větve („hodíme to do mainu") per přechozí pokyn. Series of commits, každý revertable.

---

**Po schválení specu napíšu implementační plán** (`plan-d053-role-architecture-cleanup.md`) s přesným pořadím kroků, file diffem, CLI příkazy a commit strategií.
