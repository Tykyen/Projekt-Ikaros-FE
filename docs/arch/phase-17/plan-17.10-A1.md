# Implementační plán — 17.10 fáze A1 (základ workspace)

**Stav:** schválen k realizaci (2026-07-06) · **Rozsah:** infrastruktura správce panelů, **beze změny grafiky**, nic se nerozbije. Plná minimalizace/Uklidit = A2, kostky-flyout fix = A3, statblok okno = A4, pravý klik = A5.
**Předloha:** `c:\tmp\17.10-takticka-mapa-plna.html`. **Spec:** `spec-17.10.md`.

## Rozhodnuté otevřené body
1. **Scope shellu v A1 = pilot 1 panel** (`DiceLogPanel`) — ověří, že obalení nemění layout; migrace ostatních = A2.
2. **Přejmenovat `--map-dock-width` → `--map-inset-right`** (jeden název, generalizace). Ponechat dočasný alias, ať se nic nerozbije za běhu.
3. **`<MapPanel>` shell dostane volitelnou akci `help`** (kontextové „?" — Orchestrace, Efekty; dnes v kódu chybí).

## Nový adresář
`src/features/world/tactical-map/workspace/` — veškerý nový kód A1.

---

## Krok 1 — Centralizace z-index (bez změny pořadí)
**Cíl:** nahradit roztroušené literály pojmenovanými tokeny, **beze změny vizuálního pořadí** (žádná reorganizace overlayů — to by mohlo rozbít; případný přechod na „čistou" škálu až po ověření).

- **Nový** `workspace/zLayers.ts` — TS konstanty (pro JS-nastavovaný zIndex floating karty):
  `ATMOSPHERE 2 · INITIATIVE 20 · BADGE 30 · OVERLAY_LOCKED 40 · OVERLAY_HIDDEN 50 · BANNER 50 · NOTEBOOK 60 · PANEL 90 · TOOL_PANEL 100 · FLYOUT 100 · TOKEN_BACKDROP 399 · TOKEN_PANEL 400 · MODAL 1000` (= dnešní hodnoty 1:1).
- **Nový** `workspace/zLayers.module.css` (nebo blok v `TacticalMapView.module.css`) — stejné hodnoty jako `--z-map-*` proměnné na `.viewport`.
- Přepsat literály `z-index: N` → `var(--z-map-*)` v: `TacticalMapView.module.css` (badge/weather/bottomLeftStack), `MapToolDock.module.css` (.stack), `DiceLogPanel`, `MapPjPanel` (.flyout), `InitiativeBar`, `TokenInfoPanel`, overlaye (Locked/Hidden/Placement/Notebook), modaly.
- **Ověření:** grep, že nezůstal žádný nový osamocený z-index; build.

## Krok 2 — Rezervace okrajů (řeší kolizi počasí #2)
- V `TacticalMapView.module.css`: zavést `--map-inset-right` (+ připravit `--map-inset-top`, `--map-inset-bottom-left`), default `0px`.
- `TokenInfoPanel.tsx:72-82` — místo `--map-dock-width` psát `--map-inset-right` (alias: nastavovat obě, dokud se `.stack` nepřepne).
- `.stack` (`MapToolDock.module.css:17`) číst `var(--map-inset-right, var(--map-dock-width, 0px))`.
- **`.weatherSlot`** (`TacticalMapView.module.css:44-55`) přidat `right: calc(12px + var(--map-inset-right, 0px))` → **strukturálně mizí kolize #2**.
- **Ověření:** dokovaná karta odsune i počasí; build.

## Krok 3 — `useMapWorkspace` (jotai registr)
- **Nový** `workspace/workspaceStore.ts` (vzor `shared/store/authStore.ts`, `themes/state.ts`):
  - `type PanelId = 'tools-effects'|'tools-fog'|'tools-view'|'tools-ambient'|'dice-log'|'pj'|'weather'|'token-card'`
  - `type PanelUiState = 'open'|'collapsed'|'minimized'|'floating'`
  - `type PanelState = { state: PanelUiState; order: number }`
  - `workspaceAtom = atomWithStorage<Record<PanelId,PanelState>>('ikr-map-workspace-v1', DEFAULTS)` — DEFAULTS = vše `collapsed`
  - write-only akce: `setPanelStateAtom`, `focusPanelAtom` (zvedne `order`), `minimizeAllAtom`, `restoreAllAtom`
  - hook `useMapWorkspace()` (obal `useAtom` + akce), `usePanelState(id)`
  - defensivní merge (chybějící klíč → default), verzovaný klíč `v1`
- **Ověření:** unit test (vitest) — default, set, focus zvedá order, minimizeAll/restoreAll; persistence A→B→A.

## Krok 4 — `<MapPanel>` shell + pilot
- **Nový** `workspace/MapPanel.tsx` + `MapPanel.module.css`:
  - props: `id: PanelId`, `title`, `icon`, `variant:'chrome'|'game'`, `actions?:{collapse?:boolean; close?:()=>void; dock?:()=>void; help?:()=>void}`, `children`
  - hlavička (titul + úchyty: `?` help · `—` collapse · `✕` close · `📌` dock) čte/píše `workspaceAtom`
  - obsah = `children`; **layout-transparentní** (nemění padding/pozici obsahu)
- **Napojení reálných panelů (vč. `DiceLogPanel`) → přesunuto do A2.** Důvod: obalení produkčního panelu je citlivé a nelze ho ověřit runtime bez appky (browser v této session zakázán). A1 dodá shell + jednotkové testy; A2 migruje panely na shell tam, kde je uživatel ověří v appce panel po panelu.
- **Ověření:** jednotkové testy shellu — render (titul/ikona/obsah), sbalit (—) skryje obsah, „?" jen s `onHelp` + volá callback, `onClose`/`onDock` podmíněné, `minimized` → nevykreslí nic.

---

## Pořadí realizace
1 (z-index) → 2 (insets, viditelný fix počasí) → 3 (store + test) → 4 (shell + pilot).

## Ověření celé A1
- `npm run build` (tsc -b) čistý; `npm run test` (vitest) zelené; nové unit testy pro `workspaceStore`.
- **Runtime (na uživateli, browser nespouštím):** appka vypadá jako dřív, jen (a) počasí nekoliduje s pravou lištou, (b) Hody běží přes nový shell beze změny.

## Rizika
- ⚠️ Přepis z-index → rozbité pořadí. **Mitigace:** 1:1 mapování hodnot, žádná reorganizace overlayů v A1.
- ⚠️ `--map-dock-width` alias — dokud čtou obojí, nastavovat obě proměnné.
- ⚠️ `atomWithStorage` drift proti starým `ikr-map-*`. **Mitigace:** `v1` klíč + defensivní merge; staré klíče migrovat postupně (A2).
- ⚠️ Shell posune layout pilota. **Mitigace:** shell transparentní, pilot 1 panel, vizuální diff.

## Návaznost
A2 migruje ostatní panely na shell + `<MapDock>` spodní lišta + „Uklidit" (nástroje jednotlivě, kostky výjimka) + minimalizace. A3 kostky-flyout portál+clamp. A4 statblok okno (bez dragu, 📌↔🪟). A5 pravý klik.
