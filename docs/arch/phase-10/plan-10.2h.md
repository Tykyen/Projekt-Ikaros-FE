# Plán 10.2h — Fog of war

Spec: [spec-10.2h.md](./spec-10.2h.md). Vše datové + BE hotové z prep → **čistě FE**.

## Nové soubory
| Soubor | Obsah |
|---|---|
| `tactical-map/hooks/useFogTool.ts` | state machine (`active`, `mode`, `brushSize`) + LS persist `ikr-map-fog-*` |
| `tactical-map/hooks/useFogTool.test.ts` | persist + state přechody |
| `tactical-map/components/fog/FogLayer.tsx` | PixiJS render-texture maska |
| `tactical-map/components/fog/FogPalette.tsx` | paleta (dle frontend-design auditu) |
| `tactical-map/components/fog/FogPalette.module.css` | mlhová identita (accent `#9fb4d4`) |
| `tactical-map/components/fog/fogUtils.ts` | `effectivelyRevealed(revealedHexes, tokens)` + `fogBrushHexes(q,r,size)` |
| `tactical-map/components/fog/fogUtils.test.ts` | reveal∪PC, brush radius |

## Krok 1 — `useFogTool` (TDD)
Vzor `useEffectTool`. State: `active: boolean` (tool zapnutý = kreslení), `mode: 'reveal'|'fog'`, `brushSize: 0|1|2`. LS klíče `ikr-map-fog-mode`, `ikr-map-fog-size`. `active` se NEpersistuje (session). Test první.

## Krok 2 — `fogUtils` (TDD)
- `fogBrushHexes(q, r, size)` → `size===0 ? [{q,r}] : getHexesInRadius(q,r,size)` (reuse hexUtils).
- `effectivelyRevealed(revealedHexes, tokens)` → `Set<"q,r">` = revealed ∪ `{tokens kde !isNpc}`.
- `isHexRevealed(set, q, r)`. Test první.

## Krok 3 — `FogLayer` (render-texture maska)
Render do `layer-fog`. **Primární varianta A (RenderTexture):**
1. `useApplication()` → `app.renderer`. Vytvoř `RenderTexture` o velikosti bounding boxu (revealed ∪ PC ∪ rezerva), v map-space.
2. Do off-screen `Graphics`: full-fill (fog je všude) → pro každý efektivně-odhalený hex `poly(getHexPolyPoints).cut()` (díra).
3. `app.renderer.render({ container: maskGfx, target: renderTexture })`.
4. `BlurFilter` (strength ≈ `config.size*0.18`) → měkké okraje děr.
5. `<pixiSprite texture={rt} />` jako fog overlay tónovaný `isPJ ? fogPjFill : fogPlayerFill`.

Regenerace v `useMemo`/`useEffect` na `[revealedHexes, pcTokenHexy, config, isPJ, theme]` — **ne v useTick**.

⚠️ **Riziko:** imperativní `renderer.render` v deklarativním @pixi/react v8 (přístup k rendereru, async init — viz [[project_pixi_async_init]]). **Krok 3a = spike** (~30 min): ověřit RenderTexture cestu. Když křehká → **fallback varianta B:** jeden `<pixiGraphics>` přímo do `layer-fog` — full-fill fog barvou + `.cut()` díry + `BlurFilter` na container. Splňuje „ne per-hex DOM polygony" (jeden GPU objekt), jednodušší, deklarativní. Volba A/B se potvrdí po spiku.

Žádný klik-handling ve FogLayer (na rozdíl od EffectsLayer) — brush řeší viewport pointer (krok 5).

## Krok 4 — NPC visibility gate (`TokenLayer`)
Hráč + `fogEnabled` + NPC/bestie token v hexu mimo `effectivelyRevealed` → nerenderovat. PC vždy. Předat `fogEnabled`/`revealedSet`/`isPJ` do TokenLayer. Test gate.

## Krok 5 — Integrace `TacticalMapView`
- `const fogTool = useFogTool();`
- `suppressLeftPan`: `effectTool.activeTool !== null || placement.state.active || fogTool.active`.
- Brush: rozšířit existující `onPointerMove`/klik větev — když `fogTool.active && isPJ`: `screenToHex` → `fogBrushHexes` → optimistic `fog.brush {mode, hexes}` mutace. Dedup `lastDrawnHex` (reuse pattern). Vzájemné vyloučení: zapnutí fog toolu vypne effectTool a naopak.
- `<FogLayer>` do `layer-fog` (nahradit prázdný placeholder ř. 853).
- `FogPalette` jako nový `<MapToolDock title="🌫️ Mlha" storageKey="fog">` v `MapDockStack` (jen PJ), vedle Efektů.
- Reset: `fog.set {enabled, revealedHexes: []}` + `ConfirmDialog`.
- Toggle Mlha zap/vyp: `fog.set {enabled, revealedHexes: <current>}`.

## Krok 6 — `FogPalette` + CSS
Dle auditu. Reuse `.segmented/.segBtnActive/.clearBtn/.numInput`; fog-specifické (master switch, štětec-segmenty, accent `#9fb4d4`) v `FogPalette.module.css`. Master switch off → mode+štětec disabled.

## Krok 7 — Mutace `fog.set`/`fog.brush`
Hook `useFogMutation` (vzor `useEffectMutation`): optimistic patch přes `applyOperationToScene` (cases hotové) → `POST /maps/:id/operations` → rollback on error. WS auto-sync přes patcher (žádný nový event).

## Krok 8 — Závěr
1. `mobil-desktop` audit (touch brush, paleta).
2. Vitest celé zelené.
3. Roadmapa 10.2h → `[x]`.
4. Případné dluhy → `dluhy.md`.
5. `napoveda` skill (nová PJ funkčnost mlhy).

## Pořadí
1 → 2 → 3(spike→A/B) → 4 → 7 → 5 → 6 → 8. Kroky 1–2 TDD (čistá logika), 3–6 vizuální (manuální + smoke testy).
