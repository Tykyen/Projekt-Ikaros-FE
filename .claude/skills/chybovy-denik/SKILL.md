---
name: chybovy-denik
description: Veď deník práce a poučení v docs/chybovy-denik/. Zapiš (a) svou VLASTNÍ chybu/omyl/slepou uličku (CH-xxx) — VŽDY když uděláš chybu, šel jsi špatným směrem, oprava nezabrala, nebo se cyklíš; (b) vyřešený větší problém / změnu přístupu / zásadní opravu, co zabrala (✅ ŘEŠENÍ) — co zabralo a zhodnocení dobře/špatně. Index je hlavní brzda proti cyklení — před opakováním přístupu ho přečti.
---

# Skill: chybový deník

Vede **deník práce a poučení** v `docs/chybovy-denik/` — vlastní chyby a slepé uličky (`CH-xxx`) **i řešení a zhodnocení** (`✅ ŘEŠENÍ`: co nakonec zabralo, proč to bylo správně, jestli to dopadlo dobře).

**Hlavní účel: NECYKLIT SE + vědět, co už jsem zkusil/udělal a jak to dopadlo.** Když oprava nezabere, nezkoušej hned variaci téhož — nejdřív zapiš, co nefungovalo, a podívej se do indexu, jestli jsem to (nebo něco podobného) už nezkoušel. Když naopak něco netriviálního vyřeším, zapiš `✅ ŘEŠENÍ`, ať na to příště navazuju (a ne to omylem zbořím).

## Struktura deníku (proč složka, ne jeden soubor)

Jeden soubor by za čas přerostl a přestal sloužit (nešel by rychle přečíst). Proto:

```
docs/chybovy-denik/
├── README.md      # INDEX — tabulka: ID · oblast · stručně · příznak cyklení (+ „Příští ID")
├── tisk.md        # detaily oblasti tisk
├── <oblast>.md    # detaily dalších oblastí (be, fe, proces, css, …) — zakládej dle potřeby
└── archiv.md      # (volitelně) staré/vyřešené záznamy, když index naroste
```

- **`README.md` = index** — jeden řádek per chyba. Drží se KRÁTKÝ → dá se vždy přečíst celý (levná kontrola cyklení).
- **Oblastní soubory = detaily** — plný záznam dle šablony.

## Kdy spustit (povinné)

**A) Chyba (`CH-xxx`):**
- Tvoje oprava/řešení **NEZABRALO** (uživatel hlásí, že je to pořád špatně; test selhal; chování se nezměnilo).
- Přistihneš se, že zkoušíš **variaci něčeho, cos už zkoušel**.
- Uděláš **omyl** — špatný soubor, špatný předpoklad, regrese (rozbil jsi, co fungovalo).
- **PŘED dalším pokusem** o vyřešení téhož problému.

**B) Řešení (`✅ ŘEŠENÍ`):**
- Vyřešíš **větší problém**, provedeš **změnu přístupu** nebo **zásadní opravu**, co zabrala — zapiš, co zabralo a jak to hodnotíš (zvlášť pokud uzavírá dřívější sérii `CH-xxx`).
- **NEzapisuj** drobné jednořádkové fixy a rutinní práci — jen to, co má smysl si pamatovat a zpětně hodnotit.

## Postup

1. **Přečti `docs/chybovy-denik/README.md`** (index — krátký). Projdi řádky, jestli podobná chyba/pokus už není.
2. **Pokud podobný pokus už v indexu je → CYKLÍŠ.** Nezkoušej stejný ani podobný přístup. Zvol jiný směr od základu, nebo se zeptej uživatele. (Detail si dočti v příslušném oblastním souboru.)
3. **Urči oblast** (krátký slug: `tisk`, `be`, `fe`, `proces`, `css`, …). Otevři/založ `docs/chybovy-denik/<oblast>.md` a přidej na konec **detailní záznam** — šablona A (chyba) nebo B (řešení).
4. **Přidej řádek do tabulky v `README.md`.** U chyby (`CH-xxx`) zvyš „Příští ID"; `✅ ŘEŠENÍ` ID nemá (číslo nezvyšuj).
5. **Informuj uživatele** jednou větou: u chyby co nefungovalo a jaký směr volíš; u řešení co zabralo a jak to hodnotíš.

## Šablona A — chyba (do oblastního souboru)

```
### CH-NNN — <stručný název chyby> · <YYYY-MM-DD>
**Kontext:** <co jsem řešil>
**Co jsem udělal špatně:** <konkrétní chyba / přístup / předpoklad>
**Proč to nefungovalo:** <důvod>
**Poučení:** <co dělat příště jinak>
**Příznak cyklení:** <podle čeho poznám, že to zkouším znovu>

---
```

## Šablona B — řešení (do oblastního souboru)

```
### ✅ ŘEŠENÍ — <co se vyřešilo> · <YYYY-MM-DD>
**Co nakonec zabralo:** <konkrétní řešení / změna přístupu>
**Proč to je správně (a ne další variace):** <důvod, čím se liší od neúspěšných pokusů>
**Jak ověřeno:** <build/testy/náhled/reálný test>
**Zhodnocení:** <dobře/špatně, zabralo napoprvé?, co zbývá>

---
```

## Šablona — řádky do indexu (README.md tabulka)

```
| [CH-NNN](<oblast>.md#ch-nnn) | <oblast> | <stručně jednou větou> | <příznak cyklení> |
| [✅ ŘEŠENÍ](<oblast>.md#<kotva>) | <oblast> | <co se vyřešilo, stručně> | — |
```

## Pravidla

- ID chyby je **globálně sekvenční** napříč oblastmi (CH-001, CH-002, …) — další číslo drží README („Příští ID"). `✅ ŘEŠENÍ` ID nemá (kotví se nadpisem).
- Před KAŽDÝM dalším pokusem o opravu téhož problému **projdi index**.
- Tutéž (nebo skoro stejnou) chybu zapsanou **2×** → **STOP**. Nepokračuj stejnou cestou; změň přístup od základu, nebo se zeptej. Tři neúspěšné varianty téhož = ztráta času i důvěry.
- Když `✅ ŘEŠENÍ` **uzavírá sérii chyb**, nech `CH-xxx` záznamy být (jsou poučení) — řešení je jen doplní, ať index ukazuje, že je vyřešeno.
- **README drž krátký** (jednořádky). Detaily patří do oblastních souborů. Když index přeroste, archivuj staré řádky do `archiv.md`.
- Piš **upřímně**, i trapné omyly — deník je pro poučení, ne na efekt.
- Deník = MÉ procesní chyby, slepé uličky a jejich řešení. (Technický dluh kódu řeší skill `dluh`.)
