---
name: iniciativa
aliases: [initiative, iniciativa, combat tracker, pořadí boje, combat, kolo]
category: herni-mechaniky
related: [[takticka-mapa], [token], [staty-systemu]]
status: draft
---

# Iniciativa

**TL;DR:** Lišta řazení bojovníků na [[takticka-mapa|mapě]] — třídí [[token|tokeny]] živě podle hodnoty iniciativy a vede kola boje.

## Detail

Iniciativa (combat tracker) řídí pořadí v souboji:
- lišta sortuje **živě** dle hodnoty `initiative` (ne snapshot pořadí),
- PC jsou v boji vždy,
- aktuální bojovník a číslo kola (round) řídí `combat.turn` / `combat.order`,
- obrázek bestie se v liště bere fresh přes resolveImage.

Hodnoty iniciativy vychází ze [[staty-systemu|statů]] dané postavy/bestie dle [[herni-system|systému]].

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: lišta iniciativy na taktické mapě

## Nepleť s

- **[[token]]** — figurka; iniciativa je pořadí, ve kterém figurky jednají.
