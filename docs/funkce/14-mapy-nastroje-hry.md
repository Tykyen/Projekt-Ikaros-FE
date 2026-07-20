# 14 — Mapy & nástroje hry

Hloubková, kódem ověřená inventura. Pokrývá tři různé „mapy", zvukovou databázi, deník PJ a tvorbu podzemí (21.3a).

> **Role:** Globální `Superadmin`/`Admin` (číselně 1/2, „≤ Admin" = bypass všeho). Světové (vzestupně) `Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ`. „PJ práva" v této kapitole = `>= PomocnyPJ` (asistent řídí mapu/zvuky stejně jako PJ), pokud není uvedeno jinak. `Admin`/`Sa` mají všude bypass.

> **Tři mapy — vyjasnění** (router `src/app/router.tsx:244-246`):
> | Route | FE komponenta | Co to je | BE modul |
> |---|---|---|---|
> | `/svet/:slug/mapa` | `MapPage` → `UniverseMapView` | **Vesmírná mapa** = 3D/force-graph uzlů a vazeb (planety, lokace), NE bojiště | `modules/universe` |
> | `/svet/:slug/mapy` | `WorldMapsPage` (`features/world/maps`) | **Obrázkový atlas** = galerie statických map ve složkách | `modules/world-maps` |
> | `/svet/:slug/takticka-mapa` | `TacticalMapPage` → `TacticalMapView` | **Taktická bojová mapa** = PixiJS plátno s tokeny, mlhou, bojem | `modules/maps` |
>
> Modul `modules/dungeon-maps` je **Tvorba podzemí** (od 21.3a per-world nástroj `/svet/:slug/podzemi` + od 21.3c osobní knihovna `/ikaros/podzemi`, viz §14.6) — tile-based editor+generátor; export jako scéna TM vč. zdí/dveří pro LoS (21.3b).

Všechny tři routy jsou `memberOnly` — vyžadují členství (Čtenář+). Nečlen je přesměrován.

---

## 14.1 — Obrázkový atlas „Mapy" (`/mapy`)

### Atlas map se složkami
- **Co to je:** Galerie obrázkových map světa ve vnořeném stromu složek (13.4/13.4b). Od **16.5 interaktivní**: nad mapou jdou klikací **vlaječky (piny)** na stránky / jiné mapy / info, mapa se dá **propojit s taktickou scénou** a **poslat do chatu** (viz „Interaktivní vlaječky" níže).
- **Kde:** FE `src/features/world/maps/WorldMapsPage.tsx`. BE `modules/world-maps`.
- **Kdo:**
  - Čtení: každý člen, ale s **leak-safe visibility filtrem** (viz níže). Od 22.4 (2026-07-15) navíc **anonym u vitrínového světa** (`GET /world-maps` + `folders` = `OptionalJwtAuthGuard`; anon → `assertShowcaseView` → hráčská cesta `userId=null`, tj. jen `isPublic` mapy + `stripForPlayer`; ostatní routy explicitně `JwtAuthGuard`) — viz kap. 09 „Veřejné nahlížení".
  - Správa (přidat/upravit/smazat mapu i složku, řadit, **vlaječky, propojení scény**): **PomocnyPJ+** světa (`canManage` = `>= WorldRole.PomocnyPJ`, D-NEW-INV-MAPS) nebo global Admin+. FE gate `isPJ` zobrazí edit UI. BE `WorldMapsService.assertCanManage`.
- **Co jde dělat (vše):**
  - PJ: vytvořit mapu (titulek, popis, `imageUrl`, viditelnost), upravit, smazat, přeřadit (`reorder`).
  - PJ: vytvořit/upravit/smazat/přeřadit složku; vnořovat (parentId), ochrana proti cyklu (`updateFolder` `world-maps.service.ts:238`).
  - Smazání složky **nemaže obsah** — mapy a podsložky se přesunou o úroveň výš (`removeFolder` → `reparentChildren`+`reparentMaps`, `:284`).
  - Navigace přes breadcrumb („Atlas" → složka → podsložka).
  - Hledání napříč celým atlasem (ploché, ignoruje strom; podle titulku + popisu).
  - Otevření mapy v **interaktivním vieweru** (`InteractiveMapViewer`, zoom/pan + vrstva pinů) — klik na kartu (nahradil statický lightbox).
- **Viditelnost (leak-safe):** Každá mapa i složka má `isPublic` + `visibleToPlayerIds`. Hráč vidí mapu, jen když je viditelná **a zároveň** je viditelná **celá cesta složek k rootu** (kaskáda, memoizovaná `visibleFolderIds` `world-maps.service.ts:68`). Hráčská odpověď má `visibleToPlayerIds` vyprázdněné (`:116`) — hráč nezjistí, komu je co viditelné. PJ/Admin dostane vše.
- **Zvláštnosti:** Orphan blob cleanup — při změně/smazání `imageUrl` se emituje `media.orphaned` (`:169`,`:186`, audit UM-03/UM-05).
- **Hranice / co NEumí:** Žádné kreslení tvarů / vrstvy / měření (to je taktická mapa). Nelze hromadný upload. Piny/atlas bez real-time sync (TanStack invalidace, ne WS). Živý ukazatel „tady jste v příběhu" = samostatná 17.12.
- **Stav:** ✅ hotové.
- **Kód:** FE `maps/WorldMapsPage.tsx`, `maps/types.ts`, `maps/api/*`, `maps/components/{MapCard,FolderCard,MapEditorModal,FolderEditorModal,MapVisibilityField}.tsx`. BE `world-maps/world-maps.controller.ts`, `world-maps.service.ts`.

### Interaktivní vlaječky, propojení scény, chat — 16.5

- **Co to je:** Vrstva klikacích **vlaječek (pinů)** nad obrázkem mapy. Každý pin má popisek, volitelný info-odstavec, **cíl** (`page` → stránka světa přes `PagePicker` · `map` → jiná mapa atlasu · `none` → jen informace) a **vzhled** (~30 ikon + 6 barev). Roli cíle nese rohový odznáček (↗/▣/i), ne barva.
- **CRUD (PomocnyPJ+, FE `isPJ`):** klik do mapy = nový pin, klik na pin = úprava + smazat, tažení = přesun. BE granulární pin ops (`POST/PATCH/DELETE /world-maps/:worldId/maps/:mapId/pins`, `$push`/`arrayFilters`/`$pull` — race-safe i při ~100 pinech).
- **Viditelnost pinu:** per pin `isPublic`/`visibleToPlayerIds` (default zdědí z mapy); **tajné piny** hráči nechodí (`stripForPlayer` ve `world-maps.service.ts`). Mrtvý cíl (smazaná/nedostupná mapa) = pin zešedne, neklikací (žádný 403).
- **Škála ~100 pinů:** shlukování při odzoomu (`clusterPins`) + panel „Vlaječky" (hledání + doskok na pin).
- **Propojení s taktickou scénou (1:1):** `WorldMapEntry.linkedSceneId`. Nastaví PJ v editoru mapy (pole „Propojená scéna") nebo ve vieweru („Propojit scénu"). Na taktické mapě té scény se objeví **zelená pilulka „Příběhová mapa"** (`StoryMapPill`) — **jen** když je propojení aktivní a přístupné; klik otevře mapu. Reciproční skok viewer → taktická.
- **Poslat do chatu:** tlačítko ve vieweru → výběr konverzace (hledání) + volitelná zpráva → zpráva s přílohou `mapRef` (`ChatMessage.mapRef`, odkaz ne obrázek). V chatu klikací karta `MapRefCard` → otevře viewer; respektuje viditelnost pinů příjemce.
- **Stav:** ✅ (16.5; BE pole `pins`/`linkedSceneId` ve whitelistu `world-maps.repository.ts:188-189` + pin CRUD `world-maps.controller.ts:129/144/160`, `mapRef` `chat-message.schema.ts:42`; nasazení ověř přes /api/health → version.sha)
- **Spec:** `docs/arch/phase-16/spec-16.5.md` + návrh `proto-16.5-mapa-piny.html`.
- **Kód:** FE `maps/viewer/{InteractiveMapViewer,PinLayer,PinMarker,PinEditorPopover,PinListPanel,SceneLinkPopover,SendToChatPopover}.tsx`, `maps/viewer/lib/clusterPins.ts`, `maps/constants/pinAppearance.ts`, `chat/components/MapRefCard.tsx`, `tactical-map/components/StoryMapPill.tsx`. BE `world-maps` (pin CRUD + `linkedSceneId`), `chat` (`mapRef`).

---

## 14.2 — Vesmírná mapa „Mapa" (`/mapa`)

### Universe — graf uzlů a vazeb
- **Co to je:** Interaktivní graf vesmíru světa (10.1) — uzly (planety, soustavy, lokace) + vazby mezi nimi, renderovaný jako force-directed graf (`UniverseGraph`, knihovna `react-force-graph`). Toto je „mapa" v menu světa; **není to bojová mapa**.
- **Kde:** FE `pages/MapPage.tsx` (1řádkový wrapper) → `features/world/universe/UniverseMapView.tsx`. BE `modules/universe`.
- **Kdo:** Čtení člen (s visibility filtrem uzlů). Editace `isPJ` (edit mód s draftem).
- **Co jde dělat:**
  - Prohlížet graf, vyhledávat uzel (`UniverseSearch`), kliknout → `flyToNode` (kamera) + detail (`UniverseDetail`).
  - PJ edit mód: snapshot serveru do draftu, přidat/upravit uzel (`NodeEditorForm`) a vazbu (`LinkEditorForm`), nastavit viditelnost uzlu (`updateNodeVisibility`), uložit (sanitizace kvůli mutaci force-graphem — jinak 413).
  - Real-time: `useUniverseSocket` → signál `universe:updated {worldId}` bez dat (leak-safe), klient refetchuje filtrovaný GET; v edit módu má draft přednost (`staleFromRemote` indikace).
- **Hranice / co NEumí:** Není to taktická vrstva — žádné tokeny, boj, mlha. Souřadnice uzlů řídí force layout, ne přesné umístění. Edit je draft-based (concurrent edit = poslední uložení vyhrává, jen indikace „stale").
- **Stav:** ✅ funkční (10.1).
- **Kód:** FE `universe/UniverseMapView.tsx`, `universe/components/*`, `universe/hooks/useUniverseSocket.ts`. BE `modules/universe/*`.

> **Nejistota:** Tato kapitola se soustředí na herní nástroje; Universe je tu zahrnuta jen kvůli vyjasnění tří map. Detail Universe patří spíš do samostatné kapitoly.

---

## 14.3 — Taktická bojová mapa (`/takticka-mapa`)

Nejkomplexnější funkce platformy. PixiJS v8 plátno (`@pixi/react`), real-time přes Socket.IO operation model, per-system layout.

### Architektura render (PIXI)
- **Co to je:** `<Application>` (PixiJS v8) s vrstvami v pevném z-orderu: `background → grid → effects → tokens → fog → scale → pings → ruler → drawings`. Wrapper div drží pointer/drag/drop/wheel handlery.
- **Zvláštnost PIXI:** `@pixi/react` v8 vyžaduje `extend({Container,Graphics,Sprite,Text})`. Init je **async** — `<Application>` se mountuje **až když jsou rozměry I scéna ready** (`width>0 && height>0 && scene`), jinak prázdné plátno bez chyby. Fullscreen vyžaduje imperativní `renderer.resize` + auto-fit.
- **Kód:** `TacticalMapView.tsx` (~1900 řádků), `hexUtils.ts`, `grid/`, `components/{HexGrid,MapBackground}.tsx`.

### Mřížka a viewport (typ mřížky — 15.2)
- **Typ mřížky per scéna:** `hex` (flat-top axial, default) / `square` (čtverec) / `none` (čtvercová geometrie bez kreslených čar). Volba v „Upravit scénu" (segmentový selektor). Souřadnice zůstávají integer `{q,r}` napříč typy — liší se jen geometrie převodu buňka↔pixel (`GridAdapter` strategy: `getGridAdapter(config.gridType)`; render/snap/fog/efekty/měření přes adapter). Legacy scény bez `gridType` = hex (BC, nula migrace). BE: `gridType` propluje volným `scene.config` bez schema změny.
- Pan/zoom (`useViewportPanZoom`, per-scéna persistence pozice v LS), zoom controls + fullscreen. `screenToHex`/`screenToMap` převody. Lem buněk jen kolem mapy (mapBounds z `MapBackground.onLoad`).
- Config: `{gridType, size, originX, originY, showGrid, unitsPerCell, unitLabel, showScale, allowPlayerDrawing, showHpPc/Npc/Bestie}`.
- **Kód:** `grid/{types,hexAdapter,squareAdapter,index}.ts`, `components/HexGrid.tsx`.

### Dotykové ovládání mapy (mobil — 17.4)
- **Co to je:** Plnohodnotné ovládání taktické mapy prstem na dotykovém displeji (parita s desktopem, jen adaptovaná gesta).
- **Kde:** `/takticka-mapa`, kdokoli s přístupem ke scéně (žádný role gate na gesta).
- **Co jde dělat:**
  - **1 prst na prázdnu = posun mapy** (dřív nešlo vůbec). Gate: nespustí se na tokenu (patří tažení) ani při aktivním PJ nástroji (kreslí prstem).
  - **2 prsty = zoom + posun zároveň** (pinch anchor v map-space pod aktuálním midpointem; dřív jen zoom o fixní bod). Po zvednutí jednoho prstu plynule pokračuje 1-prstový pan.
  - **1 prst tažení na tokenu = přesun tokenu** (beze změny; `useTokenDrag` si gesto „zabere" přes sdílený `isTokenDraggingRef`).
  - **Long-tap na tokenu (podržet ≥500 ms a pustit beze změny pozice) = otevře detail/akce tokenu** — velký terč pro palec místo maličkého „i" badge (jen `pointerType:'touch'`; vyhodnocení na puštění → nikdy nevystřelí uprostřed tažení).
  - Zoom `+/−`/fullscreen tlačítka na hrubém ukazateli min. **44×44** (`@media (pointer: coarse)`).
  - **Desktop bonus:** kolečko myši zoomuje i **bez Ctrl/Cmd** (mapa je full-bleed, uvnitř není co scrollovat; Ctrl/Cmd i trackpad-pinch fungují dál).
- **Hranice / co neumí:** bez setrvačného (inertia) panu, bez haptiky, bez rotace mapy, bez radiálního/kontextového menu na tokenu (long-tap otevře stejný panel jako „i"). Zjednodušený mobilní layout mapy = samostatný krok 17.11 (companion mód), ne 17.4. **Skutečný „pocit pod palcem" (přesnost pinche, setrvačnost) ověřuje tester na reálném zařízení** — headless nemá pravý touchscreen.
- **Zvláštnosti:** disambiguace token vs. pan přes **dvojitý gate** (na pointerdown i pointermove) — deterministické bez ohledu na pořadí PIXI federated vs. DOM eventů. `touch-action:none` na `.viewport` (nutné pro vlastní gesta). Unit testy pokrývají 1-prst pan, gate, pinch+pan anchor.
- **Stav:** ✅ (logika + testy ověřeny; živý dotykový průchod na telefonu čeká na testera).
- **Kód:** FE `hooks/useViewportPanZoom.ts` (pan/pinch/wheel), `hooks/useTokenDrag.ts` (`isDraggingRef`), `TacticalMapView.tsx` (sdílený ref + wiring), `components/tokens/TokenSprite.tsx` (`LONG_TAP_MS`), `components/MapZoomControls.module.css` (coarse terče), test `hooks/__tests__/useViewportPanZoom.test.tsx`. Bez BE zásahu.

### Měřítko a stupnice (15.3)
- **Co to je:** Stupnice po horním + levém okraji mapy (`MapScaleFrame`), značka = buňka, popisek po 5 buňkách v jednotkách scény (`unitsPerCell` × `unitLabel`, default 1 / „m"). **Viditelná všem** (z `config`). Toggle „Zobrazit stupnici" (`showScale`, default zap.).
- Rozteč značek z `adapter.toPixel(1,0)−toPixel(0,0)` → uniformní napříč typy mřížky (hex √3·size, square size).
- **Kód:** `components/MapScaleFrame.tsx`.

### Pravítko (sdílené měření — 15.3)
- **Co to je:** Měření vzdálenosti bod↔bod. **Hráč i PJ** (toggle „📏 Měření" v docku). Drag A→B → čára + popisek (vzdálenost v buňkách × `unitsPerCell`). **Výsledek vidí všichni** (collaborative range-check „dostřelím?").
- **Zvláštnost (WS):** ephemeral, NEukládá se (vzor pingu). FE `emitRuler(line\|null)` → BE `map:ruler` → broadcast `map:rulered` do scene-roomu (throttle ~16/s, `line=null` = konec měření). BE klíčuje cizí pravítka **authenticated `client.data.user.id`** (ne payload) proti spoofu. All-roles (žádný role gate, oproti spotlight = PJ-only).
- **Kód:** FE `components/{MapRulerLayer,MapMeasureControls}.tsx`, `hooks/{useMapSocket,useMapScene}.ts`. BE `maps.gateway.ts` (`handleRuler`).

### Tokeny (PC / NPC / Bestie)
- **Co to je:** Tři typy tokenů — hráčská postava (PC), NPC postava (Character `isNpc`), a Bestie (z bestiáře). Rozlišení 3-tier (memory `npc_vs_bestie`).
- **Spawn (PJ):** drag&drop z palety na plátno **NEBO** placement mode (klik v paletě → klik na hex). Spawn jde **přesně tam, kam míří kurzor** (`spawnTokenAt` `:732`); pokud je hex obsazený, spirálový BFS od cíleného hexu (`findFirstFreeHex`), NE do (0,0). Bestie = multi-spawn (5 banditů po sobě). Op `token.add`.
- **Pohyb:**
  - PJ kohokoli, hráč jen vlastní token (`useTokenPermissions` / BE `token.characterId === user.id`).
  - Dvě cesty: drag tokenu (`useTokenDrag`) nebo click-to-place (vybrat token → klik na prázdný hex = move). Op `token.move`, optimistic + rollback + toast.
  - **Dosah pohybu (dřív „A* pohyb"):** `movement` stat určuje jen **dosah** pohybu (range-check), `schemas/types.ts:59`. **Není to pathfinding přes překážky** — bariéry pohyb fyzicky neblokují, jen vizuál. Pathfinding = případné budoucí rozšíření 17.x (spec opraven, viz Nesrovnalosti 1).
- **Lock:** per-token `isLocked` (PJ toggle v panelu) → hráč tokenem nepohne, ani needituje HP (BE `operations-authorizer.ts:136`, N-29). Nezávislé na zámku scény.
- **Smazání:** PJ kohokoli, hráč vlastní; optimistic remove + rollback (C-24). „Odstranit z mapy" — postava v DB zůstává.
- **Obrázek:** PC/NPC z `characterData.imageUrl`; Bestie nemá characterData → dotahuje se z bestiar cache přes `templateId` (snapshot), fresh resolve každý render (`resolveTokenImage` `:719`).
- **Kód:** `components/tokens/{TokenLayer,TokenHpBar,TokenDiaryTab,TokenNotesTab}.tsx`, `hooks/{useTokenDrag,useTokenUpdate,useTokenPermissions}.ts`, `utils/buildSpawnToken.ts`.

### Token modal / panel (3 varianty × view módy)
- **Panel:** `TokenInfoPanel` — boční panel se 3 zobrazovacími módy: `dock` (ukotvený vpravo, resize), `drag` (volně přesouvatelný), `overlay` (vystředěný, force na mobilu). Otevírá se přes „i" badge tokenu (`openedTokenId`); nezávislé na výběru (`selectedTokenId`).
- **Obsah (3 varianty dle typu tokenu):** `TokenSystemSheet` přepíná layout dle `world.system` (per-system bojové panely: `CocCombatPanel`, `DndCombatPanel`, `Drd2CombatPanel`, `Drd16CombatPanel`, `DrdPlusCombatPanel`, `FateCombatPanel`, `GurpsCombatPanel`, `MatrixCombatPanel`, `PiCombatPanel`). Systém bez panelu spadne na plný `TokenDiaryTab`. Bestie má `BestiePanelView`. Deník/poznámky se **embedují** (reuse `TokenDiaryTab`/`TokenNotesTab`, ne kopie).
- **View módy přístupu:** PJ vidí/edituje vše; vlastník PC vidí/edituje svůj; ostatní limited. Akce v hlavičce (PJ): „V boji / Mimo boj" (jen NPC/bestie — PC jsou v boji vždy), „Zamknout/Odemknout", „Odstranit z mapy".
- **Body osudu** badge jen pro systém `matrix`.
- **Kód:** `components/token-panel/{TokenInfoPanel,TokenSystemSheet,BestiePanelView}.tsx`, `system-panels/*`.

### DrD+ bojový panel (`drdplus`, hody 2k6+)
- **Co to je:** Kompaktní bojová verze deníku DrD+ na taktické mapě (`DrdPlusCombatPanel`). Single source s plným deníkem — čte/zapisuje tentýž `customData` (prefix `drdp_`) přes `characterSlug` (debounced ~500 ms).
- **Kde:** token-panel na `/takticka-mapa`, jen když `world.system === 'drdplus'`.
- **Kdo:** PJ edituje vše; vlastník PC svůj; ostatní read (`canEdit` gate). Hody jen když panel dostane `onRoll` (mapa).
- **Co jde dělat:** klik na **hlavní vlastnost / odvozenou / dovednost / zbraň BČ·ÚČ·OČ / Kněz Síla aspektu·Neovlivnitelnost / iniciativu** = hod **`2d6+`** (otevřený hod DrD+) + příslušná veličina; **zbraň ZZ = `d6`** (1k6) + ZZ. Editace na mapě: políčka životů/únavy, **2 pole postihu** (zranění + únava), Čaroděj „Aktuální magenergie", Theurg náklonnosti, Kněz „Vliv u osob" velikost. Read-only okna „k nahlédnutí" (Modal, reuse deníkových komponent): dle povolání kouzla / obory / finty / zaměření / totem / zázračné schopnosti / formule / démoni / vazby.
- **Hranice / co neumí:** Velikost a Hmotnost se **nehází**. Mez zranění/únavy se na mapě needituje (jen v deníku). Povolání se na mapě **nevybírá** (bere se z `drdp_profession`, erb = jen identita). Žádné auto-zranění / auto-souboj; magenergie ruční. Okna se ukážou jen když data existují. Chat napojení drdplus bestie = zatím není (bestie na taktické mapě viz „DrD+ bestie na mapě" níže).
- **Zvláštnosti:** **Postih** (`drdp_zraneni_postih` + `drdp_unava_postih`) se **automaticky odečítá od modifieru každého hodu**. Iniciativa v deníku i na mapě = `2d6+` (`SheetInitiativeButton kind`). „Projevy čaroděje" přejmenovány na „Obory" (data `wiz_proj_*` beze změny). Engine `2d6+`/`d6` = FE (`rollEngine` `rollExploding2d6`), payload generický, bez BE.
- **Stav:** ✅ funguje (spec-16.2d-mapa-drdplus).
- **Kód:** FE `system-panels/DrdPlusCombatPanel.tsx`(+`.module.css`), registrace `combatPanels.ts:39`, `utils/rollFromSheet.ts:62`, deník `sheets/drdplus/*`. BE: žádné (customData).

### DrD+ bestie na mapě (`DrdPlusBestiePanel`, 16.2d Fáze 2)
- **Co to je:** Pergamen bojový panel pro **bestii** se systemId `drdplus` (vedle Matrix/drd16 bestie panelů; ostatní systémy generický `BestiePanelView`). Čte snapshot `token.systemStats` + `token.injury` + `token.abilities` + `token.notes` (nezávislá instance, neovlivní katalog).
- **Kde:** token-panel `/takticka-mapa`, bestie token + `world.system === 'drdplus'` (`TokenSystemSheet` větev).
- **Kdo:** hody i editace jen PJ (`canEdit`); jinak read.
- **Co jde dělat:** klik **BČ/ÚČ/OČ/vlastnost/tělo/smysl** = `2d6+` hod (map dice overlay + log, `rollerKind:'bestie'`), **ZZ** = `d6`; **postih** (`systemStats.postih`) se přičítá k modifieru; **BČ navíc zapíše `token.initiative`** (DrD+ iniciativa = z BČ, žádné tlačítko). **Mez zranění** = číselný režim 3 pásma (Bez postihu / Postih / Kóma) dopočet z `injury` vs `mez_zraneni`; stepper ±1/±5 mění `injury`; postih inline. **„✏ Upravit bestii"** → **in-place edit** (jméno, útoky +/−, mez, ochrana, vlastnosti, tělo, smysly, schopnosti +/−, poznámky = inputy), uloží `instanceName`+`systemStats`+`abilities`+`notes`.
- **Hranice / co neumí:** Výskyt/Velikost/Rozměry panel nezobrazuje ani needituje (jen katalog). Postih je **ruční** (ne auto-odvozený z pásma) — parita s `DrdPlusCombatPanel` postav. Výdrž `—` (neúnavná) se nehází. Edit ukládá jen klíče `drdplus:token` (sanitizace, BE `validateForPatch` STRICT).
- **Zvláštnosti:** HP/spawn schema-aware přes `combatBehavior:'damageable'` na `mez_zraneni` (`buildBestieToken`); erb = obrázek bestie (`token.characterData.imageUrl`), fallback iniciála. Vyřešilo dluh D-DRDPLUS-WOUND-LINEAR (3 pásma na mapě).
- **Stav:** ✅ funguje (spec-16.2d-bestie-drdplus §9).
- **Kód:** FE `system-panels/DrdPlusBestiePanel.tsx`(+`.module.css`), registrace `TokenSystemSheet.tsx`, schéma `schemas/drdplus/token.json`. BE: mirror `assets/schemas/drdplus-token.json` (export-schemas + restart).

### Příběhy Impéria bojový panel (`pi`, hody 4dF)
- **Co to je:** Kompaktní bojová verze deníku pi na taktické mapě (`PiCombatPanel`) — osekaný Matrix panel. Single source s plným deníkem (tentýž `customData` prefix `pi_` přes `characterSlug`, debounced ~500 ms).
- **Kde:** token-panel `/takticka-mapa` + světový chat (combat registr 1:1), jen když `world.system === 'pi'`.
- **Kdo:** PJ edituje vše; vlastník PC svůj; **cizí hráč vidí jen STATY readonly** (zbytek skrytý). Hody jen když panel dostane `onRoll`.
- **Co jde dělat:** STATY (Životy 0–5 + postih za zranění, Ochrana 0–1) vždy; pro `canEdit`: klik na **schopnost** = hod `4dF + stupeň`, **⚡ Iniciativa** = čistý `4dF` (PC, bez bonusů), **aspekty** Nabitý/Vybitý toggle.
- **Hranice / co neumí:** bez únavy / runy / přetlaků / magie (osekáno vs Matrix). **8 skinů** (per-skin barva/font + signature ornament na `.section`/`.title`; scifi = default). Bestie má vlastní dedikovaný HUD panel — viz „Příběhy Impéria bestie panel" níž.
- **Zvláštnosti:** Iniciativa PC = hod `4dF` bez modifieru (oproti Matrixu, kde je +⌊nabité aspekty/2⌋). Aspekty Nabitý/Vybitý zůstávají, ale iniciativu neovlivňují. HP bar tokenu = `pi_health` (max konstanta 5) přes `resolveCharacterHp` case `pi`. Engine 4dF = `onRoll({kind:'fate'})`, payload generický, bez BE.
- **Stav:** ✅ funguje.
- **Kód:** FE `system-panels/PiCombatPanel.tsx`(+`.module.css`), registrace `combatPanels.ts`, HP `utils/resolveCharacterHp.ts` (case `pi`), bestie schéma `schemas/pi/{bestie,token}.json` (+`bootstrap.ts`). BE: žádné (customData).

### Příběhy Impéria bestie panel (`pi`, mapa + chat)
- **Co to je:** Dedikovaný sci-fi HUD statblok pro **pi bestie** (`PiBestiePanel`) — derivát `MatrixBestiePanel`, sladěný s `PiCombatPanel`. Nahradil generický `BestiePanelView` (ten byl „přebarvený sdílený vzhled"). V chatu zrcadlo `PiChatBestiePanel`.
- **Kde:** token-panel `/takticka-mapa` (`TokenSystemSheet` bestie větev, `world.system === 'pi'`) + rail světového chatu (`BestieRollPanel` katalog read-only · `BestieInstancePanel` instance v boji).
- **Kdo:** hody i editace jen PJ (`canEdit`); cizí hráč read.
- **Co jde dělat:** ZDRAVÍ (Životy track + „Zbroj pohlcuje" skrytá vrstva), BOJ (Max HP/Zbroj/Zranění/Pohyb/Iniciativa bonus, edit), SCHOPNOSTI (pips 1–10 + slovní stupeň + klik/🎲 = hod `4dF + stupeň`), ⚡ Iniciativa = `4dF + bonus`, Poznámky (autosave). **Chat = PLNÝ statblok 1:1 s mapou** (BOJ inline editace + zbroj pohlcuje + poznámky, ne osekaná karta) — liší se jen data-flow: edit/Iniciativa patchují combatanta (`onPatch`, debounce), hody přes `useChatDiaryRoll`.
- **Hranice / co neumí:** HP odvozené `clamp(maxHP+zbroj−zranění)` (jako Matrix). **8 skinů** (per-skin ornament na statbloku `.section`/`.title`; scifi = default). Schopnosti = nezávislá instance (snapshot, ne katalog).
- **Zvláštnosti:** Robustní coerce abilities (`name??label`, CH-040) proti cross-system crashi. Reuse: chat panel dědí mapový `PiBestiePanel.module.css` (HUD), edit modal je systemId-agnostický.
- **Stav:** ✅ funguje.
- **Kód:** FE mapa `system-panels/PiBestiePanel.tsx`(+`.module.css`), registrace `TokenSystemSheet.tsx`; chat `chat/components/rail/PiChatBestiePanel.tsx`, registrace `BestieRollPanel.tsx`/`BestieInstancePanel.tsx`. BE: žádné (token customData/systemStats).

### GURPS combat panel (`gurps`, mapa + chat) — PRVNÍ roll-under systém
- **Co to je:** Cold-steel bojový panel pro GURPS 4E PC/NPC (`GurpsCombatPanel`). Ořez deníku na boj: HP/FP ± + **auto stav** (Zmožen ≤⅓HP / Vyčerpán ≤⅓FP / Bezvědomí ≤0), útoky (zásah = **auto-match dovednosti dle jména zbraně**, škody), obrana (Úhyb/Kryt/Blok + DR pasivní), rychlé hody atributů (ST/DX/IQ/HT+Vůle/Vním), dovednosti, iniciativa; Detaily = celý `GurpsSheet` v `Modal`u.
- **Kde:** token-panel `/takticka-mapa` (`TokenSystemSheet`, `world.system==='gurps'`) + chat rail (přes `COMBAT_PANELS`).
- **Kdo:** PJ vše; vlastník PC svůj; cizí hráč jen **Stav readonly**. Hody jen s `onRoll`.
- **Zvláštnosti (roll-under engine):** GURPS je **1. roll-under systém** — hod = **3k6 „pod cíl"** (`kind:'3d6'`+`target`; `rollTarget` počítá úspěch/margin/krity dle 4E), iniciativa = `kind:'flat'` (= Základní rychlost, GURPS NEhází). Škody jsou roll-HIGH → `kind:'mixed'{d6:N}`+mod. Readout i dicelog mají větev roll-under (`payload.rollUnder`). Engine FE, bez BE. HP bar živě (optimistický sync `token.characterData.customData` do scény cache).
- **Hranice / co neumí:** bez plného systému manévrů (1 modifier stepper + preset „Útok naplno +4"). Modifikátor foldnut do cíle. **8 skinů** (`gurps-skins/*`).
- **Stav:** ✅ (deník render ověřen 8/8; živé ověření panelu na mapě/chatu čeká).
- **Kód:** FE `system-panels/GurpsCombatPanel.tsx`(+`.module.css`), registrace `combatPanels.ts`, engine `chat/dice/lib/rollEngine.ts`(`rollTarget`)+`utils/rollFromSheet.ts`+`chat/dice/lib/rollFromDiary.ts`+`dicePayload.ts`(`buildRollUnderPayload`/`buildFlatPayload`), deník `sheets/gurps/{GurpsSheet,formulas,constants}.tsx`. BE: žádné (customData free-form).

### GURPS bestie panel (`gurps`, mapa + chat)
- **Co to je:** Cold-steel statblok pro gurps bestii (`GurpsBestiePanel`); jádro `GurpsBestieCombatActions` sdílené mapa↔chat (`GurpsChatBestiePanel`). Meta (typ/SM/pohyb) / Atributy (klik = 3k6) / Útoky (zásah 3k6 + škody mixed) / Obrana (Úhyb/Kryt/Blok/DR + thr/sw) / Zvláštnosti+Taktika (okna), HP ± + iniciativa (flat).
- **Kde:** `TokenSystemSheet` bestie větev (`world.system==='gurps'`) + chat (`BestieRollPanel` katalog · `BestieInstancePanel` instance).
- **Zvláštnosti:** HP bar přes token schéma `combatBehavior:'damageable'` (`health.current`) — panel updatuje `systemStats['health.current']` I `token.currentHp` (bar živě, past bar↔panel jiné pole). `token.json` = **superset** bestie (BE strict `validateForPatch`). systemStats = ploché tečkové klíče (`attributes.st`).
- **Stav:** ✅ (schéma v2 + panely; živé ověření čeká).
- **Kód:** FE `system-panels/{GurpsBestiePanel,GurpsBestieCombatActions}.tsx`(+`.module.css`), chat `rail/GurpsChatBestiePanel.tsx`, schéma `schemas/gurps/{bestie,token}.json` v2. BE: mirror `assets/schemas/gurps-{bestie,token}.json` (export-schemas + restart, push `3656306`).

### HP (per-system, visibility toggle)
- **Co to je:** HP bar pod tokenem (PixiJS). Architektura per-typ: Bestie = snapshot ze `systemStats`; PC/NPC = z deníkového subdokumentu (`customData` per-system klíč) přes enrich (memory `token_hp_architecture`).
- HP bar render-only (`TokenHpBar`), resolve current/max + tier barva řeší volající; per-scéna visibility toggle.
- **PC/NPC coverage (`resolveCharacterHp`):** matrix/pi (konst. 5) · jad/dnd5e/coc/drdh/drd16 (deníkové klíče) · **gurps** (`gurps_hp`, fallback `gurps_hp_max ?? gurps_st`) · shadowrun (fyzický záznamník) · **fate/fae** (stres boxy = zbývající) · **drdplus** (mez zranění − rány). **Jediná výjimka bez baru = drd2** (`HP_BAR_DISABLED_SYSTEMS`, `TokenSprite.tsx:458`) — životy tam existují, ale bar se záměrně nekreslí.
- **Bestie coverage:** token schéma `combatBehavior:'damageable'` značí HP pole → `resolveHpWithFallback` (damageable field ze `systemStats` NEBO fallback `token.currentHp`). ⚠️ Past: bar musí číst STEJNÉ pole, které panel zapisuje (gurps bestie: `health.current` I `currentHp`).
- **Atomické delta HP bestie (D-LAUNCH-GAP, 2026-07-13):** damage/heal steppery bestie panelů posílají v `token.update` **relativní** `hpDelta`/`injuryDelta` místo absolutního `patch.currentHp` — server deltu aplikuje **atomicky** proti aktuální DB hodnotě (Mongo aggregation-pipeline update s clampem HP 0..maxHp, injury ≥ 0) → dva souběžné zásahy dvou PJ se **neztratí** (absolutní set = last-write-wins na stale klientské bázi). Nesmí se kombinovat s ne-prázdným `patch` (400); `@IsInt` bez implicit convert (string „5" → 400). 201 response vrací op s normalizovaným **absolutním** `patch.currentHp`/`patch.injury` (finální DB stav) — přepíše optimistický odhad; WS broadcast téže op ji potvrdí ostatním. **Jen bestie tokeny** (PC/NPC HP žije v deníku postavy). Undo delta op vrací starou absolutní hodnotu ze snapshotu (pod souběhem aproximace — PJ tooling, ne CRDT). Kód: FE `hooks/useTokenUpdate.ts`, BE `dto/operations/token-ops.dto.ts:64`, `repositories/maps.repository.ts:116` (`atomicUpdateAndFetch`), race test `backend/test/race/maps-token-hp.race.e2e-spec.ts`.
- **Realtime:** změna HP z panelu = optimistický patch scény cache (`applyOperationToScene` + invalidace) → bar se hne bez čekání na WS/refetch (řeší dřívější bug „životy se nezměnily").
- Hráč smí editovat jen `currentHp`, `injury`, `initiative` vlastního (a neodemčeného) tokenu (BE whitelist `operations-authorizer.ts:145`).
- **Kód:** `components/tokens/TokenSprite.tsx:458-477`, `utils/hpTier.ts` (`resolveHpWithFallback`), `utils/resolveCharacterHp.ts`.

### Fog of war (hybrid)
- **Co to je:** Mlha války. `fogEnabled` master přepínač (PJ). `revealedHexes` = odhalené hexy. Efektivně odhalené = `revealedHexes ∪ hexy PC tokenů` (`effectivelyRevealed`, hybrid — PC vždy vidí kolem sebe).
- **Ovládání (PJ):** paleta „🌫️ Mlha" — zapnout/vypnout, reveal/fog brush (velikost štětce), reset (zahalit vše). Op `fog.set` (BE `$set`), `fog.brush` (BE `$addToSet`/`$pullAll` `:692`).
- NPC token skrytý mlhou pro hráče (`isTokenHiddenByFog`). PJ vidí vše.
- **Kód:** `components/fog/{FogLayer,FogPalette,fogUtils}.tsx`, `hooks/useFogTool.ts`.

### Import hotových map — UVTT / .dd2vtt (17.2)
- **Co to je:** PJ naimportuje hotovou mapu ve formátu UVTT (Dungeondraft, DungeonFog) → vznikne **nová scéna** s pozadím, kalibrovanou mřížkou a uloženými **zdmi + světly**.
- **Kde:** taktická mapa → „⚙ Orchestrace" → „Aktivní scény" → tlačítko **„📥 Import UVTT"** (skrytý file input `.dd2vtt,.uvtt,.df2vtt,.json`).
- **Kdo:** FE gate `isPjStrict` (PJ 5+, stejně jako „+ Nová"). BE operace `scene.walls.replace`/`scene.lights.replace` PJ-only (authorizer `default` → `MAP_OP_FORBIDDEN`).
- **Co jde dělat:** vybrat soubor → `parseUvtt` (tolerantní k verzím 0.2–1.0) → base64 obrázek přes `useUploadImage` na Cloudinary → `POST /maps` (name z názvu souboru) → op `scene.config` (kalibrace: `gridType='square'`, `size=pixels_per_grid`, `backgroundScale=1`, geometrie `px = gridUnit×ppg`) → `scene.walls.replace` (z `line_of_sight`+`objects_line_of_sight` jako zdi, `portals` jako dveře) → `scene.lights.replace` → aktivace + self-assign.
- **Hranice / co neumí:** import = **vždy nová scéna** (ne přepis); UVTT nenese tokeny/postavy (jen prostředí); půlbuňkový posun originu k doladění proti reálnému renderu; verze UVTT ověřeny zatím jen orientačně (ne na reálných vzorcích); bez ručního kreslení/editace zdí (jen import + toggle dveří přes 17.1).
- **Zvláštnosti:** config jde přes op `scene.config` (obejde `CreateMapDto`/`HexConfigDto` whitelist, který zná jen size/originX/originY/showGrid); zdi/světla jsou „spící data" — opticky nic nedělají, dokud se nezapne `visionMode='dynamic'` (17.1). `scene.walls`/`scene.lights` musí být ve whitelistu `maps.repository.toEntity` (jinak GET vrací `[]`).
- **Stav:** ✅ kód kompletní (BE pole `walls`/`lights` `map-scene.schema.ts:46,52` + whitelist `maps.repository.ts:174-175`, ops `map-operations.service.ts:1132,1145`; FE `import/parseUvtt.ts`); reálný import `.dd2vtt` a kalibrace k ověření v živé appce.
- **Kód:** FE `import/{parseUvtt,useImportUvttScene}.ts`, `components/pj-panel/MapPjPanel.tsx`, `components/WallsLayer.tsx`. BE `schemas/map-scene.schema.ts`, `interfaces/map-scene.interface.ts`, `dto/operations/{scene-ops.dto,index}.ts`, `operations/map-operations.service.ts`, `repositories/maps.repository.ts`.

### Dynamické světlo & linie pohledu — LoS (17.1)
- **Co to je:** Automatická viditelnost — token „vidí" jen tam, kam dohlédne **přes zdi**; mlha se počítá sama z pozic PC tokenů + zdí (klient-side raycasting, angle-sweep visibility polygon). Nahrazuje ruční štětec fogu.
- **Kde:** „Upravit scénu" → sekce **„Viditelnost (LoS)"** → přepínač „Automatická viditelnost přes zdi" (+ „Temná scéna" + „Dosvit (buňky)").
- **Kdo:** PJ nastaví `config.visionMode`/`darkness`/`visionRange` (op `scene.config`, PJ-only). Výsledek (mlha) vidí hráči i PJ přes stávající `FogLayer` (PJ poloprůsvitně, hráč opaque).
- **Co jde dělat:** přepnout `manual`↔`dynamic`; zapnout temnou scénu → token vidí jen do dosvitu (`visionRange` buněk, default 4) nebo do dosahu světel; **PJ klikne na dveře** (úchyt na `WallsLayer`) → otevře/zavře → LoS se ihned přepočítá (op `scene.walls.replace`, optimistic).
- **Hranice / co neumí:** buňkové rozlišení (ne pixel-perfect stíny); LoS ze **všech PC tokenů** (ne per-hráč individuální vidění); přepočet na změnu pozice/zdí (memoizováno), ne živě během dragu; vyžaduje `fogEnabled`; žádná „explored" paměť (jen aktuální LoS); **runtime FPS na velké scéně neověřen** (klient-side); barevné míchání světel / darkvision typy mimo scope.
- **Zvláštnosti:** reuse `FogLayer` — LoS jen dodá `revealedSet` (derived) místo ručního štětce; otevřené dveře (`door.open`) `wallsToSegments` vynechá; `LightsLayer` glow (`blendMode='add'`) jen v `darkness`. Jádro `vision/raycast.ts` unit-testováno (za zeď nedohlédne, dveře propustí, temno ořízne).
- **Stav:** ✅ kód kompletní (`vision/raycast.ts` unit-testováno; perzistence `walls` z 17.2 v `map-scene.schema.ts:46`). Runtime FPS na velké scéně neověřen.
- **Kód:** FE `vision/raycast.ts`, `TacticalMapView.tsx` (`revealedSet` memo + `handleToggleDoor`), `components/{WallsLayer,LightsLayer}.tsx`, `components/pj-panel/EditSceneModal.tsx`. Bez BE zásahu (config je volný objekt).

### Efekty + šablony oblastí (15.3)
- PJ paleta „🎨 Efekty": barva hexu (`color`), exploze (kruhové prstence, varianty), bariéra (kruh / brush tah). Mazání souřadnicové (klik na hex smaže efekty, které ho pokrývají — deterministické, ne Pixi hit-test). „Smazat vše". Optimistic + rollback. Op `effect.add/update/remove`, `scene.effects.replace`.
- **Šablony oblastí (15.3):** nástroj „📐 Šablona" — `kužel / linie / koule / čtverec`. PJ klikne origin + táhne směr/dosah → **živý náhled**, pustí → uloží se jako stávající `color` effect (reuse, žádné nové úložiště). Buňky tvaru se počítají v **pixel-space** (`templateCells`) → uniformní pro hex/čtverec/none.
- Bariéra má `barrierDC` (info), pohyb **fyzicky neblokuje**.
- **Kód:** `components/effects/*`, `hooks/useEffectTool.ts`, `utils/templateGeometry.ts`.

### Kreslení / anotace (15.4)
- **Co to je:** Kresby na mapu — `čára / šipka / kruh / text`. Dock „✏️ Kreslení": výběr druhu + barva + viditelnost (`👁 Všichni` / `🔒 Jen PJ`) + „Smazat moje" / „Smazat vše" (PJ). Text = klik → prompt. Ostatní = drag origin→konec (živý náhled). Perzistované do `scene.drawings`.
- **Kdo:** PJ vždy; **hráč jen když scéna povolí** (`config.allowPlayerDrawing`, toggle v „Upravit scénu" i ve world defaults). Per-kresba `visibility`: `all` vidí všichni, `pj` jen PJ + autor. Mazání: autor vlastní + PJ kdokoli (klik na kresbu při aktivním nástroji).
- **BE (vzor effects):** `scene.drawings` (MixedArray) + op `drawing.add/remove/clear` (apply $push/$pull/$set + inverse). Authorizer: hráč `drawing.add` jen `allowPlayerDrawing` && vlastní (`createdByUserId === user.id`, server-enforced proti spoofu); `drawing.remove` vlastní; `drawing.clear` PJ-only. Real-time přes stávající `map:operation` (optimistic + WS + catch-up zdarma).
- **Kód:** FE `components/{MapDrawingLayer,MapDrawingControls}.tsx`, `hooks/useDrawingTool.ts`. BE `dto/operations/drawing-ops.dto.ts`, `map-operations.service.ts`, `operations-authorizer.service.ts`.

### Combat tracker + iniciativa (live sort)
- **Co to je:** Iniciativní lišta (horní full-width) + bojové kolo. Op `combat.start/turn/end/reorder`, `combat.effect.add/remove`.
- **Live sort:** lišta řadí **živě podle `initiative`** tokenů, NE podle uloženého `combat.order` snapshotu (memory `iniciativa_live_sort`; `combat.turn` bere `tokenId` z FE, BE ověří jen existenci na scéně `:988`). PC jsou v boji vždy; NPC/bestie přes „V boji/Mimo boj" toggle.
- Klik na bojovníka v liště = pan-to-token + select; PJ navíc spotlight (ephemeral ring, broadcast).
- `combat.round` override z FE, end-of-turn efekty per token.
- **Kód:** `components/initiative/{InitiativeBar,InitiativeControls,InitiativeInput}.tsx`, `hooks/useCombat.ts`, BE `map-operations.service.ts:933-1096`.

### Operation model + undo + real-time
- **Co to je:** Veškeré změny scény jdou přes `POST /maps/:id/operations` (op typovaný). Server: validace → load snapshot → autorizace → výpočet inverse → atomic Mongo update → alokace `seqNumber` (`$inc`) → append do logu → WS broadcast `map:operation`.
- **Undo (D-DROBNE-UNDO, 2026-07-13):** každá op počítá **inverse** ze snapshotu (`computeInverse`). Nový `POST /maps/:id/operations/undo` vrátí **poslední vlastní vratnou op** volajícího (`findLastUndoableByUser`) — inverse se aplikuje standardní apply pipeline (nový záznam + WS `map:operation` broadcast), pak `markUndone` originálu i undo záznamu (řetězení „undo undo" se nezacyklí). **Kdo:** jen PJ/PomocnyPJ (`assertCanUndo`, `operations-authorizer.service.ts:270` → 403 `MAP_OP_FORBIDDEN`); prázdný stack / nevratná op → 404 `NOTHING_TO_UNDO`. **FE:** tlačítko **„Zpět"** (`MapUndoButton`) v pravém dolním dock stacku — jen `isPJ` (`TacticalMapView.tsx:2340`), ve stream režimu skryté (UI chrome); `NOTHING_TO_UNDO` = nenápadný info toast „Není co vrátit"; po úspěchu invalidace scene+activeScenes queries (undo může vrátit i scene.activate/deactivate). Bez klávesové zkratky (záměr MVP). Bez inverse zůstávají: `dice.roll` (záměr), `combat.end` partial (jen order) a cascade `npcTemplate.remove`.
- **Catch-up:** `GET /maps/:id/operations?since=seq` (cap 1000). Po WS reconnectu forced catch-up (`onReconnect` `useMapScene.ts:192`); když gap moc velký → full refetch.
- **WS:** `MapsGateway` (`maps.gateway.ts`). JWT v handshake (`handleConnection`). Roomy: `map:join` (scéna, member-gated), `map:join-world`/`world-ops:{id}` (PJ orchestrátor, **PJ-only** room s pomlčkou aby tam neprosákl běžný člen), `user:{id}` (private `map:reassigned`). Eventy: `map:operation`, `world:operation`, `map:reassigned`, `map:ping`/`map:pinged`, `map:spotlight`, `map:ruler`/`map:rulered` (15.3 pravítko, ephemeral). Legacy relay handlery odstraněny (W-5). Op katalog vč. `drawing.add/remove/clear` (15.4).
- **Kód:** BE `maps/maps.controller.ts`, `operations/{map-operations,world-operations,operations-authorizer,operation-payload-validator}.service.ts`. FE `hooks/{useMapScene,useMapSocket}.ts`, `api/{mapApi,worldOpsApi}.ts`, `utils/{applyOperationToScene,catchUpScene}.ts`.

### Per-player scene assignment (currentSceneId)
- **Co to je:** Více scén může běžet paralelně. Každý hráč má `WorldMembership.currentSceneId` — vidí jen svou scénu (`GET /maps/active`). PJ orchestrátor přiřazuje hráče na scény.
- **Operace (cross-scene, PJ):** `member.assignToScene`, `member.unassign`, `member.bulkAssignToScene`. Při přesunu **cascade `token.remove`** z původní scény (token auto-mizí, memory `takticka_mapa_assignment`). Deaktivace scény cascade unassign všech přiřazených.
- Hráč smí jen self-`member.unassign` (graceful leave). Změnu dostane private `map:reassigned` → autoload nové scény (`useReassignmentListener`).
- **Read gate:** hráč GETne jen scénu s `currentSceneId === scene.id`, jinak 403 `MAP_FORBIDDEN_OTHER_SCENE` (anti-enumerace). PJ vidí vše, orchestrátor read `?isActive=true` je PomocnyPJ+ (R-11 — dřív anonymní dump).
- **Prázdná mapa (`MapEmptyState`):** hráč bez přiřazené scény vidí kromě hlášky i karty **„Tvé postavy v tomto světě"** (filtr `!isNpc && userId === currentUserId` nad `useCharacterDirectory`, read-only připomínka + link na `/moje-postava`). Sekce byla od 10.2c-edit-1 fakticky mrtvá (legacy BE directory nevracel `userId`) — **oživena 2026-07-13** přechodem adresáře na Pages directory (`ownerUserId`, D-DATA-SYNC-ZBYTKY a, viz kap. 12). PJ karty postav nemá (jiný workflow — „Vytvořit první scénu" / list „Připojit se ke scéně"); chybové varianty (`forbidden`/`error`) je potlačují. Kód: FE `components/MapEmptyState.tsx:70-76`.
- **Kód:** BE `operations/world-operations.service.ts`, `operations-authorizer.ts:242`. FE `components/pj-panel/{MapPjPanel,ActiveScenesList,AccessBoard}.tsx`, `hooks/{useActiveScenes,useReassignmentListener}.ts`.

### Nápověda mapových panelů (17.13)
- **Co to je:** Dedikovaná kontextová nápověda přímo v hlavičce mapových panelů (tlačítko „?"): (a) **Orchestrace** — slovníček (scéna / aktivní scéna / aktivní set / přiřazení / viditelnost), rychlý start (od prázdné mapy k boji), rozpad akcí; (b) **Efekty & kreslení** — efekty (barevná pole / bariéra-DC / výbuch / šablona / guma / koš) + kreslení (čára/šipka/kruh/text, barva, viditelnost, mazání).
- **Kde:** „?" v hlavičce panelu → `WorldHelpModal` (size `lg`). Orchestrace: `MapPjPanel` → `OrchestraceHelp`. Efekty: `MapToolDock` (dock `tools-effects`, opt-in prop `onHelp`) → `EfektyKresleniHelp`. Reuse in-situ vzoru z 13.6; patička odkazuje na plnou nápovědu.
- **Kdo:**
  - Orchestrace — jen PJ (panel PJ-only). Role-aware `canManageScenes` (= `isPjStrict`): PomocnyPJ vidí u tvorby scén „jen plný PJ" (zrcadlí BE `maps.assertCanManage` = `>= WorldRole.PJ`).
  - Efekty & kreslení — panel vidí PJ **i hráč** (když `canDraw = isPJ || scene.config.allowPlayerDrawing`). Nápověda role-aware `audience` (`pj`|`hrac`): hráč vidí jen sekci **Kreslení** (efekty jsou PJ-only, BE odmítne `effect.*` i `drawing.clear` hráči; hráč smí jen `drawing.add/remove` vlastní). Žádný server gate na nápovědu.
- **Hranice / co neumí:** Nezrcadlí se do cheat-sheetu iniciativní lišty (`TacticalMapHelp`). Obsah statický (ne generovaný z reálného stavu scény). Ostatní docky (Mlha, Zobrazení) „?" zatím nemají (opt-in vzor připraven).
- **Zvláštnosti:** „?" klik má `stopPropagation` → nepřepne sbalení panelu/docku. `MapToolDock` header přepsán z `<button>` na `<div role="button">` (+ keyboard toggle), aby šlo vnořit „?" (button-in-button nevalidní). Zrcadleno do `HelpPage → WorldSection`.
- **Stav:** ✅ funguje (build ✓, testy 5+3 ✓; čeká živý touch/vzhled test).
- **Kód:** FE `components/pj-panel/{OrchestraceHelp,MapPjPanel}.tsx`, `components/effects/EfektyKresleniHelp.tsx`, `components/MapToolDock.tsx`, `TacticalMapView.tsx`, `features/world/help/*`, `shared/ui/help/*`. Zrcadlo `features/ikaros/pages/HelpPage/sections/WorldSection.tsx`. Spec `docs/arch/phase-17/spec-17.13-napoveda-orchestrace.md`.

### Knihovna map (per-PJ, cross-world)
- **Co to je:** Šablony scén — znovupoužitelné mapy. **Per-PJ privátní** (`ownerId` server-enforced), **cross-world** (template nemá worldId, lze aplikovat v jiném světě). Full snapshot **kromě PC tokenů** (server-side `filterOutPcTokens` — jinak by leakl cizí `characterId`).
- PJ uloží aktuální scénu jako šablonu, načte šablonu na scénu (sekvence ops: image+config+fog+effects+npc...). Admin+ vidí všechny.
- **Kód:** FE `components/pj-panel/MapLibraryModal.tsx`. BE `maps/map-templates.controller.ts`, `repositories/map-templates.repository.ts`.

### Sdílení scén — veřejný katalog (22.5)
- **Co to je:** PJ **publikuje** šablonu ze své knihovny map do **veřejného katalogu** Společné tvorby (`/ikaros/sceny`); jiný PJ ji **naklonuje** jako novou scénu do svého světa. „Publikuj → katalog → naklonuj." Rozsah 22.5 = jen scény (bestie se sdílí přes Společnou tvorbu, celé světy blokuje odložený import 14.7).
- **Kde:** Publikace = tlačítko „Publikovat" na kartě šablony v `MapLibraryModal` (taktická mapa) → `PublishTemplateModal` (licence). Katalog = dlaždice „Scény" v hubu `/ikaros/tvorba` → route `/ikaros/sceny` (list) + `/ikaros/sceny/:id` (detail), **login-required**. Klon = „Naklonovat do světa" na detailu → `CloneToWorldModal` (výběr světa, kde jsem PJ).
- **Kdo:**
  - Publikovat/stáhnout: **vlastník** šablony (Admin+ bypass). BE `map-templates.controller` `POST :id/publish|unpublish` (owner check `elevation-exempt`).
  - Klonovat: **PJ+** cílového světa (BE `POST /maps` `assertCanManage` = `>= WorldRole.PJ`); FE modal filtruje světy `>= PJ`.
  - Schvalovat/zamítat: **kurátor** (`isBestieCurator` = Superadmin/Admin/SpravceClanku/SpravceDiskuzi) přes **Zpracovat tab** (fronta „Sdílené scény ke schválení", `PendingActionType.CommunitySceneTemplatePendingReview`). Katalog listuje jen `published ∧ approved ∧ ¬moderationHidden`.
- **Co jde dělat:** publikovat (licence: `clone`/`read`, uvedení autora, AI původ), stáhnout z katalogu (klony zůstávají), naklonovat do světa, nahlásit (`ReportButton targetType=scene_template`), kurátor schválit/zamítnout.
- **Hranice / leak-safe:** klon **nenese PC tokeny** (šablona je nemá) ani **svět-scoped zvuky** (`activeSoundIds` strippnuté při publikaci). Licence `cloneAllowed=false` (`read`) → klon 403 `TEMPLATE_CLONE_FORBIDDEN`. Cizí **nepublikovanou** šablonu nelze naklonovat (403 `TEMPLATE_NOT_SHARED`). Katalog vrací whitelist bez owner-privátních polí. **Poprvé napojena licenční karta 20D** (`content_licenses`): publish vytvoří kartu, unpublish → `withdrawn`.
- **Otevřené (drobnosti):** `CatalogEntry.cloneAllowed` se z BE nevrací → FE zašednutí „read-only" scén chybí, odchytí se až 403 při klonu. `targetAuthorId` v katalogu není → ReportButton se autorovi nepředskryje (BE self-report blokuje).
- **Stav:** ✅ (BE e2e 7/7 — `maps/scene-template-sharing.service.ts` + `scene-template-review.provider.ts`; FE build ✓ — `features/ikaros/sceny/`). Živé ověření neproběhlo.
- **Kód:** FE `features/ikaros/sceny/*` (KomunitniSceny/ScenaDetail Page + api + hooks + CloneToWorldModal + SceneTemplateReviewRenderer), `tactical-map/components/pj-panel/{PublishTemplateModal,MapLibraryModal}.tsx`, tile `SpolecnaTvorba/tiles.ts`, `shared/moderation/enums.ts`, `ZpracovatTab/rendererRegistry.tsx`. BE `maps/{scene-template-sharing.service,scene-template-moderation.listener,scene-template-review.provider}.ts`, `map-templates.controller.ts`, `maps.service.ts` (klon brána), `content-licenses` (napojení). Spec [arch/phase-22/spec-22.5](../arch/phase-22/spec-22.5-sdileni-klonovani-scen.md).

### Počasí na mapě
- **Co to je:** Vizuální atmosféra počasí (déšť/sníh...) jako DOM overlay nad plátnem + panel v rohu. PJ nastaví/vypne, hráč jen vidí + toggle FX lokálně.
- **Zvláštnost:** mapa dostává world-level event `weather:updated` přes **neutrální room** (`world:{id}` z `weather.updated` `OnEvent`, `maps.gateway.ts:238`), ne PJ-only room (memory `map_world_room_join`) — leak-safe.
- **Kód:** FE `components/weather/{MapWeatherPanel,MapWeatherAtmosphere}.tsx`, `hooks/useMapWeather.ts`. BE `world-weather` + gateway.

### Kostky na mapě
- 3D dice overlay (sdílí jádro s chatem), log hodů (cap 50, persist v `scene.diceRolls`). Op `dice.roll` — BE kontroluje spoofing (`byUserId === user.id`) a házení za cizí token (`operations-authorizer.ts:160`). Viditelnost hodů dle `world.diceVisibility` + `canSeeRoll`.
- **Roll typy (`rollEngine`):** fate `4dF` · generic `XdN` · `d6+`/`2d6+` (exploding) · `pool-dN` (SR6 úspěchy+glitch) · `mixed` · **`3d6` (GURPS roll-under: `rollTarget` = hod „pod cíl" + margin + krity dle 4E)** · **`flat`** (bez kostek — GURPS iniciativa = Základní rychlost). Readout (`DiceRollOverlay`) i dicelog (`DiceLogPanel`) mají větve pro pool/crit/**rollUnder**. GURPS = **1. roll-under systém** platformy.
- **Kód:** `components/dice/{DiceLogPanel,DiceRollButton}.tsx`, `hooks/useMapDiceRoll.ts`, `utils/diceVisibility.ts`, engine `chat/dice/lib/{rollEngine,dicePayload,diceNotation}.ts`.

### Ambient zvuky na mapě
- PJ vysílá playlist (op `sound.playlist` / `scene.sounds.set`) → hráči slyší (`SceneSoundPlayer`). Čerpá ze zvukové databáze (14.4).
- **Kód:** `components/sound/{AmbientSoundPanel,SceneSoundPlayer}.tsx`.

### Pingy a spotlight
- Double-tap kdekoli na ploše = ping (PJ i hráč), broadcast `map:ping`→`map:pinged`. Pointer-based (ne onDoubleClick — nespolehlivý na dotyku). Herní identita: PJ = „PJ", jinak jméno postavy (nikdy účet).
- Spotlight = PJ „ukazováček" z iniciativní lišty (ephemeral ring, auto-clear 3 s), PJ-only broadcast.
- **Kód:** `components/pings/PingsLayer.tsx`, `utils/doubleTap.ts`.

### Multi-system layout
- `world.system` (drd2 default) přepíná layout VŠEM: per-system bojové panely, deníkové sheety, schémata tokenů (`schemas/{coc,dnd5e,drd2,fate,generic,gurps,matrix}`). Změna systému přepne layout všem (memory `takticka_mapa_multi_system`). systemStats validovány proti per-system schématu (soft mode — chybí schema → skip).

### Skrytí / zámek scény
- `isHidden` (hráč vidí overlay „Scéna není připravena"), `isLocked` (hráč nemůže hýbat). Per-scéna default + **per-hráč override** (`playerStates`, op `scene.playerState`, 10.2n). PJ vidí scénu vždy. BE autoritativní (`effLocked` `:93`).

### Streamer overlay / stream režim (OBS — 17.9)
- **Co to je:** přepínatelný „stream režim" mapy — skryje veškeré UI chrome (docky nástrojů, badge spojení, počasí/deník sloty, spodní lišta minimalizovaných, PJ panel) a nechá jen čistý PIXI canvas s volitelným pozadím pro chroma key v OBS.
- **Kde:** dock „🖥️ Zobrazení" → sekce „🎥 Stream (OBS)" (`StreamModeControls`). Aktivní režim = fullscreen mapy.
- **Kdo:** PJ **i** hráč (skrývá jen vlastní UI chrome, nemění data ani oprávnění; žádný role gate; žádné BE).
- **Co jde dělat:**
  - Spustit „🎥 Spustit stream režim" → zapne režim + vstoupí do fullscreenu (`viewportRef.requestFullscreen`).
  - Volba pozadí: **chroma zelená** (`0x00b140`, default) / **chroma modrá** (`0x0047bb`) / **průhledné** (alpha 0). PIXI canvas i DOM pozadí viewportu se přepínají spolu.
  - Toggly „Nechat iniciativu" / „Nechat deník hodů" — co zůstane viditelné (default obojí skryté). Volba pozadí + toggly **persistované** v localStorage (`ikaros.map.streamBg`, `ikaros.map.streamKeep`).
  - Ukončit: **Esc**, rohové tlačítko „✕ Ukončit stream" (klidově opacity 0.15, na hover/fokus plné), nebo opuštění fullscreenu (F11/Esc → `fullscreenchange` vypne režim).
- **Hranice / co neumí:**
  - **Průhledné** pozadí funguje jen v OBS **Browser Source** (CEF umí alfa); v běžném **Window/Display Capture** je okno prohlížeče vždy neprůhledné → tam se používá chroma barva + Chroma Key filtr. Default = zelená právě proto.
  - Žádná **čistá read-only URL** pro Browser Source (mapa bez appky okolo) — skutečná alfa jen v rámci appky. Dluh.
  - Grid se ve stream režimu **neskrývá** (je v canvasu); zůstává jak je. Žádné presety layoutu.
  - `active` je runtime (neukládá se) — po reloadu je režim vždy vypnutý.
- **Zvláštnosti:** pozadí PIXI se řídí **imperativně** přes `app.renderer.background.color/.alpha` (prop `background` se po async initu nepřekresluje, stejně jako u resize). Chrome se skrývá jednotným markerem `data-map-chrome` + `.viewport[data-stream-mode]` CSS (rozptýlené panely obaleny `display:contents` wrapperem, aby marker nepokazil layout).
- **Stav:** ✅ funkční (build zelený); čeká živý vizuální test v OBS.
- **Kód:** FE `tactical-map/stream/streamMode.ts`, `components/StreamModeControls.tsx`, `TacticalMapView.tsx` (stream stav + bg effect + exit + `data-map-chrome`), `TacticalMapView.module.css` (`.chromeWrap`, `[data-stream-mode]`, `.streamExit`).

### Hranice taktické mapy / co NEumí
- **Žádný skutečný pathfinding** — bariéry/efekty pohyb fyzicky neblokují, `movement` je jen dosah (range-check). Pathfinding kolem překážek = případné budoucí rozšíření 17.x (spec `takticka-mapa-matrix.md` §23.5 opraven na realitu, 2026-07-12).
- **Sprite atlas** — token obrázky se resolvují jednotlivě (texture cache `useTokenTexture`), není zmíněn jeden bundled atlas; viz princip 10.2 vs. realita.
- Undo inverses doplněny (2026-07-12, D-NEW-INV-MAPS): `scene.deactivate` → `scene.activate` (member přiřazení vrací per-member inverses ve world ops logu), bulk assign → `member.bulkRestoreAssignments` (původní per-member přiřazení), `drawing.clear` → `scene.drawings.replace`. Stále PARTIAL: `combat.end` undo obnoví jen order (ne round/effects), `npcTemplate.remove` undo nevrací cascade-smazané tokeny, `dice.roll` je záměrně bez undo. **Undo endpoint + UI zapojeny 2026-07-13** (D-DROBNE-UNDO — `POST /maps/:id/operations/undo` + tlačítko „Zpět", viz „Operation model + undo" výše). Známá limitace: undo `scene.image` obnoví původní URL, jejíž blob už mohl uklidit orphan cleanup (PJ nahraje znovu).
- Combat `order` = persistovaný snapshot při startu boje; zobrazované pořadí řídí FE **živě** dle `initiative` (záměr 10.2f). `order` zůstává kvůli legacy fallbacku `combat.turn` bez tokenId, inverse pro `combat.end` a validaci `combat.reorder` — vztah zdokumentován v BE (`map-operations.service.ts`, case `combat.start`).
- Token→Character HP sync: **HP PC/NPC tokenu se od 2026-07-12 propisuje** z `token.update` (`currentHp`/`maxHp`) do `diary.customData` postavy (per-system klíče, zrcadlo `resolveCharacterHp`; BE `token-hp-diary-map.ts`). Bestie tokeny se záměrně NEsyncují (nezávislá instance). `systemStats`/`injury`/`initiative` v deníku domov nemají → nesyncují se; systémy s odvozeným „HP" (shadowrun/fate/fae/drdplus/drd2) se přeskakují.
- `seqNumber` může mít gap, když apply uspěje ale alokace selže (akceptováno).
- **Stav:** ✅ rozsáhle funkční (fáze 10.2a–n), s vědomými MVP limitacemi výše.

---

## 14.4 — Zvuková databáze „Zvuky" (`/zvuky`)

### Zvuky (YouTube-based ambient/SFX)
- **Co to je:** Databáze zvukových stop (13.3). Zvuky jsou **odkazy na YouTube** (`youtubeUrl`), ne nahrávané soubory. Bohatá metadata (typ média, prostředí, emoční tón, intenzita, loop, tech/magic level...). Slouží jako zdroj pro ambient na taktické mapě.
- **Kde:** FE `features/world/sounds/SoundsPage.tsx` (route přes `pages/SoundsPage.tsx` re-export). BE `modules/sounds`.
- **Kdo (ovládání):**
  - Náhled/přehrání: každý člen (lokální YT přehrávač, hlasitost dle user nastavení).
  - Create/edit/delete/nominate/import do světa: **PJ práva** (`>= PomocnyPJ`, FE `isPjInWorld`, BE `assertCanManageWorld` `sounds.service.ts:25`).
  - Schválit/zamítnout nominaci do globálu: **jen Admin+** (`assertIsAdmin`, tab „Nominace").
- **Co jde dělat:**
  - Taby „Svět" / „Globální" (+ „Nominace" pro Admin). Filtry (`SoundFiltersBar`).
  - Svět: CRUD vlastních zvuků světa.
  - Globální katalog: import schváleného globálního zvuku do svého světa (`importToWorld`).
  - Nominace: PJ navrhne svůj světový zvuk do globálu (`nominateToGlobal`, dedup kontrola); Admin schválí/zamítne (`approveNomination`/`rejectNomination`).
  - Globální zvuky přímo (`createGlobalSound`) — Admin.
- **Hranice / co NEumí:** Není upload audio souborů (jen YT odkazy). Náhled se nepřenáší na ostatní (lokální). Skutečné vysílání hráčům je až přes ambient panel taktické mapy (14.3), ne z této stránky.
- **Stav:** ✅ hotové.
- **Kód:** FE `sounds/SoundsPage.tsx`, `sounds/components/*`, `sounds/player/*`, `sounds/hooks/*`. BE `sounds/sounds.controller.ts`, `world-sounds.controller.ts`, `sounds.service.ts`.

---

## 14.5 — Deník PJ (`/denik-pj`)

### Deník PJ (world-level, per-PJ)
- **Co to je:** Poznámkový blok pro vedení světa — world-level, **per-PJ** (každý PJ má vlastní obsah pro daný svět). Sdílí notebook jádro s hráčovým `CharacterNotes` (na mapě se zobrazí to či ono dle role).
- **Kde:** FE `pages/WorldGmDiaryPage/WorldGmDiaryPage.tsx` (route `/denik-pj`) **a zároveň** uvnitř taktické mapy jako „Deník" tlačítko. BE `modules/world-gm-notes` (`worlds/:worldId/gm-notes`).
- **Kdo:** **PJ práva** (`>= PomocnyPJ`) nebo Admin+. Route guard `WorldMembershipGuard minWorldRole=PomocnyPJ` (router `:282`). BE `assertPj` → hráč 403 `INSUFFICIENT_WORLD_ROLE` (`world-gm-notes.service.ts:40`).
- **Co jde dělat:** Číst a editovat vlastní PJ poznámky pro svět (`GET`/`PATCH`, `findOrCreate` při prvním otevření). Přístup z menu i přímo z taktické mapy (overlay `MapNotebookOverlay`).
- **Vztah k hráči:** Hráč nemá deník PJ; na mapě má místo něj tlačítko „Poznámky" → poznámky **jeho jediné postavy** (`CharacterNotes`), které se propisují do tabu Poznámky na stránce postavy (`TacticalMapView.tsx:445-460`). Hráč bez postavy → tlačítko skryto (memory `gm_diary_architecture`).
- **Hranice / co NEumí:** Per-PJ izolace — PJ nevidí poznámky jiného PJ. Není sdílení/kolaborace na jednom deníku. Není verzování.
- **Stav:** ✅ hotové (10.2j/10.2l).
- **Kód:** FE `pages/WorldGmDiaryPage/*`, `tactical-map/components/notebook/{MapNotebookButton,MapNotebookOverlay}.tsx`, `tactical-map/api/useGmNotes.ts`. BE `world-gm-notes/world-gm-notes.{controller,service}.ts`.

---

## 14.6 — Stavitel: podzemí, města a krajiny (`/podzemi` + knihovna `/ikaros/podzemi`)

### Editor + generátory podzemí, měst a krajin (21.3a–g)
- **Co to je:** Samostatný fullscreen nástroj na tile-based mapy TŘÍ druhů (`mapKind`, volí se při založení, nekonvertuje se): **podzemí** donjon-stylu (negativ — bílé chodby v černé skále, 6 témat vč. organických jeskyní), **město** (pozitiv — budovy/ulice/hradby) a **krajina** (21.3g — lesy/hory/kopce/pole/mokřady/cesty/vesnička). Ruční kreslení NEBO procedurální generátory s auto-zabydlením, 53 dekorací, povrchy, **Klíč mapy** (21.3f — popisy k číslům, tiskne se pod PNG), **osobní cross-world knihovna** a **export na taktickou mapu vč. zdí (LoS)**. Freemium výhoda Podporovatelů (19.4).
- **Kde:** menu Hra → „Stavitel" → seznam `/svet/:slug/podzemi` (taby „V tomto světě | Moje knihovna", `DungeonListPage`), editor `/podzemi/:dungeonId`; platformová knihovna **`/ikaros/podzemi`** (`DungeonLibraryPage`, requireAuth) + editor v library režimu `/ikaros/podzemi/:dungeonId` (tatáž `DungeonEditorPage`, režim dle absence `worldSlug` param). Nahradilo bývalý admin stub `/admin/dungeon-builder`.
- **Kdo:**
  - Route svět: `memberOnly(Hrac)`; nav položka jen Hrac+ (`worldNavConfig.ts`), skrývatelná (`dungeon-builder`). Platformová knihovna: přihlášený (BE vrací jen vlastní položky).
  - Tvorba ve světě (BE autorita): člen **Hrac+ ∧ (Podporovatel ∨ PJ+)** — `assertCanCreate` → 403 `NOT_SUPPORTER`. FE teaser + skrytí tlačítek (`isEffectiveSupporter`).
  - Čtení seznamu světa: Hrac+; hráč jen svoje (owner filtr), PJ+ všechna.
  - Edit/smazání: vlastník ∨ PJ+ (`NOT_DUNGEON_OWNER`); grandfathering po ztrátě Podporovatele. Legacy bez `ownerId` = PJ-owned.
  - **Knihovna (21.3c):** položka = dokument s `worldId: null` (vzor MapTemplate). `GET /dungeon-maps/library` owner-only; library položky **owner-only i pro admina**. Kopie `POST /dungeon-maps/:id/copy`: do knihovny = Podporovatel ∨ PJ+ zdrojového světa (403 `NOT_LIBRARY_ELIGIBLE`); do světa = create brána cílového světa. VŽDY kopie (tenant izolace), `ownerId = requester`.
  - Export scéna/šablona: **PJ+** (`assertCanManage`); z knihovny → 403 `DUNGEON_EXPORT_NEEDS_WORLD`.
- **Co jde dělat:**
  - Seznam světa: karty s miniaturami, založení (velikost S/M/L, „vygenerované/prázdné"), akce **Uložit do mé knihovny · Kopírovat do světa…** (`WorldPickerModal` z `useMyWorlds`, filtr PJ+ ∨ supporter&Hrac+) · smazat. Tab knihovna: **Vložit do tohoto světa**, upravit (library editor), smazat.
  - Generátor podzemí: velikost, hustota místností, křivolakost, % zvláštních dveří, **Zabydlenost 0–100 %** (21.3d — typy místností dle velikosti + šablony nábytku, dveře nikdy neblokuje, `engine/furnish.ts`), deterministický seed + „Přegenerovat". **Témata (21.3f):** klasika·hrobka·doly·kanály·pevnost (tematické pooly místností, povrchy, distribuce dveří — `SPECIAL_DOORS_BY_THEME`) + **jeskyně** = organický CA generátor (`engine/generateCaves.ts`: největší komponenta + tunely, jezírka, hliněné dno; propojenost testem).
  - **Generátor krajiny (21.3g, `engine/generateWilderness.ts`):** value-noise fBm (elevace+vlhkost, deterministický hash — žádné Math.random) → hory/kopce/les/mokřad/louka, řeka po spádu + jezero, cesta greedy po nejnižším terénu (mosty přes vodu, spojitá přes celou mapu — testem), vesnička s očíslovanými staveními + poli, zeleň/tábor. Parametry: lesnatost, hornatost, voda, osídlení, zabydlenost, seed.
  - **Klíč mapy (21.3f):** panel (ikona knihy) — k popiskům z mapy (čísla první) titulek+text pro PJ; `notes` na dokumentu (max 200, BE `@ArrayMaxSize(200)`), edituje se s mapou (PUT), kopie ho přenáší, osiřelé položky jde smazat; v PNG se tiskne pod legendu (zalamování, cap 40 položek).
  - **Generátor města (21.3e, `engine/generateCity.ts`):** volitelná řeka s mosty → hlavní ulice (kříž) + vedlejší uličky rekurzivním dělením bloků → náměstí s kašnou a stánky → parcely budov podél ulic → hradby s bránami a rohovými věžemi (auto/ano/ne) → zeleň → číslování max 12 největších budov → lucerny/vozíky dle Zabydlenosti; **garanční prune** = uliční komponenty odříznuté řekou se vrací na terén (souvislost sítě jištěna testem). Parametry: hustota zástavby, křivolakost ulic, hradby, řeka, zeleň, zabydlenost, seed.
  - Ruční kreslení per druh: dungeon = podlaha/guma, 6 typů dveří, schody, voda/láva/jáma; město = ulice/budova/hradba/brána/most (canvas náhledy v liště), guma, voda. Sdílené: **povrchy** (dlažba/dřevo/hlína/písek/tráva tažením; město i na terén a ulice), **53 dekorací v 7 kategoriích** (nábytek·kontejnery·dungeon·jeskyně·tábor·**město**·markery pro PJ; rotace opakovaným klikem), popisky.
  - Undo/redo 50 (Ctrl+Z/Y), Ctrl+S, zoom/pan/pinch, rename, resize gridu.
  - **PNG export** (rám + legenda per druh) · **„Na taktickou mapu"** (21.3b, jen PJ ve world režimu): render 1:1 (`cellPx = cellSize`) → `POST /upload/content-image` → `export-scene`; BE do scény zapíše `config.gridType:'square'` + **`walls: MapWall[]`** (`dungeon-walls.util.ts`, **kind-aware**: dungeon = hranice podlaha↔skála + dveře; město = obvody budov a hradeb + brány jako dveře; run-merge běhů) → připraveno na dynamické vidění.
- **Hranice / co NEumí:** Jen čtvercový grid + „dyson" vzhled. Bez kolaborativní editace (poslední zápis vyhrává). Export nepřenáší fog/vision nastavení (PJ si zapne). Výhled (spec §14): patra, popisy místností, komunitní knihovna, exteriéry, hex, AI obrázek.
- **Zvláštnosti:** Explicitní uložení (PUT celé mapy) + `useBlocker`/`beforeunload`. Plátno = fixní „papír" (`render/` v ALLOW lint:colors). DTO limity: grid 10–100, dekorace ≤ 500, název ≤ 120. Pozor: `GET /dungeon-maps/library` musí být v controlleru PŘED `GET :id`. **Cascade:** world hard-delete maže `dungeonMaps` přes `deleteMany({worldId})` (world-hard-delete.service); hard-delete ÚČTU maže knihovnu vlastníka (`@OnEvent('user.deletion.hardDeleted')` → `deleteLibraryByOwner`) — stavby v živých světech záměrně zůstávají (obsah světa, spravuje PJ).
- **Stav:** ✅ 21.3a+b+c+d (čeká živé ověření uživatelem na webu).
- **Kód:** FE `features/world/dungeon-builder/` (`engine/{generate,furnish,model}.ts`, `render/{drawDungeon,glyphs}.ts`, `state/editorState.ts`, `components/{DungeonListPage,DungeonLibraryPage,DungeonEditorPage,DungeonCanvas,DungeonGrid,ToolPalette,GeneratorPanel,WorldPickerModal}.tsx`), router `podzemi` + `ikaros/podzemi`. BE `modules/dungeon-maps/{dungeon-maps.service.ts,dungeon-walls.util.ts,dto/*}` (49 jest testů; FE engine 17 vitest).

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-12 (doc-fix dle D-NEW-INV-MAPS) — **„A* pohyb" = jen dosah, ne pathfinding.** Princip 10.2 sliboval A* hledání cesty; v kódu `movement` stat určuje pouze range (`schemas/types.ts:59`) a bariéry pohyb fyzicky neblokují. Rozhodnutí: dokumentace/spec opraveny na skutečné chování (dosah/range-check, měření = přímá hex distance) — `takticka-mapa-matrix.md` §21.1 + §23.5 + zdejší kapitola. Skutečný pathfinding zůstává jako případné budoucí rozšíření 17.x.

2. ✅ VYŘEŠENO (D-NEW-INV-MAPS) — **Role-prahy správy map sjednoceny.** Atlas „Mapy" běží stejně jako taktická mapa, zvuky a deník PJ na `>= PomocnyPJ` — BE `world-maps.service.ts:59-61` (`canManage` = `membership.role >= WorldRole.PomocnyPJ`), FE `WorldLayout.tsx:386-389` (`isPJ` = owner ∨ elevovaný admin ∨ `>= PomocnyPJ`, N-16). PomocnyPJ tedy spravuje bojiště i obrázkový atlas. Dřívější práh „plné PJ" už neplatí; tělo kapitoly (§14.1 „Kdo") je s kódem v souladu.

3. ✅ VYŘEŠENO 2026-07-14 (21.3a) — **Dungeon-maps čtení/write PJ-only.** Gating přepracován: CRUD = Hrac+ s vlastnictvím (tvorba navíc Podporovatel ∨ PJ+), PJ+ spravuje vše, exporty na TM zůstávají PJ+ (`assertCanManage`). Viz §14.6. Pozn.: PomocnyPJ tvoří jen jako Podporovatel (role < PJ) — vědomé rozhodnutí spec 21.3 §3.

4. ✅ VYŘEŠENO 2026-07-12 (prošetřeno + zdokumentováno, D-NEW-INV-MAPS) — **Combat order dvojí zdroj pravdy.** `scene.combat.order` se ukládá, iniciativní lišta ho ignoruje (live sort dle `initiative` = záměrná featura 10.2f; FE posílá `combat.turn` s explicitním tokenId+round). `order` NENÍ mrtvý: drží legacy fallback `combat.turn` bez tokenId (BC), inverse `combat.end`→`combat.start` a validaci permutace `combat.reorder` — proto se neodstraňuje. Vztah zdokumentován komentářem v BE `map-operations.service.ts` (case `combat.start`). Live-sort je autoritativní pro zobrazení; `order` je start-snapshot.

5. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-DATA-SYNC) — **Token HP → Character sync.** BE `map-operations.service.ts` (`syncTokenHpToDiary` + `token-hp-diary-map.ts`): `token.update` patch `currentHp`/`maxHp` PC/NPC tokenu se best-effort propíše do `diary.customData` postavy (per-system klíče, zrcadlo FE `resolveCharacterHp`). Bestie tokeny záměrně bez syncu (nezávislá instance, memory `bestie_token_inst`). Nesyncuje se: `systemStats`/`injury`/`initiative` (nemají v deníku domov) a systémy s odvozeným „HP" (shadowrun/fate/fae/drdplus/drd2). Postava bez deníku → skip s logem (bez lazy-create).

6. ✅ VYŘEŠENO 2026-07-13 (inverses 2026-07-12 D-NEW-INV-MAPS, endpoint+UI 2026-07-13 D-DROBNE-UNDO) — **Undo neúplné.** Chybějící inverses (`scene.deactivate`, bulk assign) doplněny; `POST /maps/:id/operations/undo` + tlačítko „Zpět" v dock stacku (PJ/PomocnyPJ) zapojeny. Zbytkové limitace (combat.end partial, npcTemplate.remove cascade, dice.roll bez undo, blob starého scene.image) popsané v „Hranice taktické mapy".

7. **Sprite atlas neověřen.** Princip 10.2 zmiňuje sprite atlas; v kódu jen per-token texture cache (`useTokenTexture`). Ověřit, zda jde o dluh nebo o splněný princip jinou cestou.

8. **`seqNumber` gap.** Vědomě akceptovaný: apply uspěje, alokace seq selže → díra v sekvenci (`map-operations.service.ts:128`). Catch-up to obchází (cap), ale stojí za poznámku pro budoucí audit konzistence logu.

9. ✅ OPRAVENO 2026-06-18 (label „Mapy" → „Atlas map") — **Vesmírná mapa „Mapa" vs. atlas „Mapy"** — názvy se liší jen koncovkou „a/y", což je v menu matoucí pro uživatele. Zvážit přejmenování pro budoucího průvodce (např. „Vesmír" vs. „Atlas map").
