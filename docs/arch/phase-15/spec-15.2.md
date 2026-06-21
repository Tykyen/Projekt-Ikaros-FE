# Spec 15.2 — Čtvercová & bezmřížková mapa

**Stav:** návrh (čeká impl.) · **Fáze:** 15 (Viditelnost / mapa) · **Roadmap:** [roadmap2.md §15.2](../../roadmap2.md)

## 1. Cíl

Volba typu mřížky **na úrovni scény**: `hex` (dnešní default) / `square` (čtverec) / `none` (žádná).
Většina systémů (D&D, DrD, Zaklínač) i stažených map počítá se čtvercem nebo bez mřížky; hex-only odrazuje část PJ na startu.

## 2. Klíčová rozhodnutí

### R1 — Souřadnice zůstávají integer `q`/`r` (žádná migrace)
Token pozice, fog (`"q,r"` klíče), combat order, `findFirstFreeHex` — vše stojí na celočíselné mřížce.
Hex i čtverec **sdílí stejné úložiště**; liší se jen *geometrie převodu* buňka↔pixel. Rozšíření, ne přepis (požadavek roadmapy).
Existující scény bez `gridType` → default `hex` (BC).

### R2 — „žádná mřížka" (`none`) = čtvercová geometrie bez kreslených čar (varianta A, schváleno)
Tokeny se srovnávají na (neviditelnou) čtvercovou mřížku. Nula migrace, fog/měření fungují.
Pravé volné (pixel-perfect) umístění = float souřadnice = přepis → **mimo 15.2** (případné 15.2b).

### R3 — BE beze změny (kromě kosmetického TS typu)
`MapScene.config` je na BE volný `Record<string, unknown>`, `SceneConfigOpDto` bere celý objekt přes `@IsObject()`,
repository ho vrací transparentně (`doc.config as HexConfig`). → `gridType` propluje persistencí **bez** schema/DTO/mapper změny.
Doplnit jen `gridType?` do BE `HexConfig` TS interface (jinak nic).
⚠️ Po BE deploy NENÍ nutný restart kvůli persistenci (config není ve ValidationPipe whitelistu po polích), ale doplnění TS typu vyžaduje rebuild.

### R4 — Strategy pattern: `GridAdapter`
Jeden interface, 3 implementace. Konzumenti přestanou volat `hexUtils` napřímo → `getGridAdapter(config.gridType)`.
`hexUtils.ts` zůstává beze změny (hexAdapter ho jen obaluje → existující testy zelené).

## 3. `GridAdapter` interface

```ts
type GridType = 'hex' | 'square' | 'none';

interface GridAdapter {
  type: GridType;
  /** Kreslit čáry mřížky? false pro 'none'. */
  drawsGrid: boolean;
  /** Buňka (q,r) → střed v px (BEZ origin). */
  toPixel(q: number, r: number, size: number): Point;
  /** Px (BEZ origin) → nejbližší buňka. */
  toCell(x: number, y: number, size: number): HexCoord;
  /** Obrys buňky pro render (number[] pro Graphics.poly). `scaled` = efektivní size (volající passuje size*k). */
  cellPoly(center: Point, scaled: number): number[];
  /** Vzdálenost v buňkách (hex distance / Chebyshev). */
  distance(a: HexCoord, b: HexCoord): number;
  /** Vyplněný disk 0..radius (fog štětec, bariéra). */
  cellsInRadius(q: number, r: number, radius: number): HexCoord[];
  /** Jen prstenec ve vzdálenosti radius (explosion rings). */
  cellsInRing(q: number, r: number, radius: number): HexCoord[];
  /** Směrové vektory sousedů (BFS free-cell). */
  neighbors: HexCoord[];
  /** Poloměr tokenu = vepsaná kružnice buňky. */
  tokenRadius(size: number): number;
}
```

**Mapování implementací:**

| metoda | hex | square / none |
|---|---|---|
| `toPixel` | `axialToPixel` (flat-top) | `{x: q*size, y: r*size}` |
| `toCell` | `pixelToAxial` (cube-round) | `{q: round(x/size), r: round(y/size)}` |
| `cellPoly` | `getHexPolyPoints` (6 rohů, edge=scaled) | čtverec strana `scaled` (half = scaled/2) |
| `distance` | `hexDistance` | Chebyshev `max(|Δq|,|Δr|)` |
| `cellsInRadius` | `getHexesInRadius` | čtvercový blok `|Δq|≤r ∧ |Δr|≤r` |
| `cellsInRing` | `getHexRing` | Chebyshev prstenec `max(|Δq|,|Δr|)==r` |
| `neighbors` | `AXIAL_DIRECTIONS` (6) | 8 směrů (vč. diagonál) |
| `tokenRadius` | `round(size*√3/2)` | `round(size/2)` |
| `drawsGrid` | true | square: true · none: **false** |

> Pozn.: `size` má per-typ jiný geometrický význam (hex = délka hrany, square = délka strany). To je OK — `size` se nikdy nemíchá mezi typy; každý adaptér ho interpretuje konzistentně sám.

## 4. Dotčená místa (FE)

| soubor | změna |
|---|---|
| `types.ts` | `HexConfig.gridType?: GridType` |
| `grid/` (nový modul) | `types.ts` (interface), `hexAdapter.ts`, `squareAdapter.ts`, `index.ts` (`getGridAdapter`) |
| `components/HexGrid.tsx` | render přes adapter; skip když `!drawsGrid \|\| !showGrid` |
| `components/tokens/TokenSprite.tsx` | `toPixel` + `tokenRadius` přes adapter |
| `hooks/useTokenDrag.ts` | snap přes `toPixel`/`toCell` |
| `utils/screenToHex.ts` | `toCell` přes adapter |
| `utils/findFirstFreeHex.ts` | `neighbors` přes adapter |
| `components/fog/fogUtils.ts` | `fogBrushHexes` → `cellsInRadius` |
| `components/fog/FogLayer.tsx` | `toPixel` + `cellPoly` |
| `components/effects/EffectsLayer.tsx` | `toPixel`, `cellPoly`, `cellsInRing` |
| `TacticalMapView.tsx` | :141 `distance`, :839 `cellsInRadius`, :1568 `toPixel` (placement ghost) |
| `components/pj-panel/EditSceneModal.tsx` | selektor typu mřížky + persist `gridType` v configu |

BE: `HexConfig` interface +`gridType?` (kosmetika).

## 5. UI (EditSceneModal)

Sekce „Hex mřížka" → **„Mřížka"**. Nahoru **segmentový selektor** (Hex / Čtverec / Žádná).
`showGrid` checkbox zůstává jako toggle čar pro hex/čtverec (u `none` se ignoruje — čáry se nekreslí).
`size`/`originX`/`originY` zůstávají relevantní i pro square/none (řídí rozteč snapu).
Po úpravě → `mobil-desktop`.

## 6. Hranice scope (mimo 15.2)

- ⚠️ **AoE tvary** (kužel, koule šablony) na čtverci: v 15.2 fungují přes cell-fill (čtvercové prstence), ale *tvarové* šablony jsou až **15.3** (měření & šablony). Explosion/barrier/color efekty na square fungují (cell-based).
- Pravé volné umístění (`none` bez snapu) → případné 15.2b.
- Obdélníkové buňky / tokeny 2×2 → mimo (otevřená otázka roadmapy, odloženo).

## 7. Testy

- `grid/__tests__/squareAdapter.test.ts` — round-trip `toPixel→toCell`, Chebyshev distance, ring/radius počty, tokenRadius.
- `grid/__tests__/getGridAdapter.test.ts` — výběr adaptéru dle typu + default hex pro `undefined`.
- Existující `hexUtils.test.ts`, `screenToHex.test.ts` — zůstávají (hexAdapter deleguje).

## 8. Migrace / kompatibilita

Žádná datová migrace. `gridType === undefined` → hex. Default nové scény: hex (BE default config beze změny).
