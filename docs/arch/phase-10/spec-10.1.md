# Spec 10.1 — Universe mapa 3D

**Status:** ⏳ DRAFT — čeká na souhlas
**Modul:** Universe mapa (`/svet/:worldSlug/mapa`)
**Velikost:** **L** (cca 15 nových souborů, 2 modifikované, 3 npm dependencies)
**Závisí na:** BE `universe` ✅ kompletní (GET/PUT/PATCH + WS), React 19, WorldLayout context, sdílený socket (`features/chat/api/socket`)

---

## 1. Účel

3D graf lokací světa. Nahrazuje stub [MapPage.tsx](../../../src/features/world/pages/MapPage.tsx) (`<WorldStubPage area="map" />`). Uzly = vesmírná tělesa (planeta/hvězda/mlhovina/asteroid/měsíc/černá díra), hrany = cesty mezi nimi. PJ edituje uzly/hrany + řídí viditelnost; hráč vidí jen povolené.

Vzor myšlenky = starý Matrix `UniverseMap.tsx` (ForceGraph3D + per-typ 3D tělesa + fly-to kamera + edit panel). Tento spec myšlenku **zachovává**, ale přepisuje na architekturu Ikaros FE (feature složka, TanStack Query, sdílený socket, CSS Modules) a čistí Matrix-specifické hacky.

## 2. Scope

### V scope (10.1 a–d, jeden zátah)

- **10.1a — 3D force graph:** `react-force-graph-3d` (`three` WebGL), per-typ render tělesa, force pauza po ustálení (`cooldownTime` + `onEngineStop` → `zoomToFit`).
- **10.1b — Viditelnost:** server-side filtr už dělá BE GET (hráč nedostane skryté uzly). FE: PJ visibility editor — v edit módu `isPublic` + `visibleToPlayerIds` jako součást full PUT; mimo edit rychlé toggle z detail panelu přes **PATCH** (atomic per-node).
- **10.1c — Detail lokace:** klik na uzel → kamera fly-to + detail panel (frakce, spojení, odkaz na wiki stránku). Editor uzlů/hran (PJ): přidat/upravit/smazat uzel, přidat/smazat hranu, drag pozice → PUT.
- **10.1d — Real-time:** join `world:{worldId}` room, listen `universe:updated` → patch query cache. Edit mód má přednost (cizí eventy se během draftu bufferují, ne přepisují rozdělanou práci). `mobil-desktop` audit.

### Mimo scope

- Změna BE (`universe` modul je hotový, žádná migrace — nová pole `pageSlug?`/`hasRing?` jedou přes volné `MixedArray` schema).
- Universe ↔ taktická scéna binding (roadmapa: „scéna může být vázaná na lokaci" — řeší 10.2/10.3, ne zde).
- Animace orbit pohybu těles (statické rozmístění).

## 3. Klíčová architektonická rozhodnutí

### 3.1 Tech stack

| Volba | Verze | Důvod |
|---|---|---|
| `react-force-graph-3d` | `^1.x` | Roadmapa předepisuje; řeší force layout + kameru + raycasting zadarmo |
| `three` | `^0.171` (peer) | WebGL renderer, custom `nodeThreeObject` per typ |
| `three-spritetext` | `^1.x` | Textové popisky uzlů jako sprite (vždy čelem ke kameře) |

Lazy load: route `mapa` už je `lazy()` → bundle `three` se nahraje jen na téhle stránce. 🔀 *Alternativa čistý R3F zamítnuta — víc práce, odchylka od roadmapy.*

### 3.2 Datový model (FE zrcadlo BE + 2 nová volná pole)

```ts
type UniverseNodeType = 'planet'|'star'|'nebula'|'asteroid'|'moon'|'blackhole';

interface UniverseNode {
  id: string; name: string; type?: UniverseNodeType;
  color: string; size: number;
  img?: string; alliance?: string;
  x?: number; y?: number; z?: number;       // force layout pozice (PUT je persistuje)
  isPublic: boolean; visibleToPlayerIds: string[];
  pageSlug?: string;                         // NOVÉ — explicitní ref na wiki stránku (10.1c)
  hasRing?: boolean;                         // NOVÉ — nahrazuje hardcode "Asgard"/"Svar" prsteny
}
interface UniverseLink { source: string; target: string; isOrbit: boolean; }
interface UniverseMap { id: string; worldId: string; nodes: UniverseNode[]; links: UniverseLink[]; }
```

⚠️ **Odchylka od starého Matrixu (záměrná):** starý kód hádal wiki slug z názvu (`name.toLowerCase()`) a navigoval na globální `/page/:slug`. Ikaros má Pages **per-world** → uzel nese explicitní `pageSlug`, odkaz míří na `/svet/:worldSlug/:pageSlug` (PageViewer catch-all). V editoru picker existujících stránek světa (ne volný text).

### 3.3 Edit model

- **PJ „Editační režim":** lokální **draft** mapy (`useState`/immer), všechny operace (add/edit/delete uzel+hrana, drag pozice, visibility pole) mutují draft → **„Uložit" = full `PUT /universe`**.
- **Mimo edit, detail panel (PJ):** rychlé toggle viditelnosti uzlu → **`PATCH .../visibility`** (atomic, nepřepíše souběžné změny).
- Důvod dual-cesty: full PUT pro strukturální editaci (uzly/hrany/pozice), PATCH pro častou izolovanou akci „skrýt/odhalit".

### 3.4 Real-time reconcile

- `useUniverseSocket`: `room:join world:{worldId}` + `on('universe:updated')` → `queryClient.setQueryData`.
- **Edit mód = draft má přednost:** během editace se příchozí `universe:updated` ignoruje (jinak by cizí PJ přepsal rozdělanou práci); po Uložit/Zrušit resync z cache. Badge „mapa byla mezitím změněna" když dorazí event během draftu.

## 4. Soubory

```
src/features/world/universe/
  types.ts                         # typy výše
  api/universeApi.ts               # GET/PUT/PATCH low-level (axios klient)
  api/useUniverse.ts               # TanStack Query GET (key ['universe', worldId])
  api/useUpdateUniverse.ts         # PUT full replace mutation
  api/useUpdateNodeVisibility.ts   # PATCH per-node visibility mutation
  hooks/useUniverseSocket.ts       # world room join + universe:updated patcher
  hooks/useUniverseDraft.ts        # draft state + operace (add/edit/del uzel/hrana, drag)
  nodeObjects.ts                   # čisté factory: typ → THREE.Group (testovatelné)
  UniverseMapView.tsx              # orchestrátor (graf + panel, drží draft)
  components/UniverseGraph.tsx     # ForceGraph3D wrapper (cooldown, fly-to, handlery)
  components/UniversePanel.tsx     # search + detail / edit toggle (responsive shell)
  components/NodeEditorForm.tsx    # přidat/upravit uzel (+ VisibilityEditor + PageSlug picker)
  components/LinkEditorForm.tsx    # přidat/smazat hranu
  components/VisibilityEditor.tsx  # isPublic + per-hráč checkboxy
  *.module.css                     # panel/shell styly (mobil bottom-sheet)
```

Modifikované: [MapPage.tsx](../../../src/features/world/pages/MapPage.tsx) (stub → `<UniverseMapView/>`), `package.json` (3 deps). Ověřit full-bleed pro `mapa` route ve `WorldLayout` (jako `takticka-mapa`).

## 5. nodeObjects.ts — per-typ render (port myšlenky)

| Typ | Geometrie | Materiál / extra |
|---|---|---|
| planet | Sphere(size) | Lambert, texture když `img` |
| star | Sphere | Basic + `PointLight` |
| blackhole | Sphere(black) | + akreční `RingGeometry` disk |
| nebula | Sphere | additive blending, opacity, core sphere |
| asteroid | Dodecahedron | random rotace |
| moon | Sphere(size·0.8) | Lambert |
| `hasRing` | — | + prsten (nahrazuje hardcode Asgard/Svar) |

Vždy `SpriteText(name)` nad tělesem. `img`: DB id (`/api/Drive/proxy?id=`) vs. statický soubor — řešit přes existující Ikaros image resolve (ne 1:1 Matrix path).

## 6. Oprávnění

| Akce | Kdo |
|---|---|
| Zobrazit mapu (filtrovanou) | každý člen světa |
| Editační režim / PUT | `isPJ` (PJ+ / Sa / Admin) |
| Toggle visibility (PATCH) | `isPJ` |

BE už gate vynucuje (`assertCanManage`); FE jen skrývá UI.

## 7. mobil-desktop

- Canvas full-bleed (WebGL pozadí `#000`/brand).
- Panel: desktop = plovoucí vlevo; mobil = sbalitelný bottom-sheet (touch targety ≥30 px).
- Force graph touch: rotace/zoom gesta řeší `react-force-graph-3d` nativně.
- `prefers-reduced-motion`: zkrátit/zrušit kamera tween a force warmup.

## 8. Testy (vitest, jsdom, explicit importy)

- `nodeObjects` — typ → správná geometrie/extra (THREE objekty jdou vytvořit v jsdom bez renderu).
- `useUniverseDraft` — add/edit/del uzel, delete uzlu kaskádně maže hrany, drag update pozice.
- visibility helper + `VisibilityEditor` logika.
- `useUniverseSocket` patcher — `universe:updated` → cache update; edit mód ignoruje event.
- `UniversePanel` — search vybere uzel, detail listuje spojení.
- `ForceGraph3D` se v testech **mockuje** (WebGL nejde v jsdom) — testuje se obalová logika, ne render.

## 9. Akceptační kritéria

1. Hráč vidí jen povolené uzly (BE filtr + FE nezobrazí skryté hrany).
2. PJ přidá/upraví/smaže uzel a hranu, přesune pozici, uloží → persistuje (PUT), ostatní klienti dostanou `universe:updated`.
3. PJ skryje/odhalí uzel z detail panelu → PATCH, hráč okamžitě (ne)vidí.
4. Klik na uzel → kamera fly-to + detail; odkaz na wiki stránku míří na `pageSlug` per-world.
5. Po ustálení se force simulace zastaví (CPU klesne), `zoomToFit`.
6. Funguje na mobilu i desktopu (`mobil-desktop` audit).
7. `napoveda` aktualizována (nová stránka Mapa vesmíru).

## 10. Otevřené body k potvrzení

- **A. Knihovna verze:** `react-force-graph-3d ^1` táhne `three` jako peer — nainstalovat `three` explicitně (kvůli `nodeThreeObject`). OK?
- **B. PageSlug picker zdroj:** použít existující Pages list hook světa (dohledám v impl. plánu) — picker jen wiki stránek typu lokace, nebo všech stránek? Default: všech (uživatel si vybere).
- **C. `img` resolve:** sjednotit s Ikaros image pipeline (ne Matrix `/planets/` path) — potvrdit v impl. plánu dle existujícího `UploadImage`/Drive resolveru.
