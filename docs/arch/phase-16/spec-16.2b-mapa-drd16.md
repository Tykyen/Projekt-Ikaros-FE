# Spec 16.2b-mapa — DrD 1.6 v taktické mapě (combat panel + d6+ engine + strukturovaný spellbook)

**Status:** 🟡 NÁVRH — čeká schválení. Mechaniky potvrzené uživatelem (NErekonstruovat z paměti, CH-023). Po schválení → HTML prototyp panelu (kontrakt) → impl. plán → kód.
**Rozsah:** **FE only.** Combat panel + dvě okna (Schopnosti/Kouzla) + rozšíření dice enginu o `d6+` + strukturovaný spellbook (dotkne se i listu `Drd16Sheet`). **Bez BE** (vše přes volný `customData`; `d6+` je FE dice logika, payload zůstává generický).
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-24
**Souvisí:** spec-16.2b-denik-drd16 (list) · roadmap2 16.2a drd16 „Taktická mapa" · `tactical-map/.../combatPanels.ts` · vzor `Drd2CombatPanel` · `rollFromSheet.ts` / `rollEngine`.

> **Číslování:** „16.2b" = drd16 jako 2. systém grafického průchodu deníků (po Matrixu). Tohle je jeho **mapová** část (list = spec-16.2b-denik-drd16).

---

## 1. Cíl
Dostat drd16 deník do taktické mapy jako **kompaktní bojový panel** (ořez na bojové minimum) + vyřešit dlouhý obsah (schopnosti, kouzla) přes **otvírací okna**, protože do úzkého boku se nevejde. Combat panel = single source s listem (čte/zapisuje tentýž `diary.customData` přes `token.characterSlug`).

## 2. Audit / co reuse
- `COMBAT_PANELS[system]` registry (`combatPanels.ts`) — drd16 **chybí**, přidat.
- Vzor `Drd2CombatPanel`: `useCharacterDiary` + debounced (~500 ms) `useUpdateCharacterDiary({customDataPatch})`; `onRoll({label,modifier,kind})`; `canEdit` gate; iniciativa quick-roll.
- Hody přes `onRoll` → `performSheetRoll` (`rollFromSheet.ts`) → `useMapDiceRoll` (3D overlay + dice log). Engine umí `fate` + `d4..d100`. **`d6+` (exploding) chybí.**
- Sdílený `Modal` (shared/ui) na okna.

## 3. Klíčová rozhodnutí

| # | Rozhodnutí | Důvod |
|---|-----------|-------|
| R1 | **Combat panel = bojové minimum**, vzor `Drd2CombatPanel` (diář přímo přes `characterSlug`, debounced write, `canEdit`) | konzistence s ostatními panely; single source s listem |
| R2 | **`d6+` = nový exploding d6** v `rollEngine` (hoď d6; když 6, hoď znovu a přičti; opakuj). Reuse **generického payloadu** (pole kostek proměnné délky) — nová je jen roll funkce, ne schema | „nafukovací k6"; vytěžitelné pro další DrD systémy |
| R3 | **Hody:** Útok = ÚČ + `d6+` · Obrana = OČ + `d6+` · Vlastnost = `d10` + bonus (`getDrdBonus`) · Iniciativa = `d6+` bez bonusu. **Zranění se nepočítá automaticky** (dva tokeny, dva hody → ruční vyhodnocení) | potvrzeno uživatelem |
| R4 | **Zbraň:** `uc`=ÚČ (hod) · `utoc`=útočnost=**Zranění** (štítek, info) · `oz`=obrana zbraně (info, už v OČ → žádná matika). **List zbraní beze změny** | potvrzeno uživatelem |
| R5 | **Dvě nezávislá okna** „📖 Schopnosti" (volný text) a „📖 Kouzla" (karty), reuse `Modal`; lze otevřít obě naráz (stacking, vlastní z-index/stav) | dlouhý obsah se do boku nevejde; uživatelův návrh |
| R6 | **Strukturovaný spellbook:** `spells` se mění z textarey na **JSON pole karet** (přímo, žádná existující data → bez migrace/BC), editor **i v listu** i v okně; **magenergie = text** (proměnlivá: „3 + za další 2"); **žádné auto-seslání** (magy ruční odečet) | reálný tvar kouzla; v drd16 denících zatím žádná kouzla nejsou → čistá změna typu |
| R7 | **Schopnosti = volný text** (`special_abilities`), bez struktury | autorská práva (uživatel) |
| R8 | **Postřeh + Pohyb = jen zobrazené číslo** (neklikací reference) | potvrzeno uživatelem |
| R9 | **Bez BE** — data přes `customData`, `d6+` FE logika | jako 16.2a Matrix |

## 4. Combat panel — obsah (bojové minimum)
1. **Iniciativa** quick-roll (`d6+`, bez bonusu).
2. **Životy** `hp_current/hp_max` (editovatelné + ±1/±5) · **Magy** `mana_current/mana_max` (edit + ±).
3. **Vlastnosti** (5, bez Velikosti) `str/dex/con/int/cha` — řádek = klik → hod `d10 + getDrdBonus`.
4. **Základní pohyb** `mov_val` — jen číslo. · **Postřeh** `per_*` (2×2 %) — jen zobrazené.
5. **Obrana** `defense` (OČ) — klik → hod `OČ + d6+`.
6. **Zbraně** `meleeWeapons` + `rangedWeapons` — řádek = klik → hod `ÚČ(uc) + d6+`; vedle štítky `Útoč`(zranění) + `OZ`(info).
7. **Tlačítka oken:** „📖 Schopnosti" · „📖 Kouzla".

## 5. Karta kouzla (`spellbook[]`)
Pole (vše string, bez parsování): `name` (Název) · `incantation` (Zaklínadlo, kurzíva) · `mana` (Magenergie, text) · `trap` (Past, „Int ~ 7 ~ 0") · `range` (Dosah) · `scope` (Rozsah) · `casting` (Vyvolání) · `duration` (Trvání) · `domain` (Obor magie) · `description` (Popis).

## 6. `d6+` — technika
- `rollExplodingD6()` → hází d6 ve smyčce, dokud padá 6 (přičítá); vrací **pole hozených kostek** + součet. (Pojistka proti nekonečnu: tvrdý strop ~50 hodů.)
- `RollKind` + `performSheetRoll`: přidat větev `d6+` → reuse `buildGenericPayload` (pole d6 kostek proměnné délky), `total = součet + modifier`.
- Rozšířit `kind` union v `SystemSheetProps['onRoll']` + `CombatPanelProps.onRoll` o `'d6+'`.
- **Dice log** rozepíše kaskádu (`ÚČ 7 + k6+ [6,6,3] = 22`). **3D vizuál kaskády** = best-effort / follow-up (MVP: log + součet).

## 7. Data klíče (`customData`, bez prefixu)
| Pole | Klíč | Stav |
|---|---|---|
| HP / Magy / OČ | `hp_current` `hp_max` `mana_current` `mana_max` `defense` | reuse |
| 5 vlastností | `str_val` … `cha_val` | reuse (hod k10+bonus) |
| Pohyb / Postřeh | `mov_val` · `per_obj_rand/seek` `per_mec_rand/seek` | reuse (display) |
| Zbraně | `meleeWeapons[]` `rangedWeapons[]` | reuse (uc=hod) |
| Schopnosti | `special_abilities` | reuse (text okno) |
| **Kouzla** | `spells[]` (karty) | **změna typu** text→JSON pole; v drd16 denících zatím žádná data → bez migrace |

## 8. Technické háčky (k dořešení v plánu)
| # | Háček | Pozn. |
|---|---|---|
| H1 | **Map dice-log persist** musí přijmout `d6+` payload | payload je generický (pole kostek) → nejspíš projde; **ověřit** `useMapDiceRoll`/BE log schema |
| H2 | **`onRoll` kind union** rozšířit o `d6+` | `SystemSheetProps` + `CombatPanelProps` + `RollKind` + `performSheetRoll` |
| H3 | **spells text→JSON** | žádná existující data → bez migrace; jen `parseJsonArr('spells')` (string→[]); persistence test A→B→A pro jistotu |
| H4 | **List `Drd16Sheet` Kouzla** | textarea → editor karet (bind `spellbook`); okno a list = single source |

## 9. Co NEděláme
- Žádné auto-zranění / auto-srovnání útok×obrana (ruční). · Žádné auto-seslání (magy ruční). · Schopnosti nestrukturujeme. · Bestie + chat napojení drd16 = samostatné body. · 3D kaskáda `d6+` = follow-up (MVP log breakdown).

## 10. Rozsah souborů (odhad)
- `tactical-map/.../system-panels/Drd16CombatPanel.tsx` + `.module.css` (nový) · registrace v `combatPanels.ts`.
- `chat/dice/lib/rollEngine.ts` (+ `dicePayload`?) — `rollExplodingD6` + `d6+` RollKind.
- `tactical-map/utils/rollFromSheet.ts` — větev `d6+`.
- `diary-systems/types.ts` (`onRoll` kind) + `combatPanels.ts` (`CombatPanelProps.onRoll`).
- `diary-systems/sheets/drd16/Drd16Sheet.tsx` + `constants.ts` — strukturovaný spellbook (karty), sdílená spell-card komponenta (reuse list↔okno).
- Okna: reuse `shared/ui/Modal`; nová `Drd16AbilitiesWindow` / `Drd16SpellbookWindow` (nebo 1 generická + obsah).
- Testy: panel (mock useCharacterDiary/onRoll), `rollExplodingD6` (deterministický mock RNG: 6,6,3 → [6,6,3]=15), spellbook editor.

## 11. Otevřené otázky
- (žádné blokující — háčky H1–H4 se dořeší v plánu.)
