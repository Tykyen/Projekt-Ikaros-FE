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
