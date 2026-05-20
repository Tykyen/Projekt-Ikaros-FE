---
name: ornament
aliases: [decoration, dekorace]
category: tema-a-skin
related: [[skin]], [[tema]]
status: draft
---

# Ornament

**TL;DR:** Dekorativní vrstva uvnitř [[skin]]u — vizuální motiv (runy, vlnky, hvězdy, matrix rain, …), který skinu dodává identitu.

## Detail

Každý [[skin]] má **vlastní originální ornamenty**. Ornamenty se mezi skiny **nesdílí ani nerecyklují** — když „severské runy" mají rune-pattern, „kyberpunk" musí mít jiný motiv, ne kopii.

Ornament je čistě vizuální vrstva, neovlivňuje funkčnost ani layout.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/ui/CornerOrnament/CornerOrnament.tsx](../../src/shared/ui/CornerOrnament/CornerOrnament.tsx) — rotovaný diamant v rohu
  - [src/shared/ui/IkarosCard/IkarosCard.tsx](../../src/shared/ui/IkarosCard/IkarosCard.tsx) — používá 4× CornerOrnament
  - `src/themes/themes/*/decorations.css` — per-skin CSS ovládá viditelnost
- v kódu (BE):
  - žádné výskyty (ornament je čistě FE-side).
- v dokumentaci:
  - [docs/themes/](../themes/) — popis konkrétních skinů a jejich motivů
- v UI:
  - Rohové diamanty na IkarosCard (welcome / news varianta)
  - Aktivní jen u vybraných skinů (např. „Pergamen", „Nemrtví")

## Nepleť s

- **[[skin]]** — celý vzhled vč. barev a fontů; ornament je jen dekorativní podvrstva.
- **asset / obrázek** — ornament může být asset, ale taky čistě CSS / SVG generativní.
