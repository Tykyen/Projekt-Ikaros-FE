---
name: chybovy-denik
description: Zapiš svou VLASTNÍ chybu, omyl nebo slepou uličku do chybového deníku (docs/chybovy-denik/). Spusť VŽDY když zjistíš, že jsi udělal chybu, šel špatným směrem, tvá oprava nezabrala, nebo se začínáš cyklit. Index deníku je hlavní brzda proti cyklení — před opakováním přístupu ho přečti.
---

# Skill: chybový deník

Vede **chybový deník** v `docs/chybovy-denik/` — záznam vlastních chyb a poučení.

**Hlavní účel: NECYKLIT SE.** Když oprava nezabere, nezkoušej hned variaci téhož — nejdřív zapiš, co nefungovalo, a podívej se do indexu, jestli jsem to (nebo něco podobného) už nezkoušel.

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

- Tvoje oprava/řešení **NEZABRALO** (uživatel hlásí, že je to pořád špatně; test selhal; chování se nezměnilo).
- Přistihneš se, že zkoušíš **variaci něčeho, cos už zkoušel**.
- Uděláš **omyl** — špatný soubor, špatný předpoklad, regrese (rozbil jsi, co fungovalo).
- **PŘED dalším pokusem** o vyřešení téhož problému.

## Postup

1. **Přečti `docs/chybovy-denik/README.md`** (index — krátký). Projdi řádky, jestli podobná chyba/pokus už není.
2. **Pokud podobný pokus už v indexu je → CYKLÍŠ.** Nezkoušej stejný ani podobný přístup. Zvol jiný směr od základu, nebo se zeptej uživatele. (Detail si dočti v příslušném oblastním souboru.)
3. **Urči oblast** (krátký slug: `tisk`, `be`, `fe`, `proces`, `css`, …). Otevři/založ `docs/chybovy-denik/<oblast>.md` a přidej na konec **detailní záznam** dle šablony.
4. **Přidej řádek do tabulky v `README.md`** a zvyš „Příští ID".
5. **Informuj uživatele** jednou větou: co nefungovalo a jaký směr volíš teď.

## Šablona — detailní záznam (do oblastního souboru)

```
### CH-NNN — <stručný název chyby> · <YYYY-MM-DD>
**Kontext:** <co jsem řešil>
**Co jsem udělal špatně:** <konkrétní chyba / přístup / předpoklad>
**Proč to nefungovalo:** <důvod>
**Poučení:** <co dělat příště jinak>
**Příznak cyklení:** <podle čeho poznám, že to zkouším znovu>

---
```

## Šablona — řádek do indexu (README.md tabulka)

```
| [CH-NNN](<oblast>.md#ch-nnn) | <oblast> | <stručně jednou větou> | <příznak cyklení> |
```

## Pravidla

- ID je **globálně sekvenční** napříč oblastmi (CH-001, CH-002, …) — další číslo drží README („Příští ID").
- Před KAŽDÝM dalším pokusem o opravu téhož problému **projdi index**.
- Tutéž (nebo skoro stejnou) chybu zapsanou **2×** → **STOP**. Nepokračuj stejnou cestou; změň přístup od základu, nebo se zeptej. Tři neúspěšné varianty téhož = ztráta času i důvěry.
- **README drž krátký** (jednořádky). Detaily patří do oblastních souborů. Když index přeroste, archivuj staré řádky do `archiv.md`.
- Piš **upřímně**, i trapné omyly — deník je pro poučení, ne na efekt.
- `chyby` = MÉ procesní chyby a slepé uličky. (Technický dluh kódu řeší skill `dluh`.)
