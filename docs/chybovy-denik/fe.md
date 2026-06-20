# Chybový deník — oblast `fe` (frontend)

Detailní záznamy pro frontend (komponenty, hooky, timing, render). Index v [`README.md`](README.md).

---

### ✅ ŘEŠENÍ — první 3D animace hodu kostkou na taktické mapě (fix8) · 2026-06-20

**Kontext:** Dlouho bojovaný bug (předchozí pokusy fix4/fix5/fix7 + ~13 commitů „kostky"). Na taktické mapě se u **prvního** hodu po otevření mapy nezobrazila 3D animace kostky — číslo v logu HODY naskočilo, ale kostka se nerozkutálela. 2. a další hod už animovaly.

**Co nakonec zabralo:** Odpojení warmup ghost-hodu od podmínky „neběží reálný hod" + fronta.
- `DiceBox3D.tsx`: ghost se na `ready` spustí **VŽDY jako první** (dřív jen `warmup && !active && !ghostDone`). Reálný hod, který dorazí dřív, než ghost doběhne, se zařadí do fronty (`pendingNonceRef`) a vystřelí se z `onRollComplete` ghostu (`flushPendingRoll`). Flaky úplně první `box.roll()` knihovny `dice-box-threejs` je tak **vždy** neviditelný ghost; první reálný hod běží na zahřátém enginu. Flush je i v chybové větvi ghostu (jinak by reálný hod uvázl ve frontě).
- `DiceRollOverlay.tsx`: animační strop se počítá od `onRollStart` (start reálného hodu), ne od kliknutí — pomalý init/ghost jinak ukrojil z animačního okna a kostka „zmizela" pod brzkým readoutem. Pojistka `COLD_START_CAP_MS`, dokud reálný hod nezačne.

**Proč to je správně (a ne další variace):** Předchozí pokusy předpokládaly, že ghost vždy proběhne PŘED prvním reálným hodem. Init je ale pomalý (lazy chunk import + fyzikální WASM + textury) a hráč typicky hodí dřív → `active` už `true` v momentě, kdy `ready` naskočí → ghost se **přeskočil** → první reálný hod byl ta studená flaky `roll()` → animace ztracena. Tento fix pokrývá i race „hráč hodí dřív než init dojede" tím, že ghost-hod nikdy nepřeskočí a reálný hod počká za ním.

**Jak ověřeno:** `npm run build` ✓ (0 TS chyb), dice/map vitest 8/8 ✓. Reálné 3D chování (WebGL + timing knihovny) NELZE ověřit z CLI → čeká potvrzení hráče na živé mapě: otevřít mapu → hodit **hned** → animace má naběhnout napoprvé.

**Zhodnocení:** Statika zelená; zbývá potvrzení reálným hodem. Pokud by symptom přetrval i po fix8, druhá (méně pravděpodobná) hypotéza je, že ghost při `opacity:0` GPU reálně nerenderuje (nezahřeje vůbec) → další krok = ghost zviditelnit za coverem. Ale dominantní příčina byl timing race, který fronta ruší.

---
