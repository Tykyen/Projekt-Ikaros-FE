# Spec 21.3 — Tvorba podzemí (samostatný editor + generátor)

**Stav:** SCHVÁLENO 2026-07-14 · 21.3a+c+d+b+e+f+g IMPLEMENTOVÁNY 2026-07-14 (čeká živé ověření uživatelem) · výhled §14b otevřen
**Datum:** 2026-07-14
**Roadmapa:** 21.3 Stavitel & generátor podzemí / map [H4-01]

---

## 1. Kontext a cíl

Samostatný „hloubkový program" (fullscreen editor à la taktická mapa) pro tvorbu
jednoduchých podzemí, součást každého světa. Dvě cesty tvorby:

1. **Generátor** — procedurální podzemí donjon-stylu (místnosti + chodby + dveře),
   parametry + tlačítko „Přegenerovat, dokud se nelíbí".
2. **Ruční editor** — malování podlahy/skály, pokládání dveří, schodů, terénu
   a **dekorací** (bedny, postele, stoly, židle, …).

Vizuální reference (od uživatele): klasická donjon mapa — bílá podlaha s mřížkou,
černý skalní masiv, glyfy dveří, pergamenový rám, legenda.

**Ověřený stav kódu (2026-07-14):**
- BE modul `dungeon-maps` **existuje kompletní**: CRUD + `export-template` +
  `export-scene` (`backend/src/modules/dungeon-maps/`). Model: grid buněk
  `DungeonCell` + `DungeonDecoration`, viz §5.
- FE = stub `DungeonBuilderPage.tsx` („[stub] Dungeon builder") na route
  `/admin/dungeon-builder` (RoleGuard Sa/Admin) — **nesoulad**: world-nav odkaz
  vidí všichni členové, BE guard je world-PJ+, FE route Sa/Admin. Řeší §3.
- FE nikde nevolá `/dungeon-maps` (0 výskytů).

## 2. Sub-kroky

| Krok | Obsah | Stav |
|---|---|---|
| **21.3a** | Fullscreen editor + generátor + dekorace + uložení per svět + PNG export | ✅ 2026-07-14 |
| **21.3c** | Osobní knihovna (cross-world) + kopírování mezi světy — §11 | ✅ 2026-07-14 |
| **21.3d** | Hloubka obsahu: 47 dekorací v 6 kategoriích, povrchy podlahy, auto-zabydlení — §12 | ✅ 2026-07-14 |
| **21.3b** | Export na taktickou mapu jako scéna **včetně konverze zdí → `MapWall` (LoS)** a dveří — §13 | ✅ 2026-07-14 |
| **21.3e** | Město: druhý generátor stavitele (přepínatelný druh mapy) — §15 | ✅ 2026-07-14 |
| **21.3f** | Hloubka podzemí: klíč mapy, témata, jeskyně CA — §16 | ✅ 2026-07-14 |
| **21.3g** | Krajina: třetí druh mapy (lesy/hory/pole/…) — §17 | ✅ 2026-07-14 |
| výhled | §14b: patra, multi-cell dekorace, komunitní knihovna, hex, AI | mimo tyto zátahy |

## 3. Přístup a gating (Podporovatel, 19.4)

- **Route:** `/svet/:worldSlug/podzemi` — per-world stránka (nahrazuje
  `/admin/dungeon-builder`; admin route + stub se **ruší**, nav odkaz ve
  worldNavConfig přestává být `external`).
- **Kdo smí tvořit:** člen světa **Hrac+**, který je Podporovatel
  (`isEffectiveSupporter` — flag NEBO týmová role Sa/Admin/Správci).
  **PJ+ světa vždy** (herní nástroj jádra, BE už je dnes PJ+).
- **Vlastnictví:** každé podzemí má `ownerId` (nové pole). Owner edituje/maže
  svoje; **PJ+ světa vidí a spravuje všechna** podzemí světa.
- **Ne-podporovatel (Hrac):** nav položku vidí, stránka ukáže zamčený teaser
  s vysvětlením (vzor prémiové skiny kostek — FE `isEffectiveSupporter`,
  `SkinPickerPanel` pattern).
- **BE vynucení:** v `DungeonMapsService` (guard neexistuje, vzor
  `worlds.service.ts` / `chat.service.ts`): create/update/delete = member Hrac+
  ∧ (supporter ∨ PJ+); read list = member (čtení cizích podzemí jen PJ+ — owner
  vidí svoje); `export-scene`/`export-template` zůstává **PJ+** (zápis do TM).

## 4. UX / vizuální návrh

**Layout — fullscreen tři zóny** (vzor taktická mapa, chrome v theme tokenech):

```
┌──────────────────────────────────────────────────┐
│ ← Zpět · Název podzemí · [Uložit] [PNG] [⚙ mapa] │  horní lišta
├───────┬──────────────────────────────────────────┤
│ nástr.│                                          │
│ lišta │        plátno (canvas 2D)                │
│ (levá)│   zoom/pan, mřížka, donjon render        │
│       │                                          │
├───────┴──────────────────────────────────────────┤
│ legenda glyfů (Průchod·Dveře·Zamčené·Past·Tajné·Mříž) │
└──────────────────────────────────────────────────┘
```

- **Plátno = hero.** Donjon-styl: bílá podlaha `#FFFFFF`, mřížka jemná šedá,
  skalní masiv černý, glyfy dveří ve stylu reference, čísla místností
  monospace. Pergamenový rám + legenda = signature (věrné referenci).
  Editor-chrome tmavý/tichý přes theme tokeny (`var(--…)`, žádné hardcoded
  barvy mimo plátno — plátno samotné je „papír", tam jsou barvy záměrně fixní
  a exportují se do PNG).
- **Levá nástrojová lišta** (ikony + tooltip): výběr/posun · štětec podlaha ·
  guma (skála) · dveře (submenu 6 typů) · schody ↑/↓ · terén (voda/láva/jáma) ·
  dekorace (paleta) · popisek · undo/redo.
- **Panel generátoru** (vysouvací zprava): velikost (S 24×16 / M 40×28 /
  L 64×44), hustota místností, křivolakost chodeb, % zvláštních dveří, seed,
  **[Vygenerovat]** / **[Přegenerovat]**. Generování přepíše plátno (s confirm,
  pokud jsou neuložené ruční změny).
- **Domovská obrazovka nástroje:** seznam podzemí světa (moje + pro PJ vše)
  s náhledy, [Nové podzemí] → prázdné/generátor.
- **Mobil (≤768px):** nástrojová lišta jako spodní scrollable řádek, generátor
  fullscreen sheet, pan/zoom pinch — kreslení tap/drag. Po implementaci
  `mobil-desktop`.

## 5. Datový model (BE reuse + rozšíření)

Existující `DungeonMap` (`dungeon-map.interface.ts`) zůstává základ:
`{ id, worldId, name, gridType, gridWidth, gridHeight, cellSize, theme, cells: DungeonCell[][], decorations }`.

**BE rozšíření (malá, zpětně kompatibilní):**

1. `ownerId: string` na `DungeonMap` (+ `createdBy` audit; migrace: stará data
   bez ownerId → treat as PJ-owned).
2. `DungeonCell.type` — nové hodnoty dle legendy reference:
   `'archway'` (průchod) · `'door-secret'` (tajné) · `'door-trapped'` (s pastí) ·
   `'portcullis'` (padací mříž). (`door`, `door-locked` už existují.)
3. `DungeonDecoration.label?: string` — text popisku (čísla/názvy místností,
   vlastní poznámky na mapě); typ dekorace `'label'`.
4. Validace: grid max **100×100**, min 10×10; decorations max 500.

**Model zjednodušení 21.3a:** jen `gridType:'square'` + `theme:'dyson'`
(donjon). `wallEdges` se v 21.3a nepoužívají — skála = `empty` buňky (masiv),
zdi jsou implicitní hranice podlaha↔skála. Hex + modern theme = výhled.

**Katalog dekorací (14, top-down vektorové glyfy):**
bedna · sud · truhla · postel · stůl · židle · lavice · regál/knihovna · krb ·
oltář · sloup · studna · žebřík · suť/kámen. Rotace 0/90/180/270 (BE už umí).

## 6. Generátor (FE engine, čistá logika)

Vzor 21.2a: `engine/` složka bez React závislostí, unit-testovatelná.

- **Algoritmus (donjon-styl):** 1) rozmísti nepřekrývající se místnosti
  (náhodné obdélníky dle hustoty), 2) chodby: bludiště (recursive backtracker)
  v mezerách s nastavitelnou křivolakostí, 3) propoj místnosti s chodbami
  dveřmi (spanning tree + extra spoje), 4) ořež slepé konce (dle parametru),
  5) rozděl typy dveří dle % (běžné/zamčené/tajné/past/mříž/průchod),
  6) očísluj místnosti (dekorace `label`).
- **Deterministický seed** (zobrazený, editovatelný) → „Přegenerovat" = nový
  seed; stejný seed = stejná mapa.
- Dekorace generátor v 21.3a NEpokládá (jen čísla místností) — nábytek je
  ruční tvorba; automatické zabydlení = výhled.

## 7. FE architektura

```
src/features/world/dungeon-builder/
  api/dungeonMapsApi.ts        # CRUD /dungeon-maps (api.get(url, rawParams) kontrakt)
  hooks/useDungeonMaps.ts      # TanStack Query + mutations
  engine/generate.ts           # generátor (čistý, seedovaný) + testy
  engine/model.ts              # FE typy zrcadlící BE + helpery (flood fill, bounds)
  render/drawDungeon.ts        # canvas 2D renderer (sdílený editor náhled + PNG export)
  render/glyphs.ts             # glyfy dveří + dekorací (vektorové path funkce)
  components/DungeonBuilderPage.tsx   # seznam podzemí (route index)
  components/DungeonEditorPage.tsx    # fullscreen editor
  components/ToolPalette.tsx / GeneratorPanel.tsx / DecorationPalette.tsx
  state/editorStore.ts         # lokální editor stav (nástroj, zoom, undo stack ≤50)
```

- **Render: canvas 2D** (ne PIXI) — statická dlaždicová mapa bez animací;
  jednodušší, žádné async-init pasti, PNG export = tentýž renderer
  (`canvas.toBlob`). Undo/redo = snapshoty gridu v paměti.
- **Ukládání:** explicitní [Uložit] (PUT celé mapy) + warn při odchodu
  s neuloženými změnami. Žádný WS realtime (single-editor nástroj) — poslední
  zápis vyhrává; kolab editace = výhled.
- **PNG export:** render v plném rozlišení (cellSize × grid) + rám + legenda.

## 8. Routing a navigace

- `router.tsx`: nová route `svet/:worldSlug/podzemi` (+ `/podzemi/:id` editor)
  pod WorldLayout, memberOnly(Hrac). Editor = fullscreen (skrytá world nav,
  vzor taktická mapa).
- **Smazat** admin route `/admin/dungeon-builder` + stub `DungeonBuilderPage`
  z admin feature; `worldNavConfig.ts`: `to: ${b}/podzemi`, bez `external`.
- Návod kap. 26 (dokumentace slibuje builder jako hotový) — opravit text
  v rámci `funkce` + `napoveda` po implementaci.

## 9. Mimo rozsah 21.3a

Hex grid, theme `modern`, více pater, exteriéry/města, AI obrázky, kolaborativní
editace. (Zabydlení, knihovna a přenos mezi světy = 21.3c/d, viz §11–§12.)

---

## 11. — 21.3c Osobní knihovna + přenos mezi světy

**Cíl:** stavitel si podzemí ukládá „k sobě" (mimo svět) a vkládá je do
kteréhokoli svého světa. Vše **kopiemi** — sdílení referencí přes světy by
protrhlo tenant izolaci a zamotalo práva; kopii si každý svět upraví po svém.

### 11.1 Model a BE

- `DungeonMap.worldId` → **volitelné**. Položka knihovny = dokument
  s `worldId: null` + `ownerId` (přesný vzor `MapTemplate` — cross-world,
  vázané na ownera). Index `{ ownerId: 1, worldId: 1 }`.
- **Nové endpointy** (`dungeon-maps.controller.ts` — pozor, `GET library`
  deklarovat PŘED `GET :id`):
  - `GET /dungeon-maps/library` — moje knihovna (owner-only, žádný world check).
  - `POST /dungeon-maps/:id/copy` body `{ targetWorldId?: string }` —
    bez `targetWorldId` = ulož kopii do knihovny; s ním = vlož kopii do světa.
- **Gating copy:**
  - čtení zdroje: owner ∨ PJ+ zdrojového světa (u library zdroje owner)
    ∨ admin bypass;
  - → knihovna: Podporovatel ∨ PJ+ zdrojového světa (nový kód
    `NOT_LIBRARY_ELIGIBLE`, přívětivě) — „PJ někde" se odvozuje ze zdroje,
    žádný nový membership dotaz;
  - → svět: stávající `assertCanCreate(cílový svět)` (Hrac+ ∧ Podporovatel ∨ PJ+).
  - Kopie vždy dostane `ownerId = requester` a NErecykluje id dekorací nemusí
    řešit (kopírují se 1:1, id kolidovat nemohou — jiný dokument).
- **Cleanup (rozhodnutí 2026-07-14):** hard-delete účtu → smazat knihovnu
  vlastníka (`user.deletion.hardDeleted` listener, vzor bestiae). Stavby
  v živých světech zůstávají (obsah světa, PJ je spravuje jako legacy);
  world hard-delete `dungeonMaps` už kryje (`deleteMany({worldId})`).
- **Library položky v existujících metodách:** `findById`/`replace`/`delete`
  bez `worldId` = **striktně owner-only** (i platform Admin dostane 403 —
  osobní knihovna je soukromý obsah; ověřeno testem);
  `findByWorld` se jich netýká; `exportScene`/`exportTemplate` na library
  položku → 403 `DUNGEON_EXPORT_NEEDS_WORLD` („nejdřív vlož do světa").
  `replace` zachovává `worldId` zdroje (i null).

### 11.2 FE

- **Seznam ve světě** (`/svet/:slug/podzemi`): taby **„V tomto světě" |
  „Moje knihovna"** (shared `Tabs`). Karta ve světě: akce „Uložit do knihovny"
  + „Kopírovat do světa…" (modal, `useMyWorlds` → jen světy kde role ≥ PJ ∨
  (Podporovatel ∧ role ≥ Hrac); BE stejně vynucuje). Karta v knihovně:
  „Vložit do tohoto světa" (jen když can-create zde), „Otevřít" (library
  editor), smazat.
- **Platformová knihovna**: route `/ikaros/podzemi` (seznam) +
  `/ikaros/podzemi/:dungeonId` (editor v library režimu — stejná komponenta,
  bez world kontextu: zpět-link na knihovnu, bez TM exportu; PNG funguje).
  Přístup: přihlášený uživatel (vidí jen svoje; prázdná knihovna + teaser
  pro ne-podporovatele). Záměrně BEZ dlaždice ve „Společné tvorbě" — ta je
  pro komunitní moderovaný obsah; osobní knihovna tam nepatří (komunitní
  sdílení podzemí = výhled §14).
- Editor: režim odvozen z routy (worldSlug param chybí → library mode).

## 12. — 21.3d Hloubka obsahu

### 12.1 Katalog dekorací 14 → ~40 (jen FE — BE `type` je string v Mixed)

Kategorie + položky (vektorové glyfy vlastní kresbou, styl = stávající
`glyphs.ts`: ink/paper, lw ~6 % buňky, inset ~16 %):

| Kategorie | Položky |
|---|---|
| Nábytek | stůl · židle · **křeslo** · **trůn** · lavice · postel · regál · **skříň** · **stojan na zbraně** · **koberec** |
| Kontejnery | bedna · sud · truhla · **koš** · **pytel** · **amfora** · **klec** |
| Dungeon | sloup · oltář · studna · **kostra** · **řetězy** · **socha** · **fontána** · **koš s ohněm** · **kotel** · **magický kruh** · **náhrobek** · **svícen** |
| Jeskyně | suť · **stalagmit** · **krystaly** · **houby** · **pavučina** · **kořeny** · **jezírko** |
| Tábor | **ohniště** · **stan** · **zásoby** · **spací pytel** |
| Markery (pro PJ) | žebřík (přesun) · **klíč** · **poklad ✕** · **vykřičník** · **hvězda** · **otazník** |

- Paleta dekorací dostane **kategorie** (sekce s nadpisy, scroll) + zachová
  rotaci opakovaným klikem.
- `DECORATION_TYPES`/`DECORATION_LABELS` rozšířit; glyf per typ v `glyphs.ts`.

### 12.2 Povrchy podlahy (`floorVariant` — pole už existuje)

- Varianty: `dlazba` (spáry), `drevo` (prkna), `hlina` (tečky), `pisek`
  (vlnky), `trava` (trsy) — jemné šedé šrafování na bílé, donjon styl zůstává.
- Nový nástroj **„Povrch"** (tažením, podpaleta variant + „smazat povrch");
  maluje `floorVariant` JEN na `floor` buňky (ne dveře/terén).

### 12.3 Auto-zabydlení generátoru

- Nový parametr **„Zabydlenost" 0–100 %** (default 40). Po očíslování
  místností generátor: 1) přiřadí typ místnosti (váhy dle velikosti — malá:
  ložnice/kobka/sklad; střední: strážnice/jídelna/knihovna; velká:
  sál/svatyně/jeskyně), 2) rozmístí nábytek dle šablony typu (postele/regály
  podél stěn, stůl+židle do středu, bedny/sudy do rohů…), deterministicky
  (stejný seed = stejné zabydlení), 3) nikdy nebloří buňky sousedící se
  dveřmi. Zabydlenost škáluje podíl zabydlených místností i hustotu kusů.
- Engine čistý (`engine/furnish.ts`) + testy (determinismus, dveře volné,
  limit dekorací ≤ 500).

## 13. — 21.3b Export na taktickou mapu (detail)

- **FE** (editor, jen world režim + PJ+ — `useWorldContext().isPJ`): tlačítko
  „Na taktickou mapu": 1) render **bez rámu** při `cellPx = dungeon.cellSize`
  (px obrazu = px gridu scény → mřížka sedí 1:1, origin 0,0), 2) upload PNG
  přes `POST /upload/content-image` (sdílený endpoint, File z blobu),
  3) `POST /dungeon-maps/:id/export-scene { imageUrl }`, 4) toast s odkazem
  na taktickou mapu.
- **BE `exportScene` rozšířit:**
  - `config.gridType: 'square'` (15.2 podporuje) + `size = cellSize`.
  - **Zdi:** hrany podlaha↔skála → segmenty v map-space px
    (`x*cellSize`…), slévané po přímých bězích (run-merge po řádcích/sloupcích)
    → `MapWall { points:[x1,y1,x2,y2], type:'wall', blocksSight:true }`.
  - **Dveře:** dveřní buňky → `MapWall { type:'door', door:{open:false,
    locked: true jen pro door-locked/portcullis}, blocksSight:true }` — segment
    napříč průchodem ve středu buňky, kolmo na osu chodby. `archway` = bez
    zdi (volný průhled). Tajné/past = zavřené dveře (PJ je na mapě otevře).
  - Čistá funkce `dungeonWallsToMapWalls(dungeon)` + unit testy (malý grid →
    očekávané segmenty; dveře; archway bez zdi; merge běhů).
- Fog/vision se nezapíná automaticky — PJ si režim vidění zapne sám (zdi
  jsou připravené pro `visionMode: 'dynamic'`).

## 15. — 21.3e Město (druhý generátor stavitele)

**Cíl:** tentýž nástroj umí i **města/vesnice** — při zakládání si stavitel
vybere druh mapy (Podzemí / Město), editor i generátor se přepnou. Vše
ostatní (knihovna, kopie mezi světy, PNG, export na TM, gating Podporovatelů)
funguje pro oba druhy stejně.

### 15.1 Model (BE minimálně)

- `DungeonMap.mapKind?: 'dungeon' | 'city'` (default `'dungeon'`, legacy bez
  pole = dungeon). DTO `@IsIn`. Druh se volí při založení, nekonvertuje se.
- `DungeonCell.type` union + město: `'street'` (ulice/cesta) · `'building'`
  (blok budovy) · `'city-wall'` (hradba) · `'gate'` (brána) · `'bridge'`
  (most přes vodu). Sémantika `empty` je per druh: dungeon = skalní masiv
  (černá), město = volný terén (bílá). `water` se sdílí; `floor` se ve městě
  nepoužívá.
- **Export na TM (reuse `dungeon-walls.util`):** per druh průchodnost —
  město: `building`/`city-wall` blokují pohled (hranice → `MapWall`),
  `gate` → door segment, ostatní volné. Jinak stejný pipeline.
- Cascade/knihovna/kopie: beze změn (druh je jen pole dokumentu).

### 15.2 Renderer (město, pořád „papír")

- Terén bílý s mřížkou; **ulice** = jemná pískově šedá výplň; **budovy** =
  tmavé bloky s bílou konturou (pozitiv černého masivu) + volitelné číslo;
  **hradby** = silná černá linie s cimbuřím (tečkování po hraně); **brána** =
  glyf průchodu v hradbě; **voda** modrá + **most** = prkna přes; stromy/keře
  jsou DEKORACE, ne buňky.
- Legenda dole se přepne dle druhu (Budova · Ulice · Hradby · Brána · Most).

### 15.3 Generátor města

Kroky (deterministické, mulberry32): 1) volitelná **řeka** (šířka 2–3, náhodný
tok) + mosty kde ji kříží hlavní ulice, 2) **hlavní ulice** (1–2 osy přes mapu,
šířka 2) + **vedlejší uličky** rekurzivním dělením bloků (křivolakost =
odchylky), 3) **náměstí** u hlavní křižovatky (vynechaný blok + kašna),
4) **parcely budov** podél ulic (obdélníky 2×3 až 6×8, mezery = dvorky),
5) volitelné **hradby** kolem zástavby s bránami na hlavních ulicích + věže
v rozích, 6) **zeleň** (stromy/keře dekorace) na volném terénu, 7) číslování
významných budov (labels), 8) zabydlení náměstí/ulic dekoracemi (stánky,
vozík, kašna, lucerny) dle Zabydlenosti.

**Parametry:** velikost (sdílené presety S/M/L) · hustota zástavby ·
křivolakost ulic · hradby (auto/ano/ne) · řeka (auto/ano/ne) · zeleň ·
zabydlenost · seed + „Přegenerovat".

### 15.4 Editor + FE

- **Založení:** modal „Nové podzemí" → „Nová mapa": přepínač druhu
  (🕳️ Podzemí / 🏘️ Město) + start vygenerované/prázdné. Karta v seznamu
  a knihovně dostane badge druhu.
- **Nástroje per druh** (ToolPalette přepne sadu): město = posun · ulice
  (tažením) · budova (tažením) · guma (terén) · hradba · brána · voda ·
  most · povrch (tráva/hlína/dlažba…) · dekorace (kategorie + nová
  **Město**: kašna, stánek, vozík, lucerna, strom, keř, plot, socha/studna
  sdílené) · popisek.
- **Generátor panel** se přepne dle `mapKind` (parametry výše).
- Nav položka se přejmenuje **„Tvorba podzemí" → „Stavitel"** (hint:
  podzemí a města); route `podzemi` zůstává (žádný redirect break).
- Engine `engine/generateCity.ts` + testy (determinismus, ulice souvislé,
  budovy nepřekrývají ulice/vodu, brány jen v hradbách, limit dekorací).

**Stav:** ✅ IMPLEMENTOVÁNO 2026-07-14 (schváleno „vytvoř a propracuj").
Odchylky od návrhu: hradby kreslené fill+ochoz (ne cimbuří tečkami); brána má
křídla vrat; navíc **garanční prune** uliční sítě (komponenty odříznuté řekou
se vrací na terén — invariant souvislosti testem); plot/lucerna/strom/keř/
stánek/vozík = 6 nových dekorací (kašna = reuse fontána).

## 16. — 21.3f Hloubka podzemí (schváleno 2026-07-14 „udělej")

### 16.1 Klíč místností (popisy)
- `DungeonMap.notes?: { label: string; title: string; text: string }[]` —
  klíčováno TEXTEM popisku (číslo místnosti/budovy). BE: Mixed pole + DTO
  `@ArrayMaxSize(200)`; `replace` ho přijímá (edituje se v editoru), `copy`
  přenáší. Funguje pro VŠECHNY druhy map (podzemí, město, krajina).
- Editor: vysouvací panel **„Klíč mapy"** — seznam popisků z mapy (číselné
  první), u každého titulek + text pro PJ; klik = vycentrování na buňku
  (výhled, v1 bez centrování). Ukládá se s mapou.
- PNG export: volitelně **klíč pod legendou** (title řádky, zalamování,
  cap ~40 položek) — checkbox při exportu? v1: vždy, když nějaké notes jsou.

### 16.2 Témata generátoru podzemí
Select **Téma**: `klasika · hrobka · doly · kanály · pevnost · jeskyně`.
Téma řídí: pool typů místností + šablony zabydlení (hrobka: náhrobky/kostry/
oltáře/magické kruhy; doly: suť/krystaly/žebříky/bedny + hlína; kanály: vodní
kanály podél chodeb + dlažba; pevnost: stojany/strážnice + víc mříží a
zamčených dveří), povrchy podlah a distribuci dveří. Jen parametr generátoru —
nepersistuje se.

### 16.3 Jeskynní režim (téma `jeskyně`)
Organické tvary přes **cellular automata**: random fill dle hustoty → 4–5
iterací vyhlazení → ponech největší komponentu + zbylé bubliny připoj tunely
(L-cesty mezi těžišti) → jezírka/stalagmity/houby/krystaly dle zabydlenosti.
Bez dveří (příp. vzácný `archway` v úžinách). Propojenost jištěna testem.

### 16.4 Mimo f (dál výhled): multi-cell dekorace, patra.

## 17. — 21.3g Krajina (třetí druh mapy — exteriér)

- `mapKind: 'wilderness'` (Krajina) — stejná infrastruktura (knihovna, kopie,
  PNG, TM export, gating) jako město.
- **Buňky nové:** `forest` (les) · `mountain` (hory) · `hill` (kopce) ·
  `field` (pole) · `swamp` (mokřad); reuse `water`/`bridge`/`building`
  (samoty/vesnička) a `street` (v krajině se renderuje jako polní CESTA).
  `empty` = louka (papír).
- **Render (pořád papír):** les = trs korunek, hory = ▲ vrcholky se šrafou,
  kopce = obloučky, pole = rovnoběžná orba (směr per buňka dle parity),
  mokřad = trsy + vodní čárky, cesta = písková stezka s tečkovanými okraji.
  Legenda: Les · Hory · Kopce · Pole · Mokřad · Cesta · Voda · Budova.
- **Generátor krajiny:** deterministický **value-noise (fBm)** → elevační +
  vlhkostní mapa → klasifikace (vysoko=hory, střed=kopce, vlhko=mokřad/les,
  jinak louka) → řeka po spádu / meandr + jezero → 1–2 cesty krajem
  (vyhýbají se horám, přes vodu mosty) → volitelná **vesnička** u cesty
  (shluk budov + pole okolo) → zvěřinec dekorací (stromy solo, kameny, tábor)
  dle zabydlenosti. Parametry: lesnatost, hornatost, voda (auto/ano/ne),
  osídlení (auto/ano/ne), zabydlenost, seed.
- **TM export:** pohled blokují `mountain`, `forest`, `building` (hustý les
  kryje); žádné dveře. Kind-aware walls util rozšířit + testy.
- **Nástroje:** cesta·les·hory·kopce·pole·mokřad·voda·most·budova·guma +
  povrchy/dekorace/popisek.

**Stav f+g:** ✅ IMPLEMENTOVÁNO 2026-07-14. Odchylky: klíč se v PNG tiskne
vždy, když existují poznámky (bez checkboxu); jeskyně sdílí slider „Otevřenost"
s hustotou místností; krajina — cesta jde greedy po nejnižším terénu (vyhýbá
se horám cenou, ne zákazem), vesnička čísluje domy popisky (funguje s klíčem).

## 14b. — Výhled (mimo schválené zátahy)

- **Více pater** — schody ↑/↓ propojené mezi úrovněmi jednoho podzemí.
- **Popisy místností/budov** — panel číslo → název + text pro PJ; tisk
  legendy k PNG.
- **Komunitní knihovna podzemí a měst** — sdílení komunitě se schvalováním
  (vzor herbář/ceníky, dlaždice ve Společné tvorbě, 21.4 moderace).
- Hex grid, theme `modern`, AI obrázek scény (18.3), kolaborativní editace,
  import (donjon TSV/UVTT), interiéry budov (město → dungeon proklik).

## 10. Akceptační kritéria 21.3a

1. Hráč-Podporovatel i PJ vytvoří, uloží, znovu otevře a smaže podzemí ve světě;
   Hrac bez Podporovatele vidí teaser, BE mu create vrátí 403 (přívětivá hláška).
2. Generátor: parametry + seed → opakovatelný výsledek; „Přegenerovat" dá novou
   mapu < 1 s (M velikost).
3. Ruční editace: všechny nástroje §4 fungují myší i dotykem; undo/redo ≥ 20 kroků.
4. Dekorace: položení, rotace, smazání, popisek s textem.
5. PNG export odpovídá plátnu (rám + legenda).
6. PJ vidí v seznamu všechna podzemí světa vč. cizích, owner jen svoje.
7. Mobil ≤768px použitelný (mobil-desktop skill projde).
8. `npm run build` čistý; BE testy dungeon-maps zelené (rozšířené o gating).
