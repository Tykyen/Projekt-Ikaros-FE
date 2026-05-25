# Implementační plán — 9.2b Multi-config per svět + editor

**Datum:** 2026-05-25
**Status:** ⏳ Čeká na schválení
**Spec:** [spec-9.2b-multi-config-editor.md](spec-9.2b-multi-config-editor.md)
**Větev:** `main` ([[feedback_work_on_main]])
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE` (FE)

---

## Sub-commit strategie

4 samostatné commits, každý revertovatelný:

| Sub | Repo | Co |
|---|---|---|
| **9.2b-I** | BE | Drop inline `World.calendarConfig` (konsolidace dluhu) |
| **9.2b-II** | BE | Multi-config kolekce + World fields + auto-seed + endpoints |
| **9.2b-III** | BE | Backfill skript + idempotent migrace |
| **9.2b-IV** | FE | Editor stránka `/svet/:worldSlug/admin/kalendare` + API hooky |

Pořadí důležité: I → II → III (vyžaduje I+II hotové) → IV (vyžaduje BE deploy).

---

## 9.2b-I — BE konsolidace dluhu

**Cíl:** Smazat duplicitní inline storage. Sjednotit jediné API pod `world-calendar-config` modul.

### Soubory ke smazání

- `backend/src/modules/worlds/dto/update-calendar-config.dto.ts` — smaz
- `backend/src/modules/worlds/worlds.service.spec.ts` (řádky ~716-770) — smaz testy `updateCalendarConfig`

### Soubory k úpravě

**`backend/src/modules/worlds/schemas/world.schema.ts`**:
```diff
-  @Prop({ type: Object }) calendarConfig?: Record<string, unknown>;
```

**`backend/src/modules/worlds/interfaces/world.interface.ts`**:
```diff
-  calendarConfig?: WorldCalendarConfig;
```

**`backend/src/modules/worlds/interfaces/worlds-repository.interface.ts`**:
```diff
-  updateCalendarConfig(id: string, config: WorldCalendarConfig): Promise<World | null>;
```

**`backend/src/modules/worlds/repositories/worlds.repository.ts`**:
- Smazat method `updateCalendarConfig` (řádky 173-188).
- Smazat z `toEntity` mapping `calendarConfig: doc.calendarConfig as ...` (řádek 210).

**`backend/src/modules/worlds/worlds.service.ts`**:
- Smazat method `updateCalendarConfig` (řádky 1013-1033).
- Smazat import `WorldCalendarConfig` z `worlds.interface` (pokud zbývá nepoužitý).

**`backend/src/modules/worlds/worlds.controller.ts`**:
- Smazat `@Put(':worldId/calendarconfig')` endpoint (řádky 347-359).
- Smazat import `UpdateCalendarConfigDto`.

### Acceptance kroku

```bash
cd Projekt-ikaros/backend
pnpm typecheck   # 0 errors
pnpm lint        # 0 errors
pnpm test:run worlds   # všechny worlds.service testy zelené (kromě smazaných)
```

**Commit:**
```
refactor(9.2b-I-BE): drop inline World.calendarConfig (konsolidace dluhu)

Před: dvojí storage — World.calendarConfig inline + world_calendar_configs
kolekce. Endpoint PUT /worlds/:id/calendarconfig (no dash) zapisoval do
inline; PUT /worlds/:id/calendar-config (dash) do kolekce. Inkonzistentní.

Po: jediný storage = kolekce world_calendar_configs (zatím singular per
svět, multi v 9.2b-II). Endpoint /calendarconfig (no dash) smazán.

Preparation step pro 9.2b-II.
```

---

## 9.2b-II — BE multi-config kolekce + World fields + auto-seed

**Cíl:** Rozšířit kolekci `world_calendar_configs` na N-per-svět. Sjednotit shape s FE. Auto-seed Gregorian.

### Soubor `world-calendar-config.schema.ts`

```ts
@Schema({ timestamps: true, collection: 'world_calendar_configs' })
export class WorldCalendarConfigSchemaClass {
  @Prop({ required: true, index: true }) worldId: string;
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop({ default: 24 }) hoursPerDay: number;
  @Prop({ type: [String], default: [] }) daysOfWeek: string[];
  @Prop({ type: [MixedArraySubSchema], default: [] })
  months: Record<string, unknown>[];
  @Prop({ type: [MixedArraySubSchema], default: [] })
  celestialBodies: Record<string, unknown>[];
  @Prop({ type: [MixedArraySubSchema], default: [] })
  seasons: Record<string, unknown>[];
  @Prop({ default: 0 }) epochOffset: number;
}

export const WorldCalendarConfigSchema = SchemaFactory.createForClass(
  WorldCalendarConfigSchemaClass,
);
// Drop singular index, přidat compound
WorldCalendarConfigSchema.index({ worldId: 1, slug: 1 }, { unique: true });
```

### Soubor `world-calendar-config.interface.ts`

Refactor (drop discriminated union):

```ts
export interface MonthDef {
  name: string;
  daysCount: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  orbitalPeriodDays: number;
  color: string;
  epochOffset: number;
  icon?: string;
}

export interface Season {
  id: string;
  name: string;
  startMonthIndex: number;
  startDay: number;
  color: string;
  icon?: string;
}

export interface WorldCalendarConfig {
  id: string;
  worldId: string;
  slug: string;
  name: string;
  hoursPerDay: number;
  daysOfWeek: string[];
  months: MonthDef[];
  celestialBodies: CelestialBody[];
  seasons: Season[];
  epochOffset: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Soubor `dto/`

Vytvořit:
- `create-world-calendar-config.dto.ts` — povinná `slug`, `name`, optional ostatní (defaults dle schema).
- `patch-world-calendar-config.dto.ts` — vše optional (delta merge per [[feedback_persist_across_variants]]).
- Smazat `upsert-world-calendar-config.dto.ts`.

Nested DTOs: `MonthDefDto`, `CelestialBodyDto`, `SeasonDto` se `class-validator` decorátory.

### Soubor `world-calendar-config.controller.ts`

```ts
@Controller('worlds/:worldId/calendar-configs')
@UseGuards(JwtAuthGuard)
export class WorldCalendarConfigController {
  @Get()
  list(@Param('worldId') worldId: string, @CurrentUser() user: RequestUser) {
    return this.service.list(worldId, user);
  }

  @Get(':slug')
  getOne(@Param('worldId') worldId: string, @Param('slug') slug: string, @CurrentUser() user: RequestUser) {
    return this.service.getBySlug(worldId, slug, user);
  }

  @Post()
  create(@Param('worldId') worldId: string, @Body() dto: CreateWorldCalendarConfigDto, @CurrentUser() user: RequestUser) {
    return this.service.create(worldId, dto, user);
  }

  @Patch(':slug')
  patch(@Param('worldId') worldId: string, @Param('slug') slug: string, @Body() dto: PatchWorldCalendarConfigDto, @CurrentUser() user: RequestUser) {
    return this.service.patch(worldId, slug, dto, user);
  }

  @Delete(':slug')
  remove(@Param('worldId') worldId: string, @Param('slug') slug: string, @CurrentUser() user: RequestUser) {
    return this.service.remove(worldId, slug, user);
  }
}
```

Auth model:
- `list` / `getOne` — world member (žádné Admin/PJ check, jen membership).
- `create` / `patch` / `remove` — PomocnyPJ+.
- `remove` defaultu → 403 `DEFAULT_CONFIG_LOCKED`.

### Soubor `world-calendar-config.service.ts`

Klíčové metody:
- `list(worldId, user)` — vrátí `WorldCalendarConfig[]` všech configů světa.
- `getBySlug(worldId, slug, user)` — vrátí jeden + 404.
- `create(worldId, dto, user)` — insert, slug-unique constraint (409 `SLUG_TAKEN`).
- `patch(worldId, slug, dto, user)` — **delta merge** (per `feedback_persist_across_variants`): `$set` pouze ne-undefined fields.
- `remove(worldId, slug, user)` — pokud `slug === world.defaultCalendarConfigSlug` → 403; jinak delete.
- `seedGregorianDefault(worldId)` — volaná z `worlds.service.create()`, insertne hardcoded Gregorian config + setne `world.defaultCalendarConfigSlug = 'gregorian'`.
- `calculateCelestialStates` — refactor: použít nový `CelestialBody` shape, 8-fázový lunar (port z FE engine 9.2a — kopírovat logiku, ne import přes balíček).

### Soubor `worlds/schemas/world.schema.ts`

Přidat:
```ts
@Prop({ default: 'gregorian' }) defaultCalendarConfigSlug: string;
@Prop({ default: 0 }) timelineEpoch: number;
```

### Soubor `worlds/worlds.controller.ts` + `worlds.service.ts`

Nový endpoint:
```ts
@Patch(':worldId/calendar-defaults')
@UseGuards(JwtAuthGuard)
updateCalendarDefaults(
  @Param('worldId') worldId: string,
  @Body() dto: PatchCalendarDefaultsDto,  // { defaultCalendarConfigSlug?, timelineEpoch? }
  @CurrentUser() user: RequestUser,
) {
  return this.worldsService.updateCalendarDefaults(worldId, dto, user);
}
```

PomocnyPJ+ auth. Pokud `defaultCalendarConfigSlug` change → validovat, že daný slug existuje v kolekci pro daný world (404 jinak).

### Soubor `worlds.service.ts` — auto-seed hook

```ts
async create(dto: CreateWorldDto, user: RequestUser): Promise<World> {
  // ... existing create logic ...
  const world = await this.worldsRepo.create(/* ... */);
  // 9.2b — auto-seed Gregorian default calendar
  await this.calendarConfigService.seedGregorianDefault(world.id);
  return world;
}
```

### BE testy

- `world-calendar-config.service.spec.ts` (refactor) — pokrýt list/create/patch/remove/seed; unique slug; default lock; delta merge A→B→A.
- `worlds.service.spec.ts` rozšíření — auto-seed při create; defaultCalendarConfigSlug update + validation.
- `world-calendar-config.utils.spec.ts` (refactor) — `calculateCelestialStates` s novým shape, 8 fází Měsíce.

### Acceptance

```bash
cd Projekt-ikaros/backend
pnpm prettier --write src/modules/world-calendar-config src/modules/worlds  # per feedback_be_precommit_prettier
pnpm typecheck
pnpm lint
pnpm test:run world-calendar-config worlds
pnpm start:dev  # smoke: POST /worlds → seedGregorianDefault kick
```

**Commit:**
```
feat(9.2b-II-BE): multi-config kolekce + World fields + auto-seed Gregorian

- world_calendar_configs kolekce: drop singular worldId UNIQUE,
  přidat compound {worldId, slug} UNIQUE → N-per-svět.
- CelestialBody shape sjednocen s FE 9.2a (orbitalPeriodDays + epochOffset
  + color + icon). Drop discriminated union per type.
- Přidána pole `seasons[]`, `slug`, `name`, `epochOffset` na config.
- World.defaultCalendarConfigSlug (default 'gregorian') +
  World.timelineEpoch (default 0).
- Endpoints: GET/POST/PATCH/DELETE /worlds/:id/calendar-configs[/:slug]
  + PATCH /worlds/:id/calendar-defaults pro default slug + epoch.
- PATCH = delta merge (feedback_persist_across_variants).
- DELETE default → 403 DEFAULT_CONFIG_LOCKED.
- worlds.service.create() volá calendarConfigService.seedGregorianDefault.
- calculateCelestialStates refactor — port FE engine logiky (8 fází).
```

---

## 9.2b-III — Backfill skript

**Cíl:** Migrace existujících světů — `World.calendarConfig` inline + singular kolekce → multi-config kolekce + Gregorian fallback.

### Soubor `backend/scripts/backfill-multi-calendar-config-9.2b/index.ts`

Strukturně podobné [backfill-lokace-character-9.2/index.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/scripts/backfill-lokace-character-9.2/index.ts):

```ts
/* eslint-disable no-console */
/**
 * Spec 9.2b — Backfill multi-config kalendáře.
 *
 * Pro každý World v DB:
 *   1. Pokud existuje world_calendar_configs doc s worldId == X bez `slug`
 *      → set slug='default', name='Default kalendář', přidat default seasons[]
 *      a sjednotit celestialBodies shape.
 *   2. Pokud existuje World.calendarConfig (legacy inline subdoc)
 *      → přesun do kolekce jako { slug: 'default', name: 'Default kalendář',
 *        ...data }. Smaz inline field z World docu.
 *   3. Pokud nic neexistuje (svět nemá calendar config) → vytvoř Gregorian
 *      default doc (hardcoded shape parita s FE GREGORIAN_DEFAULT_CONFIG).
 *   4. Set World.defaultCalendarConfigSlug = 'gregorian' nebo 'default'
 *      podle toho, který scénář byl použit. Set World.timelineEpoch = 0.
 *
 * Idempotent: opětovné spuštění na již migrovaném světě je no-op
 * (filtr na chybějící defaultCalendarConfigSlug).
 *
 * Default dry-run, --apply pro produkční zápis.
 *
 *   MONGODB_URI=mongodb://... npx tsx scripts/backfill-multi-calendar-config-9.2b/index.ts [--apply] [--world=<id>]
 */
```

### Soubor `README.md`

Stejný pattern jako `backfill-lokace-character-9.2/README.md`:
- Co skript dělá (3 scénáře).
- Jak spustit dry-run / apply.
- Rollback strategy (mongo dump před `--apply`).

### Testy

Volitelný integration test `backfill-multi-calendar-config-9.2b.spec.ts` v `__tests__/` (in-memory mongo) — 3 scénáře.

### Acceptance

```bash
cd Projekt-ikaros/backend
# Dry-run na lokální DB:
MONGODB_URI=mongodb://localhost:27017/ikaros-dev npx tsx scripts/backfill-multi-calendar-config-9.2b/index.ts
# Pak skutečný:
MONGODB_URI=mongodb://localhost:27017/ikaros-dev npx tsx scripts/backfill-multi-calendar-config-9.2b/index.ts --apply
# Ověřit:
mongosh ikaros-dev --eval "db.worlds.findOne({}, { defaultCalendarConfigSlug: 1, timelineEpoch: 1 })"
mongosh ikaros-dev --eval "db.world_calendar_configs.find({}).count()"
```

**Commit:**
```
feat(9.2b-III-BE): backfill skript pro multi-config migraci

Skript migruje existing worlds do nového multi-config modelu:
- Legacy inline World.calendarConfig → kolekce, slug='default'.
- Existing singular kolekce → zachovat, doplnit slug.
- Žádný config → vytvořit Gregorian default.

Idempotent (filter na chybějící defaultCalendarConfigSlug).
Dry-run default, --apply pro produkční běh.
```

---

## 9.2b-IV — FE editor stránka

**Cíl:** Stránka `/svet/:worldSlug/admin/kalendare` (PJ+) pro CRUD kalendářů.

### Routing

`src/router/...` (nebo kde se routy registrují) — přidat:
```tsx
{
  path: '/svet/:worldSlug/admin/kalendare',
  element: <CalendarConfigsPage />,
  guard: WorldRole.PJ,
}
```

### Soubor `src/features/world/pages/CalendarConfigsPage/`

```
CalendarConfigsPage/
├── CalendarConfigsPage.tsx        # wrapper + layout
├── CalendarConfigsPage.module.css
├── CalendarConfigsPage.spec.tsx
├── components/
│   ├── CalendarConfigList.tsx     # sidebar seznam + ⭐ default + add
│   ├── CalendarConfigList.module.css
│   ├── CalendarConfigEditor.tsx   # formulář, 5 sekcí
│   ├── CalendarConfigEditor.module.css
│   ├── MonthRow.tsx               # name + daysCount + ✕
│   ├── CelestialBodyRow.tsx       # name + orbital + color + epoch + ✕
│   ├── SeasonRow.tsx              # name + startMonthIndex + startDay + color + icon + ✕
│   └── DayOfWeekRow.tsx           # label + ✕
├── api/
│   ├── useCalendarConfigs.ts      # list (GET)
│   ├── useCalendarConfig.ts       # single (GET) by slug
│   ├── useCreateCalendarConfig.ts # POST
│   ├── useUpdateCalendarConfig.ts # PATCH (delta merge)
│   ├── useDeleteCalendarConfig.ts # DELETE
│   ├── useSetDefaultCalendarConfig.ts  # PATCH /calendar-defaults
│   └── types.ts                   # mirror BE shapes (nebo re-export z calendarEngine)
├── lib/
│   └── calendarConfigSchema.ts    # zod schema pro form validation
└── __tests__/
    ├── CalendarConfigEditor.spec.tsx
    └── persistence.spec.ts        # A→B→A
```

### Hlavní komponenta `CalendarConfigsPage.tsx`

```tsx
export function CalendarConfigsPage() {
  const { worldSlug } = useParams<{ worldSlug: string }>();
  const { worldId, world, userRole } = useWorldContext();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const { data: configs = [], isLoading } = useCalendarConfigs(worldId);

  // Default: vyber default config nebo první v seznamu
  useEffect(() => {
    if (!selectedSlug && configs.length > 0) {
      setSelectedSlug(world?.defaultCalendarConfigSlug ?? configs[0].slug);
    }
  }, [configs, selectedSlug, world]);

  if (userRole < WorldRole.PJ) return <ForbiddenPage />;
  if (isLoading) return <Spinner center />;

  const selected = configs.find((c) => c.slug === selectedSlug);

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1>Kalendáře světa</h1>
      </header>
      <div className={s.layout}>
        <CalendarConfigList
          configs={configs}
          selectedSlug={selectedSlug}
          defaultSlug={world?.defaultCalendarConfigSlug ?? 'gregorian'}
          onSelect={setSelectedSlug}
          worldId={worldId}
        />
        {selected ? (
          <CalendarConfigEditor
            config={selected}
            isDefault={selected.slug === world?.defaultCalendarConfigSlug}
            worldId={worldId}
          />
        ) : (
          <p className={s.empty}>Vyber kalendář ze seznamu nebo vytvoř nový.</p>
        )}
      </div>
    </article>
  );
}
```

### `CalendarConfigEditor.tsx`

5 sekcí (Identita / Týden / Měsíce / Hodiny / Tělesa / Sezóny) + sticky save bar.

```tsx
const schema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  hoursPerDay: z.number().min(1).max(48),
  daysOfWeek: z.array(z.string().min(1).max(20)).min(1).max(20),
  months: z.array(z.object({ name: z.string().min(1), daysCount: z.number().min(1).max(50) })).min(1).max(30),
  celestialBodies: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    orbitalPeriodDays: z.number().positive(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    epochOffset: z.number(),
    icon: z.string().optional(),
  })),
  seasons: z.array(z.object({ ... })),
  epochOffset: z.number(),
});
type FormValues = z.input<typeof schema>;  // ne z.infer kvůli RHF resolver
```

Reset form na change `config.slug`. Submit → `useUpdateCalendarConfig.mutate(diffOnly)`. Dirty guard.

### `CalendarConfigList.tsx`

```tsx
<aside className={s.list}>
  {configs.map((c) => (
    <button key={c.slug} className={cn(s.item, selectedSlug === c.slug && s.itemActive)}>
      {c.slug === defaultSlug && <Star size={14} aria-label="Výchozí" />}
      <span className={s.itemName}>{c.name}</span>
      <span className={s.itemSlug}>{c.slug}</span>
    </button>
  ))}
  <button className={s.addBtn} onClick={openCreateModal}><Plus size={14} /> Přidat kalendář</button>
</aside>
```

Create modal → form s identitou (slug + name) → POST → refetch + auto-select nový.

### FE testy

- `CalendarConfigsPage.spec.tsx` — render list + select + create flow.
- `CalendarConfigEditor.spec.tsx` — add month, remove season, change color, submit dispatches correct payload.
- `persistence.spec.ts` — A→B→A: vytvořit config, edit `months`, edit `seasons`, ověřit že `months` zůstaly z prvního editu (delta merge).

### Mobile responsivita

`@media (max-width: 768px)`:
- Stack vertikálně: seznam nad, editor pod.
- Seznam scroll-x horizontálně (chip tabs) místo column list.

Per `mobil-desktop` audit po implementaci.

### Acceptance

```bash
cd Projekt-ikaros-FE
npx tsc -b --noEmit                                      # 0 errors
npx eslint src/features/world/pages/CalendarConfigsPage  # 0 errors
npx vitest run src/features/world/pages/CalendarConfigsPage  # all green
# Manual smoke:
npm run dev → /svet/<slug>/admin/kalendare → create "Elfí", edit, save, refresh, ověř perzistenci
```

**Commit:**
```
feat(9.2b-IV-FE): editor stránka /svet/:slug/admin/kalendare

PJ+ stránka pro CRUD multi-configů kalendářů:
- Sidebar seznam s ⭐ default markerem + Add button.
- Editor formulář (5 sekcí): identita / týden / měsíce / hodiny /
  tělesa / sezóny.
- Set as default + delete s confirmation + default lock.
- PATCH delta merge (jen změněné fields → BE).
- Zod validation, RHF s z.input pro resolver.
- Mobile responsivita (vertikální stack ≤768px).

Konzumuje BE endpointy z 9.2b-II. Sdílí FantasyDate/CalendarConfig
typy s calendarEngine z 9.2a.

Nápověda update + mobil-desktop audit follow-up.
```

---

## Závěrečný checklist (across all 4 sub-commits)

- [ ] Build prochází (`pnpm build` BE, `npm run build` FE)
- [ ] Lint 0 errors (BE + FE)
- [ ] Typecheck 0 errors (BE + FE)
- [ ] Testy 100 % zelené
- [ ] Backfill skript dry-run čistý + apply na local DB úspěšný
- [ ] Smoke: nový svět → auto-seed Gregorian funguje
- [ ] Smoke: FE editor CRUD funkční + persistence A→B→A
- [ ] Mobile ≤768px usable
- [ ] `docs/roadmap-fe.md` 9.2b checked
- [ ] `napoveda` aktualizace (nová admin sekce „Kalendáře")

---

## Závislosti a follow-up

Po dokončení 9.2b je odemčeno:
- **9.2c** — refactor `CalendarTab` na mřížku, `FantasyDatePicker`, event `calendarConfigId`.
- **9.2d** — PJ aggregate view s toolbar přepínačem zobrazeného kalendáře.
- **9.2e** — fantasy datum na `WorldNews`.

---

**Po schválení plánu začnu 9.2b-I (BE konsolidace dluhu)**, pak postupně další 3 sub-commits sériově.
