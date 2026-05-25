# Plán 9.2c+d+e — Konzumenti multi-config

**Datum:** 2026-05-25
**Spec:** [spec-9.2cde-konzumenti.md](spec-9.2cde-konzumenti.md)
**Status:** ⏳ → Implementuje se po schválení specu

3 sub-commity sériově (každý revertovatelný):

| Sub | Repo | Co |
|---|---|---|
| **9.2c-BE** | BE | `CalendarEvent.calendarConfigId` + `start/end: FantasyDate`, `Character.preferredCalendarConfigId`, DTO, migrace |
| **9.2c-FE** | FE | `<FantasyDatePicker>` + `CalendarTab` mřížkový refactor |
| **9.2d-FE** | FE | `useCalendarsAggregate` + `CalendarPage` aggregate refactor + lane render + filter sidebar |
| **9.2e-BE** | BE | `WorldNews.calendarConfigId + calendarDate` (nullable add) |
| **9.2e-FE** | FE | Editor toggle „Reálné/Ve světě" + card display priority |

---

## 9.2c-BE

**Soubory:**
- `backend/src/modules/world-calendar-config/interfaces/world-calendar-config.interface.ts` — export `FantasyDate` (přidat).
- `backend/src/modules/character-subdocs/interfaces/character-calendar.interface.ts` — `CalendarEvent.{calendarConfigId?, start?: FantasyDate, end?: FantasyDate}`.
- `backend/src/modules/character-subdocs/dto/update-calendar.dto.ts` — DTO rozšíření (nested validation).
- `backend/src/modules/characters/schemas/character.schema.ts` — `@Prop() preferredCalendarConfigId?: string`.
- `backend/src/modules/characters/interfaces/character.interface.ts` — type rozšíření.
- `backend/scripts/backfill-calendar-event-fantasy-date-9.2c/` — migrace existing string events na object.
- BE testy adapted.

**Migration logika:** `'YYYY-MM-DD'` → `{ year: Y, monthIndex: M-1, day: D }`. Pokud parse fail, log + skip.

**Commit:** `feat(9.2c-BE): CalendarEvent fantasy date object + preferredCalendarConfigId`

---

## 9.2c-FE

**Soubory (nové):**
- `src/shared/ui/FantasyDatePicker/FantasyDatePicker.tsx` + module.css + spec.
- `src/features/world/pages/CharacterDetailPage/components/CalendarTabGrid.tsx` — nová mřížková komponenta (nahradí list).
- `src/features/world/pages/CharacterDetailPage/components/CalendarTabGrid.module.css`.

**Soubory (refactor):**
- `src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx` — drop list, použít `CalendarTabGrid` (view) + edit modal s `<FantasyDatePicker>`.
- `src/features/world/pages/CharacterDetailPage/api/characters.types.ts` — type sync pro `CalendarEvent`.

**Klíčové komponenty `<FantasyDatePicker>`:**
- 3-4 select boxy: rok (text input) / měsíc (select z `config.months`) / den (select 1..daysInMonth) / hodina (volitelně).
- Reaktivní — měsíc change → max day se přepočítá.
- Props: `{ config, value, onChange, allowHour }`.

**Commit:** `feat(9.2c-FE): CalendarTab mřížka + FantasyDatePicker`

---

## 9.2d-FE

**Soubory (nové):**
- `src/features/world/api/useCalendarsAggregate.ts` — hook pro `GET /worlds/:id/calendars/aggregate`.
- `src/features/world/pages/CalendarPage/PJCalendarToolbar.tsx` — dropdown display calendar + filter dropdown.
- `src/features/world/pages/CalendarPage/PJCalendarFilters.tsx` — sidebar filter.
- `src/features/world/pages/CalendarPage/laneAssignment.ts` — port lane render logiky z Matrix.
- `src/features/world/pages/CalendarPage/CalendarPage.module.css` — refactor.

**Soubory (refactor):**
- `src/features/world/pages/CalendarPage.tsx` → `src/features/world/pages/CalendarPage/CalendarPage.tsx` (folder layout).

**Display calendar přepínač:** uloženo v localStorage per worldSlug.

**Commit:** `feat(9.2d-FE): PJ aggregate view + lane render + filter sidebar`

---

## 9.2e-BE

**Soubory:**
- `backend/src/modules/world-news/interfaces/world-news.interface.ts` — `calendarConfigId: string | null; calendarDate: FantasyDate | null`.
- `backend/src/modules/world-news/schemas/world-news.schema.ts` — `@Prop({ default: null })` × 2.
- `backend/src/modules/world-news/dto/create-world-news.dto.ts` + `update-world-news.dto.ts` — nested validation pro `FantasyDate`.
- `backend/src/modules/world-news/repositories/world-news.repository.ts` — toEntity mapping.
- BE testy.

**Migrace:** žádná (nullable add, existing news = null).

**Commit:** `feat(9.2e-BE): WorldNews fantasy datum (calendarConfigId + calendarDate)`

---

## 9.2e-FE

**Soubory (refactor):**
- `src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsEditorModal.tsx` — toggle „Reálné/Ve světě" + `<FantasyDatePicker>` + dropdown kalendáře.
- `src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsCard.tsx` — display priority `calendarDate` před `date`.
- `src/features/world/api/useWorldNews.ts` — DTO rozšíření.

**Helper:**
- Doplnit `formatFantasyDate(date, config)` do `src/shared/lib/calendarEngine/`.

**Commit:** `feat(9.2e-FE): WorldNews fantasy datum picker + card display`

---

## Závěrečný checklist

- [ ] BE typecheck + lint + testy zelené (per sub-commit).
- [ ] FE typecheck + lint + testy zelené.
- [ ] Backfill 9.2c skript dry-run čistý.
- [ ] Manuální smoke: vytvořit event v fantasy kalendáři, ověřit perzistenci + grid display.
- [ ] PJ view: ověřit toolbar přepínač + filter sidebar.
- [ ] WorldNews: vytvořit „Ve světě" datum, ověřit display.
- [ ] `docs/roadmap-fe.md` 9.2c/d/e checked.
- [ ] `napoveda` aktualizace.

---

**Po schválení jedu sub-commity sériově.**
