# Plán 9.3-I — Timeline (implementace)

**Spec:** [spec-9.3-timeline.md](spec-9.3-timeline.md) (APPROVED 2026-05-25)
**Status:** DRAFT — čeká na souhlas, pak implementace
**Rozsah:** Celé 9.3 v jedné iteraci (9.3a + 9.3b + 9.3c). Velikost XL — pořadí BE → FE → testy.

---

## Závislosti

- **Spec hotový a schválený** ✅
- **BE běží lokálně** (`npm run start:dev` v `Projekt-ikaros/backend`) — po BE změnách RESTART nutný (memory [feedback_be_restart_required](memory/feedback_be_restart_required.md))
- **Pre-commit prettier BE** — před BE commitem `npx prettier --write src/modules/timeline src/modules/world-calendar-config src/modules/worlds/interfaces/world-settings.interface.ts src/modules/worlds/schemas/world-settings.schema.ts src/modules/worlds/dto` (memory [feedback_be_precommit_prettier](memory/feedback_be_precommit_prettier.md))
- **Pre-existing**: `useUploadImage` (3.1b), `ConfirmDialog`, `KebabMenu`, `Modal`, `Button`, `Input`, `Switch` (`@/shared/ui`), `PagePicker` (9.5), `GalleryLightbox` (PageViewer), markdown sanitizer (z `WorldNewsCard`/`PageViewer`)
- **World context**: `useWorldContext` (viewerRole, world), `useWorldSettings`, `useCalendarConfigs`, `usePagesDirectory`
- **Working branch:** přímo na `main` (memory [feedback_work_on_main](memory/feedback_work_on_main.md))

---

## Fáze 1 — BE rozšíření (`Projekt-ikaros/backend`)

Pořadí podle dependency grafu. Každý sub-krok = vlastní commit v BE repu.

### 1.1 — `WorldSettings.timelineCalendarSlug` field

**Cíl:** přidat field do `WorldSettings`, aby ho mohli ostatní BE konzumenti číst.

- ✏️ `src/modules/worlds/interfaces/world-settings.interface.ts` — `timelineCalendarSlug: string | null;`
- ✏️ `src/modules/worlds/schemas/world-settings.schema.ts` — `@Prop({ default: null, type: String }) timelineCalendarSlug: string | null;`
- ✏️ `src/modules/worlds/repositories/world-settings.repository.ts` `toEntity` — mapping field (⚠️ povinné dle [project_chat_channel_field_checklist](memory/project_chat_channel_field_checklist.md))
- ✏️ `src/modules/worlds/dto/update-world-settings.dto.ts` — `@IsOptional() @IsString() @MaxLength(64) timelineCalendarSlug?: string | null;`
- ✏️ `src/modules/worlds/world-settings.service.ts` `patch` — propagace
- 🧪 **Test (`world-settings.service.spec.ts`):** A→B→A persistence pattern (memory [feedback_persist_across_variants](memory/feedback_persist_across_variants.md)) — set slug "elf-cal", read, set null, read, set "elf-cal", read.

**Commit:** `feat(world-settings): timelineCalendarSlug field`

### 1.2 — `WorldCalendarConfigService.getTimelineConfig`

**Cíl:** nový getter pro timeline, **bez dotyku** stávajícího `getConfigInternal` (žádné regrese 9.2/9.4).

- ✏️ `src/modules/world-calendar-config/world-calendar-config.service.ts` — přidat:
  ```ts
  async getTimelineConfig(worldId: string): Promise<WorldCalendarConfig | null> {
    const settings = await this.worldSettingsRepo.findByWorldId(worldId);
    const slug = settings?.timelineCalendarSlug ?? null;
    const configs = await this.findAll(worldId);
    if (!configs.length) return null;
    if (slug) {
      const match = configs.find((c) => c.slug === slug);
      if (match) return match;
    }
    return configs[0];
  }
  ```
- ✏️ `src/modules/world-calendar-config/world-calendar-config.module.ts` — pokud `WorldSettingsRepo` ještě není importovaný, přidat (a re-exportovat aby šel injectnout). Audit nutný.
- 🧪 **Test (`world-calendar-config.service.spec.ts`):**
  - `getTimelineConfig` s slug=A → vrátí A
  - slug=null → fallback první
  - slug=neexistující → fallback první (žádný throw)
  - 0 configs → null
- 🧪 **Regression test:** `getConfigInternal` zelený beze změny.

**Commit:** `feat(world-calendar-config): getTimelineConfig getter`

### 1.3 — Timeline service migrace na `getTimelineConfig`

**Cíl:** v `timeline.service` přepnout 4 volání.

- ✏️ `src/modules/timeline/timeline.service.ts` — řádky [89](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L89), [106](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L106), [129](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L129), [182](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L182):
  ```diff
  - const config = await this.calendarConfigService.getConfigInternal(worldId);
  + const config = await this.calendarConfigService.getTimelineConfig(worldId);
  ```
- 🧪 **Test (`timeline.service.spec.ts`):** mock `getTimelineConfig` místo `getConfigInternal`. Existující testy zelené.

**Commit:** `refactor(timeline): switch to getTimelineConfig`

### 1.4 — `pageSlug` field

- ✏️ `src/modules/timeline/schemas/timeline-event.schema.ts` — `@Prop({ type: String, default: null }) pageSlug: string | null;`
- ✏️ `src/modules/timeline/interfaces/timeline-event.interface.ts` — `pageSlug: string | null;` v `TimelineEvent` interface
- ✏️ `src/modules/timeline/dto/create-timeline-event.dto.ts` + `update-timeline-event.dto.ts`:
  ```ts
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, { message: 'pageSlug musí být lowercase kebab-case' })
  pageSlug?: string | null;
  ```
- ✏️ `src/modules/timeline/repositories/timeline.repository.ts` `toEntity` — mapping (⚠️ povinné)
- ✏️ `timeline.service.ts` `create` + `update` patch — propagace
- 🧪 **Test:** create s pageSlug → round-trip, update pageSlug → null clearing, invalid format → 400.

**Commit:** `feat(timeline): pageSlug field for wiki linking`

### 1.5 — `imageFocalX/Y` field

- ✏️ `schemas/timeline-event.schema.ts` — 2× `@Prop({ default: null, type: Number })`
- ✏️ `interfaces/timeline-event.interface.ts` — `imageFocalX: number | null; imageFocalY: number | null;`
- ✏️ DTO create + update — `@IsOptional @IsNumber @Min(0) @Max(100) imageFocalX?: number | null;` + Y
- ✏️ `repository.toEntity` — mapping
- ✏️ `service.create/update` — propagace
- 🧪 **Test:** focal round-trip, default null = FE 50/50.

**Commit:** `feat(timeline): image focal point`

### 1.6 — `search` query parametr + regex escape util

- ✏️ `src/common/utils/escape-regex.ts` (pokud neexistuje):
  ```ts
  export function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  ```
- ✏️ `dto/query-timeline-event.dto.ts` — `@IsOptional() @IsString() @MaxLength(100) search?: string;`
- ✏️ `controller.findMany` — `search` propagace
- ✏️ `interfaces/timeline-repository.interface.ts` `TimelineFindOptions` — `search?: string`
- ✏️ `repository.findMany`:
  ```ts
  if (opts.search) {
    const safe = escapeRegex(opts.search);
    match.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { text: { $regex: safe, $options: 'i' } },
    ];
  }
  ```
- ✏️ `service.findMany` `FindManyArgs` — `search?: string` propagace do repo.
- 🧪 **Test:** search match title, match text, escape `.`, escape `(`, no-match → empty array.

**Commit:** `feat(timeline): server-side search filter`

### 1.7 — Cursor pagination + sort param (breaking response shape)

**Cíl:** přechod z plochého array na `{events, nextCursor}`. Breaking. Atomický commit (FE migrace v fázi 4 navazuje).

- ✏️ `src/modules/timeline/lib/timeline-cursor.ts` (nový):
  ```ts
  export interface TimelineCursor {
    year: number;
    month: number;
    day: number;
    hour: number; // null → -1 sentinel pro porovnání
    id: string;
  }

  export function encodeCursor(c: TimelineCursor): string {
    return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
  }

  export function decodeCursor(s: string): TimelineCursor {
    try {
      const json = Buffer.from(s, 'base64url').toString('utf8');
      const parsed = JSON.parse(json);
      // validate shape
      if (
        typeof parsed.year !== 'number' ||
        typeof parsed.month !== 'number' ||
        typeof parsed.day !== 'number' ||
        typeof parsed.hour !== 'number' ||
        typeof parsed.id !== 'string'
      ) throw new Error('shape');
      return parsed;
    } catch {
      throw new BadRequestException({ code: 'INVALID_CURSOR', message: 'Neplatný cursor' });
    }
  }
  ```
- ✏️ `dto/query-timeline-event.dto.ts`:
  ```ts
  @IsOptional() @IsString() @MaxLength(200) cursor?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sort?: 'asc' | 'desc';
  ```
- ✏️ `interfaces/timeline-repository.interface.ts`:
  - `TimelineFindOptions` přidat `cursor?: TimelineCursor`, `sort?: 'asc' | 'desc'`.
  - Změnit `findMany` návrat na `Promise<{ events: TimelineEvent[]; nextCursor: TimelineCursor | null }>`.
- ✏️ `repository.findMany`:
  - Sort: `sort === 'asc' ? { year:1, month:1, day:1, hour:1, _id:1 } : { year:-1, month:1, day:1, hour:1, _id:1 }` (rok DESC, v rámci roku ASC default).
  - Cursor where (DESC):
    ```ts
    if (opts.cursor) {
      const { year, month, day, hour, id } = opts.cursor;
      match.$or = [
        { year: { $lt: year } },
        // ... lexikografické rozkrokování přes $or
      ];
    }
    ```
    📚 *Lexikografické porovnávání přes 5 polí → 5-level `$or`. Detail v `repository.ts`. Helper `buildCursorWhere(cursor, sort)`.*
  - Po fetch: pokud `events.length === limit`, vyrobit `nextCursor` z posledního; jinak `null`.
- ✏️ `service.findMany` + controller — response shape:
  ```ts
  // controller:
  @Get()
  async findMany(@Query() q, @CurrentUser() u) {
    const result = await this.service.findMany({...}, u);
    return { events: result.events, nextCursor: result.nextCursor };
  }
  ```
  - `service.findMany` vrací `{ events: TimelineEventResponse[]; nextCursor: string | null }` (encoded cursor pro FE).
- 🧪 **Test:**
  - cursor encode/decode round-trip
  - page 1 vrátí 100 nejnovějších, page 2 starší než cursor, last page `nextCursor: null`
  - sort=asc obrácený
  - cursor + fromYear/toYear + search kombinace
  - invalid cursor → 400 INVALID_CURSOR
  - záporné roky (year=-487) — POST accept, query cursor přes BC OK

**Commit:** `feat(timeline)!: cursor pagination + sort param`

### 1.8 — Year-counts endpoint

- ✏️ `interfaces/timeline-repository.interface.ts`:
  ```ts
  yearCounts(worldId: string): Promise<Array<{ year: number; count: number }>>;
  ```
- ✏️ `repository.ts` — Mongo aggregate:
  ```ts
  return this.model.aggregate([
    { $match: { worldId } },
    { $group: { _id: '$year', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $project: { year: '$_id', count: 1, _id: 0 } },
  ]).exec();
  ```
- ✏️ `service.yearCounts(worldId, requester)` — `await assertMember(...)`, pak `repo.yearCounts`.
- ✏️ `controller`:
  ```ts
  @Get('year-counts')
  yearCounts(@Query('worldId') worldId: string, @CurrentUser() u) {
    return this.service.yearCounts(worldId, u);
  }
  ```
  ⚠️ **Pozor na route order:** `year-counts` MUSÍ být před `':id'` routou v controlleru, jinak `:id` ji zachytí. Audit existující order.
- 🧪 **Test:** aggregate správně, auth gate Hrac+ OK, non-member → 403.

**Commit:** `feat(timeline): year-counts aggregate endpoint`

### 1.9 — BE pre-commit + restart

- `npx prettier --write src/modules/timeline src/modules/world-calendar-config src/modules/worlds/{interfaces,schemas,dto}/`
- `npm test` — vše zelené
- **Restart `npm run start:dev`** ([feedback_be_restart_required](memory/feedback_be_restart_required.md))

---

## Fáze 2 — FE shared utility (`Projekt-ikaros-FE`)

### 2.1 — Cursor codec FE (pro testy a debug)

**Soubor:** `src/features/world/pages/TimelinePage/lib/cursorCodec.ts`

```ts
export interface TimelineCursor { year, month, day, hour, id }
export function decodeCursor(s: string): TimelineCursor | null { /* base64url JSON parse */ }
export function encodeCursor(c: TimelineCursor): string { /* */ }
```
- FE jen passuje opaque `nextCursor` z BE do `fetchNextPage`. Codec slouží pro testy + future debug.

### 2.2 — `formatFantasyDate` utility

**Soubor:** `src/features/world/pages/TimelinePage/lib/formatFantasyDate.ts`

```ts
import type { CalendarConfig } from '@/shared/lib/calendarEngine';
import type { TimelineEvent } from '../api/types';

export function formatFantasyDate(
  event: Pick<TimelineEvent, 'year' | 'month' | 'day' | 'hour'>,
  config: CalendarConfig | null,
): string {
  const yearLabel = event.year > 0
    ? `Rok ${event.year}`
    : event.year < 0
      ? `Rok ${Math.abs(event.year)} př. n. l.`
      : `Rok 0`;
  const monthName = config?.months[event.month - 1]?.name ?? `měsíc ${event.month}`;
  const time = event.hour != null ? `, ${String(event.hour).padStart(2, '0')}:00` : '';
  return `${yearLabel}, ${event.day}. ${monthName}${time}`;
}
```
- 🧪 **Test:** AD/BC/0, s hodinou/bez, custom config measurement, fallback bez config.

### 2.3 — `getActiveCalendarConfig` selektor

**Soubor:** `src/features/world/pages/TimelinePage/lib/getActiveCalendarConfig.ts`

```ts
export function getActiveCalendarConfig(
  configs: CalendarConfig[] | undefined,
  slug: string | null | undefined,
): CalendarConfig | null {
  if (!configs?.length) return null;
  if (slug) return configs.find(c => c.slug === slug) ?? configs[0];
  return configs[0];
}
```
- 🧪 **Test:** slug match / slug null fallback / slug neexistující fallback / empty → null.

---

## Fáze 3 — FE TypeScript shared typy + API hooky

### 3.1 — Shared types update

**Soubor:** `src/shared/types/index.ts` (nebo `src/features/world/pages/TimelinePage/api/types.ts` — záleží na pattern repu, audit)

```ts
export interface TimelineEvent {
  id: string;
  worldId: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  title: string;
  text: string;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  link: string | null;
  pageSlug: string | null;
  celestialOverrides: CelestialOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEventResponse extends TimelineEvent {
  celestialStates: CelestialState[];
}

export interface TimelineEventsPage {
  events: TimelineEventResponse[];
  nextCursor: string | null;
}

export interface TimelineYearCount {
  year: number;
  count: number;
}
```

Audit: pokud `WorldSettings` typ je v `src/shared/types/index.ts`, přidat `timelineCalendarSlug: string | null;`.

### 3.2 — `useInfiniteTimelineEvents` hook

**Soubor:** `src/features/world/pages/TimelinePage/api/useTimelineEvents.ts`

```ts
export function useInfiniteTimelineEvents(
  worldId: string | undefined,
  filters: { fromYear?: number; toYear?: number; search?: string; sort?: 'asc' | 'desc' },
) {
  return useInfiniteQuery({
    queryKey: ['timeline', worldId, filters],
    queryFn: ({ pageParam }) => api.get<TimelineEventsPage>('/timeline', {
      params: { worldId, ...filters, cursor: pageParam, limit: 100 },
    }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!worldId,
    initialPageParam: undefined,
  });
}

export function useCreateTimelineEvent(worldId) { /* POST + invalidate */ }
export function useUpdateTimelineEvent(worldId) { /* PUT + invalidate */ }
export function useDeleteTimelineEvent(worldId) { /* DELETE + optimistic remove */ }
```

📚 *Invalidace pattern: po mutaci invaliduj `['timeline', worldId]` (všechny filter kombinace) + `['timeline-year-counts', worldId]`. TanStack zruší cached pages a refetchne first page od cursor=undefined.*

### 3.3 — `useTimelineYearCounts` hook

**Soubor:** `src/features/world/pages/TimelinePage/api/useTimelineYearCounts.ts`

```ts
export function useTimelineYearCounts(worldId: string | undefined) {
  return useQuery({
    queryKey: ['timeline-year-counts', worldId],
    queryFn: () => api.get<TimelineYearCount[]>('/timeline/year-counts', { params: { worldId } }),
    enabled: !!worldId,
    staleTime: 5 * 60_000,
  });
}
```

---

## Fáze 4 — FE TimelinePage scaffold + Toolbar

### 4.1 — Nahradit stub

- ✏️ `src/features/world/pages/TimelinePage.tsx` — smazat stub:
  ```tsx
  export { TimelinePage as default } from './TimelinePage/TimelinePage';
  ```
- ✏️ `src/features/world/pages/worldStubMap.ts` — odstranit `'timeline'` z `WorldStubArea` union + `worldStubMap` recordu.
- ⚠️ Audit consumerů `WorldStubArea` (asi nic, ale ověřit type sync).

### 4.2 — `TimelinePage` orchestrátor

**Soubor:** `src/features/world/pages/TimelinePage/TimelinePage.tsx`

- Načte URL state (`useSearchParams`): `fromYear, toYear, q, sort`.
- Načte `useWorldContext` (worldId, viewerRole).
- Načte `useCalendarConfigs(worldId)` + `useWorldSettings(worldId)` → `getActiveCalendarConfig`.
- Pokud žádný config: render `<EmptyCalendarWarning />` (PJ+ vidí CTA „Vytvořit kalendář" → `/admin/kalendare`).
- Jinak render: `<TimelineToolbar />`, `<TimelineAxis />`, `<YearScrubber />`.

### 4.3 — `TimelineToolbar`

- Year range inputy (oba accept `<0`, žádný `min`/`max`).
- Search input s debounce 300 ms (reuse `useDebounce` z `@/shared/hooks` pokud existuje).
- Sort toggle „Nejnovější/Nejstarší nahoře".
- „+ Nová událost" button (PJ+ only — `viewerRole >= WorldRole.PomocnyPJ`).
- „📅 Skok na rok" mobile-only toggle pro `YearScrubber` drawer.

---

## Fáze 5 — FE Axis + Card + Lightbox

### 5.1 — `TimelineAxis`

**Soubor:** `src/features/world/pages/TimelinePage/TimelineAxis.tsx`

- `data.pages.flatMap(p => p.events)` → group by year.
- Pro každý year render `<YearMarker year={...} />` + eventy.
- Pro každý event render `<TimelineEventNode side={index % 2 === 0 ? 'left' : 'right'} />` (desktop).
- Bottom ref s `useInView` → `fetchNextPage()` (TanStack `hasNextPage` + `isFetchingNextPage` guard).
- Loading skeleton: 3 placeholder karty při `isLoading`.

### 5.2 — `YearMarker`

- Sticky `position: sticky; top: 60px;` (offset world layout header).
- Label: `formatYearLabel(year)` → „Rok 1453" / „Rok 487 př. n. l." / „Rok 0".
- `data-year={year}` atribut pro `YearScrubber` scroll target.

### 5.3 — `TimelineEventNode` + `TimelineEventCard`

- `TimelineEventNode`: `<div class="node-dot" />` (kulička na ose) + `<TimelineEventCard side="left|right" />`.
- `TimelineEventCard`:
  - Top: `formatFantasyDate(event, config)` chip + `CelestialChip[]` (max 3 + „+N" tooltip).
  - Hero image (pokud `imageUrl`): `object-fit: cover; object-position: {focalX}% {focalY}%`. Klik → `GalleryLightbox`.
  - H3 title.
  - Markdown text (reuse sanitizer + wikilinky).
  - Footer chips: externí `link` chip → `<a target="_blank" rel="noreferrer">`, `pageSlug` chip → `<Link>` na wiki (resolved title z `usePagesDirectory`; broken → strikethrough + tooltip).
  - Kebab (PJ+): `Upravit | Smazat` → modal/confirm dialog.

### 5.4 — `CelestialChip`

- Mapping 8 fází na SVG (vyrobit nebo reuse z 9.2 pokud existuje). Audit `world-calendar-config` FE.
- Tooltip: `{body.name}: {phaseLabel}` (cs labels: „nov", „dorůstající srpek", „první čtvrt", „dorůstající měsíc", „úplněk", „couvající měsíc", „poslední čtvrt", „couvající srpek").

---

## Fáze 6 — FE Modal (create/edit/delete)

### 6.1 — `TimelineEventModal`

**Soubor:** `src/features/world/pages/TimelinePage/components/TimelineEventModal.tsx`

- RHF + zod (`timelineEventSchema`):
  - title `z.string().min(1).max(200)`
  - year `z.coerce.number().int()` (žádný min/max — záporné OK)
  - month `z.coerce.number().int().min(1).max(config.months.length)`
  - day `z.coerce.number().int().min(1)` + `.refine(d => d <= config.months[month-1].daysCount)`
  - hour `z.coerce.number().int().min(0).max(23).nullable().optional()`
  - text `z.string().min(1).max(50000)`
  - imageUrl `z.string().nullable().optional()`
  - imageFocalX/Y `z.coerce.number().min(0).max(100).nullable().optional()`
  - link `z.string().url().nullable().optional()`
  - pageSlug `z.string().regex(/^[a-z0-9-]+$/).max(200).nullable().optional()`
  - celestialOverrides `z.array(z.object({ bodyId: z.string(), phase: z.enum([...8 fází]) }))`

### 6.2 — `FantasyDateInput`

- Year input `<input type="number">` — žádný min/max, accept negative.
- Month select z `config.months`.
- Day input — dynamic max dle `config.months[month-1].daysCount`. Při změně month a `day > newMax` → reset day + warning toast „Den přepočítán dle nového měsíce".
- Hour input optional 0–23.

### 6.3 — `CelestialOverrideSection`

- Collapsible (default collapsed).
- Pro každé `config.celestialBodies[]`:
  - `<Switch>` „Přepsat fázi pro tento den"
  - Pokud zapnuto: `<select>` z 8 fází.
- Při toggle off → odstranit override z `celestialOverrides` array.

### 6.4 — Image upload + focal point

- Reuse pattern z `GameEventModal` ([src/features/world/components/GameEventModal/GameEventModal.tsx](src/features/world/components/GameEventModal/GameEventModal.tsx)).
- `useUploadImage` → `imageUrl` URL.
- Focal point overlay (klik na obrázek → `(focalX, focalY)` 0–100).

### 6.5 — PagePicker integrace

- `<PagePicker worldId={worldId} value={pageSlug} onChange={setValue('pageSlug')} />`
- Reuse z 9.5.

### 6.6 — Delete confirm

- `ConfirmDialog` „Smazat událost „{title}"? Tato akce je nevratná." → `useDeleteTimelineEvent`.

---

## Fáze 7 — FE YearScrubber + responsive

### 7.1 — `YearScrubber`

**Soubor:** `src/features/world/pages/TimelinePage/YearScrubber.tsx`

- Načte `useTimelineYearCounts(worldId)` → `Array<{year, count}>`.
- Render seznam `<li>` s `{year} ({count})`, sort DESC.
- Klik na rok:
  ```ts
  const marker = document.querySelector(`[data-year="${year}"]`);
  if (marker) marker.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else {
    // Year není načtený přes infinite query → refetch s fromYear=year&toYear=year
    setFilters({ fromYear: year, toYear: year });
  }
  ```
- Sticky aktivní rok (scroll-aware) — `IntersectionObserver` na všechny `YearMarker` → poslední viditelný = highlight.

### 7.2 — Responsive layout

- **Desktop ≥1024 px:** 2-col layout `[YearScrubber 200px sticky] [TimelineAxis 1fr]`.
- **Mobil <1024 px:** scrubber jako `Drawer` (z `@/shared/ui` pokud existuje, jinak vyrobit lehký `<dialog>` overlay). Toggle btn v `TimelineToolbar`.

### 7.3 — `mobil-desktop` skill audit po dokončení grafiky

---

## Fáze 8 — FE Settings UI (radio v `CalendarConfigsPage`)

### 8.1 — Audit `CalendarConfigsPage`

- Zjistit současný shape (asi list cards, každý config = jedna karta s edit).

### 8.2 — Přidat radio „Aktivní pro timeline"

- Pro každou config-row přidat `<input type="radio" name="timeline-active">`.
- `checked = config.slug === worldSettings.timelineCalendarSlug` (null → první config checked = default).
- `onChange` → mutate `useUpdateWorldSettings({ timelineCalendarSlug: config.slug })` + invalidate `useWorldSettings`.
- Help text: „Tento kalendář se použije pro datum událostí na časové ose světa."
- Permission gate: existuje (PJ+ route).

### 8.3 — Test radio

- Single-selection enforced (uncheck ostatních automatický).
- Save persist do `worldSettings.timelineCalendarSlug`.

---

## Fáze 9 — Testy (souhrn)

### BE testy (v Projekt-ikaros)

| Soubor | Co testovat |
|---|---|
| `world-settings.service.spec.ts` | A→B→A `timelineCalendarSlug` persist |
| `world-calendar-config.service.spec.ts` | `getTimelineConfig` 4 scénáře + regression `getConfigInternal` |
| `timeline.service.spec.ts` | Migrace na `getTimelineConfig`, search, cursor, year-counts, BC year, focal/pageSlug round-trip |
| `timeline.controller.spec.ts` (e2e) | INVALID_CURSOR 400, year-counts auth, sort param |
| `timeline-cursor.spec.ts` (nový) | encode/decode round-trip, invalid base64 |

### FE testy (v Projekt-ikaros-FE)

| Soubor | Co testovat |
|---|---|
| `formatFantasyDate.spec.ts` | AD/BC/0/hodina/bez/fallback config |
| `getActiveCalendarConfig.spec.ts` | 4 scénáře |
| `cursorCodec.spec.ts` | encode/decode + invalid throw |
| `TimelineEventCard.spec.tsx` | 6 stavů render |
| `TimelineEventModal.spec.tsx` | create + edit + validace + celestial toggle + BC year + day reset |
| `TimelineToolbar.spec.tsx` | URL state + debounce + sort |
| `TimelineAxis.spec.tsx` | year grouping + fetchNextPage |
| `YearScrubber.spec.tsx` | klik scroll + lazy load mimo načtené pages + drawer toggle |
| `TimelinePage.spec.tsx` | empty config warning + permission gate (kebab, +Nová) |
| `CalendarConfigsPage.spec.tsx` (rozšířit existující) | radio single-selection + PATCH worldSettings |

---

## Fáze 10 — Závěr (uklid + dokumentace)

### 10.1 — Roadmap

- ✏️ `docs/roadmap-fe.md:1483-1490` — zaškrtnout všechny tři podkroky (9.3a/b/c) + `mobil-desktop` audit, doplnit datum dokončení.

### 10.2 — Napoveda

- Spustit skill `napoveda` — aktualizace sekce „Časová osa" na `/ikaros/napoveda`:
  - Read pro všechny členy
  - Správa pro PJ + PomocnyPJ
  - Vazba na kalendář („Aktivní pro timeline" v `Admin/Kalendáře`)
  - Markdown podpora + wikilinky
  - Negativní roky (BC) podporovány

### 10.3 — Dluhy (žádné očekávané)

Pokud cokoli v průběhu objeví problém mimo scope (broken-link UX, eras grouping), zapsat přes skill `dluh`. **Záměrně bez plánovaných dluhů** dle [feedback_no_debt](memory/feedback_no_debt.md) + Q14 PJ vize.

### 10.4 — Memory update

- Nový memory `project_timeline_calendar_binding.md` — fakt, že timeline má dedicated config přes `worldSettings.timelineCalendarSlug` + `getTimelineConfig` getter (žádný refactor `getConfigInternal`).

---

## Pořadí commitů (souhrn)

**BE repo (`Projekt-ikaros`):**
1. `feat(world-settings): timelineCalendarSlug field`
2. `feat(world-calendar-config): getTimelineConfig getter`
3. `refactor(timeline): switch to getTimelineConfig`
4. `feat(timeline): pageSlug field`
5. `feat(timeline): image focal point`
6. `feat(timeline): server-side search filter`
7. `feat(timeline)!: cursor pagination + sort param`
8. `feat(timeline): year-counts aggregate endpoint`

→ **BE restart** (`npm run start:dev` re-spawn)

**FE repo (`Projekt-ikaros-FE`):**
9. `feat(timeline-fe): shared types + utility (formatFantasyDate, cursorCodec, getActiveCalendarConfig)`
10. `feat(timeline-fe): API hooky (useInfiniteTimelineEvents + useTimelineYearCounts + CRUD)`
11. `feat(timeline-fe): TimelinePage scaffold + toolbar`
12. `feat(timeline-fe): vertikální osa + karta + lightbox + celestial chips`
13. `feat(timeline-fe): modal create/edit/delete + celestial overrides + page picker`
14. `feat(timeline-fe): YearScrubber + infinite scroll + responsive`
15. `feat(calendar-configs): radio "Aktivní pro timeline"`
16. `chore(timeline-fe): remove stub from worldStubMap`
17. `test(timeline-fe): FE testy 10×`
18. `docs(timeline): roadmap + nápověda update`

**Celkem ~18 commitů (8 BE + 10 FE).**

---

## Riziková místa (proaktivně)

- ⚠️ **Cursor lexikografický `$or`** v Mongo — 5-level `$or` musí být správně zformovaný, jinak chybí pagination (overlap nebo skip). Unit test na cursor logic povinný.
- ⚠️ **Route order** `year-counts` PŘED `:id` v controlleru — jinak `/timeline/year-counts` route handler nedostane handle (matchne `:id` = 'year-counts' → 404 EVENT_NOT_FOUND).
- ⚠️ **`WorldCalendarConfigModule` injection** — `WorldSettingsRepo` musí být v providers/imports, jinak `getTimelineConfig` selže DI.
- ⚠️ **Markdown sanitizer dependency** — pokud sanitizer je v `PageViewer` specific (ne shared), nutno refactor do `@/shared/lib/markdown/` nebo duplicate. Audit.
- ⚠️ **PagePicker `usePagesDirectory` cache** — pokud PJ smaže page mezi resolve a render, broken-link chip se objeví až po refetch. Akceptováno (refresh stránky to napraví).
- ⚠️ **Existující `useUploadImage` accept** — ověřit že přijímá generic context (timeline event), ne jen game-event specific. Audit.

---

## Verifikace finální

Po dokončení všech commitů:
1. `npm test` v BE — vše zelené (~50 testů timeline + world-calendar-config + world-settings)
2. `npm test` v FE — vše zelené (~10 nových spec souborů)
3. `npm run typecheck` v FE — žádné nové TS chyby ([feedback_preexist_debt_owned](memory/feedback_preexist_debt_owned.md))
4. Manuální test v UI:
   - Vytvoř 5 timeline eventů (jeden BC rok −487, čtyři AD)
   - Otestuj infinite scroll (limit dočasně sníž na 2 přes URL `?limit=2` pokud BE podporuje, jinak vytvoř 200 přes seed)
   - Otestuj YearScrubber klik
   - Otestuj celestial override → uložení → znovu otevři modal → override persistován
   - Otestuj wiki link → klikni → naviguje na stránku
   - Otestuj BC formátování v kartě + YearMarker
   - Otestuj permission: log in jako Hrac → žádný kebab, žádné +Nová
   - Otestuj responsive: dev tools mobile view → drawer scrubber + 1-col axis
5. Spustit `mobil-desktop` skill (audit per role)
6. Spustit `napoveda` skill (update nápovědy)
