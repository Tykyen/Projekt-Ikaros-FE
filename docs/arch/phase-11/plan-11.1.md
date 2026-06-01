# Implementační plán — krok 11.1 Pavučina

**Datum:** 2026-06-01
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-11.1.md`](./spec-11.1.md)
**Větev:** `main` přímo (konvence projektu — žádné feature větve). **Git řeší autor ručně, já necommituji.**
**Repa:** BE = `Projekt-ikaros/backend`, FE = `Projekt-ikaros-FE`.

> **Pořadí dle rizika:** nejdřív BE patch + ověření persistence (pojistka spec §8), pak FE odspodu (data → CRUD → dashboard → graf → stránka). BE a FE **nikdy v jedné paralelní dávce** (memory: selhání zruší zbytek).

---

## Step 1 — BE patch: STATE/OTHER typ + valence/emotionTag passthrough

**Repo:** `Projekt-ikaros/backend`. Vlastní commit (autor).

**Soubory:**
- `src/modules/campaign/interfaces/campaign-subject.interface.ts`
  `CampaignSubjectType` union `+ | 'STATE' | 'OTHER'`.
- `src/modules/campaign/dto/create-campaign-subject.dto.ts:16`
  `@IsIn(['PC','NPC','LOCATION','ORG','FACTION','STATE','OTHER'])`.
- `src/modules/campaign/interfaces/campaign-relationship.interface.ts`
  `RelationshipSide` `+ valence?: number; emotionTag?: string;`.
- `src/modules/campaign/dto/create-campaign-relationship.dto.ts` (`RelationshipSideDto`)
  `+ @IsOptional() @IsNumber() @Min(-3) @Max(3) valence?: number;`
  `+ @IsOptional() @IsString() emotionTag?: string;`.
- **`src/modules/campaign/repositories/campaign-relationship.repository.ts` `toEntity` (:85–96)** — **jádro fixu**: do `sideA` i `sideB` přidat
  `valence: sideA.valence as number | undefined,`
  `emotionTag: sideA.emotionTag as string | undefined,` (a totéž pro `sideB`).
- **Ověřit** `campaign.service.ts` `updateRelationship` — že stranu spreaduje (`{ ...dto.sideA }`), ne přestavuje po polích (create už spread má, `:310–311`). Pokud rebuild → opravit na spread.

**Testy** (`campaign.service.spec.ts`):
- relationship: create se `sideA.valence=-3, emotionTag:'nenávist'` → `findRelationshipById`/`findRelationships` vrací **obě pole** (round-trip — chrání proti toEntity dropu).
- subject: create s `type:'STATE'` projde validací; `type:'OTHER'` projde.

**Příkazy:**
```bash
# v Projekt-ikaros/backend
npx prettier --write src/modules/campaign/interfaces/campaign-subject.interface.ts src/modules/campaign/dto/create-campaign-subject.dto.ts src/modules/campaign/interfaces/campaign-relationship.interface.ts src/modules/campaign/dto/create-campaign-relationship.dto.ts src/modules/campaign/repositories/campaign-relationship.repository.ts src/modules/campaign/campaign.service.spec.ts
npm run typecheck && npm run lint:check
npx jest campaign
```
> Memory: BE precommit hook = typecheck+lint (NE testy) → `prettier --write` + `jest` pouštím ručně, jinak tichý DI/mock drift projde.

**Acceptance kroku:** `jest campaign` zelené; round-trip test potvrzuje, že GET vrací `valence`+`emotionTag`. BE běží (`nest start --watch`) s novým bundlem (memory: bez restartu drží starý).

---

## Step 2 — FE základ: types + api + emotions + colors

**Repo:** `Projekt-ikaros-FE`. Od tohoto kroku dál vše FE.

**Soubory (nové):**
- `src/features/world/campaign/types.ts` — FE zrcadlo BE: `CampaignSubject` (7 typů), `CampaignRelationship` se `sideA/sideB` vč. `valence`/`emotionTag`, `CampaignStoryline` (read), `CampaignDashboard`, `CampaignPlayer`.
- `src/features/world/campaign/emotions.ts` — type-aware paleta:
  `EMOTIONS_PERSON[]`, `EMOTIONS_ORG[]` (org/faction/state), `EMOTIONS_MISC[]`; `emotionsFor(typeA, typeB)`; `TAG_DEFAULT_VALENCE: Record<string,number>`; `valenceColor(v): string` (−3 červená → 0 šedá → +3 zelená přes CSS token mix).
- `src/features/world/campaign/campaignColors.ts` — `TYPE_TOKEN: Record<type, cssVar>`, `STATUS_EDGE_STYLE: Record<status,{dash,pulse,opacity}>`.
- `src/features/world/campaign/api.ts` — TanStack Query (vzor `currencies/api.ts`):
  - query keys `campaignKeys(worldId)`
  - `useCampaignSubjects/Relationships/Storylines/Dashboard/Players(worldId)` (GET, `?worldId=`)
  - `useCreate/Update/DeleteSubject`, `…Relationship` mutace (optimistic + `invalidateQueries`)
  - `partitionByOwner(items, players, myUserId)` helper → `{ mine, byPlayer: Map }` (vrstvy)
- `src/features/world/campaign/campaign.tokens.css` — definice `--cmp-pc/npc/faction/org/state/location/other` + valence škála, **scoped na `.campaign-root`** (memory: žádné globální theme edity).

**Testy:** `emotions.spec.ts` (paleta dle typů, tag→valence, valence→barva), `campaignColors.spec.ts`, `api.spec.ts` (`partitionByOwner`).

**Příkazy:**
```bash
# v Projekt-ikaros-FE
npx tsc -b --noEmit
npx vitest run src/features/world/campaign
```

**Acceptance:** typecheck čistý, nové unit testy zelené.

---

## Step 3 — FE: instalace `react-force-graph-2d`

**Příkaz:**
```bash
# v Projekt-ikaros-FE
$env:NODE_OPTIONS="--use-system-ca"; npm install react-force-graph-2d
```
> Memory: FE npm padá na SSL bez `--use-system-ca`.

**Acceptance:** instalace projde, `npm run build` stále ✓, dep v `package.json`.

---

## Step 4 — FE: Subjekty tab (CRUD + vrstvy + kopie)

**Soubory (nové, `components/`):**
- `CampaignView.tsx` — orchestrátor: `useWorldContext`, load dat (api), **layer switch** (PJ: Moje | hráči), **tab registry** (`dnes|subjekty|sit`), drží výběr napříč taby.
- `LayerSwitcher.tsx` — PJ+ dropdown účtů; hráč nevidí. `readOnly` flag když `ownerId !== userId`.
- `SubjektyTab.tsx` — 3-panel layout.
- `SubjectRail.tsx` — hledání + filtr typu (chipy) + seznam (avatar/jméno/typ-badge) + `+ Subjekt`.
- `SubjectForm.tsx` — jméno, **7 typů**, status, tagy, `linkedPageSlug` (+ slug vyhledávač zjednodušený), `linkedCharacterSlug`, PJ poznámka.
- `SubjectDetail.tsx` — detail + odkaz na stránku/postavu + akce: Upravit / Smazat / **📋 Kopírovat do mé vrstvy** (jen PJ při read-only cizí vrstvě).
- `RelationshipCard.tsx` — karta vztahu (obě strany, valence-badge, strength-pips, status).
- `RelationshipForm.tsx` — A (předvyplněn) → B (vyhledávač), status, priorita; per strana: `emotionTag` (select dle `emotionsFor`), `valence` (slider, předvyplněn z tagu), `strength` (1–10), `behavior`, `gmIntent` (PJ); sdílené `whatHappened` + `behindTheScenes` (PJ).
- `RelationshipDetail.tsx` — detail, tajná pole jen PJ, `lastChangeNote`.

**Guardy:** `viewerRole >= WorldRole.PJ` pro tajná pole; `readOnly` (cizí vrstva) skryje všechny edit/add/delete/uloží; copy jen v read-only PJ pohledu.

**Avatar:** bulk-resolve z linked stránek (port pattern, ne N+1) — pokud zdroj obrázků není v 11.1 dostupný, fallback na písmeno (avatar resolve označit jako lehký, neblokující).

**Testy:** `SubjectForm.spec.tsx`, `RelationshipForm.spec.tsx` (type-aware paleta, tag→valence prefill, A≠B, tajná pole jen PJ), `LayerSwitcher.spec.tsx`.

**Acceptance:** smoke — hráč vytvoří subjekty + vztahy; PJ přepne na hráče = read-only; kopie funguje. Testy zelené.

---

## Step 5 — FE: Dnes dashboard

**Soubory:** `DnesTab.tsx` — 4 sekce (krize / aktivní linky / připnuté / poslední změny). „Moje vrstva" čte `useCampaignDashboard`; per-hráč pohled dopočítá klientsky z filtrovaných listů. Klik → skok na tab + výběr. Prázdné = empty state.

**Test:** `DnesTab.spec.tsx` (render, empty, klik→callback).

**Acceptance:** krizový vztah se objeví v sekci; navigace funguje.

---

## Step 6 — FE: Pavučina (force graph)

**Soubory:**
- `PavucinaGraph.tsx` — wrapper nad `react-force-graph-2d`:
  - data transform `subjects/relationships → { nodes, links }`; dvě links per vztah (A→B, B→A) se samostatnou valence-barvou.
  - `nodeCanvasObject` — kruh barvy dle typu (token), label při `globalScale > práh`, storyline-dots (až budou data).
  - `linkCanvasObject` — barva dle valence strany, tloušťka dle `strength`, styl dle status (dash/pulse), mírné zakřivení (`curvature`) aby obě hrany byly vidět.
  - **focus mód** (klik → ego-síť, zbytek opacity ~0.15), **filtry** (typ, valence: jen krize / jen pozitivní), **hledání → center**, pan/zoom/drag/pin, dvojklik → tab Subjekty.
- `GraphLegend.tsx` — typy + valence škála.

**Test:** `PavucinaGraph.spec.tsx` — data transform (N vztahů → 2N links), focus filtr, handlery (force-graph mockován; canvas v jsdom nekreslíme).

**Acceptance:** graf renderuje ≥ 40 uzlů plynule; focus/filtr/hledání fungují.

---

## Step 7 — FE: napojení stránky + responzivita

**Soubory:**
- `src/features/world/pages/CampaignPage.tsx` — přepsat stub → `<CampaignView/>` (uvnitř `.campaign-root` wrapper kvůli tokenům). Route + nav už existují (ověřeno), neměním.
- `*.module.css` — responzivní: desktop 3-panel; tablet 2-panel (detail = drawer); mobil ≤ 768 stack navigace + graf full-screen, karty místo tabulek.

**Skill:** `mobil-desktop` audit po úpravě UI.

**Acceptance:** `/svet/:slug/pavucina` renderuje plnou Pavučinu; mobil 375 px ovladatelný.

---

## Step 8 — Finalizace

**Příkazy:**
```bash
# v Projekt-ikaros-FE
npm run lint
npm run lint:colors
npm run test:run
npm run build
```
**Skill:** `napoveda` — Pavučina z „SOON" do „OK" (WORLD_PAGES); popsat vztahy/vrstvy/graf.

**Acceptance:** vše zelené, nápověda aktualizovaná.

---

## Závěrečný checklist

- [ ] BE: `jest campaign` zelené, round-trip valence/emotionTag ✓, STATE/OTHER validace ✓
- [ ] FE: `npm run build` ✓
- [ ] FE: `npm run lint` + `lint:colors` ✓ (žádné hardcoded barvy)
- [ ] FE: `npm run test:run` ✓ (nové testy dle §7 specu)
- [ ] Smoke: hráč CRUD vrstvy; PJ per-hráč read-only + kopie; graf focus/filtr; mobil
- [ ] `mobil-desktop` + `napoveda` skill spuštěny
- [ ] `dluhy.md` — pokud něco odloženo (avatar resolve, copy vztahu), zaznamenat skillem `dluh`
- [ ] Commit: **autor ručně** (BE patch zvlášť, FE po logických celcích)

---

## Commit strategie (pro autora)

1. BE patch (Step 1) — samostatný commit v `Projekt-ikaros`.
2. FE foundation (Step 2–3).
3. FE Subjekty (Step 4).
4. FE Dnes + Graf (Step 5–6).
5. FE stránka + responzivita + finalizace (Step 7–8).

Každý celek samostatně revertovatelný.
