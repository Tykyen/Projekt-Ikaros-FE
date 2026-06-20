---
name: nakup
aliases: [purchase, nákup, transakce, refund, storno]
category: herni-mechaniky
related: [[obchod], [financni-ucet], [mena]]
status: draft
---

# Nákup

**TL;DR:** Atomická transakce koupě položky z [[obchod|obchodu]] — strhne cenu z [[financni-ucet|účtu]] a přidá zboží; lze stornovat (refund).

## Detail

Nákup propojí [[obchod|obchodní]] položku, [[mena|měnu]] a [[financni-ucet|finanční účet]] postavy do jedné atomické operace (buď proběhne celá, nebo vůbec). Refund (storno) vrátí peníze a odebere zboží.

⚠️ Past z 11.3: `PageDirectoryEntry.id` = page ID ≠ `characterId`; pro nákup je potřeba `characterId` (přes `useCharacter(slug).data.id`).

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: tlačítko koupit v obchodě

## Nepleť s

- **[[obchod]]** — nabídka; nákup je akt koupě.
