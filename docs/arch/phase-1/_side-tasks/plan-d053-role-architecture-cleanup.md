# Implementační plán — D-053 Role architecture cleanup

**Datum:** 2026-05-13
**Status:** ✅ Implementováno
**Spec:** [`spec-d053-role-architecture-cleanup.md`](./spec-d053-role-architecture-cleanup.md)
**Větev:** bez větve, hodíme do mainu (per autor)
**Odhad:** BE ~30 souborů, FE ~14, +1 migration script, ~700 ř. diff
**Repo:** koordinace `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)

---

## Pořadí kroků

```
Step 1: BE typy + enumy (compile fail — fix v dalších krocích)
Step 2: BE rename Pending → Zadatel (mass rename)
Step 3: BE schema + service defaults (Hrac → Ikarus)
Step 4: BE @Roles audit + RolesSection refactor (admin/recent-pages)
Step 5: BE numerické kontroly — sanity revize
Step 6: BE migration script + npm script
Step 7: BE testy update (rename + asserce + nový migration test)
Step 8: BE: tsc + lint + tests
Step 9: FE enum cleanup (UserRole + WorldRole)
Step 10: FE důsledky (BulkToolbar default, router guards, RoleChip, helpers, stories)
Step 11: FE testy update
Step 12: FE: tsc + lint + tests
Step 13: DEV: spustit migration script (dry-run + ostrý) na lokální DB
Step 14: Smoke test (registrace, login Tyky, admin tab, HelpPage)
Step 15: Cleanup dluhy + roadmap
```

Commit per krok (15 commitů celkem), každý revertable. BE commity v `Projekt-ikaros`, FE v `Projekt-ikaros-FE`.

---

## Step 1 — BE: nová podoba `UserRole` a `WorldRole` enumů

**Soubory:**
- `backend/src/modules/users/interfaces/user.interface.ts`
- `backend/src/modules/worlds/interfaces/world-membership.interface.ts`

**Diff `user.interface.ts:22-34`:**
```ts
export enum UserRole {
  Superadmin     = 1,
  Admin          = 2,
  Ikarus         = 9,
  SpravceClanku  = 10,
  SpravceGalerie = 11,
  SpravceDiskuzi = 12,
}
```
Smazat `PJ=3, Korektor=4, Hrac=5, Ctenar=6, Zadatel=7`.

**Diff `world-membership.interface.ts:1-7`:**
```ts
export enum WorldRole {
  Zadatel   = 0,
  Ctenar    = 1,
  Hrac      = 2,
  Korektor  = 3,
  PomocnyPJ = 4,
  PJ        = 5,
}
```

**Po Step 1 BE neskompiluje** — desítky referencí budou rozbité. Opravy v krocích 2–5.

**Commit:** `feat(roles): redefine UserRole + WorldRole enums (D-053)`

---

## Step 2 — BE: rename `WorldRole.Pending` → `WorldRole.Zadatel`

**Postup:** IDE-wide find/replace (case-sensitive, whole-word) v `backend/src/`:
- `WorldRole.Pending` → `WorldRole.Zadatel`

**Soubory (~12 ne-spec + ~14 spec):**
- `chat.service.ts`, `emotes.service.ts`, `game-events/*.ts`, `game-event-reminder.job.ts`, +odpovídající `.spec.ts`

**CLI:**
```bash
cd C:/Matrix/ProjektIkaros/Projekt-ikaros
# najdi, ověř před nahrazením
grep -rln "WorldRole.Pending" backend/src --include="*.ts"
# nahrazení in-place (zkontroluj výsledek)
```
(V plánu spustím find+sed; v Claude harness použiju Grep + Edit per file.)

**Commit:** `refactor(roles): rename WorldRole.Pending → WorldRole.Zadatel (D-053)`

---

## Step 3 — BE: schema default + service defaults `Hrac → Ikarus`

**Soubory:**
- `backend/src/modules/users/schemas/user.schema.ts:24` — `default: UserRole.Hrac` → `UserRole.Ikarus`
- `backend/src/modules/auth/auth.service.ts:145` — registrace `role: UserRole.Hrac` → `UserRole.Ikarus`
- `backend/src/modules/admin/admin.service.ts:151,155` — admin-create default

**Diff `auth.service.ts:145` (kontext):**
```ts
const user = await this.usersService.create({
  email: dto.email,
  username: dto.username,
  passwordHash: hash,
  role: UserRole.Ikarus,   // ← bylo Hrac
  // ...
});
```

**Diff `admin.service.ts:151-155`:**
```ts
const targetRole = dto.role ?? UserRole.Ikarus;   // ← bylo Hrac
// ...
assertCanChangeRole(actor, { id: 'new', role: UserRole.Ikarus }, targetRole);  // ← bylo Hrac
```

**Diff `user.schema.ts:24`:**
```ts
@Prop({ type: Number, enum: UserRole, default: UserRole.Ikarus })
role: UserRole;
```

**Commit:** `feat(users): default user role = Ikarus instead of Hrac (D-053)`

---

## Step 4 — BE: `@Roles(...PJ)` audit + admin recent-pages refactor

**Endpoint:** `admin.controller.ts:310` `@Roles(UserRole.Superadmin, UserRole.Admin, UserRole.PJ)` na `GET /admin/recent-pages`.

**Rozhodnutí:** Strict (Sa/Admin only). Endpoint nepoužívaný v FE (grep negativní); historicky myšlený jako admin nástroj. Smazat `UserRole.PJ` z guardu i ze service branche.

**Diff `admin.controller.ts:310`:**
```ts
@Roles(UserRole.Superadmin, UserRole.Admin)
```

**Diff `admin.service.ts:705-714`** (zjednodušení):
```ts
async getRecentPages(requester: AdminUser, limit: number) {
  // Po D-053: endpoint smí jen Sa/Admin, oba vidí všechny stránky
  return this.pagesRepo.findRecent(limit, undefined);
}
```
Smazat membership lookup (UserRole.PJ globally už neexistuje, „PJ globally" sémantiku endpoint pozbývá).

**Alternativa pro user (Q v specu):** ponechat dvojí logiku přes `IsAnyPJGuard` (membership lookup). Tady volím Strict — méně kódu, endpoint je low-traffic.

**Commit:** `refactor(admin): strict Sa/Admin guard on /admin/recent-pages (D-053)`

---

## Step 5 — BE: sanity revize numerických kontrol

**Postup:** projít všechna místa, která dělají `< X` / `>= X` / `<= X` / `=== X` s UserRole/WorldRole.

**Kandidáti k overení:**
- `hierarchy.ts:30,39,47,50,78,79,88,89` — porovnání UserRole — beze změny (Sa=1, Admin=2 zachovány).
- `admin.guard.ts:17` — `user.role > UserRole.Admin` (= ne-staff, tj. role ≥ Ikarus=9) — beze změny, jen sémantika je „není Sa ani Admin".
- `campaign.service.ts:63` — `userRole <= UserRole.Admin` — beze změny.
- WorldRole číselné porovnání (`< PJ`, `>= PomocnyPJ`, `=== Zadatel`) — beze změny (TS dopočítá nové hodnoty).

**Critical check:** `admin.service.ts:706 if (requester.role <= UserRole.Admin)` — beze změny.

**Co změnit:** Sanity log → `console.log` warn pokud rozhodnutí závisí na smazaných hodnotách. Žádné aktivní změny očekávané (vše už používá pojmenované konstanty).

**Commit:** žádný samostatný — případné mikro-opravy jdou do Step 6 nebo 3.

---

## Step 6 — BE: Migration script

**Nový soubor:** `backend/src/database/migrations/d053-role-cleanup.ts`

**Pseudokód (zhruba 80 ř.):**
```ts
#!/usr/bin/env ts-node
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  const memberships = db.collection('world_memberships');
  const audits = db.collection('admin_audit_logs');

  // Idempotence: skip pokud již proběhlo
  const existing = await audits.findOne({ action: 'MIGRATION_D053_ROLE_CLEANUP' });
  if (existing) {
    console.log('Migration D-053 already applied, skipping.');
    process.exit(0);
  }

  console.log(`[${dryRun ? 'DRY-RUN' : 'LIVE'}] D-053 role cleanup migration starting...`);

  // 1. Users: world role values → Ikarus
  const userQuery = { role: { $in: [3, 4, 5, 6, 7] } };
  const usersToMigrate = await users.countDocuments(userQuery);
  console.log(`  Users to migrate to Ikarus (9): ${usersToMigrate}`);
  if (!dryRun && usersToMigrate > 0) {
    const r = await users.updateMany(userQuery, { $set: { role: 9 } });
    console.log(`  → updated ${r.modifiedCount}`);
  }

  // 2. WorldMembership renumber (od nejvyššího)
  const renumber = [
    { from: 3,  to: 5, name: 'PJ' },
    { from: 2,  to: 4, name: 'PomocnyPJ' },
    { from: 1,  to: 3, name: 'Korektor' },
    { from: 0,  to: 2, name: 'Hrac' },
    { from: -1, to: 0, name: 'Pending→Zadatel' },
  ];
  for (const { from, to, name } of renumber) {
    const count = await memberships.countDocuments({ role: from });
    console.log(`  Memberships ${name} (${from} → ${to}): ${count}`);
    if (!dryRun && count > 0) {
      const r = await memberships.updateMany({ role: from }, { $set: { role: to } });
      console.log(`    → updated ${r.modifiedCount}`);
    }
  }

  // 3. Audit log marker
  if (!dryRun) {
    await audits.insertOne({
      action: 'MIGRATION_D053_ROLE_CLEANUP',
      actorId: null,
      actorUsername: 'system',
      targetId: null,
      targetUsername: null,
      metadata: { script: 'd053-role-cleanup', usersMigrated: usersToMigrate },
      createdAt: new Date(),
    });
    console.log('  Audit log written.');
  }

  await client.close();
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
```

**`backend/package.json`** — přidat `"migrate:d053": "ts-node src/database/migrations/d053-role-cleanup.ts"`.

**Commit:** `feat(db): D-053 migration script (idempotent, --dry-run)`

---

## Step 7 — BE: testy update

**Soubory (~15 spec souborů):**
- Všechny `*.spec.ts` které referencují smazané `UserRole.PJ/Korektor/Hrac/Ctenar/Zadatel`:
  - Rename: `UserRole.Hrac` → `UserRole.Ikarus` (default user v testech)
  - `UserRole.PJ` (globally) → drop nebo nahradit kontextově (většinou je to default test fixture „obyčejný uživatel")
  - `WorldRole.Pending` → `WorldRole.Zadatel`
- Hard-coded číselné asserce (např. `expect(role).toBe(3)`) — přepsat na konstanty.

**Nový soubor:** `backend/src/database/migrations/__tests__/d053-role-cleanup.spec.ts`
- Setup in-memory mongo (mongodb-memory-server).
- Insert 5 users (role 3/4/5/6/7) + 1 user (role 1 Sa) + 1 user (role 9 Ikarus).
- Insert WorldMemberships (5 rolí: -1, 0, 1, 2, 3, několik každé).
- Spustit migraci.
- Asserce: 5 users → role 9; Sa zachovám; Ikarus zachovám.
- Asserce: WorldMemberships renumber dle tabulky.
- Druhé spuštění → idempotent, žádné změny.

**Commit:** `test(roles): update tests + migration spec for D-053`

---

## Step 8 — BE: verifikace

**CLI:**
```bash
cd C:/Matrix/ProjektIkaros/Projekt-ikaros/backend
npx tsc --noEmit
npm run lint
npm run test
```

Acceptance: `tsc` 0 errors, lint OK, ≥ 950 tests pass (původní 960 - rename + nové migration testy).

**Commit:** žádný — verifikační krok.

---

## Step 9 — FE: enum cleanup

**Soubor:** `src/shared/types/index.ts`

**Diff `:1-13`:**
```ts
export enum UserRole {
  Superadmin     = 1,
  Admin          = 2,
  Ikarus         = 9,
  SpravceClanku  = 10,
  SpravceGalerie = 11,
  SpravceDiskuzi = 12,
}
```

**Diff `:267-273`:**
```ts
export enum WorldRole {
  Zadatel   = 0,
  Ctenar    = 1,
  Hrac      = 2,
  Korektor  = 3,
  PomocnyPJ = 4,
  PJ        = 5,
}
```

**Po Step 9 FE neskompiluje** — opravy v Step 10.

**Commit:** `feat(types): cleanup UserRole + WorldRole enum (D-053)`

---

## Step 10 — FE: dopady

**Soubory:**

1. **`src/shared/types/userRoleLabels.ts`** — zúžit `ROLE_LABELS` jen na 6 globálních (smazat PJ/Korektor/Hrac/Ctenar/Zadatel/Ikarus záznamy → ponechat Ikarus, smazat zbytek). Komentář: world labely jsou v `WorldRoleIcon` per WorldRoleKey.

2. **`src/features/admin/users/components/UsersTab/BulkToolbar.tsx:36`** — `useState<UserRole>(UserRole.Hrac)` → `useState<UserRole>(UserRole.Ikarus)`.

3. **`src/app/router.tsx:133,172,180`** — `RoleGuard roles={[UserRole.Superadmin, UserRole.Admin, UserRole.PJ]}` → analyzovat per route. Pravděpodobně všechny → `[Sa, Admin]` (analogicky k BE Step 4). Pokud nějaká route má smysl pro PJ-in-any-world, dluh + ad-hoc check ve stránce.

4. **`src/features/users/components/shared/RoleChip.tsx`** — mapování ROLE_CONFIG: smazat PJ/Hrac branches. Stories: smazat příklady.

5. **`src/features/users/components/shared/RoleChip.stories.tsx`** — smazat PJ/Hrac stories.

6. **`src/app/layout/IkarosLayout/IkarosLayout.tsx:173`** — beze změny (`Sa || Admin` — staff check).

**Commit:** `refactor(types): update FE consumers for D-053 enum cleanup`

---

## Step 11 — FE: testy update

**Soubory:**
- `HelpPage.spec.tsx` — beze změny (3.6a už používá jen globální subset).
- `RoleChip.spec.tsx` (pokud existuje) — smazat PJ/Hrac case.
- Případné `__tests__/router.spec.tsx` — update guard asserce.
- Jakékoliv další testy s `UserRole.Hrac` / `WorldRole.Pending` → rename.

**Commit:** `test(roles): update FE tests for D-053`

---

## Step 12 — FE: verifikace

**CLI:**
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros-FE
npx tsc --noEmit
npm run lint
npm run test:run
```

Acceptance: 0 errors, 249 tests + tweaky (pokud existuje RoleChip spec).

**Commit:** žádný — verifikační krok.

---

## Step 13 — DEV: spustit migraci na lokální DB

**CLI (PowerShell):**
```powershell
# 1. Backup
docker exec matrix-mongodb-dev mongodump --db=ikaros --out=/data/backup-d053-2026-05-13

# 2. Dry-run
cd C:\Matrix\ProjektIkaros\Projekt-ikaros\backend
npm run migrate:d053 -- --dry-run

# 3. Ostrá migrace
npm run migrate:d053
```

**Acceptance:**
- Dry-run vypíše počty bez modifikace; ostrý vypíše `modifiedCount > 0` (pokud máš testovací data).
- Druhé spuštění → „already applied, skipping".
- Mongo: `db.admin_audit_logs.findOne({action: 'MIGRATION_D053_ROLE_CLEANUP'})` vrátí dokument.

---

## Step 14 — Smoke test

**Scénáře (manuální v prohlížeči, FE dev běží na :5173):**

1. **Registrace nového Hráče** přes Register modal:
   - DB: `db.users.findOne({email: ...})` → `role: 9` (Ikarus).
   - FE: po loginu vidí UI bez admin tabů.

2. **Tyky Superadmin login**:
   - Přihlášení projde, dashboard funguje.
   - ADMINISTRACE → Uživatelé → dropdown role-change nabízí jen 6 globálních.
   - Role filter funguje (jen globální).

3. **HelpPage `/ikaros/napoveda?sekce=role`**:
   - 2 matice render, beze změny obsahu.

4. **Console**: žádné errors v devtools (Network 200, žádné `enum validation failed`).

**Pokud něco selže** → revert posledních commitů + restore DB ze zálohy.

---

## Step 15 — Cleanup dluhy + roadmap

**Soubory:**

1. **`docs/dluhy.md`** — uzavřít D-053:
   ```
   *D-053 uzavřen 2026-05-13 — Cross-repo refactor: UserRole zúžen na 6 globálních
   hodnot, WorldRole renumberován 0–5 s novou `Ctenar`, Pending přejmenován na
   Zadatel. Migration script `migrate:d053` (idempotentní, --dry-run). Default
   user role změněn z Hrac na Ikarus. Endpoint /admin/recent-pages zúžen na
   Sa/Admin (PJ-in-any-world variantu vyřazena — endpoint není v FE volán).*
   ```

2. **`docs/roadmap-fe.md`** — pod 3.6a doplnit poznámku:
   ```
   **Související cleanup:** D-053 uzavřen 2026-05-13 — split enumů UserRole/WorldRole,
   BE migrace, FE refactor (`docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md`).
   ```

3. **Memory `project_roles_architecture.md`** — update tabulky world rolí o finální čísla
   (Zadatel=0, Ctenar=1, Hrac=2, Korektor=3, PomocnyPJ=4, PJ=5), poznámka o Z-053 closure.

**Commit:** `docs: close D-053 in dluhy.md + roadmap-fe.md`

---

## Závěrečný checklist

- [ ] BE `tsc --noEmit` projde
- [ ] BE `npm run lint` projde
- [ ] BE `npm test` projde (≥ 960 testů incl. migration script test)
- [ ] FE `tsc --noEmit` projde
- [ ] FE `npm run lint` projde
- [ ] FE `npm run test:run` projde (249 + drobné updates)
- [ ] DEV: backup proběhl; dry-run projevuje očekávané počty; ostrá migrace zapíše audit log
- [ ] Smoke: registrace nového Hráče → DB role=9
- [ ] Smoke: Tyky login + admin tab funkční
- [ ] Smoke: HelpPage beze změn
- [ ] `dluhy.md` uzavírá D-053
- [ ] `roadmap-fe.md` má poznámku
- [ ] Memory `project-roles-architecture` aktualizovaná

---

## Commit strategie (přehled)

Per Step samostatný commit (celkem ~12 nenulových commitů):

**BE repo (`Projekt-ikaros`):**
1. `feat(roles): redefine UserRole + WorldRole enums (D-053)` — Step 1
2. `refactor(roles): rename WorldRole.Pending → WorldRole.Zadatel (D-053)` — Step 2
3. `feat(users): default user role = Ikarus instead of Hrac (D-053)` — Step 3
4. `refactor(admin): strict Sa/Admin guard on /admin/recent-pages (D-053)` — Step 4
5. `feat(db): D-053 migration script (idempotent, --dry-run)` — Step 6
6. `test(roles): update tests + migration spec for D-053` — Step 7

**FE repo (`Projekt-ikaros-FE`):**
7. `feat(types): cleanup UserRole + WorldRole enum (D-053)` — Step 9
8. `refactor(types): update FE consumers for D-053 enum cleanup` — Step 10
9. `test(roles): update FE tests for D-053` — Step 11
10. `docs: close D-053 in dluhy.md + roadmap-fe.md` — Step 15

Smoke test po Step 14, pak commit Step 15 jako poslední.

---

## Rollback plán

V případě failuru (Step 13/14 nepříjemných):
1. `mongorestore` ze zálohy.
2. `git revert <SHA-rozsah>` v BE i FE.
3. Restart BE.
4. Verify Tyky login + smoke.

Časový odhad rollback: 10–15 minut.
