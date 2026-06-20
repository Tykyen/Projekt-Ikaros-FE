---
name: obrazkovy-atlas
aliases: [world map, obrázkový atlas, atlas, mapy světa, world maps]
category: herni-mechaniky
related: [[takticka-mapa], [vesmirna-mapa], [stranka]]
status: draft
---

# Obrázkový atlas

**TL;DR:** Statická galerie obrázkových map světa (Mapy, spec 13.4) — složky, obrázky, viditelnost per role/hráč.

## Detail

Obrázkový atlas (sekce „Mapy") je galerie statických obrázkových map členěná do složek. BE modul `world-maps` (vzor universe). Viditelnost přes `isPublic` + `visibleToPlayerIds` (leak-safe). `canManage` bere world PJ.

Není to herní [[takticka-mapa|taktická mapa]] ani [[vesmirna-mapa|graf]] — jen prohlížeč obrázků s výřezem/zoomem.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: sekce Mapy ve světě

## Nepleť s

- **[[takticka-mapa]]** — interaktivní bojiště s tokeny.
- **[[vesmirna-mapa]]** — force-directed graf míst.
