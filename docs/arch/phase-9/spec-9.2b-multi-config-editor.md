# Spec 9.2b — Multi-config per svět + config editor

**Status:** Draft — čeká na schválení
**Rozsah:** BE breaking refactor + FE editor stránka
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE` (FE)
**Velikost:** XL — ~30 souborů (BE 12, FE 15, migrace 2, testy 5+)
**Autor:** PJ + Claude
**Datum:** 2026-05-25
**Souvisí:** [spec-9.2a-fantasy-engine.md](spec-9.2a-fantasy-engine.md) — engine, který tato spec konzumuje

---

## 1. Cíl

Umožnit svět s **více souběžnými kalendáři** (např. „Lidský", „Elfí", „Drowí"). Konsolidovat BE storage do **jedné kolekce**. PJ má v `/svet/:worldSlug/admin/kalendare` stránku pro CRUD configů (týden/měsíce/hodiny/tělesa/sezóny). Auto-seed Gregorian default při založení nového světa. Sjednocení BE shape s FE engine z 9.2a.

---

## 2. Kontext / motivace

User požadavek (2026-05-25): „Tvorba vlastních kalendářů. Možnost jich mít i více najednou v jednom světě." + „PJ kalendář, který vidí vše — postavy, NPC, lokace."

Stávající BE má **dvě paralelní úložiště** pro calendar config:
1. `World.calendarConfig` inline subdoc ([world.schema.ts:31](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts#L31)), endpoint `PUT /worlds/:id/calendarconfig` (no dash) → singular per svět.
2. `world_calendar_configs` kolekce ([world-calendar-config.schema.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/schemas/world-calendar-config.schema.ts)) s `worldId UNIQUE`, endpoint `PUT /worlds/:id/calendar-config` (dash) → také singular.

⚠️ **Dluh:** dvojí storage, dvojí endpoint, dvojí service, dvojí migrace. Pro 9.2b multi-config musíme **konsolidovat** a vytvořit **n-per-svět**.

BE shape `CelestialBody` ([world-calendar-config.interface.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/interfaces/world-calendar-config.interface.ts)) je over-engineered (discriminated union per type: moon/sun/planet/comet/other) a v FE engine z 9.2a jsme zjednodušili na uniform `orbitalPeriodDays + epochOffset`. **Sjednocení na FE shape** = menší/jednodušší schema, žádná ztráta funkčnosti (8 fází ze 9.2a pokryje vše, co `CelestialBodyType` rozlišovalo).

Bez 9.2b nelze:
- Implementovat 9.2c (per-entita mřížka — potřebuje `Event.calendarConfigId`).
- Implementovat 9.2d (PJ aggregate s přepínáním kalendáře — potřebuje `World.timelineEpoch` + multiple configs).
- Implementovat 9.2e (novinky fantasy datum — potřebuje vybrat z více configs).

---

## 3. Audit současného stavu

### BE — duplicity k odstranění

| Soubor | Stav |
|---|---|
| [worlds/schemas/world.schema.ts:31](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts#L31) | `calendarConfig?: Record<string, unknown>` inline subdoc — **drop** |
| [worlds/repositories/worlds.repository.ts:173-188](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/repositories/worlds.repository.ts#L173) | `updateCalendarConfig` — **drop** |
| [worlds/worlds.controller.ts:347-359](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts#L347) | `PUT /worlds/:id/calendarconfig` (no dash) — **drop** |
| [worlds/worlds.service.ts:1013-1033](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1013) | `updateCalendarConfig` — **drop** |
| `worlds/dto/update-calendar-config.dto.ts` | **drop** |

### BE — `world-calendar-config` modul k refactoru

| Soubor | Stav |
|---|---|
| [world-calendar-config.schema.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/schemas/world-calendar-config.schema.ts) | `worldId UNIQUE` → drop unique, přidat `slug` field + compound index `{worldId+slug} UNIQUE` |
| [world-calendar-config.interface.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/interfaces/world-calendar-config.interface.ts) | `CelestialBody` discriminated union → sjednotit na FE shape (`orbitalPeriodDays + epochOffset + color + icon?`). Přidat `seasons[]`, `slug`, `name`, `epochOffset`. |
| [world-calendar-config.controller.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/world-calendar-config.controller.ts) | Současné `GET/PUT /worlds/:id/calendar-config` → refactor na `GET/POST/PATCH/DELETE /worlds/:id/calendar-configs[/:slug]`. |
| `world-calendar-config.service.ts` | Refactor pro multi-config + auto-seed hook. |
| `calculateCelestialStates` (timeline) | Adaptace na nový shape. |

### BE — World schema rozšíření

```ts
@Prop({ default: null }) defaultCalendarConfigSlug: string | null;
@Prop({ default: 0 }) timelineEpoch: number;  // absDay od kterého kalendáře měří svůj epochOffset
```

`timelineEpoch` = společný „den 0" napříč všemi kalendáři světa. Default 0 (= proleptic Gregorian epoch). Pro fantasy svět může být PJ jiné absolutní datum.

### Migrace dat

Existující světy (po nasazení 9.2b):
1. Pokud existuje `World.calendarConfig` (legacy inline) → přesunout do `world_calendar_configs` jako `{ slug: 'default', name: 'Default kalendář', ...data }`. Smazat z `World`.
2. Pokud existuje `world_calendar_configs` doc s `worldId == X` (old singular) → zachovat, doplnit `slug: 'default'`, `name: 'Default kalendář'`.
3. Pokud nic neexistuje → vytvořit Gregorian default ze 9.2a shape (auto-seed).
4. Set `World.defaultCalendarConfigSlug = 'default'` pro všechny existující světy.
5. Set `World.timelineEpoch = 0`.

Backfill skript `backfill-multi-calendar-config-9.2b.ts` v `backend/src/migrations/`. Dry-run default, `--apply` flag pro produkční běh.

### FE existující kód

| Soubor | Stav |
|---|---|
| [calendarEngine/](../../../src/shared/lib/calendarEngine/) | Hotov v 9.2a — konzumováno. |
| [CalendarPage.tsx](../../../src/features/world/pages/CalendarPage.tsx) | Stávající PJ view — refactor v **9.2d**, ne tady. |
| [CalendarTab.tsx](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx) | Stávající per-entita seznam — refactor v **9.2c**. |

---

## 4. Návrh řešení

### 4.1 BE — kolekce `world_calendar_configs`

```ts
// backend/src/modules/world-calendar-config/schemas/world-calendar-config.schema.ts
@Schema({ timestamps: true, collection: 'world_calendar_configs' })
export class WorldCalendarConfigSchemaClass {
  @Prop({ required: true, index: true }) worldId: string;
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop({ default: 24 }) hoursPerDay: number;
  @Prop({ type: [String], default: [] }) daysOfWeek: string[];
  @Prop({ type: [MixedArraySubSchema], default: [] }) months: Record<string, unknown>[];
  @Prop({ type: [MixedArraySubSchema], default: [] }) celestialBodies: Record<string, unknown>[];
  @Prop({ type: [MixedArraySubSchema], default: [] }) seasons: Record<string, unknown>[];
  @Prop({ default: 0 }) epochOffset: number;
}

WorldCalendarConfigSchema.index({ worldId: 1, slug: 1 }, { unique: true });
```

Shape `CelestialBody`/`Season`/`MonthDef`/`FantasyDate` **identický s FE 9.2a** (přesné mirror).

### 4.2 BE — Endpoints

| Endpoint | Auth | Co dělá |
|---|---|---|
| `GET /worlds/:worldId/calendar-configs` | member | seznam všech configů světa |
| `GET /worlds/:worldId/calendar-configs/:slug` | member | jeden config |
| `POST /worlds/:worldId/calendar-configs` | PomocnyPJ+ | create nový config |
| `PATCH /worlds/:worldId/calendar-configs/:slug` | PomocnyPJ+ | partial update (delta merge per [[feedback_persist_across_variants]]) |
| `DELETE /worlds/:worldId/calendar-configs/:slug` | PomocnyPJ+ | smaz; **403 pokud je defaultCalendarConfigSlug** |

PATCH = delta merge (full-replace nás kousl v dluzích — viz [[feedback_persist_across_variants]]).

### 4.3 BE — World schema rozšíření

```ts
@Prop({ default: 'gregorian' }) defaultCalendarConfigSlug: string;
@Prop({ default: 0 }) timelineEpoch: number;
```

`PATCH /worlds/:id/calendar-defaults` endpoint pro změnu defaultu (PJ+).

### 4.4 BE — Auto-seed Gregorian při novém světě

V `worlds.service.create()` po insertu World volat `calendarConfigService.seedGregorianDefault(worldId)`. Insertne config se slug `'gregorian'`, name „Gregoriánský kalendář", a kompletním shape z FE `GREGORIAN_DEFAULT_CONFIG` (žádné runtime mirror — jen zkopírovat hodnoty ručně do seed funkce).

⚠️ **Mirror tax:** FE `GREGORIAN_DEFAULT_CONFIG` a BE seed muset držet synchron. Jeden zdroj pravdy: BE seed je „kanonický", FE default je „fallback když svět nemá config" (sketch test ověří shape parity).

### 4.5 BE — `calculateCelestialStates` (timeline)

Adaptace na nový `CelestialBody` shape. Místo discriminated union `MoonConfig | SunConfig | …` použije `getLunarPhase` logiku ze FE engine (= 8 fází per body). Žádná regrese, jen jednodušší kód.

### 4.6 FE — stránka `/svet/:worldSlug/admin/kalendare`

Route: `/svet/:worldSlug/admin/kalendare`. Permission: **PJ+** (vlastní admin sekce, ne member).

UI struktura (3 sloupce na desktop, vertikální stack na mobil — per `mobil-desktop`):

```
┌────────────────┬──────────────────────────────────────┐
│ Seznam configů │ Editor vybraného configu             │
│ ─────────────  │ ─────────────────────                │
│ ⭐ Gregorian   │ [Identita]                           │
│   Elfí         │   Slug, Name, Description            │
│   Drowí        │ [Týden]                              │
│ + Přidat       │   daysOfWeek[] (add/remove/rename)   │
│                │ [Měsíce]                             │
│                │   months[] (name, daysCount)         │
│                │ [Hodiny]                             │
│                │   hoursPerDay                        │
│                │ [Nebeská tělesa]                     │
│                │   celestialBodies[] (name, orbital,  │
│                │                     color, epoch)    │
│                │ [Sezóny]                             │
│                │   seasons[] (name, start, color)     │
│                │ [Smazat | Mark as default | Uložit]  │
└────────────────┴──────────────────────────────────────┘
```

Hlavní komponenty:
- `CalendarConfigsPage.tsx` — wrapper, layout.
- `CalendarConfigList.tsx` — sidebar seznam + add button + ⭐ default indikátor.
- `CalendarConfigEditor.tsx` — formulář s 5 sekcemi (Identita, Týden, Měsíce, Hodiny, Nebeská tělesa, Sezóny).
- `CelestialBodyRow.tsx`, `SeasonRow.tsx`, `MonthRow.tsx` — řádkové editory s ✕ remove.
- API hooky: `useCalendarConfigs`, `useCreateCalendarConfig`, `useUpdateCalendarConfig`, `useDeleteCalendarConfig`, `useSetDefaultCalendarConfig`.

### 4.7 FE — Persistence

PATCH delta merge per [[feedback_persist_across_variants]]:
- Frontend pošle **jen změněné fields** (`{ months: [...], seasons: [...] }`).
- BE delta-merge proti existujícímu docu (ne full replace).
- A→B→A test: vytvoř config, edituj `months`, edituj `seasons`, ověř že `months` zůstaly z prvního editu.

### 4.8 FE — Visual design

Per [[feedback_frontend_design_audit]] (skin-related):
- Sekce v cards, soft borders, subtle elevation.
- ⭐ ikona = default marker (sun/star, ne emoji „⭐" — vector icon z Lucide `Star`).
- Color pickers pro tělesa a sezóny (HTML `<input type="color">`).
- Add/remove tlačítka s `Plus` / `Trash2` ikonami.
- Drag-handle pro re-order měsíců/dní (poppy iteration in 9.2c, ne tady — out of scope).

---

## 5. Out of scope

- ❌ Per-event `calendarConfigId` na `CharacterCalendar.events[]` — 9.2c (vyžaduje refactor `CalendarTab`).
- ❌ Per-entita `preferredCalendarConfigId` na `Character` — 9.2c.
- ❌ PJ aggregate view toolbar přepínač — 9.2d.
- ❌ Fantasy datum na `WorldNews` — 9.2e.
- ❌ Drag-and-drop re-order měsíců/dnů — out of scope (možná follow-up).
- ❌ Validace „nelze smazat config s existujícími events" — 9.2c (až tam přibyde `calendarConfigId` na events).
- ❌ UI překlad / multi-jazykové názvy měsíců — fantasy worlds = jeden jazyk.

---

## 6. Acceptance kritéria

1. ✅ BE `World.calendarConfig` inline field smazán, endpoint `PUT /worlds/:id/calendarconfig` (no dash) smazán.
2. ✅ BE kolekce `world_calendar_configs` má `{worldId+slug} UNIQUE`, podporuje N configů per svět.
3. ✅ BE endpoints `GET/POST/PATCH/DELETE /worlds/:worldId/calendar-configs[/:slug]` fungují s role gate (member read, PomocnyPJ+ write).
4. ✅ DELETE odmítne smazat default config (403 + `DEFAULT_CONFIG_LOCKED`).
5. ✅ BE `World.defaultCalendarConfigSlug` (default `'gregorian'`) + `World.timelineEpoch` (default 0).
6. ✅ Auto-seed Gregorian default při `POST /worlds` (nový svět) — vytvoří config se slug `'gregorian'` + nastaví `World.defaultCalendarConfigSlug = 'gregorian'`.
7. ✅ Backfill skript `backfill-multi-calendar-config-9.2b.ts` migruje existing worlds (dry-run + `--apply` mode).
8. ✅ FE stránka `/svet/:worldSlug/admin/kalendare` (PJ+) zobrazuje seznam + editor.
9. ✅ Create nový config přes UI funguje (`POST` BE, refetch list).
10. ✅ Edit existing config (delta merge — A→B→A test) zachová unedited fields.
11. ✅ Delete config se UI zeptá (`ConfirmDialog`); default config nelze smazat.
12. ✅ Set as default přes UI funguje (`PATCH /worlds/:id/calendar-defaults`).
13. ✅ Mobile responsivita ≤768px (vertikální stack: seznam pod sebou, editor pod ním).
14. ✅ FE testy: editor CRUD flow + persistence A→B→A.
15. ✅ BE testy: kolekce constraint (unique slug), auto-seed, default lock, delta merge.
16. ✅ Žádné nové TS/lint errors.

---

## 7. Test plán

### BE (vitest / jest)

| Soubor | Co testuje |
|---|---|
| `world-calendar-config.service.spec.ts` (refactor) | Multi-config CRUD; unique slug; default lock; delta merge |
| `worlds.service.spec.ts` (rozšíření) | Auto-seed Gregorian při create; defaultCalendarConfigSlug update |
| `backfill-multi-calendar-config-9.2b.spec.ts` | Migrace 3 scénáře: inline only / collection only / nic — všechny → kolekce s slug 'gregorian' |

### FE (vitest)

| Soubor | Co testuje |
|---|---|
| `CalendarConfigsPage.spec.tsx` | render seznam + editor; create/edit/delete flow |
| `CalendarConfigEditor.spec.tsx` | formulář field-by-field; sezóna add/remove; default toggle |
| `useCalendarConfigs.spec.ts` | hooks CRUD + delta merge |
| `persistence.spec.ts` | A→B→A scénář per [[feedback_persist_across_variants]] |

### Manuální smoke

- Vytvořit nový svět → ověřit auto-seed Gregorian (DB inspect + GET endpoint).
- Existující svět: spustit backfill `--apply` → ověřit migrace.
- FE: otevřít `/svet/X/admin/kalendare`, vytvořit „Elfí kalendář" 13 měsíců × 30 dní, uložit, refresh, ověřit perzistenci.
- Mobile: ≤768px viewport, ověřit usable.

---

## 8. Riziko & rollback

| ID | Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|---|
| R1 | Backfill data loss při migraci inline → kolekce | nízká | vysoký | Dry-run default, `--apply` opt-in, log před každým write, mongo dump před produkčním během |
| R2 | Drift mezi FE `GREGORIAN_DEFAULT_CONFIG` a BE seed | střední | nízký | Sketch test parity (FE engine spec snapshot vs BE seed snapshot) |
| R3 | Timeline `calculateCelestialStates` regrese po shape change | střední | střední | Existující testy rozšířit + 1 nový test pro každou fázi Měsíce |
| R4 | Performance — `GET .../calendar-configs` při N configs × M characters | nízká | nízký | N očekáváno ≤ 5 per svět (UX), no concern |
| R5 | FE editor schema validation drift | střední | střední | Zod schema mirror BE DTO; `z.input` (ne `z.infer`) pro RHF resolver |

**Rollback:** Backfill je idempotent (`--apply` znova OK). Pokud BE deploy failne, FE editor stránku jen vypneme přes route guard. Worst case revert commits.

---

## 9. Otázky k autorovi (volitelné)

**Žádné, autor delegoval, volby:**

- Konsolidace dvou storage → kolekce = **ano** (dluh by zůstal, nelze ignorovat).
- Sjednocení BE `CelestialBody` shape s FE = **ano** (BE current je over-engineered, žádná funkční regrese).
- Auto-seed Gregorian při novém světě = **ano** (potvrzeno user 2026-05-25).
- `World.timelineEpoch` jako Number = **ano** (= absDay reference, default 0).
- `defaultCalendarConfigSlug` string ref (ne ObjectId) = **ano** (slug je human-readable, slug-unique constraint).
- DELETE default config = **403 lock** (PJ musí nejdřív set jiný default).
- PATCH delta merge = **ano** (per [[feedback_persist_across_variants]]).
- FE editor v `/admin/kalendare` (ne `/admin/nastaveni-kalendare`) = **ano** (krátký URL, parita s `/admin/...`).

---

**Po schválení specu napíšu implementační plán** (přesné soubory + obsah + sub-step commits — BE refactor, BE rozšíření, backfill, FE editor jako 4 samostatné commits).
