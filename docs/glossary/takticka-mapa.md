---
name: takticka-mapa
aliases: [tactical map, taktická mapa, bojiště, mapa boje, battle map]
category: herni-mechaniky
related: [[token], [fog-of-war], [iniciativa], [efekt-na-mape], [mapova-scena]]
status: draft
---

# Taktická mapa

**TL;DR:** Interaktivní PixiJS plátno pro boj a scény — [[token|tokeny]], [[fog-of-war|mlha]], [[efekt-na-mape|efekty]] a [[iniciativa|iniciativa]] na hexové mřížce.

## Detail

Taktická mapa je herní nástroj PJ pro vedení scén a soubojů. Běží na PixiJS (WebGL) nad axiální hexovou mřížkou. Obsahuje:
- [[token|tokeny]] (PC/[[npc|NPC]]/[[bestie]]) s pohybem a HP,
- [[fog-of-war|mlhu války]] (skryté oblasti),
- [[efekt-na-mape|efekty]] (barvy hexů, exploze, bariéry),
- [[iniciativa|combat tracker]] (řazení bojovníků, kola).

Změny mapy jdou přes typovaný operations model (undo, real-time přes WS). Mapy se ukládají do [[knihovna-map|knihovny]]. Hráči vidí jen [[mapova-scena|scénu]], na kterou jsou přiřazeni.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: sekce Mapy / nástroj hry ve světě

## Nepleť s

- **[[obrazkovy-atlas]]** — statická galerie obrázkových map, ne herní plátno.
- **[[vesmirna-mapa]]** — force-directed graf planet, ne bojiště.
