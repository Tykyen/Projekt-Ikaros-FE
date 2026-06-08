# Spec 9.2 follow-up — Calendar UX: barvy entit + persistence pozice

> Navazuje na [`spec-9.2-lokace-kalendar.md`](./spec-9.2-lokace-kalendar.md), [`spec-9.2cde-konzumenti.md`](./spec-9.2cde-konzumenti.md). Stav: **✅ IMPLEMENTOVÁNO** (A auto-paleta + override picker, B persistence — oba pohledy). Testy 21 ✓, build ✓.
> Původ: PJ požadavky po F7 migraci kalendářů (2026-06-08). Paměť `project_calendar_feature_requests`.

## Kontext
Po F7 je v agregovaném PJ kalendáři ([`CalendarPage.tsx`](../../../src/features/world/pages/CalendarPage.tsx)) 21+ aktivních zdrojů + 497 lokací s prázdným kalendářem. Všechny mají default barvu `#3B82F6` → **agregace je barevně nečitelná**. Zároveň po refreshi kalendář skáče na dnešní (reálné) datum, což v in-universe čase (matrix 2038–2040) hráče vykopne z děje.

## Featura A — barva per entita

### Cíl
Každá entita (NPC / Lokace / PC) má v kalendáři **rozlišitelnou barvu**, kterou jde nastavit. PJ nastavuje barvy NPC/Lokace, hráč barvu své postavy.

### Datový model (beze změny BE)
`CharacterCalendar.color` (string, default `#3B82F6`) **už existuje** a teče přes `useCalendarsAggregate` do `AggregatedCalendarEvent.color`. Mutace `updateCalendar(characterId, {color})` existuje; permission řeší BE `assertSubdocAccess` (owner pro svou PC, PomocnyPJ+ pro vše).

### A1 — automatické rozlišení (default)
Aby agregace byla čitelná **bez ručního obarvení** (497 lokací nelze obarvit ručně):
- FE resolver `resolveCalendarColor(calendar)`: pokud `color` je nastavená **a ≠ default** → použij ji; jinak **deterministická barva z palety** podle `characterId`.
- Paleta: ~12–16 vizuálně odlišených odstínů laděných na Ikaros skin (HSL hash z characterId → index). Stejná entita = vždy stejná barva (deterministicky).
- **Žádný zápis do DB** — auto-barva je render fallback. Manuální volba = override (zápis `color`).
- 🔀 Alternativa (zamítnuto pro MVP): přidat `color: null` default + flag — vyžaduje BE změnu + migraci 497 lokací. Heuristika „default modrá = auto" stačí; volba přesně `#3B82F6` ručně je marginální.

### A2 — color picker UI
Reuse existující pattern ([`GroupColorPicker.tsx`](../../../src/features/world/chat/components/GroupColorPicker.tsx) / [`ChatColorPicker`](../../../src/features/profile/components/ChatColorPicker/ChatColorPicker.tsx)) — paleta předvolených barev + volný HEX. Žádná nová vizuální komponenta od nuly (theme izolace).
- **Agregace (PJ):** v sidebaru zdrojů u každé entity barevný **swatch**; klik → picker. Mění `color` dané entity (PJ permission).
- **CalendarTab (per entita):** color editor v hlavičce kalendáře. PJ u NPC/Lokace, hráč u vlastní PC (owner gate).
- Po změně: `updateCalendar` + invalidace `['calendars-aggregate', worldId]` a per-character calendar query.

### A3 — responsivita
Swatch + picker funkční na mobilu (≥44px tap target) i desktopu. Po implementaci `mobil-desktop` skill.

## Featura B — persistence zobrazené pozice

### Cíl
Kalendář si přes refresh pamatuje **poslední zobrazené období** (ne dnešek), aby se uživatel vrátil tam, kde četl děj.

### Implementace
- `CalendarPage.tsx`: `cursor` (`{year, monthIndex}`, dnes init na `now`) → init z `localStorage` klíč `calendar-cursor-${worldId}`; persist `useEffect` při změně (vzor existujícího `STORAGE_GROUPS_KEY`).
- Fallback na `today`, pokud klíč prázdný/nevalidní.
- Tlačítko „dnes" (skok na aktuální in-universe/reálné datum) zůstává — persistence jen mění **výchozí** pozici při načtení.
- **CalendarTab** (per-postava): stejný princip, klíč `calendar-cursor-${worldId}-${characterId}` (volitelně sdílený hook `usePersistedCursor`).
- ⚠️ Per svět (ne globálně) — různé světy mají různé in-universe roky.

## Mimo rozsah
- Per-viewer barvy (každý uživatel jiné barvy téže entity) — model „barva patří entitě" stačí pro zadání.
- View mode persistence (CalendarPage je měsíční grid; week/day jen lokálně, pokud existuje).
- Změna BE schématu / migrace barev.

## Otevřené body (potvrď při schválení)
1. **A1 auto-paleta** — souhlas s automatickým barevným rozlišením (jinak zůstane vše modré, ruční obarvení 497 lokací nereálné)? **Doporučeno ano.**
2. **B persistence** — jen agregace PJ, nebo i per-postava `CalendarTab`? **Doporučeno oba.**
