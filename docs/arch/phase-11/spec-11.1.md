# Spec 11.1 — Pavučina (vztahový graf kampaně)

**Status:** Draft — čeká na schválení
**Rozsah:** FE (nová feature `campaign`) + **drobný BE patch** (přidat typy `STATE` a `OTHER` do subjekt-enumu — interface union + DTO `@IsIn`, ~2 ř., bez migrace; viz §4.2) + **verifikační BE check** (ověřit, že schemaless `sideA`/`sideB` přenesou nová pole `valence`/`emotionTag` — viz §4.3 a §8)
**Repo:** `Projekt-ikaros-FE`, pracuje se přímo na `main`
**Velikost:** odhad ~22–26 souborů / ~2200 ř. (vč. testů) + 1 nová dep `react-force-graph-2d`
**Autor:** PJ + Claude
**Datum:** 2026-06-01
**Souvisí:** roadmap-fe.md §11.1, navazuje 11.2 (Storylines authoring) a 11.3 (QuickNotes). BE modul `campaign` je kompletní.

---

## 1. Cíl

Stránka **`/svet/:worldSlug/pavucina`** — nástroj pro **přehled vztahů** mezi subjekty světa (lidé, CP, frakce, organizace, lokace, státy…) a PJ dashboard „Dnes".

Dvě role-oddělené **vrstvy**:
- **Pavučina hráče** — vlastní hráč ji edituje (co jeho postava ví/věří o vztazích světa). PJ ji **vidí, needituje**.
- **Vrstva PJ** — soukromá pracovní pravda PJ pro storyboard (čeho s kým chce dosáhnout).

Vztahy jsou **oboustranné a asymetrické** (A k B ≠ B k A) s **emoční hodnotou** (láska ↔ nenávist, spojenectví ↔ válka). Vizualizace = **2D force graph** (canvas) škálovatelný na husté sítě (20+ vztahů na uzel + navazující).

---

## 2. Kontext / motivace

- Roadmapa staví 11.1 jako **jádro kampaňových nástrojů** — storyliny (11.2) i poznámky (11.3) se vážou na subjekty/vztahy z 11.1.
- BE `campaign` je **kompletní** (7 entit, CRUD, dashboard, changelog, players, role gate, `isShared`), ale FE je jen `WorldStubPage`. Veškerá hodnota je zablokovaná za FE.
- Starý Matrix má plně funkční vzor: `CampaignCenter.tsx` (1559 ř.) + `RelationshipGraph.tsx` (custom SVG force-sim). **Logiku a UX přebíráme, kód portujeme na nový stack** (TanStack Query, CSS Modules, `useWorldContext`, force-graph knihovna místo ruční SVG).
- Když to neuděláme dobře teď: 11.2/11.3 nebudou mít na čem stavět; **horší případ** — naivní port ruční SVG simulace se při hustotě, kterou PJ reálně tvoří (desítky uzlů, 20+ hran/uzel), rozseká na React re-renderu.

---

## 3. Audit současného stavu

### 3.1 BE — kompletní (žádné změny v 11.1)

`backend/src/modules/campaign/`:
- **Entity:** `CampaignSubject`, `CampaignRelationship`, `CampaignStoryline`, `CampaignScenario`, `CampaignQuickNote`, `CampaignShopItem`, `CampaignChangeLog`.
- **Endpointy** (`campaign.controller.ts`): plné CRUD pod `/campaign/{subjects,relationships,storylines,scenarios,quicknotes,shopitems}`, `GET /campaign/dashboard`, `GET /campaign/changelog`, `GET /campaign/players`. Všechny berou `?worldId=` (povinné).
- **Role gate** (`campaign.service.ts:71` `resolveScope`):
  | WorldRole | Scope (co GET vrátí) |
  |---|---|
  | PJ+ (≥5) / globální Admin | `{ worldId }` → **vše od všech vlastníků** |
  | PomocnyPJ (4) | `{ worldId, $or:[ownerId=me, isShared] }` |
  | Hrac (≤2) | `{ worldId, ownerId=me }` → jen vlastní |
- `canModify` (`:82`): PJ+ smí vše; PomocnyPJ smí shared + vlastní; Hrac jen vlastní.
- `createXxx` přijímá `isShared` jen od PomocnyPJ+ (`resolveIsShared` v controlleru).
- **`CampaignRelationship`** (`interfaces/campaign-relationship.interface.ts`):
  - `subjectAId` / `subjectBId`
  - `sideA` / `sideB`: `{ tone?, behavior?, gmIntent?, strength? }` (**schemaless `@Prop({ type: Object })`** v schématu `:15–19`)
  - `shared`: `{ whatHappened?, behindTheScenes? }`
  - `status`: `active | dormant | crisis | closed`, `priority` 1–5, `storylineIds[]`, `lastChangeNote?`
- **`CampaignSubject`**: `type` (`PC|NPC|LOCATION|ORG|FACTION`), `name`, `avatarUrl?`, `tags[]`, `status` (`active|archived`), `linkedPageSlug?`, `linkedCharacterSlug?`, `notes?`.
- **`CampaignStoryline`** (čteme v 11.1, authoring až 11.2): `level` (`macro|mid|micro`), `title`, `status`, `summary?`, `whatHappened?`, `truth?`, `playersBelief?`, `gmIntent?`, `nextStep?`, `subjectIds[]`, `relationshipIds[]`.
- **`GET /dashboard`** (`service:955`) vrací `{ crisisRelationships (max 10), activeStorylines, pinnedNotes, recentChanges }` — scope dle role žadatele (PJ = celý svět).

**Klíčové BE poznatky pro spec:**
1. **`subjectType` postrádá `OTHER` a `STATE`** — interface má jen `PC|NPC|LOCATION|ORG|FACTION`. „Státy" namapujeme na `ORG` resp. `FACTION` (viz §4.2 + Otázka). Matrix měl navíc `OTHER` — v novém BE není.
2. **`sideA`/`sideB` jsou volné objekty** → `valence` + `emotionTag` přidáme bez schema migrace (§4.3).
3. **GET endpointy nemají `ownerId` filtr** → per-vrstva oddělení řešíme FE partitioningem dle `ownerId` (§4.5).
4. **`relationshipSide` má `strength` 1–10** → tloušťka hrany.

### 3.2 FE — stub

- `src/features/world/pages/CampaignPage.tsx`: `return <WorldStubPage area="campaign" />`.
- Route (roadmapa): `/svet/:worldSlug/pavucina`. **Ověřit existenci v `router.tsx` + `worldNavConfig`** (krok implementace).
- **Žádná** campaign feature (api/types/komponenty) zatím neexistuje.
- Nainstalováno: `react-force-graph-3d` (z 10.1 Universe). **Pro 11.1 přidáme `react-force-graph-2d`** (stejný autor/ekosystém vasturiano).

### 3.3 FE konvence (reuse vzory)

- **World context:** `useWorldContext()` → `{ worldId, userId, userRole, loading }` z `@/features/world/context/WorldContext`. `WorldRole` z `@/shared/types`.
- **Data:** TanStack Query + `api` klient z `@/shared/api/client`, token `accessTokenAtom`. Vzor: `src/features/world/currencies/api.ts` (11.4).
- **Folder layout (vzor 11.4):** `features/world/<feature>/{api.ts, types.ts, components/, *.module.css, *.spec.ts(x)}`.
- **Styl:** CSS Modules, **žádné hardcoded barvy** → CSS tokeny (`var(--surface-*)`, `var(--accent)`…), `npm run lint:colors`.
- **Sdílené primitivy:** `Modal`, `ConfirmDialog`, `KebabMenu` (1.8), skin „ikaros" = fialový synthwave.
- **Testy:** Vitest bez globals (explicit importy), `fireEvent` (ne user-event). FE **nemá precommit hook** → lint/test/build ručně.

### 3.4 Matrix reference (funkční vzor, ne vizuál ani kód 1:1)

- `Matrix/frontend/src/pages/CampaignCenter.tsx` — taby `dnes | subjekty | linky | poznamky | mapa`; 3-panel layout (rail / main / detail); SmartSubjectSelector; avatar bulk-resolve (ne N+1); drag-priorita; slug auto-lookup na wiki/deník; player picker (`viewingPlayerId`).
- `Matrix/frontend/src/components/RelationshipGraph.tsx` — ruční SVG force-sim: repulze/atrakce/gravitace, drag uzlů, pan/zoom, focus na uzel, filtr dle storyline, obousměrné tóny na hraně, storyline-dots u uzlu.

**Z Matrixu do 11.1 portujeme:** Dnes dashboard, Subjekty (list+detail+form), Vztahy (asymetrické strany, detail, form), graf. **Neportujeme v 11.1:** Linky authoring (→ 11.2), Poznámky (→ 11.3), `ChatPlayerModal` deník integraci (zvážit později).

---

## 4. Návrh řešení

### 4.1 Informační architektura

Jedna stránka, **interní taby** (ne routy) — drží stav výběru subjektu/vztahu napříč přepnutím:

```
┌──────────────────────────────────────────────────────────────┐
│ 🕸 Pavučina        [Vrstva: Moje ▼]   ◉ Dnes · Subjekty · Síť │  ← header: layer switch + taby
├──────────────────────────────────────────────────────────────┤
│  obsah aktivního tabu                                          │
└──────────────────────────────────────────────────────────────┘
```

**Taby v 11.1:**
1. **◉ Dnes** — dashboard (krize / aktivní linky / připnuté / poslední změny).
2. **Subjekty** — 3-panel (seznam subjektů → vztahy subjektu → detail/edit).
3. **Síť (Pavučina)** — 2D force graph.

> Taby `Linky` (11.2) a `Poznámky` (11.3) přidají budoucí kroky — komponenta je navržená tak, aby šly doplnit bez refaktoru (tab registry).

**Layer switcher** (jen PJ+, viz §4.5): `Moje vrstva` | per-hráč read-only.

### 4.2 Subjekty — typy (vč. nového `STATE` a `OTHER`)

**Rozhodnuto (autor: „chci"):** „stát" je **plnohodnotný typ**, plus `OTHER` jako catch-all („a já nevím čeho ještě"). Cílová sada **7 typů**: `PC | NPC | FACTION | ORG | LOCATION | STATE | OTHER`.

Mapování vize:
- **lidé / postavy** → `PC` (hratelné) / `NPC`
- **organizace, skupiny** → `ORG`
- **frakce, národy** → `FACTION`
- **státy** → `STATE` (nový)
- **lokace** → `LOCATION`
- **cokoli jiného** → `OTHER` (nový)

**BE patch (drobný, ~2 ř., bez migrace):**
- `interfaces/campaign-subject.interface.ts`: `CampaignSubjectType` union `+ 'STATE' | 'OTHER'`.
- `dto/create-campaign-subject.dto.ts:16`: `@IsIn([...,'STATE','OTHER'])`.
- Schema `type` je plain string (`@Prop({ default:'NPC' })`) → **žádná změna**. Žádná migrace existujících dat.

**Barevná paleta uzlů dle typu** (CSS tokeny, fialový synthwave base):
| Typ | Význam | Akcent |
|---|---|---|
| PC | hráčská postava | `--cmp-pc` (zelenkavá) |
| NPC | cizí postava | `--cmp-npc` (fialová, brand) |
| FACTION | frakce / národ | `--cmp-faction` (jantarová) |
| ORG | organizace | `--cmp-org` (modrá) |
| STATE | stát | `--cmp-state` (purpurová/červená) |
| LOCATION | lokace | `--cmp-location` (oranžová) |
| OTHER | ostatní | `--cmp-other` (šedá) |

### 4.3 Datový model vztahu — emoční hodnota

Každý vztah = 1 hrana, **2 nezávislé strany**. Rozšíříme `RelationshipSide` o:

```ts
interface RelationshipSide {
  tone?: string;        // (BE existuje) volný popisek
  behavior?: string;    // (BE existuje) chování
  gmIntent?: string;    // (BE existuje) tajný PJ záměr
  strength?: number;    // (BE existuje) 1–10 → tloušťka hrany
  valence?: number;     // NOVÉ: -3..+3 (kvantita: nenávist … neutrál … láska/spojenectví)
  emotionTag?: string;  // NOVÉ: pojmenovaná emoce z palety (kvalita)
}
```

**`valence` škála** (společná, řídí barvu hrany + řazení):
`-3` nenávist/válka · `-2` nepřátelství · `-1` chlad/nedůvěra · `0` neutrál · `+1` sympatie/obchod · `+2` zalíbení/přátelství · `+3` láska/spojenectví

**`emotionTag` — type-aware paleta** (kvalita nad kvantitou; rozhodnuto delegovaně):
- **mezi osobami (PC/NPC):** láska · zamilovanost · přátelství · respekt · lhostejnost · nedůvěra · žárlivost · rivalita · strach · opovržení · nenávist
- **mezi organizacemi/frakcemi/státy:** spojenectví · vazalství · obchodní · neutralita · napětí · soupeření · studená válka · válka
- **smíšené / lokace:** vazba · domov · vyhnanství · kontrola · spor

Každý `emotionTag` má **default `valence`** (láska=+3, nenávist=−3, napětí=−1…), který PJ může přepsat. Paleta = FE konstanta `campaign/emotions.ts`.

**Vizuální mapování v grafu:**
- **barva hrany** = mix valence A↔B (červená −3 → šedá 0 → zelená +3); silně asymetrický vztah (A miluje, B nenávidí) = dvoubarevný gradient po směru.
- **tloušťka** = `max(strengthA, strengthB)`.
- **styl čáry** = `status`: plná `active`, čárkovaná `dormant`, pulzující/červená `crisis`, tečkovaná-bledá `closed`.
- **směr** = dvě mírně zakřivené hrany A→B a B→A (každá svou valence-barvou), aby šly číst obě strany.

**BE dopad:** žádná schema migrace — `sideA`/`sideB` jsou `@Prop({ type: Object })`; DTO `RelationshipSideDto` má `@IsObject()` bez `@ValidateNested`, takže nová pole **propadnou** do DB. **Povinné ověření persistence** (A→B→A round-trip test, §8) než se na to spolehneme — pokud by `toEntity`/service stranu přepisoval po polích, doplní se `valence`/`emotionTag` do interface+DTO+mapperu (drobný BE patch, ~15 ř.).

### 4.4 Graf — `react-force-graph-2d` (canvas)

**Rozhodnutí: 2D canvas, ne 3D, ne ruční SVG.** Důvody:
- **Ne 3D:** rotace/hloubka rozbíjí čitelnost obousměrných emocí (kdo koho miluje/nenávidí) — přesně to, co má být vidět. 3D zůstává brand prvkem Universe mapy.
- **Ne ruční SVG (Matrix):** překresluje přes React každý tick → při desítkách uzlů reconciliation storm.
- **Ano `react-force-graph-2d`:** canvas utáhne stovky uzlů/hran plynule; stejná rodina jako instalovaná 3D (nízká režie); plný custom render uzlů i hran (`nodeCanvasObject`, `linkCanvasObject`) → nakreslíme valence-barvy, dvojhrany, tloušťku, štítky emocí.

**Hustota „co nejvíce vidět" se řeší interakcí, ne rozměrem:**
- **Focus mód:** klik na uzel → zvýrazní jeho ego-síť (přímé hrany + sousedy), zbytek ztlumí na ~15 %.
- **Filtry:** dle typu subjektu · dle valence (jen krize / jen pozitivní) · dle storyline (až budou v 11.2) · hledání → vycentrování na uzel.
- **Pan/zoom/drag uzlů** (knihovna nativně), pin uzlu (drag = zafixuj pozici).
- **Legenda** (typy + valence škála) + **detail panel** vybraného uzlu (jeho vztahy seznamem).
- Dvojklik na uzel → přepne na tab Subjekty s tím subjektem.

**Perf:** `cooldownTicks` omezit, `warmupTicks` pro instant layout; `nodeRelSize` dle typu; štítky emocí jen při `globalScale > práh` (skryté při oddálení, aby se nepřekrývaly).

### 4.5 Vrstvy (Moje × hráči) — FE partitioning

BE vrací PJ plochý slějv všech vlastníků. **FE rozdělí dle `ownerId`** + `GET /campaign/players` (seznam `{id, username}`):

- **Hráč:** BE scope = jen vlastní → vidí jen svou vrstvu, edituje ji. Žádný switcher.
- **PJ+:** header switcher:
  - `Moje vrstva` → filtr `ownerId === userId` (editovatelné).
  - `Hráč X` → filtr `ownerId === X` → **read-only** (skryté všechny edit/add/delete akce; BE `canModify` PJ sice povolí, ale UI nedovolí — trust guard).
- **Dashboard per-vrstva:** FE dopočítá z filtrovaných listů (krize = rels se `status==='crisis'`, aktivní linky, připnuté poznámky až 11.3) — `GET /dashboard` použijeme pro „Moje vrstva", per-hráč dopočet klientsky (campaign data jsou malá).
- **`isShared`:** ponecháme dostupné v subject/relationship formu jako PJ checkbox „Sdílet s hráči" (rezerva), ale není primární UX. Default `false`.

**„📋 Kopírovat do mé vrstvy" (autor: „chci")** — když PJ prohlíží hráčovu (read-only) vrstvu, u subjektu je akce, která vytvoří **kopii s `ownerId = PJ`** (POST nového subjektu s daty originálu, jméno + „(kopie)"). Port Matrix `_forceGlobal`. Po kopii toast „Zkopírováno do tvé vrstvy". Volitelně i pro vztah (kopíruje, pokud oba subjekty existují i v PJ vrstvě — jinak disabled s tooltipem). 11.1: kopie subjektu povinně, kopie vztahu nice-to-have.

📌 Per-account oddělení i kopie = čistě FE (POST už BE umí). Fáze zůstává **FE + drobný enum patch** z §4.2.

### 4.6 Subjekty tab — 3 panely

**Vlevo (rail):** hledání + filtr typu (chipy) + seznam subjektů (avatar, jméno, typ-badge). `+ Subjekt`.
**Střed (main):** vztahy vybraného subjektu (karty s obousměrnými stranami, valence-badge, strength-pips, status), `+ Vztah`. Nebo formulář subjektu/vztahu.
**Vpravo (detail):** detail vybraného subjektu (poznámky, odkaz na wiki stránku/postavu) nebo vztahu (obě strany, tajný PJ záměr jen pro PJ, `lastChangeNote`).

**Subject form:** jméno, typ, status, tagy (čárkou), `linkedPageSlug` (+ vyhledávač slugů — port lookup z Matrixu, zjednodušený), `linkedCharacterSlug`, PJ poznámka. Avatar = `avatarUrl` nebo resolve z linked stránky (bulk, ne N+1 — port pattern).
**Relationship form:** subjekt A (předvyplněn) → subjekt B (vyhledávač), status, priorita, pro každou stranu: `emotionTag` (select z type-aware palety) + `valence` (slider, předvyplněn z tagu) + `strength` (1–10) + `behavior` + `gmIntent` (PJ). Sdílené: `whatHappened` (veřejné) + `behindTheScenes` (PJ).

**Tajnost:** `gmIntent`, `behindTheScenes`, `truth` (storyline) se renderují **jen pro PJ+** (`viewerRole >= PJ`). Hráč ve své vrstvě tato pole nemá.

### 4.7 Dnes (dashboard)

4 sekce (port z Matrixu): ⚠ Vztahy v krizi · ▶ Aktivní linky (čteno z 11.2 dat, zatím prázdné) · 📌 Připnuté poznámky (11.3, zatím prázdné) · 🕓 Poslední změny. Klik na položku → skok na příslušný tab + výběr. Prázdné sekce → friendly empty state (ne chyba).

### 4.8 Soubory (FE)

```
src/features/world/campaign/
  api.ts                    # TanStack Query hooky: subjects, relationships, storylines(read), dashboard, players + mutace
  types.ts                  # FE typy (sync s BE interfaces) vč. valence/emotionTag
  emotions.ts               # type-aware paleta emocí + default valence + valence→barva
  campaignColors.ts         # type→token, status→styl hrany (přes CSS var, čteno do canvasu)
  components/
    CampaignView.tsx        # orchestrátor: layer switch + tab registry + data load
    DnesTab.tsx
    SubjektyTab.tsx         # 3-panel
    SubjectRail.tsx
    SubjectForm.tsx
    RelationshipCard.tsx
    RelationshipForm.tsx
    RelationshipDetail.tsx
    SubjectDetail.tsx
    PavucinaGraph.tsx       # react-force-graph-2d wrapper (custom node/link render, focus, filtry)
    GraphLegend.tsx
    LayerSwitcher.tsx
    index.ts
  *.module.css              # per-komponenta
  __tests__/                # vitest
src/features/world/pages/CampaignPage.tsx   # přepsat stub → render <CampaignView/>
```

### 4.9 Responsivita (mobil i desktop)

- **Desktop ≥ 1024:** 3-panel Subjekty; graf full-bleed.
- **Tablet 769–1024:** 3-panel → 2-panel (detail jako overlay/drawer).
- **Mobil ≤ 768:** taby zůstávají; Subjekty = 1 panel se stack navigací (seznam → vztahy → detail jako přechod, ne 3 sloupce); graf full-screen s touch pan/zoom, focus mód tlačítkem; layer switch v hamburger/dropdown. Karty místo tabulek.
- `mobil-desktop` skill po implementaci.

### 4.10 Loading / error / empty

- Initial: skeleton railu + grafu.
- Error fetch: banner „Zkusit znovu".
- Mutace error: toast (sonner).
- Empty (0 subjektů): CTA „Přidej první subjekt" (editovatelná vrstva) / „Hráč zatím nemá síť" (read-only PJ pohled).

---

## 5. Out of scope

- **Storyliny authoring** (CRUD, level/status/nextStep editor) → **11.2**. V 11.1 jen čteme pro filtr grafu + dashboard.
- **QuickNotes** (poznámky tab, pin/done) → **11.3**.
- **Scénáře, Shop, Měny** → 11.2/11.3/11.4.
- **BE změny mimo §4.2 enum patch:** `?ownerId=` filtr na GET; WS gateway pro real-time sync mezi PJ (campaign = příprava, ne live — roadmapa to potvrzuje); changelog UI nad rámec dashboard sekce; tvrdý BE zákaz PJ editace cizí vrstvy (řešíme jen FE guardem).
- **Deník/Chat modal** integrace subjektu (Matrix `ChatPlayerModal`) — zvážit po 8.x sjednocení; v 11.1 jen odkaz na linked stránku/postavu.
- **Bulk import/export pavučiny, PDF** — mimo MVP (roadmapa).
- **Drag-to-reorder priority** mezi kartami vztahů (Matrix měl) — nice-to-have, ne v 11.1.

---

## 6. Acceptance kritéria

1. ✅ `/svet/:worldSlug/pavucina` renderuje `CampaignView` (ne stub); route + nav položka existují.
2. ✅ Hráč vidí **jen svou** vrstvu, plně ji edituje (subjekty + vztahy CRUD).
3. ✅ PJ+ vidí switcher `Moje vrstva | <hráči>`; „Moje" editovatelná, hráčova **read-only** (žádné edit/add/delete v DOM).
4. ✅ Subjekt CRUD: **7 typů** PC/NPC/FACTION/ORG/LOCATION/STATE/OTHER (BE enum patch hotov), tagy, status, linked slug, avatar (resolve bez N+1).
4b. ✅ PJ při prohlížení hráčovy vrstvy umí „📋 Kopírovat" subjekt do své vrstvy (`ownerId=PJ`, jméno „(kopie)").
5. ✅ Vztah CRUD: oboustranné asymetrické strany; každá strana `emotionTag` + `valence` (−3..+3) + `strength` (1–10) + `behavior` + `gmIntent`; sdílené `whatHappened`/`behindTheScenes`.
6. ✅ `emotionTag` paleta je **type-aware** (jiné nabídky pro osoby vs organizace/státy); výběr tagu předvyplní valence (přepsatelné).
7. ✅ Tajná pole (`gmIntent`, `behindTheScenes`) se renderují **jen pro PJ+**.
8. ✅ Graf (`react-force-graph-2d`): uzly barevně dle typu, hrany barevně dle valence, tloušťka dle strength, styl dle status; dvě hrany pro obě strany.
9. ✅ Graf focus mód (klik → ego-síť, zbytek ztlumen), filtry (typ/valence), hledání→center, pan/zoom/drag, dvojklik→tab Subjekty.
10. ✅ Graf plynulý při ≥ 40 uzlech / ≥ 150 hranách (žádné viditelné sekání; canvas, ne SVG).
11. ✅ Dnes dashboard: krize / aktivní linky / připnuté / poslední změny; klik → skok+výběr; prázdné sekce = empty state, ne chyba.
12. ✅ **Persistence vztahu:** vytvoř vztah s `valence`+`emotionTag` → refetch → hodnoty zůstanou (round-trip; potvrzuje, že schemaless side přenese nová pole).
13. ✅ Mobil ≤ 768: taby fungují, Subjekty = stack navigace, graf touch-ovladatelný; karty místo 3-sloupce.
14. ✅ Žádné hardcoded barvy — vše přes CSS tokeny; `npm run lint:colors` ✓.
15. ✅ `npm run lint`, `npm run test:run`, `npm run build` ✓ (vč. SSL `NODE_OPTIONS=--use-system-ca` při install nové dep).
16. ✅ `mobil-desktop` + `napoveda` skill spuštěny po implementaci.

---

## 7. Test plán

**Automated (Vitest):**
- `emotions.spec.ts` — type-aware paleta vrací správné sady; `tag → default valence` mapování; `valence → barva` (−3 červená, 0 šedá, +3 zelená).
- `campaignColors.spec.ts` — typ→token, status→styl hrany.
- `api.spec.ts` — query klíče, ownerId partitioning helper (PJ slějv → split per vrstva).
- `SubjectForm.spec.tsx` — validace (jméno required), tagy parse, submit.
- `RelationshipForm.spec.tsx` — type-aware paleta dle typů A/B, tag předvyplní valence, asymetrie A≠B, tajná pole jen PJ.
- `LayerSwitcher.spec.tsx` — PJ vidí hráče, hráč switcher nemá; read-only flag při cizí vrstvě.
- `DnesTab.spec.tsx` — render sekcí, empty states, klik→callback.
- `PavucinaGraph.spec.tsx` — mapování dat na nodes/links (mock force-graph), focus filtr (smoke; canvas se v jsdom plně nekreslí — testovat data transform + handlery).

**Manuální smoke:**
1. Hráč: vytvoř 5 subjektů (PC/NPC/ORG/FACTION/LOCATION) + 6 vztahů s různou valence → graf ukáže barvy/tloušťky.
2. Asymetrie: A „láska"(+3) → B, B „nenávist"(−3) → A → dvě různobarevné hrany.
3. Refresh → vše zůstává (persistence valence/emotionTag).
4. PJ: switcher → vidí hráčovu síť read-only (žádná tlačítka), `gmIntent` skrytý hráči / viditelný PJ.
5. Graf: 20+ uzlů, klik na hub → ego-síť čitelná; filtr „jen krize"; hledání → center.
6. Dnes: vztah do `crisis` → objeví se v sekci krize.
7. Mobil 375 px: taby, stack Subjekty, touch graf.

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Dopad | Mitigace |
|---|---|---|---|
| Schemaless `sideA`/`sideB` přece jen zahodí `valence`/`emotionTag` (toEntity po polích) | nízká | vysoký | **Persistence round-trip test PRVNÍ** (před UI); pokud drop → mini BE patch (interface+DTO+mapper, ~15 ř.) |
| Force graph perf při husté síti | nízká | střední | canvas render, `cooldownTicks`, štítky jen při zoom-in, focus/filtr redukuje viditelné |
| PJ omylem edituje hráčovu vrstvu (BE `canModify` to dovolí) | střední | nízký | FE read-only guard při `ownerId !== me`; čistě UX, data se nepoškodí (PJ je trusted) |
| `react-force-graph-2d` install padne na SSL | střední | nízký | `NODE_OPTIONS=--use-system-ca` (známý postup) |
| BE enum patch (STATE/OTHER) rozbije validaci jiných míst | velmi nízká | nízký | `type` je plain string bez enum constraintu; jen rozšíření `@IsIn` — žádný existující záznam neporuší; BE test create-with-STATE |
| Per-hráč dashboard dopočet klientsky se rozejde s BE | nízká | nízký | „Moje vrstva" používá BE `/dashboard`; per-hráč dopočet z týchž dat (malý objem) |

**Rollback:** revert `CampaignPage.tsx` na stub + smazat `src/features/world/campaign/` + odebrat dep. Žádné DB/BE změny (pokud se nesáhne na DTO) → rollback = jen FE diff.

---

## 9. Otázky k autorovi

Autor **delegoval** vizuální i většinu produktových voleb. Klíčová rozhodnutí (potvrzená nebo delegovaná):

- **Graf:** `react-force-graph-2d` (canvas), ne 3D, ne ruční SVG — kvůli čitelnosti emocí + hustotě. (rozhodl Claude, delegováno)
- **Vrstvy:** hráč = vlastní (edit), PJ = Moje + per-hráč read-only, přes FE partitioning dle `ownerId` (bez BE změny).
- **Emoce:** per-strana `valence` (−3..+3) + `emotionTag` z **type-aware** palety; tag předvyplní valence.
- **Rozsah:** 11.1 = Dnes + Subjekty + Vztahy + Síť. Storyliny (11.2) a Poznámky (11.3) jen jako čtená data / budoucí taby.

**Obě dříve otevřené otázky vyřešeny (autor: „chci"):**

1. ✅ **Státy** — `STATE` je plnohodnotný typ + `OTHER` catch-all (BE enum patch §4.2, ~2 ř.).
2. ✅ **„Kopírovat do mé vrstvy"** — ano, PJ kopíruje hráčův subjekt do své vrstvy (§4.5).

**PJ read-only na cizí vrstvu** řešíme jen **FE guardem** (BE editaci PJ technicky dovolí — trust guard, data se nepoškodí). Tvrdý BE zákaz = mimo rozsah (§5).

---

**Po schválení specu napíšu implementační plán** (`plan-11.1.md` — přesné pořadí, file diffy, CLI).
