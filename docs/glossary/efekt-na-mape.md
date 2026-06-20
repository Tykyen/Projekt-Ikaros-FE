---
name: efekt-na-mape
aliases: [effect, efekt, tactical effect, bariéra, barrier]
category: herni-mechaniky
related: [[takticka-mapa], [token], [mapova-scena]]
status: draft
---

# Efekt na mapě

**TL;DR:** Vizuální efekt na [[takticka-mapa|taktické mapě]] — obarvení hexu, exploze, bariéra apod., většinou jen vizuální (pohyb fyzicky neblokuje).

## Detail

Efekty zvýrazňují dění na mapě: barva hexu (zóna), exploze, bariéra (kruh/brush). Bariéra je vizuální značka — pohyb [[token|tokenů]] fyzicky neblokuje (MVP).

Efekty jsou součástí typovaného operations modelu mapy (lze je přidávat/rušit, real-time přes WS), per-[[mapova-scena|scéna]].

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: vrstva efektů na taktické mapě

## Nepleť s

- **[[fog-of-war]]** — skrývání oblastí; efekt naopak něco zviditelňuje/značí.
