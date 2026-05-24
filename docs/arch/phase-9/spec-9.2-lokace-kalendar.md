# Spec 9.2 — Lokace má vlastní kalendář (re-introduction po 9.1 regresi)

**Datum:** 2026-05-24
**Stav:** Návrh — čeká na schválení
**Návaznost:** Spec 10b (kalendář postav), Spec 9.1 (sjednocení Page+Character)

---

## Kontext

Spec 10b (`docs/superpowers/specs/2026-05-04-krok-10b-calendar-design.md:37`) explicitně počítala, že **Lokace = Character s `isNpc=true` + `isLocation=true`** a **má jen kalendář subdoc** (žádný diary/finance/inventory/notes). PJ vidí lokační eventy v agregovaném pohledu.

Krok 9.1 (`docs/arch/phase-9/spec-9.1.md`) sjednotil Page+Character a v cleanup fázi smazal `isLocation` z `characters` collection (`spec-9.1.md:191`). Lokace přestala být Character → ztratila `characterCalendar` subdoc, vypadla z `CalendarsModule.aggregate()`. **Krok 9.1 R2** plánoval „Migrovat na `type: Lokace`", ale **nezahrnoval re-link na calendar subdoc** — to je regrese, kterou spec 9.2 napravuje.

## Cíl

Page typu `Lokace` má vlastní kalendář (view + edit), který se zobrazuje v PageViewer jako samostatný tab a započítává se do PJ agregátu world events.

## Rozhodnutí (z brainstormingu)

| ID | Rozhodnutí | Důvod |
|---|---|---|
| **D1** | Page typu Lokace dostane `characterRef` na Character entity (stejný pattern jako PostavaHrace/NPC) | 100 % re-use existující calendar infrastruktury (PUT endpoint, color, displaySettings, agregát). Žádný duplikovaný subdoc model. |
| **D2** | Character entity dostane `kind: 'persona' \| 'location'` (default `'persona'`) místo vraceného `isLocation` flagu | Čistější vyjádření „k čemu Character slouží"; rozšiřitelné (např. budoucí `'organization'`, `'event'`). Migrace: existující Characters → `kind: 'persona'`. |
| **D3** | LokaceLayout dostane horizontální taby **Profil** / **Kalendář** (analogie PostavaLayout) | Konzistence UX napříč Page typy s subdocs. Plný prostor pro měsíční grid. |
| **D4** | `CalendarsModule.aggregate()` znovu zahrne Lokace eventy (Character `kind: 'location'` se NEEXkluuduje) | Spec 10b explicitní záměr — PJ vidí všechny eventy světa v jednom pohledu, nezávisle na entity-type. |

---

## BE změny

### Character entity

```ts
// backend/src/modules/characters/schemas/character.schema.ts
@Prop({ enum: ['persona', 'location'], default: 'persona' })
kind: 'persona' | 'location';
```

`Character` interface + `CreateCharacterDto` + `UpdateCharacterDto` rozšířené o `kind?: 'persona' | 'location'`.

### Page → Character auto-create

[backend/src/modules/pages/pages.service.ts:235](pages.service.ts) — Krok 9.1 už zakládá `Character` při `Page.type ∈ {PostavaHrace, NPC}`. Rozšířit:
- `Page.type === 'Lokace'` → auto-create Character s `kind: 'location'`, žádné personal/diary subdocs (jen `characterCalendar`)
- existující Lokace bez `characterRef` (před 9.2) → opt-in backfill skript `backfill-lokace-character-9.2.ts`

### CharacterSubdocs (calendar)

Žádné změny v API. Existující `PUT /api/worlds/:worldId/characters/:slug/calendar` funguje pro Character s `kind: 'location'` identicky.

`assertSubdocAccess` pro Lokaci:
- **view** — kdokoli se přístupem na Page (membership world + AKJ check)
- **edit** — `WorldRole >= PomocnyPJ` (Lokace nemá owner v smyslu PostavaHrace)

### CalendarsModule

`aggregate()` filtr **rozšířen** o `kind: 'location'` (dnes implicitní filter pouze `persona`, po D2 zachovat oba). Color/displaySettings beze změny.

### Migrace dat

Skript `backfill-lokace-character-9.2.ts`:
1. Najdi všechny `Page.type === 'Lokace'` bez `characterRef`
2. Vytvoř Character s `kind: 'location'`, `name = page.title`, `slug = page.slug`, `worldId = page.worldId`
3. Vytvoř prázdný `characterCalendar` subdoc
4. Updatuj `page.characterRef = newCharacter.id`

Dry-run mode default. Logger výstup: počet Page, vytvořených Characters, errorů.

---

## FE změny

### LokaceLayout

Re-write [src/features/world/pages/PageViewer/layouts/LokaceLayout.tsx](LokaceLayout.tsx) podle PostavaLayout vzoru:

```tsx
const tabs: TabItem[] = [
  { id: 'profil', label: 'Profil', icon: <MapPin size={16} /> },
  ...(character ? [
    { id: 'kalendar', label: 'Kalendář', icon: <CalendarDays size={16} /> },
  ] : []),
];
```

- **Profil tab** = stávající `OstatniLayout` obsah (AKJ banner, content, sections, sidebar, AutoTOC)
- **Kalendář tab** = re-use `CalendarTab` komponentu z `PostavaLayout` (přes `useCharacterCalendar` hook, identický fetch)
- Edit/view mode toggle + dirty-guard navigation block (port z PostavaLayout)

### PageEditor

Pokud `page.type === 'Lokace'` a `characterRef` exists, zobrazit info-link „Otevřít kalendář →" v IdentityPanel (analogie PostavaPanel). Žádný edit kalendáře přímo v PageEditoru (calendar editor žije v LokaceLayout `Kalendář` tab).

### Sidebar widget (zatím out of scope)

Mini-kalendář v `WorldDashboardPage` nebo per-Lokace sidebar — **fáze 9.3**, mimo rozsah 9.2.

---

## Acceptance criteria

1. **Nová Lokace** vytvořená přes PageEditor → BE auto-create Character `kind: 'location'` + prázdný `characterCalendar` subdoc → `page.characterRef` set.
2. **Existující Lokace** (před 9.2) po běhu backfill skriptu mají `characterRef` a prázdný kalendář.
3. **PageViewer** pro Page typu Lokace zobrazuje 2 taby: `Profil` + `Kalendář` (pokud `characterRef` exists).
4. **Kalendář tab** umožňuje view + edit (`PomocnyPJ+`) — month grid identický s PostavaLayout.
5. **PJ aggregate** (`GET /api/worlds/:worldId/calendars`) zahrnuje Lokace eventy v `events[]`.
6. **Permission**: anonymous user (mimo svět) → 404 pro `PUT /calendar`; member non-PJ → 403 pro `PUT`, 200 pro `GET`.
7. **Mobile responsivita** ([base.md](base.md)) — Kalendář tab funguje na ≤768px (mobil list fallback z `CalendarPage.tsx` re-use).

---

## Out of scope (fáze 9.3+)

- Mini-kalendář sidebar widget na Page Lokace (zobrazit „nejbližší 3 eventy")
- Cross-link „Postavy přítomné v této lokaci v daný den" (vyžaduje `location` ref na `CalendarEvent`)
- Filter `?location=<slug>` v `/svet/<w>/kalendar` (globální view)
- Bulk akce nad Lokace eventy (přesun, kopírování)

---

## Otevřené otázky

1. **`kind` jako enum nebo dva booleany?** Doporučení D2 = enum (rozšiřitelné). Pokud preferuješ minimální changeset, lze ponechat `isLocation: boolean` (re-add po 9.1 cleanupu). **Otevřeno k revizi v impl plánu.**
2. **„NPC v lokaci" hybrid** — má smysl Character `kind: 'location'` + zároveň `isNpc: true`? Spec 10b původně počítala s OR; D2 enum to vyžaduje vyřešit explicitně. Návrh: `kind: 'location'` ⇒ ignoruj `isNpc` (location není postava).
3. **Backfill default off?** Skript vyžaduje explicit `--apply` flag pro produkční běh; dry-run logguje plánované změny.

---

## Reference

- Spec 10b: `c:/Matrix/ProjektIkaros/Projekt-ikaros/docs/superpowers/specs/2026-05-04-krok-10b-calendar-design.md`
- Spec 9.1: `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/docs/arch/phase-9/spec-9.1.md`
- PostavaLayout vzor: `src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx`
- CalendarTab vzor: `src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx`
