---
name: herni-cas
aliases: [in-game datum, herní datum, herní čas, in-game date, world time]
category: herni-mechaniky
related: [[kalendar-sveta], [generator-pocasi], [herni-akce]]
status: draft
---

# Herní čas

**TL;DR:** Aktuální datum a čas světa v jeho [[kalendar-sveta|kalendáři]] — „kde právě jsme"; řídí [[generator-pocasi|počasí]] a zobrazuje se v kalendáři.

## Detail

Herní čas je momentální in-game datum světa. PJ ho posouvá (operace „posuň den" zároveň regeneruje [[generator-pocasi|počasí]]). Datum se interpretuje v rámci struktury [[kalendar-sveta|kalendáře]] (měsíce/sezóny/měsíční fáze).

Ovlivňuje nebeský stav (poloha měsíce), sezónu a tím i počasí.

## Kde se objevuje

- v dokumentaci: [15-cas-pribeh.md](docs/funkce/15-cas-pribeh.md)
- v UI: zobrazení aktuálního data v kalendáři světa

## Nepleť s

- **[[kalendar-sveta]]** — struktura kalendáře; herní čas je konkrétní bod v ní.
