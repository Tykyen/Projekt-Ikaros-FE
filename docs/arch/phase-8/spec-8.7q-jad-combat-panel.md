# Spec 8.7q — JaD bojový panel na taktické mapě (+ fatální hody, skládaný zásah)

**Status:** ✅ **A+B+C hotové** (2026-06-28, build + 47 testů); čeká živá kontrola uživatelem + FE commit
**Předchůdce:** 8.7p (JaD deník redesign) · vzor combat panelů 10.2c-edit-9h + 16.2x
**Rozsah:** systém `jad`. Nový `JadCombatPanel` + registrace; rozšíření roll pipeline o fatální úspěch/neúspěch a skládaný hod (oboje opt-in, JaD-only kde to jde).

## 1. Cíl

JaD (= český DnD 5e) dnes na mapě/chatu nemá bojový panel → padá na plný deník a nehází. Postavit kompaktní `JadCombatPanel` (vzor `DndCombatPanel`) s klikacími hody, plus dvě JaD-specifické mechaniky: **fatální úspěch/neúspěch** na k20 a **skládaný hod zranění** (`2k10+2k6+2k4+číslo`).

## 2. Fáze A — bojový panel (klikací k20 hody)

**Komponenta** `tactical-map/.../system-panels/JadCombatPanel.tsx` (+ `.module.css`), registr `combatPanels.ts` → `jad: JadCombatPanel`. Čte deník `token.characterSlug`, prefix `jad_*`, formule z `jad/formulas.ts`.

**Sekce:**
1. **Staty** — HP (jad_hpCur/jad_hpMax, editovatelné ± a input), **OČ** (jad_ac, statické číslo, NEhází), **Iniciativa** (k20 + DEX mod, `initiative:true`), **Rychlost** (jad_speed, viditelná), SO kouzel (jen je-li sesilatel). Hlavička = povolání/úroveň z `jad_classes` (read-only).
2. **Vlastnosti** — 6× karta, **klik = k20 + mod**; u každé zkratka **ZH** (klik = k20 + saveMod). Oba bonusy jsou hotové (`calcMod`/`calcSaveMod`).
3. **Dovednosti** — jen **aktivní** (prof > 0); klik = k20 + skillMod (hotový bonus včetně vlastnosti).
4. **Útoky/zbraně** — z `jad_weapons`; klik na bonus = k20 + bonus k zásahu; zásah (zranění) zobrazen (klikací až fáze C).
5. **Sbalitelné** — Zdatnosti (`jad_profs`), Jazyky (`jad_langs`), Schopnosti (`jad_feats`) — read-only, default sbalené.

Hod jde přes `onRoll({label, modifier, kind:'d20', initiative?})` → `performSheetRoll` → 3D overlay + dice log + (iniciativa) `token.initiative`.

**DoD A:** panel se zobrazí pro `world.system='jad'` na mapě i v chatu; klik hází k20+mod do logu; iniciativa se propíše do lišty; HP editovatelné; view mode bez hodů; build + testy zelené; mobil/desktop.

## 3. Fáze B — fatální úspěch / neúspěch (k20)

Na k20 (kind `d20`): padne-li **20** → ve výpisu hodu „**Fatální úspěch**" místo/vedle součtu; **1** → „**Fatální neúspěch**". Implementace: `buildGenericPayload` dostane flag `d20Crit` (nat20/nat1 z `rolls[0]` při jediné d20), dice-log render zobrazí text. **JaD-only** přes nový volitelný příznak v roll requestu (`critOnD20: true`), ať ostatní d20 systémy (DnD/CoC) zůstanou beze změny.

**Iniciativa:** fatální úspěch = zařadit absolutně první, fatální neúspěch = poslední (úprava zapisované `initiative` hodnoty: nat20 → velké číslo, nat1 → velmi nízké).

**DoD B:** nat20/nat1 na JaD hodu ukáže fatální text; ostatní systémy beze změny; regresní test.

## 4. Fáze C — skládaný hod zranění (`2k10+2k6+2k4+číslo`)

`rollMixedDice` v enginu už umí balík různých kostek. Přidat:
- **Parser** formule `"2k10+2k6+2k4+5"` → `{ counts: {d10:2,d6:2,d4:2}, modifier:5 }` (akceptuje `k` i `d`, mezery).
- **onRoll/performSheetRoll** rozšířit o skládaný hod (nový `kind:'mixed'` + nese `counts`), payload přes mixed builder (rozpis `[…](d10) [—](d6) … = total`).
- **UI**: zbraň/útok má pole „Zásah" jako tuto formuli; klik na zásah hodí balík. Nastavitelné **i v deníku** (`JadSheet` zbraně) **i v panelu**.

**DoD C:** klik na zásah `2k10+2k6+2k4+5` hodí všechny kostky + číslo, rozpis v logu; nastavitelné v deníku i panelu; parser ošetří nevalidní vstup.

## 5. Akceptační kritéria (souhrn)

Každá fáze samostatně: build čistý · testy zelené · žádná regrese ostatních systémů (B/C jsou opt-in) · mobil/desktop · funkce+nápověda po dokončení.
