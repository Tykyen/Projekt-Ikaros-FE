---
name: predani-sveta
aliases: [transfer ownership, předání světa, předání vlastnictví, transfer]
category: svet
related: [[svet], [pan-jeskyne], [governance], [soft-delete-sveta]]
status: draft
---

# Předání světa

**TL;DR:** Změna vlastníka ([[pan-jeskyne|PJ]]) [[svet|světa]] — smí ji udělat jen vlastník; nový vlastník se stane PJ, původní klesne na PomocnyPJ.

## Detail

Předání světa převede vlastnictví na jiného člena. Pravidla:
- iniciovat smí **jen vlastník** (PJ),
- nový vlastník se stane [[pan-jeskyne|PJ]], dosavadní se stane [[pomocny-pj|PomocnyPJ]].

📚 Platform Admin tuto bránu **nemá** (odebráno v R-20, viz [[governance]]) — výjimkou je jen dosazení PJ při obnově opuštěného [[soft-delete-sveta|soft-smazaného]] světa.

## Kde se objevuje

- v dokumentaci: [10-nastaveni-hlavni-lista.md](docs/funkce/10-nastaveni-hlavni-lista.md)
- v UI: nastavení světa → předání

## Nepleť s

- **[[soft-delete-sveta]]** — mazání s obnovou; předání mění vlastníka živého světa.
