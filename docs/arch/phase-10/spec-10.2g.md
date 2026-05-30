# Spec 10.2g — Efekty na taktické mapě

## Účel
Plošné herní efekty kreslené PJ na hex mapu: **barevné zóny**, **bariéry** (DC),
**výbuchy/oblasti** (oheň/plyn/kouř s damage rings). Port herní logiky z Matrixu
(`MapEffectOverlay` + `EffectsPalette`), render přepsán SVG → **PixiJS v8**. Fog je
samostatný krok 10.2h.

## Datová vrstva (hotová z prep fází — nezměněna)
- Typy `MapEffect`, `ExplosionRing` (`types.ts`)
- Ops `effect.add` / `effect.remove` / `effect.update` + patcher `applyOperationToScene`
- `scene.effects` pole, BE persistence (`$push`/positional `$`/replace), WS broadcast
- BE `effect.add` **zachovává FE `id`** (žádný UUID přepis na rozdíl od tokenů) →
  brush append spolehlivý
- Theme barvy `effectColorDefault/BarrierFill/BarrierGlow/FireBase/GasBase/SmokeBase`
- hexUtils `getHexRing`, `getHexesInRadius`, `getHexPolyPoints`

## Tři efekty
| Typ | Tvar | Parametry |
|---|---|---|
| `color` | 1 hex / klik | barva (8 přednastavených) |
| `barrier` | brush (tažení) nebo kruh (`getHexesInRadius`) | DC, tvar, poloměr |
| `explosion` | soustředné rings od středu (`getHexRing`) | variant fire/gas/smoke, per-ring damage (max 6) |

## Komponenty
- **`EffectsLayer.tsx`** — PixiJS render do `layer-effects`. Per-typ subkomponenty;
  `explosion` má alpha puls přes `useTick` (per-variant perioda, respekt
  `prefers-reduced-motion`). Glow bariéry = širší poly s nízkou alfou (náhrada SVG
  `drop-shadow`). Klik na efekt (`canEdit` = PJ + mazací režim) → `effect.remove`.
- **`EffectsPalette.tsx`** + css — plovoucí svislý toolbar vpravo dole nad zoom
  controls; rozbalovací panel vyjede doleva. Aktivní nástroj nese svou barvu (glow +
  puls 1.8s). Mono font pro čísla. Mazací režim = společný přepínač. Jen PJ.
- **`effectColors.ts`** — tier škály fire/gas/smoke (herní konvence, ne theme) +
  `PALETTE_COLORS`/`VARIANT_CONFIG`.
- **`useEffectTool.ts`** — state machine (activeTool, params, eraseMode) + LS persist
  parametrů (`ikr-map-effect-*`).

## Integrace (`TacticalMapView`)
- Klik-na-hex effect větev má **nejvyšší prioritu** (před placement / move tokenu).
- Optimistic mutace (`effect.add/update/remove`, `scene.effects.replace` pro 🗑).
- Barrier brush tažení: `onPointerMove` while left-button + `brushBarrierIdRef`
  (master id, synchronní → imunní vůči staleness) + fresh scéna z TanStack cache.
  Jeden tah (pointerdown→up) = jedna souvislá bariéra; pointerup resetuje ref.
- `useViewportPanZoom(viewportRef, sceneId, suppressLeftPan)` — left-pan vypnut když
  effect tool / placement aktivní (left-drag patří nástroji). Middle + 2-prsty panují
  vždy.

## Pozice palety vs. deník
Deník (`TokenInfoPanel`) v **dock** módu (resizable 320–700px vpravo) vystaví svou
šířku jako `--map-dock-width` na `<html>`. Paleta i zoom controls mají
`right: calc(20px + var(--map-dock-width, 0px))` → při otevření deníku se odsunou
doleva vedle něj a zůstanou viditelné; resize doku posouvá živě (CSS `calc`, žádný
React re-render). Zavřeno / drag / overlay mód → `0px`.

## Responsivita
Toolbar tlačítka 44×44px na mobilu (touch target). Panel 180px na mobilu (pod
polovinou viewportu). Toolbar+panel ~228px < 375px → žádný horizontal scroll.

## Mimo rozsah
Fog (10.2h), WS throttling (10.2i), ping/měření (10.2m).

## Testy
21 nových: `effectColors` (tier clamp, variant fallback), `useEffectTool` (toggle,
ring add/remove, persist, poškozený LS), `EffectsPalette` (render, panel přepínání,
effectCount gate, toggle).
