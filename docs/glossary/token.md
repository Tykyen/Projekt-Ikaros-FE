---
name: token
aliases: [token, figurka, žeton, MapToken]
category: herni-mechaniky
related: [[takticka-mapa], [postava], [bestie], [staty-systemu]]
status: draft
---

# Token

**TL;DR:** Herní figurka na [[takticka-mapa|taktické mapě]] reprezentující [[postava|postavu]], [[npc|NPC]] nebo [[bestie|bestii]] — pohyb, HP, viditelnost, zámek.

## Detail

Token je instance entity umístěná na hex. Tři varianty token modalu (PC / NPC / Bestie) × tři view módy (pj / owner / limited). Vlastnosti:
- **HP** — u bestie snapshot ze `systemStats`, u PC/NPC přes deníkový subdoc (per-systémový klíč),
- **obrázek** — z portrétu postavy nebo snapshotu bestie,
- **zámek** (`isLocked`) — hráč s tokenem nehne ani needituje HP,
- **per-scéna viditelnost**.

[[bestie|Bestie]] token je nezávislá instance (abilities/notes odpojené od katalogu). Token nese embed deníku/poznámek (reuse, ne kopie).

⚠️ BE `maps.repository` `toToken` je explicitní whitelist mapper — nové pole tokenu se musí přidat i tam, jinak tiše zmizí.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: figurky na taktické mapě, token panel

## Nepleť s

- **[[postava]]** — datová entita; token je její zástupce na mapě.
