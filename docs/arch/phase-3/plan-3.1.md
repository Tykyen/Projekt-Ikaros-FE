# Implementační plán 3.1 — Admin správa Ikaros novinek (`/ikaros/novinky`)

**Status:** Návrh — čeká na potvrzení PJ
**Spec:** [spec-3.1.md](./spec-3.1.md)
**Větve:**
- BE: `feat/krok-3.1-be-ikaros-news-mgmt` (v `Projekt-ikaros`)
- FE: `feat/krok-3.1-fe-ikaros-news-mgmt` (v `Projekt-ikaros-FE`)
**Odhad:** ~250 ř. BE + ~150 ř. BE testy + ~750 ř. FE + ~400 ř. FE testy

---

## Postup vysoké úrovně

Postup **BE → FE** ve dvou samostatných PR. Každá fáze končí commitem `lint + test ✓`.

| # | Fáze | Repo | Cíl |
|---|---|---|---|
| A | BE — schema + DTOs | backend | Datová vrstva pro `archived` field |
| B | BE — service rozšíření | backend | `findAll(scope)`, `update`, `archive`, `unarchive` |
| C | BE — controller + guards | backend | Endpointy + conditional auth |
| D | BE — testy | backend | +12 service spec cases |
| E | BE — merge na main, ověřit BC | backend | Dashboard 2.1 + 3.1a create musí dál fungovat |
| F | FE — refactor modalu | FE | `CreateNewsModal` → `NewsFormModal { mode }` |
| G | FE — API hooks | FE | 5 nových hooks v `useIkarosNews.ts` |
| H | FE — page skeleton + route | FE | Prázdná stránka přes RoleGuard |
| I | FE — list view (taby + tabulka) | FE | Funkční list s paginací |
| J | FE — akce (edit / archive / delete) | FE | Wire-up modalů a confirmů |
| K | FE — menu item | FE | „Správa novinek" v IkarosLayout |
| L | FE — mobile + skill `mobil-desktop` | FE | Stacked cards ≤ 768 px |
| M | FE — testy | FE | +18–25 cases |
| N | FE — skill `napoveda` | FE | Update help page (nová Admin stránka) |
| O | FE — checkbox v roadmap-fe.md | FE | 3.1 ✅ |

⚠️ **PJ checkpoint po každém kroku F–N** — krátký report co je hotové, žádám souhlas pokračovat. To je defaultní pravidlo. Pokud PJ řekne „pokračuj sám", checkpointy přeskočíme.

---

## Fáze A — BE schema + DTOs

### A1. Update schema `IkarosNewsSchemaClass`

**Edit:** `Projekt-ikaros/backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts`

```ts
@Schema({ collection: 'ikaros_news' })
export class IkarosNewsSchemaClass {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) content: string;
  @Prop({ required: true }) authorId: string;
  @Prop() authorName?: string;
  @Prop({ default: () => new Date() }) createdAtUtc: Date;
  @Prop({ default: true }) isActive: boolean; // legacy — D-065

  // NEW (spec 3.1):
  @Prop({ default: false, index: true }) archived: boolean;
  @Prop() archivedAtUtc?: Date;
  @Prop() archivedByUserId?: string;
}
```

Index `archived` přidáme samostatně + zachováme `createdAtUtc: -1`. Žádná data migrace — nové pole je optional, existující dokumenty bez něj se chovají jako `archived: false` díky filteru `{ archived: { $ne: true } }`.

### A2. Nový DTO `UpdateIkarosNewsDto`

**Nový soubor:** `Projekt-ikaros/backend/src/modules/ikaros-news/dto/update-ikaros-news.dto.ts`

```ts
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateIkarosNewsDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(10000) content?: string;
}
```

Validace „alespoň jedno pole" v service (ne v DTO — clearer error message). Service vyhodí `BadRequestException('Musíš upravit alespoň jedno pole.')` pokud `!dto.title && !dto.content`.

### A3. Commit

```
feat(ikaros-news): A. archived field + UpdateDto

- new schema fields: archived, archivedAtUtc, archivedByUserId
- UpdateIkarosNewsDto with optional title/content
- no data migration (filter uses $ne: true)
```

---

## Fáze B — BE service rozšíření

### B1. Repository — nové metody

**Edit:** `Projekt-ikaros/backend/src/modules/ikaros-news/repositories/ikaros-news.repository.ts` (přidat metody):

- `findAll({ limit, offset, scope })` — filter podle scope:
  - `active` → `{ archived: { $ne: true } }`
  - `archived` → `{ archived: true }`
  - `all` → `{}`
- `count(scope)` — stejný filter, jen `.countDocuments`.
- `findByIdAndUpdate(id, dto)` — generic update, vrátí `{ new: true }` document nebo `null`.
- `setArchived(id, archived, userId)` — set `archived`, `archivedAtUtc`, `archivedByUserId`; nulluje audit při `archived: false`.

### B2. Service `IkarosNewsService`

**Edit:** `Projekt-ikaros/backend/src/modules/ikaros-news/ikaros-news.service.ts`

- `findAll(opts?: { limit?: number; offset?: number; scope?: Scope })` — default `scope='active'`.
- Rename `countActive()` → `count(scope?: Scope)` (BC: bez argumentu = `'active'`).
- Nová `update(id: string, dto: UpdateIkarosNewsDto, role: UserRole)`:
  1. `assertCanWrite(role)`
  2. `if (!dto.title && !dto.content) throw new BadRequestException(...)`
  3. `repo.findByIdAndUpdate(id, dto)` → null → 404.
- Nová `archive(id: string, userId: string, role: UserRole)`:
  1. `assertCanWrite(role)`
  2. `repo.setArchived(id, true, userId)` — idempotentní (no-op pokud už archived).
  3. Vrátí updated entity.
- Nová `unarchive(id: string, role: UserRole)` — analogicky, audit fields → undefined.

### B3. Commit

```
feat(ikaros-news): B. service — findAll(scope), update, archive, unarchive

- scope filter for findAll/count (active|archived|all)
- countActive renamed to count (BC default 'active')
- update mutates title/content with role guard
- archive/unarchive toggle with audit trail (idempotent)
```

---

## Fáze C — BE controller + endpointy

### C1. Endpointy v controlleru

**Edit:** `Projekt-ikaros/backend/src/modules/ikaros-news/ikaros-news.controller.ts`

Přidat:

```ts
@Patch(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update novinky (Admin/Superadmin)' })
@ApiResponse({ status: 200 })
@ApiResponse({ status: 400 })
@ApiResponse({ status: 403 })
@ApiResponse({ status: 404 })
update(
  @Param('id') id: string,
  @Body() dto: UpdateIkarosNewsDto,
  @CurrentUser() user: RequestUser,
) {
  return this.service.update(id, dto, user.role);
}

@Post(':id/archive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Archivace novinky (Admin/Superadmin)' })
archive(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  return this.service.archive(id, user.id, user.role);
}

@Post(':id/unarchive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Obnovení archivované novinky (Admin/Superadmin)' })
unarchive(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  return this.service.unarchive(id, user.role);
}
```

### C2. Conditional auth pro `?scope=archived|all`

Update `findAll` v controlleru:

```ts
@Get()
findAll(
  @Query('scope') scopeRaw?: string,
  @Query('limit') limitStr?: string,
  @Query('offset') offsetStr?: string,
  @Req() req?: Request,  // pro manual JWT check
) {
  const scope = parseScope(scopeRaw); // 'active' default, validuje proti enum
  if (scope !== 'active') {
    // Manuální JWT check (nemůžeme dát @UseGuards na celou metodu — anon musí
    // umět volat scope=active). Helper `assertAdminFromRequest(req)`.
    assertAdminFromRequest(req);
  }
  return this.service.findAll({ scope, limit, offset });
}
```

⚠️ **Pozor:** Nest defaultně neaplikuje JWT decoding bez `@UseGuards(JwtAuthGuard)`. Buď:
- (a) Vytvořit lehký `OptionalJwtAuthGuard` který se pokusí JWT dekodovat, ale nepadne na 401 → controller pak `if (scope !== 'active' && !user) throw 401; if (... !isAdmin) throw 403`. **Doporučuji.**
- (b) Druhý endpoint `GET /IkarosNews/admin?scope=archived|all` s `@UseGuards(JwtAuthGuard)`. **Více kódu, ale clean.**

→ **Volba (a) `OptionalJwtAuthGuard`** — méně public surface, jeden endpoint. Pokud už existuje v common/guards, reuse; pokud ne, přidám jednoduchý.

Stejná logika pro `GET /count?scope=...`.

### C3. Commit

```
feat(ikaros-news): C. controller — PATCH + POST archive/unarchive + scope guard

- PATCH /IkarosNews/:id (Admin/Superadmin only)
- POST /IkarosNews/:id/archive, /:id/unarchive (idempotent)
- GET /IkarosNews?scope=... requires JWT+role for non-active
- OptionalJwtAuthGuard for selective auth on GET
```

---

## Fáze D — BE testy

### D1. Service spec

**Edit:** `Projekt-ikaros/backend/src/modules/ikaros-news/ikaros-news.service.spec.ts` — přidat ~12 case:

- `findAll({ scope: 'active' })` → vrací jen `archived !== true`
- `findAll({ scope: 'archived' })` → vrací jen `archived === true`
- `findAll({ scope: 'all' })` → vše
- `count(scope)` × 3 scopy
- `update` jako Admin OK
- `update` jako Ikarus → 403
- `update` neexistující id → 404
- `update` prázdný DTO → 400
- `archive` set fields + idempotence
- `unarchive` reset audit fields
- `delete` archived novinku → funguje

### D2. Controller e2e (volitelné — pokud project má e2e infra)

Stačí service spec pokrývající role check + auth, plus jeden controller test pro scope guard pokud snadno proveditelný.

### D3. Commit

```
test(ikaros-news): D. service spec — +12 cases for 3.1

- findAll/count scope filters
- update authz + validation
- archive/unarchive idempotence
- delete works on archived items
```

### D4. CI check + merge

`npm run test:be` lokálně. Push BE větev, otevřít PR, počkat na review/CI, merge na `main`.

---

## Fáze E — BE merge ověření BC

**Manuální checklist po deployi BE na dev:**

- [ ] Dashboard `/` sekce Novinky se nadále načítá (`GET /IkarosNews` bez params → default scope active → původní data).
- [ ] 3.1a create modal funguje (POST `/IkarosNews` beze změny).
- [ ] `GET /IkarosNews?scope=archived` jako anon → 401.
- [ ] `GET /IkarosNews?scope=archived` jako Ikarus → 403.
- [ ] `GET /IkarosNews?scope=archived` jako Admin → 200, prázdný list (zatím nic archivovaného).

⚠️ Pokud BC selže, **NE-merge** a fix forward.

---

## Fáze F — FE refactor `CreateNewsModal` → `NewsFormModal`

### F1. Soubor rename + props

**Rename:** `src/features/ikaros/components/CreateNewsModal.tsx` → `NewsFormModal.tsx` (i `.module.css`).

**Nová API:**

```tsx
type Mode = 'create' | 'edit';

interface Props {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  initialData?: { id: string; title: string; content: string };
}
```

Vnitřně:
- `defaultValues` z `initialData` pokud `mode='edit'`, jinak `{ title: '', content: '' }`.
- Title modalu: `mode === 'create' ? 'Nová novinka' : 'Upravit novinku'`.
- Primary button label: `'Vytvořit' | 'Uložit'`.
- Submit větví na `useCreateIkarosNews()` vs `useUpdateIkarosNews()`.
- Error mapping (403/404/network) zůstává stejný.

### F2. Update importů

**Edit:** `src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.tsx`

- `import { CreateNewsModal } from '...'` → `import { NewsFormModal } from '...'`
- `<CreateNewsModal open={...} onClose={...} />` → `<NewsFormModal mode="create" open={...} onClose={...} />`

### F3. Commit

```
refactor(ikaros): F. CreateNewsModal -> NewsFormModal { mode }

- single modal handles create + edit (DRY for 3.1)
- PlatformNewsSection import + props updated
- no behavior change for 3.1a create flow
```

---

## Fáze G — FE API hooks

### G1. Rozšíření `useIkarosNews.ts`

**Edit:** `src/features/ikaros/api/useIkarosNews.ts`

Přidat:
- `useIkarosNewsList({ scope, limit, offset })` — paginated query.
- `useIkarosNewsCount(scope)` — count query.
- `useUpdateIkarosNews()` — PATCH, invaliduje `['ikaros-news']`.
- `useArchiveIkarosNews()` — POST `/:id/archive`.
- `useUnarchiveIkarosNews()` — POST `/:id/unarchive`.
- `useDeleteIkarosNews()` — DELETE `/:id`.

Existující `useIkarosNews()` a `useCreateIkarosNews()` **zůstávají beze změny** (BC).

### G2. Type sync

Pokud `IkarosNews` v `src/shared/types` nemá `archived`, `archivedAtUtc`, `archivedByUserId` — doplnit (`type-sync` skill po BE deploy).

### G3. Commit

```
feat(ikaros): G. API hooks for news management

- useIkarosNewsList(scope, limit, offset) paginated query
- useIkarosNewsCount(scope) for tab badges
- useUpdateIkarosNews mutation (PATCH)
- useArchiveIkarosNews / useUnarchiveIkarosNews / useDeleteIkarosNews
- IkarosNews type extended with archived + audit fields
```

---

## Fáze H — FE page skeleton + route

### H1. Page komponenta (prázdný skeleton)

**Nový soubor:** `src/features/ikaros/pages/IkarosNewsManagementPage/IkarosNewsManagementPage.tsx`

```tsx
export default function IkarosNewsManagementPage() {
  return (
    <div className={s.page}>
      <h1 className={s.title}>Správa novinek</h1>
      <p>TODO — list</p>
    </div>
  );
}
```

+ `IkarosNewsManagementPage.module.css` s placeholder layoutem.

+ `index.ts` re-export pro lazy import v routeru.

### H2. Router

**Edit:** `src/app/router.tsx`

```tsx
const IkarosNewsManagementPage = lazy(() => import('@/features/ikaros/pages/IkarosNewsManagementPage'));

// V children array (vedle 'admin'):
{
  path: 'ikaros/novinky',
  loader: requireAuth,
  element: (
    <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>
      {p(IkarosNewsManagementPage)}
    </RoleGuard>
  ),
},
```

### H3. Commit

```
feat(ikaros): H. /ikaros/novinky route + page skeleton

- new IkarosNewsManagementPage stub
- router config with RoleGuard(Admin, Superadmin)
- visible only to Admin/Superadmin, others get ForbiddenPage
```

---

## Fáze I — FE list view (taby + tabulka + paginace)

### I1. Sub-komponenty

**Nové soubory:**

- `IkarosNewsManagementPage.tsx` — hlavní orchestrator (taby + filter state).
- `NewsTable.tsx` — tabulka (desktop) + stacked cards (mobile via CSS).
- `NewsTablePagination.tsx` — prev/next + page info.

State page-level:
```tsx
const [params, setParams] = useSearchParams();
const tab: 'active' | 'archived' = params.get('tab') === 'archived' ? 'archived' : 'active';
const [page, setPage] = useState(1);
const LIMIT = 20;

const listQuery = useIkarosNewsList({ scope: tab, limit: LIMIT, offset: (page - 1) * LIMIT });
const countQuery = useIkarosNewsCount(tab);
const otherCountQuery = useIkarosNewsCount(tab === 'active' ? 'archived' : 'active');
```

Tab badge = `countQuery.data?.total`. Tab změna resetuje `page` na 1.

### I2. CSS

Layout reset pro `.page`, taby (reuse stylu z `AdminUsersPage.module.css` pokud možno), tabulka, mobile breakpoint `@media (max-width: 768px) { .row { display: block; } ... }`.

### I3. Commit

```
feat(ikaros): I. NewsTable + tabs + pagination

- IkarosNewsManagementPage with active/archived tabs (useSearchParams)
- NewsTable (desktop) + stacked cards (mobile)
- Pagination LIMIT=20, prev/next/page info
- Tab badges from count(scope) queries
```

---

## Fáze J — FE akce (edit / archive / delete)

### J1. Akční ikony v řádku

V `NewsTable` přidat `<td>` (resp. footer karty na mobile) s 3 ikonami:
- `<Pencil />` → edit → `setEditTarget({...})` → otevře `NewsFormModal mode="edit"`.
- `<Archive />` (v tabu Active) / `<ArchiveRestore />` (v tabu Archive) → mutation + toast, bez confirm.
- `<Trash2 />` → `setDeleteTarget(id)` → otevře `ConfirmDialog`.

### J2. State page-level

```tsx
const [editTarget, setEditTarget] = useState<IkarosNews | null>(null);
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
const [createOpen, setCreateOpen] = useState(false);

const archiveMutation = useArchiveIkarosNews();
const unarchiveMutation = useUnarchiveIkarosNews();
const deleteMutation = useDeleteIkarosNews();

// Confirm dialog handler:
function confirmDelete() {
  if (!deleteTarget) return;
  deleteMutation.mutate(deleteTarget, {
    onSuccess: () => { toast.success('Novinka smazána.'); setDeleteTarget(null); },
    onError: (err) => { mapError(err); /* toast */ },
  });
}
```

### J3. Modaly v JSX

```tsx
<NewsFormModal mode="create" open={createOpen} onClose={() => setCreateOpen(false)} />
<NewsFormModal
  mode="edit"
  open={!!editTarget}
  onClose={() => setEditTarget(null)}
  initialData={editTarget ?? undefined}
/>
<ConfirmDialog
  open={!!deleteTarget}
  title="Smazat novinku?"
  message="Tato akce je nevratná. Novinka bude trvale odstraněna z databáze."
  confirmLabel="Smazat"
  confirmVariant="danger"
  onConfirm={confirmDelete}
  onCancel={() => setDeleteTarget(null)}
  isPending={deleteMutation.isPending}
/>
```

### J4. „+ Nová novinka" tlačítko

Vpravo nahoře u `<h1>`, otevírá create modal.

### J5. Commit

```
feat(ikaros): J. row actions — edit / archive / delete

- Pencil/Archive(Restore)/Trash2 icons per row
- NewsFormModal mode='edit' wired with row data
- ConfirmDialog for delete (danger variant, irreversible warning)
- + Nová novinka primary button in header
- toast.success on every successful action
```

---

## Fáze K — FE menu item v IkarosLayout

### K1. Update RightPanel

**Edit:** `src/app/layout/IkarosLayout/IkarosLayout.tsx`

Přidat **nad** položku „Uživatelé" v sekci Administrace:

```tsx
{isAdmin && (
  <Link to="/ikaros/novinky" className={s.navItem} onClick={onNav}>
    <span className={s.navItemIcon}><Newspaper size={18} /></span>
    <span className={s.navItemLabel}>Správa novinek</span>
  </Link>
)}
```

Import `Newspaper` z `lucide-react` (už by měl být — používá ho `PlatformNewsSection`).

### K2. Commit

```
feat(ikaros): K. menu item "Správa novinek" in Administrace

- visible only for Admin/Superadmin
- Newspaper icon, links to /ikaros/novinky
- placed above "Uživatelé"
```

---

## Fáze L — FE mobile + skill `mobil-desktop`

### L1. Manuální ověření na mobile + desktop viewportu

- Tabs scrollují horizontálně pokud je víc tabů (zatím 2 — vejde se).
- Tabulka → stacked cards ≤ 768 px.
- „+ Nová novinka" → ikona-only ≤ 480 px (`aria-label="Nová novinka"`).
- Modal `NewsFormModal` full-width na mobilu (Modal infra řeší).
- ConfirmDialog OK na obou.

### L2. Spustit skill `mobil-desktop`

Skill projde komponentu a vrátí findings. Aplikovat fixy, pokud nějaké přijdou.

### L3. Commit

```
fix(ikaros): L. mobile responsiveness for news mgmt page

- (popis dle findings ze skill mobil-desktop)
```

---

## Fáze M — FE testy

### M1. `NewsFormModal.spec.tsx` rozšíření

Existující CreateNewsModal.spec → migrate to NewsFormModal.spec, plus:
- `mode='edit'` render s `initialData`.
- `mode='edit'` submit calls update mutation.
- `mode='edit'` 404 → toast „Novinka nenalezena", modal zůstane.

### M2. `IkarosNewsManagementPage.spec.tsx` (nová)

- Render obou tabů.
- Tab switching přes `useSearchParams`.
- Tab badge zobrazuje count.
- „+ Nová novinka" otevře create modal.
- Edit ikona otevře edit modal.
- Archive ikona → mutation volaná.
- Delete ikona → ConfirmDialog se otevře.
- Confirm v dialogu → delete mutation.
- Cancel v dialogu → nic.
- Paginace prev/next mění page state + query.

### M3. `useIkarosNews.spec.ts` rozšíření

- `useIkarosNewsList` volá GET s correct params.
- Mutations invalidují `['ikaros-news']` prefix.

### M4. Cíl

+18–25 nových testů FE. Existující 3.1a + 2.1 testy musí projít beze změny.

### M5. Commit

```
test(ikaros): M. spec coverage for news mgmt

- NewsFormModal: edit mode (initial data, update mutation, 404 handling)
- IkarosNewsManagementPage: tabs, pagination, row actions, modals
- useIkarosNews hooks: list/count params, mutation invalidation
- +18 cases total
```

---

## Fáze N — FE skill `napoveda`

Po implementaci spustit skill `napoveda` — aktualizuje stránku Nápověda `/ikaros/napoveda`:
- Sekce „Stránky" → přidat `/ikaros/novinky` (Admin/Superadmin) jako funkční ✅.
- Role-matice → ověřit, že create/edit/delete novinek je v matici pro Admin/Superadmin (může být dluh otevřený k vyřízení).

Commit:
```
docs(napoveda): N. add /ikaros/novinky to help page
```

---

## Fáze O — Roadmap + dluhy

### O1. `docs/roadmap-fe.md`

Zaškrtnout položku v 3.1 a označit jako hotovo s datumem:

```diff
-### - [ ] 3.1 Ikaros novinky
+### - [x] 3.1 Ikaros novinky ✅ (2026-05-XX)
+
+**Spec:** [spec-3.1.md](arch/phase-3/spec-3.1.md), **Plán:** [plan-3.1.md](arch/phase-3/plan-3.1.md)
+
 - [x] V dashboardu — čtení bez přihlášení (krok 2.1)
-- [ ] Admin správa (full list, edit, delete, archiv, paginace — `/ikaros/novinky`)
+- [x] Admin správa (full list, edit, delete, archiv, paginace — `/ikaros/novinky`)
 - [x] **3.1a (early slice, 2026-05-14):** ...
```

### O2. `docs/dluhy.md`

Otevřít nové dluhy:
- **D-NEW3 (resolved)** (zůstává otevřený) — BE controller `WorldRole.PJ` authz pro IkarosNews.
- **D-065** (nový) — legacy `isActive` pole vyčistit.
- **D-066** (nový) — TipTap rich-text editor pro `content`.
- **D-067** (nový) — Audit log UI pro archive/delete.

Použít skill `dluh` pro každý.

### O3. Commit + push

```
docs: O. close 3.1, open follow-up debts

- roadmap-fe.md: mark 3.1 done with date
- dluhy.md: D-065 (isActive cleanup), D-066 (richtext), D-067 (audit UI)
- D-NEW3 (resolved) carries over (BE PJ authz)
```

---

## Souhrn outputu

**BE PR (`feat/krok-3.1-be-ikaros-news-mgmt`):**
- 1 schema edit, 1 nový DTO, 1 repository edit, 1 service edit, 1 controller edit, 1 nový `OptionalJwtAuthGuard` (pokud neexistuje), 1 service spec rozšíření.
- ~6 souborů, ~250 ř. kódu + ~150 ř. testů.

**FE PR (`feat/krok-3.1-fe-ikaros-news-mgmt`):**
- 1 rename (CreateNewsModal → NewsFormModal), 1 hook file rozšíření, 1 router edit, 1 layout edit, 1 nová page se sub-komponentami (3–4 soubory), CSS module, testy.
- ~12 souborů, ~750 ř. kódu + ~400 ř. testů.

**Docs PR (může být součást FE PR nebo separátní):**
- `roadmap-fe.md`, `dluhy.md`, `napoveda` updates.

---

## Bezpečnostní notes

- BE PATCH/archive/unarchive/delete — všechny vyžadují `Admin/Superadmin` na BE service vrstvě. FE RoleGuard je defensive UI, ne security boundary.
- Hard delete je nevratný — confirm dialog je povinný UX (ne security, ale UX prevence).
- Idempotence archive/unarchive — eliminuje race condition při dvojitém kliku.

---

## Bod stopu

Po schválení tohoto plánu otevřu BE větev a začnu **Fází A**. Každá fáze končí commitem a krátkým reportem. PJ checkpoint po každé velké fázi (A–O). Pokud chceš autonomní postup bez checkpointů, řekni „pokračuj sám až do konce" a já reportuji jen po fázi E (BC ověření) a po fázi O (finál).
