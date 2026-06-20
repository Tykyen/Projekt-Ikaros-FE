---
name: generator-pocasi
aliases: [weather, počasí, weather generator, generátor počasí, weather preset]
category: herni-mechaniky
related: [[herni-cas], [kalendar-sveta]]
status: draft
---

# Generátor počasí

**TL;DR:** Generuje počasí světa podle [[herni-cas|herního data]] a sezóny — z reálného světa, archetypu (poušť, tropy, arktida…) nebo manuálně.

## Detail

Počasí se odvíjí od aktuálního [[herni-cas|herního času]] (sezóna z [[kalendar-sveta|kalendáře]]). Tři režimy:
- **reálný svět** — podle skutečných dat,
- **archetyp / preset** — šablona klimatu (poušť, tropy, arktida…),
- **manuální**.

Operace „posuň den" zároveň přegeneruje počasí. Počasí chodí na mapu jako world-level WS event (přes neutrální room `world:{id}`).

## Kde se objevuje

- v dokumentaci: [15-cas-pribeh.md](docs/funkce/15-cas-pribeh.md)
- v UI: počasí v kalendáři, na taktické mapě

## Nepleť s

- **[[herni-cas]]** — vstup (datum/sezóna); počasí je výstup.
