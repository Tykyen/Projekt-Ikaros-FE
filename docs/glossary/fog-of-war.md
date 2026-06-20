---
name: fog-of-war
aliases: [fog of war, mlha, mlha války, fog, zamlžení]
category: herni-mechaniky
related: [[takticka-mapa], [token], [mapova-scena]]
status: draft
---

# Fog of War

**TL;DR:** Mlha války na [[takticka-mapa|taktické mapě]] — hráč vidí jen odhalené oblasti a okolí svých [[token|tokenů]], zbytek je skrytý.

## Detail

Fog of War skrývá části mapy před hráči. PJ odhaluje/zakrývá oblasti; hráč vidí odkryté hexy plus okolí vlastních [[postava|postav]]. Implementace je hybridní (kombinace odhaleného stavu a dynamického dohledu kolem tokenů).

Je to per-[[mapova-scena|scénový]] stav. Slouží k postupnému odhalování prostředí během hry.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: vrstva mlhy na taktické mapě

## Nepleť s

- **[[mapova-scena|skrytá scéna]]** — celá scéna není připravená; fog skrývá jen části připravené scény.
