---
name: system
description: Use when building the visual+functional layer of a NEW game system (deník/bestie/taktická mapa/chat) with ONE default look. Guides a phased, gated workflow — vyjasnit → HTML návrh → schválení → impl → render-ověření → doladění — phase by phase. NOT for the 8 skins (use the `skin` skill once the system is done). Trigger on "nový systém", "udělej deník/bestii/panel pro <systém>".
---

# system — stavba vizuálu + funkce nového herního systému (jeden vzhled)

Řídí kompletní stavbu nového systému do funkční podoby s **jedním** (default) vzhledem:
**deník → bestie → taktická mapa (PC) → taktická mapa (bestie) → chat → uzávěr.**
Skiny (8 variant) NEŘEŠÍ — ty dělá skill **`skin`** až je systém hotový.

> **Zdroj pravdy detailů** (NEduplikuj sem, čti je): [`docs/arch/phase-16/sablona-denik-per-system.md`](../../../docs/arch/phase-16/sablona-denik-per-system.md) (9 kroků, vzory z Matrixu, checklist) + [`docs/arch/phase-16/sablona-skiny-per-system.md`](../../../docs/arch/phase-16/sablona-skiny-per-system.md) (token kontrakt, povrchy, **pasti §9**, ornament policy). Tenhle skill je **dirigent** těch šablon, ne jejich kopie.

## Vstup (co dodá zadavatel)
- **Název / `id` nového systému** + čím se liší (mechaniky, staty, hody).
- **Co chce v deníku** — sekce, pole, výpočty.
- **Vizuál** — často obrázek/screenshot „z reálu", nebo slovní popis. Ber ho jako referenci stylu (paleta, fonty, tvar). Když chybí, vyjasni dotazem.

## Železné principy (platí v KAŽDÉ fázi)
1. **Tvrdá brána.** Každá fáze: vyjasnit → **HTML návrh** (standalone `c:\tmp\<id>-<místo>-audit.html`) → **STOP, čekej na explicitní „schvaluju"** → teprve pak produkční kód → ověření → **doladění dokud zadavatel spokojen** → teprve další fáze. Žádný auto-postup.
2. **Prototyp = kontrakt.** Vizuál i chování lad' ve standalone HTML, až pak produkční kód (šetří cyklení).
3. **Build ≠ hotovo.** Po impl: `npm run build` + relevantní testy + **render-ověření** (Chrome headless harness, recept v `sablona-skiny §6`). Build je nutná, NE dostatečná podmínka — `var()` bez fallbacku / inline `style={{}}` hardcode build neodhalí (pasti `sablona-skiny §9.10,9.12,9.15`).
4. **Reuse > kopie.** Jeden zdroj pravdy (deník = `<Id>Sheet` přes `DiaryTab`; chat dědí list i panely zdarma).
5. **Po netriviální fázi `chybovy-denik`**; na konci `funkce` + `napoveda`. Git commituje uživatel.
6. **Flexibilní vstup:** umíš skočit na fázi (`system: dolaď bestii drd2`), nejen jet od začátku — poznej z argumentu/stavu, kterou fázi řešíš.

## Fáze

### 0. Příprava (jednou)
- Ověř `id` napříč vrstvami (`RPG_SYSTEMS` ↔ `diary-systems/registry` ↔ `map-systems/registry` ↔ BE) — pozor na alias drift (sablona-denik §0). Nový systém → přidej alias do registry, parity test to chytí.
- Přiřaď **default skin** dle žánru (`DEFAULT_SKIN_BY_SYSTEM`). Ověř, jestli `<Id>Sheet` už existuje.

### 1. Deník (list postavy/NPC)
- **Vyjasni** sekce/pole/mechaniky + vezmi vizuál zadavatele.
- **HTML návrh** listu (hero + sekce + view/edit) → **schválení** → doladění.
- **Impl:** `sheets/<id>/<Id>Sheet.tsx` + `styles/<id>.css`, `makeCdAccess` (prefix `<id>_`), 3 režimy view/edit/print, PC vs NPC.
- ⚠️ **List sémantické tokeny** `--<id>-hp/spell/insp` v base `<id>.css` (jinak HP pole/Inspirace/Kouzla padají na accent — sablona-skiny §4).
- Ověř (tsc · sheet testy · build · render) → doladění → **brána**.

### 2. Bestie (do bestiáře)
- Zkontroluj/vytvoř schémata `schemas/<id>/bestie.json` + `token.json` (sekce + fields + `combatBehavior`).
- **HTML návrh** statbloku → **schválení** → doladění.
- Rozhodni: generický `BestiePanelView` stačí, nebo `<Id>BestiePanel.tsx` (vlastní mechanika).
- Ověř → doladění → **brána**.

### 3. Taktická mapa — PC combat panel
- **HTML návrh** combat panelu (ořez na bojové minimum) → **schválení** → doladění.
- **Impl:** `<Id>CombatPanel.tsx` + `.module.css`, registruj v `COMBAT_PANELS`. Stavy přes `data-*`.
- ⚠️ **HP bar fill** = `var(--dd-hpfill-grad, …)` v `.hpBarFill`, NIKDY hardcoded `style={{background:hpColor}}` (sablona-skiny §9.15). **HP bar na tokenu** (`resolveCharacterHp`) = přidej `case '<id>'` s REÁLNÝMI klíči + test proti reálným datům (§9.14).
- ⛳ **HP bar MUSÍ být vidět u POSTAV i BESTIÍ — jediná výjimka `drd2`** (uživatel, závazné). **Past: auto-default max se NEUKLÁDÁ** — když deník max jen dopočítá (napč. `hpMax=ST`) a hráč HP needituje, klíč v customData chybí → resolver vrátí `null` → čerstvá postava BEZ baru → fallback na zdrojový atribut (`gurps_hp_max ?? gurps_st`). Ověř na postavě, co NEsáhla na HP.
- Ověř → doladění → **brána**.

### 4. Taktická mapa — bestie statblok
- **HTML návrh** bestie panelu na mapě → **schválení** → doladění.
- **Impl:** `<Id>BestiePanel.tsx`, napoj v `TokenSystemSheet` bestie větvi. Sdílej jádro s krokem 2 (0 drift).
- ⛳ **Bestie HP bar:** `token.json` MUSÍ mít HP pole s `combatBehavior:'damageable'` (jinak bestie bar nejede). Vidět všude kromě `drd2`. **A panel MUSÍ HP ± zapisovat do TOHO systemStats pole** (`systemStats['health.current']`), ne jen `token.currentHp` — jinak se bar nehne (FATE vzor). DrDH mění currentHp jen proto, že damageable v token schématu NEMÁ → bar padá na currentHp fallback. Ověř `resolveHpWithFallback` PŘED copy-paste jiného systému.
- Ověř → doladění → **brána**.

### 5. Chat — aplikace TM vzhledu (PC + bestie) + obal
- Ověř reuse: chat rail běží na `DiaryTab → getDiaryPreset(system).SystemSheet` → list i panely **dědí vzhled zdarma**. Bestie/PC v chatu = TÝŽ plný panel jako na mapě, jen užší rail (NE osekaná karta).
- Obal chatu (railShell) nese skin přes `--dd-embed-*`. Ověř render → doladění → **brána**.

### 6. Uzávěr
- `funkce` (inventura) + `napoveda` (hráčský výtah) + `chybovy-denik` ✅ ŘEŠENÍ za systém + roadmap matice.
- **Systém je hotový s jedním vzhledem.** Teď může přijít skill **`skin`** (8 variant přes všechny povrchy).

## Co tenhle skill NEDĚLÁ
- **8 skinů** → skill `skin`.
- Ornamenty dicelogu/orchestrace → **NEpřidávej** (ornament policy: dicelog + orchestrace + chat obal = jen barva, sablona-skiny §3).
- Po grafické úpravě nezapomeň `mobil-desktop`.
