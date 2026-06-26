# Spec 16.2b-bestie — DrD 1.6 bestie šablona (per-system schéma do bestiáře)

**Status:** 🟢 SCHVÁLENO (pole + design odsouhlaseny uživatelem 2026-06-26) → implementace. Mechaniky/pole potvrzené uživatelem (NErekonstruovat z paměti — CH-023).
**Rozsah:** **FE schéma + BE export.** Nové per-system schéma `schemas/drd16/bestie.json` → bestiářový editor („+ Nová bestie") i karta ho **automaticky** vyrenderují přes generický schema engine. **BE:** mirror schéma přes `export-schemas` (soft-mode validace) + restart.
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-26
**Souvisí:** spec-16.2b-mapa-drd16 (Fáze 2 = bestie na mapě) · `tactical-map/schemas/<system>/bestie.json` (vzor drd2) · `bestiar/` (editor+karta) · [[project_bestiar_design]] · [[project_schema_be_fe_sync]].

> **Číslování:** „16.2b" = drd16 jako 2. systém grafického průchodu. Tohle je jeho **bestie** část (list = denik, mapa = mapa). Prototyp vzhledu (naturalistova deska): `c:/tmp/drd16-bestie-audit.html`.

---

## 1. Cíl
Bestiář („Bestiář" stránka, 3 scope Můj/Tohoto světa/Systémové) **nemá pro drd16 šablonu** → `registry.get('drd16','bestie')` vrací `null` → editor hlásí „schéma není zaregistrované", karta nezobrazí staty. Cíl: doplnit DrD 1.6 bestie schéma → **PJ může vytvořit/uložit/zobrazit bestii** věrnou pravidlům DrD 1.6.

## 2. Klíčová rozhodnutí
| # | Rozhodnutí | Důvod |
|---|---|---|
| R1 | **Cesta A** — generický schema engine (`EntitySchemaForm` editor + `EntityStatbar` karta), žádný custom render | „normální bestiář" funkční rychle; custom „naturalistova deska" = navazující Cesta B |
| R2 | **Jméno = `Bestie.name`, Slovní popis = `Bestie.notes`** (vestavěné v editoru), NE schema pole | editor je má nativně; schéma = jen staty |
| R3 | **Útok = `list`** (`attacks[]`, položka `{name, value}`), libovolný počet | bestie mívá víc útoků (ostny, kusadla…); `(ostny)` = název, číslo = ÚČ |
| R4 | **Přesvědčení = `enum`** `ZkD/ZmD/N/ZmZ/ZkZ` | DrD přesvědčení (5 hodnot) |
| R5 | **Životy = `number` `combatBehavior:'damageable'`** = přímé HP; **Pohyblivost = `number` `combatBehavior:'movement'`** | Fáze 2 (mapa) vytěží přímo: HP bar + A* dosah |
| R6 | **Velikost/Zranitelnost/Způsob pohybu/Poklady = `string`**; ostatní staty = `number` | dle pravidel: písmeno / slovo / čísla |
| R7 | **ZSM = Základní síla mysli = `number`** | potvrzeno uživatelem |

## 3. Pole schématu (`systemStats`, sekce)
| Sekce | key | Label | type | pozn. |
|---|---|---|---|---|
| **Boj** | `hp` | Životy | number, **damageable**, default 1, min 0 | HP |
| | `attacks` | Útoky | **list** [`name` string, `value` number] | víc útoků |
| | `defense` | Obranné číslo | number | OČ |
| | `resilience` | Odolnost | number | |
| **Tělo & pohyb** | `size` | Velikost | string | písmeno A/B/C… |
| | `combativeness` | Bojovnost | number | |
| | `vulnerability` | Zranitelnost | string | zvíře… |
| | `movement` | Pohyblivost | number, **movement** | |
| | `movementMode` | Způsob pohybu | string | hmyz/plaz… |
| | `endurance` | Vytrvalost | number | |
| | `maneuver` | Manévrovatelnost | number | |
| **Mysl** | `intelligence` | Inteligence | number | |
| | `charisma` | Charisma | number | |
| | `mindForce` | ZSM (Zákl. síla mysli) | number | |
| | `alignment` | Přesvědčení | **enum** ZkD/ZmD/N/ZmZ/ZkZ | |
| **Odměna** | `treasure` | Poklady | string | nic… |
| | `experience` | Zkušenost | number | XP |
| | `taming` | Ochočení | number | |

> Klíče **bez tečkové cesty** (flat) — `systemStats` je flat objekt; `list` ukládá pole objektů.

## 4. Soubory (FE)
- `schemas/drd16/bestie.json` (schéma) + `schemas/drd16/bestie.ts` (typed wrapper) + `schemas/drd16/index.ts` (`drd16Schemas`).
- `schemas/bootstrap.ts` — registrovat `drd16Schemas`.
- Test: `schemas/__tests__/registry.test.ts` (nebo nový) — drd16:bestie zaregistrované + tvar polí.

## 5. BE export
`export-schemas` skript → `shared/schemas/drd16/bestie.json` (BE mirror). BE validace soft-mode ([[project_schema_be_fe_sync]]). **BE restart** ([[feedback_be_restart_required]]).

## 6. Co se NEDĚLÁ (teď)
- **Custom render (Cesta B)** „naturalistova deska" v bestiáři = navazující polish (vlastní komponenty místo generic).
- **Mapa (Fáze 2)** — bestie panel na taktické mapě (spawn, HP, klikací útoky) = spec-16.2b-mapa pokračování.
- Žádné DrD výpočty (Životaschopnost→životy derivace apod.) — PJ zadává čísla ručně.

## 7. Otevřené
- Cesta B (custom bestiární vzhled) — prototyp hotový (`drd16-bestie-audit.html`), implementace odložena na souhlas.
