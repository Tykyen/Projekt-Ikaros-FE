# Implementační plán — krok 11.2 Storyboard (strom scénářů)

**Datum:** 2026-06-01
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-11.2.md`](./spec-11.2.md)
**Větev:** `main` přímo (konvence projektu). **Git řeší autor ručně, já necommituji.**
**Repo:** **FE only** = `Projekt-ikaros-FE`. **Žádný BE zásah** (strom + metadata do existujícího schemaless `CampaignScenario.contentData`).

> **Pořadí dle rizika:** nejdřív datová vrstva + **round-trip pojistka** (spec §8 — že `contentData.storyTree` přežije BE GET; pokud ne, je to jediné místo, kde by hrozil mini BE patch — chceme to vědět hned). Pak FE odspodu: strom → editor → provázání → orchestrátor → stránka → finalizace. Žádné UI nestavíme dřív, než víme, že data drží.

---

## Step 1 — FE datová vrstva + round-trip pojistka

**Soubory (nové/rozšíření):**
- `src/features/world/campaign/scenarioMeta.ts` (nový) — `ScenarioStatus`, `ScenarioKind`, `ScenarioMeta`; `getMeta(scenario): ScenarioMeta` (parse `contentData.storyTree` + defaulty), `mergeMeta(scenario, patch): contentData` (read-merge-write, **nikdy útržek**), `buildTree(list): TreeNode[]` (ploché→strom dle `parentId`/`order`, cyklus-guard, osiření→root).
- `src/features/world/campaign/types.ts` (rozšíření) — `CampaignScenario` + `CreateScenarioInput` (BE-zrcadlo: `title`, `contentData?`, `order`, `linkedPageSlug?`, `subjectIds[]`, `storylineIds[]`, `images[]`, `isShared`).
- `src/features/world/campaign/api.ts` (rozšíření) — scenario hooky (vzor existujících subject/storyline hooků):
  - `useCampaignScenarios(worldId)` → GET `/campaign/scenarios?worldId=`
  - `useCreateScenario / useUpdateScenario / useDeleteScenario` (mutace + `invalidateQueries`)
  - `useReorderScenarios` — batch sekvenční PUT dotčených uzlů (každý přes `mergeMeta`), invalidace až po dokončení.
  - **update vždy posílá `contentData` zmergované přes `mergeMeta`** (ochrana proti `$set` přepisu, spec §3.1/§4.2).

**Testy:** `scenarioMeta.spec.ts` — `getMeta` defaulty (prázdný storyTree), `mergeMeta` zachová neměněná pole (status-change nemaže body), `buildTree` (hierarchie, order, cyklus→fallback, osiření).

**Round-trip pojistka (spec §8, KRITICKÉ — dělat hned):**
- Při běžícím BE: vytvoř scénář s plným `contentData.storyTree` (parentId+status+body+gmNotes+mapSceneIds+bestieIds) přes dočasný skript/UI → GET zpět → ověř, že **všechna pole drží**.
- ✅ drží → pokračuj (čistě FE krok).
- ❌ drtop → mini BE patch `campaign-scenario.repository.ts` `toEntity` (passthrough `contentData`, ~0–3 ř.) + `jest campaign`; samostatný commit autora (memory: BE `prettier --write` + `jest` ručně). *(Čtení kódu naznačuje, že drží — `toEntity` mapuje `contentData` celé — ale ověřujeme runtime.)*

**Příkazy:**
```bash
# v Projekt-ikaros-FE
npx tsc -b --noEmit
npx vitest run src/features/world/campaign
```

**Acceptance:** typecheck čistý; `scenarioMeta` testy zelené; **round-trip potvrzen** (storyTree přežije GET).

---

## Step 2 — FE: Strom scénářů + tokeny

**Soubory (nové, `components/`):**
- `storyboard.tokens.css` — odvozené tokeny (status glow, thread gradient), **scoped na `.storyboard-root`**, jen `var()`+`color-mix` (memory: žádný globální/skin edit).
- `ScenarioTree.tsx` — rail: render `buildTree`, svislé „vlákno" (§4.11), `+ Scéna` / `+ Složka` (na root i pod uzel), kebab (přejmenovat / smazat s `ConfirmDialog` + osiření / „přidat větev"), výběr uzlu (lift state do orchestrátoru).
- `ScenarioTreeNode.tsx` — 1 uzel: ikona dle `kind` (📁/🎬), glow tečka dle `status`, `branchLabel` štítek, dnd handle.
- **Drag-reorder + re-parent (plně):** drag mění `order` (sourozenci) i `parentId` (přetažení pod uzel); záloha „přesunout pod…" v kebabu (mobil/přístupnost). Batch PUT přes `mergeMeta`.

**Testy:** `ScenarioTree.spec.tsx` — render hierarchie, `+ scéna` pod uzlem, smazání + osiření (žádný zmizelý uzel), `branchLabel` render.

**Acceptance:** strom renderuje hierarchii; vytvoření/smazání/přesun funguje; testy zelené.

---

## Step 3 — FE: Editor scénáře

**Soubory:**
- `ScenarioEditor.tsx` — `title` (inline edit), `status` select, `branchLabel` (jen má-li rodiče); **`RichTextEditor`** pro `body` (reuse z Pages); **tajná PJ zóna** (`gmNotes` RichText + `objective` + `outcome`) renderovaná jen `viewerRole >= PJ` (§4.5/§4.11 „za oponou"); **galerie `images[]`** (reuse upload pattern z Pages galerie — náhledy + přidat/odebrat); **explicit „Uložit" + dirty indikátor** + varování při odchodu; uložení přes `mergeMeta` (status-change nesmí smazat body).
- folder (kind=folder): zjednodušený editor (title + status + popis, bez map/provázání scény).

**Testy:** `ScenarioEditor.spec.tsx` — tajná pole jen PJ; dirty guard; status change zachová body (merge); galerie add/remove.

**Acceptance:** editace + uložení + refresh drží; tajná pole skrytá hráči; merge nepřepisuje.

---

## Step 4 — FE: Provázání (6 sekcí)

**Reuse ověřeno:** `PagePicker`, `usePagesDirectory` (všechny typy), `useBestiar(worldId, systemId)`, `useSubjectImages`, storyline list (11.2a). **Ověřit MapScene list hook** — pokud chybí lehký list scén světa, doplnit minimální GET (FE-only).

**Soubory:**
- `ScenarioLinksPanel.tsx` — 6 sekcí (spec §4.5):
  1. 📍 Místo — `PagePicker` single → `linkedPageSlug`.
  2. 📄 Wiki stránky — multi nad `usePagesDirectory`, **filtr typu** (PC/NPC/Noviny/Lokace/…) + badge typu → `pageSlugs[]`.
  3. 🐉 Bestiář — `useBestiar(worldId, world.system)`; skrýt bez `world.system` → `bestieIds[]`.
  4. 🗺 Mapy — vyhledávač MapScene → `mapSceneIds[]`, chip → odkaz na mapu.
  5. 👥 Subjekty — vyhledávač subjektů (avatar `useSubjectImages`) → `subjectIds[]`.
  6. 🧵 Linky — vyhledávač storylin → `storylineIds[]`.
  - Všechny změny přes `mergeMeta` (meta) / first-class pole; chip → odkaz na cíl; prázdná sekce = duch-placeholder.

**Testy:** `ScenarioLinksPanel.spec.tsx` — add/remove napříč sekcemi, stránky filtr dle typu, bestiář skrytý bez `world.system`, chip odkazy.

**Acceptance:** všech 6 sekcí funguje; provázání drží po refreshi; chipy odkazují správně.

---

## Step 5 — FE: Orchestrátor + Síť + vrstvy

**Soubory:**
- `StoryboardView.tsx` — `useWorldContext`, load scénářů, 2-panel layout (strom + editor), layer switch (reuse `LayerSwitcher` z 11.1 — PJ Moje | hráči read-only), výběr uzlu napříč pohledy.
- `ScenarioNetworkLink.tsx` — „Zobrazit v síti" → přepne na Pavučinu (`PavucinaGraph`) s předaným filtrem (`storylineIds`+`subjectIds` scénáře). Pokud filtr-prop chybí → drobné rozšíření props `PavucinaGraph` (volitelný `initialFilter`), ne přepis.
- `index.ts` — export `StoryboardView`.

**Acceptance:** orchestrátor drží výběr; PJ vrstvy read-only; „v síti" předfiltruje Pavučinu.

---

## Step 6 — FE: napojení stránky + responzivita + vizuál

**Soubory:**
- `src/features/world/pages/StorylinesPage.tsx` — přepsat stub → `<StoryboardView/>` uvnitř `.storyboard-root` (tokeny). Route + nav už existují (ověřeno), neměním.
- `*.module.css` — vizuální směr §4.11 (vlákno, glass editor, tajná zóna, staggered load); responzivita: desktop 2-panel; tablet strom drawer; **mobil ≤ 768** strom → editor stack (`← zpět`), provázání sbalitelné, RichText toolbar scrollovatelný.

**Skill:** `mobil-desktop` audit po úpravě UI.

**Acceptance:** `/svet/:slug/scenare` renderuje plný Storyboard; mobil 375 px ovladatelný.

---

## Step 7 — Finalizace

**Příkazy:**
```bash
# v Projekt-ikaros-FE
npm run lint
npm run lint:colors
npm run test:run
npm run build
```
**Skill:** `napoveda` — Scénáře/Storyboard z „SOON" do „OK" (WORLD_PAGES); popsat strom, editor, provázání (stránky/bestiář/mapy/subjekty/linky).

**Acceptance:** vše zelené; nápověda aktualizovaná; roadmap 11.2b–e zaškrtnuto.

---

## Závěrečný checklist

- [ ] **Round-trip:** `contentData.storyTree` přežije BE GET (jinak mini BE patch toEntity)
- [ ] **Merge-write:** úprava jednoho pole nepřepíše zbytek contentData (test ✓)
- [ ] FE: `npm run build` ✓
- [ ] FE: `npm run lint` + `lint:colors` ✓ (žádné hardcoded barvy)
- [ ] FE: `npm run test:run` ✓ (testy dle spec §7)
- [ ] Provázání: stránky (PC/NPC/Noviny/Lokace) + bestiář + mapy + subjekty + linky
- [ ] Galerie obrázků scény + drag re-parent **hotové** (žádné dluhy)
- [ ] Smoke: strom (akt→scéna→větev), editor (RichText+tajné PJ+galerie), refresh drží, mobil
- [ ] `mobil-desktop` + `napoveda` skill spuštěny
- [ ] **Žádné dluhy** — vše ve scope dodáno kompletně (spec §5); hranice jiných systémů (spawn na mapu = 10.x) nejsou dluh
- [ ] Commit: **autor ručně** po logických celcích

---

## Commit strategie (pro autora)

1. FE datová vrstva (Step 1) — `scenarioMeta` + api + types.
2. FE strom (Step 2).
3. FE editor + provázání (Step 3–4).
4. FE orchestrátor + síť (Step 5).
5. FE stránka + responzivita + finalizace (Step 6–7).

Každý celek samostatně revertovatelný. (Pokud round-trip vynutí BE patch → samostatný commit v `Projekt-ikaros` před FE.)
