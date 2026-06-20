---
name: obchod
aliases: [shop, obchod, e-shop, ekonomika, shop item, shop group]
category: herni-mechaniky
related: [[mena], [financni-ucet], [nakup]]
status: draft
---

# Obchod

**TL;DR:** Herní obchod světa — prodejné položky s cenou, [[mena|měnou]] a slevou, členěné do hierarchických kategorií.

## Detail

Obchod nabízí předměty k [[nakup|nákupu]] postavami. Skládá se z:
- **položek** — cena, [[mena|měna]], sleva, příslušnost ke kategorii,
- **kategorií** (shop group) — hierarchie parent/child s vlastní slevou.

Nákup probíhá atomicky proti [[financni-ucet|finančnímu účtu]] postavy.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: sekce Obchod / ekonomika ve světě

## Nepleť s

- **[[nakup]]** — samotná transakce; obchod je nabídka.
