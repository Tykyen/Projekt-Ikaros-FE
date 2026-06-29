# Chybový deník — oblast `fe` (frontend)

Detailní záznamy pro frontend (komponenty, hooky, timing, render). Index v [`README.md`](README.md).

---

### CH-038 — skin systému = jen deník + skin soubory; vynechal jsem cross-surface embed enumerace (dice log/readout) · 2026-06-29
**Kontext:** 8.7s dnd5e = JaD twin vč. 8 skinů. Naklonoval jsem `jad-skins/*`→`dnd5e-skins/*` + deníkové CSS a prohlásil skiny za hotové.
**Co jsem udělal špatně:** Skin se do EMBEDŮ (dice log, dice readout, combat/bestie panel plocha) NEpromítá přes skin soubory, ale přes **enumerovaný `:is([data-diary-system='drd16'],[drdplus],[drd2],[jad]) .panel { background: var(--dd-embed-surface) }`** v `DiceLogPanel.module.css` + `DiceRollOverlay.module.css` a přes **baseline `[data-diary-system='jad'] { --dd-* }` blok** v `diary-skins.css`. Tyto jsou MIMO skin soubory → klon skinů je nepokryl → **dnd5e v enumeraci chyběl** → skin se neprojevil na mapě/hodech/dicelog (uživatel: „to vůbec nemáš").
**Proč to nefungovalo:** token sady skinu existovaly, ale konzument (embed plocha) je aktivuje jen pro VYJMENOVANÉ systémy; dnd5e nebyl v seznamu.
**Poučení:** Skin ≠ deník. Při novém systému se skiny: `grep "data-diary-system='jad'"` napříč **VŠEMI .module.css + diary-skins.css** a přidej nový systém do KAŽDÉHO `:is()` + zkopíruj baseline `--dd-*` blok. Cross-surface konzumenti = DiceLogPanel, DiceRollOverlay, (railShell/TokenInfoPanel/MapPjPanel dle systému), diary-skins baseline.
**Příznak cyklení:** uživatel hlásí „skin se neprojevuje na mapě/dicelog" po „dokončení" systému. **RODINA [CH-032](#ch-032--cross-surface-embedy-hodydicelogreadouttoken-chromeorchestrace-vynechány-při-grafickém-průchodu-systému-drdplus-162d--2026-06-27)** (drdplus měl tentýž problém) — podruhé = STOP, dělej embed-paritu hned při klonu systému.

---

### ✅ ŘEŠENÍ — 8.7s D&D 5e = ÚPLNÉ dvojče JaD (deník+mapa+chat+bestie+8 skinů) přes sed klon · 2026-06-29
**Co nakonec zabralo:** Uživatel po pár kolech upřesnil: *„celý systém JaD je to samé jako D&D 5e, jediný rozdíl je v zázemí a povolání."* → místo úpravy vlastního dnd sheetu jsem naklonoval **CELÝ JaD systém** mechanickým `sed`em (`jad_`→`dnd_`, `.jad-`→`.dnd-`, `[data-diary-system='jad']`→`'dnd5e'`, `Jad`→`Dnd`, `JAD_`→`DND_`, `jadf`→`dndf` u skinů) napříč: deník (JadSheet+jad.css), 8 skinů (jad-skins), combat panel PC (mapa+chat), bestie (schémata+panel+chat+combat-actions). Obsahově odlišné jen `constants.ts` (DND_CLASSES/BACKGROUNDS, ruční) + warlock 2-osý select + wiring (TokenSystemSheet/BestieInstancePanel/BestieRollPanel dnd5e větve, diary-skins @importy, skin default).
**Proč to je správně (a ne další variace):** sed klon je deterministický a rychlý pro ~25 souborů; ruční přepis 1300ř deníku = chybové. Po každém klonu grep na zbytky `jad` (0). **Kritické rozhodnutí:** combat/bestie panely sdílí s deníkem `dnd_*` klíče → musel jsem přepsat i starý DndCombatPanel z JaD modelu (jinak desync se starými `attacks`/`ability_*`/`deathSuccess`).
**Jak ověřeno:** build čistý (2×), ESLint čistý, dotčené oblasti 207/207 (plný suite běží), `export-schemas` 23 schémat → BE.
**Zhodnocení:** Zabralo; klíčové bylo NEhádat rozsah — 3× jsem ho zúžil/rozšířil podle upřesnění uživatele (deník → +bestie → +combat → celý twin +skiny). **Past chycená:** dřív jsem chtěl zploštit warlock 2 osy kvůli „strukturní identitě"; uživatel opravil, že 2 osy = součást „povolání" → ponechány. **Vlastní chyba (drobná):** zapomněl jsem do prvního sed klonu zahrnout `DndSheet.spec` → stará 8.7s verze padala (11 testů); doklonoval z JaD spec + doladil D&D data (Žoldnéř/Šampión/s2). Past: při klonu systému neopominout VŠECHNY par:soubory vč. speců.

---

### ✅ ŘEŠENÍ — 8.7s D&D 5e deník: multipovolání + obory + přidávatelné sekce · 2026-06-29
**Co nakonec zabralo:** Port JaD 8.7p vzoru na dnd5e deník (z 8.7d 1:1 legacy): `dnd_classes` JSON multipovolání + obory s prahovou úrovní odemčení, zázemí `<select>`+vlastní, auto-úroveň badge (`Σ l`), přidávatelné `dnd_profs`/`dnd_langs`/`dnd_feats` místo textarea, poznámky dole. **Černokněžník = 2 osy** (patron+pakt) → rozšíření modelu `DndClassDef` o volitelné `sub2`/`list2`/`label2` + pole `s2` v řádku; **Totemový/Kruh země vypsané jako kombinace** v listu oboru (0 změn modelu). Zachován vlastní dnd vzhled + D&D specifika (osobnost Rysy/Ideály/Pouta/Vady, death-pipy, spell-tab).
**Proč to je správně (a ne další variace):** (1) Reuse osvědčeného JaD vzoru (cdAccess delta-merge, derive-* migrace read-only) = 0 BE změn, žádný data-loss starých `dnd_classLevel`/`otherProf`/`features`. (2) 2. osa jako **volitelná** pole modelu → ostatní povolání mají 1 select, jen Černokněžník 2 (žádný hack/flatten). (3) Auto-caster ODVOZENÝ stav (`spRaw===''&&hasCaster`), ruční `0/1` přebíjí — ne side-effect zápis v renderu.
**Jak ověřeno:** `npm run build` čistý, ESLint čistý, **32/32** dnd5e testů + **205/205** celý diary-systems; strukturální mobil-desktop audit (grid 3→1, identity 4→2 sloupce, prof-row stack ≤600px, žádný horizontální scroll).
**Zhodnocení:** Zabralo napoprvé, 0 cyklení (prototyp=vzor JaD=kontrakt). Drobná **test-chyba**: použil jsem `rerender` u testu „Vlastní zázemí", ale `bgCustom` se inicializuje z `useState` jen při mountu → stará hodnota → rozdělil na 2 čerstvé mounty (komponenta byla OK, ne kód). **Past pro příště:** stav odvozený z props v `useState` initializeru nelze testovat přes `rerender` (jen fresh `render`). Čeká: živý mobil-desktop na zařízení + `funkce`/`napoveda` po živé kontrole + commit.

---

### ✅ ŘEŠENÍ — 16.2e chat DrD2 bestie panel + PC NPC zdarma · 2026-06-28
**Co nakonec zabralo:** PC/NPC deník v chatu = **ZDARMA** (`DiaryRollPanel` bere `COMBAT_PANELS['drd2']`=Drd2CombatPanel, single source — drd2 registrovaný už v kroku 4 → 0 práce). Bestie chat = `Drd2ChatBestiePanel.tsx` (reuse jádro `Drd2BestieCombatActions` + CSS z mapy, vzor `DrdPlusChatBestiePanel`) + branche v `BestieInstancePanel` (instance, edit) + `BestieRollPanel` (katalog, read-only).
**Proč to je správně (a ne další variace):** (1) Chat deník systémově agnostický (COMBAT_PANELS registry) → PC/NPC zdarma. (2) **Sudba HP v chatu žije v `systemStats.sudba`/`sudba_cur`** — combatant NEMÁ `token.currentHp` jako mapa, takže HP track vlastní v panelu (ne reuse mapové Sudby). (3) Combatant systemStats je VOLNÝ (žádná BE strict validace jako mapa token) → bez sanitize.
**Jak ověřeno:** `npm run build` + eslint. Vizuál čeká deploy.
**Zhodnocení:** Zabralo napoprvé, reuse jádra (vzor=kontrakt), 0 cyklení. **Past:** chat bestie HP ≠ mapa (systemStats vs token.currentHp — dvojí instance, OK); PC/NPC chat je zdarma, jakmile je per-system combat panel registrovaný v `COMBAT_PANELS`.

---

### ✅ ŘEŠENÍ — 16.2e bestie DrD2 statblok + schéma + bestiář · 2026-06-28
**Co nakonec zabralo:** `Drd2BestiePanel` + `Drd2BestieCombatActions` (sdílené jádro mapa↔chat, vzor DrdPlus) dle prototypu (`c:/tmp/drd2-bestie-audit.html`). Model: **Sudba = HP (damageable)**, Hranice T/D/V reference (nehází), **Charakteristiky klik = 2k6 + úroveň**, ZS poznámky, inline edit. Schéma `drd2/bestie.json` rozšířeno (sudba damageable + charakteristiky/ZS list) → bestiář editor (generic `EntitySchemaForm`) + spawn HP automaticky.
**Proč to je správně (a ne další variace):** (1) Sudba má `combatBehavior:'damageable'` v bestie.json → `buildBestieToken` čte klíč `sudba` (schema-aware, ne hardcoded `health.max`) → token currentHp/maxHp. (2) **Edit `token.systemStats` jde přes BE strict validaci proti `drd2:token` → MUSEL jsem rozšířit i `drd2/token.json`** o sudba/telo/duse/vliv/charakteristiky/zvlastni_schopnosti (jinak `sanitize` dropne / BE 400 — rodina CH drd16 „nutné <system>:token schéma"). (3) `export-schemas` → 21 schémat do `backend/assets/schemas` → BE restart nutný.
**Jak ověřeno:** `npm run build` + 6 testů (`performSheetRoll` reálný, registr v beforeEach) + eslint + export-schemas OK. Vizuál + BE restart čeká.
**Zhodnocení:** Zabralo napoprvé, prototyp=kontrakt (pošesté), 0 cyklení. **Past pro budoucí systémy:** per-system bestie = rozšířit OBĚ schémata (`bestie` pro editor/spawn I `token` kvůli BE strict validaci editu na mapě); damageable key v bestie.json řídí HP přes buildBestieToken automaticky.

---

### ✅ ŘEŠENÍ — 16.2e mapa DrD2 combat panel + embedy dicelog readout obal · 2026-06-28
**Co nakonec zabralo:** `Drd2CombatPanel` (+`.module.css`) přepsán z generického Matrix portu na fantasy pergamen dle prototypu (`c:/tmp/drd2-mapa-audit.html`), vzor `DrdPlusCombatPanel` (debounced `useUpdateCharacterDiary`, `canEdit` gate). Single source s deníkem (`makeCdAccess('drd2_')`). Povolání = klik na celý řádek → `2d6+` + úroveň; iniciativa `2d6+` bez mod. Vždy viditelné: zdroje/Ohrožení-Výhoda/stavy/povolání; rozevírací: zbraně+ZS read-only, pomocníci+rituály edit.
**Proč to je správně (a ne další variace):** (1) Starý panel četl ZASTARALÁ pole (`comp_*`, `master_abilities`, `race_ability`) → nový čte NOVÝ model deníku (companions/rituals/special_abilities) = single source neporušen. (2) Embed callsite (`DiceLogPanel`/`DiceRollOverlay.module.css`) je PLNĚ tokenizovaný na `--dd-embed-*` → stačilo přidat `drd2` do `:is([drd16],[drdplus])` + definovat drd2 `--dd-embed-*` SVĚTLÉ (pergamen) v `diary-skins.css` (global bundle, ne lazy — past CH-027/028) + per-skin signature. (3) Povolání řádek = `div role=button` (ne `<button>`), protože uvnitř jsou pip-buttony (button-in-button = nevalidní HTML); pipy `stopPropagation`.
**Jak ověřeno:** `tsc -b` + `npm run build` + 7 testů (přepsány) + eslint. Vizuál čeká deploy.
**Zhodnocení:** Zabralo napoprvé, prototyp=kontrakt (popáté), 0 cyklení. Past pro budoucí systémy: per-system combat panel MUSÍ číst stejný `customData` model jako redesignovaný deník (jinak rozjezd dat); embed = jen `:is()` + světlé/tmavé `--dd-embed-*` dle polarity skinu.

---

### ✅ ŘEŠENÍ — 16.2e deník DrD2 reálný list fantasy pergamen jeden list · 2026-06-28
**Co nakonec zabralo:** Existující DrD2 deník (8.7h adaptace z Matrixu, generický „Dark Forest Emerald HUD") přepsán dle šablony 16.2 krok 3 na fantasy pergamenový **jeden sloučený list** (bez tabů). Postup prototyp→souhlas→kód: standalone HTML (`c:/tmp/drd2-denik-audit.html`) iterativně laděn s uživatelem (5 kol drobností) = vizuální kontrakt, AŽ PAK produkce. Rozsah dle uživatele: VEN Vybavení/Příběh/Původ/Groše/Suroviny; rituály+pomocníci = seznamy add/remove; ZS **ručně**. Soubory: `Drd2Sheet.tsx` přepsán, `drd2.css` fantasy pergamen, `drd2Professions.ts` NOVÝ.
**Proč to je správně (a ne další variace):** (1) **ALTAR katalog ZS** (`drd2Abilities.ts`, 264 schopností z příruček) = autorskoprávní riziko → uživatel chce v budoucnu licenci s ALTARem → **odpojit od UI, NEmazat** (ponechat „k ruce"). (2) Seznamy povolání (názvy + `requires` = herní fakta, ne chráněný text) odděleny do `drd2Professions.ts`, takže sheet vůbec neimportuje chráněný katalog. (3) Prototyp jako kontrakt zabránil cyklení na vzhledu (rodina CH-015 — necommitnuté změny × prod feedback).
**Jak ověřeno:** `tsc -b` + `npm run build` + 13 testů (`Drd2Sheet.spec` přepsán) + `eslint --fix` — vše zelené. `mobil-desktop` = statická CSS analýza (breakpointy 1024/768, tabulka overflow-x, twocol→1fr, touch-targety zvětšeny na mobilu); vizuál čeká reálný deploy.
**Zhodnocení:** Zabralo napoprvé, bez cyklení (prototyp=kontrakt počtvrté — po Matrixu/drd16/drdplus). **Past chycená v testech:** RTL `getByText('Základní povolání')` prošlo i u `<h3><span>❖</span>Základní povolání <em>(…)</em></h3>`, protože `getByText` matchuje jen **přímé text-nody** elementu (glyph span a em jsou vnořené elementy, nepočítají se). Zbývá zbytek šablony 16.2 pro drd2: combat panel `Drd2CombatPanel` redesign, bestie, 7 skinů, pak funkce/napoveda (uzávěr systému).

---

### CH-034 — drdplus skiny se nebundlovaly (@import za style-rule); sváděl jsem to na cache/deploy · 2026-06-27
**Kontext:** 8 drdplus deníkových skinů hotových, render-proof zdrojových souborů (přímý `<link>` na `drdplus-skins/scifi.css`) ukázal, že CSS funguje. Ale na live (a po čase i lokálně) se drdplus deník **neměnil žádným skinem** — pořád pergamen, ač picker ukazoval vybraný skin.
**Co jsem udělal špatně:** ~5 kol jsem příčinu hledal na **uživatelově straně** — service worker cache, „Clear site data", FE deploy timing, BE 404, re-deploy, CDN — místo abych stáhl a zkontroloval **reálný build output**. Render-proof testoval ZDROJOVÉ CSS, ne zbundlovaný `DiaryTab.css`, takže minul, že bundler importy zahazuje. Uživatel správně tušil „je to na tvé straně" a já to opakovaně sváděl na jeho prohlížeč.
**Proč to nefungovalo (kořen):** CSS spec — `@import` musí předcházet **všem** style rules. Drdplus `@import`y jsem v `diary-skins.css` umístil **ZA** blok `[data-diary-system='drd16'] {…}` → neplatné `@import` → postcss/bundler je **tiše zahodil** (build NEselhal). Drd16 importy byly nahoře (před pravidly) → OK, proto drd16 skiny fungovaly a drdplus ne. Výsledek: `dp-sheet` 0× v nasazeném i lokálním `DiaryTab-*.css`; deploy věrně nasazoval rozbitý build (stejný hash lokálně i na serveru = důkaz, že deploy je OK a chyba je v buildu). Fix = přesun drdplus `@import`ů nahoru k drd16-skins, před jakékoli pravidlo.
**Poučení:** (1) Když „CSS/skin se nemění po deployi + clear-cache", **stáhni reálný nasazený asset** (`curl` chunk → `grep` selektor) a změř — nehádej cache. Shoda hashe lokál↔server = chyba je v buildu, ne v deployi/cache. (2) **Render-proof zdroje ≠ ověření bundle** — ověřuj zbundlovaný výstup (`dist/**.css`), ne jen `<link>` na zdroj. (3) `@import` VŽDY nad style rules; neplatný @import = warning-less drop (build „prošel" ≠ CSS kompletní). (4) Rodina CH-027/CH-028: „token/import default musí žít na správném MÍSTĚ", teď i ve správném POŘADÍ.
**Příznak cyklení:** uživatel opakuje „nefunguje" + screenshoty po deploy/clear-cache; já navrhuju další cache/deploy/BE krok místo kontroly vlastního build outputu. ≥5 kol, rostoucí frustrace („nebavíš mě").

---

### ⚠️ POKUS (NEZABRAL) — fix8 první 3D animace hodu kostkou na taktické mapě · 2026-06-20

> **POZOR: tento záznam byl původně označen `✅ ŘEŠENÍ`, ale fix8 problém NEVYŘEŠIL** (ověřeno na live: deploy zelený + tvrdý refresh → 1. animace pořád chybí). Označení na ✅ bylo předčasné, viz [CH-012](#ch-012). Ponecháno jako poučení o zkoušené (neúspěšné) cestě. Timing race NEBYL ten kořen.

**Kontext:** Dlouho bojovaný bug (předchozí pokusy fix4/fix5/fix7 + ~13 commitů „kostky"). Na taktické mapě se u **prvního** hodu po otevření mapy nezobrazila 3D animace kostky — číslo v logu HODY naskočilo, ale kostka se nerozkutálela. 2. a další hod už animovaly.

**Co nakonec zabralo:** Odpojení warmup ghost-hodu od podmínky „neběží reálný hod" + fronta.
- `DiceBox3D.tsx`: ghost se na `ready` spustí **VŽDY jako první** (dřív jen `warmup && !active && !ghostDone`). Reálný hod, který dorazí dřív, než ghost doběhne, se zařadí do fronty (`pendingNonceRef`) a vystřelí se z `onRollComplete` ghostu (`flushPendingRoll`). Flaky úplně první `box.roll()` knihovny `dice-box-threejs` je tak **vždy** neviditelný ghost; první reálný hod běží na zahřátém enginu. Flush je i v chybové větvi ghostu (jinak by reálný hod uvázl ve frontě).
- `DiceRollOverlay.tsx`: animační strop se počítá od `onRollStart` (start reálného hodu), ne od kliknutí — pomalý init/ghost jinak ukrojil z animačního okna a kostka „zmizela" pod brzkým readoutem. Pojistka `COLD_START_CAP_MS`, dokud reálný hod nezačne.

**Proč to je správně (a ne další variace):** Předchozí pokusy předpokládaly, že ghost vždy proběhne PŘED prvním reálným hodem. Init je ale pomalý (lazy chunk import + fyzikální WASM + textury) a hráč typicky hodí dřív → `active` už `true` v momentě, kdy `ready` naskočí → ghost se **přeskočil** → první reálný hod byl ta studená flaky `roll()` → animace ztracena. Tento fix pokrývá i race „hráč hodí dřív než init dojede" tím, že ghost-hod nikdy nepřeskočí a reálný hod počká za ním.

**Jak ověřeno:** `npm run build` ✓ (0 TS chyb), dice/map vitest 8/8 ✓. Reálné 3D chování (WebGL + timing knihovny) NELZE ověřit z CLI → čeká potvrzení hráče na živé mapě: otevřít mapu → hodit **hned** → animace má naběhnout napoprvé.

**Zhodnocení:** NEZABRALO. Statika byla zelená, ale na live 1. animace dál chybí → timing race nebyl kořen. Hráč potvrdil: 2. hod VŽDY animuje, 1. NIKDY. To znamená, že skrytý ghost engine NEzahřívá tak jako reálný 1. hod.

---

### CH-012 — předčasné `✅ ŘEŠENÍ` + skrytý ghost nezahřívá jako reálný hod · 2026-06-20
**Kontext:** Oprava „1. 3D animace hodu kostkou chybí, 2.+ jede". Napsal jsem fix8 (ghost vždy první + fronta), ověřil build+unit testy a zapsal `✅ ŘEŠENÍ`. Na live to ale nezabralo.
**Co jsem udělal špatně:** (1) Označil pokus za `✅ ŘEŠENÍ` na základě build+unit testů, ačkoli ty NEMŮŽOU ověřit reálné WebGL/timing chování — to jde jen reálným hodem na live. (2) Upnul jsem se na hypotézu „timing race" a fronta, aniž bych ji nejdřív potvrdil daty. (3) Dočasně jsem mylně tvrdil, že problém není nasazený, než jsem zjistil, že hráč testuje VÝHRADNĚ na live a commit byl pushnutý.
**Proč to nefungovalo:** Skrytý ghost (`box.roll()` napřímo) NEzahřívá to, co zahřeje reálný 1. hod. Reálný 1. hod typicky přepne na hráčův skin → spustí **první `updateConfig`** (async reload textur) — ghost touhle cestou NIKDY neprojde (jede default téma napřímo). Takže studená/flaky operace je nejspíš `updateConfig`, ne `roll()`. (Druhá možnost: `opacity:0` ghost GPU nezahřeje vůbec.)
**Poučení:** `✅ ŘEŠENÍ` až PO potvrzení reálným během na cílovém prostředí (tady live), ne po build/unit. U efektů závislých na prostředí (WebGL, timing, prod-only minifikace) je build zelená NUTNÁ, ne DOSTAČUJÍCÍ podmínka. Před fixem dej hypotéze data (logy/discriminační test), zvlášť když je každý test = pomalý deploy. Hráč testuje jen na live → viz [[feedback_tests_only_on_live]].
**Příznak cyklení:** zkouším další variaci „warmup ghostu", aniž bych měl z konzole potvrzeno, jestli ghost vůbec běží a jestli 1. reálný hod jde přes `updateConfig`.

---

### CH-013 — hypotéza „studený updateConfig" (fix9) vyvrácena daty z konzole · 2026-06-20
**Kontext:** Po CH-012 jsem vsadil na fix9 = ghost protáhne i `updateConfig` (warmup textur skinu) + přidal diagnostické `[dice3d]` logy do konzole. Hráč deploynul a poslal screenshot konzole.
**Co jsem udělal špatně:** Postavil jsem fix9 na hypotéze „první `updateConfig` je ta studená flaky operace", aniž bych ji měl potvrzenou. Logy ji rovnou vyvrátily.
**Proč to nefungovalo (a co logy ukázaly):** Pořadí logů u 1. hodu: `engine ready` → `ghost: updateConfig+roll warmup start` → `ghost complete → engine warm` → `overlay new roll: can3d=true … skin=element-boure` → **a PAK NIC.** Chyběly `real roll:`, `box.roll fired`, `real roll complete`. Tzn. ghost `updateConfig` ZAHŘÁL (hypotéza fix9 lichá), ale **`rollNow` reálného hodu vůbec nespustil `box.roll()`** — spadl tiše na guardu `if (!box || !active || !notation) return`. **Skutečný kořen = render-race `nonce` × `active`:** overlay nastaví `nonce` (timestamp) hned, ale `active` (host viditelný, přes `phase`/`use3dThisRoll`) až o render později → hod-effekt (`[ready, nonce]`) se spustí v renderu, kdy je `active` ještě false → rollNow tiše vypadne, a protože se `nonce` už nemění, effekt se znovu nespustí → hod ztracen. (Pozn.: tahle race byla v kódu už PŘED mými fixy; můj ghost ji jen odhalil/nepokryl.)
**Poučení:** Diagnostické logy v cílovém prostředí = nejlevnější cesta k pravdě, měl jsem je nasadit DŘÍV než 2 hypotézové fixy (fix8, fix9). „Číslo naskočí, animace ne" + chybějící `box.roll` log = hod se vůbec nespustil, ne že 3D selhalo při renderu. Když efekt závisí na dvou stavech, co se aktualizují v různých renderech, navázat ho na OBA (+ dedupe), ne jen na jeden.
**Příznak cyklení:** přidávám warmup variace, ale `box.roll` se v logu vůbec neobjevuje (hod se nespouští — řeším špatnou vrstvu).

---

### ✅ ŘEŠENÍ — první 3D animace hodu kostkou (fix10: hod-effekt na `active` + dedupe nonce) · 2026-06-20
**Co nakonec zabralo:** `DiceBox3D` hod-effekt deps `[ready, nonce]` → `[ready, nonce, active]`; reálný hod vystřelí, AŽ `active` naběhne na true (`if (!active) return`), a každý nonce hodí PRÁVĚ JEDNOU (`lastRolledNonceRef`, guard i ve `flushPendingRoll`). Tím se ruší render-race z [CH-013]: `nonce` se mění o render dřív než `active`, takže rollNow se dřív volal s `active=false`, tiše spadl na guardu a už se nezopakoval.
**Proč to je správně (a ne další warmup variace):** Logy z live ukázaly, že kořen NEBYL warmup (ghost běžel i `updateConfig` a engine byl warm) — chyběl úplně `box.roll()` reálného hodu. Problém byl ve VRSTVĚ SPOUŠTĚNÍ hodu, ne v zahřátí enginu. Navázání na `active` + dedupe trefuje přesně tu vrstvu.
**Jak ověřeno:** Hráč potvrdil na live „spravil jsi to" + screenshot konzole s plnou sekvencí 1. hodu: `hod effect … active=false` → `hod effect … active=true` → `real roll: active=true via=updateConfig` → `box.roll fired 4df@…` → `real roll complete`. 3D animace naběhla u PRVNÍHO hodu. Pak `npm run build` ✓ po odstranění diagnostických logů.
**Zhodnocení:** Zabralo. Cesta k němu byla ale dlouhá a zbytečně klikatá — 2 hypotézové fixy (fix8 timing, fix9 updateConfig) mimo, než jsem nasadil DIAGNOSTICKÉ LOGY, které kořen ukázaly za jeden deploy. **Klíčové poučení: u tiché chyby v cílovém prostředí nasadit logy DŘÍV než hypotézové fixy.** Ghost-warmup (fix8/9) v kódu zůstal — neškodí, ale nebyl to ten fix; PRIMÁRNÍ oprava je fix10. Diagnostické `[dice3d]` logy odstraněny.

---

### ✅ ŘEŠENÍ — PWA 15.1: SW offline cache bez rozbití dev HMR (dev-guard `mode=prod`) · 2026-06-21
**Co nakonec zabralo:** Krok 15.1 přidával `fetch`/cache handler do existujícího push-only `public/sw.js`. Naivní přidání `fetch` handleru by v dev cacheovalo Vite moduly a **rozbilo HMR** (proto byl SW v 13.2c schválně push-only). Řešení: `main.tsx` předá SW query `&mode=prod` JEN v `import.meta.env.PROD`; SW veškerou cache logiku gate-uje `const CACHE_ENABLED = SW_PARAMS.get('mode') === 'prod'` a v `fetch` handleru hned `if (!CACHE_ENABLED) return`. V dev tedy SW zůstává push-only (beze změny chování), v prod přibude offline shell (navigace network-first → `offline.html`, `/assets/*` cache-first).
**Proč to je správně:** SW běží mimo bundler → nemá `import.meta.env`, režim mu musí předat klient query parametrem (stejný kanál jako už existující `?api=` pro VAPID). Gate je jediný řádek a drží přesně tu hranici, kde dev × prod chování má být jiné. Žádný křehký „přeskoč URL `/@`, `/src/`" blacklist Vite cest.
**Jak ověřeno:** `npm run build` ✓ (tsc -b + vite), `node --check public/sw.js` ✓, `offline.html`+`sw.js` v `dist/` ✓; banner + offline stránka přes Playwright na 375/768/1440 (mobil-desktop ✓, touch ≥44px dorovnán); HelpPage testy 25/25 ✓, eslint PWA modul ✓. **Pozn.: skutečné offline chování + install prompt jdou ověřit jen na nasazeném HTTPS / telefonu** — dev je z principu push-only.
**Zhodnocení:** Zabralo napoprvé, žádná slepá ulička. Velká část 15.1 (manifest, push SW, registrace, ikony) už existovala z 13.2c — klíč byl rozsah správně zúžit (nezačít psát manifest znovu). Re-použitelný vzor: **chceš-li v SW chování závislé na dev/prod, předej režim query parametrem a gate-uj, neřeš to blacklistem cest.** `offline.html` záměrně hardcoduje barvy (musí fungovat bez CSS bundle offline) — není to color-token dluh.

---

### ✅ ŘEŠENÍ — 15.2 krok A: typ mřížky (hex/čtverec/žádná) přes GridAdapter strategy · 2026-06-21
**Co nakonec zabralo:** Taktická mapa byla natvrdo hex (flat-top axial). Cíl 15.2 = volba mřížky per scéna. Klíčové rozhodnutí: **integer `q`/`r` souřadnice zůstaly** (token pozice, fog klíče, combat, BFS) — hex i čtverec sdílí stejnou celočíselnou mřížku, liší se jen *geometrie převodu* buňka↔pixel. Zaveden `GridAdapter` (strategy pattern, [grid/](../../src/features/world/tactical-map/grid/)): `hexAdapter` jen obaluje `hexUtils` (existující testy beze změny), `squareAdapter` = nová matematika (`q*size`, Chebyshev distance, čtvercový obrys/prstenec, 8 sousedů, `tokenRadius=size/2`), `noneAdapter` = sdílí square geometrii + `drawsGrid:false`. 11 konzumentů přepojeno na `getGridAdapter(config.gridType)` místo přímého importu `hexUtils`. Při useTokenDrag zrušen i starý `import('../hexUtils').then(...)` hack.
**Proč to je správně:** Roadmapa žádala „rozšíření, ne přepis" — adapter drží veškerou mřížkovou geometrii na JEDNOM místě, ne roztroušené `if hex/if square` přes 11 souborů; 15.3 (měření/šablony) a 17.1 (LoS) na něj navážou. **Velký nález k BE:** `MapScene.config` je volný `Record<string,unknown>`, `SceneConfigOpDto` bere celý objekt přes `@IsObject()`, repository ho vrací transparentně → `gridType` propluje persistencí **bez jediné BE schema/DTO/mapper změny** (roadmapa čekala BE pole + whitelist; nebylo třeba). `gridType===undefined`→hex = nula migrace, legacy scény renderují identicky.
**Jak ověřeno:** `tsc -b` exit 0 ✓; vitest grid **22/22** (nový `squareAdapter`+`getGridAdapter`) + dotčené existující **56/56** (hexUtils/screenToHex/fog/findFirstFreeHex) ✓; eslint --fix 0 chyb ✓.
**Zhodnocení:** Zabralo napoprvé. UI selektor je záměrně krok B — po kroku A NENÍ jak `gridType` nastavit, takže feature ještě není user-facing (proto `funkce`/`napoveda` až po B jako jeden funkční celek). Potvrzena past z paměti: vitest default běh hodí „failed to find current suite" (dvojí merge react pluginu) → ověřovat nutně `npx vitest run -c vitest.config.ts`. Re-použitelný vzor: **integer lattice `q/r` není hex-only — je to obecná mřížka; nový typ mřížky = nový adapter, ne přepis úložiště.**

---

### ✅ ŘEŠENÍ — 15.3 měřítko (stupnice) + sdílené pravítko přes WS (vzor pingu) · 2026-06-21
**Co nakonec zabralo:** 15.3 přidalo (a) **měřítko** = `MapScaleFrame` stupnice po okraji mapy z `config.unitsPerCell/unitLabel`, viditelná všem; (b) **sdílené pravítko** = měření A↔B, hráč i PJ, výsledek vidí všichni. Pravítko **nepotřebovalo nové úložiště ani op** — reuse ephemeral WS vzoru `map:ping`: FE `emitRuler(line|null)` → BE `map:ruler` handler → broadcast `map:rulered` do scene-roomu. `line=null` = konec měření (vyčisti u ostatních). Throttle emitu ~16/s při tažení; `MapRulerLayer` renderuje lokální (tažené) + cizí (keyed userId) čáry s popiskem vzdálenosti.
**Proč to je správně:** Ephemeral real-time (ping/spotlight) vzor je přesně pro „vidí všichni, neukládá se" — pravítko je jen čára navíc, ne nový subsystém. **Bezpečnost:** BE klíčuje cizí pravítka **authenticated `client.data.user.id`**, NE userId z payloadu (jinak by klient spoofnul cizí měření) — paměť `project_ws_security_patterns`. Gate jako ping (jen do scény, kde klient je — `client.rooms.has`), ale **bez role gate** (pravítko má hráč i PJ; oproti spotlight = PJ-only). Stupnice: rozteč buňky z `adapter.toPixel(1,0)−toPixel(0,0)` → uniformní napříč typy (hex √3·size, square size) bez per-typ větvení.
**Jak ověřeno:** FE `tsc -b` exit 0 + eslint 0; BE `npm run typecheck` (tsc --noEmit) exit 0. **Pozn.: živé chování pravítka (WS roundtrip) jde ověřit až po BE restartu** (nový gateway handler — paměť `feedback_be_restart_required`).
**Zhodnocení:** Zabralo bez slepých uliček. Drobná vlastní chyba hned chycená tsc: prop `color: number`, ale `theme.pingColor` je `string` → Pixi `ColorSource` = `string | number` (TS2322, jednořádkový fix). Re-použitelný vzor: **chceš real-time „vidí všichni, neukládá se"? Reuse ping/spotlight ephemeral kanál (emit→broadcast bez DB), a per-uživatel klíčuj serverovým authenticated userId, ne payloadem.**

---

### ✅ ŘEŠENÍ — 15.4 kreslení/anotace na mapě (perzistované `scene.drawings`, vzor effects) · 2026-06-21
**Co nakonec zabralo:** 15.4 = kreslení čára/šipka/kruh/text na mapu, perzistované, viditelnost `pj`/`all`, PJ vždy + hráč když scéna povolí (`config.allowPlayerDrawing`). Na rozdíl od pravítka (ephemeral) se kresby **ukládají** → nový BE subsystém přesně podle vzoru `effects`: schema pole `drawings` (MixedArraySubSchema), interface `MapDrawing`, 3 ops (`drawing.add/remove/clear`) v DTO+index+apply($push/$pull/$set)+inverse, repository toEntity passthrough, authorizer hráčské cases. FE: `MapDrawing` typ + ops v unionu + `applyOperationToScene`, `MapDrawingLayer` render (filtruje viditelnost, klik při aktivním nástroji maže vlastní/PJ), `useDrawingTool` + `MapDrawingControls` dock, pointer handlery (reuse generická `effectMutation`), per-scéna toggle v EditSceneModal. Pozice v map-space px (`points`).
**Proč to je správně:** Mirror `effects` = zapadlo do existující operation/optimistic/WS infrastruktury bez nového kanálu (broadcast i catch-up zdarma). **Bezpečnost (authorizer):** hráč `drawing.add` jen když `allowPlayerDrawing` && `createdByUserId === user.id` (server klíčuje vlastnictví; nelze spoofnout cizí kresbu), `drawing.remove` jen vlastní, `drawing.clear` PJ-only. `drawings?` optional v BE interface (runtime repo vždy `[]`) → test fixtures se nemusely měnit.
**Jak ověřeno:** BE `npm run typecheck` exit 0 + `jest src/modules/maps` **173/173**; FE `tsc -b` exit 0 + eslint 0 + vitest celý tactical-map **456/456**.
**Zhodnocení:** Zabralo bez slepých uliček v logice. Vlastní procesní omyl viz [CH-014](proces.md#ch-014) (cwd drift → falešně zelený tsc v backendu) — odhalen rozporem „tsc OK × Glob soubor nevidí". Re-použitelný vzor: **perzistovaný real-time feature? Mirror `effects` (schema MixedArray + 3 ops add/remove/clear + apply/inverse + authorizer + repo passthrough + FE apply/layer) — celá infra (optimistic, WS, catch-up) je zdarma.** Pozn.: error toast kreslení sdílí znění s effectem („Efekt selhal") — kosmetika, ne dluh.

---

### ✅ ŘEŠENÍ — 15.4 (E) world map defaults: dvouvrstvá config + BE-side seed · 2026-06-21
**Co nakonec zabralo:** Dvouvrstvá konfigurace map: `WorldSettings.mapDefaults` (PJ nastaví jednou v Nastavení světa → tab „Mapy") → **seed configu nové scény** → scéna může přepsat per-scéna. BE: `mapDefaults` pole na `worldsettings` (Object, vzor `pjChatPersona`) + interface + DTO (`@IsObject` propustí celý objekt) + repo passthrough; do `MapsService` injektován `IWorldSettingsRepository` (WorldsModule ho už exportoval + MapsModule WorldsModule importoval → nula modul-wiringu navíc); seed v `create()` JEN když není `templateId` ani explicitní `dto.config`. FE: `MapDefaults` typ + `MapDefaultsTab` (čte `useWorldSettings`, ukládá `useUpdateWorldSettings`).
**Proč to je správně:** **Seed je BE-side schválně** — kdyby FE posílal config při create, `CreateMapDto.config` je `HexConfigDto` s whitelistem jen `size/originX/originY/showGrid` → ValidationPipe by `gridType`/`unitsPerCell`/… **tiše zahodil** (přesně field-drift past). BE service sahá na config objekt přímo (mimo create DTO validaci) → nová pole projdou. Single source (libovolný klient, který založí scénu, zdědí). EditSceneModal save jede přes `SceneConfigOpDto` `@IsObject` (volný objekt), takže override per-scéna funguje bez whitelistu.
**Jak ověřeno:** BE `tsc --noEmit` + jest maps **173/173** + worlds **164/164**; FE `npm run build` ✅ + vitest tactical-map **456/456**.
**Zhodnocení:** Zabralo bez slepých uliček. Injekce nového dep do `MapsService` rozbila TestingModule spec → doplněn mock provider `IWorldSettingsRepository` (vždy null = seed skip, existující testy beze změny). Re-použitelný vzor: **seedovat config z nastavení dělej server-side v service, NE přes create DTO** — create DTO má užší whitelist než volný `config` objekt, jinak nová pole tiše zmizí.

---

### ✅ ŘEŠENÍ — D-NEW-INV-WIKI: tabulky ve vieweru + mrtvý odkaz „Informace" (15.5-followup) · 2026-06-21
**Co nakonec zabralo:** Dvouvrstvý dluh, dvě nezávislé opravy. **(1) Tabulky se ve čtení zahazovaly:** editor (`ContentPanel`) má `enableTable`, ale read-only `RichTextEditor` ho nepředával → TipTap bez Table extension `<table>` při parse zahodil. Fix = `enableTable: enableTable || readOnly` v `RichTextEditor.tsx` (table extension i v render-only) + read CSS `.content .rte-table` (port z `ContentPanel.module.css`). Jeden zásah pokryl všech 8 read layoutů. **(2) Mrtvý odkaz Informace:** `buildWorldNav` hardcodoval `magicky-system`/`technologie` bez ověření existence → smazaná/neseedovaná stránka = 404. Fix = volitelný param `existingPageSlugs` (z `usePagesDirectory` ve `WorldLayout`), odkaz se skryje když slug není v directory.
**Proč to je správně:** (1) Precedent už v `extensions.ts`: Superscript/Color jsou v readOnly **vždy** — tabulky patří do stejné kategorie „render-only musí umět zobrazit, co je v contentu". BE `sanitizeRichText` `<table>` povoluje (data byla v DB celou dobu, čistě render bug). (2) `existingPageSlugs === undefined` = default „ukaž vše" → zachová BC pro náhled 12.2 i 76 nav testů; `pravidla` má **dedikovanou** route (RulesPage), proto se **nefiltruje** — jinak by se u matrix světa (Rulebook místo Page) chybně skryl.
**Jak ověřeno:** vitest RichTextEditor **22/22** + worldNavConfig **16/16** (+3 nové filtr testy), `npm run build` ✅ + CSP hash OK.
**Zhodnocení:** Zabralo napoprvé, žádná slepá ulička — zásluha předběžného Explore mapování (našlo 8 layoutů sdílí 1 renderer, `pravidla` dedikovaná route, CSS jen v `.editorWrap`). **Dvě pasti chycené předem:** (a) `usePagesDirectory` má `placeholderData: []` (ne undefined) → bez `isPlaceholderData` gate by odkazy bliknuly před načtením; (b) filtrovat naslepo dle Page directory by u matrix rozbilo `pravidla`/Rulebook → filtruju jen jednoznačně Page-based `magicky-system`/`technologie`. Vzor: **read-only rich-text musí registrovat VŠECHNY extensions, co můžou být v uloženém obsahu** (ne jen co jde editovat).

---

### ✅ ŘEŠENÍ — 15.6-A StatePlaceholder empty+error stavy + WebP pipeline · 2026-06-21
**Co nakonec zabralo:** Jedna sdílená primitiva `src/shared/ui/StatePlaceholder/` (variant empty/error) + tenké wrappery `EmptyState`/`ErrorState` + `FullPageState` (full-viewport obal pro error stránky). Nasazeno: 4 error obrazovky (403/404/ErrorPage/GlobalErrorBoundary) + 5 hero empty (postavy/stránky/světy/galerie/akce). **Klíčové rozhodnutí proti záplavě obrázků:** 3 velikosti (`hero`/`panel`/`inline`), ilustrace JEN pro hero → **11 obrázků místo ~100** míst.
**Proč to je správně:** (1) ~100 ad-hoc inline empty/error divů sjednoceno na 1 vizuál/údržbu (Explore inventura předem). (2) Velký `tone`/text patří jen na first-dojem (hero); prázdný řádek tabulky velkou malbu nechce → velikost řídí náklad assetů. (3) CTA role-aware (předáš jen komu patří) — vzor z `MapEmptyState` PJ vs hráč.
**Assety — netriviální:** dodané `.jfif` = ve skutečnosti **JPEG** (magic bytes `FF D8 FF`, ověřeno před přejmenováním — neřešit jako exotický formát, jen `.jpg`). Konverze na **WebP** přes `sharp` (už v `node_modules`, žádná instalace), q80, max 768 px → **4,24 MB → 0,28 MB (93 %)**, skript `scripts/convert-states-webp.mjs` ponechán. Transparentnost z JPEG nedoplníš → místo transparent PNG **CSS `mask-image: radial-gradient`** vyblednutí okrajů = ilustrace sedí na tmavý i světlý skin bez re-exportu.
**Jak ověřeno:** `npm run build` ✓, `tsc -b` ✓, vitest **38/38** (8 nových StatePlaceholder + 30 dotčených).
**Zhodnocení:** Zabralo bez slepé uličky. Dvě drobné tsc chyby (title required v ErrorStateProps, unused `UserSquare`) = triviální, hned chycené. **Poučení (test drift):** výměna empty textů přes sdílenou komponentu rozbije testy hledající staré řetězce — po broad text change zgrepuj a oprav `*.spec` (zde 3: CharacterDirectory/PagesListPage/WorldsPage). **Vědomě odloženo:** `MapEmptyState` reuse (8 testů + loading CTA + children) → kosmetika, ne díra. **Otevřené (uživatel nahlásil, mimo 15.6):** chybí stav **401 nepřihlášen** (odhlášený hráč dostane falešné „svět neexistuje" 404 místo „přihlas se") + **session expiruje i aktivnímu uživateli** → samostatné auth téma.

---

### ✅ ŘEŠENÍ — auth: 401 „přihlas se" stav + session TTL/sliding (3 dny) · 2026-06-21
**Kontext:** Tester při vypršené session viděl „Tento svět nenajdeme" (matoucí — svět existuje, jen byl odhlášen) + ten popisek byl nečitelný (tmavý text na tmavém). A „odhlašuje mě i když jsem aktivní každý den".
**Co zabralo — #1 (401 stav):** `ErrorState` dostal `status=401` (ilustrace `forbidden`, „Nejdřív se přihlas"). `WorldNotFound` přepsán na `ErrorState`: **anonym** (`!isAuthenticatedAtom`) → 401 + CTA Přihlásit (`saveLoginIntent` + `/?openLogin=1` → návrat zpět), **přihlášený nečlen** → čitelné 404. Přepis na `ErrorState` vyřešil i nečitelný text (theme tokeny). Leak-safe: rozlišení je na **FE dle přihlášení**, ne na BE (BE 404 nesmí prozradit existenci private světa — anonym dostane „přihlas se" na každé chráněné URL stejně).
**Co zabralo — #2 (session):** Diagnóza: **sliding session UŽ existuje** — `auth.service.generateTokenPair` razí při každém `/auth/refresh` NOVÝ refresh token s expirací `+TTL od teď` (auth.service.ts:668-673). Access byl 1 d (PC-12), refresh 30 d → **sjednoceno na 3 d** (access `auth.module.ts`, refresh `auth-cookie.ts ttlMs` + `auth.service` fallback + `.env`), uživatel chce „3 dny nečinnosti = logout". **Ale skutečný kořen „odhlašuje po dnech" = refresh v prod nejspíš NEJEDE** (access vyprší → refresh selže → logout). Cookie config v kódu je správně (`httpOnly; Secure; SameSite=None; path=/api/auth`, endpoint `/api/auth/refresh`, FE `withCredentials`) → kořen je nejspíš **cross-site cookie blokace** (FE a BE na různých eTLD+1) = **deploy topologie, ne kód**.
**Poučení:** (1) „Neexistuje" pro odhlášeného je leak-safe opravitelné na FE, ne BE. (2) **Agentní závěr ověřit čtením** — Explore si protiřečil („neposouvá se" vs „sliding"); čtení `generateTokenPair` ukázalo, že sliding JE. (3) **BE typecheck = `npm run typecheck`** (tsconfig.build), NE `tsc --noEmit -p tsconfig.json` — root config zahrne `test/*.e2e-spec.ts` bez jest types → desítky falešných „Cannot find name expect/it" (příbuzné [CH-014] — špatný build scope = falešný signál). (4) WorldLayout.spec byl **pre-existing rozbitý** (usePagesDirectory přidán v 15.5-followup bez QC stub mocku) → opraveno přidáním stubu.
**Jak ověřeno:** FE `tsc -b` ✓, StatePlaceholder 9/9 (+401), WorldLayout 5/5; BE auth.service 71/71, `npm run typecheck` ✓.
**Zhodnocení:** #1 zabralo. #2 kód hotový (sliding 3 d), ale **kořen prod odhlašování je deploy (cross-site cookie)** — z kódu neopravím, čeká ověření domén API vs web. **ČEKÁ BE restart + prod env** (`JWT_EXPIRES_IN=3d`, `JWT_REFRESH_TTL_DAYS=3`).
> **OPRAVA 2026-06-24:** hypotéza „cross-site cookie" **VYVRÁCENA** živým curlem proti produkci — API je **same-origin** (`https://www.projekt-ikaros.com/api/health` → 200 přes Caddy, `VITE_API_URL` prázdný), cookie je first-party, refresh jede i na mobilu. Skutečný kořen = **refresh TTL 3 d** na řídce používaném zařízení. Vyřešeno zvednutím na 60 d → viz ✅ ŘEŠENÍ 2026-06-24 (konec souboru).

---

### ✅ ŘEŠENÍ — 15.6 dokončení (sub-kroky B+C přes paralelní agenty) · 2026-06-21
**Co zabralo:** Dokončení ~80 empty/error míst (ikaros, profil, notifikace, world panely, admin) přes **4 paralelní agenty** (1 agent = skupina modulů, různé soubory → bez konfliktů), každý s tightním playbookem (komponenta, velikosti hero/panel/inline, mapping ilustrací, role-aware CTA, filter-empty bez ilustrace). Reuse komponenty `EmoteEmptyState`/`SubdocErrorState` přepsány na sdílenou primitivu se zachováním veřejného API. Mapa (`MapEmptyState`) **vědomě NEpřepsána** na `StatePlaceholder` — je to canvas-overlay (absolutní pozice, `pointer-events` gating, loading CTA „Vytvářím…", vnořené scény/karty, 8 testů); místo toho jen emoji 🪹 → sdílená ilustrace (`stateIllustrationSrc('worlds')` + CSS mask) = sjednocení vizuálu bez rizika.
**Proč správně:** B/C je mechanické nasazení už zapsaného vzoru (15.6-A) → ideální pro fan-out agentů; centrální ověření po nich (tsc/vitest/build) drift chytilo. `StatePlaceholder` je flow-komponenta, ne overlay → mapu na ni cpát = ztráta overlay chování za kosmetiku.
**Poučení:** (1) **Paralelní agenti na mechanické nasazení sdílené komponenty = efektivní, ALE nutné centrální ověření** — 4 test drifty (`querySelector('img')` chytil nově přidanou ilustraci místo portrétu; `WorldMembershipGuard.spec` hledal starý text „403/odepřen", ForbiddenPage je teď `ErrorState` „Sem nevidíš"). (2) **VLASTNÍ CHYBA (procesní):** 2× jsem spustil `npx vitest`/`npm run build` na pozadí s `| Select-Object -Last N` → pipe bufferuje do konce → výstupní soubor PRÁZDNÝ celou dobu běhu → nevidím průběh. **Pro background běhy NEpoužívat `Select-Object -Last`** (jen foreground); na pozadí nechat plný stream nebo `Tee-Object`. (3) Sdílený `ErrorState` neumí potlačit `description` (null → default dle status) — u inline 404/403 přibyl řádek popisu; drobnost, případně rozšířit o „bez popisu".
**Jak ověřeno:** `tsc -b` ✓, dotčené `vitest` 757 ✓ (po opravě 4 driftů), `npm run build` ✓ (16,9 s, CSP hash OK).
**Zhodnocení:** Zabralo. Agentní fan-out ušetřil čas, drift byl předvídatelný a centrálně pochycený. Mapa-kompromis vědomý. **ZBÝVÁ:** `mobil-desktop` (reálný UI test viewportů), `funkce`, `napoveda`, git. Loading stavy (~15) mimo záběr 15.6.

---

### CH-017 — 15.7: zapnul jsem anon pravý panel, ale zapomněl na grid varianty → rozbitý layout · 2026-06-22
**Co nefungovalo:** Pro 15.7 jsem v `IkarosLayout.tsx` zapnul pravý panel i anonimovi (`showRightPanel = !isChat && !isAdmin`, dřív `isAuthenticated && …`) a vyrenderoval `AnonStartPanel`. Render byl správně, ale **CSS grid `.shellAnon .body` měl natvrdo 2 sloupce** (`sidebar 1fr`) — protože historicky anon pravý panel NEMĚL (komentář v CSS to i explicitně tvrdil: „Anon mód zůstává 2-sloupcový"). Třetí grid item (panel) by spadl do implicitního auto tracku → rozbitá šířka/umístění. Bug byl ve **2 explicitních místech** (base `.shellAnon .body` + tablet `@media ≤1280`), mobil `@media ≤768` (D-022) zůstal správně 1 sloupec.
**Jak chyceno:** NE při psaní ani tsc/testy/build (ty prošly — je to čistě vizuální grid drift) — chytil ho až **`mobil-desktop` CSS audit** (statická kontrola media queries a grid variant). tsc/vitest/build na layout grid slepé.
**Poučení:** (1) **Když zapínám nový panel/sloupec do existujícího gridu, musím projít VŠECHNY varianty gridu** (auth × anon × tablet × mobil × `bodyNoRight`), ne jen ověřit, že se komponenta vyrenderuje. Render ≠ správné umístění. (2) **Komentář v CSS, který tvrdí invariant** („anon = 2 sloupce"), je červená vlajka při změně toho invariantu — grep na třídu (`.shellAnon`) odhalí všechna místa, co na něm stojí. (3) Layout grid drift **neprojde žádným kódovým ověřením** (tsc/test/build zelené) → `mobil-desktop` audit je jediná brána; nevynechávat ho ani u „malé" grafické změny. (4) Oprava hodnotou (2→3 sloupce) je bezpečnější než mazání override (nulová změna kaskády/specificity, D-022 mobil fix zůstává).
**Jak ověřeno:** `.shellAnon .body` → 3 sloupce (desktop+tablet), mobil 1fr zachován; `npm run build` ✓ (po opravě, 9,04 s, CSP OK).
**Zhodnocení:** Drobná, ale poučná — vlastní chyba z neúplného domyšlení dopadu změny (`showRightPanel` jsem změnil, navazující grid ne). `mobil-desktop` se osvědčil jako záchytná brána přesně pro to, na co je kódové ověření slepé.

---

### CH-018 — 15.7 showcase: theme dekorace se projevila JEN na jiném skinu, než jsem testoval · 2026-06-22
**Co nefungovalo:** Showcase banner měl v JSX `data-frame-panel="card"` (i když CSS komentář tvrdil opak — drift kód×komentář). Tím si **každý z 33 skinů kreslil kolem banneru svou „card" dekoraci.** Na měsíčním skinu (kde jsem to ladil) je to skrytý měsíční disk *pod* obrázkem → neviditelné → nic mě neupozornilo. Uživatel ale přepnul na **zlatý skin**, kde „card" dekorace jsou zlaté filigrány vyčuhující přes okraj → „překračuje ty zlaté, vypadá divně". Druhá vrstva: můj předchozí „díra fix" ([CH-017] kontext — zrušení `main` padding-top 220px pro anon) **odkryl horní theme dekorace, co s tím prostorem počítaly** → arabský skin má `main::before` lampu génia (z-index 4), která pak visela přes banner.
**Jak chyceno:** uživatelem, na **JINÉM skinu, než jsem testoval**. tsc/vitest/build slepé (čistě vizuální, per-skin).
**Poučení:** (1) **`data-frame-panel` = pozvánka pro 33 různých dekorací** — každý skin si pod tím atributem kreslí vlastní rám/ornament; na obrázkový banner nepatří, banner má vlastní rám + `CornerOrnament`. (2) **Theme-gated vizuál se MUSÍ ověřit napříč skiny, ne jen na aktivním** — projekt má 33 skinů a dekorace se chovají opačně (skrytá pod obrázkem vs vyčuhující). **Levná brána = grep audit všech `themes/*/decorations.css`** (selektory na `.main`/`.page`/`.ornament` + pseudo-elementy v horní zóně) — Explore fan-out to zvládl za jedno kolo (31 čistých, 1 kolize, 1 benigní). (3) **Komentář „NE X" + kód dělající X** = drift; po napsání komentáře ověř, že kód sedí (grep atributu). (4) **Layout změna (díra fix) může odkrýt theme dekorace** počítající s prázdným prostorem → při změně rozměrů obsahové oblasti spusť skin audit. (5) Nový obecný mechanismus: `data-anon` atribut na shellu = theme-gating dekorací pro anonima (`.shellAnon` je hashovaný CSS-module → z theme CSS neadresovatelný).
**Jak ověřeno:** `data-frame-panel` odebrán ze showcase; `data-anon` na shellu + arabská lampa/glow skryta pro anon; Explore audit 33 skinů; `npm run build` ✓ (16,95 s, CSP OK).
**Zhodnocení:** Vlastní chyba (kód≠komentář) + neúplné domyšlení layout změny. **Multi-skin grep audit = nová záchytná technika** pro tenhle 33-skin projekt — vizuál na jednom skinu nestačí. ČEKÁ uživatelův vizuální spot-check zlatého (fix data-frame-panel) + arabského (fix lampy).

---

### ✅ ŘEŠENÍ — 15.8 Hospoda‑anon: guest token end‑to‑end (BE+FE, 15 TDD tasků) · 2026-06-22
**Co se řešilo:** anonymní host smí číst+psát do Hospody pod `anonym{N}`, banovatelný + rate‑limit, jen text. Velká BE+FE featura (spec‑15.8 + plán).
**Co zabralo (a proč správně):**
- **Guest = „člen s minimálními právy" přes guest JWT** (role `guest`) → jednotný auth flow v HTTP `Authorization` i WS handshake, reuse skoro celé chat trubky. Stavět paralelní anon‑identitu mimo JWT by znamenalo druhé cesty identity (cookie/WS) a víc okrajových případů. Identita pořád z OVĚŘENÉHO tokenu (anti‑spoof drží).
- **`UserRole.Guest = 99` sentinel** (dual‑source FE+BE) — guest potřeboval hodnotu pro povinné `RequestUser.role`; vysoké číslo nikdy neprojde gating (`role <= X` ani `@Roles`) → 2. pojistka scope zdarma, i kdyby guard selhal.
- **`GuestOrMemberGuard`**: passport validace přes grandparent prototyp, member DB gate (`JwtAuthGuard`) jen pro nečlena — host nemá DB účet, `findById(anon‑id)` by spadl na falešné „DELETED". Bez refaktoru JwtAuthGuard (žádná regrese).
- **Rate‑limit in‑memory v service per anon‑id** (ne `@Throttle`) — `@Throttle` klíčuje per IP a omezil by i členy; chtěli jsme limit jen pro hosty.
**Jak ověřeno:** BE jest dotčené (auth 86, global‑chat service 47 / controller 7 / gateway 36, guard 5, ban 4) + typecheck; FE tsc‑b + vitest 4 + build. Vše pushnuto (BE 55cfc00, FE 22322aa6).
**Zhodnocení (dobře/špatně):** **Dobře** — rozdělení na malé TDD tasky (A1‑A8, B1‑B7) + průběžné commity/pushe + **checkpointy u delikátních kusů** (A4 guard, A7 WS dělané s „čerstvou hlavou") drželo kvalitu i v extrémně dlouhé session. **Špatně/poučení** — **dual‑source drift chycen až `tsc -b`**: přidání pole do BE entity (`ChatMessage.isAnonymous`) a hodnoty do BE enumu (`UserRole.Guest`) si vynutilo zrcadlo na FE (`lib/types.ts`, `userRoleLabels` Record) → **při přidání pole/enum hodnoty do BE entity hned zkontroluj FE zrcadlo** ([project_schema_be_fe_sync], [project_theme_ids_dual_source] vzor). Druhá drobnost: NestJS `jwtService.sign` chce `expiresIn: StringValue` ne plain `string` z `config.get` → cast `as JwtSignOptions`.

---

### ✅ ŘEŠENÍ — 15.9 Notifikační preference + filtr push + 3 nové triggery + 1h připomínka (BE+FE) · 2026-06-22
**Co se řešilo:** hráč chce push jen na to, co ho zajímá, a vše vypnout/zapnout v profilu. Velká BE+FE featura (spec‑15.9): 7 kategorií + master, BE filtr před každým pushem, 3 nové push triggery (world‑news, vlastní diskuse, hodnocení článku/galerie), Hospoda opt‑in, Rozcestí push zrušen, hra 24h **i** 1h připomínka.
**Co zabralo (a proč správně):**
- **Filtr v `PushService` (jednosměrná závislost push→users)** — `notifyUsers/notifyAll(payload, category?)` profiltruje příjemce přes injektovaný `IUsersRepository` + `wantsPush`. `@Global` token z UsersModule → bez `imports`, bez cyklu (users push neimportuje). Centrální jedno místo místo filtru v každém volajícím.
- **Defaulty jen v kódu, NE v DB** — schema `notificationPreferences` bez `default`; `undefined` pole → `wantsPush` dosadí default. Změna defaultu pak platí i pro staré účty. Dual‑source FE/BE (`notification-preferences.ts` na obou).
- **1h připomínka = ponechat `reminderSent` + přidat bool `reminder1hSent`** (ne přejmenovat na `reminder24hSentAt` + migrace, jak psal plán) — méně invazivní, nula migrace. Zobecněn `findUpcoming`/`markReminderSent` o nepovinný `reminderField`; query `$ne: true` (ne `=== false`) pokryje i staré eventy bez pole. Cron `EVERY_15_MINUTES` neexistuje v této verzi → raw `'*/15 * * * *'`.
- **Nové push inject `@Optional`** (world‑news/discussions/articles/gallery) — chrání starší unit testy bez PushModule (PushModule je @Global → v produkci vždy injektováno).
**Nesrovnalost nalezená při práci:** sdílený `GlobalChatService.sendMessage` volal `notifyAll` **bezpodmínečně pro všechny místnosti** → push o zprávách z Rozcestí chodil všem (proti spec 15.8 i přání). Opraveno: push jen `room === 'hospoda'`, a opt‑in.
**Jak ověřeno:** BE typecheck ✓, lint:check ✓ (+elevation guard), jest `--maxWorkers=2` zasažené moduly **440/440** + push **21/21** (6 nových filtr testů). FE `npm run build` (tsc‑b) ✓, eslint nové soubory ✓, HelpPage **25/25**. **Čeká BE restart** (nové env netřeba) + git (na uživateli).
**Zhodnocení (dobře/špatně):** **Dobře** — workflow spec→plán→souhlas→kód udržel rozsah; centrální filtr v push (ne v N volajících) = malá plocha; test faily (push DI mock, world‑news bypass assert, game‑events 3. arg) chyceny hned a opraveny v jednom kole. **Poučení:** (1) **guard `if (… && this.pushService)` před voláním fire‑and‑forget helperu** — jinak helper sáhne na repo (worldsRepo.findById) ještě před `?.` na push a rozbije asserce volajícího testu (world‑news bypass). (2) Přidání 3. argumentu do `notifyUsers` rozbije `toHaveBeenCalledWith` asserce — projít existující spec. (3) `Glob **/push/**.spec.ts` minul `push.service.spec.ts` (cwd drift po PowerShell `cd`) → existující test jsem málem přehlédl; jest dávka ho odhalila.

---

### ✅ ŘEŠENÍ — Sjednocení novinek (globální + světové) na sdílenou kartu + detail-okno · 2026-06-22
**Co se řešilo:** tester feedback — globální novinky vypadaly chudě (jen titulek/štítek/datum), světové měly oříznutý úryvek a plný text se nedal nikde zobrazit. Cíl: stejná preview-karta pro obě + klik → vystředěné detail-okno s plným obsahem. Dvě nezávislé kopie karet (`NewsCard` globální, `WorldNewsCard` svět).
**Co zabralo (a proč správně):**
- **Sdílená prezentační vrstva + per-doménový VM adaptér** (`src/shared/ui/news/`: `NewsPreviewCard` + `NewsDetailModal` + `NewsCardVM`). Doménové komponenty (`NewsCard`, `WorldNewsCard`) zůstaly jako tenké adaptéry: složí `NewsCardVM` z `IkarosNews`/`WorldNewsItem` a předají dovnitř. Proč ne jedna komponenta beroucí oba typy: svět resolvuje interní odkaz + fantasy datum přes **hooky** (`usePagesDirectory`, `useCalendarConfigs`) → adaptér musí být komponenta (rules-of-hooks), zatímco globální je čistá funkce. VM je hranice, která to čistě odděluje.
- **Detail-okno = reuse sdíleného `Modal`** (backdrop/×/Escape/focus-trap/scroll-lock už hotové) — nula nového overlay kódu. Past chycená předem: `Modal` renderuje `×` **jen když je předán `title`** (`{title && <header>…×}`) → title musí jít do `Modal`, ne až do body. Hero obrázek tedy pod hlavičkou, full-bleed přes negativní margin `-sp-6` (zruší padding body).
- **Klik bez kolize: stretched hit-area `<button>`** přes celou kartu (`z-index:1`), admin akce jako **sourozenec** s `z-index:3` → žádné nested-interactive (`<button>` v `<button>`), klik na kebab neotevře detail bez `stopPropagation`. Odkaz přesunut z karty do modalu → karta je čistý preview.
- **Štítek zobecněn** (`NewsTypeChip` bere `{tone,label}`); barvu/ikonu řídí `tone` (info/warning/system, `alert`↔`warning`), text zůstává doménový. Starý world `TypeChip` → tenká delegace (ostatní volání nepadla); osiřelý `TypeChip.module.css` smazán.
- **Admin akce čitelné nad obrázkem:** svět kebab nechán s vlastním kruhovým pozadím (pixel-identický), globální 3 ikony (dnes šedé/průhledné) obaleny do translucentní pilulky v `NovinkyPage` → legibilita přes libovolný obrázek bez sahání do sdílené karty.
- Zrušeno mrtvé pole `defaultExpanded` (nikde se nepředávalo).
**Jak ověřeno:** `npm run build` (tsc -b + vite) ✓ 9,63 s, CSP OK; vitest dotčené 3 specy **19/19** (NewsCard.spec + cards.spec přepsány na nové chování — úryvek na kartě, odkaz/autor až po rozkliku; data-archived atribut vrácen na sdílenou kartu kvůli testovatelnosti). `mobil-desktop` audit CSS+struktura PROŠEL (fluidní, žádná pevná šířka, card=velký tap target, meta flex-wrap, modal scroll). Čeká vizuální spot-check uživatele (live screeny nedělány — za přihlášením).
**Zhodnocení (dobře/špatně):** **Dobře** — workflow spec→souhlas→design audit→plán→souhlas→kód udržel rozsah; VM hranice elegantně vyřešila rozdíl hook-adaptér (svět) vs čistá funkce (globální); build i testy napoprvé. **Poučení:** (1) **při změně chování komponenty hned zgrepuj `*.spec`** — dvě sady testů (`NewsCard.spec`, `cards.spec`) testovaly staré inline-rozbalení/`defaultExpanded` a odkaz na kartě; tsc je nechytí (sémantika, ne typy). (2) `Modal` `×` váže na `title` — bez title není zavírací tlačítko; znát API sdílené komponenty před návrhem layoutu. (3) regex `findByText` po otevření modalu hlásí „multiple elements", když text je i v úryvku karty i v obsahu modalu → asertovat na unikátní prvek (autor je jen v modalu). **Pre-existující riziko (neopraveno):** `Modal` `×` je 32×32px (pod 44px dotykovým min.) — týká se všech modalů, čeká rozhodnutí.

### ✅ ŘEŠENÍ — 15B.2 SEO meta/sitemap/robots/breadcrumbs (FE+BE) · 2026-06-22
**Co se řešilo:** per-page `<title>`/description/canonical/OG na 10 veřejných stránkách, `robots.txt`, dynamický `sitemap.xml`, vizuální breadcrumbs. Navazuje na 15B.1 prerender (sidecar sebere hotový DOM s meta).
**Co zabralo (a proč správně):**
- **Nativní React 19.2 hoisting místo `react-helmet-async`** — `<meta>`/`<link>` napsané v komponentě `<Seo>` React sám vyzvedne do `<head>` a při unmountu uklidí. Žádná závislost navíc, žádný `<HelmetProvider>`. Ověřeno testem (jsdom: `og:title` se opravdu objevil v `document.head`).
- **Past: duplicitní `<title>`.** `index.html` má statický `<title>Projekt Ikaros</title>`; React 19 hoisting `<title>` ho NEdedupuje proti ne-Reactímu elementu → vznikly by **dva** `<title>`. Řešení: title nastavit **imperativně** `document.title = …` (přepíše ten existující), jen meta/OG/canonical deklarativně (tam duplikát nehrozí). Statický title zůstává jako fallback pro stránky bez `<Seo>` (auth routy).
- **Sitemap = BE endpoint, ne statický soubor** — dynamický obsah (světy/články se mění bez redeploye) + BE je jediný leak-safe zdroj „co je veřejné" (stejné filtry jako přehledy: `accessMode public/open`, `status Published`). In-memory cache 1 h, aby crawler netloukl DB.
- **Cross-host past: global prefix `api` + FE nginx neproxuje API.** Endpoint je reálně `/api/sitemap.xml`, ale SEO chce sitemap na FE originu (`www/…/sitemap.xml`). FE compose nemá `backend` službu (BE běží na vlastním public hostu) → `location = /sitemap.xml` proxuje na `https://${BACKEND_HOST}/api/sitemap.xml` (exact `=` match má prioritu před prerender `location /`). robots.txt naopak statický v `public/` → servíruje try_files, žádná nginx změna.
- **noindex per-page** (`<Seo noindex>`) na private/closed světě + nepublikovaném obsahu — belt-and-suspenders k tomu, že tyhle routy nejsou v sitemap ani prerenderované.
**Jak ověřeno:** FE `npm run build` (tsc -b + vite) ✓ + CSP hash OK; FE vitest nové 11/11 (metaDescription/Seo/Breadcrumbs) + HelpPage 25/25; eslint změněné soubory ✓. BE jest seo 6/6, typecheck 0, eslint+prettier 0. `mobil-desktop` na breadcrumbs = CSS-ověřeno PASS (flex-wrap + vw-capped ořez). **Čeká deploy + BE restart.**
**Zhodnocení (dobře/špatně):** **Dobře** — workflow spec→souhlas→plán→kód; jeden zátah FE+BE bez dluhů; nativní React 19 ušetřil závislost a test napoprvé potvrdil, že hoisting v jsdom funguje. **Poučení:** (1) **statický `<title>` v `index.html` + React 19 `<title>` = duplikát** → title vždy imperativně `document.title`, meta deklarativně. (2) **Global prefix `api` mění reálnou cestu endpointu** — veřejnou cestu (`/sitemap.xml`) řeš nginx rewritem, ne změnou prefixu. (3) BE jede prettierem (FE ne) → po napsání modulu `prettier --write` před `lint:check`, jinak formátovací error. (4) `.lean<T>()` generikum místo `as any` u lean projekce přidávající ne-schema pole (`updatedAt` z timestamps) — drží `no-explicit-any` lint zelený.

### CH-019 — 15B.3: dva soubory lišící se jen casem (`JsonLd.tsx` × `jsonLd.ts`) → import resolvoval špatný modul · 2026-06-22
**Kontext:** 15B.3 JSON-LD. Rozdělil jsem kód „čistě podle concernů": `jsonLd.ts` = buildery (data), `JsonLd.tsx` = komponenta + `serializeJsonLd` (render).
**Co jsem udělal špatně:** Založil jsem v jedné složce dva soubory, jejichž basename se liší **jen velikostí písmen** (`jsonLd` vs `JsonLd`). Na Windows je FS case-insensitive.
**Proč to nefungovalo:** Vite/vitest `resolve.extensions` zkouší `.ts` PŘED `.tsx`. `import { serializeJsonLd } from './JsonLd'` (a re-export v `index.ts`) tedy na case-insensitive FS matchnul `jsonLd.ts` (buildery), kde `serializeJsonLd` neexistuje → test padl `TypeError: serializeJsonLd is not a function`. 14/15 testů prošlo (importovaly z `./jsonLd`), takže symptom vypadal izolovaně, ne jako kolize.
**Poučení:** V jedné složce NIKDY dva soubory lišící se jen casem — bez ohledu na příponu. Když concern-split vyrobí takovou dvojici, sluč do jednoho `.tsx` (komponenta + helpers). React komponenta + čisté funkce klidně v jednom modulu (jako `metaDescription.ts`). Test to chytil hned (žádné cyklení), ale na CI s case-sensitive FS by se to chovalo jinak než lokálně = horší past.
**Příznak cyklení:** `... is not a function` u exportu, který v importovaném souboru objektivně je; přejmenování importu „pomáhá" náhodně podle casu.

---

### ✅ ŘEŠENÍ — 15B.4a SEO landing kostra systémů — 2026-06-22

**Co se stavělo:** veřejné landing stránky RPG systémů (`/ikaros/systemy` hub + `/ikaros/systemy/:slug`) jako **SEO kostra** — obsah jen na dnes existujícím (deník per systém + generické platform featury); bohatší pilíře (bestiář/dodatky) vědomě odložené na bod 22.1 po 16.2.

**Co zabralo / klíčová rozhodnutí:**
- **Data-driven registr** `systemLandings.ts` s **optional poli** (`bestiar?`/`dodatky?`/`denikScreenshot?`) — šablona sekci nevykreslí bez dat → 22.1 doplní bez přestavby. `published:false` kostra (4 ze 7 CZ) negeneruje stránku ani odkaz (žádné „připravujeme"). `getLandingBySlug` filtruje `published` → nepublikované neviditelné i přímou URL.
- **3 napojení, bez kterých SEO TIŠE neběží:** (1) prerender whitelist `/ikaros/systemy` v `default.conf.template` — jinak bot dostane prázdný SPA shell; (2) BE sitemap `STATIC_ROUTES` (dual-source s FE registrem — slugy na 2 místech, zapsáno do nesrovnalostí kap. 03); (3) JSON-LD `faqJsonLd`/`itemListJsonLd` (čisté funkce, render jen na published).
- **Reuse estetiky** (frontend-design audit): glass `Frame` (`data-frame-panel="card"` + 4× `CornerOrnament`) místo nové komponenty; CTA reuse `registerModalOpenAtom` vzoru z 15.7; galerie reuse `SHOWCASE_SLIDES`.

**Jak ověřeno:** `npm run build` (tsc-b+vite, 0 chyb), vitest 23 (jsonLd 17 + registr 6), HelpPage 25, lint:colors bez nových nálezů (jen theme tokeny). CSS audit responsivity (media 768, žádné fixed layout šířky). **Vizuál čeká na živé potvrzení uživatelem** — Chrome headless screenshot v tomhle prostředí nevyšel (exit bez png), spolehnuto na CSS audit + běžící dev server.

**Zhodnocení:** dobře — implementace dle schválené spec hladce, žádné cyklení; pořadí „čisté funkce → data → komponenty → routy → napojení" drželo build zelený průběžně. Past, kterou spec chytila předem: prerender whitelist (bez něj SEO neviditelné a nikdo by si nevšiml — žádný runtime error). Otevřené: draft copy 3 systémů k revizi uživatelem; dedikovaný screenshot deníku až dodá.

---

### ✅ ŘEŠENÍ — 15B.6 sociální sdílení (ShareButton) — 2026-06-22

**Co se stavělo:** sdílecí tlačítko na detailu světa (`ShareButton` v `shared/ui`) — adaptivní mobil `navigator.share` / desktop `KebabMenu` (copy + Facebook + X sharer-URL); reuse OG tagů z 15B.2.

**Co zabralo / klíčová rozhodnutí:**
- **Adaptivní UX**: `navigator.share` + `canShare` gate → nativní sheet na mobilu/PWA, jinak fallback menu. `AbortError` (zrušený sheet) tiše. Web Share i Clipboard chtějí secure context + user gesture (klik) — voláno přímo v `onClick`.
- **Reuse `KebabMenu`** místo nového popoveru; ale item.onClick sám menu **nezavírá** → obal `withClose`.
- **Anchor přes callback ref do state** (`ref={setAnchorEl}`), ne `useRef.current` v renderu — jinak lint `react-hooks/refs` „access ref during render".
- **`window.open(..., 'noopener,noreferrer')`** — bez toho reverse tabnabbing.

**Dvě vlastní chyby (chycené, ne cyklení):**
1. **Lucide nemá brand ikony.** `import { Facebook, Twitter } from 'lucide-react'` → **`undefined`** → React „Element type is invalid" crash až při renderu menu (2 testy co menu nerenderovaly prošly, 4 padly). Lucide brand glyfy odstranil (loga 3. stran). **Řešení:** vlastní inline monochrome SVG (`currentColor`). **Poučení:** pro brand loga (FB/X/GitHub/…) lucide NEpoužívat — ověř `node -e "typeof require('lucide-react').X"` nebo rovnou vlastní SVG.
2. **Absolute pozicování v hero → překryv.** První verze `ShareButton` `position:absolute; top/right` v `WorldDetailHero` → na úzkém mobilu by dlouhý název/badges zalezly **pod** tlačítko (absolute nerezervuje místo) + touch target 40<44px. Chytil `mobil-desktop` audit (ne tsc/test/build — ty jsou na layout slepé). **Řešení:** share do **flow** (flex `topRow` space-between s badges) → title pod ním, nikdy nekoliduje; mobil touch target 44×44.

**Jak ověřeno:** vitest 6/6 (desktop menu / copy / FB / X / nativní share / AbortError), `npm run build` ✓, eslint 0, lint:colors bez nových nálezů (token-only CSS), HelpPage 25/25. `mobil-desktop` CSS audit PASS. BE beze změny. **Čeká deploy.**

**Zhodnocení:** dobře — spec→souhlas→plán→kód, čistý reuse, malý zátah bez dluhu. **Poučení do příště:** (1) lucide ≠ brand ikony; (2) `mobil-desktop` audit má reálnou hodnotu i u „triviální" komponenty — odhalil překryv, který statická brána (tsc/test/build) nikdy nechytí (vzor stejný jako CH-017).
**Příznak:** „Element type is invalid … got: undefined" u importu, který „evidentně existuje" → ověř, že balík ten export reálně má (ne každá ikona je v lucide).

### ✅ ŘEŠENÍ — 15B.7 self-hosted analytics (page-view counter + admin dashboard) · 2026-06-22
**Co nakonec zabralo:** Vlastní BE modul `analytics` (žádná 3rd-party): veřejný `POST /analytics/pageview` (sběr) + admin `GET /analytics/summary` (aggregation `$facet`, cache 5 min). Surové eventy v kolekci s **TTL indexem 90 dní** (Mongo maže sama, žádný cron). FE hook `usePageViewPing` (fire-and-forget) v obou layoutech + sekce „Návštěvnost" v Přehledu (rozšíření `OverviewTab`, ne nový tab — přání uživatele).
**Proč to je správně (a ne další variace):** Self-hosted bez cookies/IP/PII = GDPR-čisté bez consent lišty a bez závislosti na cizí službě (GA4/Plausible). Surové eventy + agregace dotazem = jeden zdroj pravdy, agreguju libovolně bez předpočítaných tabulek.
**Dvě netriviální designové pasti (kořen, snadno se přehlédnou):**
1. **Prerender by se počítal sám** — sidecar z 15B.1 je headless Chrome → spustí SPA JS → odpálil by ping a nafoukl návštěvnost o každý bot-render. Fix: sidecar vkládá do UA marker `Ikaros-Prerender`, BE ho v pageview filtruje (vedle bot UA regexu = kopie nginx mapy, dual-source).
2. **`document.referrer` je v SPA konstantní celou session** — zůstává externí stránka, co tě přivedla → každá podstránka by se nálepkovala původním vyhledávačem. Fix: referrer se posílá jen u 1. pingu session (externí zdroj); interní prokliky pošlou vlastní origin → BE → `internal`.
**Jak ověřeno:** BE jest 19/19 (filtr botů/prerenderu, kategorizace referreru 8 případů, aggregation totals/daily-fill/topPaths/sources, cache), typecheck + prettier/lint čisté. FE vitest 8/8 (ping dedupe + sessionId persist, dashboard render/loading/error/empty/přepínač období), `npm run build` ✓. `mobil-desktop` CSS audit: 2 opravy (graf min-width 1px+gap 1px → 90 sloupců se vejde na 375px; touch target 44px na přepínači).
**Zhodnocení:** dobře — spec→souhlas→plán→kód, jeden zátah BE+FE bez dluhu. Obě pasti chyceny v design fázi (ne až z dat), což ušetřilo cyklení. **Čeká deploy + BE restart + redeploy prerender sidecaru.**
**Příznak:** kdyby návštěvnost po nasazení byla nereálně vysoká → zkontroluj, že prerender sidecar reálně posílá UA marker (redeploy proběhl) a že bot regex sedí s nginx mapou.

---

### ✅ ŘEŠENÍ — 16.1a deník v chatu: rail + hod za postavu (reuse DiaryTab) · 2026-06-23
**Co nakonec zabralo:** Pravý panel chatu udělán kontextový (`ChatContextRail`): hráč = vlastní deník, PJ = Přítomní + klik na člena načte jeho deník (⟵ zpět). Deník v railu je **tenký wrapper kolem existujícího `DiaryTab`** (slug-driven, sám se plní přes `useCharacterDiary`, view/edit, save přes `customDataPatch`) — `DiaryTab` už propouští `onRoll` do sheetu (mapa to dělá taky). Hod z deníku jde do chatu přes **chat-local most** `rollFromDiary.ts` (zrcadlo `performSheetRoll`, ale bez importu z tactical-map) + hook `useChatDiaryRoll` (overlay.trigger → po doběhnutí `useSendMessage`). Atribuce: hráč/PJ bez override, NPC/bestie override (16.1b/c).
**Proč to je správně (a ne kopie):** Jediný zdroj pravdy deníku (list/mapa/chat = stejný `DiaryTab` + subdok). **Rail je systémově agnostický** — `getDiaryPreset(system).SystemSheet`, takže deník v chatu jede pro všech 13 systémů zdarma; hody tam, kde sheet má `onRoll` (matrix referenční: iniciativa + schopnosti). 16.1d = doplnit `onRoll` u systémů co ho nemají + grafika rail-fit.
**Dvě věci navíc:**
1. **Readout overlaye** schovával součet kostek (`label (mod) = total`) → doplněn operand `sum` jen při modifieru ≠ 0 (`Ledový dotek (+4) −1 = +3`). Sdílené s mapou → opraveno i tam.
2. **Pre-existující `react-hooks/set-state-in-effect` warningy v `DiceRollOverlay`** (háklivá komponenta, 6.3-fix1..8) opraveny beze změny chování: warmup → **lazy init** `useState(() => warmup && webgl)`; reset na nový hod → **adjust-during-render** (`if (rollTs !== trackedTs) {...}`) místo efektu se setState. React-blessed vzory, bez cascading renderu.
**Jak ověřeno:** 15 nových testů (rollFromDiary 5 / readout 3 / hook 4 / rail 3) + 103 chat testů zelených, eslint 0 (vč. opravených warningů), `npm run build` ✓. `mobil-desktop` CSS audit: rail 240→300px, mobilní šuplík 320px, readout flex-wrap+max-width.
**Zhodnocení:** dobře — spec→souhlas→plán→souhlas→kód, hladký zátah bez cyklení, nula BE práce (čtecí endpoint deníku už existuje, mapa ho používá). Reuse `DiaryTab` ušetřil ~13 per-system implementací. **Pozor do příště:** DiaryTab je těžký (266 kB chunk) — teď se táhne i do chat bundlu; kdyby vadilo, lazy-load `DiaryRollPanel`. **Čeká živý smoke (matrix svět) + funkce/napoveda + deploy.**
**Příznak:** kdyby hod z deníku v chatu „zmizel" (overlay bez zprávy) → ověř `doSend` callback v `overlay.trigger` (send až po doběhnutí) a že `DiceRollOverlayProvider` obaluje WorldChatPage.

---

### ✅ ŘEŠENÍ — 16.1b/c hledání NPC+bestie v railu + statblok bestie z katalogu · 2026-06-23
**Co zabralo:** Jedno pole hledání v presence railu (PJ): NPC (persona adresář) + bestie (`useBestiar`) → výběr načte deník NPC (atribuce `npc`) nebo **statblok bestie** (atribuce `bestie`). Bestie panel = reuse `BestieStatblock` (canEdit=false → read-only `EntityStatbar` + ability roll chipy) plněný z katalogové bestie přes `buildBestieToken(bestie,0,0)` (reálný `MapToken`, žádný type-lie), hod přes `useChatDiaryRoll` (větev `bestie` hotová z 16.1a).
**Proč správně:** Statblok bestie fakticky bydlí v `tactical-map` → reuse `BestieStatblock`+`buildBestieToken` místo kopie. Coupling chat→tactical-map vědomě přijat; **přímé importy (ne barrel) → DiceBox3D (PIXI 616 kB) zůstal samostatný lazy chunk, WorldChatPage jen 105 kB** (+4). Jedno pole = uživatelův záměr (16.1b `NpcDiarySearch` nahrazeno `RailEntitySearch`; `PersonaAutocomplete.placement` vrácen — konzument zmizel, nenechávat dead API).
**Jak ověřeno:** chat 109 testů (rail 13), `npm run build` ✓ (chunk check: chat bez PIXI), eslint 0.
**Zhodnocení:** dobře — bestie větev nezávislá na NPC/PC, hladké. **Pozor:** chat teď závisí na `tactical-map/components/tokens/BestieStatblock` + `utils/buildSpawnToken` (+tranzitivně schema-form); přesun primitiv do `shared/` = kandidát na dluh (16.1d).
**Příznak:** kdyby chat bundle náhle nabobtnal o stovky kB → někdo přidal do importního grafu z tactical-map něco s PIXI; z mapy importuj jen DOM/schema moduly přímo.

---

### CH-020 — deník v chatu postaven na DiaryTab místo combat panelu z mapy · 2026-06-23
**Kontext:** 16.1 deník v chatu měl vypadat „stejně jako v taktické mapě".
**Co jsem udělal špatně:** Reuse `DiaryTab` (= reálný list CharacterDetailPage → `MatrixSheet`, **plný** list: Overview/Vitals/Pressures/Languages/Inventory). Předpokládal jsem, že „deník mapy" = DiaryTab.
**Proč to nefungovalo:** Mapa NErenderuje DiaryTab — renderuje per-systém **kompaktní combat panel** (`COMBAT_PANELS` v `TokenSystemSheet` → `MatrixCombatPanel`…); `DiaryTab` je tam jen FALLBACK pro systémy bez panelu. Chat tak měl jiný (plný) layout než mapa (kompaktní statblok). Uživatel to reklamoval 3× (screenshoty), než jsem si přečetl `TokenSystemSheet`.
**Poučení:** Když má být „stejné jako X", PŘEČTI render X (`TokenSystemSheet`), ne reuse první podobné komponenty (`DiaryTab`). Combat panely jsou diary-backed přes `characterSlug` (sceneId nepoužit) → jdou pustit i mimo mapu (mini-token jen se slugem). Sdílení přes registr `combatPanels.ts` (export registru z komponenty = fast-refresh warning → vlastní modul). NPC = stejná cesta (DiaryRollPanel) → vyřešeno týmž fixem.
**Příznak cyklení:** uživatel opakuje „má to vypadat jako u mapy" + posílá screenshoty; já ladím obal (portrét/šířku) místo vnitřního sheetu.

---

### ✅ ŘEŠENÍ — 16.2a fix system-id driftu: nabídka ↔ diary/map engine (alias-most) · 2026-06-23
**Diagnóza (širší než dluh tvrdil):** `world.system` se ukládá **raw** z nabídky `RPG_SYSTEMS` (FE `system: finalSystem`, BE `resolvedSystem = dto.system` — žádná normalizace nikde) a pak ho **tři nezávislé vrstvy** hledají, každá s jinou sadou id. Dluh D-NEW-SYS-DIARY-DRIFT evidoval jen Dračí Hlídku; reálně spadnou na `generic` sheet **tři** systémy: `draci-hlidka`→engine zná `drdh`, `drd-plus`→`drdplus`, `call-of-cthulhu`→`coc`. Druhá, nezávislá porucha: **BE diarySchema seed** (`SystemPresetsService.findOne`, striktní `===`) nemá preset pro `matrix`/`drd16`/`drd2`/`drd-plus`/`draci-hlidka` → prázdné schema (sekundární, FE schémata jsou canonical, BE soft-mode — neřešeno teď, viz zúžený dluh).
**Co zabralo:** Přidat 3 aliasy `draci-hlidka→drdh`, `drd-plus→drdplus`, `call-of-cthulhu→coc` do `SYSTEM_ALIASES` v **obou** FE registry (`diary-systems/registry.ts` + `map-systems/registry.ts`). Sheet/plugin lookup oba normalizují přes alias před lookupem (precedent `dnd→dnd5e`, `pribehy→pi`).
**Proč alias, ne kanonizace nabídky:** Přepis nabídky z `call-of-cthulhu` na `coc` by **rozbil BE seed** (BE zná `call-of-cthulhu`) — jen přehození poruchy z FE na BE. Alias řeší FE lookup a **nesahá na nic dalšího**: staré i nové světy fungují, **nula migrace DB, nula BE restartu**. Přesně k tomu alias mechanismus v kódu je.
**Pojistka proti regresi:** parity guard — pro každý `RPG_SYSTEMS` (kromě `vlastni`) test ověří, že `getDiaryPreset(id)` i `getMapSystemPlugin(id)` vrátí dedikovaný sheet/plugin, ne `generic`. Nový `diary-systems/__tests__/registry.test.ts` (dosud žádný) + rozšířený map test. Chytí **jakýkoli** budoucí drift nabídka↔engine automaticky.
**Jak ověřeno:** `tsc -b` čistý, 45 testů zelených (oba registry). Live smoke (vytvořit svět „Dračí Hlídka"/CoC/DrD+ a ověřit, že deník/mapa ukáže svůj sheet) čeká.
**Zhodnocení:** dobře — verifikace driftu čtením tří vrstev odhalila, že roadmapa/dluh podhodnocovaly rozsah (1 systém → 3 FE + 5 BE); minimální bezpečný zásah (6 řádků) místo migrace; parity guard zabrání opakování. **Pozn.:** alias mapa je duplikovaná ve 2 registry (komentář tvrdí „jediná zdrojová pravda", fakticky 2 kopie) → mikro-dluh na extrakci.
**Příznak:** kdyby nově přidaný systém v nabídce ukázal generic deník/mapu → chybí alias nebo přímý klíč v registry; parity test to teď shodí v CI dřív.

---

### ✅ ŘEŠENÍ — 16.2a Matrix deník: grafický redesign „operátorský HUD" (vzor pro systémy) · 2026-06-23
**Co zabralo:** Přepis MatrixSheet z generického tmavého formuláře na cyberpunk HUD dle **odsouhlaseného standalone HTML prototypu** (`c:\tmp\matrix-denik-audit.html`). Postup: dlouhý iterativní brainstorming s uživatelem nad prototypem (ladění po kouskách: hero layout, vitals tracky, pips, magie, výpočty, validace) → spec-16.2a → kód. 3 soubory: `constants.ts` (stupnice 1–10 Talent..Entita + magie helpery), `styles/matrix.css` (kompletní HUD přepis, scoped), `MatrixSheet.tsx` (view/edit split + print). Nová pole `matrix_profession` (Povolání), validace (přečerpání bodů + schopnost≤aspekty), magie 📘 auto-match názvu (`MATRIX_MAGIC` list = magie v pravidlech) → `<Link>` na stránku magie.
**Proč to je správně:** (1) **Prototyp jako kontrakt** — vizuál i chování odsouhlaseny PŘED produkčním kódem, nula překvapení, žádné cyklení „uprav vzhled X" (kontrast s CH-015/CH-020). (2) **Reuse `makeCdAccess`** — datový přístup beze změny, BE netknuté (vše přes volný `customData`). (3) **Výpočty zachovány** (trojúhelník + aspekty ×6) — žádná regrese mechaniky. (4) **`data-mode` na `.matrix-sheet`** (ne na provider wrapperu) → edit-only CSS přes `.matrix-sheet[data-mode='edit']`.
**Past chycená:** `MatrixSheet` nově používá `<Link>` (magie) → **testy musí běžet v `MemoryRouter`**, jinak crash „useHref outside Router". `React.CSSProperties` bez importu Reactu → `import type { CSSProperties }`. Custom CSS prop `--lvlc` přes `style` cast `as CSSProperties`.
**Jak ověřeno:** tsc -b čistý · MatrixSheet 21/21 (přepsané na novou strukturu) · CharacterDetailPage 228/228 · `npm run build` ✓ · eslint 0.
**Zhodnocení:** dobře — spec→souhlas→kód, hladký zátah; prototyp ušetřil cyklení. **Vědomě zjednodušeno (follow-up):** H1 portrét = iniciály (sheet má jen slug, donačtení obrázku zvlášť) · H2 pips NPC clamp natvrdo PC=7 (sheet nezná `isNpc`). **Matrix = vzor;** sdílené prvky (Pips/VitalTrack) zatím inline v matrix/ — refactor do `_shared/` až u 2. systému (až bude jasné, co je společné). Čeká živý vizuální smoke + funkce/napoveda/roadmap po potvrzení.
**Příznak:** kdyby deník v testu/appce crashnul na „useHref" → chybí Router wrapper kolem sheetu (magie Link).

---

### CH-021 — portrét v deníku: hledal jsem ho přes 2 špatné zdroje (Character.imageUrl → usePersonaDirectory) · 2026-06-23
**Co jsem udělal špatně:** Pro hero portrét deníku (16.2a) jsem sáhl nejdřív na `useCharacter(slug).data.imageUrl` (tsc hned: **`Character` nemá `imageUrl`**), pak na `usePersonaDirectory` + find slug → `entry.imageUrl`. Druhý build/test prošel, ale **v reálu portrét nenaskočil** (Luke přitom obrázek MÁ — viz screenshot), a protože jsem z téhož vadného lookupu bral i `isNpc`, **NPC clamp by taky nešel**.
**Proč to nefungovalo:** Po **sjednocení 9.1 Character→Page** žijí bio data (`imageUrl`, bio, accessRequirements) na **`Page`** (`Page.characterRef`), ne na `Character` — `Character` drží jen subdoc data + `isNpc`/`kind` (říká to komentář v `characters.types.ts:1-9`, který jsem nečetl). `usePersonaDirectory` slug-match v reálu nesedl (slug/projection).
**Poučení:** (1) **Ověř, kde pole reálně žije, PŘED použitím** — u postavy po 9.1: obrázek=Page, `isNpc`=Character. Typový komentář v `*.types.ts` to často říká. (2) Pro spolehlivý fakt (isNpc) sáhni na **kanonický zdroj** (`Character.isNpc`), ne na odvozeninu z adresáře (`type==='NPC'` přes vadný lookup). (3) Uživatel nakonec portrét v deníku nechtěl → **iniciály**; NPC clamp jede z `Character.isNpc` (PC 7 / NPC 10, test pokrývá oba).
**Příznak cyklení:** druhý zdroj dat za sebou pro tutéž věc (portrét), oba selhaly jinak (tsc typo / runtime nenaskočil) — STOP a ověř datový model, ne třetí lookup.

---

### ✅ ŘEŠENÍ — 16.2a Matrix taktická mapa: combat panel HUD redesign · 2026-06-23
**Co zabralo:** Přepis `MatrixCombatPanel.tsx` + `.module.css` do HUD stylu sladěného s deníkovým listem (16.2a), dle odsouhlaseného prototypu `c:\tmp\matrix-mapa-audit.html`. Ořez na bojové minimum (STATY/Schopnosti/Přetlaky/Aspekty + Iniciativa); Vesta→Ochrana; Životy/Únava barevné tracky + postih readout; schopnosti pips 1–10 (PC7/NPC10 přes `useCharacter.isNpc`) + **klik na řádek = hod** (bez ikony kostky); přetlaky barevné 0–5; aspekty chip.
**Proč správně:** **Zachována veškerá logika** (iniciativa = 4dF+⌊nabité aspekty/2⌋, hody přes onRoll, auto-save debounce, permission gate canEdit). Reuse konstant z `diary-systems/matrix/constants` (matrixLevelName, SKILL_MAX). CSS module se **stavy přes data-atributy** (`data-on`/`data-kind`/`data-mod`/`data-charged`) místo kombinací tříd → barvy track/pips přes inline `--lvlc`/`--seg-color` var. **Obal `TokenInfoPanel`** (Zamknout/pin/skin/×/Body osudu) je sdílený všemi systémy → needituji ho; jeho sladění se skinem = otevřená otázka 16.2c.
**Past:** combat panel nově volá `useCharacter` (isNpc) → spec musí **mocknout `useCharacter`** (vedle useCharacterDiary). Přejmenování „Dovednosti"→„Schopnosti" a aspekt chip (aria-label→text) rozbilo 2 testy — přepsat na novou strukturu.
**Jak ověřeno:** tsc-b · 7/7 spec (přepsané) · 58/58 token-panel · build · eslint 0. Čeká **živý vizuální smoke** (token postavy na mapě).
**Zhodnocení:** dobře — prototyp opět = kontrakt, hladký zátah; reuse listových konstant. **Pozn.:** HUD CSS je teď duplikované (matrix.css scoped × MatrixCombatPanel.module.css) — skin engine 16.2c to má sjednotit (token sady). Roadmapa: přibyla položka „Bestie (grafika)" do matice per systém.
**Příznak:** kdyby combat panel v testu crashnul na QueryClient/useCharacter → chybí mock `useCharacter`.

---

### ✅ ŘEŠENÍ — 16.2a Matrix bestie statblok: HUD panel + HP výpočet + autosave · 2026-06-23
**Co zabralo:** Nový `MatrixBestiePanel.tsx` + `.module.css` (HUD jako combat panel), napojený v `TokenSystemSheet` bestie větvi pro `world.system==='matrix'` (ostatní systémy = generický `BestiePanelView`/schema engine, beze změny). Dle prototypu `c:\tmp\matrix-bestie-audit.html`. Reuse logiky z `BestiePanelView` (useTokenUpdate save, performSheetRoll/onMapRoll, systemStats z `matrix:token` schema, templateNotes z bestiar cache).
**Funkční mechanika (přání uživatele):** (1) **HP odvozené** `clamp(maxHP + zbroj − zranění, 0, maxHP)` — PJ edituje maxHP/zbroj/zranění, `health.current` se ukládá jako výsledek (token HP bar); zbroj = **skrytá vrstva** (hráč nevidí, „pohlcuje X/Y" jen PJ). (2) **Iniciativa sjednocená** — 1 pole bonus (`initiative.base`) místo 2 matoucích INIT polí. (3) **Schopnosti** pips 1–10 + 🎲 (na rozdíl od PC/NPC, kde je klik na řádek — bestie hodně edituje, klik by koliduje). (4) **Autosave** (debounce 500 ms) místo „Uložit statblok".
**Past:** `const s = ternary` se inferoval jako union (ne Record) → `s['k']=number` tsc error; anotovat `const s: Record<string,unknown>`. Testy: schopnost v editu = **input** (`getByDisplayValue`, ne getByText); HP num text „4/5" rozdělen na `4`+`<small>` → ověřovat **počet aktivních HP segmentů** (`[data-mod]` filtr — pips data-mod nemají).
**Jak ověřeno:** tsc-b · 4/4 spec (render/HP clamp/zbroj pohlcení/canEdit gate) · 58/58 token-panel · build · eslint 0. Čeká **živý vizuální smoke** (bestie token na mapě). Po BE — bez BE změny (jede přes systemStats patch).
**Zhodnocení:** dobře — prototyp=kontrakt; reuse BestiePanelView ušetřil save/roll plumbing. **Pozn.:** HUD CSS teď trojí duplikace (list/combat/bestie) — skin engine 16.2c sjednotí. Matrix má teď všechna 3 místa (list/combat/bestie) v HUD.
**Příznak:** kdyby bestie na mapě ukázala starý schema form → `world.system` není „matrix" nebo `tokenIsBestie` false.

---

---

## ✅ ŘEŠENÍ — 5.9b vlastní motiv + pozadí člena („Můj vzhled", jen pro mě) — 2026-06-23

**Problém / zadání.** Po hotfixu sdíleného motivu (Korektor přepsal vzhled všem → zvednuto na PomocnyPJ) zadal PJ navazující featuru: každý člen si má jít upravit vzhled světa podle sebe — **včetně motivu (skinu) a pozadí** — a nesmí to ovlivnit ostatní. To otáčí původní rozhodnutí 5.9 §5 (skin člen nemění).

**Co zabralo (přístup).**
- **Reuse existující 5.9 trubky.** Endpoint `PUT /members/me/theme` (self-scoped z JWT) + tab „Můj vzhled" už existovaly pro jas/kontrast/barvy → jen rozšířit DTO + membership o `themeId` + `themeBackgroundUrl`, ne stavět nový modul.
- **Žádná nová repo metoda.** `BaseMongoRepository.update` dělá `$set`; clear řeším přes `null` (Mongoose stripne `undefined` = beze změny, `$set: null` = clear). Ve `WorldLayout` `??` bere null jako „bez override". Minimální BE plocha.
- **„Follow PJ" sémantika.** `MyThemeTab` ukládá `themeId` jen když se LIŠÍ od `world.themeId` (jinak null) → člen nezůstane zaseknutý na starém motivu, když PJ změní sdílený. Klíčové rozhodnutí, jinak by se „dědění" rozbilo.
- **Vlastní motiv = samostatná vrstva.** Když člen zvolí jiný skin než svět, PJ overrides/pozadí (laděné pro skin světa) se na cizí skin nevztáhnou (odsouhlaseno PJ jako „bod 2"). Resolver ve `WorldLayout` i náhled v `MyThemeTab` to zrcadlí 1:1.

**Jak ověřeno.** BE jest `worlds.service.spec` 134/134 (+4: motiv/pozadí jde na membership ne World; `''`→null clear; backward-compat bez polí) · BE `tsc` ✓. FE vitest `MyThemeTab.spec` (follow-PJ null / vlastní themeId / předvyplnění z membershipu) + `WorldSettingsPage` 37 · `npm run build` (tsc -b) ✓ · `mobil-desktop` PASS (reuse responsivních tříd, grid auto-wrap, bgRow `@media`). Docs: spec 5.9b, funkce kap.10, napoveda (nový member Tool „Můj vzhled"), roadmap-fe.

**Zhodnocení.**
- 👍 **Dobře:** featura postavená výhradně z existující 5.9 infrastruktury (endpoint, atom, ThemePresetGrid, bg blok) → málo nového kódu, nízké riziko. Návrh pasti pochycené PŘEDEM v hlavě: (a) `toEntity` whitelist mapper — nová pole rovnou přidána (bez toho GET tiše zahodí); (b) `themeId` validace volná jako world DTO (`@IsString`, ne `@IsIn(THEME_IDS)`) → vyhne se dual-source 400 pasti.
- 👍 **Dobře:** náhled v editoru = stejný resolver jako runtime → „co uložíš, to vidíš" bez divergence.
- 📌 **Pozn.:** po BE změně nutný restart (whitelist ValidationPipe by jinak nová pole dropnul) — featura jinak na FE „funguje", ale BE pole zahazuje.

---

## ✅ ŘEŠENÍ — BE restart ukazoval „Tento svět nenajdeme" → globální údržbový overlay — 2026-06-23

**Problém / zadání.** Po restartu BE (deploy/údržba) viděl uživatel na stránce světa děsivé „Tento svět nenajdeme" (404 leak hláška) — vypadalo to jako ztráta dat / odebrání přístupu. PJ chtěl: rozpoznat, že jde o restart, a oznámit údržbu.

**Diagnóza (kořen).** `useWorld` failne na JAKOUKOLI chybu → React Query `retry:1` (main.tsx) selže za ~1–2 s → `WorldLayout` testuje jen `!world` (ne typ chyby) → vyrenderuje `WorldNotFound`. Network error (BE dole) má `error.response === undefined` (server neodpověděl) — **technicky rozlišitelné** od skutečné 404 (server odpověděl „nenašel").

**Co zabralo (přístup — varianta B, globální).**
- **Klasifikátor** `isBackendUnavailable` (`src/shared/api/isBackendUnavailable.ts`): bez `response` (network) NEBO 502/503/504 = výpadek; 404/403/**500** = BE odpověděl (500 = reálná chyba appky, ne údržba → vědomě false).
- **Detekce v axios interceptoru** (`client.ts`) s **prahem 2** po sobě jdoucích výpadků → `backendUnavailableAtom`. Práh = jeden náhodný blip nezačerní app, ale trvalý výpadek se chytne hned (RQ `retry:1` + paralelní dotazy stránky failnou rychle). **Reset na první úspěch** (success interceptor) i na první ne-výpadkovou chybu.
- **Globální `<MaintenanceOverlay>`** (mount v `main.tsx`, z-index nad toastem): „Probíhá údržba", sám poll-uje `GET /api/health` (existoval, veřejný!) à 4 s; po úspěchu interceptor atom shodí → overlay zmizí + `invalidateQueries()` → stránky se obnoví **bez reloadu**. FE-only, žádná BE změna.

**Jak ověřeno.** FE vitest: klasifikátor 4/4 (network/502-504 → true; 404/403/500 → false), overlay 2/2 (skrytý když BE běží / hláška + „Zkusit hned" při výpadku). `npm run build` (tsc -b) ✓, eslint ✓. Responsivní z principu (`width: min(420px, 92vw)`).

**Zhodnocení.**
- 👍 **Dobře:** rozlišení šlo po datech (`error.response === undefined`), ne po hádání. Práh 2 + reset-on-success dává přirozený debounce bez ručního časovače. `GET /health` už existoval → auto-zotavení zdarma, nula BE změny.
- 👍 **Dobře:** globální (B) místo per-stránka — pokrývá dashboard/chat/… jednotně, deploy je celoplošný. Overlay invaliduje dotazy → po naběhnutí BE se appka opraví sama, bez F5.
- 📌 **Pozn.:** overlay leží nad `WorldNotFound` (z-index 600 > toast 500); při zotavení se obě vrstvy srovnají přes invalidate. 500 záměrně NEspouští údržbu (to je `ErrorState` „Něco se rozbilo").

---

### ✅ ŘEŠENÍ — 16.2c Skiny deníku: skin engine F1 (BE) + F2 (FE list, 7 stylů) · 2026-06-24
**Co zabralo:** Cross-stack skin engine pro deník, **per uživatel × svět, cross-device**. Prototyp 7 stylů (`c:\tmp\matrix-skiny-audit.html`) odsouhlasen → spec-16.2c → BE F1 + FE F2.
**F1 (BE, sám):** `WorldMembership.diarySkin` reuse vzoru per-člen `themeId` — 5 míst (schema/interface/toEntity/DTO/service) + endpoint **reuse** `PUT members/me/theme {diarySkin}` + DTO whitelist 7 (`@IsIn`). Commit `04f9826` na main (typecheck+135 jest+prettier+lint). **Po BE změně RESTART** (ValidationPipe whitelist).
**F2 (FE, delegováno subagentovi, ověřeno mnou):** skin registr + `DEFAULT_SKIN_BY_SYSTEM`; `diary-skins.css` 7 token sad; **refactor `matrix.css` na `--mx-*` tokeny** — sci-fi defaulty v `:where([data-diary-system='matrix'])` (**specificita 0** → skin `[data-diary-skin]` (0,1,0) vždy přebije nezávisle na pořadí CSS) = regrese-safe; `useDiarySkin(worldId)` čte `membership.diarySkin` z `['worlds','my']`, fallback default dle systému, setter optimistic přes `useUpdateMyWorldTheme`; `data-diary-skin` na `DiarySystemProvider`; `DiarySkinSelector` „🎨 Vzhled" v DiaryTab.
**Proč správně:** reuse vzorů (themeId + my-world theme mutace); layout beze změny, mění se jen tokeny. `:where()` řeší regrese-safety bez závislosti na pořadí CSS.
**Past / poučení:** **agentní report = hypotéza** → ověřeno sám: tsc-b + 168 diary testů + build + selector integrace (grep). Subagent zvolen kvůli přetížené session.
**Jak ověřeno:** tsc-b · diary 168/168 · build · eslint 0. **Čeká: deploy FE + BE restart → vizuální smoke 7 skinů.**
**Zhodnocení:** dobře. **Zbývá F3** (combat/bestie module — tokeny z předka). Háčky: fonty CDN @import (self-host later); selector gated na `preset.SystemSheet` (dnes jen matrix).
**Příznak:** sci-fi deník po refaktoru jiný → `:where` specificita / fallback rozbitý; skin zápis 400 → BE nerestartovaný.

---

### ✅ ŘEŠENÍ — 16.1d Skin chatu = motiv světa (pivot + var-override, bez refaktoru CSS) · 2026-06-24
**Co zabralo:** Skin chatu navázán na **MOTIV SVĚTA** (12 žánrů), NE na 7 systémových diary skinů (16.2c plán). PJ motiv světa se propíše do chatu; hráč v 🎨 paletce („Vzhled chatu") přebije skin svého chatu (per člen×svět, `WorldMembership.chatSkin` přes `/chat/appearance`).
**Engine (klíč):** chat chrome **už čte `--theme-*`** (= výstup `buildSkinVars`). `getTheme(skinId).vars` je táž sada → skin = **scoped přepis `--theme-*` inline na `data-chat-skin` kontejneru** (`WorldChatRoom .room`) jen při overridu; CSS cascade vlije do celého subtree. **ŽÁDNÝ refaktor 40 chat CSS modulů** (spec původně předpokládala `--chat-*` refaktor — zahozeno). Default (bez overridu) dědí `:root` → **Ikaros beze změny**. Fonty override skinu dolož `loadThemeFonts` (extrakt z `applyTheme`, bez zápisu na `:root`).
**F1 (BE, sám):** `WorldMembership.chatSkin` + whitelist `WORLD_THEME_IDS` (12) na **existujícím** `/chat/appearance` (5 míst: schema/interface/toEntity/DTO/service read+write). BE typecheck zelený. **Po BE změně RESTART.**
**Pasti chycené:** (1) **nejde** dát chat jiný `data-theme` — base tokeny visí na `:root` pro JEDEN motiv → override by byl rozbitý mix; proto scoped `--theme-*` override. (2) **Chat = plochý message-stream (ne bubliny)** — prototyp (`c:\tmp\chat-skiny-16.1d.html`) realitu zjednodušil; reskin reálně nese **paleta+fonty+chrome+atmosféra plochy**, tvary bublin neexistují. (3) CSS moduly hashované → ornamenty přes `:global([data-chat-skin]) .local` gating uvnitř modulů; atmosféra plochy přes `[data-chat-skin]::after` (stabilní kontejner, ne hashované třídy).
**Jak ověřeno:** FE build (tsc -b + vite) zelený; BE typecheck zelený; vitest regrese dotčených oblastí 174/174 (chat+themes+HelpPage) + nový registry test 3/3. Spec + design audit + prototyp odsouhlaseny uživatelem před kódem. **Proces past:** `npm/npx --prefix "<path>"` u vitest spustí merge bug („failed to find current suite", 0 testů) — pouštět z cwd projektu bez `--prefix`.
**Zhodnocení:** **dobře** — využití toho, že chrome už čte theme tokeny, ušetřilo velký refaktor a dalo 12 skinů „zadarmo" přes existující 5.7 motivy. **Špatně/poučení:** prototyp s bublinami nastavil chybné očekávání vs realita (plochý stream) → příště ověřit reálný DOM PŘED stavbou prototypu. Ornamenty = 1. pass (atmosféra + chrome hlavičky); heavy per-prvek ornamenty = volitelná vizuální iterace s eyes-on.
**Příznak:** override skin nemění chat → `data-chat-skin` se nepropsal / appearance query nenačtená; skin zápis 400 → BE nerestartovaný (whitelist); cizí font fallback → `loadThemeFonts` neproběhl.

---

### ✅ ŘEŠENÍ — odhlašování z mobilu: kořen = krátká refresh TTL (NE cross-site cookie), zvednuto na 60 d · 2026-06-24
**Kontext:** Uživatel: „pracuju na PC (Opera), odhlásí mě z mobilu; nechci být odhlašován při práci na víc zařízeních". Navázáno na ✅ ŘEŠENÍ z 2026-06-21 (auth 401 + session), které kořen „odhlašuje po dnech" hádalo jako **cross-site cookie blok** (FE/BE různé eTLD+1) = deploy topologie.
**Co zabralo — diagnóza:** (1) `refresh()` neřeší per-user obnovu — refresh token + httpOnly cookie fyzicky leží na klientovi, server z PC requestu na mobilní token NEDOSÁHNE → uživatelova „varianta B" (restart vázaný na uživatele) je technicky nerealizovatelná; expirace = JWT `exp` + cookie `maxAge`, oba na zařízení. (2) **Živé ověření produkce vyvrátilo cross-site hypotézu:** `curl https://www.projekt-ikaros.com/api/health` → 200 přes **Caddy**, `POST /api/auth/refresh` → 401 „Chybí refresh token" → **API je same-origin** (`VITE_API_URL` prázdný, reverse-proxy), cookie je **first-party**, refresh jede i na mobilu. (3) Zbylý kořen = **refresh TTL 3 dny** (sjednoceno 21.6.) + per-device sliding: řídce používaný mobil přesáhne 3 dny nečinnosti → token vyprší → logout. Sliding obnoví JEN aktivní zařízení.
**Co zabralo — fix:** refresh TTL **3 → 60 dní**, sjednoceno na 4 místech (kořen byl drift): fallback v kódu `auth-cookie.ts ttlMs` (`?? 30→60` po korekci uživatele) + `auth.service.ts` `?? '60'`, docker-compose.prod `${…:-60}`, `.env.example`. Access `JWT_EXPIRES_IN` nechán (1d; refresh ho bezešvě obnoví). Per-device model nezměněn — dlouhá TTL splní „nebýt odhlašován" bez per-user redesignu (ten nejde). **Uživatel nastaví GitHub var `JWT_REFRESH_TTL_DAYS=60` + redeploy BE.**
**Jak ověřeno:** BE `npm run typecheck` ✓, `jest auth.service.spec` **73/73** (mock vrací '30' → fallback se netriggeruje, změna pro testy neviditelná). Same-origin + endpoint live ověřeno curlem proti produkci.
**Zhodnocení:** **dobře** — živé curl ověření obrátilo chybný závěr z 21.6. (cross-site → same-origin) místo slepého opakování deploy hypotézy. **Špatně/poučení (→ CH-022):** doporučil jsem „variantu B" a eskaloval na spec-driven PŘED čtením kódu (které ukázalo neproveditelnost) a PŘED čtením indexu deníku (kde byl přímý záznam k tématu). U auth/session/deploy čti deník PRVNÍ. **Pre-existující drift opraven:** fallback `?? 3` × deklarované `30` (docker/env.example) = tichá degradace na 3 dny při chybějící proměnné.
**Příznak:** odhlašuje z řídce používaného zařízení po pár dnech, ač na jiném pracuješ denně → krátká refresh TTL + per-device sliding; NEhádat cross-site, dokud neověříš same-origin (`curl /api/health`).

---

### ✅ ŘEŠENÍ — mobil: search lupa z draweru do headeru vedle pošty (šířkově neutrální výměna ⚙→🔍) · 2026-06-24
**Kontext:** Tester (má nejmenší mobil z týmu) chtěl vyhledávání ne v rozbalovacím draweru, ale hned v headeru vedle pošty.
**Co zabralo:** Lupa `.searchIconBtn` už v headeru EXISTUJE (tablet 769–1024) — na ≤768 byla jen `display:none` (komentář „tlačila by ostatní akce"). Fix = na ≤768 `display:flex`. **Klíč proti přetečení na malém mobilu = NEpřidávat prvek, ale VYMĚNIT:** ⚙ nastavení (`.settingsBtn`) na ≤768 skryto a přesunuto do draweru → actions drží 3 prvky (🔍 ✉ persona) + ☰ jako dřív (✉ ⚙ persona). Search z draweru odebrán (`drawerSearch` + mrtvý CSS smazán). Volba ⚙ jako ustupující: search hráč používá často, nastavení zřídka (taby uvnitř gatuje role).
**Jak ověřeno:** `tsc -b` ✓, `WorldLayout.spec` 5/5 ✓. `mobil-desktop` přes CSS: šířkově neutrální (žádný nový prvek), `.worldName` ellipsis (`flex-shrink:1;min-width:0`) brání h-scrollu, touch targety 44px (`.actionBtn` na ≤768). Vizuál na reálném malém telefonu = čeká potvrzení testera.
**Zhodnocení:** dobře — overflow riziko vyřešeno výměnou místo přidání (vzor pro header na úzkých displejích: počet prvků konstantní). Redundance ⚙ na tabletu (header i drawer 769–1200) dořešena: drawer-nastavení skryto >768px (`.drawerSettingsOnly`) → princip „co je v headeru, není v draweru".
**Příznak:** header h-scroll na úzkém mobilu → přibyl prvek bez výměny / chybí ellipsis na `.worldName`.

---

### ✅ ŘEŠENÍ — PWA: obnova posledního místa při cold openu (detekce v JS, ne manifest start_url) · 2026-06-24
**Kontext:** Tester (mobil/PWA) chtěl, aby otevření appky z plochy nenaskočilo na úvodní Ikaros, ale na poslední místo (svět). Kořen: `manifest.start_url:"/"` → PWA cold open vždy na dashboard; `loginIntent` je v sessionStorage (nepřežije reopen).
**Co zabralo:** `shared/lib/lastRoute.ts` — `saveLastRoute` (localStorage, blacklist root+auth-flow) volaná z `router.subscribe`; `applyStartupRestore()` volaná v `router.tsx` **PŘED `createBrowserRouter`** → `history.replaceState` na lastRoute, takže router se inicializuje rovnou tam, **bez bliknutí dashboardu**. `clearLastRoute` v `useLogout`.
**Designový pivot (díky postřehu uživatele):** původně přes `start_url:"/?restore=1"`. Zahozeno — `manifest.start_url` čte OS/prohlížeč, update prodlený a na **iOS nespolehlivý** (drží starý manifest do přeinstalace). Náhrada = **detekce v JS** (nasadí se spolehlivě s app update: SW `skipWaiting` + shell network-first). Gate obnovy: `pathname==='/'` + **standalone PWA** (`matchMedia('display-mode:standalone')`/`navigator.standalone`) + **cold open** (`performance` nav type `'navigate'`, ne `'reload'`) + token + validní lastRoute. **Rozlišení cold-open vs klik „domů" = plné načtení (modul běží) vs SPA navigace (neběží).**
**Jak ověřeno:** `tsc -b` ✓, `lastRoute.spec` 12 + `WorldLayout.spec` 5 = **17/17** ✓. Žádná BE změna, manifest netknutý, žádný balík. **Vitest gotcha (známý):** 1 spec soubor sám → flaky „failed to find current suite" (config merge bug); spuštěno s víc soubory → projde.
**Zhodnocení:** dobře — uživatelův dotaz „nemá se PWA aktualizovat samo?" odhalil slabinu manifest přístupu a vedl k robustnějšímu JS řešení (funguje i na existujících instalacích, i na iOS). replaceState před router-init = čistý vzor pro deep-link restore bez flashe.
**Příznak:** PWA naskakuje na dashboard místo posledního místa → appka neaktualizovaná (starý JS) NEBO není standalone (otevřeno v prohlížeči, ne z plochy); flash dashboardu → restore až po router-init místo před ním.

---

### ✅ ŘEŠENÍ — objevitelnost chatu: zvýrazněný vstup v nav + dashboard dlaždici (accent tokeny) · 2026-06-24
**Kontext:** Dva testeři přehlédli chat — chyběl v navigaci úplně (`buildWorldNav` ho neměl) a dashboard dlaždice bez čísla splývala. Tester-feedback po předchozích (search, PWA, refresh TTL).
**Co zabralo:** (1) **`ChatNavLink`** samostatná komponenta — chat NEdán do `buildWorldNav`, protože badge je dynamický (`useWorldChatUnread`) a hook nejde volat podmíněně v `NavDropdown`. Accent pill (`--accent-soft` bg, `--accent-dim` border, `--accent-bright` text) + unread badge s pulzem (jen >0, vypnut při `prefers-reduced-motion`). 2 varianty `bar` (desktop header, první) / `drawer` (mobil). (2) **`DashTile`** rozšířen o `accent` (gradient+obrys+glow) a `cta` (text místo chybějícího čísla → „Otevřít ›"). Vše přes **accent tokeny** → 33 skinů zdarma (reuse vzoru `--accent-soft` pill ze search baru).
**Past chycená v `mobil-desktop` (ne testy):** `ChatNavLink bar` jsem vložil **mimo `<nav>`** → neskryl se s `.nav` na ≤1200px (hamburger) → pill by přetékal mobilní header vedle hamburgeru. Fix = `@media(max-width:1200px){.bar{display:none}}` (drawer varianta přebírá pod 1200). **Test drift:** nový data-hook v render stromu rozbil `WorldLayout.spec` (2) → přidán `vi.mock` `useWorldChatUnread` (konzistentně s ostatními stuby).
**Jak ověřeno:** `tsc -b` ✓; `ChatNavLink.spec` 4 (badge >0/0/99+) + `WorldLayout.spec` 5 + `cards.spec` 13 ✓. **Vitest gotcha:** flaky „failed to find current suite" (merge bug) → spouštět s `-c vitest.config.ts` (obejde). Reálný vizuál = čeká screenshot.
**Zhodnocení:** dobře — accent pill jako vlastní komponenta (ne natlačit do nav configu) dalo čistý hook + 2 varianty; mobil overflow chycen designovou analýzou breakpointů, ne až uživatelem. **Poučení:** prvek vložený MIMO `.nav` nedědí její `display:none` breakpointy → vždy zkontroluj skrývání na ≤1200/≤768 u čehokoliv v headeru.
**Příznak:** accent pill v headeru na mobilu vedle hamburgeru → chybí `@media display:none` (prvek mimo `.nav`); layout test „No QueryClient" → nová komponenta s useQuery bez stubu.

---

### ✅ ŘEŠENÍ — 16.1e combat roster v chatu: jádro BE+FE (A–D), perzistentní bestie + iniciativa + kola · 2026-06-24
**Kontext:** 16.1e — v konverzaci jde vést souboj: lišta nad chatem (PC/NPC/bestie, iniciativa, v boji/mimo), „i" otevře bojovníka v boku, bestie = perzistentní instance s HP na konverzaci (přežije reload), kola/„na tahu" po „Začít boj". Spec [spec-16.1e](../arch/phase-16/spec-16.1e-bestie-konverzace.md) (boří hranici 16.1 „chat=roll-only"). Velký kus napříč BE+FE.
**Co zabralo (rozhodnutí, co drží):**
- **Datový model = embedded `combatants[]` + `combat` + `chatCombatConfig` na `ChatChannel`** (ne nová kolekce) — parita s `MapScene.tokens`, jede se soft-delete světa zdarma. Discriminated union `character` (jen slug ref, HP v deníku) | `bestie` (snapshot instance). **PC/NPC HP NEDUPLIKOVAT** — single source = deník.
- **Atomické operace v repository** (`$push`/`$set arrayFilters [{'c.id':…}]`/`$pull`), NE přes `updateChannel` full-array → race-safe paralelní editace HP (vzor map operations / D-040).
- **Add-payload nese hotový snapshot z FE** (`buildBestieToken`+`getBestieAbilities`) — parita s mapovým `token.add`; BE jen gatuje PJ + `$push` → **odpadla bestiae dependency na BE**.
- **WS `chat:combat:updated {channelId}`** na room `chat:{channelId}` (leak-safe signál) → klient refetch s server-side R3 filtrem.
- **FE reuse:** `useChatCombat` = analog mapového `useCombat` (start/nextTurn wrap→round+1/end); lišta = vlastní `ChatInitiativeBar`+`ChatInitiativeBarItem` (vizuál port `InitiativeBarItem`, ne adaptér na `MapToken`); bok bestie = `BestieInstancePanel` (reuse `BestieStatblock` + autosave vzor `MatrixBestiePanel`); spawn přes `ChatContextRail` combatAddMode (reuse `RailEntitySearch`+`ChannelMemberPanel`). „i" → `WorldChatRoom` stav `openCombatantId` → rail bok.
**Vlastní chyby/ústupy (chycené):**
- **Návrhový omyl R3:** ve specu jsem nejdřív navrhl per-instance toggle `hpVisibleToPlayers`. Realita mapy = **per-typ** flag (`showHpPc/Npc/Bestie`) na 2 úrovních (world default `MapDefaultsTab` + per-scéna `EditSceneModal`). Opraveno až po ověření kódu mapy. **Poučení: než navrhnu „parita s X", přečti reálné X, nepředpokládej tvar.** (viz [CH-020])
- **TDZ:** `useEffect([activeChannelId])` vložen NAD `const activeChannelId = useMemo(...)` → ReferenceError při renderu. Chyceno hned (tsc), přesunuto pod definici.
- `useRef<T>()` bez argumentu (React 19 typy vyžadují initial) + `useCallbackRef` neexistuje (odstraněn) — triviální.
**MVP ústupy (vědomé, k případné revizi):** PC/NPC HP-tier na liště = neutrální ring (HP v deníku, rosterem neprochází — barevný by chtěl fetch deníku každé postavy; bestie ring je z instance). BE neověřuje `systemStats` proti per-system schématu (vyhnul jsem se couplingu chat→maps; PJ-only zápis validní katalogové bestie). Atribuce hodu za postavu z lišty = slug místo jména.
**Jak ověřeno:** BE `tsc --noEmit` ✓ + chat/global-chat jest **234/234** ✓ (rozšíření `IChatChannelRepository` → doplněny mocky ve 2 spec souborech); FE `tsc -b` ✓. **Zbývá (E+F): world default viditelnosti + per-konverzace 👁 override · vitest/jest combat testy · mobil-desktop · funkce/napoveda · plný `npm run build` · smoke po BE restartu.**
**Zhodnocení:** dobře — reuse mapových vzorů (combat hook, statblok, autosave, atomic ops) udržel velký feature kus zvládnutelný a typově čistý napoprvé; sub-kroky A→D s ověřením po každém = kvalita v dlouhé session. Špatně — návrh R3 naslepo (oprava po feedbacku), připomíná [CH-020].
**Příznak:** GET combatants vrací prázdno ač DB má data → chybí `combatants` v repo `toEntity` (field-drift); HP editace přepisuje jiného combatanta → full-array místo `$set arrayFilters`; hráč vidí staty skryté bestie → GET filtr nestripoval `systemStats`.

**Navazující revize D2 (změna přístupu po živém testu) + E:**
- **D2 — vodorovná lišta nad konverzací → vertikální rail mód „Souboj".** Autor po vyzkoušení: lišta nahoře ukrajovala ~110 px **výšky textu**. Kořen mého původního návrhu: zkopíroval jsem mapový vzor (`InitiativeBar` = vodorovná lišta nad plátnem) i layout, ne jen funkci. **Mapa je široké plátno (pruh nahoře nevadí), chat je úzký vertikální tok (každý px výšky = text).** Fix = `CombatRosterPanel` jako svislá záložka v pravém railu (vedle „Přítomní"); **veškerý combat UI stav přesunut z `WorldChatRoom`/`ChannelView` do lokálního stavu `ChatContextRail`** (rail si sám řídí tab/openCombatant/addMode) → `ChannelView`/`WorldChatRoom` čisté, žádný cross-component drilling. Poučení: **přenes z reuse vzoru funkci, ne formu** — ověř, že layout dárce sedí na příjemce.
- **E — viditelnost HP (R3):** per-konverzace `chatCombatConfig` (PATCH `/combat-config` + 👁 chipy v panelu) + world default `worldSettings.chatCombatDefaults` (samostatné od `mapDefaults`, O3) přes vzor `MapDefaultsTab` (5 míst world-settings). `resolveCombatConfig`: per-konverzace ?? world default ?? true.
- **Ověřeno (D2+E):** FE `npm run build` ✓ + vitest combat (sort/tie-break/no-mutate) 4/4; BE typecheck + jest 237/237. **Zhodnocení:** dobře — přesun stavu do railu zjednodušil integraci (méně props), reality-driven UX oprava. Špatně — formu lišty jsem převzal naslepo (stejná třída chyby jako návrh R3 / [CH-020]); kdybych si představil chat layout, navrhl bych bok rovnou.

**Doladění D3 (po testerském průchodu — 3 mezery, co statická implementace + mockup nechytily):** (a) **PC nešly přidat do boje** — přidávání jsem dal jen přes klik na člena v Přítomní (vázané na `characterPath`, Korektoři ho nemají) → fix: PC v `RailEntitySearch` (`includePc` v addMode, filtr `type==='Postava hráče'`, kind `pc`). (b) **Nešlo odebrat PC/NPC z rosteru** (jen bestie přes detail panel) → fix: 🗑 na každém řádku `CombatRow` (PJ) → `removeCombatant`, plošně pro všechny typy. (c) **PC/NPC bez portrétu** (combatant nese jen slug, ne obrázek — záměrně reference) → fix: `resolveImage` v panelu z `usePersonaDirectory` (slug→imageUrl). **Poučení:** combat roster pro PC jsem navrhl „klikem v Přítomní + odebrání přes detail" — nesedělo na reálný flow; **plošné akce (přidat/odebrat) patří na roster přímo a přes hledání, ne schované za typ entity**. Živý smoke odhalil to, co tsc/build/mockup ne. Čisté FE, build ✓. (d) **PC/NPC šly přidat duplicitně** (tatáž postava 2× v boji) → dedup v `addCharacter` dle `characterSlug` (bestie duplikace zůstává — kopie nestvůr). FE-only guard, BE dedup = follow-up (race dvou PJ).
**Proces-poučení (cyklení „nevidím změnu"):** tester deploynul build **mezi dvěma commity** (18:06 bez odebrání/PC-search, vs 19:18 s nimi) → viděl mezistav a symptomy („nevidím odebrání", „nejde přidat") vypadaly jako bugy v kódu, ač kód byl OK. Promarnil jsem ~3 kola na FE cache / BE restart, než jsem ověřil **`git log -S "<symbol>" --oneline`** + timestampy commitů vs. čas deploye. **Před diagnostikou „nasazený bug" nejdřív zjisti, KTERÝ commit je reálně nasazený** (ne hádej cache/restart). Příbuzné [CH-015] (prod stale vs lokální).
(e) **Hledání „přidat do boje" bylo v Přítomní, ne v Souboji** (klik „+ přidat" v Souboji přehodil uživatele do Přítomní — nelogické) → přesunuto do záložky Souboj (addMode = lokální koncept Souboje, reset při přepnutí tabu; Přítomní search jen pro otevření deníku, bez PC). **Opakovaný TDZ (potřetí v `ChatContextRail`!):** `handleSearchSelect` byl `const` definovaný AŽ ZA `if (tab==='combat') return` → ReferenceError. **Poučení: `ChatContextRail` má sérii early-returns — všechny handlery/helpery definuj NAD první `return`** (po hooku, před větvemi). Stejně activeChannelId useEffect a combat useEffect dřív.
(f) **Rozbitý layout Souboje v addMode** (tester: „graficky příšerné") — banner + hledání + roster se dělily o výšku (banner obří). Kořen = moje vlastní CSS z D2: `.tabWrap > :not(.tabs) { flex: 1 }` dalo `flex-grow:1` VŠEM dětem obalu, ne jen panelu → 3 flex děti rovnoměrně. Fix = `.tabWrap > :last-child { flex: 1 }` (roste jen panel, banner/search default `flex-grow:0`). **Poučení: `flex:1` na skupinovém selektoru (`> *` / `> :not()`) roztáhne i pomocné prvky vložené později; cíli ho na konkrétní prvek (`:last-child`).** Hledání odebráno z Přítomní (jen v Souboji, dle autora) — ztráta 16.1c „hod za NPC mimo boj z Přítomní" (nahrazeno flow přes Souboj), prokomunikováno.

### ✅ ŘEŠENÍ — 16.1f čtenářský font override + UI fixy (neprůhledné pozadí, kompaktní kostky) + oprava dluhu hlubší než popis · 2026-06-24
**Co:** Tester chtěl číst zprávy buď fontem každého odesílatele (6.2f), nebo přepínačem převést vše do **vlastního** čitelného písma. Implementováno jako per-viewer×per-svět override + 2 UI fixy + oprava dluhu.
**Co zabralo (16.1f):**
- **Jediné hrdlo na FE.** Font/velikost teče na bublinu JEN přes 2 resolvery (`resolveFont`/`resolveFontSize`) v `ChannelView` → override = obejít je, když `readerFontOverride`. **Žádná změna `MessageList`/`MessageItem`.** Malá lokální změna velkého efektu.
- **BE = 3 pole vzorem `chatSkin` (16.1d):** `readerFontOverride/readerFont/readerFontSize` na `WorldMembership`, 5 dotykových bodů (schema·interface·**toEntity**·service get+update·DTO whitelist). Reuse endpointu `/chat/appearance`, whitelist reuse `CHAT_FONT_KEYS`/`CHAT_FONT_SIZE_KEYS`.
- **Kurátorská podmnožina** (`READABLE_FONT_KEYS`, 6 čitelných) — nabízet 40 ozdobných jako „čitelný režim" je proti smyslu.
- **Toggle = optimistický** (`qc.setQueryData` + PATCH; `onSuccess` přepíše serverem → self-correcting i při dropnutí pole před BE restartem). Sekce „Jak čtu ostatní" v `AppearancePopover` = instant, mimo „podpis" (vzor skinu).
**UI fixy (testerská zpětná vazba během práce):**
- **Neprůhledné pozadí popoveru + sdíleného `Modal`u.** Kořen: theme tokeny `--theme-surface*` mají **alfu 0.74–0.9** → chat/Matrix-rain za panelem prosvítal. Fix = složit translucentní surface na **neprůhledný `--bg-primary`** (`background-color: var(--bg-primary,#0c0820); background-image: linear-gradient(surface, surface)`) — zachová tint, zabije průsvit. ⚠️ **1. pokus mířil na `--theme-bg`, který NEEXISTUJE → bez fallbacku spadl na `transparent`, fix nezabral, uživatel hlásil „stále průhledné" → [CH-024].** ⚠️ `Modal.module.css` = **global blast radius** (zneprůhlední všechny modaly) — vědomé, modaly mají být neprůhledné z principu, prokomunikováno.
- **Kompaktní `DiceMessage`** — kostky `size 80→52` (glyf `size*0.42` škáluje s tím), `sceneWrap min-height 120→60`, total box + gapy menší, mobilní media query proporčně.
**Past — oprava „dluhu" hlubší než zalogovaný popis:** Zalogoval jsem `D-NEW-chat-combat-test-provider` jako „chybí `QueryClientProvider`". Provider fix dal jen **3/5** zelených. Zbylé 2 testy ověřovaly chování, které **16.1e záměrně zrušil** (komentář v kódu: search NPC/bestií přesunut z „Přítomní" do „Souboj→+přidat", výběr přidá do boje, neotevírá deník) → **obsolete z behavior change**, ne provider problém. Přepsány na nový kontrakt (mock `useChannelCombat`+`CombatRosterPanel`+bestie helpery). **Poučení: než „opravím dluh" podle popisu, SPUSŤ test a přečti SKUTEČNOU chybu — popis dluhu (i můj vlastní z této session) chytá jen špičku.**
**Jak ověřeno:** FE `npm run build` ✓ (2×), chat+world/chat vitest **243/243** ✓ (bylo 238/5), BE `tsc --noEmit` ✓ + lint ✓. ⚠️ **BE čeká restart** (`feedback_be_restart_required`). Mobil-desktop: strukturálně projde, watch-item = hlavička konverzace má teď 7 prvků (squeeze názvu na úzkém mobilu — řeší se).
**Zhodnocení:** dobře — „jediné hrdlo" + reuse appearance trubky udržel feature malou a typově čistou napoprvé; UI fixy hned dle zpětné vazby; neprůhlednost systémově (kompozice na bg), ne hack per-komponenta. Špatně — opravu vlastního čerstvého dluhu jsem začal podle popisu místo podle běhu testu (3/5 → dohledat zbytek); příště test-first i u „triviálního" test-dluhu.
**Příznak:** „opravil jsem dluh" ale test pořád částečně červený → popis dluhu zachytil jen jednu příčinu; behavior-change v sousední feature (16.1e) udělal staré testy obsolete, ne broken.

---

### CH-024 — neprůhlednost popoveru/modalu mířila na neexistující `--theme-bg` → `transparent`, fix nezabral · 2026-06-24
**Co jsem udělal špatně:** Na „chat prosvítá popoverem/modalem" jsem složil translucentní surface na **`--theme-bg`** (`background-color: var(--theme-bg)` + gradient surface). Předpokládal jsem, že `--theme-bg` je core token „vždy definovaný" (i komentář jsem tak napsal).
**Proč to nefungovalo:** `--theme-bg` **neexistuje** — `buildSkinVars` (`themes/themes/_skinBase.ts`) mapuje `bgPrimary` na **`--bg-primary`** (+`--header-bg`), NE na `--theme-bg`; žádná `--theme-bg:` definice v repu není (jen `--presence-ring: var(--theme-bg, #fff)` fallback to maskoval). `var(--theme-bg)` **bez fallbacku** → nedefinovaná custom property → `background-color` spadne na **`transparent`** → panel zůstal průhledný, jen translucentní gradient. Fix nezabral, **uživatel hlásil „stále moc průhledné" = 1 cyklus.**
**Co zabralo:** `background-color: var(--bg-primary, #0c0820)` (reálný opaque token per motiv, ověřeno: žádný `bgPrimary` není rgba/hsla → opaque ve všech motivech; navíc funguje i na světlých skinech, kde tmavý fallback `#0c0820` by byl špatně). Oprava v `AppearancePopover.module.css` i `Modal.module.css`.
**Poučení:** (1) **Než postavím fix na CSS custom property, ověř, že REÁLNĚ existuje** — `grep -rn "\-\-token:" src/` (definice), ne jen výskyt v `var(...)`. (2) **`var(--x)` bez fallbacku u nedefinované property = `initial`** (u `background-color` → `transparent`), tichý fail bez chyby v konzoli/buildu. (3) `--theme-*` ≠ `--bg-*` — projekt má DVĚ rodiny tokenů (`buildSkinVars` výstup): theme rodina (`--theme-surface/-text/-accent…`) i legacy/bg rodina (`--bg-primary/-card…`); page bg = `--bg-primary`. (4) Build/tsc/testy jsou na runtime CSS-var rozlišení **slepé** → tahle třída chyby projde vším a chytí ji jen oko (proto cyklus).
**Příznak cyklení:** uživatel opakuje „stále průhledné" po mém „opraveno"; ladím kompozici/alfu, ač kořen je, že `background-color` je celou dobu `transparent` (token neexistuje).

---

### ✅ ŘEŠENÍ — 16.2b deník DrD 1.6 grafický redesign (fantasy pergamen; 2. systém po Matrixu) · 2026-06-24
**Problém:** Přepsat generický „amber dungeon" formulář drd16 na profesionální fantasy list věrný reálnému papíru „Osobní deník" + opravit strukturu statů dle pravidel potvrzených uživatelem.
**Co zabralo:** Prototyp = kontrakt (`c:\tmp\drd16-denik-audit.html`) laděný v ~5 iteracích PŘED produkčním kódem → produkce na jeden zátah, build/test/eslint zelené napoprvé. Reuse `cdAccess` (neprefixované klíče, BC) + `useCharacter`→`isNpc` (vzor Matrix), BE netknuté. Restrukturace polí s BC: `enc_*` reuse s novou sémantikou (pohyblivost při naložení), nové klíče `size_letter`/`per_*`/`armor`/`class_spec`/`notes`, staré osiří bez migrace.
**Klíčové zhodnocení (dobře):**
- **„Předchozí vzhled byl lepší" = vrať vzhled, vyřeš ortogonální problém jinak.** Životy/magy jsem na dotaz „řešíš 340 ŽT?" překlopil na proporční flakon — uživatel chtěl zpět **původní vysoký číslovaný žebřík**. Řešení škálování = NE měnit vizuál, ale **přečíslovat poměr příček** (≤50 „1 příčka=1 bod", >50 poměr max/50, popisky se přepočítají). Vizuál beze změny, limit zmizel. Mobil = orthogonální swap přes media query (žebřík→vodorovný proužek), oba v DOM.
- **Token rozhodnutí:** drd16 default skin = `fantasy`, ale existující fantasy skin ≠ můj pergamen. Kdybych konzumoval sdílené `--mx-*` (jako Matrix), aktivní fantasy skin by pergamen přebil → list by ukázal starý skin, ne schválený vzhled. → **16.2b self-contained `--dd-*`** (vlastní tokeny), sjednocení se skin-enginem až 16.2c. Pozor: vzor z Matrixu (`--mx-*` token-ready) NEjde slepě kopírovat, když má systém jiný default skin než je jeho „reálný list".
**Zhodnocení (co hlídat):** self-contained pergamen znamená, že 7 skinů přes drd16 zatím nefunguje (16.2c je dotáhne) — vědomá hranice, ne dluh. Erb je zatím jen dekorativní SVG; upload vlastního erbu = navazující sub-krok (per postava), čeká rozhodnutí o úložišti.

### ✅ ŘEŠENÍ — 16.1d-F3 fantasy chat naceleno (chrome + oddělení zpráv A + souboj) · 2026-06-25
**Problém:** „První vzhled (ikaros) hezký, ostatní odflákli." Fantasy chat = jen přebarvený ikaros (paleta+font), bez tvarového jazyka/signature ornamentu = „odfláknutý". Cíl: profesionální úroveň (kvalita > čas, vzor pro dalších 10 F3 motivů). Souběžně: zprávy v chatu vizuálně splývají (plochý stream).
**Co zabralo (3 vzory, znovupoužitelné pro F3):**
- **Signature ornament přes `mask-image` + token barva.** Filigrán-vlnovka (hlavička `::after`, RP datum `::before/::after`) jako `-webkit-mask`/`mask` SVG data-URI, `background: var(--ch-accent / --theme-accent)` → tvar z masky, barva z tokenu = **0 hardcoded hex** (color-lint clean) + ladí i s barvou kanálu. Iluminovaná iniciála = `.title::first-letter` (žádný TSX/DOM zásah). **Celý fantasy chrome je CSS-only**, scoped `:global([data-chat-skin='fantasy'])` v jednotlivých modulech (vzor cyberpunk/western z F2).
- **Rámeček skupiny zpráv BEZ wrapperu** (varianta A, baseline všech skinů). `MessageList` doplnil `groupEnd` prop (z `next` item přes sdílený `isContinuation`); `MessageItem` root `.item` skládá box per-item: start (`:not(.grouped)`) = horní hrana+radius+margin-top, konec (`.groupEnd`) = spodní hrana+radius, průběžně levý proužek + pozadí. Barva = `--ch-accent` (barva kanálu). Whisper `:not(.whisper)` z rámečku ven (má vlastní levý border). Hover přebíjí pozadí přes vyšší specificitu `:not()`.
- **Souboj/přítomní panel = přemapování cizího token-namespace.** Combat tracker je portovaný z taktické mapy (16.1e) → dědí `--map-ui-*`, ne `--theme-*` → fantasy skin ho neobarví. Fix = přemapovat `--map-ui-*` na `.tabWrap` (kořen railu) scoped `[data-chat-skin='fantasy']`; combat panel je potomek → podědí. Barvy/text → `var(--theme-*)`, RGB-triplety = čísla (vzor `rgb(var(--x-rgb)/α)`). Mapa (mimo `[data-chat-skin]`) netknutá.
**Past chycená OVĚŘENÍM (ne v produkci):** smaragd NENÍ `--theme-accent-secondary` — `buildSkinVars` mapuje na `--theme-accent-cyan` (+`-border-cyan`/`-glow-cyan`). Přečtení `_skinBase.ts` před psaním CSS chytilo dřív, než by to bylo špatně v produkci.
**Jak ověřeno:** `npm run build` po každém kroku (cssnano zvládl `mask` data-URI, tsc čistý); HTML prototypy + Chrome-headless screenshoty (desktop+390px mobil) — `mobil-desktop` chytil přetečení RP divideru → fix `flex-shrink:0` + `@media(max-width:480px)` kratší vlnovky; combat porovnán fantasy vs původní (zlato/smaragd vs fialová).
**Zhodnocení (dobře):** prototyp+screenshot PŘED produkcí + ověření tokenů čtením = nula cyklení, vše napoprvé. Workflow `frontend-design`→prototyp→souhlas→kód držel. **Zbývá:** fantasy modaly (sdílený `Modal` portáluje mimo `.room` → opt-in skin prop, čeká souhlas kvůli širšímu dopadu); panel kostek (uživatel má vlastní nápad, odloženo). Vzory přenositelné na dark-fantasy→western.

### ✅ ŘEŠENÍ — 16.1d-F3 KOMPLETNÍ: všech 11 chat skinů na profesionální úrovni (vzor pro deník skiny) · 2026-06-25
**Problém:** Dotáhnout zbylých 10 motivů chatu (po fantasy) na profi úroveň — každý vlastní tvarový jazyk + signature, ne přebarvený sdílený vzhled. Souběžně se ujistit, že se navzájem odliší (6/12 sdílí blízkou paletu — odlišení MUSÍ nést tvar+font+ornament, ne barva).
**Co zabralo (ustálený per-motiv recept, ~6 scoped CSS bloků/motiv):** Pro každý: (1) `frontend-design` → HTML prototyp na reálných tokenech → screenshot desktop+390px → souhlas; (2) produkční scoped CSS `[data-chat-skin='<id>']` do 6 modulů (ChannelView hlavička, RpDateBadge, ChannelItem rail, MessageItem avatar/jméno/whisper, ChannelComposer, ChatContextRail souboj); (3) build + mobilní screenshot; (4) spec řádek. **Signature per motiv:** dark-fantasy=krvavá kapka/zubaté, vesmir=HUD bracket-tick, cyberpunk=hazard-tape+barcode, steampunk=ozubené kolo+nýty(embossed), apokalypsa=duct-tape+stencil, horor=inkoustová kaňka+ink-bleed, mystery=redakční pruhy+lampa, historie=rubrikace+drop-cap+fleuron, moderni=restraint(typografie+whitespace), western=šerifská hvězda+provaz+wanted-dvojrám.
**Klíčové zhodnocení (přenositelné na deník skiny 16.2c-F3):**
- **Odlišení nese tvar+font+ornament, NE paleta** (potvrzeno: 6 motivů sdílí jantar/teplou — liší se signaturou). Per motiv 1 silný signature ornament + vlastní tvarový jazyk.
- **CSS-only přes `mask`/`clip-path`/`radial-gradient`/`content`** = nula DOM/`.tsx` změn, scoped, originál (`feedback_skin_originality`). Barvy z tokenů (`--theme-*`, RGB-triplety jen kde nutné), tmavé díly z `color-mix(--bg-primary)` = 0 hardcoded černé/šedé.
- **DOM-vázané ornamenty důsledně vynechány** (otáčející crest, číslo kanálu, LED, vosková pečeť, ID tag) → nahrazeny CSS variantou nebo pseudo; signature nikdy nestál jen na nich.
- **`overflow:hidden` na `.avatar`** = clip-path/rohové ticky se ořežou → řešit `border`/`outline`/`radius` (outline NEní ořezán). Portréty: clip-path ořezává obličej → hranatý radius.
- **mobil RP-divider** = opakovaná past (dlouhé datum) → `flex-shrink:0` na ornament + `@media(max-width:480px)` zmenšit. **`prefers-reduced-motion`** kolem každé animace.
- **Souboj panel** dědí mapové `--map-ui-*` → přemapovat na `.tabWrap` (combat=potomek), mapa scoped netknutá.
**Zhodnocení (špatně/co hlídat):** velký necommitnutý balík (~8 souborů, 11 motivů) — měl jsem důrazněji tlačit na průběžný commit dřív. Společné zbývající: chat modaly (portál) + panel kostek.

## ✅ ŘEŠENÍ — 16.2c deník skiny pro-redesign (8 stylů) + tester rework — 2026-06-25

Přepracoval jsem 6 „levných" deníkových skinů na profesionální + přidal 8. (Anime) a přepracoval Horor po odmítnutí testerem. Vše ověřeno renderem reálného `matrix.css`+`diary-skins.css` (Chrome headless) desktop+mobil PŘED předáním.

**Vzor implementace (ustálený):** token blok `[data-diary-skin='X']` (specificita 0,1,0) + strukturní ornamenty `[data-diary-system='matrix'][data-diary-skin='X']` (compound 0,2,0 > layout `[data-diary-system] .x` → vyhraje nezávisle na pořadí načtení CSS). Ornamenty přes volné `::before`/`::after` na `.mx-panel`/`.mx-hero`/`.mx-fate`; **4-rohová technika = 1 `::before` + 4 background-image vrstvy (SVG `<g transform>` flip)**; `isolation:isolate` na panel → `z-index:-1` ornament pod obsah / `z-index:2` nad. Žádný JS, žádný zásah do React markupu.

**Dedikovaný design-agent per skin** (Příroda/Minimal/Retro/Anime/Horor-v2): samostatný agent vymyslí koncept → vyrenderuje → iteruje; já ověřil renderem a poslal zpět s kritikou. Zabránilo to sbíhání (každý skin vlastní tvarový jazyk + signature). `feedback_frontend_design_audit`.

**Vlastní falešný poplach (dobře, že chycen):** tester hlásil „BODY OSUDU" FIALOVOU. `.lab` používá `var(--mx-fate-lab)`, ale sourozenci `.num`/`.star` v TÉMŽE bloku se barvili správně → vypadalo to na selhání jednoho tokenu. **Reprodukce v izolaci (fialový rodič + reálný label) ukázala, že mé CSS je SPRÁVNĚ** (label = skin barva, ne fialová) → kořen = stará CACHE/build u testera, ne CSS bug. **Poučení: když JEDEN var „selže" a sourozenci v témže bloku jedou, NENÍ to CSS bug — reprodukuj dřív než honíš.** Pojistka = explicitní barva ve scoped `.mx-fate .lab` (nezávislá na tokenu, vyšší specificita) → fialová se nevrátí ani po cache.

**Past — světlý skin na tmavém layoutu:** Minimal (jediný světlý) → hardcoded tmavé chrome layoutu prosvítá na papír (budget bar `#15172a`, status badge). Layout je stavěný pro tmu (netokenizované tmavé hodnoty splynou u 7 tmavých skinů). Fix = scoped světlé overrides per světlý prvek. **Poučení: přidáváš-li světlý skin, zgrepuj netokenizované tmavé hex v layoutu.**

**Past — fate label „Body osudu" (2 slova) v kruhu:** prototypy měly „Osud" (1 slovo) → reálný 2slovní label se ve star/kruh pečeti mačkal/přetékal nad kruh. Fix = `font-size:8px; white-space:nowrap` + kontrastní barva per skin.

**8. skin cross-stack (Anime):** FE `DiarySkinId`+`DIARY_SKINS` + **test `skins.spec` čekal přesně 7 → aktualizovat na 8** (jinak červený) + BE `update-member.dto.ts` `@IsIn` whitelist 7→8. **BE schema je `String` (žádný enum) → whitelist DTO je jediná brána; BE RESTART nutný** (`feedback_be_restart_required`), jinak 'anime' → 400. BE+FE NEmíchat v 1 dávce (`feedback_no_mixed_be_fe_batch`).

**Tester rework Horor (gore→elegance):** původní „krvavý prosak" odmítnut jako „od třeťáka/gore". Přepracováno na aristokratickou viktoriánskou upířinu (kovaná stříbrná tracerie, erbovní pečeť, damašek). **Poučení: gore ≠ horor; elegance/zdrženlivost > intenzita; skin kvalita = subjektivní laťka testera, raději dedikovaný redesign než „přibarvit".**

**Zhodnocení:** dobře = reprodukce chytila falešný poplach (necyklil jsem na neexistujícím CSS bugu), render-verify per skin držel kvalitu, pasti (label fit, světlý leak) chyceny v ověření. Špatně/hlídat = velký necommitnutý balík (CSS + registr + test + BE); nutný **BE restart + hard refresh** u testera; zbývá F3 (skin do embedů chat/mapa/kostky/rolllog) + update spec-16.2c.

## ✅ ŘEŠENÍ — 16.2c-F3 deníkový skin do embedů (chat/mapa/dice/roll log) — 2026-06-25

F3 = kompaktní panely v chatu/mapě + dice readout + roll log nesou DENÍKOVÝ SKIN viewera (ne svoje sci-fi/mapové barvy). Autonomně (uživatel spal), proto důraz na **nerozbít**: vše build+testy ověřeno.

**Vzor (přenositelný):** obal `DiarySkinScope` (`diary-systems/DiarySkinScope.tsx`) = `data-diary-system`+`data-diary-skin` viewera (`useDiarySkin`) + statický import `diary-skins.css` (token sady musí být v bundlu i mimo deníkovou stránku). CSS moduly embedů pak **dědí `--mx-*`** z předka.
- **Kombat/bestie moduly:** odebrat LOKÁLNÍ `--mx-*` defs na `.panel` (jinak přebijí zděděný skin!) + hardcoded barvy/fonty → `var(--mx-x, <sci-fi-orig>)`. Fallback = bez skinu vypadá jako dnes (regrese-safe).
- **CSS Modules + globální atribut:** `[data-diary-system='matrix'] .panel { }` funguje — modules hashují JEN třídy/#id, atributové/elementové selektory zůstávají globální. Takže lze mixovat globální `[data-*]` předka s lokální `.panel`.
- **`display:contents` na obalu** pro layout-citlivé embedy (dice overlay fixed, roll log ve flex-stacku) → wrapper negeneruje box, ale dědičnost `--mx-*` i selektory `[data-diary-system] .x` drží přes DOM. Nula vlivu na layout.
- **Sémantika vs skin:** u dice readout/log a HP heat (warn/crit, přetlaky) jsem barvy NEtokenizoval — nesou VÝSLEDEK/STAV, ne skin. Skinuje se jen rám/paleta. (3D kostky samotné = vlastní per-hod skin, netknuto.)
- **Chrome map panelu** (`TokenInfoPanel`, sdílený všemi systémy): override scoped `[data-diary-system='matrix']` → pro ne-matrix systémy zůstává mapový motiv `--map-ui-*` beze změny (color-mix invalidní u chybějícího tokenu → padá na základní pravidlo).

**Ověření bez živé appky:** React komponenty (hashované třídy) nejdou renderovat samostatně, ALE **zdrojový `.module.css` má třídy `.panel`/`.section`** (nehashované) → static HTML s týmiž názvy + `diary-skins.css` + `data-diary-skin` = vizuální ověření tokenizace (combat panel: fantasy zlatý / anime barevný / bez skinu sci-fi fallback ✓). Build (tsc+vite) + 753 testů zelené.

**Zhodnocení:** dobře = fallback-first (`var(--mx-x, orig)`) + scoped na matrix = nulová regrese pro ostatní systémy/bez skinu, ověřeno build+test+static-HTML; `display:contents` elegantně vyřešil layout-citlivé obaly. Špatně/hlídat = chrome/dice/log nešlo vizuálně ověřit živě (mapový motiv `--map-ui-*` v static HTML chybí) → **čeká živý test uživatele**; dice readout byl user-nejistý („já nechtěl mě") → udělán jen rám, snadno revertovatelný.

**Doplnění z živé revize (mé F3 chyby na dice logu, chycené testerem):** (1) **font** — F3 override vnutil `font-family: var(--mx-font-num)` celému log panelu → u serifových skinů (horor/fantasy) byla ČÍSLA serif = „není v pohodě"; fix = font NEpřebíjet, data-panel drží mono, ze skinu jen barvy. (2) **průhlednost** — `rgb(... / 0.985)` + `backdrop-filter:blur` = pořád „skrz" na mapu; „neprůhledné" = `rgb(var(--…-rgb))` BEZ alfy, ne vysoká alfa. **Poučení: u data/log panelu skinovat jen barvy (ne font), a „opaque" dělat plnou alfou, ne 0.98.**

## ⚠️ POKUS (single-source token NEZABRAL) — 16.2c-F3b signature pip do embedů + průhlednost retro/minimal · 2026-06-25

> **POZOR: „single-source token" `--mx-pip-on-bg` byl REGRES — pip gemy ZMIZELY (ploché) na listu I v mapě.** Důvod viz [oprava níže](#-řešení--162c-f3b-fix-pip-gem-musí-být-přímá-deklarace-ne-token-var--lvlc-na-předkovi--guaranteed-invalid--2026-06-25). Klíčové tvrzení v textu („substituce var(--lvlc) se vyhodnotí až na pip elementu → token na skin bloku funguje") je **NESPRÁVNÉ**. Část o **průhlednosti** (vrstvit panel přes `--mx-bg`) zůstává platná. Ponecháno jako záznam slepé cesty. Část o pipech čti až opravu.

Po F3 tester: pipy (body dovedností) v mapě/chatu měly jen **barvu** skinu, ne jeho **tvar/ornament** (horor granát, fantasy drahokam, steampunk cvoček, minimal čtvereček, retro pixel, anime gem+gloss). „To není profesionální — jen jsi změnil barvu." Měl pravdu: kompaktní `.pip` v modulech bral `var(--lvlc)` (plochá barva), kdežto signature recept žil jen na plném listu (`.mx-pip.on`, per-skin scoped).

**Co zabralo (single-source token):** vytáhnout pip recept do **proměnných** `--mx-pip-on-bg` / `--mx-pip-on-shadow` / `--mx-pip-on-border` v každém skin bloku (diary-skins.css). Spotřebují je OBA: základní list pravidlo `[data-diary-system='matrix'] .mx-pip.on` (matrix.css) i modulové `.pip[data-on='true']` (MatrixCombat/BestiePanel) přes `var(--mx-pip-on-bg, <sci-fi fallback>)`. Per-skin list `.mx-pip.on` pravidla **smazána** (7×) → žádná duplikace, žádný drift. Recept odkazuje `var(--lvlc)` → substituce se vyhodnotí až na pip elementu, kde je `--lvlc` (úroveň) → token na skin bloku funguje i v hluboko zanořeném modulu. `--mx-pip-radius` (minimal 1px, retro 0) i `--mx-seg-off` (světlé pro minimal/anime) už tekly → tvar i OFF stav sedí.
- **První pokus byl špatně (necommitnuto):** dal jsem do modulu jeden GENERICKÝ gem fallback pro všechny → zase „přebarvení" v jiné formě. Originalita = recept MUSÍ být per-skin, ne univerzální tvar.
- **anime gloss dot:** v listu byl přes `::after` (poziční); do modulu se hashovaná třída nedostane, tak jsem dot **zapekl do `--mx-pip-on-bg`** jako první radiální vrstvu → list i modul mají stejný gem bez extra elementu.

**Průhlednost retro/minimal (živý bug):** dice readout + roll log byly „skrz" na mapu. Kořen: F3 override bral `var(--mx-panel / --mx-panel-bg)` — a ty mají u retro/minimal **alfu** (panel je povrch co na DENÍKU leží na neprůhledném `--mx-bg`; tam to sedí). Na mapě panel **plave volně** → alfa = díra. Fix: **vrstvit panel PŘES `--mx-bg`** → `background: var(--mx-panel, transparent), var(--mx-bg, #0e0f1e)` (a `var(--mx-panel-bg, …), var(--mx-bg, …)` u readoutu). `--mx-bg` je u všech skinů plný hex → kompozit neprůhledný, stále v barvě skinu.

**Jak ověřeno:** static HTML render combat `.pip` na busy „mapovém" pozadí přes všech 8 skinů → každý má vlastní tvar (gem/cvoček/čtvereček/pixel/inkoust+gloss), sci-fi fallback beze skinu ✓. Build (tsc+vite) ✓.

**Zhodnocení (PŮVODNÍ, K PIPŮM NEPLATNÉ):** myslel jsem, že single-source token sjednotí list i embed. NEZABRALO (viz oprava). Platí jen část o průhlednosti (`--mx-panel` s alfou → vrstvit přes `--mx-bg`).

## ✅ ŘEŠENÍ — 16.2c-F3b-FIX: pip gem MUSÍ být přímá deklarace, ne token (var(--lvlc) na předkovi = guaranteed-invalid) · 2026-06-25

Tester: „v mapě (a nejspíš chatu) nejsou rudé body jako gemy, jako v klasickém deníku hororu." Reprodukce renderem (6× zoom, list `.mx-pip` vedle combat `.pip`): **OBA ploché** rudé kruhy, žádný gem — token single-source z F3b pipy ROZBIL (na listu i v mapě). Klasický deník hráč viděl jako gemy jen ze **starého nasazení** (původní per-skin pravidla, která jsem smazal).

**Root cause (CSS, přenositelné):** custom property `--mx-pip-on-bg: radial-gradient(…, var(--lvlc), …)` byla definovaná na skin-wrapperu `[data-diary-skin='horror']`. Vnitřní `var(--lvlc)` se **resolvuje na DEKLARAČNÍM místě** (wrapper), kde `--lvlc` NEEXISTUJE (nastavuje se až inline na pip elementu/řádku). → `var(--lvlc)` bez fallbacku = celá `--mx-pip-on-bg` je **guaranteed-invalid value** → dědí se dolů jako invalid → konzument `background: var(--mx-pip-on-bg, var(--lvlc))` vezme **fallback** (plochý `--lvlc`). Proto ploché. (Statické tokeny `--mx-seg-off` fungovaly = nemají vnitřní var → potvrzení diagnózy.)
- **Mylná domněnka, co mě nachytala:** „var() v custom property se vyhodnotí až na use-site (pip), kde je --lvlc." NE — `var()` UVNITŘ hodnoty custom property se substituuje při computed-value té property, tj. na elementu, kde je deklarovaná. Recept závislý na hodnotě nastavené HLOUBĚJI v stromu NEJDE schovat do tokenu na předkovi.

**Co zabralo:** pip gem recept jako **PŘÍMÁ** `background`/`box-shadow` deklarace na pip pravidle, kde `--lvlc` je in-scope — per skin, ve **3 místech**: list `.mx-pip.on` (diary-skins.css, global — `.mx-pip` je global třída) + combat `.pip[data-on='true']` (MatrixCombatPanel.module.css) + bestie (MatrixBestiePanel.module.css). Duplikace receptu je NUTNÁ (modulové `.pip` jsou hashované, nejdou z global CSS, a `--lvlc` musí být na elementu). Base pravidla vrácena na plochý sci-fi (fallback bez skinu). Mrtvé `--mx-pip-on-*` tokeny + breadcrumby smazány.

**Jak ověřeno:** render list `.mx-pip` vs combat `.pip` přes všech 7 skinů (1.8× zoom) — identické gemy (fantasy zlatá · horor granát s highlightem+halo · steampunk mosaz · příroda zelená · minimal/retro čtverce · anime modrý gem). Build ✓.

**Zhodnocení:** dobře = reprodukce zoomem rovnou ukázala, že to není deployment ani cache, ale reálný regres MÉHO refaktoru; diagnóza potvrzena tím, že statický token (`--mx-seg-off`) jel a token s `var()` ne. Špatně = `✅ ŘEŠENÍ` jsem napsal BEZ render-verify LISTU (ověřil jsem jen combat `.pip`, kde to taky bylo ploché, ale na malé velikosti jsem to v dřívějším renderu přehlédl jako „gem") → **u vizuální změny ověřit VŠECHNY dotčené plochy + dostatečný zoom, ne jen jednu**. Lekce: **token nesmí obsahovat `var(--x)`, když `--x` žije hloubějí v DOM než token; recept patří do přímé deklarace na cílovém elementu.** Cena za originalitu per-skin = recept ve 3 souborech (modulové třídy nejdou sdílet z global CSS) — vědomá duplikace, ne dluh.

## ✅ ŘEŠENÍ — 16.2c-F3c: dice readout + roll log PER-SKIN designované (7 design agentů) + průhlednost finálně · 2026-06-25

Tester: „log pořád průhledný a stále jsi je neudělal — pro každý skin nahoď vlastního designéra (rám dle deníku, barva+typ čísel, neprůhlednost)." Tj. dice readout + roll log musí být DESIGNOVANÉ per skin, ne jen tokenizované.

**Kořen přetrvávající průhlednosti:** báze `.readout` = `rgba(...,0.95)` + `backdrop-filter: blur(16px)`. Blur ROZMAZÁVÁ mapu skrz i při 95% alfě → vypadá „průhledně". Můj F3 opaque override platil, ale blur jsem nevypnul. Fix: v matrix scope `backdrop-filter: none` + povrch token `--mx-log-surface` VŽDY plný hex/neprůhledný gradient (žádná alfa). Poučení: na neprůhledném povrchu je `backdrop-filter` jen perf náklad + opticky „prosvítá"; u plovoucích panelů ho VYPNOUT.

**Architektura:** token kontrakt `--mx-log-*` (surface/border/title/chip/num/num-font/total/total-pos/total-neg/total-shadow/eq-font), moduly (DiceRollOverlay + DiceLogPanel) ho konzumují s fallbackem na obecné skin tokeny → i bez per-skin bloku je log v barvě+fontu skinu (čísla auto per-skin). Per-skin VALUES navrhlo **7 paralelních design agentů** (sonnet), každý render-ověřil svůj skin nad „mapovým" pozadím (neprůhlednost + čitelnost čísel) a vrátil blok.

**KRITICKÁ PAST (přenositelná):** agenti psali i SIGNATURE pravidla (`.readout`/`.panel`/`::before` rámy/nýty/scanlines) jako globální `[data-diary-skin='X'] .readout` do diary-skins.css. **V jejich testu trefila** (linkovali modul napřímo = nehashované třídy), ale **v produkci NE** — `.readout`/`.panel` jsou hashované CSS-module třídy, globální `.readout` je netrefí. → **Tokeny** (custom props) fungují cross-file (dědí se, konzumuje modul vlastním pravidlem na hashované třídě); **selektory na module třídy MUSÍ být v tom module souboru**. Rozdělil jsem: tokeny → diary-skins.css, signatury → DiceRollOverlay/DiceLogPanel.module.css.

**Druhá past:** 2 agenti dali `.readout { position: relative }` (pro ukotvení `::after`). Readout je `position: fixed` (overlay nad mapou) → `relative` by rozbil umístění. `::before/::after` ale fungují i nad `fixed` (je positioned) → `position` override jsem vyhodil, ornament nechal.

**Jak ověřeno:** finální grid render ze 4 REÁLNÝCH repo souborů (ne agentových inline overridů) přes všech 7 skinů — neprůhledné, distinktní (fantasy gilt fillet · horor stříbrná bordura+oxblood · steampunk mosaz+nýty · příroda dřevo+lišta+lístek · minimal světlý dossier+ledger · retro CRT double-rám+scanlines · anime duha+ink+bílé chip kostky), čísla nesou skin font+barvu. Build ✓.

**Zhodnocení:** dobře = token kontrakt + paralelní designéři = profi per-skin výsledek rychle, render-verify per skin; přetrvávající průhlednost konečně vyřešena root-cause (backdrop blur, ne alfa). Špatně/hlídat = málem jsem integroval signatury do global CSS (nefungovalo by) — **u CSS Modules: custom-prop token cross-file ANO, selektor na hashovanou třídu JEN v module souboru**. Tester 2× opakoval „stále průhledné" → příště u stížnosti na průhlednost hned hledat backdrop-filter, ne jen alfu.

### ✅ ŘEŠENÍ — 16.2b-mapa drd16: combat panel + d6+ exploding engine + strukturovaný spellbook · 2026-06-25
**Co nakonec zabralo:** Prototyp (`drd16-mapa-audit.html` v3) = vizuální kontrakt, schválen před kódem; impl. po 6 krocích (engine → dicelog breakdown → spellbook → panel → F3 sdílené plochy → ověření) s průběžným vitestem po každém kroku.
**Netriviální body:**
- **d6+ je DUAL-SOURCE union na 4 místech:** `rollEngine.RollKind` + `dicePayload.GenericDicePayload` + `types.ts onRoll` (mapa) + chat-local zrcadlo `rollFromDiary.DiaryRollKind`. `tsc -b` (build) chytil drift v `DiaryRollKind` — bez něj by `rollGenericDice('d6+')` regexem `^(\d*)[dk](\d+)$` neparsoval `+` a tiše spadl na **d20**. Proto vlastní `rollExplodingD6()` + explicitní `d6+` větev v OBOU mostech (`rollFromSheet` i `rollFromDiary`).
- **Namespace past odhalená ČTENÍM kódu před implementací:** schválil jsem `--mx-*` s fantasy fallbacky, ale Matrixovy `--mx-*` jsou laděné na **tmavý HUD** (světlý text) — combat panel drd16 je **světlý pergamen** → tytéž tokeny nečitelné. Stejný důvod, proč list jede self-contained (162b). → tělo panelu self-contained fantasy, `--mx-*` se nepoužilo nikde; sdílené tmavé plochy řeší scoped blok.
- **F3 sdílené plochy zdarma:** wrapper (`TokenInfoPanel`), `DiceLogPanel`, `DiceRollOverlay` nesou `data-diary-system` z `preset.id` **systémově agnosticky** → drd16 fantasy = jen scoped `[data-diary-system='drd16']` CSS blok (vzorem matrix bloku), **0 TS změn**.
- **DiceLog breakdown** rozepsán na `(7) + (6 + 6 + 3) = 22` jen pro číselné tváře; fate/d100 ponechán v `± součet` (rozpis kostek by tam mátl) = 0 regrese Matrixu.
**Jak ověřeno:** `npm run build` (tsc -b ✓ — chytil oba dual-source drifty), vitest (rollEngine 19, DiceLogPanel +2, Drd16Sheet +2, **Drd16CombatPanel 9/9**), eslint 0. Chrome/log/overlay přes mapové `--map-ui-*` čekají živý test (v static HTML chybí).
**Zhodnocení:** dobře — prototyp=kontrakt + build jako dual-source guard + čtení kódu odhalilo namespace past PŘED psaním CSS = 0 cyklení. Hlídat: u nového `RollKind` projít VŠECHNY 4 union zdroje (mapa i chat zrcadlo). Pozn.: 48 pre-existujících fail `DiaryTab.spec` (No QueryClient z `useDiarySkin→useWorldStatus`, zavedl commit `e4c056e6` matrix skiny) NESOUVISÍ s touto prací.

---

### ✅ ŘEŠENÍ — oprava 4 pre-existujících rozbitých test souborů (48 testů, 4 různé kořeny) · 2026-06-25
**Co nakonec zabralo:** Každý soubor jiný kořen — společné téma = **komponenta přibrala React Query hook / embed PO napsání testu, mock zůstal zastaralý**:
- `DiaryTab.spec` (8×): `useDiarySkin→useWorldStatus` (RQ) přidán v `e4c056e6`, test bez QueryClient → **mock `useDiarySkin`** (stub skin).
- `nav-guard-matrix.spec` (31×): NE reálný bug. (a) R-20 elevation — globální Sa/Admin bypass dnes vyžaduje `world.elevated===true`; test `makeCtx` měl `world:null` → **`world:{elevated:true}`**. (b) friendly-messaging → `ForbiddenPage`=`ErrorState(403)` s textem „Sem nevidíš/nemáš oprávnění" (žádné literal „403") → **`outcomeOf` detekce přes nový text** (queryAllByText kvůli title+description).
- `OverviewTab.spec` (3×): nově embeduje `AnalyticsSection` (15B.7 vlastní RQ hook) → **mock AnalyticsSection→null**.
- `RegisterModal.spec` (6×): **ASYNC `vi.mock` factory** (`await vi.importActual` + `...actual`) se aplikuje POZDĚ → komponenta stihne naimportovat **reálné `api`** → reálný axios → `AxiosError: Network Error` (`api.post` mock se míjí, postCalls=0, banner „Nepodařilo se připojit"). Fix = **SYNC factory** `{api:{post,get}, parseApiErrorCode: inline}` (vzorem procházející LoginModal.spec).
**Proč to je správně:** nav-guard kořeny jsou v PRODUKČNÍM kódu správně (elevation gate + friendly 403) → opravil jsem TEST (záměr), ne guard. RegisterModal sync mock = identický vzor jako zelený LoginModal.spec.
**Jak ověřeno:** jednotlivě zeleně — DiaryTab 8/8 · nav-guard 65/65 · OverviewTab 3/3 · RegisterModal 14/14; + plný suite.
**Zhodnocení:** dobře u 3 (rychlá atribuce + cílený mock). U RegisterModalu **2 chybné hypotézy** (availability hooky, captcha, password validace) než **empirická diagnostika** (log `btn.disabled` + `api.post` call count + skutečná caught chyba v catch) odhalila reálný axios. **Poučení: u „submit nefiruje" instrumentuj (disabled? volá se API? jaká chyba?) HNED, nehádej.** Async `vi.mock` factory s `importActual` = past (pozdní aplikace) — preferuj sync factory.

---

### ✅ ŘEŠENÍ — 16.2b Fáze 2: drd16 bestie na taktické mapě + schema-aware spawn HP · 2026-06-26
**Co nakonec zabralo:** Custom `Drd16BestiePanel` (bojové minimum dle přání: Životy=standardní token HP + ±, Iniciativa d6+ bez bonusu, Útoky=d6+ + číslo (víc útoků z `systemStats.attacks`), Obranné číslo=d6+ + OČ). Read-only staty (snapshot z `token.systemStats`) → žádná editace/save → vyhnul jsem se sanitizaci na token-schéma (drd16 nemá `drd16:token`). Větev v `TokenSystemSheet` (vzorem matrix bestie), obal `DiarySkinScope` (fantasy chrome).
**Netriviální nález (cross-system bug):** `buildBestieToken` četl HP **natvrdo z matrix klíče** `bestie.systemStats['health.max']` → pro drd16 (klíč `hp`) by HP spadlo na default 10 (token.maxHp špatně). Fix = **schema-aware**: vyhledej klíč přes `combatBehavior==='damageable'` (a `'movement'`) z `<system>:bestie` schématu. Fallback `health.max`/`movement` při prázdném registru = BC pro drd2/matrix (jejich damageable klíč JE `health.max`).
**Jak ověřeno:** build (tsc -b + vite) ✓; testy 18/18 (Drd16BestiePanel 6: init/útoky/OČ d6+ s modifierem, HP ±, !canEdit gate; buildSpawnToken +1: drd16 `hp`→maxHp 3, attacks snapshot); eslint 0; static render (fantasy panel). Živý test na mapě po deployi.
**Zhodnocení:** dobře — read-only panel obešel token-schéma sanitizaci (drd16 token-schéma neexistuje); spawn HP key zobecněn přes combatBehavior = funguje pro všechny systémy. Hlídat: nový bestie systém musí mít na HP poli `combatBehavior:'damageable'`, jinak spawn HP = default.

---

### ✅ ŘEŠENÍ — drd16 bestie EDITOVATELNÁ na mapě (per token) + `drd16:token` schéma · 2026-06-26
**Co nakonec zabralo:** Tlačítko „✏ Upravit bestii" v `Drd16BestiePanel` → modál `Drd16BestieTokenEditModal` který **reuse bestiářový editor `Drd16BestieForm`** (všechna pole) bound na `token.systemStats` + jméno + popis. Save patchne TENTO token (nezávislá instance). Žádná duplikace editoru — jeden form pro katalog i token.
**Klíčový nález (reusable):** editace `token.systemStats` → BE `validateForPatch` je **STRICT** a validuje proti `<system>:token` schématu. drd16 mělo jen `drd16:bestie`, ne `drd16:token` → generic:token fallback by drd16 klíče (hp/attacks/defense…) **odmítl (400)**. Fix = vytvořit `drd16/token.json` (= bestie pole, entityType token) + register + export do BE. Token-schéma sanitizace v save drží jen známé klíče.
**Jak ověřeno:** build ✓; testy 31 (panel 8 vč. Upravit modálu, schema, spawn, form); eslint 0; BE push `drd16-token.json` (3215ca5). Past CH-014 (cwd posun po `cd` pro sed) — eslint selhal z špatného cwd, reset na FE root.
**Zhodnocení:** dobře — reuse editoru = 0 duplikace; token-schéma = pattern z matrix/drd2 (oba mají bestie.json+token.json). Hlídat: editovatelný bestie token v novém systému potřebuje `<system>:token` schéma (ne jen bestie), jinak save 400.

---

### CH-026 — tvrdil jsem „chat combat NEMÁ current-HP", screenshot mě usvědčil · 2026-06-26
**Kontext:** Analýza drd16 chat bestie parity (16.2b-chat). Porovnával jsem mapu vs chat a psal spec.
**Co jsem udělal špatně:** Prohlásil jsem (i do spec jako ⚠️ zjištění), že „chat combat NEMÁ current-HP, HP bar je mimo scope bez BE změny" — odvozeno z toho, že `ChatBestieCombatant` nemá first-class `currentHp/maxHp` jako mapový token. Domyslel jsem architekturu místo ověření.
**Proč to nefungovalo:** Uživatelův screenshot Matrix bestie „Duch" ukázal HP/MAX HP **editovatelné v chatu** — jako pole `systemStats` (generic `BestieStatblock` přes `EntitySchemaForm`), autosave do `combatant.systemStats`. HP v chatu existuje, jen jako schema pole, ne jako token bar. Rozdíl mapa(`token.currentHp` bar)×chat(`systemStats` pole) jsem zaměnil za „chat HP nemá".
**Poučení:** Netvrdit architekturu/scope z paměti a z částečného typu — ověřit proti běžící UI (screenshot/render). „Pole chybí v typu X" ≠ „funkce neexistuje" (může žít v jiné vrstvě — tady volný `systemStats` blob). Před „je to mimo scope / potřebuje BE" zkontroluj, jestli to už nejede jinudy.
**Příznak cyklení:** Prezentuju omezení/scope-cut jako fakt z odhadu typů; uživatel přinese důkaz (screenshot), že to už funguje.

---

### ✅ ŘEŠENÍ — drd16+Matrix chat bestie parita (sdílené jádro mapa↔chat + init persist) · 2026-06-26
**Co nakonec zabralo:** (1) Extrakce čistě prezentačního jádra `Drd16BestieCombatActions` (útoky/OČ/statline/popis) — používá ho **mapový `Drd16BestiePanel` I nový `Drd16ChatBestiePanel`**, mapa jen přepojena (0 regrese, kryje spec). (2) Nové chat panely `Drd16ChatBestiePanel` + `MatrixChatBestiePanel` v drd16-stylu (klik na akci = hod místo separátní 🎲, Životy klik ±, edit přes modal — reuse `Drd16BestieForm` resp. `BestieStatblock` editor; žádný nový editor). (3) **Init persist**: `useChatDiaryRoll` rozšířen o optional `onResult(total)` (volá se synchronně s `dicePayload.total`) → init hod patchuje `combatant.initiative`. `(req, onResult?)` je přiřaditelný k `(req)=>void` → PC/NPC combat panely beze změny. (4) `setState`-in-effect re-seed v `BestieInstancePanel` → `key={combatant.id}` remount.
**Proč to je správně (a ne další variace):** Sdílené jádro = DRY mapa↔chat **bez refaktoru zelené mapy** (jen mechanická extrakce). Per-surface zůstává jen to, co se liší (roll routing onMapRoll×onRoll, persistence token×combatant, HP bar×pole). Matrix HP v chatu zjednodušeno na `health.current` single ± (chat=lehký tracker), ne odvozený armor model mapy. `interface`→`type` u patch typu kvůli přiřaditelnosti k `Record<string,unknown>`.
**Jak ověřeno:** `npm run build` (tsc -b + vite) ✓; vitest rail 28/28 (Drd16ChatBestiePanel + MatrixChatBestiePanel d6+/fate + HP ± + init persist + read-only katalog); eslint 0 na novém kódu. Dva dluhy (MATRIX-UNIFY, INIT-PERSIST) vyřešeny → odstraněny z dluhy.md.
**Zhodnocení:** dobře — sdílené jádro + reuse editorů = minimální duplikace, mapa nedotčená; init persist čistě bez zásahu do PC/NPC. Špatně — předcházel mu chybný závěr „chat nemá current-HP" (CH-026), který stál čas. Pre-existující warning `ChatContextRail:85` ponechán (není můj, čistý fix = remount railu z rodiče = riziko). Skiny 16.2c-drd16 = 7 návrhů agenty (mimo tento záznam).

---

### CH-027 — retro skin importoval font z `cdn.jsdelivr.net` → CSP block → prod chat/deník spadl · 2026-06-26
**Kontext:** 16.2c-drd16 skiny, retro skin (synthwave). Agent použil 7segmentový LED font DSEG7 z CDN.
**Co jsem udělal špatně:** Přijal jsem v F3 integraci `retro.css` s `@import url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/css/dseg.css')` bez kontroly proti CSP allowlistu. Build i 107 testů prošly → falešný klid.
**Proč to nefungovalo:** Prod CSP je `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (spec-14.3). `cdn.jsdelivr.net` NENÍ povolen → browser zablokoval ten `@import`. Protože byl uvnitř `diary-skins.css` zabundlovaného do `DiaryTab.css` chunku, **zablokovaný @import → Vite `Unable to preload CSS for DiaryTab.css` → React Router render error → celá chat/deník stránka spadla na error boundary „Něco se nepovedlo"**. Build/vitest jsou na CSP **slepé** (CSP je runtime hlavička jen na nasazeném prod).
**Poučení:** U agenty-generovaného (i vlastního) CSS **VŽDY grepni externí `@import url(...)` proti CSP allowlistu** (jen `fonts.googleapis.com` + `'self'`) PŘED commitem — `npm run build` to nechytí. Externí font mimo Google Fonts → **self-hostnout do `/assets`** (= `'self'`), ne CDN. Jeden CSP-blokovaný sub-resource v bundlovaném CSS umí shodit celý lazy route chunk (ne jen tiše chybět).
**Příznak cyklení:** prod „Něco se nepovedlo" + konzole `… violates CSP "style-src …"` na externí doméně + `Unable to preload CSS for <chunk>`.
**Fix:** odebrán jsdelivr `@import`, `--dd-font-num` DSEG7 → `'Share Tech Mono'` fallback. Build zelený. **Nutný commit + deploy** (prod fix).

---

### ✅ ŘEŠENÍ — 16.2c-drd16 skiny (7 stylů) přes `--dd-*` tokenizaci + agent-fleet · 2026-06-26
**Co nakonec zabralo:** (1) **Foundation kontrakt** — `--dd-*` tokeny hoistnuté z `.drd16-sheet` na `[data-diary-system='drd16']` (wrapper → dědí list I embedované panely) + sémantické kompozity (`--dd-row-bg`, `--dd-accent-grad`, `--dd-hp-grad`, `--dd-line`…). (2) **Tokenizace panelů** (combat/bestie/chat/spellcard) z hardcoded pergamenu na `var(--dd-x, <fantasy>)` → 0 regrese, ale jednotný kontrakt přes všechny plochy (~112 náhrad, agentem proti `c:/tmp/drd16-skins/CONTRACT.md`). (3) **7 skin souborů** `styles/drd16-skins/<id>.css` přes **7 paralelních opus agentů** (1/skin, proti kontraktu + schválenému HTML mockupu) — override všech `--dd-*` + signature ornamenty CSS-only. (4) **Integrace**: všech 7 `@import` do **statického** `diary-skins.css` (ne lazy `drd16.css`) → skiny platí i v embedech.
**Proč to je správně (a ne další variace):** Tokenový engine = jeden override blok reskinuje list I panely (panely dědí `--dd-*` z wrapperu). Foundation napřed (kontrakt) → 7 agentů authoring proti pevnému seznamu tokenů, ne každý vlastní názvy. Ornamenty jen na **globální** `.drd16-*` třídy listu (modulové hashované `.root` nejdou cílit globálně — shodné s Matrix F3; panely nesou skin tokeny). Statický import = embedy (chat/mapa), kde lazy `drd16.css` neběží, fantasy přežije přes `var()` fallbacky.
**Jak ověřeno:** `npm run build` (tsc -b + vite) ✅ se všemi 7 skiny; vitest 107/107 (rail + token-panel) ✅; bestie panel 51× `var(--dd-)` / 0 untokenizovaných `property:#hex`; 7 skinů scoped (52-99× selektor) + plný override. **Vizuál v běžící appce NEověřen** (čeká živá revize + mobil-desktop + kontrast s uživatelem) — proto ne „kompletně hotovo".
**Zhodnocení:** dobře — agent-fleet (1 panel-tokenize + 7 skinů paralelně) škáluje velkou CSS práci; foundation-first zabránil token-drift. Past: **agenti běželi souběžně s tokenizací panelů → 3 viděli „hardcoded" bestie panel** (pre-tokenizační stav) a hlásili neaktuální omezení — řešeno časovým doběhnutím. Past CH-014 znovu (Bash `cd` ↔ PowerShell sdílí cwd → vitest ze špatného rootu) — rychlá náprava `Set-Location` zpět. Roztroušené @importy (scifi/anime→drd16.css, zbytek→diary-skins.css) souběžnými agenty sjednoceny v F3. Špatně/hlídat: **vizuál neověřen** (kontrast/ornamenty na reálném DOM = riziko, čeká uživatel).

---

### ✅ ŘEŠENÍ — doky nástrojů mapy defaultně sbalené + past „eager LS zápis přebije změnu defaultu" · 2026-06-26

**Co nakonec zabralo:** Tester nahlásil, že doky taktické mapy (🎨 Efekty & kreslení / 🌫️ Mlha / 🖥️ Zobrazení) jsou po načtení **rozbalené**, mají být sbalené. `MapToolDock` měl `defaultCollapsed=false`. Fix = (1) `defaultCollapsed` na třech instancích v `TacticalMapView`, (2) **persist jen při explicitním kliku** na hlavičku (dřív `useEffect` zapisoval stav do LS **eager při každém mountu**), (3) bump prefixu LS klíče `ikr-map-tooldock-` → `…-v2-`.

**Proč to je správně (a ne jen přepnout default):** Eager `useEffect(() => localStorage.setItem(...))` zapisoval výchozí stav do LS hned při prvním zobrazení mapy → každý, kdo mapu už jednou otevřel, měl uloženo `"0"` (rozbaleno), takže pouhá změna `defaultCollapsed` by se ho **netýkala**. Tři opatření řeší tři vrstvy: default = nová hodnota pro nové; persist-on-toggle = past se neopakuje při příští změně defaultu; v2 bump = zahodí už zapsaný (rozbalený) stav u vracejících se testerů. Vedlejší přínos: sbalená Mlha = levý tah zase panuje (otevřený mlha-dok + zapnutá mlha = kreslicí režim, footgun).

**Jak ověřeno:** `MapToolDock.spec` 3/3 ✅ (test „bez propu rozbalený" → param default ponechán `false`, sbalení nastaveno per-call; test persist-po-kliku zelený), `tsc --noEmit` čistý na obou souborech. Reálný stav u testera (jednorázový reset uloženého stavu kvůli v2) čeká na potvrzení.

**Zhodnocení:** dobře, ale poučení reusable: **komponenta, co persistuje UI stav, nesmí zapisovat default eager při mountu** — jinak si „zabetonuje" první vykreslený stav a budoucí změna defaultu je neúčinná, dokud nebumpneš klíč. Vzor: číst LS na init, zapisovat JEN na uživatelskou akci. (Příbuzné [[project_global_form_reset]] / persistence past [[feedback_persist_across_variants]].)

---

### ✅ ŘEŠENÍ — sci-fi skin: dice log (HODY) i ORCHESTRACE průhledné — vadný `var()` + mislabel „solid" tokenu · 2026-06-26

**Co nakonec zabralo:** Tester: u sci-fi skinu (matrix systém) prosvítaly na mapu **HODY** (DiceLogPanel) i **ORCHESTRACE** (MapPjPanel). Dvě nezávislé příčiny:
1. **HODY** — `[data-diary-system='matrix'] .panel { background: var(--mx-log-surface, var(--mx-panel, transparent), var(--mx-bg, #0e0f1e)); }`. `var()` bere **2** argumenty; čárka ve fallbacku → `background` shorthand to čte jako **dvě vrstvy** (`var(--mx-panel,transparent), var(--mx-bg,…)`) a `<color>` v **ne-poslední** vrstvě je **invalid → celá deklarace spadne na initial `transparent`**. Projevilo se JEN u sci-fi, protože jediný nedefinuje `--mx-log-surface` (8 ostatních skinů ano → trefí platnou 1. větev). Fix = zanoření `var(--mx-log-surface, var(--mx-panel, var(--mx-bg, #0e0f1e)))`.
2. **ORCHESTRACE** — `background: var(--map-toolbar-bg-solid, …)`, jenže `--map-toolbar-bg-solid: var(--surface-1, #0a0814)` → `--surface-1: var(--theme-surface, …rgba(0,0,0,0.72))`. Token se jmenuje „solid", ale **dědí průhledný theme-surface světa** (i default 0.72 alfa). Pre-existující, ne F3 regrese. Fix komponentně = opaque mapový token `rgb(var(--map-ui-panel-rgb))` (shodný s HODY), bez editu sdíleného/theme tokenu (theme-isolation).

**Proč to je správně:** (1) Zanořený `var()` = jediná platná forma řetězeného fallbacku; opravuje sci-fi a nechává 8 skinů s vlastním `--mx-log-surface` beze změny. (2) `--map-ui-panel-rgb` je RGB triplet → `rgb(var())` je vždy opaque, nezávisle na alfě theme-surface; sjednocuje ORCHESTRACE s ostatním mapovým chrome.

**Jak ověřeno:** DiceLogPanel.spec 5/5 ✅, MapToolDock.spec 3/3 ✅. **Vizuál (průhlednost) testy NEchytí** — čeká živé oko testera na sci-fi+matrix (+ ostatní skiny kontrolně, že 1. větev drží). `mobil-desktop` layout netknut (jen background).

**Zhodnocení:** dobře. Dvě reusable poučení: **(a) `var()` má jen 2 argumenty** — čárka ve fallbacku u `background`/`box-shadow`/… = víc vrstev, ne řetězení; řetězit = ZANOŘIT. Invalid hodnota přes `var()` substituci → property spadne na initial (`background` → `transparent`), tiše. **(b) Token jménem `*-solid` musí být opaque** — `--map-toolbar-bg-solid` dědí průhledný `--theme-surface`, takže název lže. Deeper root (mislabel tokenu) ponechán; nahlášeno uživateli.

---

### ✅ ŘEŠENÍ — drd16 cross-surface embedy nesou deníkový skin (`--dd-embed-*` kontrakt) · 2026-06-26

**Co nakonec zabralo:** Tester (drd16): dice log „HODY", token panel „obal", dice readout i ORCHESTRACE byly natvrdo fantasy pergamen → neměnily se podle vybraného drd16 skinu (sci-fi/steampunk/…), zatímco list a combat panel `--dd-*` čtou a skin sledují. **Kořen:** drd16 token kontrakt (`--dd-parch/ink`) cílí na LIST (světlý papír ve fantasy), kdežto embedy jsou tmavá HUD plocha se světlým textem → naivní tokenizace by dala tmavý text na tmavém. Matrix to řeší dedikovanými `--mx-log-*`; drd16 ekvivalent neměl. Fix = zavést sadu **`--dd-embed-*`** (surface/border/line/text/muted/title/chip/accent/num-font/title-font/pos/neg/neutral): fantasy default v `drd16.css`, **většina generická přes existující per-skin tokeny** (`--dd-forge` = tmavý rám každého skinu, `--dd-gold/crimson`) → auto-adaptuje; ručně per-skin jen `text/muted/num-font`. Tokenizovány 4 plochy (DiceLogPanel, TokenInfoPanel, DiceRollOverlay, MapPjPanel). ORCHESTRACE navíc obalena do **jednoho `DiarySkinScope`** s dice logem (celý `bottomLeftStack`) → nese skin (drd16 `--dd-embed-*`, matrix `--mx-log-*`, ostatní systémy opaque mapový default).

**Proč to je správně (a ne další hardcode):** Token engine = jeden kontrakt reskinuje všechny embedy přes všechny skiny; generická definice přes `--dd-forge/gold` znamená, že nové/upravené skiny dostanou embed zdarma. **Polarita ošetřena:** `--dd-forge` je tmavý u 5 skinů, ale SVĚTLÝ u minimal/anime (papír/bílá) → `--dd-embed-surface` = forge gradient funguje pro obě (tmavé → tmavý HUD, světlé → světlý). `--dd-embed-text` per skin: `var(--dd-ink)` u polaritně sladěných (scifi/retro mají ink už světlý; minimal/anime světlá plocha + tmavý ink), explicitní světlá hodnota u tmavý-embed-světlý-list (fantasy/steampunk/horror/nature). Anime: `--dd-embed-title` přemapován z pale `gold-hi` na `--dd-ink-head` (jinak by titulek na bílé mizel). Plocha VŽDY opaque (forge = opaque hexy).

**Jak ověřeno:** `npm run build` (tsc -b + vite) ✓, `check-csp-hash: OK` (žádné nové fonty/CSP), DiceLogPanel + MapToolDock spec 8/8 ✓. **Vizuál napříč 7 drd16 skiny + matrix čeká živou revizi** (skin práce — kontrast/ornamenty na reálném DOM = riziko, per base.md profi úroveň).

**Zhodnocení:** dobře — token-kontrakt škáluje (1 sada × 7 skinů × 4 plochy), generická definice minimalizovala per-skin práci na 2-3 řádky/skin. Past: **CH-014 cwd drift POTŘETÍ** — Bash `cd "…drd16-skins"` ve for-loopu (čtení palet) přetekl do SDÍLENÉHO cwd → `npx vitest` i background build běžely z `drd16-skins` (build přežil přes npm root-resolve, vitest „No test files found"). **Durable fix: NIKDY `cd` v shell loopu** — iteruj s absolutními cestami nebo v subshellu `(cd … && …)`. Tutéž past mám už 2× zapsanou ([CH-014]) → příště ji musím chytit DŘÍV. Vizuál neověřen (čeká uživatel).

---

### CH-028 — drd16 embed tokeny (`--dd-embed-*`) jsem dal do LAZY `drd16.css` → v embedech nedefinované → panely průhledné · 2026-06-26

**Kontext:** Po ✅ ŘEŠENÍ „drd16 cross-surface embedy nesou skin" tester ukázal, že HODY/dicelog i „obaly" jsou na mapě **PRŮHLEDNÉ** (prosvítá mapa) na drd16 skinech.

**Co jsem udělal špatně:** Generické `--dd-embed-*` defaulty (surface/border/title/accent/…) jsem definoval v `drd16.css`. Jenže `drd16.css` je **lazy** — `presets/drd16.ts` `loadStyles: () => import('../styles/drd16.css')` ho načte **jen na deníkové stránce**. Embedy (dice log / token panel / readout / orchestrace) běží na MAPĚ/CHATU, kde se drd16.css **NEnačítá** → `--dd-embed-surface` nedefinované → `background: var(--dd-embed-surface)` (bez fallbacku) = invalid → `background` spadne na initial `transparent` → panel „skrz". Skiny override-ují jen `--dd-embed-text/muted/num` (ty jsou v `diary-skins.css` přes @import skinů, loaded), proto barva textu fungovala, ale plocha zůstala průhledná.

**Proč jsem to neviděl:** `npm run build` + 8 testů zelené — CSS var bez fallbacku **nezpůsobí build error** a testy nerenderují skutečné pozadí. **Nejhorší: info jsem MĚL** — `minimal.css:22` („token override doletí i na mapu/chat, kde se **drd16.css nelazyloaduje**"), `diary-skins.css:19` („aby se načetly i v embedech … kde drd16.css [není]") + [[project_drd16_system_status]] memory („7 @importů ve STATICKÉM diary-skins.css ne lazy drd16.css"). Přečetl jsem je při průzkumu a stejně dal defaulty do špatné vrstvy.

**Fix:** `--dd-embed-*` defaulty **přesunuty do `diary-skins.css`** (statický, loaded v embedech I na deníkové stránce) + interní fallbacky na `--dd-forge/gold/crimson` (fantasy default v embedu nemá ani ty) + fantasy fallbacky na syrové `--dd-*` v konzumentech (`--dd-parch-0`, `--dd-accent-grad`, `--dd-ink-deep`, `--dd-forge-1`, `--dd-font-display/head/body`, `--dd-crimson-hi`). Build ✓, CSP ✓.

**Poučení:** **Token DEFAULT musí žít tam, kde se KONZUMENT načítá.** drd16 má dvě CSS vrstvy — list (lazy `drd16.css`) vs embedy (static `diary-skins.css`); embed-only tokeny patří do statické vrstvy. Pravidlo: každý `var(--dd-x)` v embed CSS buď má fantasy fallback, nebo token musí být ve static vrstvě. Stejná rodina jako [CH-027] (build/testy slepé na runtime CSS kontext — CSP / lazy-load).

**Příznak cyklení:** panel „skrz" na mapu i po „tokenizaci"; text skinu funguje, plocha průhledná → hledat ROZDÍL mezi text-tokenem (loaded) a surface-tokenem (neloaded), ne ladit alfu.

---

### ✅ ŘEŠENÍ — 16.2d deník DrD+ přepis na jednotný erb-driven list (pergamen-kodex) · 2026-06-26

**Co nakonec zabralo:** Kompletní přepis DrdPlus deníku ze 4-tabového sheetu (8.7f) na **jeden souvislý list** (Postava→Boj→Na cesty→Profese pod sebou) s **výběrem povolání erbem** (klik na štít → popover 6 erbů → řídí akcent listu `data-prof` i proměnlivou sekci Profese). Postaveno z odsouhlaseného HTML mockupu (prototyp=kontrakt). Rozpad: `DrdPlusSheet` (kostra+strany 1-3+erb), `DrdPlusShared` (Scale/Tri/WoundGrid/SignedScale/PrincipHex/JsonTable), `DrdPlusCards` (kouzla/formule s modifikátory+živý součet/démoni — sbalitelné), `DrdPlusProfessions` (6 povolání), přepis `drdplus.css` na pergamen (vlastní `--dp-*`, scoped `.dp-sheet`, akcent per `[data-prof]`).

**Proč to je správně:** `drdp_` prefix + delta-merge `cdAccess` zachovány → **žádná migrace postav** (nová pole jen přídavek; `age`/`postava_popis` osiří, neškodí). Print = **stejný list read-only** (`disabled = view||print`), žádný separátní PrintView (lineární list to umožnil — proti drd16/matrix vzoru se separátním PrintView). Pergamen jako **základní vzhled** (NE skin-reaktivní jako drd16 16.2c — vědomé rozhodnutí uživatele, follow-up).

**Jak ověřeno:** vitest 10/10 (přepis testů taby→sekce, `getByRole('heading')` kvůli kolizi „Boj" page-title × combat label), `tsc -b` čistý, eslint čistý. Vizuál v reálné appce (skutečné fonty, šířka panelu deníku) zatím NEověřen — čeká `mobil-desktop` + uživatel.

**Zhodnocení:** dobře — prototyp=kontrakt + rozpad do shared/cards/professions držel sheet čitelný; jen 2 triviální fixy po tsc/lint (union typ u zlodějova Mistr patche → explicitní `updateArr<Record<…>>`; `no-useless-escape` v pnum regexu). Zbývá vizuál + `funkce`/`napoveda` docs + commit.

---

### CH-029 — FE testy spuštěné přes `npx vitest run <file>` spadly na setup.ts afterEach (špatný kontext) · 2026-06-26

**Kontext:** Ověřoval jsem nový `DrdPlusSheet.spec.tsx`; spustil `npx vitest run src/.../DrdPlusSheet.spec.tsx`.
**Co jsem udělal špatně:** Volal vitest přes `npx` přímo místo projektového skriptu.
**Proč to nefungovalo:** Běh skončil „0 test" + `Error: Vitest failed to find the current suite` v `src/__tests__/setup.ts:9` (`afterEach`). `npx vitest` se rozběhl v kontextu, kde `setupFiles`/globals nedosedly správně → setup hook bez suite kontextu. Přes `npm run test:run -- <file>` (lokální vitest + projektová konfigurace) běh prošel (drd16 17/17, drdplus 10/10).
**Poučení:** FE testy spouštět **`npm run test:run -- <path>`**, ne `npx vitest run <path>` (souvisí s [[project_fe_test_precommit]] — vitest bez globals; projektový skript nese správnou konfiguraci).
**Příznak cyklení:** „0 test" + chyba v `setup.ts afterEach`, ač test soubor je validní → neladit test, přepnout na `npm run test:run`.

---

### ✅ ŘEŠENÍ — mobil: chat akce (odpovědět/reakce/upravit/smazat) ležely na textu → kebab přes `@media (hover: none)` · 2026-06-26

**Symptom (screenshot testera):** Na mobilu inline ikony akcí zprávy překrývaly text (`…máš na to názor` přes ←😊✎).
**Kořen:** [`MessageItem.module.css`](../../src/features/chat/components/MessageItem.module.css) — `.actions` je `position:absolute; top:0; right:0` uvnitř `.body` a starý `@media (hover:none)` ji jen zviditelnil (`opacity:1`). `.body` rezervuje vpravo jen `padding-right: 64px`, ale 4 tlačítka (8px padding/ks) ≈ 120px → přetekla do textu prvního řádku. Na desktopu nevadí (jen na hover).
**Fix:** Na dotyku `.actions { display:none }` a místo nich jediný kebab `⋮` (`.kebabTrigger`) ukotvený v gutteru (≤64px → nepřekrývá text), klik → sdílený [`KebabMenu`](../../src/shared/ui/KebabMenu/KebabMenu.tsx) (desktop popover / mobil bottom-sheet, sám se zavírá). Reakce z menu → `EmojiPickerPopover`, na mobilu taky bottom-sheet, takže kotvu (`reactionBtnRef`) ignoruje — netřeba živé inline tlačítko. Touch terč zvětšen 24→44×36px.
**Past chycená v `mobil-desktop`:** Rozhoduje `@media (hover: none)` (dotyk vs. myš), **ne** šířka — Playwright desktop screenshot má hover, rozdíl by neukázal. Ověřeno CSS rozborem + 18/18 unit testů (kebab items se renderují jen při otevřeném menu → `getByLabelText('Odpovědět')` stále unikátní inline tlačítko).
**Zhodnocení:** dobře — jeden zátah ve sdílené komponentě (globální i world chat, 11 chat skinů, žádný skin `.actions` nepřebíjí), reuse `KebabMenu`+`EmojiPickerPopover` bottom-sheetů. Hlídat: u responsivních interakčních fixů odlišit `hover`-media od `width`-media (skill `mobil-desktop` defaultně myslí šířku).

---

### ✅ ŘEŠENÍ — kostka 2d6+ otevřený eskalující hod DrD plus a d6+ v manuálním pickeru · 2026-06-27

**Co nakonec zabralo:** Nová roll primitiva `rollExploding2d6` (trigger jen na dvojici 2×6/2×1, ±1 za pokračovací kostku, směr nahoru/dolů i do záporu, cap 50) + vertical slice napříč ~12 soubory (engine → payload → 3D notace → sheet/diary roll → dice log → katalog → preset → manuální picker). Mechaniku dodal uživatel doslova vč. 2 příkladů (CH-023 — NErekonstruovat z paměti); ověřena oběma (14 a −3).
**Tři netriviální gotchy (poučení do 16.2 per-system dice):**
1. **Typ s `+` neprojde `rollGenericDice` regexem** `^(\d*)[dk](\d+)$` → tiše spadne na **default k20**. Řešení = **centralizovat dispatch** (`d6+`→`rollExplodingD6`, `2d6+`→`rollExploding2d6`) přímo v `rollGenericDice`, ne jen v sheet/diary větvích. Jen tak to dostal i **manuální picker** (`DicePickerPopover.performRoll` volá `rollGenericDice`) bez speciální větve. (Rozšíření vzoru `d6+` z 16.2b — viz [✅ ŘEŠENÍ 16.2b-mapa](#-řešení--162b-mapa-drd16-combat-panel--d6-exploding-engine--strukturovaný-spellbook--2026-06-25).)
2. **`DiceLogPanel.renderBreakdown` sčítá tváře** `(a + b + c)` — pro `2d6+` to **LŽE** (výsledek je `základ páru ± delta`, NE součet tváří; pokračovací kostka nepřičítá hodnotu, jen ±1). Nutná **vlastní větev** `2d6+` (`(6+6 ▲ +2) = +14`) PŘED generickou numeric větví + vynutit rozpis i bez labelu/modu, když delta≠0 (jinak kaskáda 5 tváří bez kontextu mate). `d6+` v generic větvi zůstává správně (tam součet tváří = výsledek).
3. **Glyf dlaždice `2k6﹢` s U+FE62 (small-plus)** — font **Iceland** ho nemá → fallback font (jiný baseline). Fix = ASCII `+` (`2k6+`); „malost" řeší `glyphSize: sm`. Chyceno **CSS rozborem v `mobil-desktop`**, ne buildem (runtime font coverage je pro tsc/test slepá — rodina CH-024/CH-027).
**Jak ověřeno:** `npm run build` (tsc -b ✓ — dual-source union `RollKind`/`DiaryRollKind`/`GenericDicePayload.type`/`KEY_ALIASES` build chytá drift jako u `d6+`), vitest 98 (6 nových `rollExploding2d6` vč. obou příkladů + edge + cap, regrese dice/drd16 zelená), HelpPage 25, eslint 0, lint:colors bez nového nálezu.
**Zhodnocení:** dobře — jeden zátah, 0 cyklení, gotchy chyceny proaktivně (ne po selhání). Centralizace = single source dispatche místo 3 míst. **Zbývá (mimo spec):** TM combat panel pro DrD+ si zavolá `kind:'2d6+'` („pak v TM"). Past: kdyby další systém přidal kostku s `+`/jiným ne-XdN tvarem, MUSÍ dostat větev v `rollGenericDice` + (pokud nesumuje tváře) v `renderBreakdown`.

---

### ✅ ŘEŠENÍ — 16.2d-mapa DrD+ combat panel (2k6+ hody · postih · okna reuse) · 2026-06-27

**Kontext:** „pak v TM" z [16.2-2d6plus](#-řešení--kostka-2d6-otevřený-eskalující-hod-drd-plus-a-d6-v-manuálním-pickeru--2026-06-27) — dostat DrD+ deník na taktickou mapu jako bojový panel. Mechaniky dodal uživatel (spec-16.2d-mapa-drdplus), prototyp `c:/tmp/drdplus-mapa-mockup.html` iterován v chatu (3D tlačítka, postih, přesun zbraní, picker pryč) → schválen → kód.

**Co zabralo (3 nosná rozhodnutí):**
1. **Single source bez nové write-vrstvy:** panel staví `cda = makeCdAccess(cd, 'drdp_', canEdit ? handleChange : undefined)` a `handleChange` jen sype `customDataPatch` do `pending` + debounced mutace (vzor `Drd16CombatPanel`). Tím panel sdílí PŘESNÉ klíče i delta-merge semantiku s deníkem (prefix `drdp_`) — 0 duplicitní logiky, magenergie/náklonnosti/vliv/postih/životy se propíšou do listu.
2. **Okna „k nahlédnutí" = reuse deníkových komponent v `disabled` módu** (`SpellList`/`FormuleList`/`DemonList`/`JsonTable`/`Scale`), ne re-implementace. Formule/démoni mají ~300 ř. složitých struktur → vlastní read-view = drift. Komponenty jedou na `.dp-*` třídách scoped na `.dp-sheet` → **statický `import '…/styles/drdplus.css'`** v panelu (scoped, neuniká) + obal `<div className="dp-sheet" data-prof>`. Modal je portál do body, ale scoped CSS je globální → styly sednou i tam.
3. **Postih = fold do modifieru:** `doRoll(label, base, kind)` počítá `modifier = base + numOr('zraneni_postih') + numOr('unava_postih')`. Engine/payload netknuté — auto-odečet od KAŽDÉHO hodu (R4) bez zásahu do `rollEngine`/`performSheetRoll`. `ZZ = 'd6'` (1k6), ostatní `'2d6+'`.

**Proč správně:** žádná BE změna (vše `customData`), engine `2d6+` už hotový z 16.2-2d6plus → panel je jen UI+wiring. Reuse listových komponent drží paritu deník↔mapa zdarma. Picker povolání na mapě záměrně NENÍ (povolání = `drdp_profession`, mění se v deníku).

**Past (typy, dual-source):** `SystemSheetProps['onRoll']` union **neměl `'2d6+'`** (jen `performSheetRoll`/`RollKind` ano) → bez doplnění by iniciativa `kind="2d6+"` neprošla tsc. Navíc `SheetInitiativeButton` má **vlastní** kind union — taky doplnit. Rodina „dual-source union" jako u `d6+`.

**Vlastní chyba (malá):** `tsc -b` jsem pustil PŘED napsáním testu (inkrementální → test neviděl); plný `npm run build` pak chytil typovou chybu v test-helperu (`ReturnType<typeof vi.fn>` = `Mock` s construct-signaturou není assignable na `onRoll`). Fix = typovat helper přes `SystemSheetProps['onRoll']`. Poučení: po přidání test-souboru spustit build/tsc znovu, ne se spolehnout na předchozí inkrementální zelenou.

**Jak ověřeno:** `npm run build` (tsc -b ✓ + vite ✓ + CSP ✓), vitest DrdPlusCombatPanel **11/11** (rolls 2d6+/d6, postih auto-odečet, Velikost/Hmotnost se nehází, Kněz aspekt, canEdit gating, debounced postih persist) + DrdPlusSheet 10/10 + HelpPage 25/25, eslint 0 na nových/změněných, `mobil-desktop` (CSS analýza — fluidní, 0 fixních šířek), `funkce` (kap. 14) + `napoveda` (WorldSection) aktualizovány.

**Zhodnocení:** dobře — jeden zátah, 0 cyklení; reuse (cdAccess + diary komponenty) ušetřil stovky řádků a drift. Jediná vlastní chyba (tsc inkrementální slepota) chycena buildem před koncem. Past dual-source union potvrzena potřetí (d6+→2d6+) — kdyby přibyl další systém s panelem házejícím `2d6+`, union už ho má.

---

### ✅ ŘEŠENÍ — D-NEW-INV-SEC (4/5) + color-tokens ALLOW krok · 2026-06-27

**Kontext:** Po featuře uživatel zadal „sprav všechny dluhy". Začal jsem bezpečnými: color-tokens ALLOW krok + bezpečnostní inventura D-NEW-INV-SEC (FE+BE).

**Co zabralo:**
1. **color-tokens** — rozšířen `ALLOW` v `lint-no-hardcoded-colors.mjs` o datové dirs (dice/diary styles+sheets) → `lint:colors` **4397→1622** (vyňato 2775 barev datové identity; zbytek = chrome drift na vizuální projití, ne auto-commit).
2. **INV-SEC 4/5** — heslo `@MinLength 6→8`; scenarios role-floor `<PomocnyPJ` na **controlleru** (ne service → mimo CH-011 riziko interních volání); themeUserOverrides sanitizace. **Public profile leak = už opravený 2026-06-18** (čtení KÓDU > čtení dluhu — dluh byl zastaralý). Zbývá persona-on-server (cross-cutting).

**Dvě vlastní chyby — obě chycené funkce inventurou (`docs/funkce/`) jako cross-check PŘED commitem:**
- **Duplicitní sanitizér:** napsal jsem nový `private sanitizeThemeOverrides` v `updateMyTheme`, ač **už existuje exportovaná** `sanitizeThemeOverrides` (world-level, `--theme-*`, max 60) s testy. funkce kap. 10 ř. 275 (nesrovnalost) říkala doslova „aplikuj `sanitizeThemeOverrides`" → reuse místo duplikátu (stejný název = matoucí; typecheck to nechytil, protože existující je module-fn, ne metoda).
- **Polovičatá změna hesla:** změnil jsem nejdřív jen BE `register.dto`. funkce kap. 01 ř. 21 („FE **i** BE `RegisterDto`") odhalila dual-source → doplnil FE `registerSchema` + spec (jinak FE pustí 7 znaků, BE 400).

**Proč správně:** controller-level gate = nelze způsobit interní-volání regresi (CH-011); reuse existujícího sanitizéru = konzistence s world-level + 0 nové netestované logiky; čtení kódu odhalilo 1 zastaralý nález (profile endpoint) → neřešil jsem už vyřešené.

**Jak ověřeno:** BE typecheck ✓, lint:check + elevation guard ✓, jest `worlds`/`campaign`/`auth` **317/317** (worlds re-run po reuse 172/172) ✓. FE tsc -b ✓, `registerSchema` 11/11 ✓. dluhy.md + funkce kap. 01/02/10/15 srovnány.

**Zhodnocení:** dobře — **funkce inventura jako cross-check chytila 2 vlastní chyby před commitem** (duplikát + dual-source half). Poučení: před psaním BE helperu grep existující; min-length/validace/whitelist = vždy dual-source FE+BE, měň oba. Past: dluh může být zastaralý → ověř proti kódu, ne slepě „oprav".

---

### ✅ ŘEŠENÍ — INV-CLEANUP audit-log enum drift (FE 10 vs BE 25) · 2026-06-27

**Kontext:** Dluh tvrdil „audit-log labely se rozcházejí". Realita byla horší — FE `AdminAuditAction` znalo **10** akcí, BE `admin-audit-log.interface.ts` emituje **25** → admin audit log u 16 akcí (DELETE/HARD_DELETE/BULK_*/WORLD_ELEVATION_*/ACCOUNT_*/USER_CREATE/PERMISSIONS_CHANGE…) zobrazoval **prázdné**.

**Co zabralo:** FE union srovnáno s BE (zdroj pravdy) + exhaustivní `ACTION_LABELS`/`ACTION_CLASS` (`Record<AdminAuditAction,_>` → TS **vynutí úplnost**, nelze přidat akci bez labelu). `FRIENDSHIP_COOLDOWN_RESET` ponecháno jako **FE-only phantom** (grep BE = 0 výskytů → BE ho nikde neemituje; aditivní = bez removal-rizika, flagnuto k rozhodnutí drop/BE-log).

**Proč additivní (ne replace):** FE jako superset BE = okamžitě zobrazí vše, co BE pošle, BEZ rizika, že odeberu něco, co BE přece jen emituje jinou cestou. Drift kořen = FE ručně zrcadlí BE enum (dvě nezávislé string-union kopie přes repo hranici → **rozejdou se tiše**, žádná compile chyba).

**Jak ověřeno:** FE tsc -b ✓ (exhaustivní Record by chybějící label nepustil), PlatformAdminPage 6/6 ✓.

**Zhodnocení:** dobře — **exhaustivní `Record<Enum,_>` je ten správný guard** proti tiché ztrátě labelu při příštím přidání akce. Past pro budoucí: kdykoli BE přidá `AdminAuditAction`, FE union + oba Record se MUSÍ doplnit (cross-repo, build to nechytí dokud někdo nerozšíří FE union). Ideál = sdílený typ, ale přes 2 repa nejde.

---

### ✅ ŘEŠENÍ — system-id drift POTŘETÍ: COMBAT_PANELS + chat panel minuly 16.2a alias fix · 2026-06-27

**Symptom (uživatel):** „deník u DrD+ máme i v taktické mapě, ale nepropisuje se." Reálně: na stránce postavy se zobrazil hezký `DrdPlusSheet`, ale na mapě (a v chatu) se místo kompaktního `DrdPlusCombatPanel` vyrenderoval **legacy `DiaryTab`** → vypadalo to jako jiný/nepropojený deník.

**Kořen:** `world.system` z nabídky se ukládá jako „dlouhé" id `'drd-plus'` (a `'call-of-cthulhu'`), engine zná krátké `'drdplus'`/`'coc'`. Normalizaci (lowercase + alias) měl **jen** diary registry (`getDiaryPreset`) a map registry (`getMapSystemPlugin`) — každý **vlastní kopii** `SYSTEM_ALIASES`. `COMBAT_PANELS` lookup ([TokenSystemSheet] na mapě + [DiaryRollPanel] v chatu) četl **syrové `world.system`** → `COMBAT_PANELS['drd-plus'] = undefined` → fallback. Postižené = `drd-plus` **a `call-of-cthulhu`** (oba mají panel + dlouhé id). `drd16`/`drd2`/`matrix` fungovaly jen náhodou (krátké id == klíč).

**Proč 16.2a fix tohle minul:** ✅ ŘEŠENÍ „16.2a fix system-id driftu" (2026-06-23) opravil drift přidáním aliasů, ale **jen do 2 ze 4 konzumentů** `world.system` (diary + map registry). COMBAT_PANELS a chat panel zůstaly. Klasická past CH-011 / role-elevation: **fix-by-alias bez grep sweepu VŠECH konzumentů** = oprava půlky.

**Co zabralo:** extrahoval jsem normalizaci do **jediné zdrojové pravdy** `src/features/world/systemId.ts` (`resolveSystemId` + `SYSTEM_ALIASES`); přepojil **4 konzumenty** (diary registry, map registry, `TokenSystemSheet`, chat `DiaryRollPanel`) — žádná lokální kopie aliasů už neexistuje (umořen dluh D-NEW-SYS-ALIAS-DUP). Bonus: bestie větve v `TokenSystemSheet` (`=== "matrix"`/`"drd16"`) taky přes normalizované id (robustnost). Přidán **regresní guard** `combatPanels.test.ts` — paritní test, který COMBAT_PANELS dosud (na rozdíl od obou registry) neměl, takže drift prošel.

**Vědomě NEopraveno:** `worldSystemId` v `TacticalMapView` (`?? "drd2"`) teče do bestiář query klíčů + BE schema lookupu → normalizace naslepo by mohla rozbít FE↔BE kontrakt (BE může držet bestie pod raw `'drd-plus'`). Zaznamenáno jako samostatné riziko v dluzích.

**Jak ověřeno:** vitest 60/60 (oba registry + nový combatPanels + DrdPlusCombatPanel), `npm run build` (tsc -b + vite) ✓.

**Zhodnocení:** dobře — root-cause fix (1 pravda místo 3 kopií) + guard, ne lokální záplata. Poučení (rodina CH-011): **při fixu „přidej alias / přemapuj id" zgrepuj VŠECHNY konzumenty toho id PŘED tím, než prohlásíš hotovo** — drift se schová v tom, který jsi minul, a vrátí se o systém později (`drd-plus` místo `draci-hlidka`). A: nový registry-lookup vždy se stejným paritním guardem jako sourozenci.

---

### CH-030 — implementoval jsem DrD+ bestie schéma DŘÍV, než jsem ověřil, jak konzument získává `systemId` (málem mrtvý kód) · 2026-06-27

**Kontext:** 16.2d — nové per-system schéma `drdplus:bestie` do bestiáře. Napsal jsem JSON + wrapper + `bootstrap` registraci + test + spustil build + `export-schemas` do BE — vše zelené, prohlásil bych „hotovo".

**Co jsem udělal špatně:** ověření **napojení** (jak `BestiarPage` resolvuje `systemId`, pod kterým se schéma hledá) jsem nechal až na konec — našel jsem ho náhodou až při zápisu dluhu, když jsem si všiml existujícího `D-NEW-SYS-WORLDSYSTEMID-RAW`.

**Proč to nefungovalo:** `BestiarPage.tsx` bral `world.system` **syrově**; pro DrD+ svět je to `'drd-plus'` (dlouhé id z nabídky `RPG_SYSTEMS`), ale registry/engine zná jen canonical `'drdplus'` → `registry.get('drd-plus','bestie')` MISS → fallback / „schéma není zaregistrované". Celé schéma by se **nikdy nepoužilo** (mrtvý kód), přestože testy i build byly zelené (testují schéma izolovaně, ne jeho napojení).

**Poučení:** u per-system featury (schéma/panel/sheet) je **prvním** krokem zgrepovat, jak konzument získává `systemId` — `world.system` nese „dlouhá" id (`drd-plus`/`call-of-cthulhu`/`draci-hlidka`), canonical je až po `resolveSystemId` (`src/features/world/systemId.ts`). Zelené testy schématu ≠ schéma se reálně renderuje. Tohle je **4. výskyt rodiny system-id drift** (16.2a alias fix, CH-113 `COMBAT_PANELS`, teď bestiář) — rodina se vrací, ber grep konzumentů jako rutinu.

**Příznak cyklení:** dodávám per-system artefakt a spoléhám na izolované zelené testy, aniž bych ověřil, že ho konzument pod správným id najde; v UI by vyskočilo „schéma není zaregistrované" / generic fallback.

---

### ✅ ŘEŠENÍ — DrD+ bestiář napojen normalizací `systemId` v `BestiarPage` (4. výskyt rodiny system-id drift) · 2026-06-27

**Co nakonec zabralo:** `BestiarPage` normalizuje `world.system` přes `resolveSystemId` (jediná pravda v `systemId.ts`, kterou už používaly diary/map registry i `COMBAT_PANELS` po CH-113). Před tím jsem ověřil, že BE modul `bestiae` je **pass-through** (ukládá i filtruje `systemId` beze změny, žádná legacy data dotčených systémů) → normalizace na FE je bezpečná a nerozbije FE↔BE kontrakt (přesně před tím varoval dluh).

**Proč to je správně (a ne další variace):** root fix na úrovni konzumenta, ne registrace schématu pod druhým id. Jedním zásahem se napojí **DrD+ i CoC i Dračí hlídka** bestiář (všechny tři měly stejný MISS) a umoří se bestiář-část dluhu `D-NEW-SYS-WORLDSYSTEMID-RAW` (na mapě `TacticalMapView` zůstává — zapsáno).

**Jak ověřeno:** vitest 19/19 (bestiar specs + nový `drdplus-bestie`), `npm run build` (tsc -b + vite) ✓, `export-schemas` → BE mirror ✓.

**Zhodnocení:** dobře že existující dluh navedl k nálezu dřív, než jsem „hotovo" odeslal; **špatně** že ověření napojení mělo proběhnout v research fázi PŘED implementací (viz CH-030). Rodina system-id drift se opakuje počtvrté → napříště je první krok per-system práce `grep` všech čtenářů `world.system`. Wound-pás DrD+ vědomě odložen (`D-DRDPLUS-WOUND-LINEAR`).

---

### ✅ ŘEŠENÍ — 16.2d Fáze 2 DrD+ bestie na taktické mapě (DrdPlusBestiePanel) + 5. výskyt system-id drift chycen PŘEDEM · 2026-06-27

**Co nakonec zabralo:** Nový `DrdPlusBestiePanel` (pergamen reuse `DrdPlusCombatPanel` stylu): hody `2d6+`/`d6` přes `performSheetRoll`+`onMapRoll`, **BČ zapíše `token.initiative`** (iniciativa z BČ, žádné tlačítko), **číselný wound** (3 pásma dopočet z `injury` vs `mez_zraneni` — škáluje i na mez 50, kde klikací políčka selhávají), **in-place edit** (jeden panel přepne pole na inputy, ne separátní modal), nové `drdplus:token` schéma pro persist editů (sanitizace `systemStats`, BE STRICT). Registrace v `TokenSystemSheet`. Uzavřel dluh `D-DRDPLUS-WOUND-LINEAR`.

**Proč to je správně (a ne další variace):** číselný wound (ne klikací políčka) = správný pivot po tom, co políčka nešla pro mez 50 (uživatelův návrh); jeden panel s edit-toggle je míň kódu i čistší UX než separátní modal (drd16 měl modal).

**KLÍČOVÉ (rodina system-id drift):** `TacticalMapView` `worldSystemId` jel na **syrovém** `world.system` → pro DrD+ svět `'drd-plus'`, takže větev `systemId==='drdplus'` v `TokenSystemSheet` by minula (bestie → generic) a bestiář-query mapy by hledal pod `'drd-plus'`, ač bestie jsou pod `'drdplus'` (po CH-030 fix `BestiarPage`). **Tentokrát chyceno v research fázi PŘED oznámením „hotovo"** — díky poučení CH-030 jsem proaktivně grepl čtenáře `world.system`. Fix = `resolveSystemId(world?.system)` → dokončen celý dluh `D-NEW-SYS-WORLDSYSTEMID-RAW`.

**Jak ověřeno:** vitest 19/19 (9 panel + 10 schema), `npm run build` (tsc -b + vite) ✓, export-schemas 21 schémat → BE.

**Zhodnocení:** dobře — poučení z CH-030 zafungovalo, mrtvý kód chycen předem (ne až nahlášený uživatelem). Prototyp-driven iterace vzhledu měla hodně kol (políčka→číselný wound, edit modal→in-place, grid/box-sizing overflow fixy), ale levné v HTML před React kódem. Vzor pro další per-system bestie panely: **grep všech čtenářů `world.system` = první krok**.

---

### CH-031 — deklaroval jsem „grep VŠECH konzumentů world.system", ale provedl ho jen pro jeden soubor · 2026-06-27

**Kontext:** 16.2d Fáze 2 DrD+ bestie na mapě. Předchozí ✅ ŘEŠENÍ tvrdilo „drift chycen předem" + „grep všech čtenářů = první krok".
**Co jsem udělal špatně:** poučení jsem **deklaroval, ale neprovedl** — grep udělal nedůsledně (jen kolem `TacticalMapView`), minul 4 komponenty s vlastním `const systemId = world?.system ?? null`: `MapPjPanel:127` (katalog bestií + spawn), `TokenSprite:463` (HP), `ChatContextRail:69`, `CombatRosterPanel:150` (chat bestie).
**Proč to nefungovalo:** každá komponenta drží vlastní lokální `systemId` z `world.system` — oprava jednoho místa nestačí. DrD+ Duch (uložen pod canonical `drdplus`) se nezobrazil v orchestraci mapy (hledala pod raw `drd-plus`). Uživatel narazil na bug → „chyceno předem" bylo iluzorní.
**Poučení:** deklarované poučení MUSÍM i provést. Grep `world\?\.system|world\.system` přes **CELÝ `src`**, spočítat výskyty, každý buď opravit nebo odůvodnit (display/gate). Kořen je architektonický — žádný sdílený resolved-systemId hook, každá komponenta si bere `world.system` sama.
**Příznak cyklení:** opravím drift v jednom souboru a prohlásím rodinu za vyřešenou; uživatel najde další komponentu se syrovým `world.system`.

---

### ✅ ŘEŠENÍ — system-id drift dotažen přes CELÝ src (4 zbylí konzumenti) · 2026-06-27

**Co nakonec zabralo:** grep `world\?\.system|world\.system` přes celý `src` → 9 lookup-relevantních míst; 5 už canonical (TacticalMapView/TokenSystemSheet/DiaryRollPanel/BestiarPage/COMBAT_PANELS), **4 opraveny teď** na `resolveSystemId`: `MapPjPanel`, `TokenSprite`, `ChatContextRail`, `CombatRosterPanel`. Display/gate místa (WorldDetailInfo, BasicInfoTab, PageViewer `==='matrix'`) ponechána; diary/skin normalizují interně (`getDiaryPreset`/`resolveDefaultSkin`).
**Proč to je správně:** grep nad celým stromem + klasifikace každého výskytu (lookup vs display), ne bodová oprava. Sjednocuje mapu+chat+bestiář na canonical.
**Jak ověřeno:** `npm run build` ✓; uživatel ověří refreshem mapy (Duch v „+ z katalogu").
**Zhodnocení:** dobře že rodina je teď dotažená; špatně že to trvalo 9 výskytů + uživatelský bug. Budoucí dluh: centralizovat do hooku (`useResolvedSystemId`), aby raw `world.system` nešlo použít omylem.

---

### ✅ ŘEŠENÍ — centralizace systemId do `useResolvedSystemId` hooku (uzavírá rodinu system-id drift) · 2026-06-27

**Co nakonec zabralo:** nový hook `src/features/world/useResolvedSystemId.ts` (`resolveSystemId(useWorldContext().world?.system)`) — všech **8 komponentových konzumentů** migrováno z ručního `resolveSystemId(world?.system)` na hook: TacticalMapView, MapPjPanel, TokenSprite, TokenSystemSheet, BestiarPage, DiaryRollPanel, ChatContextRail, CombatRosterPanel. U 5 z nich (jen systemId) odebráno i `const { world } = useWorldContext()`. Registry-resolvery s param `systemId` (map-systems/diary-systems registry) ponechány. Uzavřel dluh D-SYSTEMID-HOOK.

**Proč to je správně (a ne další variace):** kořen rodiny byl architektonický — raw `world.system` roztroušený po komponentách. Hook = jediné místo normalizace; nový konzument volá `useResolvedSystemId()` a nemůže zapomenout. Bodové opravy (CH-030/CH-031) jen hasily výskyty.

**Jak ověřeno:** `npm run build` ✓, eslint 9 souborů (0 errors, jen 1 pre-existující warning set-state-in-effect mimo změnu), vitest 22/22 (combatPanels parita + DrdPlus panel + bestiar).

**Zhodnocení:** dobře — rodina (9 výskytů, CH-011/030/031/113) konečně uzavřená architektonicky, ne záplatou. Zbytek (lint guard proti raw `world.system`) neudělán — hook riziko snižuje dost, guard by byl marginální.

---

### CH-032 — cross-surface embedy (HODY/dicelog/readout/token chrome/ORCHESTRACE) vynechány při grafickém průchodu systému (drdplus 16.2d) · 2026-06-27
**Kontext:** 16.2d DrD+ grafický průchod — udělal jsem deník (CH-107), combat panel (CH-111), bestii (CH-116), ale obal tokenu + samostatné mapové/chat embedy zůstaly na tmavém mapovém `--map-ui-*`, nesladěné s pergamenem. Uživatel narazil ("hody, dicelog i to kolo bestie není stejné jako deník … není to poprvé").
**Co jsem udělal špatně:** považoval jsem systém za "hotový" po deníku+combat+bestii a NEpropsal embed skin (sada `--dd-embed-*` + větve `[data-diary-system='drdplus']` ve 4 modulech). U drd16 (CH-105) jsem to udělal, u drdplus zapomněl — opakovaný vzor (předtím sci-fi/embed CH-104/105).
**Proč to nefungovalo:** embed komponenty (`TokenInfoPanel` chrome, `DiceLogPanel`, `DiceRollOverlay`, `MapPjPanel`) dostávají `data-diary-system='drdplus'`, ale CSS mělo větev jen pro `drd16`/`matrix` → drdplus spadl na mapový default.
**Poučení:** grafický průchod systému NENÍ hotový po deníku+combat+bestii. **Embed parita je povinný krok**: 5 povrchů (token chrome · HODY/dicelog · dice readout · ORCHESTRACE · chat roll panel) přes 4 moduly (`TokenInfoPanel`/`DiceLogPanel`/`DiceRollOverlay`/`MapPjPanel`.module.css) + token sada `--dd-embed-*` (nebo `--mx-*`). Při novém systému zgrepuj `data-diary-system='drd16'` → ke každé větvi přidej svůj systém. (= šablona-denik-per-system krok 8.)
**Příznak cyklení:** uživatel hlásí "X (dice log / chrome / orchestrace) nevypadá jako deník" po dokončení deníku systému; ladím jen `.dp-sheet`/panel, ne embed moduly.

---

### ✅ ŘEŠENÍ — DrD+ PC/NPC+bestie panel: iniciativa přes explicitní flag (ne label), redundantní hlavička pryč · 2026-06-27
**Co nakonec zabralo:** (1) **Iniciativa = explicitní flag** `initiative?: boolean` na `onRoll` requestu ([types.ts](../../src/features/world/pages/CharacterDetailPage/diary-systems/types.ts)); `TokenSystemSheet` detekuje `const isInit = req.initiative ?? /iniciativ/i.test(req.label)` — flag pro DrD+ (init je pod labelem „Boj" / zbraňové „BČ"), label fallback drží BC pro drd16/matrix. Flag se do hodu přidává **jen když true** (`...(initiative && { initiative: true })`) → neinit hody volají `onRoll` ve stejném tvaru = nulová test churn. (2) init tlačítko „Iniciativa"→„**Boj**" (hází `2k6+ + boj_b`, číselně = kolonka Boj v deníku); Boj i zbraňové BČ teď zapisují `token.initiative`. (3) **redundantní hlavička panelu pryč** (erb+jméno+profese u combat, erb+jméno+„Bestie" u bestie) — duplikovala `TokenInfoPanel` chrome (jméno+portrét nad panelem); u bestie zachováno přejmenování jen v edit módu.
**Proč to je správně (a ne další variace):** explicitní flag > křehké matchování labelu — přejmenování „Iniciativa"→„Boj" by string-detekci tiše rozbilo (init by se přestala zapisovat). Conditional-spread (flag jen když true) zabránil rozbití všech `toHaveBeenCalledWith` asercí neinit hodů. Vzor reusable pro každý systém, jehož init není labelovaný „Iniciativa".
**Jak ověřeno:** 20 testů (DrdPlusCombatPanel+BestiePanel) ✓, `npm run build` ✓.
**Zhodnocení:** dobře — čisté, zpětně kompatibilní, reusable. Zbytek: mrtvé CSS hlaviček (`.erb`/`.crest`/…) ponecháno (neškodí, uživatel ještě iteruje vizuál).

---

### ✅ ŘEŠENÍ — DrD+ bestie v chatu (parita s mapou): sdílené jádro + obalení + log dice · 2026-06-27
**Co nakonec zabralo:** uzavřel CH-032 vzor pro drdplus chat. (1) **Sdílené jádro** `DrdPlusBestieCombatActions` extrahováno z mapového `DrdPlusBestiePanel` (Útoky/Ochrana/Vlastnosti-Tělo-Smysly/Schopnosti/Poznámky, view+inline-edit) — mapa i chat jeden zdroj (0 drift, vzor drd16 `Drd16BestieCombatActions`); wound zůstává per-panel přes `woundSlot` (mapa `token.injury`, chat `systemStats.injury`). (2) `DrdPlusChatBestiePanel` (`useChatDiaryRoll` 2k6+/d6, BČ→`onResult`→`onPatch({initiative})`, inline edit přes `onPatch`). (3) drdplus větve v `BestieRollPanel`+`BestieInstancePanel`. (4) **„Obalení"**: `DiarySkinScope` (display:contents) nad CELÝM railovým `<aside>` + railShell `[data-diary-system='drdplus']` → chrome (identity/controls) pergamen. (5) **„Log dice"** = `DiceRollOverlay` drdplus větev (hotová dřív, jede přes provider DiarySkinScope).
**Past (vlastní):** outer `DiarySkinScope` nad aside vynutil QueryClient/WorldContext i na **generic** větvi (přes `useDiarySkin`→`useQuery`) → rozbil `BestieRollPanel.spec` (coc bestie, „No QueryClient"), který scope dřív nepotřeboval. Fix = `vi.mock` DiarySkinScope passthrough. **Poučení:** přidám-li wrapper vyžadující context na SPOLEČNOU cestu, musím projít i testy větví, co ho dřív nepotřebovaly.
**Pozn. (návrh):** vnitřní DrdPlus panel je pergamen i bez scope (`.root` má self-contained `--dd-*`); DiarySkinScope nad aside je potřeba pro drd16/matrix vnitřní panely (konzumují ancestor tokeny) + drdplus **chrome** (`--dd-embed-*`).
**Jak ověřeno:** 34 testů (chat+map+rail+combat) ✓, `npm run build` ✓, eslint --fix čistý.
**Zhodnocení:** dobře — no-drift extrakce, parita napříč deník/mapa/chat. drd16/matrix chrome zatím chat-motiv (neskinováno) = vědomá odchylka (uživatel chtěl drdplus); případný follow-up.

---

### CH-033 — `display:contents` wrapper kolem aside rozbil flex šířku (pruh vpravo u chat bestie) · 2026-06-27
**Kontext:** „obalení" chat bestie railu deníkovým skinem (chrome pergamen) — obalil jsem celý `<aside class=panel>` do `<DiarySkinScope style={{display:'contents'}}>`.
**Co jsem udělal špatně:** `display:contents` wrapper se stal posledním DOM potomkem `.tabWrap`, na který míří `.tabWrap > :last-child { flex:1; min-height:0 }`. Selektor trefil wrapper, ale `display:contents` element **ignoruje vlastní box** (flex/min-height/stretch se neaplikují) → aside (promovaný flex item) nedostal roztažení → obsah užší, **pruh vpravo**. PC (DiaryRollPanel) outer wrapper nemá → bez problému, proto „u PC to není".
**Proč to nefungovalo:** `display:contents` = element zmizí z layoutu, ale ZŮSTÁVÁ v DOM jako match pro `> :last-child`/`> *` selektory rodiče → „ukradne" pravidlo, které se pak nikam neaplikuje.
**Poučení:** `display:contents` wrapper NEpoužívat tam, kde rodič cílí PŘÍMÉHO potomka (`> :last-child`, `> *`, nth-child) nebo ho flex/grid dimenzuje. Místo wrapperu dej atribut PŘÍMO na cílový element (`<aside data-diary-system>` + `.panel[data-attr]`, mirror `TokenInfoPanel`). (Pozn.: v `TacticalMapView` display:contents funguje, protože tam rodič přímé potomky takhle necílí.)
**Příznak cyklení:** vizuální „pruh"/užší obsah po přidání obalového wrapperu; bez wrapperu layout OK.

---

### ✅ ŘEŠENÍ — 16.2f DrD2 deníkové skiny (7 stylů) tokenizace panelů + agent fleet; chat-bestie parita + mobil fix · 2026-06-28
**Co nakonec zabralo:** Krok 8 playbooku per-system: (1) sám tokenizoval `Drd2CombatPanel/BestiePanel.module.css` na `var(--dd-x, <orig>)` (fallback=originál → 0 regrese) + `--dd-*` pergamen baseline do `diary-skins.css`; (2) 7 paralelních opus agentů = 1 skin/soubor z odsouhlasených HTML mockupů + sesterských drd16/drdplus; (3) 1 agent dicelog+readout signature. Panely sdílí mapa↔chat → tokenizace oskinuje OBA jedním zásahem.
**Proč to je správně (a ne další variace):** povrchové tokeny s RŮZNOU hodnotou per místo (`--dd-card-bg/-input-bg/-seal-soft/-seal-line/-row-bg`) jsem ZÁMĚRNĚ nedal do baseline → každé místo má per-site `var(--dd-x, originál)` fallback → default pixel-identický (regrese-safe), skin je definuje pro reskin. (Kdybych je dal do baseline jednou hodnotou, zploštím alfy = změna defaultu.) Agent fleet z mockupu = profesionální kvalita bez cyklení (mockup=kontrakt, vzor jako 16.1d-F3/16.2c).
**Jak ověřeno:** build zelený (tsc -b+vite, 4×); 7 skinů vyrenderováno na REÁLNÉM `.drd2-*` markupu (statický harness linkuje skutečný `drd2.css`+skin, ne mockup CSS) → žádný fantasy bleed-through; mobil 390px overflow-check 7/7 OK.
**Zhodnocení:** dobře — zabralo bez cyklení. **2 reálné nálezy navíc:** (a) drd2 bestie v chatu byla bez `DiarySkinScope` → neoskinovaná (vnější aside měl jen `data-diary-system`, ne `-skin`); rodina CH-032/CH-033, opraveno obalením (parita s mapou) — drdplus má tutéž mezeru → dluh `D-16.2F-DRDPLUS-CHAT-BESTIE-SKIN`. (b) širší font skinu (Orbitron retro) přetlačil `.drd2-prof` na mobilu (grid 1fr track = min-content floor) → base fix `flex-wrap:wrap` v @media 768 (robustní pro všechny skiny). funkce+napoveda doplněny. Zbývá živý `mobil-desktop` + commit.

---

### ✅ ŘEŠENÍ — 8.7p JaD deník: multipovolání + obory + přidávatelné sekce · 2026-06-28
**Co nakonec zabralo:** Rozšíření existujícího `JadSheet` (8.7b = 1:1 legacy) o multipovolání — `jad_classes` JSON pole `[{c,l,s}]`, obory z `JAD_CLASSES` (prahová úroveň `sub`), úroveň postavy = auto součet, zázemí `<select>` (16) + „Vlastní…", přidávatelné `jad_profs`/`jad_langs`/`jad_feats` místo volných textarea; jméno/přesvědčení/hráč/pomůcky pryč z UI. Migrace legacy **read-only** (odvození pro zobrazení, zápis až 1. editem). Auto-caster jako **odvozený stav** (`spRaw==='' && hasCaster`), ne side-effect zápis v renderu.
**Proč to je správně (a ne další variace):** HTML prototyp = kontrakt odsouhlasený předem (rodina drd16/drd2/drdplus „prototyp=kontrakt"); reuse `cdAccess` delta-merge → legacy klíče se z DB nemažou (delta merge nesahá na nezapsané) → stará postava přežije bez data loss; žádný side-effect v renderu = čistý React.
**Jak ověřeno:** 29 testů zelené (8 nových: multipovolání add, obor lock L1/L3, auto úroveň, zázemí select, migrace `jad_class`/`jad_features`, add prof/lang/feat), build čistý, mobil/desktop screenshoty (produkční `jad.css`).
**Zhodnocení:** dobře, zabralo napoprvé; jediná ztráta času = honění fantom overflow (viz CH-035). Obory jen jako názvy (bez číselných účinků schopností) = vědomý záměr.

---

### ✅ ŘEŠENÍ — 8.7q fáze A: JaD bojový panel na taktické mapě · 2026-06-28
**Co nakonec zabralo:** `JadCombatPanel` (vzor `DndCombatPanel` — JaD = český DnD 5e, stejná k20 mechanika) + registrace `combatPanels.ts` (`jad`). Čte deník přes `token.characterSlug` prefix `jad_*`, reuse `jad/formulas` + `jad/constants`. Klik na vlastnost/ZH/dovednost/iniciativu/zbraň → `onRoll({kind:'d20', modifier})` → existující `performSheetRoll` → 3D overlay + dice log (+ `token.initiative`). Jen aktivní dovednosti (prof>0), HP ± edit, sbalitelné zdatnosti/jazyky/schopnosti.
**Proč to je správně:** JaD je 5e → DnD panel je 1:1 vzor, nulová nová roll infra (k20 už pipeline umí). Combat panel = samostatná komponenta nad `jad_*` daty, deník (`JadSheet`) netknut → 0 regrese. Typový kontrakt `onRoll = SystemSheetProps['onRoll']` (široký) místo lokálního užšího = bez kontravariance problému v registru.
**Jak ověřeno:** build čistý (tsc -b), 5 smoke testů (klik=k20+mod, ZH, iniciativa initiative:true, jen aktivní dovednosti, view=disabled) přes `vi.hoisted` mock `useCharacterDiary`/`useUpdateCharacterDiary`.
**Zhodnocení:** dobře, zabralo napoprvé. Zbývá fáze B (fatální úspěch/neúspěch nat20/nat1 — cross-cutting do dice payloadu/logu, JaD-only flag) a C (skládaný hod zásahu `2k10+2k6+2k4+č` — `rollMixedDice` UŽ existuje, chybí parser + onRoll mixed větev). Pozn: Explore agent tvrdil „engine neumí kombinaci kostek" = NEPRAVDA, `rollMixedDice` v rollEngine.ts existuje — ověřuj agentní závěry čtením.

---

### ✅ ŘEŠENÍ — 8.7q fáze B+C: fatální hody + skládaný zásah · 2026-06-28
**Co nakonec zabralo:** B (fatální úspěch/neúspěch): k20 `nat20→success`/`nat1→fail` detekce v `performSheetRoll` + `rollDiaryRequest` (flag `critOnD20`, JaD-only), `crit` přidán na `DicePayloadBase`, render textu „Fatální úspěch/neúspěch" v `DiceLogPanel` místo součtu, iniciativa tie-break ±100 v `TokenSystemSheet`. C (skládaný zásah): `rollMixedDice`/`buildMixedPayload` UŽ existovaly → jen parser `parseDamageFormula` (jad/formulas, sdílený panel+deník) + `mixed` větev v obou roll pipeline + `onRoll` kontrakt rozšířen (kind `'mixed'` + counts); JadCombatPanel zbraň = 2 tlačítka (útok k20 / zásah mixed), formule z deníkového sloupce „Zásah".
**Proč to je správně:** cross-cutting JaD-only přes opt-in flagy (`critOnD20`, `mixed`) → ostatní d20 systémy (DnD/CoC) i fate beze změny. Chat pipeline (`rollFromDiary`) zrcadlí mapovou (`rollFromSheet`) → combat panel v chatu = parita. `crit`/`mixed` na sdílených payload typech jsou optional → 0 regrese renderu.
**Jak ověřeno:** build čistý + 47 testů (parser 6, mixed klik, critOnD20 flag, fatální render text místo součtu + 0 regrese existujících). Past chycená buildem: chat `DiaryRollKind` union nemělo `'mixed'` (dual-source vůči `SystemSheetProps.onRoll`) → dorovnáno.
**Zhodnocení:** dobře. Past pro příště: `onRoll` kind je DUAL-SOURCE (`SystemSheetProps` + chat `DiaryRollKind`) → rozšíření kostky = OBĚ místa (build to chytil, ne tsc inkrement). Čeká živá kontrola uživatelem + FE commit celého JaD balíku.

---

### ✅ ŘEŠENÍ — 8.7q follow-up: mixed 3D notace + JaD HP bar · 2026-06-28
**Co zabralo (notace — čeká živé 3D potvrzení):** Skládaný hod (`mixed`) generoval do 3D enginu notaci `1d4@a+1d4@b+1d6@c+1d6@d` (opakované jednotlivé kostky přes `+`) → engine ukázal jen 1 kostku. Fix: grupovat tváře per typ → `2d4@a,b+2d6@c,d` (tvar jako pool `3d6@…`, ověřeně funkční). Unit test ověřuje notační STRING; **3D render nejde jednotkově (WebGL) → čeká živé potvrzení uživatelem**.
**HP bar:** `JadCombatPanel` dostal vizuální pruh životů (barva dle zdraví zelená/oranžová/červená) — uživatel chtěl vidět míru zranění (13/20 nic neukazovalo).
**Otevřené (B):** uživatel hlásí, že fatální úspěch se neukázal u INICIATIVY. V kódu rozdíl není (crit přežívá BE `diceRolls` pass-through, render společný v `DiceLogPanel`) → pravděpodobně nat20-na-kostce vs total, nebo dice-log panel vs iniciativní lišta. Čeká upřesnění/screenshot.
**Zhodnocení:** mixed notace = poučení (3D engine: grupuj stejné kostky `NdX@a,b`, neopakuj `1dX@a+1dX@b`). NEoznačuji za hotové, dokud uživatel 3D nepotvrdí (vyhýbám se předčasnému ✅ jako CH-012).

---

### ✅ ŘEŠENÍ — 8.7q fatální text i v overlay readoutu (ne jen dice log) · 2026-06-28
**Co zabralo:** Fatální úspěch/neúspěch (`crit`) jsem nejdřív dal jen do `DiceLogPanel` (panel „Hody"). Ale uživatel kouká hlavně na velký 3D **overlay readout** (`DiceRollOverlay.Readout`) — tam `crit` chyběl → u nat 1/20 pořád výpočet `… = +4`. Doplněn `crit` i tam: při crit nahradí celý výpočet (`label (mod) sum = total`) textem „Fatální úspěch/neúspěch" (kostky + label zůstanou).
**Poučení:** výsledek hodu se renderuje na DVOU místech — `DiceLogPanel` (perzistovaný log na mapě) i `DiceRollOverlay.Readout` (3D overlay vyčíslení, vidí ho hráč hned po hodu). Změna ZOBRAZENÍ hodu = OBĚ místa (jako dual-source `onRoll` kind).
**Jak ověřeno:** build + 11 testů (overlay readout crit success/fail + dice log). Reálný nat20/nat1 + 3D kostky čekají nasazení FE.

---

### CH-036 — mixed 3D „grupování" hypotéza nezabrala; měl jsem číst knihovnu místo hádat · 2026-06-28
**Kontext:** skládaný hod (mixed) ukázal v 3D jen 1 kostku; opravoval jsem notaci pro dice-box.
**Co jsem udělal špatně:** hypotézu „grupovat per typ" (`2d4@a,b+2d6@c,d`) jsem nasadil BEZ ověření, jak knihovna parsuje notaci → po nasazení ukázalo 2k4 (jen první skupina), pořád ne všechny 4.
**Proč to nefungovalo:** `@drdreo/dice-box-threejs` `parseNotation` dělá `split("@")[0]` → bere JEN první `NdM` před prvním `@`; `+` mezi skupinami s predetermined `@` hodnotami nepodporuje. Grupování i původní `1dX@a+1dX@b` narazí na totéž.
**Poučení:** u 3rd-party (dice notace) ČTI parser knihovny PŘED fixem (`node -e` extrakce z minifikovaného dist), nehádej formát z analogie. Rodina CH-027/CH-034 (nehádej, ověř realitu kódu/knihovny).
**Příznak cyklení:** druhá „oprava notace" za sebou, uživatel pořád „ne všechny kostky".

---

### ✅ ŘEŠENÍ — mixed hod bez 3D (knihovna neumí predetermined multi-type), readout ukáže odznaky · 2026-06-28
**Co nakonec zabralo:** `payloadToNotation` pro `mixed` vrací `null` → overlay 2D fallback ukáže VŠECHNY kostky jako odznaky v readoutu (správné hodnoty z payloadu `4 4 6 5`). 
**Proč to je správně (a ne další variace notace):** ověřeno ČTENÍM parseru knihovny (`parseNotation` konstruktor volá 1×, `split("@")[0]`) — žádná notace víc typů s `@` nefunguje. Alternativa „bez `@`" (`2d4+2d6`) hodí NÁHODNÉ hodnoty ≠ readout (3D by lhalo proti výsledku). Fallback readout je jediný tvar, kde uživatel vidí všechny kostky se SPRÁVNÝMI hodnotami.
**Jak ověřeno:** build + 8 testů (mixed→null). 
**Zhodnocení:** dobře (po CH-036). Trade-off: mixed (skládaný zásah) nemá 3D animaci kostek, jen readout odznaky — prokomunikováno. Jednotypé hody (k20 vlastnosti/dovednosti) 3D mají dál.

---

### ✅ ŘEŠENÍ — 8.7r krok 1: JaD bestie schéma registrováno (bestie + token) · 2026-06-28
**Co zabralo:** JaD per-system bestie + token schéma dle uživatelovy šablony (`jad/bestie.json` + `token.json`, typed wrappery, `index.ts`, bootstrap registrace, export do BE). Combat napojení: Výdrž=damageable HP, Rychlost=movement, Obratnost=initiative, OČ=roll-target. ZH/ZD = list (vlastnost/dovednost + bonus), útoky/kouzla/schopnosti zrcadlí PC strukturu, schopnosti mají typ (Akce/Reakce/Legendární). Token = `health.current/max` + snapshot bestie polí (kvůli BE strict editu).
**Proč to je správně:** vzor dnd5e/drd2 (JaD = český 5e); `export-schemas` auto-discovery najde `jad/` sám; BE soft-mode validace (i bez BE deploye bestie projde pass-through).
**Jak ověřeno:** build čistý + 35 schema testů (jad bestie/token combat behaviors + ZH/ZD/typy). 
**Past (pre-existující):** `drd2-bestie.test` byl rozbitý od 16.2e (testoval Matrix-legacy `main-stats` strukturu, realita = `stav`/`sudba`/version 2) — sladěn s aktuálem (5 failů → zelené). Nesouviselo s JaD, ale blokovalo zelenou suite.
**Zhodnocení:** dobře. Krok 1 = schéma + generic render/panel (4dF iniciativa = nedokonalé pro JaD). Zbývá krok 2: dedikovaný JaD statblok (čistý vizuál, frontend-design) + `JadBestiePanel` (k20 hody, klikací útoky/záchrany jako DrD2) + chat bestie. Čeká BE deploy (strict validace) + živé ověření.

---

### ✅ ŘEŠENÍ — 8.7r krok 2: JaD bestie panel (mapa + chat, k20 statblok) · 2026-06-28
**Co zabralo:** Dedikovaný JaD bestie panel — `JadBestieCombatActions` (sdílené jádro mapa↔chat: čistý statblok vlastnosti/útoky/záchrany/zdatnosti/schopnosti seskupené dle typu/kouzla, klikací **k20** + fatální + **mixed zásah**), `JadBestiePanel` (mapa: HP±, iniciativa k20+Obr → `token.initiative` s fatálním tie-break, edit přes generic `EntitySchemaForm`), `JadChatBestiePanel` (chat: HP ze `systemStats` vydrz/vydrz_cur, `useChatDiaryRoll`). Routing v `TokenSystemSheet` + `BestieRollPanel` + `BestieInstancePanel`.
**Proč to je správně:** vzor `Drd2BestiePanel`/`Drd2BestieCombatActions` (jádro sdílené mapa↔chat = 0 drift); reuse JadCombatPanel k20/crit/mixed patterns + `EntitySchemaForm` pro edit (méně kódu než DrD2 custom inline draft); pergamen CSS sdílen panel↔chat (chat importuje mapStyles).
**Jak ověřeno:** build čistý + 5 testů (klik vlastnost k20+crit, zásah mixed, ZH k20, schopnosti grupování dle typu, disabled).
**Zhodnocení:** dobře. Bestiář JaD funkčně kompletní (schéma krok 1 + statblok/panel krok 2). Zbývá: funkce+napoveda, BE deploy (strict validace), živé ověření vzhledu (případný frontend-design polish dle předlohy). Edit = generic schema form (ne custom inline) — pokud chce uživatel hezčí editaci, dořešit.

---

### CH-037 — replace_all u CSS selektoru spolkl mezeru descendant kombinátoru → rozbil base embed blok všech systémů · 2026-06-29
**Kontext:** 16.2g JaD skiny — přidával jsem `jad` do per-skin signature i base bloků v `DiceLogPanel.module.css` + `DiceRollOverlay.module.css` přes `:is([drd2],[jad])`.
**Co jsem udělal špatně:** u base bloku jsem dal `replace_all` old=`[data-diary-system='drd2']) ` (paren **+ koncová mezera**, = descendant kombinátor před `.panel`/`.readout`) → new=`[data-diary-system='drd2'], [data-diary-system='jad'])` **BEZ koncové mezery**. Výsledek: `) .panel` (potomek) → `).panel` (compound) → selektor cílí element, který je SOUČASNĚ `[data-diary-system]` i `.panel` (nikdy) → base embed blok (surface/text/title…) přestal platit pro VŠECHNY systémy (drd16/drdplus/drd2/jad).
**Proč to nefungovalo:** v CSS je mezera významový kombinátor; spolknout ji v náhradě = jiný selektor. A udělal jsem to **2× po sobě** (nejdřív DiceRollOverlay, pak hned stejně DiceLogPanel) — po první chybě jsem nezkontroloval, jestli ji neopakuju.
**Poučení:** při `replace_all` CSS selektorů musí `new_string` zachovat PŘESNĚ stejný okolní whitespace jako `old_string` (zvlášť mezeru u descendant kombinátoru `) .trida`). Po první takové chybě u jednoho souboru rovnou zkontroluj/oprav i ostatní soubory se stejným patternem, ne až po zopakování. Fix = `replace_all` `[jad']).` → `[jad']) .` (mezera jen před třídou, ne před `[data-diary-skin`). Ověřeno gripem (base `) .panel` × per-skin `)[data-diary-skin`) + build.
**Příznak cyklení:** stejná „spolknutá mezera/znak" chyba u 2.+ souboru za sebou; nebo embed plochy „prosvítají"/ztratí barvu napříč systémy po úpravě selektoru.

---

### ✅ ŘEŠENÍ — HP bar PC+bestie (JaD/DnD) hardcoded inline → skin token; audit propásl, protože byl statický · 2026-06-29
**Kontext:** Uživatel hlásil „HP bar se nepropisuje u PC" a „JaD deníky se vůbec nepropisují do TM/Chat". Předcházel statický audit skinů (5 systémů × 7 povrchů), který prohlásil embed pokrytí za OK (token coverage `--dd-embed-*` 13/13).
**Vlastní chyba (kořen dojmu):** audit kontroloval CSS tokeny a `:is()` enumerace, ale **HP bar fill barvu nastavoval inline JS** `style={{ background: hpColor }}` s hardcoded teploměrem `hpColor = pct>50?'#5a7d3a':pct>25?'#c08a2e':'#9d2932'` — to je pro CSS/token audit NEVIDITELNÉ (inline styl navíc přebíjí jakýkoli skin). Statická shoda ≠ vizuální propsání. Uživatel musel narazit sám.
**Co zabralo (oprava):** (1) zahodit `hpColor` z 6 míst (`JadCombatPanel`/`DndCombatPanel` PC + `Jad/DndBestiePanel` TM + `Jad/DndChatBestiePanel` chat; chat sdílí `mapStyles` → CSS jen 2× pokryje TM i chat), inline `style` ponechán jen `width`. (2) `.hpBarFill`/`.hpFill` → `background: var(--dd-hpfill-grad, <fantasy crimson fallback>)` — dědí se z `[data-diary-skin]` na TokenInfoPanel/aside rootu. (3) **token drift** sjednocen: fantasy měl HP fill pod MRTVÝM `--dd-hpbar-fill` (0 konzumentů), horror neměl nic → přejmenováno/doplněno na kanonický `--dd-hpfill-grad` (8/8 jad + 8/8 dnd). (4) navíc mrtvé selektory `#jad_hpCur`→`#dnd_hpCur` (dnd anime/nature, klon-leftover z `sed` dvojčete) + steampunk komentář.
**Proč to je správně:** návrh (`jad-skins/fantasy/index.html` sekce B+C i G) kreslí HP bar jako jednolitý **crimson gradient skinu**, NE teploměr — bestie i PC stejně. Drd16 to tak dělal už dřív (`--dd-hp-grad`). Tmavý fantasy embed panel je naopak dle návrhu správně (`.forged` = kožená vazba grimoáru) — nebyl to bug, jen HP bar.
**Jak ověřeno:** `npm run build` 2× zelená (TS i CSP), grep „žádný hardcoded `hpColor`/`#5a7d3a` nezbyl". Živé render ověření (přepnutí skinu v TM + chat) předáno uživateli.
**Zhodnocení:** dobře jako oprava, ale **chyba v metodě auditu** = rodina CH-032/CH-038 (cross-surface embed se nepropíše po „dokončení" systému), s NOVÝM kořenem: inline JS `style` hardcode je mimo dosah CSS/token grepu. **Poučení:** u tvrzení „propisuje se skin do X?" NESTAČÍ grep tokenů — buď render, nebo aspoň grep `style={{` / `background:` / hex literálů v TSX daného povrchu. „13/13 token coverage" neznamená „vizuálně sedí".
**Příznak cyklení:** uživatel opakuje „nevidím skin na X" po auditu, který tvrdí „OK"; hledat inline `style`/hex v TSX, ne další CSS tokeny.

---

### ✅ ŘEŠENÍ — dotažení skin-auditu: HP list (#2) + kouzla 8 skinů + DrD+ dice signature (#1) + MLP sticker (#4) · 2026-06-29
**Co zabralo:**
- **#2 HP list** (`#jad_hpCur`/`#dnd_hpCur` + pip Inspirace + rám Kouzel padaly na accent): JEDNA centrální definice `--jad-hp/spell/insp` v base `jad.css`/`dnd5e.css` přes **fallback řetěz** na sémantické `--dd-*` (`var(--dd-crimson, var(--dd-hp, var(--jad-accent)))` atd.) — per-skin scope je přepisuje (1 def místo 48). scifi nemá crimson/dd-hp → override `--jad-hp:var(--sf-life)` (jade) + `--jad-spell:var(--sf-mag)` na `.jad-diary` scope.
- **Kouzla 8 skinů:** rozšířený řetěz `var(--dd-sapphire, var(--dd-spell, var(--dd-mag, var(--accent))))` (nature/steampunk=`--dd-spell`, minimal=`--dd-mag`) + horror override `--h-violet-hi`.
- **#1 DrD+ dice signature:** `drdplus` přidán do 46 per-skin `:is([drd2],[jad],[dnd5e])[skin]` selektorů v `DiceLogPanel`+`DiceRollOverlay` (`replace_all` patternu `[dnd5e'])[data-diary-skin=` — compound `)[`, ŽÁDNÝ descendant kombinátor → bezpečné vůči CH-037).
- **#4 MLP (drd16 anime) dice:** tvrdý ink obrys (`border ink-deep` + `box-shadow 0 Npx 0` + `-webkit-text-stroke`) → měkký `--mlp-lavender` sticker okraj + rozostřený pillow stín (notes.md zakazuje ink obrys).
**Past (chycena PŘED přidáním):** slepé přidání drdplus do signaturních selektorů by dalo **drdplus fantasy bílou plochu** — fantasy signature čte `var(--dd-forge-2, #ffffff)` a drdplus fantasy `--dd-forge-2` NEMĚL (fallback=bílá). Před `replace_all` jsem vygripoval VŠECHNY tvarové tokeny (`--sf-*/--rt-*/--st-*/--na-*/--mn-*/--mlp-*/--dd-forge*`) čtené v signaturních blocích a porovnal s drdplus coverage → 3 chybějící fantasy tokeny doplněny z drdplus vlastní `--fa-*` palety (`--dd-forge-2:var(--fa-bind-2)` atd.); nature/anime fallbacky (mech/lavender) ponechány jako univerzální.
**Jak ověřeno:** `npm run build` 4× zelená; grep „0 rozbitých `).panel`" (CH-037 guard), „0 zbylých ink-deep v drd16 anime", „drdplus 22+24 signatur, base descendant `) .panel` nedotčen".
**Zhodnocení:** dobře. Klíč = **ověřit fallback hodnoty PŘED přidáním systému do cizích tokenových selektorů** — `var(--x)` bez kontroly fallbacku může tiše vykreslit bílou/rozbitou plochu. Spell u 4 skinů zůstával na accent jen kvůli token-drift v pojmenování (`--dd-spell` vs `--dd-mag` vs `--dd-sapphire`) — fallback řetěz to sjednotil bez přejmenovávání.
**Příznak cyklení:** „X má jen barvu, ne tvar" u systému, který sdílí dice moduly přes `:is()` — chybí v signaturních selektorech, NEBO mu chybí tvarové tokeny (pak padá na fallback hex jiného systému).

---

### CH-039 — fleet agentů (ornament parita) halucinoval neexistující CSS tokeny → `var()` bez fallbacku se tiše nevykreslí; build to NEodhalí · 2026-06-29
**Kontext:** Uživatel chtěl plnou ornament paritu embed povrchů (token panel / dice readout / dicelog / orchestr / chat) s HTML návrhy. Nasadil jsem 4 agenty (worktree, 1 povrchový soubor each) na replikaci per-skin ornamentů.
**Co se pokazilo:** `TokenInfoPanel` agent psal `background-image: var(--jadf-corner-tl), …` **bez fallbacku** a v komentáři tvrdil „tokeny `--*-corner-*` jsou na elementu dostupné" — ale `--corner-*` v repo **NEEXISTUJÍ** (jen v HTML návrhu). Výsledek: 19 rozbitých refs → rohové kování/nýty/pečeť se **tiše nevykreslí** (`var()` bez fallbacku na neexistující token = invalid value → property ignored). Navíc tvarové tokeny (`--sf-*`, `--h-*`) jsou v repo na scope `.jad-diary` (deníkový kořen), který **není předkem embedů** → z `.panel`/`.readout` nedosažitelné.
**Proč build neselhal:** `var(--x)` bez fallbacku je VALIDNÍ CSS syntax → `npm run build` projde, jen se ornament nevykreslí. **Build = nutná, ne dostatečná podmínka.**
**Jak odhaleno + opraveno:** render-verify (Chrome headless izolovaný harness s reálnými CSS pravidly + simulovaný `.panel`/`.readout` markup) → screenshot ukázal prázdné panely. Fix: `TokenInfoPanel` corner refs → **inline SVG** (verbatim z návrhu), ostatní 7 refs (`--st-rivet`/`--h-seal`/`--mlp-*`) → inline fallback. Po fixu render ukázal rohy/nýty/brackety/pečeť + fantasy readout rohy+fleur.
**Druhá past (harness, ne kód):** první readout harness dal `data-diary-*` PŘÍMO na `.readout`, ale selektor je `[ds][dsk] .readout` (DESCENDANT — atributy na PŘEDKOVI = reálný `DiarySkinScope`). Prázdný render → falešný závěr „nefunguje". Fix: obalit `.readout` scope divem. Pak ornament viditelný.
**Poučení:** (1) Izolovaný agent NEMÁ ověřený kontext o existenci/scope tokenů — MUSÍ použít fallback `var(--x, <konkrétní hodnota>)` nebo inline, nikdy `var(--x)` holé. (2) U grafiky build NESTAČÍ — render-verify (i izolovaný harness) je povinný. (3) Harness scope musí kopírovat reálnou DOM hierarchii (compound `.panel[attr]` vs descendant `[attr] .readout`).
**Příznak cyklení:** „implementoval jsem ornament" + build OK, ale uživatel ho nevidí → grep `var(--x)` bez fallbacku na tvarové/corner tokeny; render-verify, ne další build.

---

### ✅ ŘEŠENÍ — PC HP bar na mapě (JaD+dnd5e) se nezobrazoval: resolver měl fikční klíče + JaD chyběl; zelený test potvrzoval fikci · 2026-06-29
**Co zabralo:** `resolveCharacterHp` (token HP bar na taktické mapě, PC/NPC) — **JaD úplně chyběl** ve switchi (`default: return null` → nikdy HP bar) a **dnd5e četl `dnd_maxHP`/`dnd_currentHP`**, což jsou klíče, které v reálném kódu **nikdo neukládá** (deník přes `makeCdAccess(cd,'dnd_')` + combat panel `save({dnd_hpCur})` ukládají `dnd_hpCur`/`dnd_hpMax`). Fix: přidat `jad` case + opravit dnd5e klíče, oboje s **legacy fallbackem** bez prefixu (`var prefix → bez prefixu`) pro starší data. drd2 zůstává jediný v `HP_BAR_DISABLED_SYSTEMS` (dle uživatele správně).
**Vlastní chyba (kořen):** existující test `resolveCharacterHp.test.ts` testoval dnd5e s `dnd_currentHP`/`dnd_maxHP` — **fikční klíče, co neodpovídají realitě** → test byl ZELENÝ, ale funkce v praxi vracela null (deník ukládá jiné klíče). Klasické „test potvrzuje implementaci, ne realitu" → zelený CI nechytil, že PC nemají HP na mapě. Rodina CH-038/HP-bar (statika/test ≠ render).
**Jak ověřeno:** přepsal test na REÁLNÉ klíče (`dnd_hpCur`/`dnd_hpMax`, `jad_hpCur`/`jad_hpMax`) + legacy fallback + číselné hodnoty → `npx vitest run --pool=threads` **20/20 passed**. (Pozn.: default forks pool padá na worker-timeout v této infře → `--pool=threads`.)
**Zhodnocení:** dobře. Klíč = ověřit, co se REÁLNĚ ukládá (`grep` zápisů `save({...})` + `makeCdAccess` prefix), ne věřit klíčům v testu. Klíč v testu byl vymyšlený a maskoval bug.
**Příznak cyklení:** „test je zelený, ale uživatel hlásí, že to nefunguje" → ověř, že testovaná data = reálně ukládaná data (grep zápisů), ne hodnoty vymyšlené v testu.

### ✅ ŘEŠENÍ — Příběhy Impéria (pi) přepis na osekaný Matrix-derivát; fáze 0 zachytila alias-drift past · 2026-06-29
**Zadání:** „Příběhy impéria" jako Matrix, ale osekaný (bez jazyků/únavy/přetlaků/runy/magie; Ochrana jen 1 políčko; Schopnosti + Aspekty se stejnými pravidly bodů). Vypadalo to na NOVÝ systém.
**Klíčový catch (fáze 0 skillu `system`):** PŘED produkčním kódem jsem ověřil id napříč registry → „Příběhy impéria" **už existuje jako systém `pi`** (`RPG_SYSTEMS {id:'pi'}`, `piPreset`, `piPlugin`) a hlavně alias **`'pribehy-imperia' → 'pi'`** v `systemId.ts`. `resolveSystemId('pribehy-imperia')='pi'` → kdybych podle prvního dojmu založil nový systém `pribehy-imperia`, jeho preset by se NIKDY nepoužil (kanonické id `pi`) → mrtvý kód + duplikát. Stávající `pi` byl tenký wrapper nad `FateLikeSheet` (viktoriánské brass) — to „hrozné", co uživatel chtěl nahradit.
**Co zabralo:** přepsal jsem OBSAH `pi` (ne nová registrace): `PiSheet.tsx` wrapper → plný osekaný Matrix-derivát (reuse `makeCdAccess('pi_')`, prefix `pi_` zachován = 0 migrace registrů), `pi.css` brass→sci-fi cyan (vlastní `.pi-*` třídy + `--pi-*` tokeny scoped `[data-diary-system='pi']`, NE slepě `--mx-*`), `constants.ts` slovní stupně (Nováček→Legenda), default skin `steampunk→scifi`, přepsaný test.
**Pasti chycené v HTML prototypu (artefakty, v produkci nevznikly):** (1) inline `style="display:grid"` na edit prvku přebil `[data-mode=view] .only-edit{display:none}` (inline spec 1,0,0,0 > 0,0,3,0) → edit inputy prosákly do view. (2) `clip-path` na řádku ořezával tooltip stupně. → V produkci `.pi-skill` clip-path NEMÁ (jako `.mx-skill`); React ve view edit inputy nerenderuje.
**Jak ověřeno:** `PiSheet.spec` 9/9 · parity diary+map 45/45 · `eslint --fix` 0 · `npm run build` (tsc -b + vite) 0. Živý render v reálných datech dělá uživatel na serveru.
**Zhodnocení:** dobře. Fáze 0 (ověř id PŘED kódem) zafungovala — bez ní mrtvý duplikát + alias drift (rodina CH-020/system-id-drift z opačné strany). Prototyp = kontrakt, vizuál odladěn ve standalone HTML před produkcí (0 cyklení).
**Příznak cyklení (pro příště):** „nový systém X" — VŽDY nejdřív `grep` id + aliasů (`systemId.ts`/`RPG_SYSTEMS`); existující alias = přepisuješ obsah, ne zakládáš nový.
