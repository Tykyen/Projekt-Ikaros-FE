---
name: prirazeni-sceny
aliases: [přiřazení scény, scene assignment, player assignment, currentSceneId]
category: herni-mechaniky
related: [[mapova-scena], [takticka-mapa], [world-membership]]
status: draft
---

# Přiřazení scény

**TL;DR:** Navázání hráče na konkrétní [[mapova-scena|scénu]] přes `WorldMembership.currentSceneId` — hráč vidí jen svou scénu.

## Detail

Přiřazení scény řídí, kterou [[mapova-scena|scénu]] hráč zrovna vidí. Více scén může běžet paralelně; každý hráč je přiřazen na jednu (`currentSceneId`). Při přechodu na jinou scénu jeho [[token]] z předchozí auto-mizí.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v kódu: `WorldMembership.currentSceneId`

## Nepleť s

- **[[mapova-scena]]** — samotná scéna; přiřazení říká, kdo ji vidí.
