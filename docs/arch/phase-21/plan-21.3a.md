# Implementační plán 21.3a — Tvorba podzemí (základ)

**Spec:** [spec-21.3-tvorba-podzemi.md](spec-21.3-tvorba-podzemi.md) · **Stav:** čeká na schválení

Pořadí: **Zátah 1 = BE** (malý) → **Zátah 2 = FE** (hlavní). Nemíchat v jedné dávce.

---

## Zátah 1 — BE (`backend/src/modules/dungeon-maps/`)

### 1.1 Model (`interfaces/dungeon-map.interface.ts`, `schemas/dungeon-map.schema.ts`)
- `DungeonMap.ownerId?: string` (+ `@Prop() ownerId?: string`, index `{worldId:1, ownerId:1}`).
  Legacy dokumenty bez `ownerId` = PJ-owned (edit jen PJ+).
- `DungeonCell.type` union + `'archway' | 'door-secret' | 'door-trapped' | 'portcullis'`.
- `DungeonDecoration.label?: string` (typ dekorace `'label'`).
- Cells/decorations jsou v Mongu Mixed → schema změna jen ownerId; zbytek interface.

### 1.2 DTO (`dto/create-dungeon-map.dto.ts`, `update-…`)
- Limity: `gridWidth/gridHeight` @Min(10) @Max(100), `cellSize` @Min(8) @Max(100),
  `name` @MaxLength(120), `cells` @ArrayMaxSize(100), `decorations` @ArrayMaxSize(500).
- `ownerId` do DTO NEpatří (server-enforced z requestera — vzor MapTemplate).

### 1.3 Service gating (`dungeon-maps.service.ts`)
- Ponechat `assertCanManage` (PJ+) pro `exportTemplate`/`exportScene`.
- Nové `assertCanCreate`: membership Hrac+ ∧ (PJ+ ∨ `isEffectiveSupporter(role, isSupporter)`).
  `isSupporter` načíst přes `IUsersRepository` (vzor `worlds.service.ts` limit světů);
  helper `users/supporter.util.ts` už existuje.
- Nové `assertCanEdit(dungeon)`: owner ∨ PJ+ ∨ worldAdminBypass.
- `create`: `assertCanCreate` + set `ownerId = requester.id`.
- `replace`/`delete`: `assertCanEdit` (owner navíc stále musí být member Hrac+).
- `findByWorld`: membership Hrac+; PJ+ → vše, jinak filtr `ownerId === requester.id`.
- `findById`: owner ∨ PJ+ (read detail cizího podzemí hráči nepatří).
- Chybové kódy (friendly-messaging): `NOT_SUPPORTER` („Tvorba podzemí je výhoda
  Podporovatelů…"), `NOT_DUNGEON_OWNER`, stávající `NOT_WORLD_PJ` pro exporty.

### 1.4 Testy (`dungeon-maps.service.spec.ts`)
- Matice: PJ (ne-supporter) smí vše ve světě · Hrac+supporter CRUD svoje, ne cizí ·
  Hrac bez supportera 403 NOT_SUPPORTER · non-member 403 · admin bypass ·
  legacy bez ownerId edituje jen PJ · findByWorld filtr.
- Spustit: `npm run typecheck && npm run lint:check && jest dungeon-maps --maxWorkers=2`.
- ⚠️ Po nasazení BE nutný restart (starý bundle by dropnul `ownerId`).

## Zátah 2 — FE (`src/features/world/dungeon-builder/`)

### 2.1 Typy + API + hooks
- `types.ts` — zrcadlo BE (`DungeonMap`, `DungeonCell`, `CellType`, `DungeonDecoration`).
- `api/dungeonMapsApi.ts` — `api.get('/dungeon-maps', { worldId })` (kontrakt rawParams),
  get/create/replace/delete.
- `hooks/useDungeonMaps.ts` — TanStack Query klíč `['dungeon-maps', worldId]` + mutations
  s invalidací.

### 2.2 Engine (čistý, bez Reactu, vitest)
- `engine/model.ts` — prázdná mapa, klonování, flood-fill (spojitost), bounds.
- `engine/generate.ts` — seedovaný PRNG (mulberry32); kroky: místnosti → bludiště
  (recursive backtracker, křivolakost = pravděpodobnost zatočení) → napojení dveřmi
  (spanning tree + extra spoje) → ořez slepých konců → distribuce typů dveří →
  číslování místností (`label` dekorace).
- Testy: determinismus (seed → identický výstup), spojitost všech podlah,
  rozsahy parametrů, výkon M < 1 s.

### 2.3 Render (canvas 2D)
- `render/drawDungeon.ts` — jediný renderer pro editor, náhledy i PNG:
  podlaha bílá + šedá mřížka, masiv černý, glyfy dveří (6 typů dle legendy),
  schody, voda/láva/jáma, dekorace, popisky (monospace čísla), volitelný
  pergamenový rám + legenda (PNG export, seznam náhledů bez rámu).
- `render/glyphs.ts` — vektorové path funkce (dveře + 14 dekorací).
- Barvy plátna fixní (je to „papír", exportuje se) — mimo lint:colors dluh
  → ALLOW komentář dle konvence.

### 2.4 Stránky + editor
- `DungeonListPage` (route `podzemi` index) — karty s canvas miniaturami,
  [Nové podzemí] (prázdné / z generátoru), mazání s confirm; supporter teaser
  pro Hrac bez entitlementu (`isEffectiveSupporter` + `currentUserAtom`,
  vzor SkinPickerPanel).
- `DungeonEditorPage` (route `podzemi/:id`) — fullscreen (vzor taktická mapa):
  horní lišta (zpět · název inline edit · Uložit · PNG · ⚙ rozměry) ·
  levá ToolPalette (výběr/pan · podlaha · guma · dveře submenu · schody ·
  terén · dekorace · popisek · undo/redo) · plátno zoom/pan (wheel + pinch,
  drag kreslení) · GeneratorPanel vysouvací zprava (mobil: fullscreen sheet) ·
  spodní legenda.
- Stav editoru: `useReducer` + undo/redo snapshoty (≤50) lokálně; [Uložit] =
  PUT celé mapy; beforeunload + blocker při neuložených změnách.
- PNG: plný render → `canvas.toBlob` → download `<název>.png`.

### 2.5 Routing + nav + úklid
- `router.tsx`: `{ path: 'podzemi', … }` + `{ path: 'podzemi/:id', … }`,
  `memberOnly(…, WorldRole.Hrac)`; **smazat** admin route `/admin/dungeon-builder`.
- Smazat stub `features/admin/pages/DungeonBuilderPage.tsx`.
- `worldNavConfig.ts`: `to: ${b}/podzemi`, odstranit `external: true`; hint update.
- `WorldLayout.module.css:191` — komentář/styl „externí odkaz" už nebude potřeba.

### 2.6 Ověření + dokumentace
- `npm run build` (tsc -b, ne --noEmit) + `vitest run` + `npm run audit:routes`.
- Skilly: `mobil-desktop` (po UI) → `funkce` (nová route + role matice +
  oprava návodu kap. 26) → `napoveda` (hráčský výtah, sekce Podporovatel) →
  `chybovy-denik` (✅ ŘEŠENÍ po dokončení).
- Roadmapa: odškrtnout 21.3a část, spec status → IMPLEMENTOVÁNO (21.3a).

## Mimo tento plán
21.3b export na TM scénu (+ zdi → `MapWall` LoS) — samostatný plán po dokončení a.
