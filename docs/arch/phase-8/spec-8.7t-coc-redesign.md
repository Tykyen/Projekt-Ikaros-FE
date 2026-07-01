# Spec 8.7t — Call of Cthulhu 7e: redesign deníku (horror dossier + investigation vrstva)

**Status:** 🚧 schválen vizuál (HTML prototyp `c:\tmp\coc-denik-audit.html`, 2026-07-01) — čeká produkční impl.
**Vzor procesu:** JaD 8.7p / dnd5e 8.7s (redesign deníku). **Rozdíl:** CoC deník už funkčně existuje (8.7c, 1:1 přenos z legacy Matrix/Matrix) → tohle je **redesign vzhledu + rozšíření obsahu**, ne stavba od nuly.

## 1. Cíl a princip

Přepsat legacy CocSheet (plochý formulář, hardcoded barvy, mimo skin-kontrakt) na **profesionální horror-dossier list** a doplnit **investigation vrstvu**, která dělá CoC → CoC (backstory souhrn, tajuplné knihy).
- **Zachovat 1:1** existující datový kontrakt `coc_*` a mechaniky (žádná migrace) → staré postavy se načtou beze změny.
- **Přidat** nová textová pole (aditivní do `customData`).
- **Odebrat** házení z deníku (uživatel: *„nepotřebuji házet"*) — deník = klidný list, hody patří do mapy/chatu.
- **Jeden vzhled** (horror default). 8 skinů řeší až následný skill `skin`.

## 2. Estetika (schváleno)

„Důvěrný spis · Miskatonická univerzita · 20. léta" — art deco rám + pergamenový dossier + kosmický dread.
- Fonty: **Cinzel Decorative** (jméno/nadpisy) + **EB Garamond** (tělo/čísla).
- Paleta (`--coc-*` tokeny, self-contained, scoped `[data-diary-system='coc']`): inkoust `#12171a` · pergamen `#dcc9a4` · mosaz `#b8934e` (accent) · krev `#9c2b2b` (Životy) · indigo `#7d6bb0` (Příčetnost) · měděnka `#3f7d6f` (Mýtus/tajemné).
- Signature: oko/hvězdice glyfy v oddělovačích sekcí, Mýtus Cthulhu měděnkově, razítko „DŮVĚRNÉ", voskové pečeti pro stavy.
- ⚠️ **Sémantické tokeny** `--coc-hp / --coc-mp / --coc-sanity / --coc-luck` v base css (aby vitals nepadaly na accent).

## 3. Sekce listu (pořadí dle schváleného prototypu)

1. **Hero:** portrét (z character portrait) · jméno · povolání · věk/zájmeno/bydliště/místo narození · razítko.
2. **Vlastnosti:** 8 vlastností × 3 stupně (Zákl./Pol./Pět.) + odvozené Nápad (INT×5) / Znalosti (VZD×5). **Bez roll tlačítek.**
3. **Stav:** Životy (krev) · Body magie · Štěstí · Příčetnost (indigo) — aktuální/max + progress bar. Řádek 6 status pečetí (dočasné/neurčité šílenství, těžké zranění, bezvědomí, umírá, max. příčetnost).
4. **Dovednosti:** 44 výchozích (česky) + vlastní; checkbox „zkušenost", Zákl./Pol./Pět. Mýtus Cthulhu vizuálně odlišen. **Bez roll tlačítek.**
5. **Boj:** tabulka zbraní (default Rvačka + přidávatelné) + odvozené Pohyb / Stavba / Bonus zranění / Úhyb(×3).
6. **Souhrn postavy** (NOVÉ): 10 poznámkových polí — viz §4.
7. **Vybavení & majetek** (NOVÉ): vybavení + hotovost/majetek/výdaje.

## 4. Datový kontrakt

**Beze změny** (existující, prefix `coc_`): header (`name`, `occupation`, `birthplace`, `residence`, `pronoun`, `age`) · vlastnosti `<char>_reg/half/fifth` (str/con/dex/int/siz/pow/app/edu) · `idea`, `know` · vitals `hp_cur/max`, `mp_cur/max`, `luck_cur/luck_start`, `san_cur/san_start` · status flagy (`temp_insanity`, …) · dovednosti `sk_<key>_reg/half/fifth/chk` · `custom_skills[]`, `weapons[]`, `wpn0_*` · `move`, `build`, `dodge_reg/half/fifth`, `damage_bonus`.

**Nová pole** (aditivní, prostý text, prefix `coc_`):
| Sekce | Klíč | Popis |
|---|---|---|
| Souhrn | `appearance` | Vzezření |
| Souhrn | `traits` | Rysy |
| Souhrn | `ideology` | Ideologie / názory |
| Souhrn | `important_people` | Důležité osoby |
| Souhrn | `phobias_manias` | Fóbie & mánie |
| Souhrn | `injuries_scars` | Zranění & jizvy |
| Souhrn | `forbidden_lore` | Tajuplné knihy, kouzla & artefakty |
| Souhrn | `significant_places` | Významná místa |
| Souhrn | `treasured_possessions` | Opatrované věci |
| Souhrn | `encounters` | Setkání s podivnými bytostmi |
| Vybavení | `gear` | Vybavení & osobní věci |
| Vybavení | `cash` | Hotovost |
| Vybavení | `assets` | Majetek |
| Vybavení | `expenses` | Výše výdajů |

*(Majetnost zůstává dovednost `sk_credit_rating`, needuplikovat v Hotovost & majetek.)*

## 5. Soubory (dotčené)

- `sheets/coc/CocSheet.tsx` — přepsat layout (hero + sekce + Souhrn + Vybavení), odebrat `SheetInitiativeButton`, view/edit/print.
- `sheets/coc/constants.ts` — přidat definici Souhrn/Vybavení polí (labely + klíče + ikony). Staty/dovednosti/flagy beze změny.
- `styles/coc.css` — nový horror-dossier styl, `--coc-*` tokeny (vč. sémantických hp/mp/sanity/luck), scoped, responsive (mobil ≤ 768).
- `sheets/coc/__tests__/CocSheet.spec.tsx` — rozšířit o nové sekce (render + edit/view).
- `presets/coc.ts` — description beze změny (nebo drobně).

## 6. Akceptační kritéria (DoD)

1. List = horror-dossier dle prototypu; hero, vlastnosti, stav+pečeti, dovednosti, boj, Souhrn, Vybavení.
2. Staré `coc_*` postavy se načtou 1:1; nová pola prázdná, needitovaná = žádný zápis.
3. **Žádné roll tlačítko** v deníku.
4. 3 režimy: edit / view (inputy zamčené) / print (statický čitelný dokument vč. nových sekcí).
5. Vitals mají sémantické tokeny (ne accent fallback).
6. Build čistý · `tsc -b` · CocSheet testy zelené · ESLint čistý · render-ověření desktop+mobil.
7. Uzávěr: `funkce` + `napoveda` + `chybovy-denik` (netriviální redesign).

**Odloženo (mimo 8.7t):** 8 skinů (skill `skin`), Příčetnost SAN-log/tracker, occupation builder, TM combat panel + bestie (už existují — samostatná revize).
