---
name: staty-systemu
aliases: [system stats, staty, systemStats, character sheet, listina, atributy]
category: herni-mechaniky
related: [[herni-system], [denik-postavy], [bestie], [postava]]
status: draft
---

# Staty systému

**TL;DR:** Hodnoty postavy/bestie dané zvoleným [[herni-system|herním systémem]] (HP, atributy, dovednosti…), renderované per-systémovým schématem do listiny (sheetu).

## Detail

Každý [[herni-system|herní systém]] (Matrix, D&D 5e, Dračí Doupě, Shadowrun…) má vlastní schéma statů. Schéma je **canonical na FE** a exportuje se do BE (`export-schemas`); BE validuje v soft-módu (chybějící schéma → `errors._schema`, nezahodí data).

Staty pohánějí:
- listinu v [[denik-postavy|deníku]] postavy,
- HP a bojové hodnoty [[token|tokenů]] na [[takticka-mapa|mapě]],
- karty [[bestie|bestií]].

⚠️ Změna `world.system` přepne layout statů/listin všem najednou.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: listina v deníku postavy, token panel na mapě

## Nepleť s

- **[[denik-postavy]]** — render + vyprávění; staty jsou samotná data.
