# Spec 16.5 — Interaktivní mapa s vlaječkami (piny na stránky)

**Status:** 🟡 Návrh k schválení
**Rozsah:** FE + BE — vrstva klikacích **pinů (vlaječek)** nad obrázkovými mapami atlasu (13.4). Pin → wiki stránka / jiná mapa / jen informace. Propojení mapy s taktickou scénou (1:1). Poslání mapy do chatu jako klikací karta.
**Autor:** PJ + Claude
**Datum:** 2026-07-04
**Grafický návrh (schváleno):** [proto-16.5-mapa-piny.html](proto-16.5-mapa-piny.html) (frontend-design, klikací mockup)
**Souvisí:** [spec-13.4](../phase-13/spec-13.4.md) (atlas — základ), taktická mapa 10.2 (per-player scene assignment, `currentSceneId`), chat 4.3b (`ChatAttachment`), 17.12 (živá příběhová mapa — staví na tomto), 7.2n `LinkPickerPopover` / `PagePicker`.
**Vychází z:** uživatel chce piny na obrázku mapy, klik → stránka lokace; „překlikávat v rámci mapy" (mapa→mapa); propojení s taktickou mapou; poslat do chatu.

---

## 1. Cíl

Nad libovolnou obrázkovou mapou atlasu jde připíchnout **vlaječky (piny)**. PJ je tvoří klikáním do obrázku, hráč na ně klikne a je odveden na **stránku lokace**, **hlouběji na jinou mapu**, nebo se mu jen **zobrazí informace**. Mapa jde **propojit s jednou taktickou scénou** (obousměrný skok) a **poslat do chatu** jako klikací karta.

Atlas zůstává **přípravna**: PJ mapu založí, naklikaná vlaječky a propojí se scénou předem; hráč s přístupem si ji pak projde a proklikává.

---

## 2. Rozsah

Stavíme **naráz** (uživatel: „udělej to vše najednou"), logicky členěno:

| Sub | Část | Stav |
|---|---|---|
| **16.5a** | Datový model pinů (`WorldMapEntry.pins[]`) + BE granulární CRUD pinů | 🟡 nový |
| **16.5a** | `InteractiveMapViewer` — obrázek + vrstva pinů + zoom/pan + tooltip/čtecí bublina | 🟡 nový |
| **16.5a** | Editor pinu (klik = nový, klik na pin = úprava, tažení = přesun, smazání) | 🟡 nový |
| **16.5a** | Vzhled pinu: **~30 ikon** (kategorie, scroll/filtr) + 6 barev (tokeny); role v rohovém odznáčku | 🟡 nový |
| **16.5a** | Cíl pinu: `page` (PagePicker) · `map` (select) · `none` (jen info) | 🟡 nový |
| **16.5a** | **Škála ~100 pinů/mapa:** panel „Vlaječky" (seznam + hledání + doskok) + **shlukování** při odzoomu | 🟡 nový |
| **16.5b** | Propojení mapy ↔ scéna 1:1 (`WorldMapEntry.linkedSceneId`) | 🟡 nový |
| **16.5b** | Pilulka „Příběhová mapa" v doku taktické mapy (jen když aktivní+přístupná) | 🟡 nový |
| **16.5b** | Skok viewer → taktická scéna (reciproční) | 🟡 nový |
| **16.5c** | Poslání mapy do chatu = nová příloha `mapRef` + karta + výběr konverzace + zpráva | 🟡 nový |

### Mimo scope

- **Živý ukazatel „tady jste v příběhu"** (auto-highlight aktivní lokace) → samostatná **17.12**.
- **Kreslení tvarů / vrstvy / měření** nad mapou (to je taktická mapa).
- **Více scén na jednu mapu** — záměrně 1:1 (potvrzeno uživatelem).
- **Pin → přímo konkrétní scéna** — cíl pinu je `page`/`map`/`none`; skok na taktickou řeší `linkedSceneId` mapy, ne pin.
- **Real-time sync pinů mezi klienty** — MVP refetch/invalidace; WS až později.

---

## 3. Audit současného stavu (reuse)

- **`world-maps` modul** (BE, 13.4/13.4b) — refaktor na 1 doc/mapa (`worldMapEntries`, `WorldMapEntrySchemaClass`), granulární CRUD per mapa (`POST/PATCH/DELETE :worldId/maps/:mapId`), `applyVisibilityFilter`, `assertCanManage` (world PJ lookup, ne jen globální role). **Rozšíříme** o `pins[]` + `linkedSceneId` + pin CRUD. Field-drift checklist: [[project_be_field_checklist]] (schema → dto → service → mapper).
- **`WorldMapEntry`** (FE `src/features/world/maps/types.ts`) — rozšíříme o `pins[]`, `linkedSceneId`.
- **`PagePicker`** ([src/features/world/components/PagePicker/PagePicker.tsx](../../src/features/world/components/PagePicker/PagePicker.tsx)) — autocomplete nad `usePagesDirectory`, chip + clear. **Reuse 1:1** pro cíl `page`. Nevyrábět 4. kopii ([[project_link_picker_shared]]).
- **`usePagesDirectory(worldId)`** — zdroj stránek pro picker (cache 5 min).
- **`MapEditorModal`** — přidáme pole „Propojená scéna" (select scén světa).
- **`ImageLightbox`** — nahradí `InteractiveMapViewer` u otevření mapy (viewer umí i piny/zoom/pan). Lightbox zůstane pro čistě obrázkové kontexty (galerie stránek).
- **`useAnchoredPosition`** (`shared/ui/LinkPicker`) — kotvení tooltipu / čtecí bubliny / popoverů k pinu/tlačítku (fix „rozjetí" při zoomu — viz proto poznámka).
- **Chat** — `ChatAttachment` (`src/features/chat/lib/types.ts`), `MessageAttachments.tsx` (render), `ChatInput.tsx` (send flow). Přidáme typ přílohy `mapRef`.
- **Taktická mapa** — `TacticalMapView.tsx` `weatherSlot` dok (pravý horní roh) → přidáme `StoryMapPill`. `currentSceneId` (per-player scene assignment, [[project_takticka_mapa_assignment]]). Zdroj seznamu scén světa pro link picker (scény z tactical-map / storyboard).
- **Theme tokeny** — barvy pinů/vieweru z motivu (scoped `[data-theme]`, [[feedback_theme_isolation]]) → funguje pod 8 skiny světa.
- **`reset.css`** — select chevron override už globálně ([[project_global_form_reset]]).

---

## 4. Návrh řešení

### 4.0 Dotčené soubory

```
# BE — rozšíření world-maps
backend/src/modules/world-maps/
├── schemas/world-map-entry.schema.ts     # + pins[] (sub-schema), + linkedSceneId
├── interfaces/world-map.interface.ts      # + WorldMapPin, + linkedSceneId
├── dto/
│   ├── update-map.dto.ts                  # + linkedSceneId?
│   ├── create-pin.dto.ts                  # NOVÝ
│   └── update-pin.dto.ts                  # NOVÝ
├── repositories/world-maps.repository.ts  # + addPin/updatePin/removePin (array element ops)
├── world-maps.service.ts                  # + pin CRUD; strip pinů dle viditelnosti
└── world-maps.controller.ts               # + POST/PATCH/DELETE …/maps/:mapId/pins[/:pinId]

# FE — rozšíření maps featury
src/features/world/maps/
├── types.ts                               # + WorldMapPin, + linkedSceneId
├── viewer/
│   ├── InteractiveMapViewer.tsx           # NOVÝ — obrázek + PinLayer + zoom/pan + topbar
│   ├── PinLayer.tsx                        # NOVÝ — render pinů + shlukování + tooltip + čtecí bublina
│   ├── PinMarker.tsx                       # NOVÝ — vlaječka (ikona+barva+rohový odznáček)
│   ├── PinCluster.tsx                      # NOVÝ — bublinka s počtem (odzoom, ~100 pinů)
│   ├── PinListPanel.tsx                    # NOVÝ — seznam+hledání pinů, klik = doskok
│   ├── PinEditorPopover.tsx               # NOVÝ — nová/úprava: label, info, cíl, vzhled, tajná, smazat
│   ├── SendToChatPopover.tsx             # NOVÝ — vyhledávací picker konverzace + zpráva
│   ├── SceneLinkPopover.tsx              # NOVÝ — výběr propojené scény (1:1)
│   ├── lib/clusterPins.ts                 # NOVÝ — shlukování dle zoomu (prahová vzdálenost)
│   └── *.module.css
├── api/
│   ├── useWorldMapPins.ts                 # NOVÝ — create/update/delete pin mutace (invalidace)
│   └── useWorldMapMutations.ts            # + linkedSceneId v update
├── components/MapEditorModal.tsx          # + pole „Propojená scéna"
└── constants/pinAppearance.ts             # NOVÝ — ~30 ikon (kategorie) + 6 barevných tokenů

# FE — chat
src/features/chat/lib/types.ts             # + ChatAttachment kind 'mapRef'
src/features/chat/components/MessageAttachments.tsx  # + render MapRefCard
src/features/chat/components/MapRefCard.tsx # NOVÝ — klikací karta mapy → viewer modal
src/features/chat/components/ChatInput.tsx  # (příjem mapRef z „Poslat do chatu")

# FE — taktická mapa
src/features/world/tactical-map/components/StoryMapPill.tsx  # NOVÝ — zelená pilulka v doku
src/features/world/tactical-map/TacticalMapView.tsx          # zapojení StoryMapPill do weatherSlot
```

### 4.1 Datový model

```ts
WorldMapPin {
  id: string;                 // uuid
  x: number;                  // 0..1 (podíl šířky obrázku) — responzivní, přežije výměnu obrázku
  y: number;                  // 0..1 (podíl výšky)
  label: string;              // krátký popisek (tučně v bublině)
  info: string;               // volitelný krátký odstavec (default '')
  targetType: 'page' | 'map' | 'none';
  targetSlug: string | null;  // pro 'page' (slug stránky přes PagePicker)
  targetMapId: string | null; // pro 'map' (id jiné WorldMapEntry)
  icon: string;               // klíč z pinAppearance — ~30 tématických ikon v kategoriích (osídlení / příroda / nebezpečí+příběh / objekty)
  color: string;              // klíč barvy (cyan|magenta|violet|green|amber|red) → token
  isPublic: boolean;          // default = zdědí z mapy; false = tajný pin
  visibleToPlayerIds: string[]; // když !isPublic; leak-safe strip pro ne-oprávněné
}

// rozšíření WorldMapEntry (13.4)
WorldMapEntry {
  …stávající (id, title, description, imageUrl, order, isPublic, visibleToPlayerIds, folderId)…
  pins: WorldMapPin[];        // default []
  linkedSceneId: string | null; // 1:1 propojení s taktickou scénou; default null
}
```

- **Souřadnice 0..1** (ne px) → pin drží pozici na mobilu i desktopu a přežije výměnu obrázku mapy.
- **Vzhled ≠ cíl:** `icon`+`color` volí PJ (estetika/vlastní systém); `targetType` nese roli, v UI zobrazená malým **rohovým odznáčkem** (↗ page · ▣ map · i none). Barva je volná.
- **Tajný pin:** `isPublic:false` + `visibleToPlayerIds` — nezávislé na barvě/ikoně; leak-safe (viz §5).

### 4.2 BE API

Piny embedované v `WorldMapEntry`; granulární ops (žádný whole-array clobber — race-safe, [[project_race_condition_audit]]).

| Metoda | Endpoint | Kdo | Co |
|---|---|---|---|
| POST | `/world-maps/:worldId/maps/:mapId/pins` | PJ+ | přidá pin (`$push`) |
| PATCH | `/world-maps/:worldId/maps/:mapId/pins/:pinId` | PJ+ | upraví pin (label/info/cíl/vzhled/viditelnost/x,y) — `arrayFilters` |
| DELETE | `/world-maps/:worldId/maps/:mapId/pins/:pinId` | PJ+ | smaže pin (`$pull`) |
| PATCH | `/world-maps/:worldId/maps/:mapId` | PJ+ | + `linkedSceneId` (přes stávající UpdateMapDto) |
| GET | `/world-maps?worldId=` | člen | mapy **vč. pinů** s visibility filtrem (viz §5) |

- **Přesun pinu** (tažení) = PATCH `{x,y}`, debounce ~400 ms (uloží se poloha po dotažení, ne každý frame).
- **`linkedSceneId`**: reverse lookup „která mapa je propojená s touto scénou" řeší **FE filtr** nad již visibility-filtrovaným seznamem map (`maps.find(m => m.linkedSceneId === sceneId)`) → leak-safe, žádný nový endpoint.
- Write gate `assertCanManage` (PJ+ / global Admin) na všech pin mutacích.

### 4.3 InteractiveMapViewer (16.5a)

Otevření mapy z atlasu (`MapCard.onOpen`) → viewer v modálu/fullscreen (nahrazuje `ImageLightbox` pro mapy).

- **Vrstva:** obrázek mapy + `PinLayer` (absolutně, `left/top` = `x*100%`/`y*100%`).
- **Zoom/pan:** kolečko + tlačítka (+/−/reset), tažení = posun. Pin/tooltip kotveny `useAnchoredPosition` (fix rozjetí při zoomu).
- **Hover pin** → tooltip: ikona-barva chip + label + zkrácené `info` + hint dle `targetType`.
- **Klik pin:** `page` → router na `/svet/:slug/postava/:targetSlug` (Page=Character sjednoceny; [[project_pages_character_unification]]); `map` → otevře cílovou mapu ve vieweru; `none` → čtecí bublina (label + celé `info`).
- **Topbar:** název, „Poslat do chatu", (PJ) „Upravit", (PJ) „Propojit scénu"/„Scéna: …", (když `linkedSceneId` + přístup) „Taktická mapa".
- **Mrtvý cíl:** pin, jehož `targetMapId`/`targetSlug` už neexistuje (nebo nedostupný) → zešedne, neklikací, hláška „cíl už neexistuje" (nespadne).

### 4.4 PinEditorPopover (16.5a, PJ)

- **Nový pin:** edit mód ON → klik do obrázku → popover u kliknutí. Pole: **Popisek**, **Informace** (textarea), **Co pin dělá** (segment page/map/none), **cíl** (page → `PagePicker`; map → select map světa; none → skryto), **Vzhled** (scrollovatelná mřížka ~30 ikon v kategoriích + textový filtr, + 6 barev), **Tajná** (switch). Akce: Přidat / Zrušit.
- **Úprava:** klik na pin v edit módu → stejný popover předvyplněný, + tlačítko **Smazat**. Tažení pinu = přesun (bez otevření).
- Ukládá přes `useWorldMapPins` (create/update/delete) → invalidace `['world-maps', worldId]`.

### 4.4b Škála — počítat s ~100 piny na mapě (16.5a)

Velká mapa může mít i **~100 vlaječek**. Nutná opatření:

- **Rendering:** piny = lehké absolutní prvky; při odzoomu nemá překreslovat celý strom každý frame. Zvážit vykreslení mimo transformovaný canvas + přepočet pozic, aby 100 pinů neházelo layout thrashing.
- **Shlukování (clustering):** při nízkém zoomu se blízké piny sloučí do **bublinky s počtem** (klik = přiblíží/rozbalí). Prahová vzdálenost dle zoomu. Bez toho se 100 pinů u malého zoomu slije.
- **Panel „Vlaječky":** postranní/rozbalovací seznam všech pinů mapy (respektuje viditelnost) — **hledání podle popisku**, klik → doskočí a zvýrazní pin. Jediná cesta, jak najít konkrétní pin mezi 100.
- **Editor:** granulární pin ops (§4.2) → přidání/přesun jednoho pinu neposílá celé pole (kritické při 100).
- **Ikonový picker** při ~30 ikonách = scroll + textový filtr (ne jen mřížka).

### 4.5 Propojení s taktickou scénou (16.5b)

- **Kde PJ propojí (1:1):**
  (a) **Editor mapy** (`MapEditorModal`) — pole „Propojená scéna" (select scén světa; přípravna, i bez otevření vieweru; scéna nemusí existovat hned).
  (b) **Viewer** — tlačítko „Propojit scénu"/„Scéna: …" (PJ, viditelné vždy, ne jen v edit módu).
- **Uloží** `WorldMapEntry.linkedSceneId`.
- **Důsledek na taktické mapě:** `StoryMapPill` v `weatherSlot` doku se zobrazí **jen když** existuje mapa s `linkedSceneId === currentSceneId` **a** uživatel na ni má přístup (visibility-filtrovaný seznam) → svítí zeleně, klik otevře `InteractiveMapViewer` té mapy. Jinak se **vůbec nevykreslí** (žádné zašedlé místo).
- **Reciproční skok** viewer → taktická: tlačítko „Taktická mapa" (když `linkedSceneId` a uživatel má scénu přístupnou — per-player scene assignment).

### 4.6 Poslat do chatu (16.5c)

- **Nová příloha** `ChatAttachment` kind `'mapRef'`: `{ type:'mapRef', worldMapId, worldId, title, pinCount, thumbUrl }` (BE `ChatAttachment` schema + FE typ). Neukládá obrázky pinů — jen referenci; render se dopočítá z aktuální mapy (respektuje aktuální viditelnost).
- **Odeslání** (`SendToChatPopover` ve vieweru): **vyhledávací picker konverzace** (filtr nad uživatelovými `ChatChannel` napříč kanály — desítky chatů) + volitelná **zpráva** → pošle zprávu s přílohou `mapRef` do vybrané konverzace.
- **Render v chatu** (`MapRefCard`): náhled + název + počet pinů; klik → `InteractiveMapViewer` v modálu, piny fungují stejně. **Ne** živá mapa ve zprávě (výkon v dlouhém chatu).
- Náhled i otevření respektují viditelnost pinů příjemce (tajné se neukážou).

### 4.7 Vzhled / design

Dle schváleného [proto-16.5-mapa-piny.html](proto-16.5-mapa-piny.html): tvar = vlaječka (konzistentní), ikona+barva = volba PJ, role = rohový odznáček, tajná = přerušovaný okraj, mrtvý cíl = šedá. Proto ukazuje 12 ikon jako vzorek — ostrá sada bude **~30 v kategoriích** (scroll+filtr). Barvy z theme tokenů (funguje pod 8 skiny). `lint:colors` ✓ (žádné hardcoded barvy; ikony/paleta = data-ALLOW).

### 4.8 mobil-desktop + funkce + nápověda

- `mobil-desktop`: viewer (zoom/pan touch, pin tap, editor popover na malém displeji), pilulka na taktické, chat karta.
- `funkce`: docs/funkce — nová schopnost (interaktivní piny + propojení scény + chat příloha mapy).
- `napoveda`: sekce „Mapy" — jak proklikávat vlaječky, co znamená rohový odznáček; (PJ) jak tvořit piny + propojit scénu + poslat do chatu.

---

## 5. Bezpečnost (auth-leak-policy)

- **Piny v odpovědi filtrované jako mapa:** pin `isPublic || visibleToPlayerIds.includes(userId)`; ne-oprávněnému se pin **neposílá** a `visibleToPlayerIds` se stripuje (leak-safe, vzor 13.4 / [[project_universe_ws_signal]]).
- **Cíl pinu, na který uživatel nemá přístup:**
  - `map` → cílová mapa není ve visibility-filtrovaném seznamu → pin **neklikací (mrtvý cíl)**, žádný 403.
  - `page` → spoléhá na auth gate cílové stránky (přívětivý blok/404, [[project_friendly_messaging]], AKJ clearance) — piny se kvůli výkonu **nepredfiltrovávají** per-page ACL; klik vede na stránku, kde se řeší přístup. (Pin-level pre-filtr pro stránky = možné rozšíření.)
- **`linkedSceneId` reverse lookup** jen nad již filtrovaným seznamem map → hráč nikdy nezjistí existenci mapy, na kterou nemá přístup.
- **Write gate** `assertCanManage` (PJ+/global Admin) na všech pin/`linkedSceneId` mutacích → ne-PJ 403.
- **Chat `mapRef`:** příjemce vidí náhled/otevření jen v rozsahu své viditelnosti mapy a pinů (dopočítává se z živé mapy, ne z uloženého snapshotu).

---

## 6. Akceptační kritéria

1. Otevření mapy z atlasu → `InteractiveMapViewer` (zoom/pan, piny), ne statický lightbox.
2. Hover pin → popisek + zkrácené info + hint; klik: `page` → stránka, `map` → cílová mapa, `none` → čtecí bublina s celým info.
3. Rohový odznáček odlišuje roli (↗/▣/i); ikona+barva = volba PJ; tajná = přerušovaný okraj; hráč tajné piny nevidí.
4. PJ edit mód: klik do mapy = nový pin (popisek/info/cíl/vzhled/tajná); klik na pin = úprava + smazat; tažení = přesun (uloží se poloha).
5. Cíl `page` = `PagePicker` (autocomplete, žádná nová kopie); `map` = select; `none` = bez cíle.
6. Mrtvý cíl (smazaná/nedostupná mapa) = pin zešedne, neklikací, hláška; nespadne.
7. Propojení mapy se scénou (1:1) nastavitelné v editoru mapy i ve vieweru; uloží `linkedSceneId`.
8. `StoryMapPill` na taktické mapě se zobrazí **jen** když je mapa propojená s `currentSceneId` a přístupná; klik ji otevře; jinak není vidět.
9. „Poslat do chatu" = výběr konverzace (vyhledávání mezi mnoha) + volitelná zpráva → zpráva s přílohou `mapRef`; v chatu klikací karta → viewer.
10. BE: pin CRUD (`$push`/`arrayFilters`/`$pull`), `linkedSceneId` v update, visibility strip pinů; ne-PJ write 403.
11. Responsivní (`mobil-desktop`); `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ (FE); BE `tsc`+`lint`+jest ✓.
12. Testy FE (viewer render, pin klik dle typu, editor submit, tajný pin skryt hráči, chat karta) + BE (pin CRUD, visibility strip, auth 403, linkedSceneId).
13. `funkce` + `napoveda` aktualizace.

---

## 7. Test plán

**BE:** pin create/update/delete lifecycle; visibility strip pinů (public/selected/none) + `visibleToPlayerIds` strip; `assertCanManage` (PJ ok / hráč 403 / Admin ok); `linkedSceneId` set/clear; mrtvý `targetMapId` po smazání cílové mapy zůstane (žádná kaskáda).
**FE:** `InteractiveMapViewer` (render pinů, zoom/pan, tooltip); klik pin → navigace dle `targetType`; `none` → čtecí bublina; editor (nový/úprava/smazat/přesun, PagePicker pro page); tajný pin skryt v hráčském pohledu; `StoryMapPill` visibility (propojeno+přístup vs ne); `MapRefCard` render + otevření; SendToChat picker filtr.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Rozjetí tooltipu/pinu při zoomu | Střední | Nízký | `useAnchoredPosition`; souřadnice v canvas-space, ne stage-%. |
| Whole-array clobber pinů (2 PJ) | Nízká | Střední | Granulární pin ops (`$push`/`arrayFilters`/`$pull`), ne PATCH celého pole. |
| Leak cíle/mapy bez přístupu | Nízká | Střední | Reverse lookup jen nad filtrovaným seznamem; map-cíl bez přístupu = mrtvý; page-cíl = auth gate stránky. |
| `mapRef` snapshot vs živá mapa (viditelnost) | Nízká | Střední | Karta dopočítává z živé mapy dle příjemce, neukládá piny do zprávy. |
| Výkon ~100 pinů / velký obrázek | Střední | Nízký | Shlukování při odzoomu (§4.4b), lehké absolutní prvky, granulární ops; panel „Vlaječky" pro nalezení pinu; `loading=lazy` obrázek. |

**Rollback:** aditivní (pole `pins[]`/`linkedSceneId` na existující entitě + nové komponenty + nová příloha) → revert commitu; existující atlas map beze změny (`pins` default `[]`).

---

## 9. Otázky k autorovi

*(Zapracované z diskuze — potvrď „ber defaulty", nebo uprav.)*

1. **Chat karta** = karta otevírající viewer (ne živá mapa ve zprávě). — *default: karta.* ✅ odsouhlaseno.
2. **Propojení s taktickou** = 1:1 `linkedSceneId`, nastaví PJ v editoru mapy i ve vieweru; pilulka jen když aktivní+přístupná. — ✅ odsouhlaseno.
3. **Viditelnost pinu** = per-pin `isPublic`/`visibleToPlayerIds` (default zdědí z mapy). — ✅ odsouhlaseno.
4. **Cíl `page`** míří jen na **stránku světa** přes `PagePicker`, bez externí URL. — ✅ odsouhlaseno (2026-07-04).
5. **Reciproční skok viewer → taktická** pro hráče jen když má scénu přístupnou, jinak tlačítko skryté. — ✅ odsouhlaseno (2026-07-04).
6. **Ikonová sada + škála:** 12 nestačí → **~30 ikon v kategoriích** (scroll+filtr). Počítat s **~100 piny na velké mapě** → shlukování při odzoomu + panel „Vlaječky" (hledání/doskok) + granulární ops (§4.4b). — ✅ odsouhlaseno (2026-07-04).
