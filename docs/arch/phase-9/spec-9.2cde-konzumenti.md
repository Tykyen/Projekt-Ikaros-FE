# Spec 9.2c+d+e — Konzumenti multi-config kalendáře

**Status:** Draft — čeká na schválení
**Rozsah:** BE schema rozšíření + FE refactor 3 konzumentů
**Repo:** Projekt-ikaros (BE) + Projekt-ikaros-FE (FE)
**Velikost:** XL — ~25 souborů
**Datum:** 2026-05-25
**Souvisí:** 9.2a (engine), 9.2b (multi-config + editor)

---

## 1. Cíl

Dotáhnout 9.2 — sjednotit 3 zbývající konzumenty multi-config kalendáře:

- **9.2c — Per-entita mřížka:** `CalendarTab` (Postava/NPC/Lokace) ze seznamu na **měsíční mřížku** s fantasy datum picker. Event získá `calendarConfigId`.
- **9.2d — PJ aggregate view:** `CalendarPage.tsx` zobrazí **sjednocený** PJ pohled (postavy + NPC + Lokace + game events) v jedné mřížce s lane renderem multi-day eventů, filter sidebarem a toolbar přepínačem zobrazeného kalendáře.
- **9.2e — Fantasy datum na `WorldNews`:** opt-in fantasy datum místo gregorian publishedAt jako primární display.

---

## 2. Motivace

User požadavek (z konverzace 2026-05-25): „v případě fantasy prostě nebude existovat reálná doba" + „PJ kalendář, který vidí vše" + per-entita kalendář aktuálně „nelze načíst" (= zobrazí jen text bez mřížky, vypadá mrtvě).

Bez 9.2c/d/e je 9.2a (engine) + 9.2b (multi-config editor) UI-mrtvá nadstavba — žádná funkce, kterou PJ vidí v reálném použití. Tato spec je „wireup" — propojení engine→UI napříč konzumenty.

---

## 3. Audit současného stavu

### 9.2c — Per-entita kalendář

**BE:** [`character-calendar.interface.ts`](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/interfaces/character-calendar.interface.ts):
```ts
interface CalendarEvent {
  id: string;
  title: string;
  start?: string;          // YYYY-MM-DD (gregorian!)
  end?: string;
  allDay?: boolean;
  hourStart?: string;
  hourEnd?: string;
  description?: string;
}
```

⚠️ **`start: string` (gregorian YYYY-MM-DD)** — fantasy datum nelze reprezentovat. Editor [CalendarTab.tsx:233](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx#L233) používá `<input type="date">` (HTML gregorian).

**FE:** [`CalendarTab.tsx:71-95`](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx#L71) zobrazí jen **text seznam** událostí. Pro prázdný kalendář: `<p>Žádné události</p>`. Komentář v souboru (řádek 44) přiznává „Plný kalendářový pohled (mřížka) přijde s fází 9.2."

### 9.2d — PJ view

**BE:** `GET /worlds/:id/calendars/aggregate` ✓ — vrací postavy + NPC + Lokace (po 9.2-Lokace) s `kind` per entity ([calendars.service.ts:64](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/calendars/calendars.service.ts#L64)). FE žádný hook nemá.

**FE:** [`CalendarPage.tsx`](../../../src/features/world/pages/CalendarPage.tsx) (194 řádků) — gregorian měsíční mřížka, ale **jen game events** přes `useAllWorldGameEvents`. Žádný character-calendar agregát. Žádný lane render multi-day. Žádný filter sidebar. Žádné lunar overlay.

### 9.2e — WorldNews

**BE:** [`world-news.interface.ts`](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-news/interfaces/world-news.interface.ts):
```ts
interface WorldNewsItem {
  date: string;            // ISO UTC — gregorian only
  // ... žádné calendarConfigId, žádné calendarDate
}
```

**FE:** [`WorldNewsEditorModal.tsx:28`](../../../src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsEditorModal.tsx#L28) má `date: z.string()` (datetime-local input). [`WorldNewsCard.tsx`](../../../src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsCard.tsx) zobrazí `formatRelativeTime(date)`. Vše gregorian.

---

## 4. Návrh řešení

### 4.1 — Centrální `FantasyDate` shape

Mirror FE `@/shared/lib/calendarEngine/types` → BE interface (kopie, ne import — viz 9.2b drift):

```ts
// backend/src/modules/world-calendar-config/interfaces/world-calendar-config.interface.ts
export interface FantasyDate {
  year: number;
  monthIndex: number;      // 0-based
  day: number;
  hour?: number;
  minute?: number;
}
```

Použito konzistentně v 9.2c (CalendarEvent), 9.2d (PJ view interpretation), 9.2e (WorldNews).

### 4.2 — 9.2c BE: CalendarEvent rozšíření

```diff
 interface CalendarEvent {
   id: string;
   title: string;
-  start?: string;
-  end?: string;
+  /** 9.2c — slug kalendáře, kterému event patří. Fallback na World.defaultCalendarConfigSlug. */
+  calendarConfigId?: string;
+  /** 9.2c — structured fantasy datum začátku. */
+  start?: FantasyDate;
+  /** 9.2c — structured fantasy datum konce (multi-day events). */
+  end?: FantasyDate;
   allDay?: boolean;
   hourStart?: string;
   hourEnd?: string;
   description?: string;
 }
```

**Migrace:** existující events s `start: 'YYYY-MM-DD'` parse na object `{ year, monthIndex: month-1, day }`. Backfill skript (idempotent, single-purpose).

**DTO + repo + service:** rozšířené, validace `class-validator` per pole.

### 4.3 — 9.2c FE: CalendarTab refactor

Drop seznam, port měsíční mřížku z `CalendarPage.tsx` + použít `calendarEngine`:

```
<CalendarTab>
  <CalendarHeader>
    Měsíc/Rok navigation (← Březen 1452 →)
    Default kalendář dropdown (Character.preferredCalendarConfigId)
    [+ Přidat událost] (edit mode)
  </CalendarHeader>
  <MonthGrid>
    <DayCell>
      Den + lunar fáze ikony + sezóna tint
      Event chips
    </DayCell>
  </MonthGrid>
  <EventModal> (klik na chip → detail / edit)
  <FantasyDatePicker> (event create/edit form)
</CalendarTab>
```

`Character.preferredCalendarConfigId?: string` nové pole (nullable, fallback na world default).

### 4.4 — 9.2c FE: `<FantasyDatePicker>` komponenta

Nová sdílená komponenta `src/shared/ui/FantasyDatePicker/`. Public API:

```tsx
<FantasyDatePicker
  config={calendarConfig}     // CalendarConfig z calendarEngine
  value={fantasyDate | null}
  onChange={(date) => ...}
  allowHour={true}            // jinak day-only
/>
```

3-4 select boxes: rok / měsíc (z `config.months`) / den (z `daysInMonth` per měsíc) / hodina (volitelně). Reaktivní — když se změní měsíc, max day se přepočítá.

### 4.5 — 9.2d FE: PJ aggregate view

Refactor [`CalendarPage.tsx`](../../../src/features/world/pages/CalendarPage.tsx):

1. Nový hook `useCalendarsAggregate(worldId)` → `GET /worlds/:id/calendars/aggregate`. Vrátí `{ characters: [...], events: [...] }`.
2. Sjednocení s `useAllWorldGameEvents`. Merge do jednoho events pole.
3. **Display kalendář toolbar** — dropdown "Zobrazit v: [Lidský ▾]". Default = `world.defaultCalendarConfigSlug`. Engine přepočítá strukturovaná data event přes `absDay` (společný `World.timelineEpoch`).
4. **Filter sidebar:**
   - ✓ Postavy hráčů (toggle)
   - ✓ NPC (toggle)
   - ✓ Lokace (toggle)
   - ✓ Game events (toggle)
   - Per-entita seznam (toggle per character).
   - Per-kalendář filter (zobraz jen eventy v daném config).
5. **Lane render** multi-day eventů (port z Matrix [PJcalenders.tsx:241-297](file:///c:/Matrix/Matrix/frontend/src/pages/PJcalenders.tsx#L241)).
6. **Lunar/sezóna overlay** v buňkách — `getLunarPhasesForDay` + `getSeasonForDay` z engine.
7. **Modal detail** event — vč. info „v jakém kalendáři vytvořen".

### 4.6 — 9.2e BE: WorldNews fantasy datum

```diff
 interface WorldNewsItem {
   id: string;
   worldId: string | null;
   title: string;
   content: string;
   date: string;                    // tech metadata — ISO, sortable
+  /** 9.2e — slug kalendáře, ke kterému je `calendarDate` vztažený. Null = real-world gregorian (display `date`). */
+  calendarConfigId: string | null;
+  /** 9.2e — fantasy datum oznámení. Pokud null, FE zobrazí `date`. */
+  calendarDate: FantasyDate | null;
   type: WorldNewsType;
   // ...
 }
```

**Migrace:** žádná (nullable add). Existing news = `calendarConfigId: null` (gregorian display).

### 4.7 — 9.2e FE: editor modal + card

**Editor:**
- Toolbar toggle „Datum: [Reálné | Ve světě]". Real = current datetime-local. Ve světě = `<FantasyDatePicker>` + dropdown kalendáře.
- Pokud Ve světě, ukládá `calendarConfigId + calendarDate`. Reálné datum (tech `date`) se setuje na `new Date().toISOString()` (audit).

**Card display:**
- Pokud `calendarDate` set → primárně zobrazí formatované fantasy datum (např. „2. den měsíce Stříbra, 8742").
- Tooltip / hover → reálné datum (audit).
- Jinak business as usual (formatRelativeTime).

### 4.8 — Helper `formatFantasyDate(date, config)`

Nový export z `calendarEngine`:

```ts
export function formatFantasyDate(
  date: FantasyDate,
  config: CalendarConfig,
  opts?: { includeHour?: boolean; locale?: 'cs' },
): string;
// → "2. Stříbra 8742" / "2. Stříbra 8742, 14:30"
```

---

## 5. Out of scope

- ❌ BE WS push events pro per-entita kalendář (Matrix nemá, nepotřebné teď).
- ❌ Recurring events (každý měsíc, ročně) — pokud uživatel chce, samostatný follow-up.
- ❌ Cross-kalendář event sharing (event vytvořený v elfím, viditelný v lidském s converted datem) — eventu zůstane svůj `calendarConfigId`, lidský filter ho schová pokud filter aktivní.
- ❌ Drag-and-drop event přesun na jiný den.
- ❌ Reminder / notification system (push) — separate feature.
- ❌ FE pro game events fantasy datum (user explicitně řekl „ne u akcí na hlavní stránce").
- ❌ Refactor `CalendarTab` mobile fallback list — měsíční mřížka MUSÍ být mobile-usable, ne fallback (per [`base.md`](../../../.claude/rules/base.md)).

---

## 6. Acceptance kritéria

### 9.2c
1. ✅ BE `CalendarEvent` má `calendarConfigId`, `start: FantasyDate`, `end: FantasyDate`.
2. ✅ Migrace existing events: gregorian string → object. Idempotent.
3. ✅ BE `Character.preferredCalendarConfigId?: string` (nullable).
4. ✅ FE `<FantasyDatePicker>` funguje s libovolným calendar configem.
5. ✅ FE `CalendarTab` zobrazuje měsíční mřížku (ne seznam), s lunar/sezóna overlay.
6. ✅ Edit mode: + Přidat event → `<FantasyDatePicker>` → uložit, refresh, ověřit perzistenci.
7. ✅ Mobile ≤768px usable.

### 9.2d
1. ✅ FE `useCalendarsAggregate(worldId)` hook.
2. ✅ `CalendarPage.tsx` zobrazí postavy + NPC + Lokace + game events v jedné mřížce.
3. ✅ Toolbar dropdown přepíná zobrazený kalendář.
4. ✅ Filter sidebar — per-typ + per-entita + per-kalendář.
5. ✅ Lane render multi-day eventů.
6. ✅ Lunar/sezóna overlay v buňkách.
7. ✅ Modal detail event s info „v jakém kalendáři".

### 9.2e
1. ✅ BE `WorldNews` má `calendarConfigId + calendarDate` (oba nullable).
2. ✅ FE editor toggle „Reálné | Ve světě" + picker.
3. ✅ FE card preferuje `calendarDate` před `date` při display.
4. ✅ Tooltip na reálný datum (audit).
5. ✅ Existing news = no regrese (null calendarDate → gregorian fallback).

---

## 7. Test plán

### BE
- `character-subdocs` testy: persist+retrieve fantasy date object, calendarConfigId.
- `world-news` testy: nullable calendarDate pole, validace.
- Migrace skript: 3 scénáře (no events, gregorian string events, mixed).

### FE
- `<FantasyDatePicker>` spec — render 13-month fantasy config, vybrat datum, ověřit onChange.
- `CalendarTab` refactor spec — render grid, add event, persist.
- `CalendarPage` aggregate spec — mock aggregate + gameEvents, ověřit merge.
- `WorldNewsCard` fantasy datum spec — render s/bez calendarDate, ověřit display priority.

---

## 8. Riziko & rollback

| ID | Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|---|
| R1 | Migrace existing events ztratí data | nízká | vysoký | Dry-run + `--apply`, mongodump, idempotent test |
| R2 | Cross-kalendář display konverze (display calendar ≠ event origin) drift | střední | střední | Engine `toAbsDay`+`fromAbsDay` round-trip — testováno z 9.2a |
| R3 | `<FantasyDatePicker>` UX hell s 13+ měsíci na mobilu | střední | střední | Select boxy native HTML, ne custom dropdown — fungují všude |
| R4 | Lane render performance při 100+ eventů | nízká | nízký | Matrix to už zvládal (vzor), per-month omezení limituje |
| R5 | WorldNews `calendarDate` editor toggle confusion | střední | nízký | Default = "Reálné", explicit opt-in, tooltip vysvětlí |

**Rollback:** každý sub (9.2c/d/e) samostatný commit, lze cherry-pick revert. BE změny jsou additive (nullable) → bez data loss.

---

## 9. Otázky k autorovi (delegováno)

**Žádné, autor delegoval, volby:**

- `CalendarEvent.start` shape = **structured FantasyDate object** (ne string). Fantasy kalendáře nelze reprezentovat stringem, refactor je hodnota.
- `Character.preferredCalendarConfigId` = **ano**, per-entita preference. Fallback na world default.
- WorldNews `calendarDate` priority = **primární** display (real-world v tooltipu).
- Game events fantasy datum = **NE** (per user 2026-05-25).
- Cross-kalendář display switch = **přepočítává přes absDay** (multi-kultura sjednoceno přes `World.timelineEpoch`).
- Migrace `CalendarEvent.start` string → object = **ANO** (samostatný backfill skript v 9.2c).

---

**Po schválení napíšu implementační plán** (3 sub-commity: 9.2c BE+FE, 9.2d FE, 9.2e BE+FE).
