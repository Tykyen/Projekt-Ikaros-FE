# Spec 15.2–15.4 — Mřížky, měření, kreslení & world map defaults (sloučeno)

**Stav:** návrh (čeká schválení) · **Fáze:** 15 · **Roadmap:** [§15.2](../../roadmap2.md) · [§15.3] · [§15.4]
Sloučení 15.2 + 15.3 + 15.4 + nový subsystém **world map defaults** — vše stojí na společné mřížkové abstrakci a overlay vrstvě.
Detailní 15.2 viz též [spec-15.2.md](spec-15.2.md) (adaptér).

## 0. Sjednocující princip — dvouvrstvá konfigurace

**World defaults (PJ nastaví v nastavení světa) → scéna zdědí → scéna volitelně přepíše.**
Platí pro: typ mřížky, měřítko, viditelnost HP, povolení kreslení.
Primární vstup pro PJ = nastavení světa (ať má jasno, co všechno mapy umí). Scéna je override, ne výchozí místo nastavení.

```
WorldSettings.mapDefaults  ──seed při scene.create──▶  scene.config  ──UI override──▶  EditSceneModal
```

## 1. Datový model

### 1.1 `scene.config` (rozšíření, vše optional + default = BC, žádná migrace)
| pole | typ | default | krok |
|---|---|---|---|
| `gridType` | `'hex'\|'square'\|'none'` | `'hex'` | A |
| `unitsPerCell` | number | `1` | B/C |
| `unitLabel` | string | `'m'` | B/C |
| `allowPlayerDrawing` | boolean | `false` | D |
| *(stávající)* `size,originX,originY,showGrid,showHpPc/Npc/Bestie` | | | — |

BE: `config` je volný `Record<string,unknown>` → **propluje bez schema/DTO/mapper změny** (jen kosmetický TS typ).

### 1.2 `scene.drawings` (NOVÉ pole, krok D)
Persistuje se jako `effects` (`MixedArraySubSchema`).
```ts
interface MapDrawing {
  id: string;
  kind: 'line' | 'arrow' | 'circle' | 'text';
  points: number[];           // map-space px páry [x0,y0,x1,y1,...]
  color: string;
  text?: string;              // jen kind='text'
  createdByUserId: string;
  visibility: 'pj' | 'all';   // PJ-only vs všichni
}
```
BE delta: pole ve schématu + ops `drawing.add` / `drawing.remove` / `drawing.clear` + repository passthrough. WS přes stávající `map:operation`.

### 1.3 `WorldSettings.mapDefaults` (NOVÉ, krok E)
```ts
interface MapDefaults {
  gridType: 'hex' | 'square' | 'none';
  size: number;
  unitsPerCell: number;
  unitLabel: string;
  showHpPc: boolean; showHpNpc: boolean; showHpBestie: boolean;
  allowPlayerDrawing: boolean;
}
```
BE: volný `@Prop({type:Object})` na `worldsettings` (vzor `pjChatPersona`). Seed v `maps.service.create` když není `templateId` ani explicitní `config`.

## 2. Architektura

### 2.1 GridAdapter (krok A) — strategy pattern
Viz [spec-15.2.md §3](spec-15.2.md). 3 implementace (hex = obal `hexUtils`, square = nová matematika, none = square bez čar). Interface: `toPixel/toCell/cellPoly/distance/cellsInRadius/cellsInRing/neighbors/tokenRadius/drawsGrid`.
Konzumenti → `getGridAdapter(config.gridType)` místo přímého `hexUtils`.

### 2.2 Měřítko = ohraničení mapy stupnicí (krok C, 15.3)
Grafická **stupnice po okrajích mapy** (jako pravítka v CAD/Photoshopu), odvozená z `config`:
gradace každých N buněk, popisky v `unitLabel` (např. `0 · 1,5 m · 3 m · …` z `unitsPerCell`).
Statický render (nová `MapScaleFrame` vrstva), **viditelný všem**. Žádné nové config pole — počítá se z
`unitsPerCell/unitLabel/size/gridType/originX/originY`. Volitelné zobrazení (toggle, default zap.).

### 2.2b Pravítko = sdílené měření bod↔bod (krok C, 15.3)
Nástroj v MapToolDock, **přístupný hráči i PJ**. Drag z bodu A do B → `adapter.distance(a,b) × unitsPerCell`
→ čára + popisek (`"7,5 m"`). **Výsledek vidí všichni** (collaborative range-check „dostřelím?").
→ **ephemeral broadcast přes WS** vzorem `PingsLayer` (nová `MapRulerLayer` + ephemeral event, **neukládá se** do scény).
⚠️ Nový WS event → při implementaci `socket-contract`.

### 2.2c Šablony oblastí (krok C, 15.3)
Placement nástroj (živý náhled snapnutý na mřížku) pro `kužel / koule / linie / čtverec`.
Po potvrzení → uloží se jako **stávající `effect`** (reuse `scene.effects` + effect ops).
Effect render rozšířen o tvary kužel/linie (koule = stávající radius, čtverec = `cellsInRadius` square).

### 2.3 Kreslení (krok D, 15.4) — overlay vrstva
- Nová `MapDrawingLayer` (PixiJS overlay nad mapou) + nástroje čára/šipka/kruh/text v MapToolDock.
- Kreslit smí **PJ vždy**; **hráč** jen když `config.allowPlayerDrawing` (PJ přepínač per scéna, default z world default).
- Per-kresba `visibility: 'pj'|'all'`. Hráč vidí `all` + (volitelně) vlastní. Mazání: autor + PJ.
- Sdílí shape-primitiva s 2.2 (společný `drawShapePrimitive` util), ne dva paralelní systémy.

### 2.4 World defaults UI (krok E)
Sekce „Výchozí nastavení map" v nastavení světa (PJ-only). Edituje `mapDefaults`. EditSceneModal pole jsou předvyplněná z defaultů (přes seed), ale plně přepisovatelná.
Stejný inheritance princip aplikovat i na **viditelnost HP** (dnes jen per-scéna → doplnit world default, který seeduje).

## 3. Dotčená místa (FE) — souhrn

**Krok A:** nový `grid/` modul; `HexGrid`, `FogLayer`, `EffectsLayer`, `TokenSprite` (pozice+radius), `useTokenDrag`, `screenToHex`, `findFirstFreeHex`, `fogUtils`, `TacticalMapView` (:141/:839/:1568), `types.ts`.
**Krok B:** `EditSceneModal` (selektor mřížky + měřítko), `types.ts`.
**Krok C:** `MapScaleFrame` (stupnice po okraji) + `MapRulerLayer` (sdílené pravítko, WS ephemeral vzor `PingsLayer`) + ruler tool v `MapToolDock`; effect schema/render rozšíření o tvary kužel/linie; placement tool. Nový WS event → `websocket-api.md` + `socket-contract`.
**Krok D:** `MapDrawingLayer`, drawing ops v `mapApi`/`applyOperationToScene`, `MapToolDock`, BE `scene.drawings` + ops + repository.
**Krok E:** `WorldSettings` FE/BE typ + `mapDefaults`, world settings UI sekce, BE `maps.service.create` seed.

## 4. Pořadí dodání (bránové kroky)

A (mřížky render/snap) → B (modal: mřížka+měřítko) → C (15.3 měření+šablony) → D (15.4 kreslení) → E (world defaults).
Po každém kroku: `tsc -b` + dotčené vitest, `npm run build`, `mobil-desktop` (UI kroky), `funkce`+`napoveda` před commitem. Lze zastavit po kterémkoli kroku — stav konzistentní.

## 5. Hranice scope

- Pravítko je sdílené (WS broadcast, ephemeral) — **v scope** kroku C. Persistované měření / uložené šablony čar mimo.
- Pravé volné (pixel) umístění u `none` → 15.2b.
- Obdélníkové buňky / tokeny 2×2 → mimo.

## 6. Otevřené (k doladění během kroků, neblokuje start)

- Auto-suggest měřítka dle systému (D&D 5e → 1,5 m)? Default zatím 1 m, volitelné.
- Hráčova vlastní `pj`-neviditelná kresba — vidí ji jen on + PJ? (default: hráč vidí `all` + vlastní).
