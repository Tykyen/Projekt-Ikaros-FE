---
name: operations-model
aliases: [operations model, operační model, typované operace, undo mapy, map operations]
category: herni-mechaniky
related: [[takticka-mapa], [token], [efekt-na-mape]]
status: draft
---

# Operations model

**TL;DR:** Architektura změn [[takticka-mapa|taktické mapy]] — každá změna je typovaná operace s podporou undo a real-time synchronizace přes WS.

## Detail

Místo přímých mutací stavu jdou změny mapy (pohyb [[token|tokenu]], přidání [[efekt-na-mape|efektu]], odhalení [[fog-of-war|fogu]]…) jako **typované operace**. Výhody: undo (inverzní operace — některé MVP operace inverzi nemají), real-time broadcast přes WebSocket, auditovatelnost.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: undo na taktické mapě

## Nepleť s

- **[[takticka-mapa]]** — plátno; operations model je způsob, jak se mění.
