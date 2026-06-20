---
name: financni-ucet
aliases: [account, finanční účet, účet, bankovní účet, finance]
category: herni-mechaniky
related: [[mena], [obchod], [nakup], [subdokument-postavy]]
status: draft
---

# Finanční účet

**TL;DR:** Peněžní účet hráčské [[postava|postavy]] (Finance [[subdokument-postavy|subdokument]]) — zůstatek v [[mena|měně]], transakce, měsíční bilance.

## Detail

Finance jsou subdokument hráčské [[postava|postavy]] (jen PC, ne [[npc|NPC]]/[[lokace]]). Postava může mít více účtů, každý vede zůstatek v dané [[mena|měně]] a historii transakcí (měsíční bilance). [[nakup|Nákup]] v [[obchod|obchodě]] strhává peníze z účtu atomicky.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: záložka Finance na stránce postavy

## Nepleť s

- **[[mena]]** — platidlo; účet drží částku v měně.
