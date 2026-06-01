# Plán 10.1 — Universe mapa 3D

**Spec:** [spec-10.1.md](spec-10.1.md) ✅ odsouhlasena
**Větev:** `main` (commituje uživatel ručně)
**Rozsah:** celé 10.1 a–d v jednom zátahu

---

## Potvrzené integrační body (z rešerše)

| Co | Kde |
|---|---|
| API klient | `import { api } from '@/shared/api/client'` — `api.get/put/patch<T>(url, data)` |
| World context | `import { useWorldContext } from '@/features/world/context/WorldContext'` → `{ worldId, worldSlug, isPJ }` |
| Socket | `import { getSocket } from '@/features/chat/api/socket'` → `emit('room:join', 'world:'+worldId)`, `on('universe:updated')` |
| Pages picker | **reuse** `@/features/world/components/PagePicker` + `usePagesDirectory(worldId)` (entity má `slug`, `title`, `type` vč. `'Lokace'`) |
| Image upload | `import { useUploadImage } from '@/shared/api'` → `mutateAsync(file)` → `result.url` (plná Cloudinary URL, jde přímo do `TextureLoader`) |
| Full-bleed | žádná změna WorldLayout — vlastní `.viewport` `min-height: calc(100svh - var(--header-h,60px))` jako TacticalMapView |

**Endpointy BE:** `GET /universe?worldId=`, `PUT /universe?worldId=`, `PATCH /universe/:worldId/nodes/:nodeId/visibility`. WS `universe:updated` → room `world:{worldId}`.

---

## Kroky

### Krok 1 — Deps + types + API vrstva
- `package.json`: `react-force-graph-3d@^1`, `three@^0.171`, `three-spritetext@^1` (+ `@types/three` dev). `pnpm install`.
- `types.ts` — `UniverseNode/Link/Map` (dle spec §3.2, vč. `pageSlug?`, `hasRing?`).
- `api/universeApi.ts` — 3 funkce: `getUniverse(worldId)`, `putUniverse(worldId, {nodes,links})`, `patchNodeVisibility(worldId, nodeId, {isPublic, visibleToPlayerIds})`.
- `api/useUniverse.ts` — `useQuery(['universe', worldId])`, `enabled: !!worldId`.
- `api/useUpdateUniverse.ts` — `useMutation` PUT, `onSuccess` → `setQueryData(['universe',worldId])`.
- `api/useUpdateNodeVisibility.ts` — `useMutation` PATCH, optimistic + rollback.
- **Test:** `universeApi` URL/payload tvar (mock `api`).

### Krok 2 — nodeObjects.ts (per-typ THREE factory)
- Čistá funkce `buildNodeObject(node): THREE.Group` — switch dle `type` (tabulka spec §5): planet/star/blackhole/nebula/asteroid/moon + `hasRing` prsten + `SpriteText` label.
- `img` → `TextureLoader.load(node.img)` přímo (Cloudinary URL), `colorSpace = SRGBColorSpace`.
- Žádný hardcode jmen (Asgard/Svar pryč → `hasRing`).
- **Test:** typ → očekávaná geometrie (Dodecahedron pro asteroid, Sphere pro planet, přítomnost PointLight u star, Ring u blackhole/hasRing). THREE objekty jdou vytvořit v jsdom.

### Krok 3 — Draft hook + socket hook
- `hooks/useUniverseDraft.ts` — `useState<UniverseMap>` draft; operace: `addNode`, `updateNode`, `removeNode` (kaskádně `removeLink` napojené hrany), `addLink`, `removeLink`, `moveNode(id, x,y,z)`, `reset(server)`. Vrací `{draft, isDirty, ops…}`.
- `hooks/useUniverseSocket.ts` — join `world:{worldId}` room, `on('universe:updated')`. Param `suspended: boolean` (edit mód) → když true, event se neaplikuje do cache, jen nastaví `staleFromRemote=true` (badge). Reconnect re-join (vzor `useMapWeather`).
- **Test:** draft ops (delete node maže hrany, move update pozice); socket patcher (event → cache; suspended → ignore + flag).

### Krok 4 — UniverseGraph.tsx (ForceGraph3D wrapper)
- Props: `data`, `editMode`, `onNodeClick`, `onNodeRightClick`, `onNodeDrag`(edit), `fgRef`.
- `nodeThreeObject={buildNodeObject}`, `enableNodeDrag={editMode}`, `cooldownTime` + `warmupTicks`, `onEngineStop` → `zoomToFit` (jen poprvé, ne v edit módu).
- Force tuning z Matrix vzoru: `charge.strength(-150)`, `link.distance(isOrbit?10:45)`, ambient light v scéně.
- `prefers-reduced-motion` → kratší/0 tween, warmup 0.
- fly-to: `cameraPosition` na klik (helper `flyToNode`).
- **Test:** mock `react-force-graph-3d` (default export → div); ověř že dostane správné props (editMode→enableNodeDrag, data).

### Krok 5 — Panel: search + detail + visibility toggle
- `components/UniversePanel.tsx` — shell (desktop plovoucí vlevo / mobil bottom-sheet, CSS module). Obsah dle režimu:
  - **view:** search (datalist uzlů) → fly-to; „Zobrazit vše" (zoomToFit); detail vybraného uzlu (frakce, seznam spojení s proklikem, odkaz na wiki `/svet/:worldSlug/:pageSlug` když `pageSlug`); PJ: rychlé „👁 skrýt/odhalit" → PATCH.
  - **edit toggle:** jen `isPJ`.
- `components/VisibilityEditor.tsx` — `isPublic` checkbox + per-hráč seznam (členové světa). Reuse zdroj členů (world members hook — dohledat; fallback `getUsers` ekvivalent). Použito v NodeEditorForm i quick-toggle.
- **Test:** search vybere uzel; detail listuje napojené uzly; visibility toggle volá mutaci.

### Krok 6 — Editor uzlů/hran
- `components/NodeEditorForm.tsx` — jméno, typ (select 6 typů), barva, velikost, frakce, `hasRing`, obrázek (`useUploadImage` + náhled), **PagePicker** pro `pageSlug`, VisibilityEditor. Přidat / Uložit / Zrušit. Edit existujícího = předvyplnění.
- `components/LinkEditorForm.tsx` — source/target select + `isOrbit` checkbox + přidat. Smazání hrany ze seznamu.
- Operace jdou do draftu (Krok 3). „💾 Uložit mapu" = `useUpdateUniverse` PUT celého draftu.
- Pravý klik na uzel v edit módu = smazat (confirm).
- **Test:** NodeEditorForm submit volá `addNode`/`updateNode` se správným payloadem; PagePicker nastaví pageSlug.

### Krok 7 — UniverseMapView.tsx (orchestrátor) + zapojení
- Drží: `useUniverse` (server), `useUniverseDraft`, `editMode`, `selectedNodeId`, `fgRef`.
- View mód: data = server. Edit mód: data = draft; `useUniverseSocket(suspended: editMode)`.
- Layout: full-bleed `.viewport` + `<UniverseGraph>` + `<UniversePanel>`. Loading/empty stavy.
- `MapPage.tsx`: stub → `<UniverseMapView/>`.
- Badge „mapa byla mezitím změněna" když `staleFromRemote` během editu (Uložit přepíše / Zrušit resync).
- **Test:** smoke render (mock graph), edit toggle přepíná data source.

### Krok 8 — mobil-desktop + napoveda + úklid
- Skill `mobil-desktop` audit (panel bottom-sheet, touch targety, canvas full-bleed).
- Skill `napoveda` — nová stránka „Mapa vesmíru" (role/akce).
- `eslint --fix` (NE prettier — memory `feedback_fe_no_prettier`), `pnpm test` zelené, `tsc` bez nových chyb (memory `feedback_preexist_debt_owned` — pre-existující řeším taky).

---

## Pořadí a závislosti
1 → 2 → 3 → (4, 5, 6 paralelně možné) → 7 → 8. Kroky 1–3 jsou nutné nejdřív (data/logika), pak UI.

## Rizika
- **WebGL v testech:** `react-force-graph-3d` mockovat globálně (vitest), logika v čistých funkcích/hoocích.
- **Bundle:** `three` ~600 kB → lazy load (route už `lazy`). Ověřit že se nenahrává jinde.
- **Force layout bez pozic:** uzly bez `x/y/z` se rozmístí simulací; po prvním PUT se pozice uloží (stabilní layout napříč session).

## Nedořešené (rozhodnu při kódu, ne blokující)
- Zdroj seznamu členů světa pro VisibilityEditor (world members hook) — dohledám v Kroku 5.
- Přesné API `PagePicker` (props) — dohledám v Kroku 6.
