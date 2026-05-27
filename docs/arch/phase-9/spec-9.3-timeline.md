# Spec 9.3 — Timeline (historická osa světa)

**Status:** APPROVED (Q1–Q14 uzavřeny 2026-05-25) — připraven k implementačnímu plánu.
**Velikost:** XL (jedna iterace, FE-heavy, BE 6× rozšíření — search, pageSlug, focal point, getTimelineConfig getter, cursor pagination, year-counts endpoint)
**Motivace (PJ):** „Timeline je primárně osa **nejdůležitějších informací a událostí** světa, aby byly přehledné." Wikipedia-style oficiální chronologie, ne kalendář krátkodobých akcí (to řeší 9.1).

---

## 1 — Cíl

Stránka **`/svet/:worldSlug/timeline`** = vertikální časová osa významných událostí historie světa (vznik říše, války, narození hrdinů, apokalypsa…). Členové čtou, PJ+ spravuje. Fantasy datum (rok / měsíc / den / hodina) ve **fantasy kalendáři** vybraném pro timeline, lightbox obrázků, propojení s wiki stránkami, celestial overrides (zatmění, úplněk na den bitvy…).

**Rozdíl vůči 9.1 (Game Events):**
| | 9.1 Akce | 9.3 Timeline |
|---|---|---|
| Doména | Krátkodobé akce s RSVP | Historické události osy |
| Datum | ISO (reálný kalendář) | Fantasy (rok/měsíc/den/hodina dle config) |
| Karta | RSVP, attendees, countdown | Wiki linky, celestial chips, lightbox |
| Filter | Nadcházející/Archiv | Year-range + search |
| Komentáře | Ano (9.1-II) | **Ne** (osa = oficiální historie) |
| Group viditelnost | Ano (`groupOnly`) | **Ne** (všichni vidí vše) |

---

## 2 — Rozsah

**Jediná iterace 9.3-I.** Žádné dělení (feature je menší než 9.1; nemá komentáře, nemá group filter, nemá archive split).

Pokrývá podkroky roadmapy:
- 9.3a — Historická osa (read, year filter, search, lightbox, wiki linky)
- 9.3b — Správa (PomocnyPJ+ CRUD)
- 9.3c — Celestial overrides

---

## 3 — Datový model

### 3.1 BE existuje (`timeline` module)

```ts
// backend/src/modules/timeline/interfaces/timeline-event.interface.ts
interface TimelineEvent {
  id: string;
  worldId: string;
  year: number;
  month: number;   // 1-based
  day: number;     // 1-based
  hour?: number;   // 0..23
  title: string;   // ≤200
  text: string;    // ≤50 000
  imageUrl: string | null;
  link: string | null;                 // dnes jen http(s)://
  celestialOverrides: CelestialOverride[];
  createdAt; updatedAt;
}

interface TimelineEventResponse extends TimelineEvent {
  celestialStates: CelestialState[];   // BE už vypočítá z calendar config + overrides
}
```

Endpointy hotové: `GET /timeline` (`worldId, limit, fromYear, toYear`), `GET /timeline/:id`, `POST`, `PUT`, `DELETE`. Read = `WorldRole.Hrac+`, Write = `WorldRole.PomocnyPJ+`. Multi-config aware (Q1 viz §3.3).

### 3.2 BE rozšíření 9.3-I

#### A) `search` query parametr (Q5)

PJ chce server-side hledání ve slovech (žádný klient-side fallback). Změny:
- `query-timeline-event.dto.ts` — `@IsOptional @IsString @MaxLength(100) search?: string`
- `controller` — `@Query('search') search?: string` propagace
- `service.findMany({...args, search})` — propagace do repo
- `repo.findMany` — `if (search) match.$or = [{ title: { $regex: escapeRegex(search), $options: 'i' } }, { text: { $regex: escapeRegex(search), $options: 'i' } }]`
- `common/utils/escape-regex.ts` (existující nebo nový) — escape Mongo regex special chars
- BE testy: search → match title, search → match text, search escape `.` `*` `+` literal

📚 *Co je `escapeRegex`: BE nesmí přijmout `.*` v searchi jako wildcard, protože by uživatel mohl spustit DoS regex přes user input. Escapujeme všechny special chars na `\.` `\*` atd.*

#### B) `pageSlug` field — interní wiki link (Q6)

Roadmapa: „odkazy na wiki stránky". Dnes `link` umí jen externí http(s). Přidáme **druhý field** `pageSlug: string | null` (vedle `link`), aby šly použít oba nezávisle (externí URL + interní wiki link na jednu kartu). Změny:
- `timeline-event.schema.ts` — `@Prop({ type: String, default: null }) pageSlug: string | null;`
- `timeline-event.interface.ts` — `pageSlug: string | null`
- `create-timeline-event.dto.ts` + `update-timeline-event.dto.ts` — `@IsOptional @IsString @MaxLength(200) @Matches(/^[a-z0-9-]+$/) pageSlug?: string | null`
- `service.create/update` — propagace
- `repository.toEntity` — mapping (⚠️ povinné — [project_chat_channel_field_checklist](memory/project_chat_channel_field_checklist.md) lesson)
- BE testy: pageSlug create round-trip, pageSlug update na null clearing, pageSlug invalid format → 400

⚠️ **NE** validovat existenci stránky BE-side (může být smazaná a recreated; broken-link handling řešíme FE jako u wikilinků v PageViewer).

🔀 **Alternativa zvážená:** rozšířit `link` regex aby přijímala relativní path `/svet/...` — zamítnuto, dvě sémantiky v jednom poli (externí URL vs. interní slug) komplikují FE rendering.

#### C) `imageFocalX/Y` (Q7) — parita s 9.1/9.5

- `timeline-event.schema.ts` — 2× `@Prop({ default: null, type: Number })` (0–100)
- DTO — `@IsOptional @IsNumber @Min(0) @Max(100) imageFocalX?: number`
- `interface` + `repository.toEntity` + `service` patch propagace
- BE testy: focal round-trip, focal default null = 50/50 (FE render)

#### D) `worldSettings.timelineCalendarSlug` (Q1) + nový `getTimelineConfig` getter

Dnes BE `timeline.service` volá `calendarConfigService.getConfigInternal(worldId)` — sdílený „primární" getter (audit ukazuje konzum z 9.2 + 9.4 budoucí). V 9.2b je multi-config (svět může mít víc kalendářů). PJ chce **explicit volbu** „tento config je pro timeline" — **bez side-effectu na ostatní konzumenty**.

**Rozhodnutí (per uživatel „udělej lepší variantu"):** vyrobit **nový getter `getTimelineConfig(worldId)`**; starý `getConfigInternal` nechat netknutý. Žádné regrese 9.2/9.4.

- `WorldSettings.timelineCalendarSlug: string | null` (null = fallback na první config = backward-compatible chování)
- `world-settings.schema.ts` — nový `@Prop({ default: null, type: String })`
- `world-settings.interface.ts` — nový field
- `world-settings-update.dto.ts` — `@IsOptional @IsString @MaxLength(64) timelineCalendarSlug?: string | null`
- `WorldCalendarConfigService.getTimelineConfig(worldId)`:
  ```ts
  async getTimelineConfig(worldId: string): Promise<WorldCalendarConfig | null> {
    const settings = await this.worldSettingsRepo.findByWorldId(worldId);
    const slug = settings?.timelineCalendarSlug ?? null;
    const configs = await this.findAll(worldId); // existující multi-config getter
    if (!configs.length) return null;
    if (slug) return configs.find(c => c.slug === slug) ?? configs[0];
    return configs[0];
  }
  ```
- `timeline.service` — nahradit 3 volání `getConfigInternal(worldId)` za `getTimelineConfig(worldId)` (řádky [89](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L89), [106](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L106), [129](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L129), [182](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L182)).
- FE: radio „Aktivní pro timeline" v `CalendarConfigsPage` (Q12) — list configs s radio buttonem u jednoho, save → PATCH `worldSettings.timelineCalendarSlug`. PJ+ only (gate už enforced na route).
- BE testy: setting persistuje; `getTimelineConfig` honor (slug set → config B, slug null → config A jako fallback), žádný consumer `getConfigInternal` neovlivněn.

📚 *Multi-config kalendář (9.2b) = svět může mít „Gregoriánský" pro reálné akce a „Elfský" pro fantasy historii. Timeline patří k druhému. Pole `timelineCalendarSlug` říká „použij Elfský".*

#### E) Cursor pagination (Q14) — vyřeš, žádný dluh

Limit 500 dnes znamená useknutí. PJ explicit „žádný dluh, vyřeš" → implementujeme **cursor pagination**. Breaking change response shape — jediný consumer je FE (přepíšeme atomicky).

**Response shape change `GET /timeline`:**
```ts
// PŘED:
TimelineEventResponse[]

// PO:
{
  events: TimelineEventResponse[];
  nextCursor: string | null;  // base64({lastYear, lastMonth, lastDay, lastHour, lastId})
}
```

**DTO rozšíření `query-timeline-event.dto.ts`:**
- `@IsOptional @IsString @MaxLength(200) cursor?: string` — base64 encoded
- `@IsOptional @IsString @IsIn(['asc', 'desc']) sort?: 'asc' | 'desc'` (default `'desc'` per Q2 PJ vize)

**Repo `findMany` rozšíření:**
- Decode cursor → `{year, month, day, hour, id}`
- WHERE clause pro DESC: `(year, month, day, hour, id) < (cursor.year, cursor.month, cursor.day, cursor.hour, cursor.id)` (lexikografický porovnávač přes `$or` nested).
- Sort odpovídá `sort` parametru (default DESC).
- Po vrácení `limit` events vytvoř `nextCursor` z posledního; pokud `events.length < limit`, `nextCursor = null`.

**Limit:** default 100 (lehčí init), max 500.

⚠️ **Cursor stability:** events se nemažou často, ale když ano, cursor zůstává validní (pointuje na hodnoty, ne na index). Edge case: PJ smaže cursor-event mezi requests → next page začne od `<` cursoru, žádný overlap, max 1 duplicit. Akceptováno.

**BE testy:**
- Cursor encode/decode round-trip.
- Stránkování DESC: page 1 vrátí 100 nejnovějších, page 2 starší než cursor, page 3 ještě starší, posledn1 page má `nextCursor: null`.
- Stránkování ASC (`sort=asc`): obrácený pohled.
- Cursor + `fromYear/toYear` + `search` kombinace.
- Invalid cursor (nedekódovatelný base64) → 400 `INVALID_CURSOR`.

#### F) Year-counts endpoint (Q14) — sidebar scrubber

Pro UX rychlé navigace v rozsahu −10 000 až +2039 (12 000+ let) potřebuje PJ skip-to-year sidebar. Plné stránkování by vyžadovalo desítky scroll-loadů.

**Nový endpoint `GET /timeline/year-counts?worldId=`:**
- Response: `Array<{ year: number, count: number }>` sort DESC.
- Mongo aggregate: `[{$match: {worldId}}, {$group: {_id: '$year', count: {$sum: 1}}}, {$sort: {_id: -1}}, {$project: {year: '$_id', count: 1, _id: 0}}]`
- Cache TTL 5 min (TanStack `staleTime: 5 * 60_000`).
- Auth: `WorldRole.Hrac+` (stejný gate jako `findMany`).

**BE testy:**
- Aggregate správně grupuje a sortí.
- Auth: non-member → 403, non-existing world → 404.

#### G) Service rozšíření o search/cursor/sort propagaci (souhrn)

`FindManyArgs` přidat `search?: string`, `cursor?: string`, `sort?: 'asc' | 'desc'`; `repo.findMany` zpracovat všechny.

### 3.3 Skupiny — vyloučeno

Timeline nemá `targetGroup` / `groupOnly` (na rozdíl od 9.1). PJ explicit „všichni vidí". Žádný GroupChip, žádný group filter.

---

## 4 — API mapování

| FE hook | Endpoint | Použití |
|---|---|---|
| `useInfiniteTimelineEvents(worldId, { fromYear, toYear, search, sort })` | `GET /timeline?worldId=&fromYear=&toYear=&search=&sort=desc&cursor=&limit=100` | Hlavní infinite list (cursor pagination) |
| `useTimelineYearCounts(worldId)` | `GET /timeline/year-counts?worldId=` | Sidebar scrubber se seznamem roků + counts |
| `useTimelineEvent(id)` | `GET /timeline/:id` | (volitelně — karta pravděpodobně umí vše) |
| `useCreateTimelineEvent()` | `POST /timeline` | Modal Vytvořit (PJ+) |
| `useUpdateTimelineEvent()` | `PUT /timeline/:id` | Modal Upravit (PJ+) |
| `useDeleteTimelineEvent()` | `DELETE /timeline/:id` | Kebab Smazat (PJ+) |
| `useUploadImage()` | reuse existující (3.1b) | Image upload v modalu |
| `useCalendarConfigs(worldId)` | reuse 9.2b | Načte všechny configs |
| `useWorldSettings(worldId)` | reuse | Čte `timelineCalendarSlug` → vybere aktivní config |
| `useUpdateWorldSettings()` | reuse | PATCH `timelineCalendarSlug` z `CalendarConfigsPage` |
| `usePagesDirectory(worldId)` | reuse | Pro `PagePicker` ve `pageSlug` field |

**Sort:** BE-side (default `desc` = nejnovější rok nahoře, v rámci roku ASC díky compound sort `year DESC, month ASC, day ASC, hour ASC` — kompromis „rok DESC, v rámci roku chronologicky").

📚 *Co je infinite query: TanStack hook, který drží pole stránek a má `fetchNextPage()`. FE intersection observer na poslední kartě zavolá `fetchNextPage()`, hook připojí novou stránku.*

**Limit invalidace:** create/update/delete invaliduje **celý** `useInfiniteTimelineEvents` query + `useTimelineYearCounts`. Optimistic update jen u delete (mizí karta okamžitě).

---

## 5 — Route + navigace

Route už existuje: `{ path: 'timeline', element: memberOnly(p(TimelinePage)) }` v [src/app/router.tsx:253](src/app/router.tsx#L253).

Změny:
- [TimelinePage.tsx](src/features/world/pages/TimelinePage.tsx) — nahradit `<WorldStubPage area="timeline" />` reálnou implementací.
- [worldStubMap.ts:61](src/features/world/pages/worldStubMap.ts#L61) — odstranit záznam `timeline` (není stub).
- World nav — label „Časová osa" už existuje (z 9 navigation refactor). Ověřit hidden flag (`WorldSettings.hiddenNavItems` může timeline schovat — respect).

---

## 6 — UI struktura

```
TimelinePage/
  TimelinePage.tsx              — orchestrátor (useInfiniteTimelineEvents + useCalendarConfigs + useWorldSettings + useTimelineYearCounts)
  TimelineToolbar.tsx           — year range + search + "+ Nová" (PJ+)
  TimelineAxis.tsx              — vertikální osa, eventy mapped do <TimelineEventNode>, dolní intersection observer fetchNextPage
  YearScrubber.tsx              — pravý sidebar (desktop) / collapsible drawer (mobil): list roků + counts, klik = scroll to year
  components/
    YearMarker.tsx              — sticky bublina s rokem mezi skupinami, "Rok 1453" / "Rok 487 př. n. l." (BC)
    TimelineEventNode.tsx       — bod na ose + karta
    TimelineEventCard.tsx       — vlastní karta (date, image, text/markdown, celestial chips, links, kebab)
    TimelineEventModal.tsx      — create/edit modal (RHF + zod)
    CelestialChip.tsx           — ikonka fáze + tooltip „Měsíc Lyra: úplněk"
    CelestialOverrideSection.tsx — sekce v modalu pro každé těleso z aktivního configu
    FantasyDateInput.tsx        — group inputu (year/month/day/hour) s validací dle config, year umí ± neomezeně
    TimelineLightbox.tsx        — reuse `GalleryLightbox`
  api/
    useTimelineEvents.ts        — useInfiniteTimelineEvents + CRUD hooky
    useTimelineYearCounts.ts    — year scrubber data
  lib/
    formatFantasyDate.ts        — utility "Rok 1453, 3. Vědurnu, 14:00" / "Rok 487 př. n. l."
    timelineEventSchema.ts      — zod (s celestialOverrides, pageSlug, focal)
    getActiveCalendarConfig.ts  — z useCalendarConfigs[] + worldSettings.timelineCalendarSlug → vybraný
    cursorCodec.ts              — base64 encode/decode (FE jen passuje opaque string z BE, codec slouží pro testy)
```

### 6.1 — Vertikální osa (Q3-B) + infinite scroll + year scrubber

**Layout (desktop ≥1024 px):** 3 sloupce — `[YearScrubber 200px] [TimelineAxis 1fr] [— prázdné/padding —]`. Centrální čára v `TimelineAxis` (1 px svislá `border-left`) s kruhovými „nodes". Karty střídavě vlevo/vpravo od čáry.

**Layout (mobil <1024 px):** 1 sloupec — `[TimelineAxis full]`. `YearScrubber` jako collapsible drawer (toggle btn v toolbaru, „📅 Skok na rok"). Karty všechny napravo od levého railu (rail = `border-left` při left edge).

**`YearScrubber`:** vertikální seznam roků s counts (`"2039 (12)" "2038 (5)" ...`). Sort DESC. Sticky scroll-aware: aktuálně viditelný rok zvýrazněn. Klik = `scrollIntoView` na `YearMarker` daného roku (musí být načtený přes infinite query — jinak load chunk s `fromYear=year&toYear=year`).

**Sticky `YearMarker`:** velký rok jako bublina mezi skupinami eventů ze stejného roku. Sticky-top při scrollu, mizí při překryvu dalším markerem. Formátování: `"Rok 1453"` pro AD (year > 0), `"Rok 487 př. n. l."` pro BC (year ≤ 0). 📚 *Rok 0 zpravidla neexistuje v reálných kalendářích, ale ve fantasy se PJ rozhoduje sám — neenforced, year=0 zobrazíme jako "Rok 0".*

**Infinite scroll:** dolní intersection observer 200 px před koncem listu → `fetchNextPage()`. Pokud `hasMore === false` → footer „⏳ Konec osy (nejstarší událost)".

**Sort:** BE-side DESC default — nejnovější rok nahoře, v rámci roku ASC (`month/day/hour ASC` ve stejném roku).

**Animace:** karta při scroll-into-view fade+slide z příslušné strany (CSS `@keyframes` + IntersectionObserver `threshold: 0.15`). Lightweight.

**📚 Proč ne centrální layout na mobilu:** ≤768 px je málo místa, střídání levo/pravo by dělalo 80 px karty = nečitelné.

### 6.2 — `TimelineEventCard`

Sekce:
1. **Datum chip** (top): `formatFantasyDate(event, config)` → např. „1453 / 3. Vědurnu / 14:00".
2. **Celestial chips** (Q9-A): `event.celestialStates.map` → ikonka (8 SVG fází) + body name v tooltipu. Maximálně 3 viditelné, zbytek „+N".
3. **Title** (h3, ≤200 znaků).
4. **Hero image** (pokud `imageUrl !== null`): click → `GalleryLightbox`. Focal point `object-position: {focalX}% {focalY}%`. Bez fallbacku (no image = sekce skrytá).
5. **Text** (markdown, Q11): markdown render přes existující sanitizer (reuse z PageViewer / WorldNewsCard). Wikilinky `[[stránka]]` resolved přes `useWikilinkExtension`.
6. **Links footer**:
   - `link !== null`: chip „🔗 Externí odkaz" → otevře v novém tabu.
   - `pageSlug !== null`: chip „📖 Související stránka: {title}" → `<Link to={'/svet/${worldSlug}/${pageSlug}'}>`. Title resolved z `usePagesDirectory`. Broken-link fallback (stránka smazána): chip s pruhem + tooltip „Stránka neexistuje".
7. **Kebab** (PJ+ only, top-right): `Upravit | Smazat`.

### 6.3 — `TimelineEventModal`

Pole formuláře:
- **Title** (`<input>`, required, ≤200).
- **Fantasy datum** (`FantasyDateInput`, Q13):
  - `Year` — number input s podporou **záporných** roků (BC). Range = neomezený (PJ vize: −10 000 až +2039 i dál). Žádný `min`/`max` v atributu. Validace: musí být integer. Default = **prázdné** (PJ explicitně zadá).
  - `Month` — `<select>` z `config.months[].name`, required, default prázdné.
  - `Day` — number input, max = `config.months[selectedMonth].daysCount` (dynamicky podle Month), required, default prázdné. Pokud uživatel změní Month a den je > daysCount nového měsíce, day se vyresetuje na prázdné s warningem „Den přepočítán dle nového měsíce".
  - `Hour` — number input 0–23, optional, default prázdné.
  - Edit mód: defaults se naplní z existující eventu (tj. po edit se otevře s předvyplněnými hodnotami).
  - 💡 **Proč prázdné defaults místo „last event +1":** rozsah 12 000+ let znamená, že „last event +1" nemá smysl (PJ může přidávat události zpětně do dávné historie, kupředu, nebo do středu). Prázdné nutí PJ vědomě zadat, žádné nešťastné defaulty.
- **Text** (`<textarea>` s markdown helperem, ≤50 000, Q11 markdown). Live preview toggle (reuse z `PageEditor` ContentPanel pokud existuje).
- **Image upload** + focal-point editor (reuse pattern z `GameEventModal`).
- **Externí URL** (`<input type="url">`, optional, validace http(s)://).
- **Související stránka** (`PagePicker`, reuse z 9.5, optional → `pageSlug`).
- **Nebeská tělesa** (`CelestialOverrideSection`, collapsible — defaultně zavřené):
  - Pro každé `config.celestialBodies[]`:
    - Switch „Přepsat fázi pro tento den"
    - Pokud zapnuto: `<select>` z 8 fází (`new`, `waxing-crescent`, …, `waning-crescent`).
  - 💡 **Proč:** „Den bitvy bylo zatmění" je narativní override mimo cyklus, akceptováno PJ.

### 6.4 — `TimelineToolbar`

- **Year range:** dva number inputy „Od" / „Do" (oba s podporou záporných čísel) + reset button. URL state `?fromYear=&toYear=`. Při change → reset infinite query a refetch od page 1.
- **Search:** debounced (300 ms) input „Hledat v ose…" → URL state `?q=`. Server-side přes `useInfiniteTimelineEvents`. Min 2 znaky pro trigger (jinak send empty).
- **Sort toggle:** přepínač „Nejnovější / Nejstarší nahoře" (DESC default), URL state `?sort=desc|asc`.
- **„+ Nová událost"** button (PJ+ only).
- **„📅 Skok na rok"** btn (mobil only) — toggle `YearScrubber` drawer.

### 6.5 — Empty states

- 0 eventů + PJ+: „Osa je prázdná. Přidej první událost →" (CTA).
- 0 eventů + Hrac: „Osa je zatím prázdná. PJ teprve píše historii."
- 0 výsledků search/filter: „Žádná událost neodpovídá filtrům."

---

## 7 — Permission matrix

| Akce | Hráč (Hrac) | PomocnyPJ | PJ | Admin/Sa |
|---|---|---|---|---|
| Zobrazit osu | ✓ | ✓ | ✓ | ✓ |
| Hledat / filtrovat rok | ✓ | ✓ | ✓ | ✓ |
| Otevřít lightbox | ✓ | ✓ | ✓ | ✓ |
| Kliknout na wiki link | ✓ | ✓ | ✓ | ✓ |
| Vytvořit událost | ✗ | ✓ | ✓ | ✓ |
| Upravit / smazat | ✗ | ✓ | ✓ | ✓ |
| Upravit `worldSettings.timelineCalendarSlug` | ✗ | ✗ | ✓ | ✓ |

BE enforced (`assertCanWrite` → PomocnyPJ+).

⚠️ **„Q10 všichni" interpretováno jako:** všichni členové vidí stejné věci (bez per-group filtrů). **Write zůstává PJ+**, protože timeline = oficiální historie. Pokud chce PJ povolit psaní i hráčům, otevřít diskuzi a změnit `assertCanWrite`.

---

## 8 — Visibility / Active calendar config

### 8.1 — Výběr aktivního config

```
const settings = useWorldSettings(worldId);
const configs = useCalendarConfigs(worldId);
const activeConfig = getActiveCalendarConfig(configs.data, settings.data?.timelineCalendarSlug);

function getActiveCalendarConfig(configs, slug) {
  if (!configs?.length) return null;
  if (slug) return configs.find(c => c.slug === slug) ?? configs[0];
  return configs[0];
}
```

⚠️ **Pokud `configs.length === 0`:** žádný config v světě → zobraz inline warning „Tento svět nemá kalendář. PJ ho musí vytvořit v `Admin/Kalendáře` před přidáním události." Modal `TimelineEventModal` se neotevře (button disabled s tooltipem).

### 8.2 — Celestial states

BE už vrací `celestialStates[]` v response (vypočítané z aktivního configu BE-side). FE jen render přes `CelestialChip`. Při override má `state.source = 'override'` (předpoklad, ověřit v `world-calendar-config.service`), karta neukáže vizuální rozdíl, ale tooltip může říct „přepsáno PJ".

---

## 9 — Acceptance criteria 9.3-I

1. `/svet/:worldSlug/timeline` načte `useInfiniteTimelineEvents(worldId, { sort: 'desc' })` a vykreslí vertikální osu DESC po rocích. Limit 100 events na page, dolní intersection observer fetchuje další.
2. `YearMarker` se objeví mezi skupinami eventů různých roků; sticky při scrollu. BC roky zobrazeny jako „Rok 487 př. n. l.", AD jako „Rok 1453", year 0 jako „Rok 0".
3. `TimelineEventCard` zobrazí: datum chip (fantasy formát z aktivního configu), celestial chips (do 3 + „+N"), title, hero (s focal pointem) → lightbox, text (markdown render), externí link chip, wiki link chip (resolved title z `usePagesDirectory`, broken-link fallback), kebab (PJ+).
4. PJ+ vidí kebab, otevírá `TimelineEventModal` v edit módu. „+ Nová" v toolbaru otevírá modal v create módu.
5. Modal: validace title (1–200), datum (year required, month required dle config, day ≤ config.months[month].daysCount, hour 0–23 nebo prázdné), text (1–50 000), URL (http(s)), pageSlug (existence v `pagesDirectory` resolved zelený checkmark, jinak inline „stránka neexistuje").
6. `CelestialOverrideSection` v modalu: pro každé těleso z aktivního configu switch + select fáze. Override persistuje POST/PUT. Při čtení karta zobrazí `celestialStates[]` z BE response.
7. Year range filter (`?fromYear=&toYear=`) propagován do BE jako `fromYear/toYear`. Server-side filtr.
8. Search (`?q=`) debounced 300 ms, propagován do BE jako `search`. Server-side regex (case-insensitive, escaped).
9. Lightbox: klik na obrázek otevře `GalleryLightbox`, esc/click outside zavře.
10. Wiki link chip: klik → `<Link to={...}>` na stránku. Pokud `pageSlug` neodpovídá existující stránce → chip má strikethrough + tooltip „Stránka neexistuje" + klik je no-op.
11. Hráč (Hrac) **nevidí** kebab, **nevidí** „+ Nová" button. Curl `POST /timeline` → 403.
12. Admin: `WorldSettingsPage` (nebo `CalendarConfigsPage`) má sekci „Kalendář pro timeline" — dropdown z `useCalendarConfigs[]`. PJ+ only. Change persist do `worldSettings.timelineCalendarSlug`.
13. Pokud svět nemá žádný calendar config, stránka zobrazí inline warning a button „+ Nová" je disabled.
14. BE testy (povinné):
    - `search` filter — match title, match text, escape special chars (`.`, `*`, `+`, `(`, `)` literal).
    - `pageSlug` create/update round-trip, invalid format → 400, set na null clearing.
    - `imageFocalX/Y` round-trip, default null = FE render 50/50.
    - `worldSettings.timelineCalendarSlug` persist + `getTimelineConfig(worldId)` honor (slug=A → vrátí A, slug=null → fallback první, slug=neexistující → fallback první). **Žádný regression test `getConfigInternal` (zůstal netknutý).**
    - **Cursor pagination:** encode/decode round-trip, DESC/ASC sort, kombinace s `fromYear/toYear/search`, invalid cursor → 400 `INVALID_CURSOR`, last page má `nextCursor: null`.
    - **Year-counts endpoint:** aggregate group + sort DESC, auth gate stejný jako `findMany`.
    - Záporné roky: POST event s `year: -487` accept; query `fromYear: -1000, toYear: 0` vrací správně.
    - Auth: Hrac POST/PUT/DELETE → 403, GET → 200; non-member → 403; non-existing world → 404.
15. FE testy (povinné):
    - `TimelineEventCard` render (6 stavů: no image / s image / s pageSlug / s linkem / s celestial chips / BC rok).
    - `TimelineEventModal` (create + edit + delete confirm + validace day max dle config + celestial override toggle + záporný rok accept + day-reset při změně month).
    - `TimelineToolbar` (year range URL state + search debounce 300ms + sort toggle).
    - `TimelineAxis` (year grouping + sticky marker + intersection observer fetchNextPage call).
    - `YearScrubber` (klik na rok → scroll + lazy-load chunk pokud rok mimo načtené pages, mobile drawer toggle).
    - Permission: kebab visibility per role, „+ Nová" hidden pro Hrac.
    - `getActiveCalendarConfig` unit (slug match / fallback first / empty configs).
    - `formatFantasyDate` unit (s hodinou / bez / různé měsíce / boundary days / **BC rok** / **rok 0**).
    - `cursorCodec` unit (encode/decode round-trip, invalid base64 throw).
    - CalendarConfigsPage radio „Aktivní pro timeline" (single-selection enforced, PATCH worldSettings.timelineCalendarSlug).
16. Mobil: 1col layout (levý rail + plné karty napravo), modal scrollable, search/filter input full-width, touch targets ≥44 px.
17. Loading skeleton: 3 placeholder karty s pulsing animací.
18. `mobil-desktop` audit ✓ (skill spuštěn po grafice).
19. `napoveda` aktualizace ✓ (sekce „Časová osa" — read pro všechny členy, správa PJ+, vazba na kalendář).
20. `worldStubMap.ts` — odstranit `timeline` záznam.

---

## 10 — Rozhodnutá Q1–Q14 (potvrzeno 2026-05-25)

- **Q1** ✅ Drží calendar config světa určený pro timeline → nový field `worldSettings.timelineCalendarSlug` + **nový `getTimelineConfig(worldId)` getter** (`getConfigInternal` netknutý — žádné side-effecty na 9.2/9.4). Viz §3.2-D.
- **Q2** ✅ DESC default — novější rok nahoře, v rámci roku ASC. BE-side sort (`year DESC, month ASC, day ASC, hour ASC`).
- **Q3** ✅ Centrální čára střídavě (desktop ≥1024 px) + levý rail fallback (mobil <1024 px).
- **Q4** ✅ Year range + search (server-side oba).
- **Q5** ✅ Žádný dluh — BE rozšíření o `search` parametr s regex escape.
- **Q6** ✅ Wiki link přes nový `pageSlug` field (vedle existujícího `link` pro externí URL). PagePicker reuse z 9.5.
- **Q7** ✅ Image focal point (parita s 9.1/9.5) — BE rozšíření o `imageFocalX/Y`.
- **Q8** ✅ Celestial override per body — switch + select fáze v collapsible sekci modalu.
- **Q9** ✅ Celestial chips na kartě (3 viditelné + „+N").
- **Q10** ✅ **Read = všichni členové (Hrac+), Write = PJ + PomocnyPJ.** BE už enforced (`assertCanWrite`).
- **Q11** ✅ **Markdown** — reuse PageViewer sanitizer + wikilinky.
- **Q12** ✅ **`CalendarConfigsPage`** — radio „Aktivní pro timeline" u každé config-row. PJ+ only (gate na route).
- **Q13** ✅ **Prázdné defaults v modalu**, year input s podporou záporných čísel (BC), rozsah neomezený (−10 000 až +2039 a dál). Dynamic day max dle vybraného Month z aktivního config. Edit mód předvyplní z existující eventu.
- **Q14** ✅ **Žádný dluh — vyřešeno cursor pagination + year-counts endpoint** (sidebar scrubber). Infinite query DESC default, limit 100/page.

---

## 11 — Mimo rozsah (9.3)

- **Komentáře** k událostem osy — záměrně mimo (osa = oficiální historie, ne diskuze).
- **WebSocket live sync** — osa se mění zřídka, polling stačí.
- **Per-event calendar config** — všechny eventy v jednom světě používají stejný `timelineCalendarSlug` (PJ vize ne explicit).
- **Eras / epochy** (např. „Před apokalypsou / Po apokalypse" jako sekce) — možný UX dluh.
- **Import / export osy** (JSON / Markdown).
- **Citace / poznámky pod čarou** v textu eventu.
- **Backlink z `pageSlug` → na PageViewer ukázat „Vztažné události osy"** — možný cross-link feature do 9.5/7.x.

---

## 12 — Návaznosti

- **9.2b multi-config** — read-only dependency; bez configu osa nezobrazí formátované datum (fallback raw čísla).
- **9.5 World news** — sdílí `PagePicker`, `FocalPointEditor` (pokud vytaháno do `src/shared/ui/`), markdown sanitizer.
- **5.3 WorldSettings** — rozšíření o `timelineCalendarSlug` field.
- **7 Pages** — `pageSlug` link konzumuje `usePagesDirectory`.
- **9.4 Weather** — možný consumer `getTimelineConfig` getteru, pokud chce počasí brát stejný „herní kalendář".

---

## 13 — Reference

- **BE timeline:** [timeline.controller.ts](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.controller.ts), [timeline.service.ts](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts), [timeline-event.schema.ts](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/timeline/schemas/timeline-event.schema.ts), DTO `create-/update-/query-`, `celestial-override.dto.ts`.
- **FE vzor 9.1 (copy-adapt patterns):** [GameEventCard.tsx](src/features/world/components/GameEventCard/GameEventCard.tsx), [GameEventModal.tsx](src/features/world/components/GameEventModal/GameEventModal.tsx), [useGameEvents.ts](src/features/world/api/useGameEvents.ts).
- **FE vzor 9.5 PagePicker:** [PagePicker.tsx](src/features/world/components/PagePicker/PagePicker.tsx).
- **FE 9.2b multi-config:** [useCalendarConfigs.ts](src/features/world/api/useCalendarConfigs.ts), [CalendarConfigsPage](src/features/world/pages/CalendarConfigsPage/).
- **FE lightbox:** [GalleryLightbox.tsx](src/features/world/pages/PageViewer/components/GalleryLightbox.tsx).
- **FE stub:** [TimelinePage.tsx](src/features/world/pages/TimelinePage.tsx), [worldStubMap.ts](src/features/world/pages/worldStubMap.ts).
- **Route:** [src/app/router.tsx:253](src/app/router.tsx#L253).
- **Roadmap blok:** [docs/roadmap-fe.md:1483-1490](docs/roadmap-fe.md#L1483-L1490).
