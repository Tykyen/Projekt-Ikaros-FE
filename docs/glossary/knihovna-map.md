---
name: knihovna-map
aliases: [map library, knihovna map, map template, šablona scény, mapová šablona]
category: herni-mechaniky
related: [[mapova-scena], [takticka-mapa], [dungeon-builder]]
status: draft
---

# Knihovna map

**TL;DR:** Per-PJ privátní, cross-world úložiště šablon [[mapova-scena|scén]] — uloží celou scénu kromě PC tokenů.

## Detail

Knihovna map drží šablony [[mapova-scena|scén]], které PJ může znovu použít napříč svými světy. Šablona je plný snapshot scény (tokeny [[npc|NPC]]/[[bestie]], [[efekt-na-mape|efekty]], [[fog-of-war|fog]]) **kromě PC tokenů** — hráčské postavy se do šablony neukládají.

Knihovna je privátní per-PJ. Souvisí s [[dungeon-builder|dungeon builderem]] (tile-based editor scén/šablon).

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: knihovna na taktické mapě

## Nepleť s

- **[[mapova-scena]]** — živá instance; knihovna drží uložené šablony.
- **[[obrazkovy-atlas]]** — galerie obrázkových map pro hráče, ne herní šablony.
