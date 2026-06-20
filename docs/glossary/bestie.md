---
name: bestie
aliases: [Bestie, bestiary creature, nestvůra, tvor, monstrum]
category: herni-mechaniky
related: [[bestiar], [npc], [token], [staty-systemu]]
status: draft
---

# Bestie

**TL;DR:** Katalogová šablona tvora/nepřítele (model `Bestie`, kolekce `bestiae`) — staty a schopnosti, ale žádné subdokumenty ani deník; při vložení na mapu se z ní vyrobí nezávislá instance.

## Detail

Bestie žije v [[bestiar|bestiáři]] (katalog) ve třech scope: osobní (per-uživatel), světová a systémová. Má staty dle [[herni-system|herního systému]] a list schopností s hodnocením pro hody.

Když PJ vloží bestii na [[takticka-mapa|mapu]], vznikne **nezávislá instance** [[token|tokenu]] — `abilities` a `notes` se odpojí od katalogu, `health.current` se naseeduje. Editace tokenu tedy nemění katalogovou šablonu (není to read-only snapshot).

📚 Liší se od [[npc]]: bestie nemá deník ani subdokumenty, je to opakovaně použitelná šablona, ne vyprávěná postava.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: [[bestiar|bestiář]], token modal varianta Bestie na mapě

## Nepleť s

- **[[npc]]** — vyprávěná postava s deníkem a subdokumenty.
- **[[bestiar]]** — katalog, ve kterém bestie bydlí.
