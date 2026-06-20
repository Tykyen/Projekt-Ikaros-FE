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
