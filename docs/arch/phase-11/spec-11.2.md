# Spec 11.2 — Storyboard (strom scénářů + editor + provázání)

**Status:** ✅ Schváleno + implementováno (2026-06-01)
**Rozsah:** **FE only** (nová sekce ve feature `campaign`) — **žádný BE zásah** (strom + metadata jdou do existujícího schemaless `CampaignScenario.contentData`; viz §4.2 + §8). BE modul `campaign` má scenario CRUD kompletní.
**Repo:** `Projekt-ikaros-FE`, pracuje se přímo na `main`
**Velikost:** odhad ~20–24 souborů / ~2000–2400 ř. (vč. testů). Žádná nová dep (`RichTextEditor` + `react-force-graph-2d` už jsou).
**Autor:** PJ + Claude
**Datum:** 2026-06-01
**Souvisí:** roadmap-fe.md §11.2 (b–e), navazuje na hotové 11.1 Pavučina + 11.2a Linky (storyliny). Konzumuje data 7/8/9/10 (subjekty, lokace=Pages, mapy=MapScene).

---

## 1. Cíl

Stránka **`/svet/:worldSlug/scenare`** = **Storyboard** — PJ nástroj na **psaní a přípravu příběhu**, organizovaný **podle míst a scén** ve **stromu**. Nahrazuje dnešní stub.

Tři pohledy na stejná data:
1. **Strom** — scénáře hierarchicky (Akt/Kapitola → scéna → větve), drag-reorder, větvení dle voleb hráčů.
2. **Editor scénáře** — RichText obsah, tajné `gmNotes`, cíl/výsledek, a panel **Provázání** (lokace · mapa · subjekty · linky).
3. **Síť** — odkaz do Pavučiny předfiltrovaný na linky/subjekty scénáře (lehké propojení, ne nová vizualizace).

**Mentální model (potvrzeno s autorem):**
- **Linka** (11.2a, hotová) = _vlákno / proč_ se to děje, táhne se napříč kampaní (macro/mid/micro).
- **Scénář** (tento krok) = _kde a v jakém pořadí_ se to hraje — odpovídá složkám na autorově disku (Hlavní příběh → epizoda → scéna).
- Scénář ukazuje na linky → „tahle scéna posouvá tahle vlákna".

---

## 2. Kontext / motivace

- Autor dnes píše příběh mimo platformu: Google Disk „Hlavní příběh" = složky podle míst (epizody) + `.odt` texty + obrázky + mapy + „Příběhová linie.xlsx". Cíl 11.2 = **přenést tenhle workflow do světa** a propojit ho s tím, co svět už drží (postavy, lokace, frakce z Pavučiny, mapy, linky).
- Roadmapa staví 11.2 na 11.1 (subjekty/vztahy/linky existují). Scénáře jsou poslední velký kus kampaňových nástrojů (zbývá 11.3 QuickNotes/Shop).
- BE `campaign` má scenario CRUD hotové, FE je `WorldStubPage`. Hodnota zablokovaná za FE.
- Když to neuděláme dobře: PJ nemá kde připravit hru jako celek; příběh zůstává v odpojených dokumentech bez vazby na svět.

---

## 3. Audit současného stavu

### 3.1 BE — scenario CRUD kompletní, žádné změny v 11.2

`backend/src/modules/campaign/` — `CampaignScenario`:

```ts
interface CampaignScenario {
  id; worldId; ownerId; isShared: boolean;
  title: string;
  contentData?: Record<string, unknown>;   // schemaless @Prop({ type: Object })
  order: number;
  linkedPageSlug?: string;                  // 1 hlavní lokace (first-class)
  subjectIds: string[];                     // zapojené subjekty Pavučiny
  storylineIds: string[];                   // zapojené linky
  images: string[];
  createdAt; updatedAt;
}
```

- **Endpointy** (controller `:364`): `GET /campaign/scenarios?worldId=`, `GET /scenarios/:id`, `POST`, `PUT /:id`, `DELETE /:id`. Sort `{ order: 1 }`.
- **Role gate** — sdílený `resolveScope` (stejný jako 11.1): PJ+ vidí vše, PomocnyPJ vlastní+shared, Hrac vlastní. `isShared` jen PomocnyPJ+.
- **Persistence ověřena (čtení BE kódu, §8 ověří round-trip runtime):**
  - `createScenario` ukládá `contentData: dto.contentData` přímo.
  - repository `toEntity` mapuje `contentData: doc.contentData` **celé** → GET ho vrací.
  - DTO `contentData?: @IsObject()` bez `@ValidateNested` → vnořená pole (`storyTree.*`) **propadnou** beze ztráty (stejně jako `sideA`/`sideB` v 11.1).
- ⚠️ **`update` dělá `$set: dto`** (`findByIdAndUpdate { $set: data }`) → poslání `contentData` **přepíše celý objekt**. FE proto musí **read-merge-write** (§4.2).

### 3.2 FE — stub + zapojená route

- [StorylinesPage.tsx](src/features/world/pages/StorylinesPage.tsx): `return <WorldStubPage area="storylines" />`.
- Route **existuje**: `router.tsx:250` `{ path: 'scenare', element: memberOnly(p(StorylinesPage)) }`.
- Nav položka **existuje**: `worldNavConfig.ts:61` `id: 'scenare'`, hint „Scénáře a příběhy (fáze 11.2)".
- Feature `campaign` je hotová z 11.1/11.2a — **scénáře přidáme jako další sekci** (`api.ts` rozšířit o scenario hooky, nové komponenty). Storyliny (Linky) už mají CRUD + `StorylineForm`.

### 3.3 FE reuse (co bereme hotové)

- **`RichTextEditor`** (TipTap + obrázky) — použitý v Pages; reuse pro tělo scénáře a tajné `gmNotes`.
- **`campaign/api.ts`, `types.ts`, `labels.ts`, `campaignColors.ts`, `useSubjectImages.ts`** — sdílené utility 11.1.
- **`usePagesDirectory` / persona adresář** — vrací **všechny typy** Pages (Lokace, NPC, Noviny…) + subjekty.
- **`PagePicker`** (`components/PagePicker`) — hotový autocomplete stránky (single); reuse pro „Místo scény", pattern pro multi-výběr stránek.
- **`useBestiar(worldId, systemId)`** (`bestiar/hooks/useBestiar`) — list bestiáře scope světa (system/user/world); reuse pro provázání bestií.
- **Pavučina graf** (`PavucinaGraph`) — pro pohled „Síť" jen předáme filtr (storylineIds/subjectIds scénáře), žádná nová grafová logika.
- **`Modal`, `ConfirmDialog`, `KebabMenu`** (1.8); sonner toasty; skin „ikaros".
- **Vrstvy / layer switcher** (11.1) — scénáře jsou taky `ownerId`-scoped → stejné partitioning + read-only PJ náhled hráče (ale scénáře jsou primárně PJ; hráč typicky žádné nemá).
- **MapScene** (`tactical-map/types.ts`) + jejich list endpoint — pro provázání scénář↔mapa (§4.5).

### 3.4 Matrix reference (funkční vzor)

`Matrix/frontend/src/pages/World/WorldStoryboard.tsx` (1202 ř.) — **strom celý ve `contentData.storyTree`**:

```ts
interface StorySceneMeta {
  parentId: string | null;
  branchLabel: string;                       // label větve dle voleb hráčů
  status: 'draft' | 'active' | 'optional' | 'resolved';
  storyInfo: string; sceneInfo: string;      // texty (přejdou na RichText body)
  gmNotes: string; objective: string; outcome: string;
  mapSceneIds: string[]; locationSlugs: string[];
}
```
Strom se poskládá klientsky z plochého listu dle `parentId`. **Logiku portujeme, kód ne 1:1** (nový stack: TanStack Query, CSS Modules, TipTap).

---

## 4. Návrh řešení

### 4.1 Informační architektura

Stránka `/svet/:slug/scenare` → `<StoryboardView>`. Header: (PJ) layer switcher + 3 interní pohledy (ne routy, drží výběr scénáře):

```
┌──────────────────────────────────────────────────────────────┐
│ 🎬 Storyboard   [Vrstva: Moje ▼]   Strom · Editor · Síť       │
├───────────────┬──────────────────────────────────────────────┤
│  STROM        │  EDITOR vybrané scény                         │
│  (rail)       │  title · status · větev                       │
│  ▸ Akt I      │  ┌── RichText obsah ──────────────────┐       │
│    ▸ Scéna 1  │  │  (tělo scény, veřejné/sdílené)      │       │
│      ↳ větev  │  └────────────────────────────────────┘       │
│  ▸ Akt II     │  🔒 gmNotes · 🎯 cíl · 🏁 výsledek (PJ)        │
│  [+ scéna]    │  ── Provázání: lokace·mapa·subjekty·linky ──   │
└───────────────┴──────────────────────────────────────────────┘
```

Desktop = 2 panely (strom rail vlevo, editor vpravo). Mobil = strom → klik → editor full-screen (stack). Síť = přepnutí na Pavučinu s předaným filtrem.

### 4.2 Datový model — `contentData.storyTree` (0 BE změn)

FE rozšíří `CampaignScenario` o typovaný náhled na `contentData`. Pravdivý sklad = jeden klíč `storyTree`:

```ts
// campaign/scenarioMeta.ts
export type ScenarioStatus = 'draft' | 'active' | 'optional' | 'resolved';
export type ScenarioKind = 'folder' | 'scene';   // složka (jen organizace) vs scéna (má obsah)

export interface ScenarioMeta {
  parentId: string | null;       // null = root
  order: number;                 // pořadí mezi sourozenci (řazení stromu); viz pozn. níže
  kind: ScenarioKind;            // 'folder' = Akt/Kapitola, 'scene' = hratelná scéna
  branchLabel?: string;          // label větve k rodiči („pokud zradí" …)
  status: ScenarioStatus;
  body?: string;                 // RichText HTML — tělo scény (sdílené/veřejné dle isShared)
  gmNotes?: string;              // TAJNÉ — jen PJ (RichText)
  objective?: string;            // 🎯 cíl scény
  outcome?: string;              // 🏁 výsledek scény
  mapSceneIds: string[];         // provázané MapScene (10.2)
  pageSlugs: string[];           // wiki stránky LIBOVOLNÉHO typu (NPC, Noviny, Lokace, …) nad rámec hlavní linkedPageSlug
  bestieIds: string[];           // předpřipravené bestie z bestiáře pro encounter scény
}
```

**Mapování na BE pole:**
- první-class `title`, `order`, `isShared`, `subjectIds`, `storylineIds`, `images`, `linkedPageSlug` → používáme přímo (dotazovatelné, sort).
- `parentId/kind/branchLabel/status/body/gmNotes/objective/outcome/mapSceneIds/pageSlugs/bestieIds` → do `contentData.storyTree`.
- `linkedPageSlug` = **hlavní** stránka/místo scény (first-class, kvůli reuse z 11.1); `pageSlugs` = doplňkové stránky libovolného typu.
- **bestie = ref (`bestieId`)**, ne snapshot. Scénář ukazuje na šablonu bestiáře (PJ má encounter „připravený"); spawn snapshotu na taktickou mapu = iterace 2 (viz §5, `project_bestiar_design` snapshot semantics).

**Read-merge-write helper (povinné — ⚠️ §3.1 `$set` past):**
```
updateScenarioMeta(scenario, patch):
  next = { ...getMeta(scenario), ...patch }   // getMeta = parse contentData.storyTree + defaulty
  PUT { ...firstClassFields, contentData: { ...scenario.contentData, storyTree: next } }
```
Nikdy neposílat útržkový `contentData` — vždy celý zmergovaný objekt (jinak `$set` přepíše).

**Strom klientsky:** plochý list scénářů → `buildTree(list)` dle `parentId` + `meta.order`; cykly ošetřit (parentId ukazující na potomka = ignoruj, fallback root). Osiření při smazání rodiče → děti se promítnou na `parentId` smazaného rodiče (= jeho rodič) nebo root.

⚠️ **Pořadí v `meta.order`, ne ve first-class `order`:** BE update DTO (`CreateCampaignScenarioDto`) **nemá pole `order`** → přes PUT ho nelze měnit (ValidationPipe by ho dropla). Řazení proto držíme v `storyTree.order` (přežije přes `contentData`). First-class `order` necháváme být (BE ho nastaví při create, nepoužíváme ho k řazení). Tím je drag-reorder čistě FE bez BE změny.

### 4.3 Pohled „Strom"

- Rail: stromový seznam, odsazení dle hloubky, ikona dle `kind` (📁 folder / 🎬 scene) a `status` (barevná tečka: draft šedá · active zelená · optional modrá · resolved tlumená).
- `branchLabel` se zobrazí jako štítek na spojnici k rodiči („↳ pokud hráči zradí").
- Akce: `+ Scéna`, `+ Složka` (na root i jako dítě vybraného uzlu), kebab (přejmenovat, smazat s `ConfirmDialog`, „přidat větev").
- **Drag-reorder + re-parent:** drag uzlu → změní `order` (řazení sourozenců) i `parentId` (přetažení pod jiný uzel = re-parent). Obojí plně ve scope. Batch PUT dotčených (merge meta). Záloha „přesunout pod…" v kebabu pro přístupnost/mobil.
- Empty: CTA „Vytvoř první scénu / Začni příběh".

### 4.4 Pohled „Editor scénáře"

Vybraná scéna (kind=scene) → editor:
- **Hlavička:** `title` (inline edit), `status` select, `branchLabel` (jen pokud má rodiče), badge zapojených linek.
- **Tělo** (`body`): `RichTextEditor` — autorův hlavní text (přenos jeho `.odt`). Autosave debounced (merge-write) nebo explicitní „Uložit" — **rozhodnuto: explicit „Uložit" + dirty indikátor** (bezpečnější proti `$set` přepisu při paralelní editaci; autosave až iterace 2).
- **Tajné (jen PJ+):** `gmNotes` (RichText), `objective`, `outcome`. Renderují se jen pro `viewerRole >= PJ` (stejný guard jako `truth`/`gmIntent` v 11.1).
- **Galerie:** `images[]` — sekce obrázků scény (reuse upload pattern z Pages galerie); náhledy + přidat/odebrat. Plně ve scope.
- folder (kind=folder): editor zjednodušší — jen title + status + popis (`body`), bez provázání map.

### 4.5 Pohled provázání (panel v editoru) — „využít vše ze světa"

Postranní/spodní panel scény, **6 sekcí**, každá = hledatelný multi-výběr (port pattern z `StorylineForm` 11.2a + reuse `PagePicker`):
1. **📍 Místo scény** — `linkedPageSlug` (1 hlavní, first-class); reuse **`PagePicker`** (single). Kde se scéna primárně odehrává (typicky Lokace, ale libovolný typ povolen).
2. **📄 Wiki stránky** — `pageSlugs[]`, **libovolný typ** (PC, NPC, Noviny, Lokace, Seznam, …); multi-výběr nad `usePagesDirectory` (vrací všechny typy) s **filtrem typu** + badge typu u výsledku; chip → odkaz na wiki stránku. *(Pokrývá autorův požadavek: PC i NPC na wiki, Noviny, „cokoliv".)*
3. **🐉 Bestiář** — `bestieIds[]`; vyhledávač přes **`useBestiar(worldId, world.system)`** (scope system/user/world dle systému světa); chip = jméno + avatar bestie → odkaz do bestiáře / (budoucí) spawn na mapu. PJ si „připraví" encounter scény.
4. **🗺 Mapy** — `mapSceneIds`; vyhledávač MapScene světa; chip → „Otevřít taktickou mapu" (`/svet/:slug/mapa?scene=`). *(Provázání připraveno od začátku dle rozhodnutí autora #2; plná obousměrná integrace mapy = iterace 2.)*
5. **👥 Subjekty** — `subjectIds`; vyhledávač subjektů Pavučiny (avatar přes `useSubjectImages`); chip → skok na Pavučinu/subjekt.
6. **🧵 Linky** — `storylineIds`; vyhledávač storylin (reuse z 11.2a); chip → otevři linku.

💡 **Stránky vs Subjekty:** Subjekt (Pavučina) = uzel _vztahové sítě_; Wiki stránka = _obsah_ světa. NPC může být obojí — proto obě sekce: navážeš NPC jako subjekt (pro graf) i jako jeho wiki stránku (pro obsah). Nevynucujeme propojení, PJ vybírá co potřebuje.

⚠️ **Bestiář je per-system** — `useBestiar` vyžaduje `systemId`; odvodíme z `world.system`. Pokud svět nemá systém, sekce bestiáře se schová s hintem.

Vše merge-write do scénáře (first-class `linkedPageSlug`/`subjectIds`/`storylineIds` + meta `pageSlugs`/`bestieIds`/`mapSceneIds`). Prázdné sekce = tlumený hint.

### 4.6 Pohled „Síť"

Tlačítko/přepínač „Zobrazit v síti" → přepne na Pavučinu (existující `PavucinaGraph`) **předfiltrovanou** na `storylineIds` + `subjectIds` scénáře. Žádná nová grafová komponenta — jen předání filtru (Pavučina filtr dle linky už umí, 11.2a). Pokud reuse vyžaduje refaktor signatury filtru → drobné rozšíření props, ne nová logika.

### 4.7 Vrstvy / role

- Scénáře jsou `ownerId`-scoped (jako vše v campaign). **Primárně PJ nástroj.**
- Hráč: BE vrátí jen vlastní → typicky prázdné; pokud PJ něco nasdílí (`isShared`), hráč to vidí read-only (čte `body`, ne `gmNotes`).
- PJ+: layer switcher (reuse z 11.1) — „Moje" editovatelné, hráčova vrstva read-only. (Hráči scénáře skoro nikdy nemají → switcher může být skrytý, pokud žádný hráč nemá scénář; rozhodnuto: zobrazit jako v 11.1 pro konzistenci.)
- **Tajnost:** `gmNotes`/`objective`/`outcome` jen PJ+. `body` dle `isShared`.

### 4.8 Soubory (FE)

```
src/features/world/campaign/
  scenarioMeta.ts            # ScenarioMeta typy, getMeta/parse, buildTree, mergeMeta helper (+ spec)
  api.ts                     # ROZŠÍŘIT: useCampaignScenarios, useScenario, create/update/delete/reorder mutace
  types.ts                   # ROZŠÍŘIT: CampaignScenario + CreateScenarioInput (už BE-zrcadlo)
  components/
    StoryboardView.tsx       # orchestrátor: layer switch + 3 pohledy + load
    ScenarioTree.tsx         # strom rail (render, drag-reorder, +scéna/+složka, kebab)
    ScenarioTreeNode.tsx     # 1 uzel (ikona kind/status, branchLabel, dnd)
    ScenarioEditor.tsx       # title/status/branch + RichText body + tajné PJ pole
    ScenarioLinksPanel.tsx   # provázání: místo/stránky/bestiář/mapy/subjekty/linky (6 sekcí, reuse PagePicker + useBestiar)
    ScenarioNetworkLink.tsx  # přepínač do Pavučiny s filtrem (tenký wrapper)
    index.ts                 # export StoryboardView
  *.module.css
  __tests__/                 # vitest
src/features/world/pages/StorylinesPage.tsx   # přepsat stub → render <StoryboardView/>
```

### 4.9 Responsivita

- **Desktop ≥ 1024:** 2 panely (strom rail ~320px + editor). Provázání = pravý sloupec/sekce pod editorem.
- **Tablet 769–1024:** strom collapsible (drawer), editor full-width.
- **Mobil ≤ 768:** strom = 1. obrazovka; klik na scénu → editor full-screen s „← zpět na strom"; provázání = sbalitelné sekce; RichText toolbar scrollovatelný. Karty, ne tabulky.
- `mobil-desktop` skill po implementaci (11.2e).

### 4.11 Vizuální směr (frontend-design audit)

**Koncept: „Vlákno příběhu" (story thread), ne file-tree.** Strom kampaně sdílí DNA s Pavučinou (hvězdná mapa), ale kde Pavučina je _prostor_ (2D síť), Storyboard je _cesta_ (vertikální dráha v čase). Tím se dva PJ nástroje vizuálně rýmují, ale nepletou.

**Strom = svítící vertikální vlákno:**
- Místo klasického odsazeného file-tree → **svislá zářící spojnice** (`var(--accent)` → `color-mix` gradient, slábne dolů), uzly jako **„stanice" na dráze**. Odsazení hloubky = posun vpravo + tenčí napojovací linka.
- `kind: folder` (Akt/Kapitola) = větší **kapsle** se silnějším rámem (`--frame-border`), `kind: scene` = menší **kruhová stanice** (rým s uzly grafu). Stav `status` → glow tečka: draft `--cmp-val-zero` (šedá), active `--cmp-val-pos` (zelená, jemný puls), optional `--cmp-org` (modrá), resolved tlumená/poloprůhledná.
- **Větvení** = linka se rozdvojí (výhybka), `branchLabel` jako malý štítek na ohybu („↳ pokud zradí") — evokuje dialogový strom / rozcestí, ne JSON odsazení.
- Drag = uzel se „zvedne" (`--depth-panel` lift + scale 1.03), cílová pozice = zářící mezera ve vlákně.

**Editor = „scéna na skleněné desce":**
- Panel `surface-1` + `--depth-panel`, velkorysý vnitřní padding (čtecí klid, opak husté Pavučiny).
- `title` = **velký display nadpis** (reuse display fontu skinu „ikaros" — **nezavádět nový font**, jen větší váha/velikost), pod ním řádek meta: status pill + branchLabel + linky-badge.
- RichText `body` = klidná světlá čtecí plocha (reuse stylů `RichTextEditor` z Pages — konzistence napříč skiny).
- **Tajná PJ zóna** (`gmNotes`/cíl/výsledek) = vizuálně oddělená „za oponou": jemný `color-mix(var(--accent) ~8%)` podklad + 🔒 ikona + tenký horní oddělovač s textem „Jen PJ". Signalizuje tajnost _formou_, ne jen popiskem.

**Provázání = řada „kotev do světa":** 6 sekcí, každá s ikonou + barvou (reuse `--cmp-*` tokenů: subjekty/lokace dědí barvy z Pavučiny → vizuální spojitost). Chips = kapsle s avatarem/ikonou + `×`; prázdná sekce = duch-placeholder „+ připoj…".

**Motion (load):** vlákno se rozsvítí shora dolů — staggered reveal uzlů (`animation-delay` dle pořadí), spojnice „doteče" k poslednímu. Jeden orchestrovaný moment při vstupu, pak klid (editor je pracovní režim, ne show).

**Pozadí:** náznak vesmírného prachu jako Pavučina, ale **ztlumený** (čtecí režim) — žádná plná Matrix rain v editoru; rain/space jen jemně za stromem, aby nerušil text.

**Tokeny:** vše scoped na `.storyboard-root`, výhradně `var()` + `color-mix` (jako `campaign.tokens.css`), `lint:colors` clean. Nové odvozené tokeny (status glow, thread gradient) → `storyboard.tokens.css`, žádný globální/skin edit.

### 4.10 Loading / error / empty

- Initial: skeleton stromu + editor placeholder.
- Fetch error: banner „Zkusit znovu".
- Mutace error: toast.
- Empty: CTA „Začni příběh — vytvoř první akt nebo scénu".
- Dirty editor + odchod: varování „Neuložené změny".

---

## 5. Hranice rozsahu

> **Žádné dluhy (rozhodnutí autora):** vše, co patří do storyboardu, dodáme **kompletně** v 11.2. Položky níže nejsou odložená práce — jsou to buď **finální designové volby**, nebo **hranice jiného systému** (doména jiné fáze).

**Plně ve scope 11.2 (kompletně dodat):** strom + větvení + drag-reorder **i re-parent**, editor s RichText, tajná PJ pole, **galerie obrázků scény** (`images[]`), všech 6 sekcí provázání, vrstvy, mobil, nápověda.

**Finální designové volby (ne odklad):**
- **Explicit „Uložit" + dirty guard** (ne autosave) — záměrná volba kvůli bezpečnosti proti `$set` přepisu při paralelní editaci. Je to hotový stav, ne mezikrok.
- **Strom přes `contentData`** (ne first-class BE) — záměrná architektura (§4.2), ne provizorium.

**Hranice jiného systému (NE dluh 11.2 — patří jinam):**
- **Spawn bestií / tokenů na taktickou mapu** (snapshot) = akce **taktické mapy (10.x)**. Storyboard drží `bestieIds`/`mapSceneIds` jako přípravu; spawn provádí mapa. Hranice systémů.
- **Obousměrná mapa↔scénář** (otevřít scénu z mapy, sync tokenů) = doména **taktické mapy (10.x)**. 11.2 dává odkaz scénář→mapa.
- **CRUD bestiáře** = stránka **Bestiář**; tady jen vybíráme existující (provázání).
- **QuickNotes / Shop / Měny** = **11.3 / 11.4**.
- **WS real-time sync** scénářů mezi PJ = campaign je příprava, ne live (roadmapa potvrzuje); není potřeba.
- **Verzování / PDF export scénáře** = mimo produktovou vizi 11.2 (roadmapa); pokud někdy bude, je to nová fáze, ne nedodělek tohoto kroku.

---

## 6. Acceptance kritéria

1. ✅ `/svet/:worldSlug/scenare` renderuje `StoryboardView` (ne stub).
2. ✅ Strom: scénáře hierarchicky dle `parentId`/`order`; `+ Scéna` i `+ Složka`; smazání s potvrzením; osiření dětí ošetřeno (žádný zmizelý uzel).
3. ✅ Drag-reorder sourozenců mění `order` (persist přes merge-write); re-parent aspoň přes „přesunout pod…".
4. ✅ Větvení: scéna s rodičem má editovatelný `branchLabel`, zobrazený u spojnice.
5. ✅ Editor: `title` (inline), `status` (draft/active/optional/resolved), `body` přes `RichTextEditor`, explicit Uložit + dirty indikátor.
6. ✅ Tajná pole `gmNotes`/`objective`/`outcome` se renderují **jen pro PJ+**; hráč (sdílený scénář) vidí jen `body`.
7. ✅ Provázání (6 sekcí): místo (`linkedPageSlug`), **wiki stránky libovolného typu** (`pageSlugs` — NPC/Noviny/Lokace/… s filtrem typu), **bestiář** (`bestieIds` přes `useBestiar`), mapy (`mapSceneIds`), subjekty (`subjectIds`), linky (`storylineIds`) — hledatelný výběr, chip → odkaz na cíl.
8. ✅ „Zobrazit v síti" přepne na Pavučinu předfiltrovanou na linky/subjekty scénáře.
9. ✅ **Persistence (round-trip):** vytvoř scénu s parentId+status+body+gmNotes+mapSceneIds → refetch → vše zůstane (potvrzuje, že `contentData.storyTree` přežije BE GET).
10. ✅ **Merge-write:** úprava jen `status` nesmaže `body`/provázání (žádný `$set` přepis celého contentData).
11. ✅ Vrstvy: PJ switcher (reuse 11.1), hráčova vrstva read-only; scénáře `ownerId`-scoped.
12. ✅ Mobil ≤ 768: strom → editor stack, provázání sbalitelné, RichText ovladatelný.
13. ✅ Žádné hardcoded barvy (CSS tokeny); `npm run lint:colors` ✓.
14. ✅ `npm run lint`, `npm run test:run`, `npm run build` ✓.
15. ✅ `mobil-desktop` + `napoveda` skill spuštěny (11.2e).

---

## 7. Test plán

**Automated (Vitest):**
- `scenarioMeta.spec.ts` — `getMeta` parse + defaulty (chybějící storyTree → defaulty); `mergeMeta` zachová neměněná pole; `buildTree` (ploché→strom, order, cyklus→fallback, osiření).
- `api.spec.ts` — scenario query klíče, reorder mutace volá PUT s celým merge contentData (ne útržek).
- `ScenarioEditor.spec.tsx` — tajná pole jen PJ; dirty guard; status change nemaže body (merge).
- `ScenarioLinksPanel.spec.tsx` — multi-výběr add/remove napříč 6 sekcemi, chip odkaz, vyhledávač filtruje; stránky filtr dle typu (PC/NPC/Noviny/Lokace); bestiář sekce skrytá bez `world.system`.
- `ScenarioTree.spec.tsx` — render hierarchie, +scéna pod uzlem, smazání s osiřením, branchLabel render.

**Manuální smoke:**
1. Vytvoř Akt (folder) → 2 scény pod ním → větev pod scénou s `branchLabel`.
2. Napiš `body` (RichText) + `gmNotes` → Ulož → refresh → text zůstává.
3. Změň jen `status` → ověř, že `body` a provázání zůstaly (merge, ne přepis).
4. Prováž scénu s místem (lokace) + 1 NPC wiki stránkou + 1 Noviny stránkou + 2 bestiemi + mapou + 2 subjekty + 1 linkou → chipy odkazují správně; refresh → vše drží.
5. „Zobrazit v síti" → Pavučina ukáže jen subjekty/vztahy té linky.
6. Hráčský účet: tajná pole skrytá; nesdílený scénář neviditelný.
7. Mobil 375px: strom → scéna → zpět; provázání sekce sbalitelné.

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Dopad | Mitigace |
|---|---|---|---|
| `contentData.storyTree` se při GET zahodí (toEntity po polích) | **velmi nízká** (kód čten — `toEntity` přenáší contentData celé) | vysoký | **Round-trip test PRVNÍ** (§7.9) před UI; pokud drop → mini BE patch (toEntity passthrough, ~3 ř.) — stejný precedens jako 11.1 valence |
| `$set` přepíše celý contentData při útržkové editaci | střední | vysoký | **merge-write helper povinný** (§4.2); test §7 ověří status-change nemaže body |
| Cyklus/osiření ve stromu (parentId na potomka, smazání rodiče) | nízká | střední | `buildTree` cyklus-guard + reparent dětí na root; test |
| Reorder mnoha uzlů = N× PUT (závodění) | nízká | nízký | batch sekvenčně, invalidace až po dokončení; objem malý (desítky) |
| RichText (TipTap) HTML v `body` napříč skiny | nízká | nízký | reuse existující `RichTextEditor` styly (Pages je už řeší) |
| Pavučina filtr reuse vyžaduje refaktor | nízká | nízký | jen rozšíření props (volitelný `initialFilter`), ne přepis |
| Bestiář per-system: svět bez `world.system` → `useBestiar` disabled | nízká | nízký | sekce bestiáře skrytá s hintem; zbytek provázání funguje nezávisle |
| `pageSlugs` (víc Pages) v contentData vs first-class `linkedPageSlug` — duplicita/drift | nízká | nízký | `linkedPageSlug` = hlavní (1), `pageSlugs` = doplňkové; `PagePicker` hlavní vyřazuje z multi-seznamu |

**Rollback:** revert `StorylinesPage.tsx` na stub + smazat nové komponenty/`scenarioMeta.ts` + revert rozšíření `api.ts`/`types.ts`. **Žádné BE/DB změny** → rollback = čistě FE diff. Existující scénáře (pokud nějaké) zůstanou v DB nedotčené.

---

## 9. Otázky k autorovi / klíčová rozhodnutí

Potvrzeno v brainstormingu:
- **Strom** ✅ — ale **bez BE zásahu** (změna proti původnímu „s BE zásahem"): metadata do schemaless `contentData.storyTree`, vzor 11.1. *(Pokud trváš na first-class BE stromu, řekni — je to větší krok s migrací.)*
- **Mapy připravit** ✅ — model provázání (`mapSceneIds`) od začátku; plná obousměrná integrace = iterace 2.
- **Hierarchie skupina → příběh → navázání** ✅ — řešeno **volným stromem** (`kind: folder|scene`, libovolná hloubka), pokryje Akt→Scéna→větev i mělčí.
- **Kompletní dodání** ✅ — 11.2b–e jako ucelené sub-kroky, žádný dluh (mimo explicitně out-of-scope iterace 2).

Delegováno na Claude (rozhodnuto výše): explicit Uložit místo autosave (finální volba); status barvy; layout 2-panel; Síť = reuse Pavučiny s filtrem.

**Vše potvrzeno — žádné otevřené otázky.** Autorovo „žádné dluhy" → galerie obrázků i drag re-parent jsou plně ve scope (§5); explicit Uložit = finální designová volba (ne odklad). Spec uzavřena.

---

**Po schválení specu:** frontend-design audit (vizuál stromu + editoru, pravidlo base.md) → implementační plán (`plan-11.2.md`) → kód.
