---
name: mapova-scena
aliases: [scene, scéna, mapová scéna, bojiště, scene-hidden-mode]
category: herni-mechaniky
related: [[takticka-mapa], [knihovna-map], [token], [fog-of-war]]
status: draft
---

# Mapová scéna

**TL;DR:** Jedna konkrétní [[takticka-mapa|taktická mapa]]/bojiště se svými [[token|tokeny]], [[efekt-na-mape|efekty]], [[fog-of-war|mlhou]] a bojem; hráč je k ní přiřazen a vidí jen ji.

## Detail

Scéna je instance bojiště. Více scén může být aktivních paralelně. Hráč je přiřazen přes `WorldMembership.currentSceneId` a vidí jen svou scénu; při přechodu jeho token z předchozí auto-mizí.

Stavy scény:
- **skrytá** (hidden) — v přípravě, hráč vidí overlay „Scéna není připravena",
- **zamčená** (locked) — hráč nemůže hýbat tokeny (per-svět + per-hráč override).

Scénu lze uložit jako šablonu do [[knihovna-map|knihovny]].

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: přepínač scén na taktické mapě

## Nepleť s

- **[[knihovna-map]]** — úložiště šablon scén; scéna je živá instance.
