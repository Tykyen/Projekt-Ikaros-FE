# Spec 2.3b — Auto-preset kostek dle herního systému

**Rozšiřuje:** [spec-2.3.md](spec-2.3.md) — sekce „Herní systém" (SystemSection).
**Důvod:** Zpětná vazba testerů — při volbě systému chtějí mít kostky předvyplněné,
ať nad nimi nemusí přemýšlet. Výběr zůstává plně editovatelný.

---

## Cíl

Po zvolení herního systému (při tvorbě i editaci světa) se kostky / mechaniky
automaticky předvyplní doporučenou sadou pro daný systém. PJ ji může libovolně
upravit; ruční úpravy se při dalším přepnutí systému nepřepíší.

## Mapování systém → preset (chip labely z `DICE`)

Hodnoty jsou **druhy** kostek (chip labely), ne fyzické počty. Počty z PDF
(`kostky_rpg_minimum_maximum.pdf`) jsou pro UI irelevantní.

| `id`              | systém                    | preset chipy |
|-------------------|---------------------------|--------------|
| `matrix`          | Matrix                    | `Fate kostky` |
| `dnd5e`           | D&D 5e                    | `d4, d6, d8, d10, d12, d20, d100 / procenta` |
| `jad`             | Jeskyně a Draci           | `d4, d6, d8, d10, d12, d20, d100 / procenta` |
| `drd16`           | Dračí Doupě 1.6           | `d6, d6+, d10, d100 / procenta` |
| `drd-plus`        | Dračí Doupě Plus          | `d6, 2d6+` |
| `drd2`            | Dračí Doupě II            | `d6, 2d6, 3d6` |
| `draci-hlidka`    | Dračí Hlídka              | `d6, d10` |
| `pi`              | Příběhy Impéria           | `Fate kostky` |
| `shadowrun`       | Shadowrun                 | `d6, Pool d6` |
| `gurps`           | GURPS                     | `d6, 3d6` |
| `fate`            | Fate Core / Accelerated   | `Fate kostky` |
| `call-of-cthulhu` | Call of Cthulhu           | `d4, d6, d8, d10, d20, d100 / procenta` |
| `vlastni`         | Vlastní Systém            | *(žádný preset — výběr se nikdy nemění automaticky)* |

> U dice-pool / součtových systémů (DrD+, DrD2, GURPS, Shadowrun) je vedle
> `2d6/3d6/Pool d6` přidána i bázová `d6` — roller stejně všechno převádí na d6
> ([worldDiceCatalog.ts](../../../src/features/world/chat/dice/lib/worldDiceCatalog.ts)),
> ale formulář tím čitelně sděluje „základ je šestka".
>
> **`d6+` (DrD 1.6) a `2d6+` (DrD+)** jsou **eskalující kostky** s vlastní roll
> primitivou (NE statický součet) — viz [spec-16.2-2d6plus](../phase-16/spec-16.2-2d6plus.md).
> `drd16` proto k `d6` přidává `d6+`; `drd-plus` má `2d6+` místo statického `2d6`.

## Chování (smart-replace)

- **B1 — Tvorba, start:** `dice` se inicializuje presetem `DEFAULT_SYSTEM`
  (`matrix` → `['Fate kostky']`). Žádné prázdno na startu.
- **B2 — Změna systému:** kostky se přepíšou presetem nového systému **jen když**
  aktuální výběr odpovídá presetu *předchozího* systému (nebo je prázdný).
  Po ruční úpravě chipů přepnutí systému výběr **ponechá beze změny**.
- **B3 — Editace existujícího světa:** při načtení se `world.dice` **nikdy**
  nepřepisuje (legacy data v bezpečí). Smart-replace se spustí pouze při ručním
  přepnutí systému PJ-em.
- **Vlastní Systém:** bez presetu → výběr se nikdy automaticky nečistí.

## „Obnovit doporučené pro systém"

Pod chipy malý textový odkaz. Klik → nastaví kostky na preset aktuálního systému
(přepíše i ruční úpravy — explicitní akce uživatele). Skrytý, když aktuální
systém preset nemá (`vlastni`) nebo když výběr už presetu odpovídá.

## Architektura

- `constants/systemDicePresets.ts`
  - `SYSTEM_DICE_PRESETS: Record<string, readonly string[]>` — mapa výše.
  - `getDicePreset(systemId): string[]` — vrátí kopii presetu (nebo `[]`).
  - `applySystemChange(prevSystem, nextSystem, currentDice): string[]` — čistá
    funkce se smart-replace logikou (B2). Sdílí ji tvorba i editace.
- `SystemSection` (tvorba) + `BasicInfoTab` (editace) volají `applySystemChange`
  v handleru změny systému; render odkazu „Obnovit doporučené".
- Vitest: `systemDicePresets.spec.ts`
  - každý preset value ∈ `DICE` (žádný překlep v labelu),
  - `applySystemChange`: prázdno→preset, preset A→preset B, ruční výběr→beze změny,
    přepnutí na `vlastni`→beze změny.

## Mimo rozsah

- BE změny — `world.dice` zůstává volný `string[]`, žádná migrace.
- Změna pickeru / roll enginu — preset jen předvyplní whitelist, downstream beze změny.

## Definition of done

1. Mapování dle tabulky, presety = validní `DICE` labely (test).
2. Smart-replace B1–B3 funguje v tvorbě i editaci (test čisté funkce).
3. Odkaz „Obnovit doporučené" funguje a správně se skrývá.
4. `npm run build` prochází, mobil i desktop OK (skill mobil-desktop).
