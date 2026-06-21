# Chybový deník — oblast `fe` (frontend)

Detailní záznamy pro frontend (komponenty, hooky, timing, render). Index v [`README.md`](README.md).

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
