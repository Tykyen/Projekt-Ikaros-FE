# Spec 16.2d-mapa — DrD+ (drdplus) v taktické mapě (combat panel, 2k6+ hody, postih, okna k nahlédnutí)

**Status:** ✅ **HOTOVO 2026-06-27** — prototyp `c:/tmp/drdplus-mapa-mockup.html` schválen → spec schválen („dej se do práce") → kód. Ověřeno: `npm run build` (tsc -b ✓ + vite ✓ + CSP ✓), vitest (DrdPlusCombatPanel **11/11**, DrdPlusSheet 10/10, HelpPage 25/25), eslint 0 na nových/změněných souborech, `mobil-desktop` (CSS analýza — fluidní, žádné fixní šířky), `funkce` (kap. 14) + `napoveda` (WorldSection) aktualizovány. Mechaniky dodány uživatelem (NErekonstruovat z paměti, CH-023).
**Rozsah:** **FE only.** Nový `DrdPlusCombatPanel` + registrace v `COMBAT_PANELS` + okna „k nahlédnutí" (Modal) + drobné změny plného deníku (postih pole, rename Obory, iniciativa 2k6+). Engine `2d6+` už existuje (spec-16.2-2d6plus, HOTOVO). **Bez BE** — vše přes volný `customData` s prefixem `drdp_`; payload generický.
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-27
**Souvisí:** [spec-16.2b-mapa-drd16.md](spec-16.2b-mapa-drd16.md) (přímý precedent — drd16 panel) · [spec-16.2-2d6plus.md](spec-16.2-2d6plus.md) (engine `2d6+`, „pak v TM") · `tactical-map/.../combatPanels.ts` · vzor `Drd16CombatPanel` · `rollFromSheet.ts` · deník `sheets/drdplus/*`.

> **Číslování:** „16.2d" = drdplus deník (viz `sheets/drdplus`). Tohle je jeho **mapová** část (paralela k 16.2b-mapa pro drd16).

---

## 1. Cíl
Dostat drdplus deník do taktické mapy jako **kompaktní bojový panel** (ořez na bojové minimum, vzor `Drd16CombatPanel`). Klikatelné řádky hází `2k6+` (otevřený hod DrD+), dlouhý read-only obsah profese se otevře **uprostřed obrazovky** (Modal, jako kouzla v 16.2b). Panel = single source s plným deníkem (čte/zapisuje tentýž `diary.customData`, prefix `drdp_`, přes `token.characterSlug`).

## 2. Audit / co reuse
- `COMBAT_PANELS[system]` registry (`combatPanels.ts`) — **`drdplus` chybí**, přidat.
- Vzor `Drd16CombatPanel`: `useCharacterDiary` + debounced (~500 ms) `useUpdateCharacterDiary({customDataPatch})`; `onRoll({label,modifier,kind})`; `canEdit` gate; iniciativa quick-roll; okna přes `Modal`.
- **Engine hotový:** `rollExploding2d6` + `'2d6+'` v `rollEngine`; `performSheetRoll` už `'2d6+'` i `'d6'` dispatchne ([rollFromSheet.ts:62](../../../src/features/world/tactical-map/utils/rollFromSheet.ts)). Hod → `useMapDiceRoll` (3D overlay + dice log).
- **Deníkové view-komponenty** (`DrdPlusShared` `JsonTable`/`Scale`, `DrdPlusCards` `SpellList`/`FormuleList`/`DemonList`) umí `disabled` (read-only) → reuse do oken (viz H4).
- Klíče deníku přes `makeCdAccess(cd, 'drdp_', onChange)` (`_shared/cdAccess`).

## 3. Klíčová rozhodnutí

| # | Rozhodnutí | Důvod |
|---|-----------|-------|
| R1 | **Combat panel = bojové minimum**, vzor `Drd16CombatPanel` (deník přímo přes `characterSlug`, debounced write `customDataPatch`, `canEdit`); tělo **self-contained pergamen `--dd-*`** (jako drd16 panel — `--mx-*`/`--dp-*` scoped tokeny v kontextu panelu nemusí být k dispozici) | konzistence panelů; single source s listem |
| R2 | **Per-profese akcent** přes lokální `--acc` token (`data-prof` dle nastaveného povolání — akcent panelu, ne přepínač) | jako plný deník; nezasahuje sdílené theme tokeny |
| R3 | **Hody (vše `2k6+` až na ZZ):** Hlavní vlastnost = `2d6+` + síla (`stat_*`) · Odvozená = `2d6+` + schopnost (`odv_*`) **mimo Velikost a Hmotnost** (ty se nehází) · Zbraň BČ/ÚČ/OČ = `2d6+` + `bc`/`uc`/`oc` · **Zbraň ZZ = `d6` + `zz`** (1k6, NE eskalující) · Dovednost = `2d6+` + `bonus` · Iniciativa = `2d6+` bez bonusu · Kněz: Síla aspektu = `2d6+` + `pri_silaas`, Neovlivnitelnost = `2d6+` + `pri_neovliv` | dodáno uživatelem |
| R4 | **Postih (NOVÉ):** dvě ruční číselná pole — postih za zranění (`zraneni_postih`) + postih za únavu (`unava_postih`). **Automaticky se odečítají od KAŽDÉHO hodu** z panelu (přičtou se do `modifier`). Editovatelná na mapě **i** v plném deníku | dodáno uživatelem (auto-odečet potvrzen) |
| R5 | **Velikost a Hmotnost** se v panelu **nerenderují jako hod** (v plném deníku zůstávají). **Mez zranění/únavy** se na mapě needituje (načte se z deníku); panel jen ukazuje řádky (Bez postihu/Postih/Bezvědomí) a klikem mění zaplnění (`*_val`) | dodáno uživatelem |
| R6 | **Profese — sekce dle povolání z deníku** (`drdp_profession`). **Žádný picker na mapě** — povolání se nastavuje jen v deníku, na mapě je read-only; erb v hlavičce = jen identita. Tři druhy obsahu: **hod** (klik), **úprava** (editovatelné pole), **okno k nahlédnutí** (Modal, read-only). Viz §5 | dodáno uživatelem |
| R7 | **Okna „k nahlédnutí" = Modal uprostřed** (jako kouzla 16.2b). Tlačítko okna se zobrazí **jen když data existují** (theurg: „pokud nějakou má"). Lze otevřít víc oken po sobě | dodáno uživatelem; dlouhý obsah se do boku nevejde |
| R8 | **Rename: „Projevy čaroděje" → „Obory"** v plném deníku (`WizardSection`) **i** v panelu/okně. Data klíče `wiz_proj_*` beze změny (žádná migrace) | dodáno uživatelem |
| R9 | **Iniciativa = `2d6+`** (mapa i deník). V `DrdPlusSheet` se `SheetInitiativeButton kind="d20"` mění na `"2d6+"` | dodáno uživatelem |
| R10 | **Bez BE** — data přes `customData` (prefix `drdp_`), `2d6+`/`d6` jsou FE engine. Žádná migrace | jako 16.2a/16.2b |

## 4. Combat panel — univerzální obsah (nad profesí)
1. **Iniciativa** quick-roll (`2d6+`, bez bonusu, + postih).
2. **Kombinace zbraní** (`zbrane[]`) — **nad** životy. Každý řádek: název + 4 chipy: `BČ` `ÚČ` `OČ` = `2d6+`+veličina, `ZZ` = `d6`+veličina (vizuálně odlišený). Klik = hod.
3. **Životy a únava** — `WoundGrid` data (`zraneni_*`, `unava_*`): řádky Bez postihu / Postih / Bezvědomí, klik mění `*_val`. **Pod každou lištou pole Postih** (`zraneni_postih`, `unava_postih`, editovatelné).
4. **Hlavní vlastnosti** (6, `stat_*`) — řádek = klik → `2d6+` + hodnota + postih.
5. **Odvozené vlastnosti** (`odv_*`, **bez Velikosti a Hmotnosti**) — řádek = klik → `2d6+` + hodnota + postih.
6. **Dovednosti** (`dovednosti[]`) — řádek = klik → `2d6+` + `bonus` + postih.
7. **Profese** (dle `drdp_profession` z deníku — read-only, bez pickeru; §5).

## 5. Profese — obsah panelu

| Profese | Hod (`2d6+` + postih) | Úprava (na mapě) | Okno k nahlédnutí (Modal, read-only) |
|---|---|---|---|
| **Bojovník** | — | — | 📖 Bojové finty (`w_finty`) |
| **Čaroděj** | — | **Aktuální magenergie** (`wiz_aktualni`) | 📖 Kouzla (`wiz_kouzla`) · 📖 **Obory** (`wiz_proj_*`) |
| **Hraničář** | — | — | 📖 Zaměření (`ran_zam`) · 📖 Totem (`ran_totem`/`ran_totem_mech`) |
| **Kněz** | Síla aspektu (`pri_silaas`) · Neovlivnitelnost (`pri_neovliv`) | **Vliv u osob — velikost** (`pri_vlivosoby[].body` editovatelná) | 📖 Zázračné schopnosti (`pri_zazraky`) |
| **Theurg** | — | **Náklonnosti** (`nakl_denni/mesicni/rocni/zivotni` jako **čísla**, i záporná) | 📖 Theurgické schopnosti (`the_schopnosti`) · 📖 Formule (`formule`) · 📖 Démoni (`demoni`) · 📖 Vazby (`the_vazby`) — vše jen „pokud nějakou má" |
| **Zloděj** | — | — | 📖 Schopnosti (`thi_schopnosti`) · 📖 Finty (`thi_finty`) |

> Náklonnost theurga se v panelu zobrazí jako **číslo** (ne pip-stupnice `SignedScale` — ta se do úzkého boku nevešla, přetékala). V plném deníku zůstává `SignedScale`.

## 6. Data klíče (`customData`, prefix `drdp_`)
| Oblast | Klíč | Stav |
|---|---|---|
| Hlavní vlastnosti | `stat_Síla` … `stat_Charisma` | reuse (hod) |
| Odvozené | `odv_Odolnost` … (bez Velikost/Hmotnost při hodu) | reuse (hod) |
| Zbraně | `zbrane[]` (`zbran`,`bc`,`uc`,`zz`,`oc`) | reuse (hod) |
| Životy / únava | `zraneni_mez/val/smrt` · `unava_mez/val/smrt` | reuse (val klik) |
| **Postih** | **`zraneni_postih` · `unava_postih`** | **NOVÉ** (číslo, deník i mapa, auto-odečet) |
| Dovednosti | `dovednosti[]` (`dovednost`,`vlastnost`,`bonus`,`note`) | reuse (hod `bonus`) |
| Profese výběr | `profession` | reuse |
| Čaroděj | `wiz_aktualni` (edit) · `wiz_kouzla[]` · `wiz_proj_*` | reuse |
| Kněz | `pri_silaas`/`pri_neovliv` (hod) · `pri_vlivosoby[]` (`body` edit) · `pri_zazraky[]` | reuse |
| Theurg | `nakl_*` (edit číslo) · `the_schopnosti[]` · `formule[]` · `demoni[]` · `the_vazby[]` | reuse |
| Bojovník/Hraničář/Zloděj | `w_finty[]` · `ran_zam[]`/`ran_totem*` · `thi_schopnosti[]`/`thi_finty[]` | reuse (okna) |

## 7. Technické háčky (k dořešení v plánu)
| # | Háček | Pozn. |
|---|---|---|
| H1 | **`onRoll` kind union rozšířit o `'2d6+'`** v `SystemSheetProps['onRoll']` ([types.ts:67](../../../src/features/world/pages/CharacterDetailPage/diary-systems/types.ts)) | `CombatPanelProps.onRoll` ho reusuje; `RollKind` + `performSheetRoll` už `'2d6+'` mají |
| H2 | **Single source přes `drdp_` prefix** — panel čte/píše `makeCdAccess(cd,'drdp_',onChange)`, onChange → debounced `useUpdateCharacterDiary({customDataPatch})` | jinak by panel a deník psaly jiné klíče |
| H3 | **Auto-postih** = `mod += numOr('zraneni_postih') + numOr('unava_postih')` v každém `doRoll` | platí pro všechny hody vč. iniciativy; volitelně doplnit do labelu „· postih X" pro rozpis v dice logu |
| H4 | **Okna k nahlédnutí — reuse vs. self-contained.** Preferuj **reuse deníkových komponent v `disabled` módu** (zvlášť `FormuleList`/`DemonList` — re-implementace = drift), uvnitř `.dp-sheet` wrapperu. Nutné mít drdplus scoped CSS dostupnou v portálu Modalu (statický import `styles/drdplus.css` v panelu, scoped → neuniká). **Fallback:** self-contained read-karty (jako mockup) | rozhodnout v plánu po ověření, jak vypadá disabled render |
| H5 | **`SheetInitiativeButton` v `DrdPlusSheet` `kind="d20"` → `"2d6+"`** | závisí na H1 |
| H6 | **Nové klíče `*_postih`** — přidat `number` input do `WoundGrid` (`DrdPlusShared`) → objeví se u obou lišt v deníku; panel renderuje vlastní input se stejnými klíči. Persistence delta-merge přes `cda.set` | test A→B→A |

## 8. Co NEDĚLÁME
- Žádné auto-zranění / auto-souboj (útok×obrana ruční). · Žádné auto-seslání magy (jen úprava aktuální magenergie). · **drdplus bestie + chat napojení** = samostatné body (jako 16.2b). · **Skiny panelu** = follow-up (MVP self-contained default pergamen jako drd16). · BE beze změny.

## 9. Rozsah souborů (odhad)
- **NEW** `tactical-map/.../system-panels/DrdPlusCombatPanel.tsx` + `.module.css`.
- `tactical-map/.../combatPanels.ts` — registrace `drdplus`.
- `diary-systems/types.ts` — `onRoll` kind union `+'2d6+'`.
- `sheets/drdplus/DrdPlusShared.tsx` (`WoundGrid`) — `+ postih` input (klíč `${prefix}_postih`).
- `sheets/drdplus/DrdPlusProfessions.tsx` (`WizardSection`) — „Projevy čaroděje" → „Obory".
- `sheets/drdplus/DrdPlusSheet.tsx` — `SheetInitiativeButton kind` `d20→2d6+`.
- Testy: panel (mock `useCharacterDiary`/`onRoll` — ověř kind+modifier vč. postihu; ZZ=`d6`, ostatní=`2d6+`; Velikost/Hmotnost se nehází), `WoundGrid` postih persistence.
- Po implementaci: `funkce` + `napoveda` + `mobil-desktop`.

## 10. Definition of done
1. `drdplus` má combat panel na mapě (registrováno v `COMBAT_PANELS`); klik na vlastnost / odvozenou / dovednost / zbraň (BČ/ÚČ/OČ) / Kněz aspekt / iniciativu hodí **`2d6+`** + správný modifikátor; **ZZ hází `d6`**; Velikost/Hmotnost se nehází.
2. **Postih** = 2 editovatelná pole (mapa i deník, sdílené klíče `*_postih`), **odečítají se od všech hodů** (ověřitelné v dice logu / overlay).
3. **Obory** přejmenováno v deníku i panelu (data `wiz_proj_*` beze změny).
4. Okna „k nahlédnutí" se otevřou uprostřed (Modal) dle profese; tlačítko jen když data existují.
5. Úpravy na mapě (Aktuální magenergie, náklonnosti, Vliv-velikost) jsou single source s deníkem.
6. Iniciativa = `2d6+` (panel i `DrdPlusSheet`).
7. `npm run build` (tsc -b) ✓, vitest ✓, eslint 0, `mobil-desktop` ✓.

## 11. Otevřené otázky
- Žádné blokující — háčky H1–H6 se dořeší v impl. plánu.
