# Plan 9.4-I — Počasí (Reálný svět MVP) — implementační plán

**Spec:** [spec-9.4-pocasi.md](spec-9.4-pocasi.md)
**ETA:** ~5 dní (BE + shared package + FE preset library + UI + testy + audity)
**Status:** DRAFT — čeká na souhlas

---

## 0 — Pre-requisites

- [ ] BE workspace `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend` přístupný
- [ ] `world-weather` module funkční (zkontrolovat `WorldWeatherService.generate()` aktuální chování)
- [ ] `world-settings` service + `world-calendar` service (z 9.2/9.3) přístupné jako moduly importovatelné do `WorldWeatherModule`
- [ ] `npm workspaces` nastavené v root (pokud ne, M0 přidá)

---

## M0 — Variance simulation modul (duplicita + parity gate)

**Rozhodnutí 2026-05-26:** Místo workspace package (A) jdu cesta **E** — duplicita s parity testem v CI obou repos. Důvody:
- Žádný destruktivní refactor (FE a BE zůstávají samostatné repos)
- Žádná dependence na user manuálních akcích (GitHub repo creation, CI pause)
- ETA zachován (~5d), reverzibilní
- Monorepo migrace je **samostatná budoucí fáze** ([plan-monorepo-migration.md](../plan-monorepo-migration.md)) až budou splněny prereqs

**Cíl:** Duplikovaný TypeScript modul pro variance/Markov simulaci v BE i FE. CI gate ověřuje, že stejný seed → identický output.

### Soubory v BE
```
backend/src/modules/world-weather/simulation/
├── index.ts
├── gaussianRandom.ts     # Box-Muller transform s seed
├── markovTransition.ts   # weather type transitions
├── varianceModel.ts      # temp variance + extremes detection
├── seasonalInterp.ts     # 12-měsíční interp s wrap-around
├── koppenStdDev.ts       # per-zone std dev tabulka
└── markovMatrices.ts     # per-zone Markov matrices
```

### Soubory v FE (1:1 kopie)
```
Projekt-ikaros-FE/src/features/world/lib/weatherSimulation/
├── index.ts              # IDENTICAL with backend
├── gaussianRandom.ts     # IDENTICAL
├── markovTransition.ts   # IDENTICAL
├── varianceModel.ts      # IDENTICAL
├── seasonalInterp.ts     # IDENTICAL
├── koppenStdDev.ts       # IDENTICAL
└── markovMatrices.ts     # IDENTICAL
```

### Parity test gate

**BE test** (`backend/src/modules/world-weather/simulation/parity.spec.ts`):
```ts
import { generateTemperature } from './varianceModel';

describe('Variance parity (BE-FE)', () => {
  const FIXTURES = [
    { seed: 42, monthIndex: 0, day: 1, expected: -3.1 },
    { seed: 42, monthIndex: 6, day: 15, expected: 24.7 },
    // ... cca 20 fixtures pokrývající extrémy + běžné dny
  ];

  it.each(FIXTURES)('seed $seed month $monthIndex day $day → $expected', ({ seed, monthIndex, day, expected }) => {
    const result = generateTemperature({ monthIndex, day, seed, config: PRAHA_CONFIG });
    expect(result).toBeCloseTo(expected, 1);
  });
});
```

**FE test** (`Projekt-ikaros-FE/src/features/world/lib/weatherSimulation/parity.spec.ts`):
```ts
// IDENTICAL fixtures + IDENTICAL assertions
```

⚠️ **CI gate:** pokud BE i FE neprocházejí stejnou parity sadou, build fail. Drift se chytí okamžitě.

### Sync workflow (manuální, ale dokumentovaný)

Při změně variance logiky:
1. Změna v BE `simulation/`
2. Spustit `npm run sync-simulation-to-fe` (skript v BE `scripts/`) — kopíruje BE files → FE
3. Spustit `npm test` v BE i FE — parity test musí projít
4. Commit současně v BE i FE (single PR title `(sim): description`)

**Skript `scripts/sync-simulation-to-fe.ts`:**
```ts
// Copy backend/src/modules/world-weather/simulation/* →
//      ../Projekt-ikaros-FE/src/features/world/lib/weatherSimulation/*
// Pre-flight: check FE checkout exists, files have header "// AUTO-COPIED FROM BE — DO NOT EDIT"
// Post-flight: print diff summary
```

⚠️ **Riziko:** developer manuálně edituje FE kopii → drift. Mitigace: file header warning + parity test gate + sync skript.

### Deliverables
- [ ] BE `simulation/` modul vytvořen s 6 soubory
- [ ] FE `weatherSimulation/` kopie s file header „AUTO-COPIED"
- [ ] `scripts/sync-simulation-to-fe.ts` v BE
- [ ] Parity test v obou (BE + FE)
- [ ] CI runs parity test v obou repos
- [ ] README sekce „Sync workflow" v BE world-weather

### Budoucnost: monorepo migrace

Plán [plan-monorepo-migration.md](../plan-monorepo-migration.md) zůstává dostupný. Až bude user připraven:
- Vytvořit `Tykyen/Projekt-Ikaros` GitHub repo
- Mít info o BE feat/krok-10f stavu
- Pozastavit CI/CD pro migraci

Pak A-3 lze provést jako samostatná phase. Aktuální E je **pragmatic intermediate**.

---

## M1 — BE rozšíření (1 den)

### M1.1 — `displayOrder` field + reorder endpoint

**Soubory:**
- `backend/src/modules/world-weather/schemas/weather-generator.schema.ts` — add `@Prop({ default: 0, index: true }) displayOrder: number`
- `backend/src/modules/world-weather/interfaces/weather-generator.interface.ts` — add `displayOrder: number`
- `backend/src/modules/world-weather/repositories/weather-generator.repository.ts` — `getAll` sort `{ displayOrder: 1, createdAt: 1 }`, `reorder(worldId, orderedIds)` method
- `backend/src/modules/world-weather/dto/reorder-generators.dto.ts` — `@IsArray @IsString({ each: true }) orderedIds: string[]`
- `backend/src/modules/world-weather/world-weather.service.ts` — `reorder(worldId, dto, user)` method s role gate PomocnyPJ+
- `backend/src/modules/world-weather/world-weather.controller.ts` — `@Put('reorder')` endpoint
- `backend/scripts/migrations/2026-05-XX-weather-generators-displayOrder.ts` — backfill existing dokumenty (`orderedByCreatedAt` → `displayOrder = index`)

**Testy:** `world-weather.service.spec.ts` rozšířen — `reorder` validuje completeness orderedIds, gate role, atomicity.

### M1.2 — Calendar integration v `generate()`

**Soubory:**
- `backend/src/modules/world-weather/world-weather.module.ts` — `imports: [WorldsModule, WorldCalendarModule]`
- `backend/src/modules/world-weather/world-weather.service.ts`:
  - Inject `WorldsService` + `WorldCalendarService`
  - `generate(worldId, id, user)`:
    1. Načti `worldSettings = await worldsService.getSettings(worldId)`
    2. Pokud `worldSettings.calendarSlug`: načti `calendarConfig = await worldCalendarService.getConfig(worldId, slug)` → spočítej `currentMonthIndex` z `worldSettings.currentInGameDate` (nebo default 0)
    3. Jinak: fallback Gregorian, `currentMonthIndex = new Date().getMonth()`
    4. Předej `currentMonthIndex` + `monthsTotal` do generation core (`@ikaros/weather-simulation`)
- `backend/src/modules/world-weather/interfaces/weather-generator.interface.ts` — `WeatherResult.calendarMonth?: { name; index; total } | null`

### M1.3 — Variance & Markov model v generate()

**Soubory:**
- `backend/src/modules/world-weather/services/weather-generator-core.ts` (nový) — orchestruje generování:
  1. `generateTemperature(monthIndex, day, config)` (z shared package)
  2. `transitionWeatherType(prevType, config.climateZone)` (z shared package)
  3. `isAnomaly(temp, monthlyAvg, stdDev)` → flag
- `interface WeatherGeneratorConfig` rozšířena o:
  - `monthlyTemps: number[12]`
  - `monthlyStdDev: number[12]`
  - `climateZone?: KoppenZone` (optional, default → derived from temps)

**Migrace:** existující generátory nemají `monthlyTemps/StdDev` — backfill: pokud chybí, použij `tempMin/Max` jako 2 referenční body a interpoluj (best-effort). Doc: nové generátory dostávají full 12-měsíční data z presetů.

### M1.4 — BE testy

- [ ] `parity.spec.ts` — deterministic seed test (BE generate s seed=42 → stable output)
- [ ] `reorder.spec.ts` — validace, role gate, atomicity
- [ ] `calendar-integration.spec.ts` — bez calendarSlug, s Gregorian, s custom 13-month calendar
- [ ] `variance.spec.ts` — anomaly flag, Markov persistence

**BE komandy:**
```bash
cd backend && npm run test
npx prettier --write src/modules/world-weather/  # memory feedback_be_precommit_prettier
```

⚠️ **Memory `feedback_be_restart_required`:** po BE změnách `restart nest --watch`, FE refresh nestačí.

---

## M2 — FE preset library (1 den)

### M2.1 — Adresářová struktura

```
src/features/world/pages/WorldWeatherPage/data/
├── realWorld/
│   ├── index.ts                    # export REAL_WORLD_CATALOG (struct: kontinent → země → měst)
│   ├── europe.ts                   # ~40 zemí
│   ├── asia.ts                     # ~45 zemí
│   ├── africa.ts                   # ~35 zemí
│   ├── americas.ts                 # 30 zemí (sev/stř/jih)
│   ├── oceania.ts                  # 8 zemí
│   └── extremes.ts                 # 7 reálných extrémů (Naica, Vostok, Death Valley, ...)
├── archetypes/
│   ├── index.ts                    # export ARCHETYPE_CATALOG
│   ├── koppen.ts                   # 16 Köppen klimatických zón
│   ├── seas.ts                     # 6 mořských prostředí
│   └── (fantasy/scifi v 9.4-II/-III)
├── mappers/
│   ├── countryToConfig.ts          # CountryData → WeatherGeneratorConfig
│   ├── inferKoppenZone.ts          # auto-detect Köppen z monthlyTemps
│   └── archetypeToConfig.ts        # Archetype → config
└── presets.spec.ts                 # validace všech proti BE schema (Zod)
```

### M2.2 — Verifikace dat ze staré DB

**Postup:**
1. Importuj `C:/Matrix/Matrix/frontend/src/data/weatherData.ts` → parsuj 1360 ř.
2. Per země: cross-check `monthlyTemps[12]` proti Wikipedia climate boxes (sample 20 zemí ručně)
3. Pokud rozdíl > 2°C v měsíci → upravit dle Wikipedia
4. Per země: odvodit `monthlyStdDev` z Köppen zóny (`inferKoppenZone(temps)`)
5. Per země: napsat block comment s `sourceLevel: DOCUMENTED` + `source: Wikipedia climate data, Climate Atlas, cross-referenced 2026-05`

**Risk:** ručně sample 20 zemí = ~2 hodiny práce. Zbylých 130 trust the source DB.

### M2.3 — Köppen zóny (16) — DOCUMENTED

Každá zóna v `koppen.ts` má:
- `monthlyTemps[12]` (reference průměry pro zónu)
- `monthlyStdDev[12]` (z research)
- `climateZone: 'Cfb' | 'Csa' | ...` Köppen kód
- `markovMatrix` (z shared package)
- `defaultHazards` (mlha pro mořské, ledovka pro mírné, sněh pro kontinentální)
- block comment s `sourceLevel: DOCUMENTED, source: Peel et al. 2007 Hydrol. Earth Syst. Sci.`

### M2.4 — Mořská prostředí (6) — DOCUMENTED

Otevřený oceán (mírný), korálový atol (tropický), severní moře (drsné), karibské vody (warm), subarktické moře, hluboké moře.
Source: WMO Sea State Code, NOAA buoy data.

### M2.5 — Reálné extrémy (7) — MEASURED

Naica (García-Ruiz 2007), Vostok (sovětská 1983), Death Valley (NOAA 1913), Cherrapunji, Antarktické dry valleys, Mariana Trench, Yellowstone hot springs.

### M2.6 — Mapper `countryToConfig`

```ts
import { interpolateMonthly, KOPPEN_STDDEV } from '@ikaros/weather-simulation';

export function countryToConfig(country: CountryData, city?: CityData): WeatherGeneratorConfig {
  const monthlyTemps = city?.temps ?? country.temps;
  const climateZone = inferKoppenZone(monthlyTemps);
  const monthlyStdDev = KOPPEN_STDDEV[climateZone].monthly;
  // ... rest
}
```

### M2.7 — Testy

- [ ] `presets.spec.ts` — každý preset validuje proti Zod schema
- [ ] `countryToConfig.spec.ts` — deterministic (Praha → stejný config opakovaně)
- [ ] `inferKoppenZone.spec.ts` — Praha → Cfb, Singapore → Af, Murmansk → Dfc, atd.

---

## M3 — FE UI komponenty (1.5 dne)

### M3.1 — Page + routing

**Soubory:**
- `src/features/world/pages/WorldWeatherPage/WorldWeatherPage.tsx` — multi-generator grid, header
- `src/features/world/pages/WorldWeatherPage/WorldWeatherPage.module.css`
- `src/features/world/pages/WorldWeatherPage/index.ts`
- `src/app/router.tsx` — add route `/svet/:worldSlug/pocasi`
- World nav item (sidebar/topbar) — „Počasí" s `CloudSun` ikonou

### M3.2 — Karta generátoru

**Soubory:**
- `WeatherGeneratorCard.tsx` — hero teplota, instruments row (Teplota/Vítr/Vlhkost/Update), barometr SVG gauge, narrative, hazards, akce
- `WeatherGeneratorCard.module.css` — data-attribute `data-weather=...` driven theming (CSS-only)
- `weatherAtmosphere.module.css` — particles (rain/snow), lightning flash, fog blur
- `useWeatherTheme(weatherType)` hook — vrací data-attr + animation enable/disable (respekt `prefers-reduced-motion`)

### M3.3 — Modal create/edit

**Soubory:**
- `WeatherGeneratorModal.tsx` — 3 taby (Preset / Základ / Pokročilé)
- `WeatherPresetWizard.tsx` — 3 stadia (rozcestí / kategorie / presety + preview)
- `WeatherPresetCard.tsx` (preset list item)
- `TrialPreview.tsx` — 3 sample rolly s `useTrialMonths()` + `usePreviewWeather()`
- `ManualWeatherModal.tsx` — formulář pro ručně nastavit
- `BroadcastModal.tsx` — cíl chat-channel selector, volitelná zpráva
- CSS modules pro každý

### M3.4 — Drag-to-reorder

**Soubory:**
- `useDragReorder.ts` — wrapper kolem HTML5 Drag API (nebo `@dnd-kit/core` pokud projekt už používá)
- `WeatherGeneratorCard.tsx` — drag handle (top-left, jen v `userRole >= PomocnyPJ`)
- Při drop → optimistic update + `useReorderGenerators` mutation
- Hráč nemá drag (DOM ne-renderuje handle)

⚠️ **Pozor — dependency check:** zjistit jestli projekt už používá `@dnd-kit/*` nebo `react-dnd`. Pokud ne, raději native HTML5 (lehčí, žádný nový bundle).

### M3.5 — Empty states

- Žádný generátor (nový svět): empty-state s velkým CTA „+ Vytvořit první generátor" (PJ+) nebo info „PJ ještě nenastavil počasí" (Hráč)
- Karta bez currentWeather: text „Zatím nevygenerováno" + tlačítko „Vygenerovat první"

---

## M4 — Hooks & integrace (0.5 dne)

### M4.1 — React Query hooks

**Soubory:**
- `src/features/world/api/useWeatherGenerators.ts`:
  - `useWeatherGenerators(worldId)` — list
  - `useWeatherGenerator(worldId, id)` — detail
  - `useCreateWeatherGenerator(worldId)` — POST
  - `useUpdateWeatherGenerator(worldId)` — PUT
  - `useDeleteWeatherGenerator(worldId)` — DELETE
  - `useGenerateWeather(worldId)` — POST :id/generate
  - `useSetCurrentWeather(worldId)` — PUT :id/current
  - `useBroadcastWeather(worldId)` — POST :id/broadcast
  - `useReorderGenerators(worldId)` — PUT /reorder
  - `useWeatherWsSubscribe(worldId)` — socket subscribe + cache patch

**Invalidace:** mutace invalidují `['weather-generators', worldId]`. WS event = `queryClient.setQueryData` patch jen toho jednoho generátoru (žádný refetch).

### M4.2 — Trial months hook (calendar návaznost)

```ts
export function useTrialMonths(worldId: string): TrialMonth[] {
  const { data: settings } = useWorldSettings(worldId);
  const { data: calendar } = useWorldCalendarConfig(worldId, settings?.calendarSlug);

  if (calendar) {
    // Custom calendar — pick first, middle, "extreme"
    return [calendar.months[0], calendar.months[Math.floor(calendar.months.length / 2)], { name: 'Extrém', extreme: true }];
  }
  // Gregorian fallback
  return [{ name: 'Leden', index: 0 }, { name: 'Červenec', index: 6 }, { name: 'Extrém', extreme: true }];
}
```

### M4.3 — Preview hook

```ts
import { generateTemperature, transitionWeatherType } from '@ikaros/weather-simulation';

export function usePreviewWeather(config: WeatherGeneratorConfig, month: TrialMonth): WeatherResult {
  // Deterministic seed = hash(configId + month.index)
  // Mirror BE logiky 1:1 (same shared package)
}
```

---

## M5 — Testy + audity (1 den)

### M5.1 — Component testy

- [ ] `WorldWeatherPage.spec.tsx` — multi-generator render, role gating, empty state, drag handle visibility
- [ ] `WeatherGeneratorCard.spec.tsx` — render per weather type, kebab menu, broadcast button, anomaly chip
- [ ] `WeatherGeneratorModal.spec.tsx` — taby, validace, preset předvyplnění
- [ ] `WeatherPresetWizard.spec.tsx` — 3 stadia navigace, search, kategorie filter
- [ ] `TrialPreview.spec.tsx` — 3 rolly, custom calendar months, Gregorian fallback
- [ ] `BroadcastModal.spec.tsx` — channel selector, validace
- [ ] `useWeatherGenerators.spec.tsx` — mutace, WS patch

### M5.2 — Parity test

- [ ] `weather-simulation/tests/parity.spec.ts` — seed 42 → stable output (BE + FE musí dát identický result)

### M5.3 — Audity

- [ ] **`mobil-desktop` skill audit** — mobil 1 sloupec, tablet 2, desktop 3. Wizard modal mobile-friendly (full screen na <768px).
- [ ] **`napoveda` skill update** — sekce „Počasí" v Herních nástrojích: jak vytvořit generátor, jak používat presety, jak broadcast, role-gating tabulka.
- [ ] **Roadmap [x]** — odškrtnout všechny 9.4-I body
- [ ] Cross-skin testing — zkontrolovat 3-5 skinů (ikaros, cyberpunk, fantasy, sci-fi, pergamen) že karty čitelné a theming nepřebije accent

---

## 6 — Pořadí milníků + ETA

| Milník | Trvání | Závisí na | Paralela |
|---|---|---|---|
| M0 — Shared package | 0.5d | – | – |
| M1 — BE rozšíření | 1d | M0 | – |
| M2 — FE preset library | 1d | M0 (shared types) | paralela s M1 |
| M3 — FE UI | 1.5d | M1 (BE endpointy), M2 (data) | – |
| M4 — Hooks | 0.5d | M3 (komponenty) | – |
| M5 — Testy + audity | 1d | M3, M4 | – |
| **Celkem** | **~5d** | – | s paralelizací M1+M2 ~4.5d |

---

## 7 — Risk register

| Risk | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| BE migrace `displayOrder` selže na produkci | Low | High | Idempotentní migration skript, dry-run mode |
| `inferKoppenZone` mis-classifikuje hraniční země | Med | Low | Test suite s 20+ známými zeměmi, fallback `Cfb` |
| FE+BE parity test selže (rozdílné výsledky) | Med | High | Sdílený package M0 odstraňuje duplicitu logiky |
| `@dnd-kit` nebo `react-dnd` zvyšuje bundle | Low | Med | Native HTML5 fallback |
| 810 presetů ze staré DB obsahuje chyby | High | Low | Sample 20 ručně, zbytek trust, opravy v iteraci |
| Calendar integration způsobí regrese v 9.2/9.3 | Low | High | BE testy pokrývají bez/s/custom calendar; FE testy 9.2/9.3 nezasáhnuté |
| WS subscribe leaks (memory) | Med | Med | Cleanup v useEffect return, test s unmount |

---

## 8 — Definition of Done (9.4-I)

- [ ] BE: `displayOrder` field + reorder endpoint + migration deployed
- [ ] BE: calendar integration v `generate()` works (test bez/s/custom)
- [ ] BE: variance + Markov via shared package, deterministic seed test pass
- [ ] BE: prettier + tests green
- [ ] FE: route `/svet/:slug/pocasi` accessible, role-gated
- [ ] FE: 4 kategorie presetů (real-world ~810, Köppen 16, mořská 6, extrémy 7) — všechny s `sourceLevel`
- [ ] FE: wizard 3 stadia + search + trial preview (s calendar návazností) + recently used
- [ ] FE: karta s weather-responsive theming (6 types: clear/cloudy/rain/storm/snow/fog)
- [ ] FE: drag-to-reorder funkční (PJ+), persisted via BE
- [ ] FE: WS live update — broadcast viditelný okamžitě v jiném tabu
- [ ] FE: manuální nastavit, broadcast, vygenerovat, smazat — všechny mutace fungují
- [ ] FE: empty state (žádný generátor) + empty state (žádný currentWeather)
- [ ] Tests: component + hook + parity + presets validation — all green
- [ ] `mobil-desktop` audit pass
- [ ] `napoveda` updated
- [ ] Roadmap [x] 9.4-I
- [ ] Cross-skin sanity check (5 skinů)

---

## 9 — Schválení & start

Po schválení tohoto plánu start M0 (workspace package setup). Commit policy: per milník 1-3 commity přímo na `main` (memory `feedback_work_on_main`).
