# Spec 16.2d-bestie — Dračí doupě Plus bestie šablona (per-system schéma do bestiáře)

**Status:** 🟢 SCHVÁLENO (pole + design odsouhlaseny uživatelem 2026-06-27) → implementace. Pole odvozena z **DrD+ Bestiáře (ALTAR 2006)**, str. 17–18 + ukázky Elf vodní (79) a Požírač duší (122). NErekonstruovat z paměti — vychází z dodaných skenů.
**Rozsah:** **FE schéma + BE export.** Nové per-system schéma `schemas/drdplus/bestie.json` → bestiářový editor („+ Nová bestie") i karta ho **automaticky** vyrenderují přes generický schema engine (`EntitySchemaForm`). **BE:** mirror přes `export-schemas` (soft-mode) + restart.
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-27
**Souvisí:** spec-16.2b-bestie-drd16 (vzor) · spec-16.2d-mapa-drdplus (DrD+ na mapě) · spec-16.2-2d6plus (hod 2k6+) · `tactical-map/schemas/<system>/bestie.json` · `bestiar/` (editor+karta) · [[project_bestiar_design]] · [[project_schema_be_fe_sync]].

> **Číslování:** „16.2d" = DrD+ jako 4. systém grafického průchodu (a=matrix, b=drd16, c=skiny, d=drdplus). Tohle je jeho **bestie** část.

---

## 1. Cíl
DrD+ (`drdplus`) je plnohodnotný systém (combat panel postav, deník, mapa), ale **nemá schéma bestie** → `registry.get('drdplus','bestie')` spadne na `generic` fallback. Cíl: doplnit DrD+ bestie schéma → **lze vytvořit/uložit/zobrazit bytost** přes stejný jednoduchý editor jako ostatní systémy. Schéma je zároveň **datový tvar**, podle kterého Claude vyplní budoucí bytosti z dodaných dat.

## 2. Klíčová rozhodnutí
| # | Rozhodnutí | Důvod |
|---|---|---|
| R1 | **Cesta A** — generický schema engine (`EntitySchemaForm`), žádný custom render. **Jednoduchý formulář jako u ostatních systémů** (potvrzeno screenshotem editoru „Duch"). | rychlé funkční vkládání; pergamenová „čtecí karta" odložena (viz §7) |
| R2 | **Jméno = `Bestie.name`, obrázek = `Bestie.imageUrl`, slovní popis = `Bestie.notes`** — vestavěné v editoru, NE schema pole | Popis/Chování/Boj/… jdou jako volný text do notes (žádné lore pole, žádný multiline) |
| R3 | **Pořadí sekcí: Boj → Vlastnosti → Tělo a pohyb → Smysly → Výskyt a ekologie → Schopnosti.** Boj hned pod obrázkem (přání PJ). | nejdůležitější staty první |
| R4 | **Útoky = `list`** (přidatelný jako Schopnosti), položka `{name, bc, uc, oc, zz, type}`; **ZZ = number**, **Typ = enum B/S/D** | DrD+ útok je kombinace BČ/ÚČ/OČ/ZZ; typ zranění zvlášť |
| R5 | **Mez zranění = `number` `combatBehavior:'damageable'`** = HP na mapě | DrD+ 3řádkový pás zranění (bez postihu/postih/kóma) = **budoucnost** (§7), teď jen číslo |
| R6 | **Ochrana = `number` `armor-reducer`; Rychlost = `number` `movement`** | mapa: tlumení zásahu + A* dosah |
| R7 | **string** u polí s „—"/kombinovaným zápisem: Výdrž, Nezranitelnost, Rozměry; ostatní staty = `number` (záporné povolené)** | kniha míchá čísla, písmena (B/S/D/Ψ) a „—" |
| R8 | **enum** Četnost výskytu + Aktivita; **string** Místo výskytu / Organizace | enum = uzavřená škála; string = volnost |
| R9 | **Schopnosti = `list` `{label, value}`** — identické s matrix/generic | konzistence napříč systémy (render/čtení) |

## 3. Pole schématu (`systemStats`, flat klíče)

| Sekce (key) | key pole | Label | type | pozn. / combatBehavior |
|---|---|---|---|---|
| **Boj** (`combat`) | `mez_zraneni` | Mez zranění | number, min 1, default 1, required | **damageable** (HP) |
| | `ochrana` | Ochrana | number, min 0 | **armor-reducer** |
| | `nezranitelnost` | Nezranitelnost | string | „B, S, D, Ψ", „+O, −Vo…" |
| | `utoky` | Útoky | **list** | položka ↓ |
| | → `name` | Název útoku | string, required | |
| | → `bc` / `uc` / `oc` | BČ / ÚČ / OČ | number | |
| | → `zz` | ZZ | number | základní zranění |
| | → `type` | Typ | enum `B`/`S`/`D` (def. B) | bodné/sečné/drtivé |
| **Vlastnosti** (`stats`) | `sil` `obr` `zrc` `vol` `int` `chr` | Síla…Charisma | number | záporné povolené |
| **Tělo a pohyb** (`body`) | `odolnost` | Odolnost | number | |
| | `vydrz` | Výdrž | string | „—" u magických |
| | `rychlost` | Rychlost | number | **movement** |
| | `velikost` | Velikost | number | ± |
| | `rozmery` | Rozměry | string | „1,7 m / —" |
| **Smysly** (`senses`) | `hmat` `chut` `cich` `sluch` `zrak` | Hmat…Zrak | number | |
| **Výskyt a ekologie** (`ecology`) | `cetnost` | Četnost výskytu | enum | hojný/běžný/neobvyklý/vzácný/velmi vzácný |
| | `aktivita` | Aktivita | enum | den/noc/šero/stále |
| | `misto_vyskytu` | Místo výskytu | string | |
| | `organizace` | Organizace | string | |
| **Schopnosti** (`abilities`) | `abilities` | Schopnosti | **list** `{label, value}` | zvláštní smysly/vlastnosti (např. Vidění duší = 4) |

> Slovní text (Popis/Výskyt/Chování/Setkání/Boj) NENÍ v schématu → `Bestie.notes`.

## 4. Soubory (FE)
- **Nové:** `schemas/drdplus/bestie.json` + `schemas/drdplus/bestie.ts` (typed wrapper) + `schemas/drdplus/index.ts` (`drdplusSchemas`).
- `schemas/bootstrap.ts` — import + registrace `drdplusSchemas`.
- Test: `schemas/__tests__/drdplus-bestie.test.ts` (meta + pořadí sekcí + combatBehavior + útoky/typ + enumy + registrace).
- **Žádné změny enginu** — `string/number/enum/list` renderer i validace už existují (multiline NEpotřeba).

## 5. BE export
`export-schemas` → `shared/schemas/drdplus/bestie.json` (BE mirror, soft-mode, [[project_schema_be_fe_sync]]). **BE restart** ([[feedback_be_restart_required]]).

## 6. Co se NEDĚLÁ (teď)
- **Slovní lore pole / multiline** — popis jde do `Bestie.notes`.
- **Custom „bestiární deska"** (pergamen) — viz §7.
- **DrD+ výpočty** (Mez zranění z Odolnosti přes tabulku) — zadává se ručně.

## 7. Otevřené / budoucí
- **Mez zranění → 3řádkový pás** (bez postihu / postih / kóma) jako `WoundTrack` u postav (`DrdPlusCombatPanel`). Teď lineární `number`. (přání PJ „až v budoucnu")
- **Pergamenová „čtecí karta"** bytosti (per-kategorie akcent, drop-cap, lore) — prototyp `proto-bestie-karta-pergamen.html`; PJ ji chce využít jinde.

## 8. Příklad naplnění (datový tvar — Požírač duší)
```json
{
  "name": "Požírač duší",
  "notes": "Astrální sféry jsou matkou i otcem mnoha prazvláštních stvoření…",
  "systemStats": {
    "mez_zraneni": 7, "ochrana": 2, "nezranitelnost": "Ψ",
    "utoky": [{ "name": "Tlama", "bc": 4, "uc": 5, "oc": 4, "zz": 3, "type": "B" }],
    "sil": 5, "obr": 7, "zrc": -10, "vol": -4, "int": -5, "chr": 6,
    "odolnost": 7, "vydrz": "—", "rychlost": -7, "velikost": 5, "rozmery": "— / 4 m",
    "hmat": -2, "chut": -5, "cich": -2, "sluch": -2, "zrak": -5,
    "cetnost": "velmi vzácný", "aktivita": "stále", "misto_vyskytu": "kdekoli", "organizace": "jedinec",
    "abilities": [{ "label": "Vidění duší", "value": "4" }, { "label": "Vysátí duše", "value": "Vol+2k6+ vs Vol oběti" }]
  }
}
```

---

## 9. Fáze 2 — DrD+ bestie na taktické mapě (`DrdPlusBestiePanel`)
**Status:** 🟢 SCHVÁLENO (vzhled doladěn přes prototyp `c:/tmp/drdplus-bestie-tm-panel.html`, PJ „jdeme na to") → implementace.

### 9.1 Komponenta
Nový `tactical-map/components/token-panel/system-panels/DrdPlusBestiePanel.tsx` (+ `.module.css`), pergamen jako `DrdPlusCombatPanel` (postav). Registrace v `TokenSystemSheet` (`systemId === 'drdplus'` → bestie token). Čte `token.systemStats` (snapshot drdplus bestie) + `token.injury` (celkové zranění) + `token.abilities` + `token.notes`.

### 9.2 Rozhodnutí
| # | Rozhodnutí | Pozn. |
|---|---|---|
| F1 | **Hody:** vlastnosti / tělo (Odolnost, Výdrž, Rychlost) / smysly / ÚČ / OČ / **BČ** = `performSheetRoll(kind:'2d6+')`; **ZZ** = `kind:'d6'` | přes `onMapRoll` (3D overlay + log), `rollerKind:'bestie'` |
| F2 | **Iniciativa nemá tlačítko** — hod na **BČ** zároveň zapíše `token.initiative` (`update.mutate({initiative})`, skipInvalidate) | DrD+ iniciativa = z BČ |
| F3 | **Postih za zranění** (`systemStats.postih`, číslo) se přičítá k modifieru každého hodu | parita s `DrdPlusCombatPanel` postav (postih obvykle záporný) |
| F4 | **Mez zranění = číselný režim** (ne políčka): 3 pásma (Bez postihu / Postih / Kóma), každé bar `zaplněno / mez` + stepper ±1/±5; **postih inline**. Škáluje na mez 7 i 50. | `injury` = celkové zranění; pásma dopočet z `injury` vs `mez_zraneni`: bez=`min(injury,mez)`, postih=`clamp(injury−mez,0,mez)`, kóma=`clamp(injury−2·mez,0,mez)`; stepper mění `injury` (0..3·mez) |
| F5 | **Výdrž se hází** (2k6+) jako Odolnost/Rychlost; hodnota `—` (neúnavná) → disabled | |
| F6 | **Erb = obrázek bestie** (`token` obrázek ve štítovém SVG clip), ne glyf | |
| F7 | **Read na panelu:** Ochrana, Schopnosti (`abilities`), Poznámky (`notes`). **Mimo panel:** Velikost, Rozměry, Výskyt/ekologie | |
| F8 | **In-place edit** („✏ Upravit bestii"): panel přepne do edit režimu, pole se stanou inputy (jméno, útoky +/−, mez, ochrana, vlastnosti, tělo, smysly, schopnosti +/−, poznámky). Uloží `instanceName` + `systemStats` (sanitizace na `drdplus:token`) + `notes`. **Žádný samostatný modal.** | vzor `Drd16BestieTokenEditModal.save` (sanitizace), ale render in-place |

### 9.3 `drdplus:token` schéma
Nové `schemas/drdplus/token.json` (+ wrapper, do `drdplusSchemas`). Pole = editovatelná podmnožina bestie (BEZ Velikost/Rozměry/Výskyt) + runtime `postih`: `mez_zraneni` (number, **damageable** — `buildBestieToken` z něj odvodí HP), `ochrana`, `nezranitelnost`, `postih`, `utoky` (list name/bc/uc/oc/zz/type), `sil/obr/zrc/vol/int/chr`, `odolnost`, `vydrz`, `rychlost` (**movement**), `hmat/chut/cich/sluch/zrak`. Edit save sanitizuje `systemStats` na tyto klíče (BE `validateForPatch` je STRICT). Export do BE + restart.

### 9.4 Soubory
`DrdPlusBestiePanel.tsx` + `.module.css`; `schemas/drdplus/token.json` + `token.ts`; `schemas/drdplus/index.ts` (přidat token); `TokenSystemSheet.tsx` (registrace); test `DrdPlusBestiePanel.spec.tsx`.
