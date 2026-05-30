# Spec 10.2h — Fog of war (mlha + odhalování)

## Účel
Mlha války na hex mapě: PJ štětcem odhaluje / zakrývá oblasti, hráč vidí jen
odhalené hexy + vlastní PC tokeny. Port herní logiky z Matrixu
(`FogOfWar.tsx` + fog brush v `MapPage`), render přepsán **SVG mask → PixiJS v8
render-texture maska** (princip §23.3 — ne per-hex polygony v DOM).

## Datová vrstva (hotová z prep fází — nezměněna)
- `MapScene.fogEnabled: boolean` + `MapScene.revealedHexes: HexCoord[]` (`types.ts`)
- Ops `fog.set { enabled, revealedHexes }` a `fog.brush { mode: 'reveal'|'fog', hexes }`
  — DTO, registry, `applyAtomic` (`$addToSet`/`$pullAll`), `computeInverse`, FE patcher
  `applyOperationToScene` (`fog.set`/`fog.brush`/`scene.fog.replace`) — vše hotové.
- BE `OperationsAuthorizer`: fog ops **PJ-only** (test `fog.brush → FORBIDDEN` pro hráče).
  Hráč fog op neemituje — bezpečnost je už na BE.
- Theme barvy: `--map-fog-pj-fill` (`rgba(70,75,95,0.16)`), `--map-fog-player-fill`
  (`rgba(170,180,200,0.94)`) v `_shared/map-tokens.css`.
- `revealedHexes` = **zdroj pravdy + audit** (princip „render-texture + hex log"):
  maska se vždy generuje z tohoto pole, ne naopak.

## Render technika — render-texture maska
`FogLayer` renderuje do prázdné vrstvy `layer-fog` (z-order mezi tokeny a pingy).

1. **Fog overlay** = jeden barevný `Sprite`/`Graphics` rect pokrývající bounding box
   všech relevantních hexů (revealed + PC tokeny + rezerva), barva + alpha dle role.
2. **Maska** = `RenderTexture` (PixiJS), do které vykreslíme **díry** v místech, která
   jsou odhalená:
   - pozadí RT = plné (fog viditelný všude),
   - každý **efektivně odhalený hex** (revealed ∪ hexy PC tokenů) vykreslen jako
     vyplněný hex polygon `eraseRect`/`blendMode` → díra (fog mizí),
   - `BlurFilter` na RT → měkké péřové okraje (feather ≈ `config.size * 0.18`,
     port Matrix hodnoty).
3. `fogOverlay.mask = Sprite(renderTexture)` → fog zůstává jen mimo odhalené oblasti.
4. Regenerace RT jen na změnu `revealedHexes`, pozic PC tokenů, `config.size`/origin
   nebo role (`useEffect`/`useMemo`) — **ne každý tick**.

📚 Render-texture maska = mlhu kreslíme do GPU textury jednou a používáme ji jako
průhlednostní šablonu — místo tisíců SVG polygonů v DOM (Matrix mobil-perf problém).

## PJ vs hráč pohled
| | Fog alpha/barva | Tokeny | Pod mlhou |
|---|---|---|---|
| **PJ** | `--map-fog-pj-fill` (poloprůsvitná, ví kde hráč nevidí) | vidí všechny | vidí skrz |
| **Hráč** | `--map-fog-player-fill` (téměř opaque) | NPC v ne-odhaleném hexu **skrytý** | nevidí |

- `fogEnabled === false` → `FogLayer` nerenderuje vůbec (oba vidí celou mapu).
- Přepínání role: `isPJ` (`>= PomocnyPJ`, zarovnáno s BE), už v `TacticalMapView`.

## PC tokeny vždy viditelné + NPC visibility gate
- **Efektivně odhalené** = `revealedHexes` ∪ `{ hex každého PC tokenu (!isNpc) }`.
  PC token tedy „prosvítí" mlhu kolem sebe (Matrix `alwaysVisibleHexes`).
- **NPC gate (hráč):** je-li `fogEnabled` a hráč, NPC/bestie token v hexu mimo
  efektivně-odhalené se v `TokenLayer` **nerenderuje**. PC tokeny renderují vždy.
- Soft-light záře kolem PC tokenů (princip §23.3 „volitelně") → **OUT OF SCOPE**,
  defer post-MVP (drží scope kroku).

## Komponenty
- **`components/fog/FogLayer.tsx`** — PixiJS render dle techniky výše. Props:
  `revealedHexes`, `tokens` (pro PC hexy), `config`, `theme`, `isPJ`, `viewport size`.
- **`components/fog/FogPalette.tsx`** + css — paleta nástroje, vzor = `EffectsPalette`
  (plovoucí, aktivní nástroj nese barvu + puls). Obsah:
  - přepínač **Mlha zap/vyp** (`fog.set` se zachováním `revealedHexes`),
  - režim **Odhalit ↔ Zahalit** (reveal/fog),
  - **velikost štětce** `●`=0 (1 hex) / `⬡`=1 (r=1, 7 hexů) / `⬢`=2 (r=2, 19 hexů),
  - **Reset mlhy** (`fog.set { enabled, revealedHexes: [] }`, `ConfirmDialog`).
  - Jen PJ. V `MapToolDock` jako dock `"🌫️ Mlha"` (dock pattern už počítá s mlhou).
- **`hooks/useFogTool.ts`** — state machine (`active: boolean`, `mode`, `brushSize`)
  + LS persist `ikr-map-fog-*` (vzor `useEffectTool`).

## Integrace (`TacticalMapView`)
- `useFogTool` přidán do `suppressLeftPan` podmínky: fog tool aktivní → left-drag
  maluje, nepanuje (middle + 2 prsty panují vždy). Sjednoceno s effect tool/placement.
- **Brush:** `onPointerMove` while left-button → `screenToHex` → `getHexesInRadius`
  → optimistic `fog.brush { mode, hexes }`. Dedup `lastDrawnHex` (stejný hex ignoruj).
  Reveal = `$addToSet` (append), Fog = `$pullAll` (BE atomic, žádný full replace).
- **Priorita klik-na-hex větve:** fog tool řazen vedle effect tool (oba PJ kreslení);
  vzájemně se vylučují (aktivní jen jeden tool).
- WS auto-sync: hráč/ostatní PJ dostanou `fog.brush`/`fog.set` op → patcher přegeneruje
  `revealedHexes` → `FogLayer` RT se přerenderuje. Žádný nový gateway event (10.2i).

## Pozice palety vs. deník
Stejný mechanismus jako 10.2g: dock respektuje `--map-dock-width` (`calc`), při
otevřeném deníku se odsune doleva.

## Responsivita
`mobil-desktop` audit po implementaci. Paleta i brush musí fungovat dotykově
(touch-drag = brush při aktivním fog tool, pinch/2-prsty stále panují).

## Out of scope (defer)
- Soft-light záře kolem PC tokenů (§23.3 „volitelně").
- Line-of-sight / auto-reveal podle dohledu tokenu (není v roadmapě).
- Cloud-noise turbulence textura (Matrix `feTurbulence`) — MVP jen plochá barva +
  blur okraje; turbulence zvážit jako skin-specific rozšíření později.

## Akceptační kritéria
1. PJ zapne mlhu → celá mapa zašedne (poloprůsvitně pro PJ), hráč vidí opaque.
2. PJ štětcem odhalí oblast → díra s měkkými okraji, hráč ji vidí; zahalením zmizí.
3. PC token je vždy viditelný a odhaluje hex kolem sebe (PJ i hráč).
4. NPC token v zamlžené oblasti je pro hráče skrytý, pro PJ viditelný.
5. `fogEnabled=false` → žádná mlha, žádný perf náklad.
6. Reset mlhy vyčistí `revealedHexes`.
7. Hráč nemůže emitovat fog op (BE 403) — ověřeno (gate existuje).
8. WS: změna mlhy u PJ se promítne hráči bez reloadu.
9. Vitest: `useFogTool` (persist + state), `FogLayer` maska generace (efektivně
   odhalené = revealed ∪ PC), NPC visibility gate.
