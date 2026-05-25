# Plán 9.5 — Světové novinky parita s 9.1 (implementace)

**Spec:** [spec-9.5-world-news-parity.md](spec-9.5-world-news-parity.md) (APPROVED 2026-05-25, Q1–Q5 = A)
**Status:** DRAFT — čeká na souhlas, pak implementace
**Rozsah:** BE drobné rozšíření (4 fields) + FE refactor karty/modalu + nová sdílená komponenta `<PagePicker>` + `<TypeChip>`.

---

## Závislosti

- 9.1 game events hotové (vzor pro karty/modaly)
- Reuse `useUploadImage` z `@/features/ikaros/api/`
- Reuse `usePagesDirectory` z `@/features/world/pages/api/`
- Reuse `ConfirmDialog`, `KebabMenu`, `Modal`, `Button`, `Input` z `@/shared/ui`
- Pre-existující `WorldNewsPage`, `NewsColumn`, `WorldNewsCard`, `WorldNewsEditorModal` (refactor, ne nová stavba)

---

## Fáze 1 — BE (`Projekt-ikaros/backend/src/modules/world-news/`)

### 1.1 — Schema rozšíření

`schemas/world-news.schema.ts`:
```ts
@Prop({ default: null, type: String }) imageUrl: string | null;
@Prop({ default: null, type: Number }) imageFocalX: number | null;
@Prop({ default: null, type: Number }) imageFocalY: number | null;
@Prop({ default: null, type: String }) linkPageSlug: string | null;
```

⚠️ `link` field stávající zachovat (legacy backward compat, Q5-A).

### 1.2 — Interface

`interfaces/world-news.interface.ts`:
```ts
export interface WorldNews {
  // … existující …
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  linkPageSlug: string | null;
}
```

### 1.3 — DTO

`dto/create-world-news.dto.ts`:
```ts
@IsOptional() @IsString() @MaxLength(2048)
@Matches(/^(https?:\/\/|\/)/, { message: 'imageUrl musí být absolutní URL...' })
imageUrl?: string | null;

@IsOptional() @IsNumber() @Min(0) @Max(100) imageFocalX?: number;
@IsOptional() @IsNumber() @Min(0) @Max(100) imageFocalY?: number;

@IsOptional() @IsString() @MaxLength(120)
linkPageSlug?: string | null;
```

`dto/update-world-news.dto.ts` — analog s `@ValidateIf((o) => o.imageFocalX !== null)` pro nullable focal (vzor `update-game-event.dto.ts`).

### 1.4 — Repo mapping

`repositories/world-news.repository.ts` `toEntity`:
```ts
imageUrl: (doc.imageUrl as string | null) ?? null,
imageFocalX: (doc.imageFocalX as number | null) ?? null,
imageFocalY: (doc.imageFocalY as number | null) ?? null,
linkPageSlug: (doc.linkPageSlug as string | null) ?? null,
```

### 1.5 — Service create/update propagace

`world-news.service.ts`:
- `create()` — předat focal/imageUrl/linkPageSlug do repo.create
- `update()` — patch fields pokud `dto.<field> !== undefined`

### 1.6 — BE testy

`world-news.service.spec.ts` (rozšířit existující):
- imageFocal DTO accept (0, 50, 100, null) + reject (-1, 101)
- imageFocal create + update round-trip
- linkPageSlug create + update + null reset
- Repo toEntity vrací null pro legacy dokumenty bez polí

Cíl: BE 1475 → +5 nových testů. Build + lint čistý.

### 1.7 — BE prettier + tests + restart

- `npx prettier --write src/modules/world-news/`
- `npm test` — všechno zelené
- `npm run build`
- **RESTART** `start:dev` (memory `feedback_be_restart_required`)

**Commit BE:** `feat(9.5-BE): world-news image focal + linkPageSlug`

---

## Fáze 2 — FE infrastruktura

### 2.1 — Typ `WorldNewsItem`

`shared/types/index.ts`:
```ts
export interface WorldNewsItem {
  // … existující …
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  /** 9.5 — interní link na wiki stránku světa (priorita před `link`). */
  linkPageSlug?: string | null;
}
```

(`?` optional kvůli legacy dokumentům bez polí.)

### 2.2 — `useWorldNews` hooky

Ověřit existující `useCreateWorldNews` / `useUpdateWorldNews` — pravděpodobně `mutationFn` přijímá full DTO. Žádná změna nutná (BE auto-přijímá nová pole). Pokud DTO interface explicitně typovaný → rozšířit o nová pole.

### 2.3 — `<PagePicker>` (nová sdílená)

**Soubor:** `src/features/world/components/PagePicker/PagePicker.tsx` + `.module.css`

```ts
interface Props {
  worldId: string;
  value: string | null;
  onChange: (slug: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

Logika:
- Načte `usePagesDirectory(worldId)` (typ `Page[]` s slug/title/type)
- Pokud `value` set → chip se title + clear button (`×`)
- Pokud `value` null → input s search; on focus zobrazí dropdown s max 8 výsledky
- Search: case-insensitive substring na `title` + `slug` (cs locale)
- Klik na výsledek → `onChange(slug)` + zavře dropdown
- Esc / click outside → zavře dropdown
- Loading state: spinner v dropdownu

📚 **Page resolution v kartě:** karta dostane `linkPageSlug` jen jako string. Pro zobrazení jména volá `usePagesDirectory(worldId)` a hledá `.find(p => p.slug === linkPageSlug)`. Cache TanStack klíč `['pages-directory', worldId]` se sdílí mezi kartami → 1 fetch per dashboard.

---

## Fáze 3 — FE komponenty

### 3.1 — `<TypeChip>` (nová sdílená)

**Soubor:** `src/features/world/components/TypeChip/TypeChip.tsx` + `.module.css`

```ts
const TYPE_META: Record<WorldNewsType, { label: string; color: string; icon: ReactNode }> = {
  info:   { label: 'Informace', color: 'var(--accent)',          icon: <Info /> },
  alert:  { label: 'Důležité',  color: 'var(--danger)',          icon: <AlertTriangle /> },
  system: { label: 'Systém',    color: 'var(--warning, #f59e0b)', icon: <Settings /> },
};
```

Render: chip s `background: color`, ikona vlevo + label. Bílý text s text-shadow (analog `GroupChip`).

### 3.2 — `<WorldNewsCard>` refactor

**Soubor:** `src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsCard.tsx` + `.module.css`

**Strategie:** přepis na místě (zachová import path). Copy struktura z `GameEventCard`:

Props (rozšířené):
```ts
{
  news: WorldNewsItem;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  /** Slug světa pro interní link na stránku. */
  worldSlug: string;
}
```

Layout:
```
<article className={cardClass} data-archived={news.archived}>
  <div className={s.media}>
    {news.imageUrl
      ? <img src={news.imageUrl} style={{ objectPosition: `${focalX}% ${focalY}%` }} />
      : <FallbackIcon type={news.type} />} {/* Info / AlertTriangle / Settings */}
    {canManage && <KebabMenu items=[Upravit, Archive, Smazat]>}
  </div>
  <div className={s.body}>
    <div className={s.meta}>
      <TypeChip type={news.type} size="sm" />
      <span className={s.dateChip}>{relativeEventDate(news.date)}</span>
      {news.archived && <span className={s.archivedChip}>archivováno</span>}
    </div>
    <h4>{news.title}</h4>
    <p className={s.excerpt}>{plainText(news.content)}</p>
    {(news.linkPageSlug || news.link) && <LinkRow news={news} worldSlug={worldSlug} />}
  </div>
</article>
```

`<LinkRow>` interní:
- Pokud `linkPageSlug` → najít page v `usePagesDirectory` → `<Link to={`/svet/${worldSlug}/${slug}`}>📄 {pageName} →</Link>`
- Jinak pokud `link` → `<a href={link} target="_blank">🔗 Externí odkaz →</a>`

**CSS:** `data-archived="true"` → `opacity: 0.78` (analog `cardPast`).

⚠️ **Stávající testy** (`WorldNewsCard` spec) budou pravděpodobně rozbité po refactoru. Update v fázi 5.

### 3.3 — `<WorldNewsEditorModal>` refactor

**Soubor:** `src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsEditorModal.tsx`

Pole:
- Title (Input, max 200, required)
- Type (`<select>` info/alert/system)
- Date (datetime-local, required)
- Content (textarea, 1–10000, plain text — Q1-A)
- **Image upload** + focal overlay (copy z GameEventModal)
- **Link tabs / row:**
  - `<PagePicker>` (worldId, value=linkPageSlug, onChange) — Q3-A: pokud zvolen, externí link input se disabluje
  - `<Input>` externí URL (legacy `link`) — disabled pokud `linkPageSlug` set
- Submit → `useCreateWorldNews` / `useUpdateWorldNews` s payloadem vč. focal a linkPageSlug

Validace zod (nová `createWorldNewsSchema` v `src/features/world/lib/`):
```ts
.refine(
  (v) => !(v.linkPageSlug && v.link),
  { message: 'Vyber jen jedno — buď stránka, nebo externí odkaz.', path: ['link'] }
);
```

---

## Fáze 4 — Wireup

### 4.1 — `NewsColumn` v dashboardu

`src/features/world/pages/WorldDashboardPage/WorldDashboard/columns/NewsColumn.tsx`:

- Ověřit existenci „+" buttonu v hlavičce pro PJ+ (paralela `EventsColumn` po 9.1 follow-up). Pokud chybí, doplnit.
- Předat `worldSlug` do `<WorldNewsCard>` (kvůli interním linkům).
- Footer link na `/svet/:slug/novinky` — pravděpodobně existuje, ověřit.

### 4.2 — `WorldNewsPage`

`src/features/world/pages/WorldNewsPage/WorldNewsPage.tsx`:

- Wireup nového `WorldNewsCard` (předat `worldSlug` z `useWorldContext`)
- Modal už používá `WorldNewsEditorModal` → automaticky upgraded

---

## Fáze 5 — Testy + audit

### 5.1 — BE testy (fáze 1.6)

Viz výše.

### 5.2 — FE testy

Nové / upravené:
- `PagePicker.spec.tsx` — search filter, klik vybere, clear nulluje, disabled prop, loading state
- `TypeChip.spec.tsx` — 3 varianty (info / alert / system), ikona + label
- `WorldNewsCard.spec.tsx` (update existující) — 5 stavů: bez img / s img / s linkPageSlug / s legacy link / archive
- `WorldNewsEditorModal.spec.tsx` (update) — page picker + external link mutual exclusivity, focal click, submit propaguje payload

### 5.3 — `mobil-desktop` static audit

- Karta 16:9 na mobilu, modal scrollable
- PagePicker dropdown — fit na 320px viewport
- TypeChip readable na sm/md
- Touch targety ≥44px (chip clear, kebab, dropdown items)

### 5.4 — Smoke test (uživatel)

1. Vytvořit novinku s obrázkem + focal point → karta zobrazí
2. Vytvořit novinku s page link → karta má `<Link>` interní
3. Vytvořit novinku s externí URL → karta má `<a target="_blank">`
4. Pokus zvolit oboje → druhé pole disabled (UI vynutí)
5. Archivovat → karta opacity 0.78 + chip „archivováno"
6. Edit existující legacy novinky (s `link` plain) → render OK, edit zachová `link`

---

## Fáze 6 — Polish + commits

### 6.1 — `napoveda` update

`src/features/ikaros/pages/HelpPage/sections/PagesSection.tsx` — záznam „Novinky světa" (path `/svet/:slug/novinky`) rozšířit:

> „Novinky podporují obrázek (s nastavitelným středem výřezu) a odkaz — buď na konkrétní wiki stránku světa (autocomplete), nebo na externí URL. PomocnyPJ a Pán jeskyně tvoří, upravují, archivují (vratné) a mažou novinky."

Aktualizovat datum v `HelpPage.tsx` lead.

### 6.2 — Roadmap

Roadmap fáze 9.5 — označit hotové:
- 9.5a (stránka novinek světa)
- 9.5b (sekce v dashboardu)
- 9.5c (správa PomocnyPJ+)

Pokud roadmap rozlišuje 9.5 bloky, označit dle implementace.

### 6.3 — Commits

- `feat(9.5-BE): world-news image focal + linkPageSlug` (samostatně, BE repo)
- `feat(9.5-FE): novinky parita s akcemi — obrázek + page link + TypeChip` (FE repo)
- `docs(9.5): napoveda + roadmap update` (mergeable do FE commit)

---

## Pořadí provedení

1. Fáze 1 (BE) najednou — schema → DTO → repo → service → testy → prettier → restart
2. Fáze 2 (FE infra) — typ, PagePicker
3. Fáze 3 (komponenty) — TypeChip → WorldNewsCard → Modal
4. Fáze 4 (wireup) — Column + Page
5. Fáze 5 (testy + audit) — průběžně
6. Fáze 6 (polish + commits)

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| `usePagesDirectory` shape neznámý | Ověřit hned na začátku fáze 2.3 (Read soubor) |
| `WorldNewsCard` se používá i jinde než dashboard/page | Grep `WorldNewsCard` — refactor v jednom místě, callsite zachovají props (kromě nového `worldSlug`) |
| Stávající testy rozbité po refactoru | Update jako součást fáze 5 (nový shape karty) |
| PagePicker autocomplete u světa s 1000+ stránek | Limit dropdown na 8 výsledků; search filter před limitem |
| Legacy novinka bez `imageUrl` field | `imageUrl ?? null` v repo → FE renderuje fallback ikonu |
| Mutual exclusivity link/page edge case (user vyplní oboje skrz curl) | Zod refine + BE accepts both (Q3-A), FE pri renderu preferuje `linkPageSlug` |
| Modal/Card stavu po archivaci | Refetch query po mutaci (TanStack invalidate) — pravděpodobně už hotové |

---

## Mimo plán 9.5

- RichText content (Q1-B)
- Multi-page link
- Komentáře pod novinkou (separate spec, paralela 9.1-II)
- Notifikace o nové novince
- PagePicker filter typů (Q2-B)
- Migrace `link` → `linkPageSlug` (Q5-B)
