# Spec 3.1 — Admin správa Ikaros novinek (`/ikaros/novinky`)

**Status:** Schváleno (2026-05-15, PJ)
**Rozsah:** FE (nová page + refactor modalu + 3 hooks + router + menu) + BE (3 nové endpointy + schema migrace)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)
**Velikost:** střední — odhad ~12 nových / 6 upravených FE souborů, ~8 upravených BE souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-15
**Souvisí:**
- [spec-3.1a-news-create-early.md](spec-3.1a-news-create-early.md) — create modal (hotovo)
- [spec-2.1.md](../phase-2/spec-2.1.md) — dashboard read (hotovo)

---

## 1. Cíl

Admin / Superadmin dostanou stránku **`/ikaros/novinky`** pro plnou správu Ikaros novinek:
- Stránkovaný **seznam** všech aktivních a archivovaných novinek (taby).
- **Vytvoření** novinky (re-use `CreateNewsModal` → refactor na `NewsFormModal` s režimy `create | edit`).
- **Editace** existující novinky.
- **Archivace / obnovení** (revertibilní soft toggle, neztrácí data).
- **Trvalé smazání** (hard delete, ConfirmDialog s upozorněním „nevratné").
- Vstup do stránky z pravého panelu sekce **Administrace** v `IkarosLayout`.

Dashboard (krok 2.1) a create-modal flow (3.1a) zůstávají beze změny — admin novinek pouze _přibyde_, nic se neodebírá.

---

## 2. Kontext / motivace

- Dashboard sekce Novinky teď zobrazuje plain list bez paginace a bez možnosti edit/delete. To je OK pro hráče, ale nestačí pro Admin/Superadmin, kteří potřebují obsah moderovat.
- BE už podporuje `findAll({ limit, offset })` + `count` pro paginační meta. Chybí mu jen **edit**, **archiv** a **soft toggle** — což přidáme.
- Archiv (oproti hard delete) řeší 2 use casy: (a) novinka je zastaralá, ale historicky zajímavá; (b) chyba autora — nechci ztratit content, jen ho skrýt.
- Roadmapa 3.1 požaduje *„full list, edit, delete, archiv, paginace"* — tento spec pokrývá celý scope.

---

## 3. Audit současného stavu

### 3.1 BE — IkarosNews modul

- Schema [`ikaros-news.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts):
  - `title`, `content`, `authorId`, `authorName?` (legacy), `createdAtUtc`, `isActive` (default `true`, **funkčně nevyužité**).
- Controller [`ikaros-news.controller.ts`](../../../../Projekt-ikaros/backend/src/modules/ikaros-news/ikaros-news.controller.ts):
  - `GET /IkarosNews?limit=&offset=` — public, paginace OK (max limit 100).
  - `GET /IkarosNews/count` — public.
  - `POST /IkarosNews` — JWT + role check v service (`Admin/Superadmin`).
  - `DELETE /IkarosNews/:id` — JWT + role check, hard delete, 204.
- Service: `assertCanWrite(role)` → 403 pokud ne `Admin/Superadmin`.
- ⚠️ BE controller dříve povoloval `WorldRole.PJ` pro create/delete (dluh D-069 z 3.1a) — **vyřešeno** pre-existujícím commitem před 3.1 (zúžení authz na Admin/Superadmin, viz commit `584946d0`).

### 3.2 FE — Ikaros novinky

- Query hook [`useIkarosNews.ts`](../../../src/features/ikaros/api/useIkarosNews.ts):
  - `useIkarosNews()` — GET bez paginace, queryKey `['ikaros-news']`, `placeholderData: []`.
  - `useCreateIkarosNews()` — POST, invaliduje `['ikaros-news']`.
- Komponenta [`CreateNewsModal.tsx`](../../../src/features/ikaros/components/CreateNewsModal.tsx) — react-hook-form + zod, plain textarea, toast.
- Schema [`createNewsSchema.ts`](../../../src/features/ikaros/lib/createNewsSchema.ts) — `title 1..300`, `content 1..10000`.
- **Routa `/ikaros/novinky` neexistuje.**
- **Menu položka v `IkarosLayout.tsx` sekci Administrace neexistuje.**

### 3.3 Vzor admin pages

- [`AdminUsersPage.tsx`](../../../src/features/admin/users/pages/AdminUsersPage.tsx) — tab switcher (`useSearchParams`) + paginace inline (`LIMIT = 20`, `useState(page)`) + filters → výchozí vzor pro 3.1.
- [`RoleGuard.tsx`](../../../src/features/admin/components/RoleGuard.tsx) — wrap route v router, renderuje `ForbiddenPage` pro mismatch.
- `src/shared/ui/ConfirmDialog` — pro hard delete confirm.

---

## 4. Návrh řešení

### 4.1 BE rozšíření

#### 4.1.1 Schema — `archived` field

Přidat do `IkarosNewsSchemaClass`:

```ts
@Prop({ default: false, index: true }) archived: boolean;
@Prop() archivedAtUtc?: Date;
@Prop() archivedByUserId?: string;
```

- `archived: false` (default) → novinka je v aktivním listu (dashboard 2.1, FE 3.1 tab „Aktivní").
- `archived: true` → novinka je skrytá z public listu, viditelná jen Admin/Superadminovi v tabu „Archiv".
- `archivedAtUtc` + `archivedByUserId` — audit trail (kdo a kdy zarchivoval). Nevyžadováno pro UI v 3.1, ale ukládáme.
- ⚠️ **Legacy `isActive`** — necháváme být, dál ho ignorujeme. Není v žádném filteru ani UI. Vyčištění je samostatný dluh **D-065** (BE).

📚 *Proč nepoužít `isActive` místo `archived`:* `isActive` nemá v dnešním kódu žádnou sémantickou roli, není filterovaný, není v UI. Použít ho znamená dát mu retroaktivní sémantiku „archiv = isActive false". To rozdmýchá nejasnost (jiný kód může čekat, že `isActive false` = soft-deleted). Lepší explicit nové pole.

#### 4.1.2 Endpointy — rozšíření a 3 nové

| Method | Path | Guard | Body | Popis |
|---|---|---|---|---|
| GET | `/IkarosNews?scope=active\|archived\|all&limit=&offset=` | None | — | Rozšíření existujícího. Default `scope=active` (= dnešní chování, dashboard 2.1 bez změny). `archived` a `all` vyžadují JWT + Admin/Superadmin (kontrola v service podle `?scope`). |
| GET | `/IkarosNews/count?scope=active\|archived\|all` | None / JWT | — | Stejná logika. |
| POST | `/IkarosNews` | JWT | `CreateIkarosNewsDto` | **Beze změny.** |
| **PATCH** | **`/IkarosNews/:id`** | **JWT** | **`UpdateIkarosNewsDto { title?, content? }`** | **Nový.** Update titulu/obsahu. `Admin/Superadmin only`. Vrací updated entity. 404 pokud neexistuje, 403 pokud role nepostačí. |
| **POST** | **`/IkarosNews/:id/archive`** | **JWT** | — | **Nový.** Toggle `archived = true`. Idempotentní (opakované volání = no-op s 200). Audit: `archivedAtUtc = now`, `archivedByUserId = currentUser.id`. |
| **POST** | **`/IkarosNews/:id/unarchive`** | **JWT** | — | **Nový.** Toggle `archived = false`. Idempotentní. Audit fieldy `null`. |
| DELETE | `/IkarosNews/:id` | JWT | — | **Beze změny.** Hard delete (= nevratné, smaže i archivovanou novinku). |

📚 *Proč 2 endpointy `archive` / `unarchive` místo `PATCH { archived: bool }`:* explicit verbs jsou konzistentní s existujícími patterny (`worlds/:id/access-requests/:id/approve|reject`). Audit log je clearer, intent je jasný. Jediný PATCH `archived` by zase šetřil řádky, ale komplikuje role check a auditing.

#### 4.1.3 DTO

Nový soubor: `update-ikaros-news.dto.ts`:

```ts
export class UpdateIkarosNewsDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(10000) content?: string;
}
```

Validace: alespoň jedno pole musí být přítomné (custom validator `@AtLeastOneField(['title', 'content'])` nebo manuální check v service → ChooseService approach).

#### 4.1.4 Service změny

- `findAll({ limit, offset, scope })` — `scope = 'active' | 'archived' | 'all'`. Default `'active'` (zpětně kompatibilní). Filter `{ archived: false }` / `{ archived: true }` / `{}`.
- `countActive()` přejmenovat na `count(scope)` (default `'active'` → BC).
- `update(id, dto, role)` — `assertCanWrite(role)` → `findByIdAndUpdate(id, dto, { new: true })` → 404 if null.
- `archive(id, userId, role)` / `unarchive(id, role)` — `assertCanWrite` → set/unset `archived`, `archivedAtUtc`, `archivedByUserId`.
- **Authz pro `?scope=archived|all`:** GET endpoint potřebuje optional JWT (anon → vidí jen `active`). V Nest lze přes optional guard, nebo přes guard který _vyžaduje JWT_ jen pokud `?scope ≠ active`. **Doporučuji druhý variant** — jednodušší, bez optional JWT magic.

⚠️ **Riziko BC:** dnešní `findAll()` bez argumentů vrací `[]` co je v DB. Pokud testy očekávají, že to vrátí i archivované (před migrací nebyly žádné), musí se naopak ověřit, že po přidání `archived: false` defaultního pole projdou. Migrace produkčních dat: nová pole budou `undefined` → MongoDB filter `{ archived: false }` matchuje i `{ archived: { $exists: false } }`? **NE — musíme buď migraci doplnit, nebo filter změnit na `{ archived: { $ne: true } }`.**

→ Volba: **filter `{ archived: { $ne: true } }`** — žádná migrace dat nutná, existující dokumenty bez `archived` se chovají jako aktivní. Doporučuji.

### 4.2 FE — Route + guard + menu

#### 4.2.1 Router

V `src/app/router.tsx` přidat:

```tsx
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

#### 4.2.2 Menu item v IkarosLayout

V `IkarosLayout.tsx` `RightPanel` sekce **Administrace**, **nad** položkou „Uživatelé":

```tsx
{isAdmin && (
  <Link to="/ikaros/novinky" className={s.navItem} onClick={onNav}>
    <span className={s.navItemIcon}><Newspaper size={18} /></span>
    <span className={s.navItemLabel}>Správa novinek</span>
  </Link>
)}
```

Viditelnost: jen pro `Admin/Superadmin` (= `isAdmin` proměnná už v scope).

### 4.3 FE — Page layout (`IkarosNewsManagementPage`)

Soubor: `src/features/ikaros/pages/IkarosNewsManagementPage/IkarosNewsManagementPage.tsx` (s vlastním `.module.css`).

Layout:

```
┌─ <h1> Správa novinek                            [+ Nová novinka] ─┐
│                                                                    │
│  ┌─ Tabs ────────────────────────────────────────────────────────┐│
│  │ [Aktivní (12)]  [Archiv (3)]                                  ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                    │
│  ┌─ Tabulka ─────────────────────────────────────────────────────┐│
│  │ Nadpis            │ Autor    │ Vytvořeno   │ Akce             ││
│  │ ───────────────────────────────────────────────────────────── ││
│  │ Velký bal příští… │ Tyky     │ 14. 5. 2026 │ ✏️ 📁 🗑️         ││
│  │ Nová verze…       │ Tyky     │ 12. 5. 2026 │ ✏️ 📁 🗑️         ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                    │
│  ◀ 1 2 3 ▶  (paginace, LIMIT = 20)                                │
└────────────────────────────────────────────────────────────────────┘
```

- **Taby** (`?tab=active|archived`, default `active`) — stejný `useSearchParams` pattern jako `AdminUsersPage`. Tab badge `(N)` z `count(scope)`.
- **Tabulka** — sloupce: Nadpis (truncate, tooltip s plným titulem), Autor (username → resolved), Vytvořeno (cs locale), Akce (3 ikony: edit / archive nebo unarchive / delete).
- **Akce v archive tabu:** ikona „📁 Archivovat" → „📤 Obnovit" (unarchive). Delete je dostupný v obou tabech.
- **Paginace:** inline `LIMIT = 20`, `useState(page)` + prev/next + page info — vzor `AdminUsersPage`.
- **„+ Nová novinka"** vpravo nahoře — primary button, otevírá `NewsFormModal` v create módu.

⚠️ **Pozor na mobile:**
- Tabulka na mobilu < 720 px se změní na **stacked cards** (každý řádek = karta titul + autor + datum + akce v patičce karty). Tabulkový layout je na mobilu nečitelný. Vzor: `UsersTable` ve features/users.
- Tab switcher horizontálně scrollovatelný pokud se nevejde (málokdy, jen 2 taby).

### 4.4 FE — Refactor `CreateNewsModal` → `NewsFormModal`

Stávající modal podporuje jen `create`. Refactor:

**Nová API:**

```tsx
type Mode = 'create' | 'edit';

interface Props {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  /** Required pro mode='edit'. */
  initialData?: { id: string; title: string; content: string };
}
```

- `mode='create'` → submit volá `useCreateIkarosNews`, title modalu „Nová novinka", primary button „Vytvořit".
- `mode='edit'` → submit volá nový `useUpdateIkarosNews` (viz 4.5), title „Upravit novinku", button „Uložit". Form `defaultValues` = `initialData`.
- Schema `createNewsSchema` zůstává (titul + obsah validace stejná pro create i edit).

**Soubor přesun / přejmenování:**
- `src/features/ikaros/components/CreateNewsModal.tsx` → `src/features/ikaros/components/NewsFormModal.tsx`.
- Update všech importů (zatím jeden — `PlatformNewsSection.tsx`).
- `PlatformNewsSection` použije `<NewsFormModal mode="create" ...>`.

📚 *Proč rename místo nového `EditNewsModal`:* duplikace 90 % kódu (form, validace, error mapping). Sdílený modal s `mode` propou je čistší a budoucí změny (např. TipTap editor v 3.2) se aplikují na jedno místo.

### 4.5 FE — API hooks (rozšíření `useIkarosNews.ts`)

Nové hooks:

```ts
// Rozšíření existujícího — nyní s paginací a scope filtrem
export function useIkarosNewsList(params: {
  scope: 'active' | 'archived';
  limit: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ['ikaros-news', 'list', params],
    queryFn: () => api.get<IkarosNews[]>('/IkarosNews', { params }),
  });
}

export function useIkarosNewsCount(scope: 'active' | 'archived') {
  return useQuery({
    queryKey: ['ikaros-news', 'count', scope],
    queryFn: () => api.get<{ total: number }>('/IkarosNews/count', { params: { scope } }),
  });
}

export function useUpdateIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { title?: string; content?: string } }) =>
      api.patch<IkarosNews>(`/IkarosNews/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ikaros-news'] }),
  });
}

export function useArchiveIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/IkarosNews/${id}/archive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ikaros-news'] }),
  });
}

export function useUnarchiveIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/IkarosNews/${id}/unarchive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ikaros-news'] }),
  });
}

export function useDeleteIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/IkarosNews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ikaros-news'] }),
  });
}
```

- **`useIkarosNews()` (původní)** ponechat _beze změny_ — používá ho dashboard (2.1). Vrací `IkarosNews[]` z `GET /IkarosNews` bez query params → BE default `scope=active`, neomezené množství (dnes ~malá DB; pokud naroste, dashboard si v rámci 3.1 nebo budoucí fáze přidá `?limit=N` query).
- Všechny mutace invalidují **`['ikaros-news']` prefix** — `react-query` matchuje partial keys, takže invaliduje i `['ikaros-news', 'list', ...]` a `['ikaros-news', 'count', ...]` a `useIkarosNews()` na dashboardu.

### 4.6 Confirm dialogy

- **Delete** → `<ConfirmDialog title="Smazat novinku?" message="Tato akce je nevratná. Novinka bude trvale odstraněna z databáze." confirmLabel="Smazat" confirmVariant="danger" onConfirm={...} />`.
- **Archive** → bez confirm dialogu (revertibilní akce). Toast „Novinka archivována" s undo-link? **NE pro 3.1** — toast bez undo, archiv lze obnovit z tabu Archiv.
- **Unarchive** → bez confirm.

### 4.7 Responsivita

- ≤ 768 px: tabulka přechází na stacked cards (každá novinka = karta).
- ≤ 768 px: „+ Nová novinka" tlačítko se zmenší (jen ikona `+` s aria-label).
- Modal `NewsFormModal` size `md` — full-width na mobile (existující Modal infra).
- Po implementaci spustit skill `mobil-desktop`.

---

## 5. Mimo rozsah

- ❌ TipTap rich-text editor pro `content` — plánováno do 3.1.5 / 3.2 (s články). 3.1 zůstává plain `<textarea>`.
- ❌ Upload obrázku k novince — fáze 3.2 / později.
- ❌ Kategorie / tagy novinek — později.
- ❌ Audit log UI (kdo co kdy archivoval / smazal) — fields se ukládají, UI přijde v 3.6c (universal audit) nebo později.
- ❌ Vyčištění legacy `isActive` pole — dluh **D-065** (BE).
- ✅ ~~Oprava BE controller authz pro `WorldRole.PJ`~~ — dluh **D-069** z 3.1a, uzavřen pre-existujícím commitem před fází A (viz commit `584946d0`).
- ❌ Undo toast pro archivaci — KISS, můžeme přidat později.
- ❌ Bulk akce (archive více najednou) — později, pokud bude poptávka.
- ❌ Search / filter v adminu — později.

---

## 6. Akceptační kritéria

### 6.1 Přístup a navigace

- AK1: Anon → `/ikaros/novinky` redirect na `/login` (loader `requireAuth`).
- AK2: Přihlášený s rolí Ikarus / Spr. článků/galerie/diskuzí / žádná → `/ikaros/novinky` zobrazí `ForbiddenPage` (RoleGuard).
- AK3: Admin nebo Superadmin → `/ikaros/novinky` zobrazí stránku.
- AK4: Položka **„Správa novinek"** v pravém panelu sekce Administrace je viditelná pro Admin/Superadmin, ostatní role ji nevidí.

### 6.2 List a paginace

- AK5: Tab „Aktivní" zobrazuje jen `archived: false` novinky, řazení `createdAtUtc DESC`.
- AK6: Tab „Archiv" zobrazuje jen `archived: true` novinky, stejné řazení.
- AK7: Paginace ukazuje 20 položek per page; prev/next funguje; page info „Strana X / Y".
- AK8: Tab badge `(N)` ukazuje celkový počet pro daný scope.
- AK9: Mobile (≤ 768 px) → tabulka přechází na stacked cards bez ztráty obsahu.

### 6.3 Create

- AK10: Klik na „+ Nová novinka" otevře `NewsFormModal` v create módu s prázdnými poli, focus v `title`.
- AK11: Úspěšný create → toast „Novinka vytvořena", modal zavřen, list aktivních novinek se obnoví (nová položka nahoře).

### 6.4 Edit

- AK12: Klik na edit ikonu v řádku → `NewsFormModal` v edit módu s předvyplněnými poli.
- AK13: Úspěšný update → toast „Novinka uložena", modal zavřen, položka v listu má nové hodnoty.
- AK14: Edit lze i u archivované novinky (z tabu Archiv).

### 6.5 Archiv / Obnovit

- AK15: Klik na archive ikonu v tabu Aktivní → bez confirm, toast „Novinka archivována", položka mizí z Aktivní tabu, objevuje se v Archivu.
- AK16: Klik na unarchive ikonu v tabu Archiv → bez confirm, toast „Novinka obnovena", položka mizí z Archivu, objevuje se v Aktivní.
- AK17: Idempotence — opakované volání endpointu na již-archived novince = 200, žádná chyba.

### 6.6 Delete

- AK18: Klik na delete ikonu otevře `ConfirmDialog` s textem „Tato akce je nevratná" a `confirmLabel="Smazat"` (danger variant).
- AK19: Potvrzení smazání → DELETE request, toast „Novinka smazána", položka mizí z DB i z listu.
- AK20: Delete funguje v obou tabech (Aktivní i Archiv).
- AK21: Cancel v dialogu → nic se nestane.

### 6.7 Chyby

- AK22: BE 403 (z některého endpointu) → toast „Nemáš oprávnění", list se reloadne / akce se zruší.
- AK23: BE 404 (edit / archive / delete neexistující ID) → toast „Novinka nenalezena", list se reloadne.
- AK24: Síťová chyba → toast „Nepodařilo se …", form / dialog zůstává otevřený, uživatel může retry.

### 6.8 Backward compatibility

- AK25: Dashboard (`/`) sekce Novinky funguje beze změny — používá původní `useIkarosNews()` hook, BE `GET /IkarosNews` bez query params = default `scope=active`.
- AK26: 3.1a create modal funguje beze změny (po refactoru na `NewsFormModal` s `mode='create'`).

---

## 7. Testy

### 7.1 BE testy

- `ikaros-news.service.spec.ts` rozšíření (+~12 cases):
  - `findAll({ scope: 'active' })` — vrací jen `archived !== true`.
  - `findAll({ scope: 'archived' })` — vrací jen `archived === true`.
  - `findAll({ scope: 'all' })` — vrací vše.
  - `count(scope)` — správné hodnoty pro 3 scopy.
  - `update(id, dto, role)` — Admin update OK, Ikarus 403, neexistující id 404.
  - `update` — alespoň jedno pole povinné (prázdný DTO = 400).
  - `archive` — toggle nastaví `archived: true` + audit fields.
  - `archive` idempotence — opakovaný call = no-op.
  - `unarchive` — nuluje audit fields.
  - `delete` archived novinku — funguje (smaže i archivovanou).

- `ikaros-news.controller.spec.ts` (pokud existuje, nebo e2e):
  - `GET ?scope=archived` bez JWT → 401.
  - `PATCH` bez JWT → 401.

### 7.2 FE testy

- `NewsFormModal.spec.tsx` rozšíření:
  - `mode='create'` smoke (existující testy z 3.1a — nesmí regressovat).
  - `mode='edit'` render s `initialData` — pole předvyplněná, button „Uložit".
  - `mode='edit'` submit → volá `useUpdateIkarosNews` s correct dto.
  - `mode='edit'` 404 → toast, modal zůstane.

- `IkarosNewsManagementPage.spec.tsx` (nová):
  - Render obou tabů, tab switching přes `useSearchParams`.
  - Tab badge počet z `useIkarosNewsCount`.
  - Klik na „+ Nová" otevře modal v create módu.
  - Klik na edit ikonu otevře modal v edit módu.
  - Klik na archive ikonu → mutation volaná.
  - Klik na delete ikonu → ConfirmDialog se otevře, confirm → mutation.
  - Paginace prev/next mění `page`.

- `useIkarosNews.spec.ts` rozšíření:
  - `useIkarosNewsList` volá GET s correct params.
  - Mutations invalidují `['ikaros-news']` prefix.

- **Cíl:** +18–25 testů FE, +12 testů BE. Existující 3.1a + 2.1 testy nesmí regressovat.

---

## 8. Dluhy & rizika

### 8.1 Otevřené dluhy z 3.1 (tracked)

- ✅ **D-069** (z 3.1a): BE povoluje `WorldRole.PJ` create/delete — **uzavřen** pre-existujícím commitem `584946d0` před fází A (zúžení `assertCanWrite` na `Admin || Superadmin`). PATCH/archive/unarchive ho dědí.
- **D-065** (nový): Legacy `isActive` pole na schemě — nepoužívané, vyčistit v samostatném BE PR.

### 8.2 Rizika

- **Riziko BC při migraci:** existující dokumenty bez `archived` pole. Filter `{ archived: { $ne: true } }` pokrývá. Test musí explicitně ověřit, že stará data se chovají jako aktivní.
- **Riziko UX archivace bez confirm:** uživatel může omylem archivovat. Mitigace: archiv je revertibilní (unarchive), takže ne tak destruktivní jako delete. Pokud feedback nevyhoví, přidáme undo toast v 3.1.1.
- **Riziko sdílený modal:** refactor `CreateNewsModal` → `NewsFormModal` může rozbít 3.1a create flow. Mitigace: existující testy 3.1a (CreateNewsModal.spec.tsx) musí projít beze změny logiky create.
- **Riziko paginace + filter consistency:** klient ukládá `page` v useState; změna tabu resetuje `page` na 1 (jinak by mohl zůstat na neexistující stránce). Vzor `AdminUsersPage` to dělá takto.

### 8.3 Nově vznikající dluhy (po implementaci 3.1)

- **D-066:** Rich-text editor pro `content` (TipTap) — fáze 3.2.
- **D-067:** Audit log UI — později.

---

## 9. Rozhodnutí autora (2026-05-15)

1. **Authz GET `?scope=archived|all`** → **vyžaduje JWT + Admin/Superadmin** (conditional guard v controlleru: `if (scope !== 'active') vyžadovat JWT + role`). Anon vidí jen `active`. ✅
2. **Idempotence archive/unarchive** → **200 + no-op** při opakovaném volání. ✅
3. **PATCH `/IkarosNews/:id` s prázdným DTO** → **400 Bad Request** („Musíš upravit alespoň jedno pole."). ✅
4. **Autor v tabulce** → **live join `Users.username`** (konzistentní s ostatními place, např. dashboard 2.1). Fallback na `authorName` jen pro pre-2026-05-06 záznamy bez `authorId`. ✅
5. **Položka v menu** → **„Správa novinek"** (rozhodnuto PJ — odliší se od dashboardové sekce „Novinky", clearer intent). ✅

---

## 10. Workflow

Spec schválen 2026-05-15. Další krok → **implementační plán** [`plan-3.1.md`](plan-3.1.md).
