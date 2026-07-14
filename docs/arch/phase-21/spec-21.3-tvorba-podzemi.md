# Spec 21.3 — Tvorba podzemí (samostatný editor + generátor)

**Stav:** SCHVÁLENO 2026-07-14 · 21.3a IMPLEMENTOVÁNO (čeká živé ověření) · 21.3b TODO
**Datum:** 2026-07-14
**Roadmapa:** 21.3 Stavitel & generátor podzemí / map [H4-01]

---

## 1. Kontext a cíl

Samostatný „hloubkový program" (fullscreen editor à la taktická mapa) pro tvorbu
jednoduchých podzemí, součást každého světa. Dvě cesty tvorby:

1. **Generátor** — procedurální podzemí donjon-stylu (místnosti + chodby + dveře),
   parametry + tlačítko „Přegenerovat, dokud se nelíbí".
2. **Ruční editor** — malování podlahy/skály, pokládání dveří, schodů, terénu
   a **dekorací** (bedny, postele, stoly, židle, …).

Vizuální reference (od uživatele): klasická donjon mapa — bílá podlaha s mřížkou,
černý skalní masiv, glyfy dveří, pergamenový rám, legenda.

**Ověřený stav kódu (2026-07-14):**
- BE modul `dungeon-maps` **existuje kompletní**: CRUD + `export-template` +
  `export-scene` (`backend/src/modules/dungeon-maps/`). Model: grid buněk
  `DungeonCell` + `DungeonDecoration`, viz §5.
- FE = stub `DungeonBuilderPage.tsx` („[stub] Dungeon builder") na route
  `/admin/dungeon-builder` (RoleGuard Sa/Admin) — **nesoulad**: world-nav odkaz
  vidí všichni členové, BE guard je world-PJ+, FE route Sa/Admin. Řeší §3.
- FE nikde nevolá `/dungeon-maps` (0 výskytů).

## 2. Sub-kroky

| Krok | Obsah | Stav |
|---|---|---|
| **21.3a** | Fullscreen editor + generátor + dekorace + uložení per svět + PNG export | tento zátah |
| **21.3b** | Export na taktickou mapu jako scéna (render → imageUrl) **včetně konverze zdí → `MapWall` (LoS)** a dveří | navazuje hned po a |
| 21.3c+ (výhled) | Více pater, hex grid, exteriéry/města, popisy místností, AI obrázek (18.3), knihovna dílků, sdílení mezi světy | mimo tento spec |

## 3. Přístup a gating (Podporovatel, 19.4)

- **Route:** `/svet/:worldSlug/podzemi` — per-world stránka (nahrazuje
  `/admin/dungeon-builder`; admin route + stub se **ruší**, nav odkaz ve
  worldNavConfig přestává být `external`).
- **Kdo smí tvořit:** člen světa **Hrac+**, který je Podporovatel
  (`isEffectiveSupporter` — flag NEBO týmová role Sa/Admin/Správci).
  **PJ+ světa vždy** (herní nástroj jádra, BE už je dnes PJ+).
- **Vlastnictví:** každé podzemí má `ownerId` (nové pole). Owner edituje/maže
  svoje; **PJ+ světa vidí a spravuje všechna** podzemí světa.
- **Ne-podporovatel (Hrac):** nav položku vidí, stránka ukáže zamčený teaser
  s vysvětlením (vzor prémiové skiny kostek — FE `isEffectiveSupporter`,
  `SkinPickerPanel` pattern).
- **BE vynucení:** v `DungeonMapsService` (guard neexistuje, vzor
  `worlds.service.ts` / `chat.service.ts`): create/update/delete = member Hrac+
  ∧ (supporter ∨ PJ+); read list = member (čtení cizích podzemí jen PJ+ — owner
  vidí svoje); `export-scene`/`export-template` zůstává **PJ+** (zápis do TM).

## 4. UX / vizuální návrh

**Layout — fullscreen tři zóny** (vzor taktická mapa, chrome v theme tokenech):

```
┌──────────────────────────────────────────────────┐
│ ← Zpět · Název podzemí · [Uložit] [PNG] [⚙ mapa] │  horní lišta
├───────┬──────────────────────────────────────────┤
│ nástr.│                                          │
│ lišta │        plátno (canvas 2D)                │
│ (levá)│   zoom/pan, mřížka, donjon render        │
│       │                                          │
├───────┴──────────────────────────────────────────┤
│ legenda glyfů (Průchod·Dveře·Zamčené·Past·Tajné·Mříž) │
└──────────────────────────────────────────────────┘
```

- **Plátno = hero.** Donjon-styl: bílá podlaha `#FFFFFF`, mřížka jemná šedá,
  skalní masiv černý, glyfy dveří ve stylu reference, čísla místností
  monospace. Pergamenový rám + legenda = signature (věrné referenci).
  Editor-chrome tmavý/tichý přes theme tokeny (`var(--…)`, žádné hardcoded
  barvy mimo plátno — plátno samotné je „papír", tam jsou barvy záměrně fixní
  a exportují se do PNG).
- **Levá nástrojová lišta** (ikony + tooltip): výběr/posun · štětec podlaha ·
  guma (skála) · dveře (submenu 6 typů) · schody ↑/↓ · terén (voda/láva/jáma) ·
  dekorace (paleta) · popisek · undo/redo.
- **Panel generátoru** (vysouvací zprava): velikost (S 24×16 / M 40×28 /
  L 64×44), hustota místností, křivolakost chodeb, % zvláštních dveří, seed,
  **[Vygenerovat]** / **[Přegenerovat]**. Generování přepíše plátno (s confirm,
  pokud jsou neuložené ruční změny).
- **Domovská obrazovka nástroje:** seznam podzemí světa (moje + pro PJ vše)
  s náhledy, [Nové podzemí] → prázdné/generátor.
- **Mobil (≤768px):** nástrojová lišta jako spodní scrollable řádek, generátor
  fullscreen sheet, pan/zoom pinch — kreslení tap/drag. Po implementaci
  `mobil-desktop`.

## 5. Datový model (BE reuse + rozšíření)

Existující `DungeonMap` (`dungeon-map.interface.ts`) zůstává základ:
`{ id, worldId, name, gridType, gridWidth, gridHeight, cellSize, theme, cells: DungeonCell[][], decorations }`.

**BE rozšíření (malá, zpětně kompatibilní):**

1. `ownerId: string` na `DungeonMap` (+ `createdBy` audit; migrace: stará data
   bez ownerId → treat as PJ-owned).
2. `DungeonCell.type` — nové hodnoty dle legendy reference:
   `'archway'` (průchod) · `'door-secret'` (tajné) · `'door-trapped'` (s pastí) ·
   `'portcullis'` (padací mříž). (`door`, `door-locked` už existují.)
3. `DungeonDecoration.label?: string` — text popisku (čísla/názvy místností,
   vlastní poznámky na mapě); typ dekorace `'label'`.
4. Validace: grid max **100×100**, min 10×10; decorations max 500.

**Model zjednodušení 21.3a:** jen `gridType:'square'` + `theme:'dyson'`
(donjon). `wallEdges` se v 21.3a nepoužívají — skála = `empty` buňky (masiv),
zdi jsou implicitní hranice podlaha↔skála. Hex + modern theme = výhled.

**Katalog dekorací (14, top-down vektorové glyfy):**
bedna · sud · truhla · postel · stůl · židle · lavice · regál/knihovna · krb ·
oltář · sloup · studna · žebřík · suť/kámen. Rotace 0/90/180/270 (BE už umí).

## 6. Generátor (FE engine, čistá logika)

Vzor 21.2a: `engine/` složka bez React závislostí, unit-testovatelná.

- **Algoritmus (donjon-styl):** 1) rozmísti nepřekrývající se místnosti
  (náhodné obdélníky dle hustoty), 2) chodby: bludiště (recursive backtracker)
  v mezerách s nastavitelnou křivolakostí, 3) propoj místnosti s chodbami
  dveřmi (spanning tree + extra spoje), 4) ořež slepé konce (dle parametru),
  5) rozděl typy dveří dle % (běžné/zamčené/tajné/past/mříž/průchod),
  6) očísluj místnosti (dekorace `label`).
- **Deterministický seed** (zobrazený, editovatelný) → „Přegenerovat" = nový
  seed; stejný seed = stejná mapa.
- Dekorace generátor v 21.3a NEpokládá (jen čísla místností) — nábytek je
  ruční tvorba; automatické zabydlení = výhled.

## 7. FE architektura

```
src/features/world/dungeon-builder/
  api/dungeonMapsApi.ts        # CRUD /dungeon-maps (api.get(url, rawParams) kontrakt)
  hooks/useDungeonMaps.ts      # TanStack Query + mutations
  engine/generate.ts           # generátor (čistý, seedovaný) + testy
  engine/model.ts              # FE typy zrcadlící BE + helpery (flood fill, bounds)
  render/drawDungeon.ts        # canvas 2D renderer (sdílený editor náhled + PNG export)
  render/glyphs.ts             # glyfy dveří + dekorací (vektorové path funkce)
  components/DungeonBuilderPage.tsx   # seznam podzemí (route index)
  components/DungeonEditorPage.tsx    # fullscreen editor
  components/ToolPalette.tsx / GeneratorPanel.tsx / DecorationPalette.tsx
  state/editorStore.ts         # lokální editor stav (nástroj, zoom, undo stack ≤50)
```

- **Render: canvas 2D** (ne PIXI) — statická dlaždicová mapa bez animací;
  jednodušší, žádné async-init pasti, PNG export = tentýž renderer
  (`canvas.toBlob`). Undo/redo = snapshoty gridu v paměti.
- **Ukládání:** explicitní [Uložit] (PUT celé mapy) + warn při odchodu
  s neuloženými změnami. Žádný WS realtime (single-editor nástroj) — poslední
  zápis vyhrává; kolab editace = výhled.
- **PNG export:** render v plném rozlišení (cellSize × grid) + rám + legenda.

## 8. Routing a navigace

- `router.tsx`: nová route `svet/:worldSlug/podzemi` (+ `/podzemi/:id` editor)
  pod WorldLayout, memberOnly(Hrac). Editor = fullscreen (skrytá world nav,
  vzor taktická mapa).
- **Smazat** admin route `/admin/dungeon-builder` + stub `DungeonBuilderPage`
  z admin feature; `worldNavConfig.ts`: `to: ${b}/podzemi`, bez `external`.
- Návod kap. 26 (dokumentace slibuje builder jako hotový) — opravit text
  v rámci `funkce` + `napoveda` po implementaci.

## 9. Mimo rozsah 21.3a/b

Hex grid, theme `modern`, více pater, exteriéry/města, AI obrázky, kolaborativní
editace, automatické zabydlení dekoracemi, sdílení podzemí mezi světy, import.

## 10. Akceptační kritéria 21.3a

1. Hráč-Podporovatel i PJ vytvoří, uloží, znovu otevře a smaže podzemí ve světě;
   Hrac bez Podporovatele vidí teaser, BE mu create vrátí 403 (přívětivá hláška).
2. Generátor: parametry + seed → opakovatelný výsledek; „Přegenerovat" dá novou
   mapu < 1 s (M velikost).
3. Ruční editace: všechny nástroje §4 fungují myší i dotykem; undo/redo ≥ 20 kroků.
4. Dekorace: položení, rotace, smazání, popisek s textem.
5. PNG export odpovídá plátnu (rám + legenda).
6. PJ vidí v seznamu všechna podzemí světa vč. cizích, owner jen svoje.
7. Mobil ≤768px použitelný (mobil-desktop skill projde).
8. `npm run build` čistý; BE testy dungeon-maps zelené (rozšířené o gating).
