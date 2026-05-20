---
name: sepot
aliases: [šepot, whisper, soukromá zpráva]
category: chat
related: [[konverzace]]
status: draft
---

# Šepot

**TL;DR:** Soukromá zpráva v [[konverzace|konverzaci]] viditelná jen jednomu adresátovi — vizuálně se odlišuje od běžné zprávy.

## Detail

Šepot se posílá z běžné konverzace výběrem konkrétního uživatele jako adresáta — viditelná zpráva pak míří **jen jemu**, ostatní v konverzaci ji nevidí.

Vizuálně se šepot rozliší přebarvením pole zprávy (jiná barva pozadí / okraje).

## Kde se objevuje

- v kódu: TBD (chat composer + message rendering, fáze 6.x)
- v dokumentaci:
  - HelpPage PagesSection (sekce Hospoda)
- v UI:
  - Chat composer — výběr adresáta pro šepot
  - Message list — šepot vykreslený s odlišnou barvou

## Nepleť s

- **DM / privátní konverzace** — samostatná konverzace mezi dvěma; šepot je jediná zpráva uvnitř veřejné konverzace.
