# Implementační plán 10.2g — Efekty na taktické mapě

> Port herní logiky z Matrixu (`MapEffectOverlay` + `EffectsPalette`), render
> přepsán SVG → PixiJS. Datová vrstva (typy, `effect.*` ops, patcher, theme
> barvy, hexUtils) hotová z prep fází — **žádný BE, žádné nové ops**.

## Tři efekty (model dle Matrixu, beze změny)
- `color` — 1 hex/klik, barva z 8 přednastavených
- `barrier` — brush (tažení) nebo kruh (`getHexesInRadius`), `barrierDC`
- `explosion` — rings od středu (`getHexRing`), variant fire/gas/smoke, per-ring damage (max 6)

## Soubory

### NEW — render
1. `components/effects/effectColors.ts`
   - Port `FIRE_COLORS` / `GAS_COLORS` / `SMOKE_COLORS` (6 tier rgba každý) + `getVariantColors(variant)`.
   - Herní konvence (oheň=červená→žlutá), ne theme — proto konstanty, ne CSS var. Theme base barvy slouží jen ikoně v paletě.

2. `components/effects/EffectsLayer.tsx` (PixiJS, do `layer-effects`)
   - Props: `effects`, `config`, `theme`, `canEdit` (PJ + mazací režim), `onRemoveEffect(id)`.
   - `color`: pro každý hex `pixiGraphics` poly fill barvou efektu (`getHexPolyPoints`, size*0.95).
   - `barrier`: žlutá výplň + DC `pixiText` uprostřed (avg hexů). Glow = druhý širší poly s nižší alpha (Pixi nemá `drop-shadow`).
   - `explosion`: `[...rings].reverse()` od největšího, hexy ringu `getHexRing` minus `excludedHexes`, barva `getVariantColors[tier]`, damage `pixiText` na první hex ringu.
   - **Animace přes `useTick`** (vzor `TokenSprite` spotlight): jedna sdílená `alpha` oscilace pro fire/gas/smoke (per-variant perioda), aplikovaná na container. `prefers-reduced-motion` → statická alpha.
   - Klik na efekt: `eventMode='static'` + `pointertap` → `onRemoveEffect` (jen když `canEdit`).

### NEW — paleta + tool state
3. `hooks/useEffectTool.ts` — state machine
   - `activeTool: 'color'|'barrier'|'explosion'|null`, `selectedColor`, `barrierDC/Shape/Radius`, `explosionRings/Variant`, `eraseMode`, `activeBarrierId` (brush kontinuita).
   - Akce: `setTool` (toggle), param settery, `startNewBarrier` (reset `activeBarrierId`).
   - LS persist parametrů (`ikr-map-effect-*`) — pohodlí PJ napříč scénami.

4. `components/effects/EffectsPalette.tsx` (HTML toolbar) + `.module.css`
   - Svislý toolbar 4 tlačítka (🎨/🛡/💥/🗑) + rozbalovací panel **doleva** (slide-in 150ms).
   - Aktivní tlačítko = glow v barvě nástroje + puls 1.8s (dle design auditu).
   - 🗑 jen když `effectCount>0`. Vše mono font pro čísla.
   - Panel obsah dle nástroje: 8 swatchů 4×2 / DC+tvar+poloměr / variant+rings+„přidat".
   - Fog **vynechán** (→ 10.2h).

### EDIT
5. `TacticalMapView.tsx`
   - `extend({ ... Text })` už je; přidat `Graphics` (je). OK.
   - `useEffectTool()` + `<EffectsPalette>` (jen `isPJ`), pozice vpravo dole nad zoom.
   - Mount `<EffectsLayer>` do `<pixiContainer label="layer-effects">`.
   - `effectAddMutation` / `effectRemoveMutation` (pattern `spawnMutation`: optimistic přes `applyOperationToScene`, WS dorovná).
   - `handleViewportClick`: **nová větev s nejvyšší prioritou** — když `activeTool && isPJ`:
     - `color` → `effect.add` 1 hex
     - `barrier circle` → `effect.add` `getHexesInRadius`
     - `barrier brush` → append hex do `activeBarrierId` efektu přes `effect.update` (nový přes `effect.add` + zapamatuj id)
     - `explosion` → `effect.add` rings+variant
   - Barrier brush tažení: `onPointerMove` na canvas když tool aktivní + tlačítko drženo → paint hex (throttle dedup last hex).
   - Suppress pan: předat `suppressLeftPan = activeTool!==null || placement.active` do panZoom.
   - `onClick` viewport aktivovat i když `activeTool!==null`.

6. `useViewportPanZoom.ts`
   - Nový 3. param `suppressLeftPan?: boolean` → `suppressLeftPanRef`. V `onPointerDown` mouse větvi: left (0) panuje jen když `!suppressLeftPanRef.current`. Middle (1) panuje vždy.

7. Dock-width odsazení (řešení „viditelné při deníku")
   - `TokenInfoPanel.tsx`: v `dock` módu `useEffect` set `document.documentElement.style.setProperty('--map-dock-width', width+'px')`, cleanup `'0px'`.
   - `MapZoomControls.module.css` + `EffectsPalette.module.css`: `right: calc(20px + var(--map-dock-width, 0px))`.

### Testy
- `effectColors.test.ts` — tier clamp, variant fallback.
- `useEffectTool.test.ts` — toggle, ring add/remove (max 6), barrier kontinuita.
- `EffectsPalette.spec.tsx` — render tlačítek, panel přepínání, effectCount gate.
- `EffectsLayer` — smoke render přes `applyOperationToScene` fixtures (3 typy).

## Mimo rozsah
Fog (10.2h), WS throttling (10.2i), ping/měření (10.2m).

## Po implementaci
`mobil-desktop` audit (paleta na dotyku), `napoveda` (PJ nástroje efektů), roadmap check 10.2g, zavřít dluhy pokud nějaké.
