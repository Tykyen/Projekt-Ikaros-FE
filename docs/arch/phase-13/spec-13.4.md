# Spec 13.4 — Mapy (obrázkový atlas světa)

**Status:** ✅ Schváleno + implementováno (2026-06-06)
**Rozsah:** FE + BE — nová sekce „Mapy" v menu Svět: atlas nahraných obrázkových map s per-mapa viditelností (PJ určí, kdo kterou mapu vidí).
**Autor:** PJ + Claude
**Datum:** 2026-06-06
**Souvisí:** [spec-10.1](../phase-10/spec-10.1.md) (Mapa vesmíru — vzor viditelnosti), [spec-7.1](../phase-7/spec-7.1.md) (Galerie + lightbox), bod 3 v `docs/pripominky.md`
**Vychází z:** uživatel chce „atlas map, jen vkládání obrázků, žádná tvorba mapy"; PJ určí kdo vidí.

---

## 1. Cíl

Nová položka **„Mapy"** v menu Svět (hned pod „Mapa vesmíru"). Otevře **atlas** = mřížku nahraných obrázkových map. Každá mapa = obrázek + název + popis. Hráč klikne → fullscreen prohlížeč (zoom). PJ mapy nahrává/spravuje a **u každé určí viditelnost**: veřejná (všichni členové) nebo jen vybraní hráči. Hráč vidí jen mapy, na které má přístup.

**Záměrně NE:** tvorba interaktivní mapy (uzly, piny, vrstvy). Jen statické obrázky.

---

## 2. Rozsah

### V scope

| Část | Stav |
|---|---|
| BE modul `world-maps` (per-svět doc s `maps[]`), CRUD + visibility filter | ✅ nový (vzor: `universe` modul) |
| Upload obrázku mapy | ✅ reuse `useUploadImage` (`POST /upload/content-image`) — žádná BE upload změna |
| FE stránka atlasu (mřížka karet + lightbox) | ✅ nová |
| FE PJ edit mód (přidat / upravit / smazat / viditelnost / pořadí) | ✅ nový |
| Nav položka „Mapy" + route `/svet/:slug/mapy` | ✅ |
| Per-mapa viditelnost: `isPublic` + `visibleToPlayerIds` | ✅ (vzor universe) |

### Mimo scope

- **Real-time sync** (live aktualizace atlasu mezi klienty) — MVP refetch při navigaci. (Universe má WS; tady defer, viz §11.)
- **Interaktivní mapy** (piny, vrstvy, kreslení) — záměrně ne.
- **Vnořené složky / kategorie map** — MVP plochý seznam (+ pořadí).
- **Viditelnost přes role / AKJ / skupiny** — MVP jen veřejná / vybraní hráči (jako universe). AKJ je overkill a nekonzistentní se sousední Mapou vesmíru.

---

## 3. Audit současného stavu (reuse)

- **`universe` modul** ([backend/src/modules/universe/](../../../Projekt-ikaros/backend/src/modules/universe/)) — **hlavní vzor**:
  - Schema: jeden doc per svět, pole prvků (`nodes[]`), každý s `isPublic` + `visibleToPlayerIds`.
  - `universe.service.ts`: `assertCanManage` (global Admin+ **nebo** world `>= PJ`), `applyVisibilityFilter` (`isPublic || visibleToPlayerIds.includes(userId)`), `update`, `updateNodeVisibility`.
  - `universe.controller.ts`: `GET /universe?worldId=` (filtr dle uživatele), `PUT` + `PATCH …/visibility` (PJ).
  - FE `UniverseMapView` — edit mód toggle (PJ) vs read-only.
- **`GalleryLightbox`** ([src/features/world/pages/PageViewer/components/GalleryLightbox.tsx](../../src/features/world/pages/PageViewer/components/GalleryLightbox.tsx)) — fullscreen prohlížeč; props `images: LightboxImage[] { src, alt, caption? }`, `index`, ESC/šipky. **Reuse 1:1.**
- **`HeroUploadCard`** ([src/features/world/pages/PageEditor/components/HeroUploadCard.tsx](../../src/features/world/pages/PageEditor/components/HeroUploadCard.tsx)) — upload obrázku (compact + `uploadCta`, viz bod 2). **Reuse.**
- **Nav** ([src/features/world/lib/worldNavConfig.ts](../../src/features/world/lib/worldNavConfig.ts)) — `buildWorldNav` skupina „Svět"; `HIDEABLE_NAV_ITEMS` pro skrývatelnost v Nastavení.
- **Výběr hráčů** — seznam členů z `useWorldMembers(worldId)` + checkboxy (vzor: picker hráčů v `AkjTabsPanel`).
- **Karta panel-styl** — `--surface-2`, `1px --frame-border`, radius 12, `--shadow-md`, hover lift (vzor `MemberCard`).
- **Bezpečnost universe** ([[project_universe_ws_signal]], [[project_ws_security_patterns]]): seznam `visibleToPlayerIds` se hráči **neposílá** (leak-safe) — hráč dostane jen mapy, které smí vidět, bez seznamu komu jsou viditelné.

---

## 4. Návrh řešení

### 4.0 Dotčené soubory

```
# BE — NOVÝ modul (vzor: universe)
backend/src/modules/world-maps/
├── schemas/world-maps.schema.ts          # doc { worldId, maps: WorldMapEntry[] }
├── interfaces/world-map.interface.ts      # WorldMapEntry + WorldMapsDoc
├── interfaces/world-maps-repository.interface.ts
├── repositories/world-maps.repository.ts  # findByWorld, addMap, updateMap, removeMap, reorder
├── dto/create-map.dto.ts                  # title, description, imageUrl, isPublic, visibleToPlayerIds
├── dto/update-map.dto.ts                  # partial + order
├── world-maps.controller.ts              # GET / POST / PATCH / DELETE / PATCH reorder
├── world-maps.service.ts                 # assertCanManage + applyVisibilityFilter (copy z universe)
├── world-maps.module.ts
└── world-maps.service.spec.ts            # jest

# FE — NOVÁ featura
src/features/world/maps/
├── WorldMapsPage.tsx                      # atlas: hlavička + edit toggle + mřížka + empty
├── WorldMapsPage.module.css
├── components/
│   ├── MapCard.tsx                        # náhled + název + popis + visibility chip + PJ akce
│   ├── MapCard.module.css
│   ├── MapEditorModal.tsx                 # upload + název + popis + viditelnost
│   ├── MapEditorModal.module.css
│   ├── MapVisibilityField.tsx            # radio veřejná/vybraní + checkbox seznam hráčů
│   └── *.module.css
├── api/
│   ├── useWorldMaps.ts                    # GET /world-maps?worldId=
│   └── useWorldMapMutations.ts           # create / update / delete / reorder (invalidace)
├── types.ts                               # WorldMapEntry (FE)
└── __tests__/

# FE — MODIFIKACE
src/app/router.tsx (nebo world router)     # route `mapy`
src/features/world/lib/worldNavConfig.ts   # nav „Mapy" + HIDEABLE_NAV_ITEMS
```

### 4.1 Datový model

```ts
// BE schema: jeden doc per svět (mirror universe)
WorldMapsDoc {
  worldId: string;            // index, unique
  maps: WorldMapEntry[];
}

WorldMapEntry {
  id: string;                 // uuid
  title: string;
  description: string;        // default ''
  imageUrl: string;           // CDN URL z useUploadImage
  order: number;              // pořadí v atlasu
  isPublic: boolean;          // default false
  visibleToPlayerIds: string[]; // userIds (ignoruje se když isPublic)
  createdAt: string;
  updatedAt: string;
}
```

FE typ `WorldMapEntry` zrcadlí BE. Hráčská odpověď **neobsahuje** `visibleToPlayerIds` (leak-safe; pole je `PJ-only`).

### 4.2 BE API (vzor universe)

| Metoda | Endpoint | Kdo | Co |
|---|---|---|---|
| GET | `/world-maps?worldId=` | člen světa | mapy s visibility filtrem (PJ+ = vše + `visibleToPlayerIds`; hráč = jen viditelné, bez `visibleToPlayerIds`) |
| POST | `/world-maps/:worldId/maps` | PJ+ | přidá mapu (worldId v path — `api.post` neumí query) |
| PATCH | `/world-maps/:worldId/maps/:mapId` | PJ+ | upraví název/popis/obrázek/viditelnost |
| DELETE | `/world-maps/:worldId/maps/:mapId` | PJ+ | smaže mapu |
| PATCH | `/world-maps/:worldId/reorder` | PJ+ | nové pořadí (`mapId[]`) |

- **`assertCanManage`** = copy z universe: global `Admin+` **nebo** world `>= PJ` → jinak 403 `NOT_WORLD_PJ`.
- **`applyVisibilityFilter`** = copy z universe: hráč vidí mapu když `isPublic || visibleToPlayerIds.includes(userId)`; navíc se z entry odstraní `visibleToPlayerIds`.
- 🔀 **Odchylka od universe:** granulární CRUD per mapa (POST/PATCH/DELETE), ne PUT-whole. Důvod: obrázkový atlas může mít hodně map, přidání jedné nemá posílat celé pole. Repo updatuje prvek v `maps[]` (jako universe `updateNodeVisibility`).

### 4.3 FE nav + route

- `buildWorldNav` → skupina „Svět", za „Mapa vesmíru": `{ id: 'mapy', label: 'Mapy', to: \`${b}/mapy\` }`.
- `HIDEABLE_NAV_ITEMS` → `{ id: 'mapy', label: 'Mapy', group: 'svet', hint: 'Atlas obrázkových map (per-mapa viditelnost).' }` (skrývatelné jako ostatní).
- Route `{ path: 'mapy', element: memberOnly(p(WorldMapsPage)) }`.

### 4.4 FE atlas stránka — `WorldMapsPage`

- Data: `useWorldMaps(worldId)`. `isPJ` z `WorldContext` → edit toggle (jako universe „Upravit"/„Hotovo").
- Mřížka `repeat(auto-fill, minmax(260px, 1fr))`, staggered fadeUp reveal.
- **Edit mód (PJ):** první dlaždice = „+ Přidat mapu" (dashed), karty dostanou akce (✏️ / 👁 / 🗑) + reorder ↑↓.
- **Empty:** PJ → „Atlas je prázdný. Přidej první mapu." Hráč → „Zatím tu nejsou žádné mapy pro tebe."

### 4.5 `MapCard`

- Náhled `aspect-ratio: 16/10` `object-fit: cover` + název (`--text-strong`) + popis (`line-clamp: 2`, `--text-muted`).
- Klik → lightbox.
- **Visibility chip (jen PJ):** 🌐 Veřejná (`--accent`) / 🔒 N hráčů (neutrální, tooltip komu). Hráč chip nevidí.
- Panel-styl + hover lift (vzor MemberCard), `prefers-reduced-motion`.

### 4.6 `MapEditorModal` (přidat / upravit)

- `HeroUploadCard` (compact, `uploadCta="Nahrát mapu"`).
- Pole: Název (povinné), Popis (textarea).
- **`MapVisibilityField`:** radio „Veřejná (všichni)" / „Jen vybraní hráči" → při „vybraní" checkbox seznam členů (`useWorldMembers`, jen `isWorldPlayer`? — viz §12 Q3).
- Uložit → `create`/`update` mutace → invalidace `['world-maps', worldId]`.

### 4.7 Lightbox

Reuse `GalleryLightbox`: `maps.map(m => ({ src: m.imageUrl, alt: m.title, caption: m.title }))`. Index = klik na kartu. Žádný nový kód.

### 4.8 Design

Dle frontend-design auditu 2026-06-06 (koncept „Atlas / kartografická vývěska"). Tokeny only (`lint:colors` ✓). Detail karty/chipu/empty stavů viz audit.

### 4.9 mobil-desktop + nápověda

`mobil-desktop` audit (mřížka 1/2/N, modal, lightbox). `napoveda` — nová položka „Mapy" do `WORLD_PAGES` (PagesSection) + role/viditelnost.

---

## 5. Bezpečnost

- BE visibility filter autoritativní — hráč nikdy nedostane mapu mimo svůj přístup ani seznam `visibleToPlayerIds` (leak-safe, [[project_universe_ws_signal]]).
- Write gate `assertCanManage` (PJ+ / global Admin) na všech mutacích.
- Upload přes existující `/upload/content-image` (auth).
- `worldId` povinný na všech endpointech; membership check ve filteru.

---

## 6. Out of scope

Viz §2 „Mimo scope": real-time, interaktivní mapy, kategorie, role/AKJ viditelnost.

---

## 7. Akceptační kritéria

1. Nav „Mapy" ve skupině Svět (pod Mapa vesmíru); skrývatelná v Nastavení; route `/svet/:slug/mapy`.
2. Hráč vidí mřížku jen těch map, na které má přístup (veřejná / je v `visibleToPlayerIds`); prázdný stav.
3. Klik na mapu → lightbox (ESC/šipky), reuse `GalleryLightbox`.
4. PJ edit mód: přidat (upload + název + popis + viditelnost), upravit, smazat, reorder.
5. Viditelnost: veřejná / vybraní hráči; chip na kartě jen pro PJ; `visibleToPlayerIds` se hráči neposílá.
6. BE modul `world-maps` (schema, CRUD, `assertCanManage`, `applyVisibilityFilter`); 403 pro ne-PJ na write.
7. Responsivní (mobil/tablet/desktop) — `mobil-desktop` audit.
8. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ (FE); BE `tsc` + `lint` + jest ✓.
9. FE testy (atlas render, visibility chip PJ-only, modal submit, lightbox) + BE testy (visibility filter, auth 403, CRUD).
10. `napoveda` aktualizace.

---

## 8. Test plán

**BE:** `applyVisibilityFilter` (public/selected/none), `assertCanManage` (PJ ok / hráč 403 / global Admin ok), CRUD lifecycle, `visibleToPlayerIds` strip pro hráče.
**FE:** `WorldMapsPage` (mřížka, empty PJ vs hráč), `MapCard` (chip jen PJ), `MapEditorModal` (validace název, submit volá create), `MapVisibilityField` (radio přepíná seznam), lightbox open.

---

## 9. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Velké obrázky map (výkon) | Střední | Nízký | CDN (Cloudinary) + `loading="lazy"` náhledy; lightbox plné rozlišení on-demand. |
| Visibility leak (seznam hráčů) | Nízká | Střední | BE strip `visibleToPlayerIds` pro ne-PJ; test. |
| Bez real-time → hráč nevidí novou mapu hned | Nízká | Nízký | Refetch při navigaci; real-time = future (§11). |

**Rollback:** revert commitu — aditivní (nový modul + nová nav položka + route).

---

## 10. Otázky k autorovi

1. **Write role:** mirror universe = jen **PJ** (+ global Admin). Má i **Pomocný PJ** smět spravovat mapy? (Pages editing umí PomocnyPJ+.) — *default: jen PJ, sjednoceno s Mapou vesmíru.*
2. **Reorder:** chceš ruční řazení (↑↓ / drag) hned v MVP, nebo stačí pořadí podle data přidání? — *default: jednoduché ↑↓ v edit módu.*
3. **Seznam hráčů ve výběru viditelnosti:** všichni členové, nebo jen „hráči" (`isWorldPlayer`)? — *default: všichni členové kromě žadatelů (komukoli můžeš mapu zpřístupnit).*
4. **Popis mapy** povinný, nebo volitelný? — *default: volitelný.*

**Rozhodnuto (2026-06-06): „ber defaulty".** 1) spravuje jen PJ (+ global Admin); 2) ruční řazení ↑↓ v edit módu; 3) výběr ze všech členů kromě žadatelů; 4) popis volitelný.

---

## 11. Implementace (2026-06-06)

- **BE modul** `backend/src/modules/world-maps/` (schema/interfaces/repo/dto/service/controller/module + registrace v `app.module`). Jest unit spec 9/9 ✓, tsc + lint ✓.
  - `canManage` bere v potaz **world roli** (PJ), ne jen globální — oprava oproti universe controlleru, kde GET počítá `isPjOrAdmin` jen z globální role (world PJ by jinak dostal filtrovaný atlas). [[project_universe_ws_signal]]
  - POST přes path `:worldId/maps` (FE `api.post` neumí query params); GET zůstává `?worldId=`.
- **FE** `src/features/world/maps/` (types, api hooky, `WorldMapsPage`, `MapCard`, `MapEditorModal`, `MapVisibilityField`) + nav „Mapy" + route `mapy`. Reuse `ImageLightbox`, `HeroUploadCard`. Vitest 4/4 ✓, build ✓, lint ✓, lint:colors bez nových nálezů.
- **Nápověda** PagesSection „Mapy" (status ok). `napoveda` ✓.
- Real-time sync neimplementován (MVP, viz §2 mimo scope).
```
