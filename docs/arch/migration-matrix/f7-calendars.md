# F7 — Kalendáře (události entit) Matrix → Ikaros

> Migrace světa **matrix**. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **✅ HOTOVO — živé v newmatrix (2026-06-08).** Naimportováno 1205 událostí na 21 entit (21/21 nalezeno, 0 chyb). Předkrok `fix-location-characters` vytvořil 497 lokacím možnost kalendáře (493 nových Characterů + 4 reuse).

## Klíčové zjištění (oprava HANDOFF předpokladu)
HANDOFF čekal „mapovat staré kalendáře na Ikaros calendar engine" (presety měsíců/přestupných roků). **Realita:** kolekce `Calenders` **nejsou definice kalendářních systémů**, ale **události vázané na entitu** (`characterSlug` → `events[]`). Staré datumy jsou **gregoriánské ISO** (`2038-01-05T00:00:00.000Z`).

→ Cíl tedy **není** calendar engine / presety, ale Ikaros **calendar subdoc** (`character_calendars`, keyed `characterId`). Žádná konverze epoch — jen parse ISO → `FantasyDate`.

## Zdroj
`C:\Matrix\dump\MatrixDatabase\Calenders.bson` (čteno Node + `bson` z `backend/node_modules`).
Tvar dokumentu:
```
{ _id, characterSlug: "<base>-kalendar", events: [ {_id: uuid, title, start: Date, end: Date|null, allDay: true} ] }
```

## Rozsah
39 dokumentů, **22 s událostmi** (17 prázdných = skip). Po napárování slug `{base}-kalendar` → Page (kategorie z `f2-klasifikace.csv`):

| Typ | Entity | Událostí |
|---|---|---|
| **NPC** | pan-jeskyne (537), luke-villiam (253), emily-brown (1) | 791 |
| **PC** | abi 101, myra 57, helsing 30, zara 20, kraven 8, cael 6, mingguo 3, sion 1, archie 1 | 227 |
| **Lokace/země** | evropska-unie 20, rusko 17, vnejsi-sabska-rise 17, indie 16, britanie 15, nusa 15, cina 14, samansky-stat 10 | 124 |
| **NPC (mis-klasifikace)** | john 63 — v CSV „Lokace", v Ikaros NPC (`John Willscar`, má tab Kalendář) | 63 |
| **skip** | test 9 (testovací smetí: „hfgh", „něco") | — |

**Celkem k importu: 21 entit, ~1205 událostí** (před filtrem placeholderů).

### Skip pravidla
- Celý kalendář `test-kalendar` (9 ev).
- Placeholder události: `title === "Neznámá událost"` **a** rok startu `=== 1` (`0001-01-01` = .NET `DateTime.MinValue`, nevyplněné datum) — 5 ks.
- Prázdné kalendáře (0 events) — 17 ks.

### Ověřené (nepřekvapí při importu)
- **Pán Jeskyně 537** = vlastní bohatá dějová osa kampaně. **NE** automatická agregace všeho: 426 ev unikátních, jen 111 sdílených s postavami (17 % událostí postav je u PJ = veřejné světové eventy). Import 1:1 = věrný originálu; 111 dvojzobrazení v PJ agregaci ponecháno (bylo i v originále).
- **john** = NPC postava (narozen 2016, Irsko, mág), klasifikace „Lokace" je chyba. V Ikaros je správně NPC. Import beze změny.

## Cílový model
`character_calendars` (collection), schema [`character-calendar.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/schemas/character-calendar.schema.ts):
```
{ characterId: string (unique), worldId: string, color, displaySettings, events: Mixed[] }
```
Event tvar (`CalendarEvent`, [`character-calendar.interface.ts`](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/interfaces/character-calendar.interface.ts)):
```
{ id, title, calendarConfigId?, start: FantasyDate, end?: FantasyDate, allDay?, ..., symbol? }
FantasyDate = { year, monthIndex (0-based!), day, hour?, minute? }
```

## Transformace (per event)
| Staré pole | Ikaros pole | Pravidlo |
|---|---|---|
| `_id` (uuid) | `id` | zachovat (idempotence klíč) |
| `title` | `title` | trim |
| `start` (Date UTC) | `start: FantasyDate` | `{year: getUTCFullYear, monthIndex: getUTCMonth (už 0-based), day: getUTCDate}` |
| `end` (Date\|null) | `end?: FantasyDate` | stejně; null → pole vynechat |
| `allDay` (true) | `allDay` | vždy true → žádné hourStart/hourEnd |
| — | `calendarConfigId` | **null/vynecháno** → engine fallback na world default (matrix = gregorian) |
| — | `_mig` | `'f7'` — marker pro rollback (extra pole, `toEntity` ho ignoruje) |

## Mechanika — 2 fáze (vzor F12)

### Fáze A — lokální build `migration/f7-build.mjs`
- Načte `Calenders.bson`, aplikuje skip pravidla, transformuje events.
- Výstup `migration/f7-calendars.json(.gz)` = `[{ slug: <base>, events: [IkarosEvent…] }]`.
- Lokálně vypíše souhrn (entit, events, skipnuto) k ověření před importem.

### Fáze B — workflow `import-matrix-calendars.yml` (3 režimy)
`dry-run` (default) / `import` (confirm `IMPORT`) / `rollback` (confirm `ROLLBACK`). mongosh přes SSH, world ObjectId `6d6174726978000000000001`. Logika v IIFE (mongosh gotcha).

Per entry `{slug, events}`:
1. `ch = db.characters.findOne({ slug, worldId: <W> })` → chybí: log skip (entita nemá Character → nemá kam). `characterId = String(ch._id)`.
2. Upsert `character_calendars` keyed `characterId`:
   - chybí dokument → vytvoř (`color:'#3B82F6'`, `displaySettings:{}`, `events:[]`).
   - pro každý migrovaný event: pokud `events[].id` už existuje → **skip** (idempotence); jinak push.
3. **Idempotence:** re-run nepřidá duplikáty (klíč = event.id). **Rollback:** `$pull` events kde `_mig==='f7'`; calendar zůstane (prázdný neškodí).

⚠️ **Dry-run nejdřív ověří** (F12 lekce — prod DB ≠ dump/schema):
- tvar `worldId` v `characters` (string `"6d61…"` vs ObjectId) → query musí matchnout uložený typ.
- kolik z 21 slugů reálně má Character v prod DB (kdo nemá → skip, nahlásit).
- zda některá entita už má ruční events (merge je nesmí přepsat).

## Mimo rozsah
- Calendar **config/presety** (matrix běží na gregorian world default — netřeba).
- `displaySettings`, `color` per entita (necháme default; PJ si doladí v UI).
- `test` kalendář, prázdné kalendáře, placeholder events.

## Dodatek — zjištění z dry-run (2026-06-08)
Dry-run odhalil 2 věci (worldId je **string** `6d61…`, párování OK):

**1. Slug-drift (3 entity)** — staré `Calenders` mají krátký slug, produkční Page přejmenovaná:
| starý | produkční | typ |
|---|---|---|
| john | **john-willscar** | NPC |
| kraven | **pumi-stin** | PC (Pumí stín) |
| mingguo | **li-mingguo** | PC |

→ `ALIAS` mapa v `f7-build.mjs` (přemapuje při buildu). Workflow pak najde přes Page.characterRef.

**2. Lokace bez kalendáře (oprava F4)** — `type:Lokace` celkem **497, z toho 497 bez `characterRef`**. Žádná lokace neměla možnost kalendáře (F4 jim nevytvořila lokační Character). PJ požadavek: všechny lokace mají mít kalendář.

→ **Nový předkrok `fix-location-characters.yml`** (3 režimy): pro každou Page `type:Lokace` bez characterRef vytvoří Character `{kind:'location', isNpc:false}` + `Page.characterRef` + prázdný `character_calendars`. Existující Character se stejným slug → reuse (ne duplikát). Markery `_mig:'f7loc'` (chars+calendars) + `_migF7LocRef` (pages). Idempotentní, rollback maže f7loc + odpojí characterRef.

## Pořadí spuštění (POVINNÉ)
1. **`fix-location-characters`** dry-run → import (confirm IMPORT). Vytvoří 497 lokačním stránkám možnost kalendáře.
2. **`import-matrix-calendars`** dry-run → import. Teď už 7 zemí má characterRef → kalendáře se naimportují (mělo by být `nalezeno: 21, nenalezeno: 0`).

## Otevřené body
1. ~~worldId typ~~ → ověřeno string.
2. `Page.type` má i `"Ostatni"` (45) vedle `"Ostatní"` (1035) — diakritický drift, **mimo F7** (zapsáno do dluhů).
