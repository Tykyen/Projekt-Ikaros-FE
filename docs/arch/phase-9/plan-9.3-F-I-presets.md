# Plán 9.3-F-I — Stable presets + selector + konvertor (implementace)

**Spec:** [spec-9.3-followup-historical-calendars.md](spec-9.3-followup-historical-calendars.md) (APPROVED Q1–Q5 2026-05-25)
**Dataset:** [PRESETS-DATASET.md](PRESETS-DATASET.md)
**Status:** DRAFT — čeká na souhlas, pak implementace
**Rozsah:** 10 stable presetů + 2-step wizard v CalendarConfigsPage + calendar selector v CreateWorldPage + inline konvertor na timeline kartě. **Bez lunisolar/speciálních (→ F-II, F-III).**

---

## Závislosti

- **Spec hotový a schválený** ✅
- **9.3 Timeline funkční** ✅ (consumer konvertoru)
- **9.3-followup-FIX fallback hierarchie** ✅ (BE getTimelineConfig nově respektuje world default)
- **Pre-existing:** `CalendarConfigsPage` editor, `CreateWorldPage` wizard, `seedGregorianDefault` BE, `useCalendarConfigs`, `useCreateCalendarConfig`
- **Working branch:** přímo na `main`
- **BE restart po DTO change** (memory `feedback_be_restart_required`)

---

## Fáze 1 — Shared presets library (`Projekt-ikaros-FE`)

### 1.1 — Struktura souborů

```
src/shared/lib/calendarEngine/
├── presets/
│   ├── index.ts                  — export CALENDAR_PRESETS + types
│   ├── types.ts                  — CalendarPreset interface
│   ├── gregorian.ts              — preset definice
│   ├── julian.ts
│   ├── solar-hijri.ts
│   ├── saka.ts
│   ├── ethiopian.ts
│   ├── coptic.ts
│   ├── buddhist-thai.ts
│   ├── egyptian-civil.ts
│   ├── holocene.ts
│   ├── islamic-hijri.ts
│   ├── __tests__/
│   │   ├── presets-shape.spec.ts        — validate shape (slug, months, daysOfWeek)
│   │   └── presets-calibration.spec.ts  — match PRESETS-DATASET pro 25.5.2026
│   └── calibration.ts            — utility: spočítá epochOffset z anchor date
└── (existující files)
```

### 1.2 — `presets/types.ts`

```ts
import type { CalendarConfig } from '../types';

export type PresetCategory =
  | 'soucasne-civilni'
  | 'soucasne-nabozenske'
  | 'historicky'
  | 'alternativni';

export interface CalendarPreset {
  slug: string;
  name: string;
  description: string;
  category: PresetCategory;
  /** Shape pro CalendarConfig (bez `id` — vytvoří se při insertu). */
  template: Omit<CalendarConfig, 'id'>;
  /** Volitelná poznámka pro UI (lunar drift, kalibrační varianty…). */
  note?: string;
}

export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string> = {
  'soucasne-civilni': 'Současné civilní',
  'soucasne-nabozenske': 'Současné náboženské',
  historicky: 'Historické',
  alternativni: 'Alternativní',
};
```

### 1.3 — Calibration utility

**Soubor:** `presets/calibration.ts`

```ts
/**
 * Spočítá epochOffset pro preset tak, aby konverze
 * `25.5.2026 Gregorian → preset` matchla anchor date z PRESETS-DATASET.
 *
 * Anchor: World.timelineEpoch = 1.1.2000 Gregorian (= absDay 0 v engine).
 * 25.5.2026 Gregorian = absDay 9641 (= 26 let × 365.25 + offset).
 *
 * Pro preset: chceme `fromAbsDay(9641, preset) = anchorDate`.
 * Tedy `epochOffset = -absDayOfAnchor(preset)` (calibruje 0-point).
 */
export function calibrateEpochOffset(
  preset: Omit<CalendarPreset, 'template'> & {
    template: Omit<CalendarConfig, 'id' | 'epochOffset'>;
  },
  anchorDate: { year: number; monthIndex: number; day: number },
): number {
  // Implementation: použít engine toAbsDay s preset shape bez epochOffset,
  // odečíst od ANCHOR_ABSDAY (= 9641).
  // Detail v impl — vyžaduje engine helper.
  return -1; // placeholder, calibrate per preset
}

export const ANCHOR_ABSDAY = 9641; // 25. 5. 2026 Gregorian
```

### 1.4 — Příklad preset (Gregorian)

**Soubor:** `presets/gregorian.ts`

```ts
import type { CalendarPreset } from './types';

export const GREGORIAN_PRESET: CalendarPreset = {
  slug: 'gregorian',
  name: 'Gregoriánský',
  description: 'Dnes celosvětově nejpoužívanější občanský kalendář.',
  category: 'soucasne-civilni',
  template: {
    slug: 'gregorian',
    name: 'Gregoriánský',
    hoursPerDay: 24,
    daysOfWeek: ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'],
    months: [
      { name: 'leden', daysCount: 31 },
      { name: 'únor', daysCount: 28 },
      { name: 'březen', daysCount: 31 },
      { name: 'duben', daysCount: 30 },
      { name: 'květen', daysCount: 31 },
      { name: 'červen', daysCount: 30 },
      { name: 'červenec', daysCount: 31 },
      { name: 'srpen', daysCount: 31 },
      { name: 'září', daysCount: 30 },
      { name: 'říjen', daysCount: 31 },
      { name: 'listopad', daysCount: 30 },
      { name: 'prosinec', daysCount: 31 },
    ],
    celestialBodies: [
      {
        id: 'moon',
        name: 'Měsíc',
        orbitalPeriodDays: 29.5306,
        color: '#c0c8d0',
        epochOffset: 0,
      },
    ],
    seasons: [
      { id: 'jaro', name: 'Jaro', startMonthIndex: 2, startDay: 1, color: '#7bd389' },
      { id: 'leto', name: 'Léto', startMonthIndex: 5, startDay: 1, color: '#e8c44d' },
      { id: 'pdz', name: 'Podzim', startMonthIndex: 8, startDay: 1, color: '#c47a3b' },
      { id: 'zima', name: 'Zima', startMonthIndex: 11, startDay: 1, color: '#7aa6c4' },
    ],
    epochOffset: 0, // referenční (anchor 25.5.2026 Gregorian = absDay 9641)
  },
};
```

Stejný shape pro zbylých 9 presetů — calibrace per preset.

### 1.5 — Calibration test

**Soubor:** `presets/__tests__/presets-calibration.spec.ts`

```ts
import { toAbsDay, fromAbsDay } from '../../absDay';
import { CALENDAR_PRESETS, ANCHOR_ABSDAY } from '../index';

interface AnchorExpect {
  slug: string;
  expected: { year: number; monthIndex: number; day: number };
  /** ±1 den tolerance pro lunární/lunisolární. */
  tolerance?: number;
}

const ANCHOR_DATA: AnchorExpect[] = [
  { slug: 'gregorian',     expected: { year: 2026, monthIndex: 4,  day: 25 } },
  { slug: 'julian',        expected: { year: 2026, monthIndex: 4,  day: 12 } },
  { slug: 'solar-hijri',   expected: { year: 1405, monthIndex: 2,  day: 4 } },
  { slug: 'saka',          expected: { year: 1948, monthIndex: 2,  day: 4 } },
  { slug: 'ethiopian',     expected: { year: 2018, monthIndex: 8,  day: 17 } },
  { slug: 'coptic',        expected: { year: 1742, monthIndex: 8,  day: 17 } },
  { slug: 'buddhist-thai', expected: { year: 2569, monthIndex: 4,  day: 25 } },
  { slug: 'egyptian-civil',expected: { year: 0,    monthIndex: 8,  day: 17 } }, // modelově dle koptské návaznosti
  { slug: 'holocene',      expected: { year: 12026,monthIndex: 4,  day: 25 } },
  { slug: 'islamic-hijri', expected: { year: 1447, monthIndex: 11, day: 8 }, tolerance: 1 },
];

describe('Preset calibration — anchor 25.5.2026 Gregorian = absDay 9641', () => {
  ANCHOR_DATA.forEach(({ slug, expected, tolerance = 0 }) => {
    it(`${slug} → ${expected.year}/${expected.monthIndex + 1}/${expected.day}`, () => {
      const preset = CALENDAR_PRESETS.find((p) => p.slug === slug);
      expect(preset).toBeDefined();
      const result = fromAbsDay(ANCHOR_ABSDAY, preset!.template);
      expect(result.year).toBe(expected.year);
      expect(result.monthIndex).toBe(expected.monthIndex);
      // Tolerance pro lunární — datum se může lišit ±1 den (pozorování srpku).
      const dayDiff = Math.abs(result.day - expected.day);
      expect(dayDiff).toBeLessThanOrEqual(tolerance);
    });
  });
});
```

⚠️ **Calibration loop:** některé presety na první pokus calibrate fail. Process:
1. Spustím test → fail s `actual: X, expected: Y`.
2. Spočítám `epochOffset = currentOffset + (expected.day - actual.day)`.
3. Upravím preset.
4. Re-run test → green.
5. Repeat pro každý preset.

**Akceptovatelné odchylky:**
- Solar (Gregorian, Julian, Solar Hijri, Saka, Ethiopian, Coptic, Buddhist Thai, Holocene): **přesně 0 dní**.
- Lunární (Islamic): **±1 den** (pozorování srpku).
- Egyptian Civil: PJ označil jako „modelově dle koptské návaznosti" → akceptovat ±0 dní (deterministický model).

### 1.6 — Commit

`feat(calendar-presets): 10 stable presets + calibration (9.3-F-I)`

---

## Fáze 2 — Wizard v `CalendarConfigsPage`

### 2.1 — Nový komponent `CalendarPresetPicker`

**Soubor:** `src/features/world/pages/CalendarConfigsPage/components/CalendarPresetPicker.tsx`

- Modal step 1 (před existujícím create modal).
- Render seznamu presets grouped by `category`.
- „Prázdný kalendář" jako first card (Q5-A).
- Klik na preset → vybráno, step 2 (existující CreateModal pre-fillne values).

### 2.2 — Refactor existující CreateModal

Stávající `CreateModal` v `CalendarConfigsPage.tsx` přijímá `(slug, name) => Promise`. Refactor:
- Přidat `initialTemplate?: Omit<CalendarConfig, 'id'>` prop (pre-fill z preset).
- Pokud `initialTemplate`, na submit posílá full template (ne jen `slug`+`name` + defaults).
- `useCreateCalendarConfig` mutation už přijímá full DTO (`CreateCalendarConfigDto` s `months`, `celestialBodies`, atd.).

### 2.3 — Wizard state

```ts
type WizardState =
  | { step: 'picker' }
  | { step: 'identity'; preset: CalendarPreset | null /* null = prázdný */ };
```

PJ může jít zpět z step 2 do step 1.

### 2.4 — Slug konflikt

Pokud `preset.slug` už existuje, wizard auto-prefixne (`gregorian-2`, `gregorian-3`). PJ může změnit v step 2.

### 2.5 — Commit

`feat(calendar-configs): preset picker wizard v CalendarConfigsPage`

---

## Fáze 3 — Calendar selector v `CreateWorldPage` (Q1)

### 3.1 — BE rozšíření

#### `CreateWorldDto` rozšíření

**Soubor:** `backend/src/modules/worlds/dto/create-world.dto.ts`

```ts
@IsOptional()
@IsArray()
@IsString({ each: true })
@ArrayMaxSize(20)
calendarPresets?: string[]; // slug seznam (default = ['gregorian'])

@IsOptional()
@IsString()
@MaxLength(64)
defaultCalendarSlug?: string; // který je ⭐ (default = první z calendarPresets)
```

#### `worlds.service.create` refactor

- Dnes volá `calendarConfigService.seedGregorianDefault(worldId)` natvrdo.
- Nově: pokud `dto.calendarPresets` set, seedne každý z nich přes nový `seedPreset(worldId, slug)` helper. Pokud prázdný array, žádný kalendář.
- `world.defaultCalendarConfigSlug` = `dto.defaultCalendarSlug ?? dto.calendarPresets?.[0] ?? null`.
- Backward compatible: existující calls bez `calendarPresets` → fallback default = `['gregorian']`.

#### `WorldCalendarConfigService.seedPreset(worldId, slug)` (nový)

```ts
async seedPreset(worldId: string, presetSlug: string): Promise<WorldCalendarConfig> {
  // Import preset templates ze sdílené lib (BE má vlastní copy nebo
  // importuje z FE — viz Audit níže).
  const preset = CALENDAR_PRESETS.find((p) => p.slug === presetSlug);
  if (!preset) throw new BadRequestException({ code: 'PRESET_UNKNOWN' });
  const existing = await this.repo.findBySlug(worldId, presetSlug);
  if (existing) return existing;
  return await this.repo.create(worldId, preset.template);
}
```

⚠️ **Audit problém:** presets žijí v FE (`Projekt-ikaros-FE/src/shared/lib/calendarEngine/presets/`). BE potřebuje stejná data. Možnosti:
- **A) Duplikovat presety v BE** — synchronizace přes ruční diff.
- **B) Extrahovat do shared package** — vyžaduje monorepo setup (není dnes).
- **C) BE má jen `seedGregorianDefault` (existující) + přijímá full template přes DTO** — FE pošle template z lokálního preset, BE jen uloží. Stejně jako fungoval CreateCalendarConfigDto.

**Doporučuji C** — žádná duplikace, BE neví o presetech (jen je dostane od FE jako CreateCalendarConfigDto data). `seedPreset` se přejmenuje na `applyPresetFromFE(worldId, template)` = wrapper nad `repo.create`.

#### Aktualizovat shape — `CreateWorldDto.calendarPresets` → `CreateWorldDto.calendars`

Místo `calendarPresets: string[]` (BE neumí lookupnout) → `calendars: CalendarConfigTemplate[]` (FE pošle full data).

```ts
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => CreateCalendarConfigDto)
@ArrayMaxSize(20)
calendars?: CreateCalendarConfigDto[];
```

`worlds.service.create`:
```ts
if (dto.calendars && dto.calendars.length > 0) {
  for (const cal of dto.calendars) {
    await this.calendarConfigService.repo.create(world.id, cal);
  }
  // Default slug
  world.defaultCalendarConfigSlug =
    dto.defaultCalendarSlug ?? dto.calendars[0].slug;
} else {
  // Fallback BC — pokud caller nedodal calendars, seedne Gregorian.
  await this.calendarConfigService.seedGregorianDefault(world.id);
}
```

### 3.2 — FE — krok v `CreateWorldPage`

**Soubor:** existující `CreateWorldPage` wizard (audit místa).

Nový (volitelný) krok „Kalendáře":
- Default: jen Gregorian zaškrtnutý.
- Checkbox grid 10 presetů + „Žádný" (vznikne svět bez kalendáře).
- Radio „Default" (⭐) na jedné z zaškrtnutých.
- Submit → POST `/worlds` s `dto.calendars = selected.map(p => p.template)` + `dto.defaultCalendarSlug`.

📚 **Existující flow:** PJ tvoří svět (krok 1 — základ, krok 2 — vzhled, krok 3 — accessMode?). Calendar selector přidám jako poslední „advanced" krok (volitelně, default = jen Gregorian).

### 3.3 — Commit

`feat(create-world): calendar selector wizard krok (9.3-F-I-Q1)`

---

## Fáze 4 — Inline konvertor na timeline kartě (Q3)

### 4.1 — Nový komponent `DateConversionPopup`

**Soubor:** `src/features/world/pages/TimelinePage/components/DateConversionPopup.tsx`

Props:
```ts
interface Props {
  primaryConfig: CalendarConfig;
  allConfigs: CalendarConfig[];
  date: { year: number; monthIndex: number; day: number; hour?: number | null };
  anchorAbsDay: number; // spočítaný `toAbsDay(date, primaryConfig)`
  onClose: () => void;
}
```

Render: list `allConfigs.filter(c => c.slug !== primaryConfig.slug)` s formátovaným datem v každém.

Logic: `fromAbsDay(anchorAbsDay, otherConfig)` → `formatFantasyDate(result, otherConfig)`.

### 4.2 — Button na `TimelineEventCard`

Vedle datum chipu přidat malý btn „🔄 Převést" — jen pokud svět má >1 calendar config:

```tsx
{configsCount > 1 && (
  <button
    type="button"
    className={s.convertBtn}
    onClick={() => setConvertOpen(true)}
    title="Převést datum do jiného kalendáře"
    aria-label="Převést datum"
  >
    🔄
  </button>
)}
{convertOpen && (
  <DateConversionPopup
    primaryConfig={config!}
    allConfigs={allConfigs}
    date={{ year: event.year, monthIndex: event.month - 1, day: event.day, hour: event.hour }}
    anchorAbsDay={toAbsDay({...}, config!)}
    onClose={() => setConvertOpen(false)}
  />
)}
```

### 4.3 — Wire allConfigs do TimelineAxis → Card

`useCalendarConfigs(worldId)` už voláno v TimelinePage. Předat `allConfigs` přes props `TimelineAxis` → `TimelineEventCard`.

### 4.4 — Commit

`feat(timeline-fe): inline konvertor datumu mezi kalendáři (9.3-F-I-Q3)`

---

## Fáze 5 — Roadmap + dokumentace

### 5.1 — Roadmap update

[docs/roadmap-fe.md](docs/roadmap-fe.md) — pod 9.3 přidat:
- [x] 9.3-F-I — Stable presets (10 kalendářů) + selector + konvertor

### 5.2 — Napoveda update

Skill `napoveda` po dokončení — `PagesSection.tsx` aktualizovat:
- „Správa kalendářů světa" — doplnit info o presetech (10 historických šablon, Cmd+K-style picker, pre-fillne kompletní config).
- „Časová osa světa" — doplnit info o 🔄 Převést btn.
- „Tvorba světa" — doplnit info o calendar selector kroku.

### 5.3 — Memory entry

Nový `project_calendar_presets_architecture.md` — záznam že:
- Presety žijí ve FE (`src/shared/lib/calendarEngine/presets/`).
- BE nezná presety — přijímá full template z FE přes `CreateCalendarConfigDto`.
- F-II přidá lunisolar, F-III speciální (CalendarKind enum), F-V přesný Čínský.

---

## Pořadí commitů (souhrn)

**FE repo:**
1. `feat(calendar-presets): 10 stable presets + calibration (9.3-F-I)` — lib + 10 souborů + calibration testy
2. `feat(calendar-configs): preset picker wizard v CalendarConfigsPage` — 2-step UI
3. `feat(timeline-fe): inline konvertor datumu mezi kalendáři (9.3-F-I-Q3)` — DateConversionPopup
4. `feat(create-world): calendar selector wizard krok (9.3-F-I-Q1)` — FE část wizardu (po BE commit)
5. `docs(roadmap)` + `docs(napoveda)` — update

**BE repo:**
6. `feat(worlds): calendars[] + defaultCalendarSlug v CreateWorldDto (9.3-F-I-Q1)` — DTO + service refactor (BC fallback)

→ **BE restart**

**Celkem ~6 commitů.**

---

## Riziková místa

- ⚠️ **Calibration trial-and-error** — některé presety na první pokus failnou. Plánovat ~15–30 min calibration loop per preset (10 × 30min = 5 hodin pro lib samotnou). Akceptovat ±1 den pro lunární.
- ⚠️ **CreateWorldPage wizard struktura** — audit existujícího (kroky, validation, state management) před přidáním calendar kroku. Pokud má vlastní wizard pattern, držet konzistenci.
- ⚠️ **Egyptian Civil anchor** — PJ označil jako „modelově dle koptské návaznosti". Pojďme s rok=0 a `monthIndex=8 day=17` (= pashons 17 v koptské vazbě). Pokud PJ chce explicit „1742 AM" jako u koptského, naladit.
- ⚠️ **Holocene year=12026** — engine ošetřuje záporné roky, ale 5-digit roky nikdo netestoval. Audit `formatFantasyDate` formátování pro `year > 9999`.
- ⚠️ **BE `dto.calendars` přijímá full template** — risk že FE dodá invalid data (e.g. months[i].daysCount = 0). DTO `@ValidateNested({each: true})` + `CreateCalendarConfigDto` validation by mělo pokrýt. Audit.
- ⚠️ **DateConversionPopup performance** — `toAbsDay` × n configs per card render. Pro >5 kalendářů světa může zpomalit list. Mitigation: memoize per card.

---

## Acceptance criteria 9.3-F-I souhrn

### Presety (Fáze 1)
1. 10 souborů v `presets/*.ts` + index.ts + types.ts + calibration.ts.
2. Calibration test zelený pro všech 10 presets (±0 solar, ±1 lunar).
3. Shape test: každý preset má valid slug (kebab-case), non-empty months, daysOfWeek, seasons fit do months.

### Wizard (Fáze 2)
4. `CalendarConfigsPage` „+ Přidat kalendář" → modal step 1 (picker) → step 2 (identity).
5. Step 1 grupuje presety dle kategorií, „Prázdný" nahoře.
6. Step 2 pre-fillne slug + name (PJ může změnit).
7. Vytvoření zavolá `useCreateCalendarConfig` s full template.
8. Slug konflikt → auto-suffix `-2`, `-3`.

### CreateWorldPage (Fáze 3)
9. `CreateWorldDto.calendars?: CreateCalendarConfigDto[]` + `defaultCalendarSlug?: string` — BE accept.
10. BC: pokud caller nedodá `calendars`, fallback seed Gregorian (jako dnes).
11. CreateWorldPage wizard má krok „Kalendáře" — multi-select 10 presetů, radio default.
12. Default UI = jen Gregorian zaškrtnutý + jako default.
13. Submit POST `/worlds` s `dto.calendars + defaultCalendarSlug`.

### Konvertor (Fáze 4)
14. `DateConversionPopup` zobrazí datum v každém configu světa kromě primárního.
15. Klik na 🔄 btn na `TimelineEventCard` (jen pokud configs > 1) → otevře popup.
16. Klik mimo / Esc zavře.
17. Calibration: pro Gregorian 25.5.2026 popup zobrazí přesně dataset hodnoty pro všech 9 ostatních (s ±1 tolerance pro Islamic).

### Dokumentace (Fáze 5)
18. Roadmap zaškrtne 9.3-F-I.
19. Napoveda updates 3 sekce.
20. Memory entry o presets architecture.

### Quality
21. `npm run typecheck` (FE + BE) green.
22. `npx vitest run` (FE) green, žádné nové fails v existujících testech.
23. `npm test` (BE) green.

---

## Verifikace finální

Po dokončení všech commitů:
1. **Test wizardu:** vytvoř test world, otevři `/svet/test/admin/kalendare`, klik „+ Přidat kalendář", vyber Julián, vytvoř. Editor se otevře s pre-fillem.
2. **Test selector v CreateWorld:** vytvoř nový svět, v calendar kroku odškrtni Gregorian, zaškrtni Hebrew + Islamic. Po vytvoření Open `/svet/<slug>/admin/kalendare` → Gregorian tam není, Hebrew + Islamic jsou.
3. **Test konvertor:** vytvoř timeline event 25.5.2026 podle Gregorian, klik 🔄 → vidím Julián 12.5.2026, Solar Hijri 4 chordád 1405 SH, atd.
4. **Test BC:** existující svět (s jen Gregorianem) zůstává funkční, žádné regrese.
5. **Mobil audit** — DateConversionPopup responsive (fullscreen overlay na mobile?).
