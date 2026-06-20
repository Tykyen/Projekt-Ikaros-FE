---
name: soft-delete-sveta
aliases: [soft delete, mazání světa, 30denní obnova, world soft delete]
category: svet
related: [[svet], [governance], [predani-sveta], [deletion-pending]]
status: draft
---

# Soft-delete světa

**TL;DR:** Smazání [[svet|světa]] je 30denní obnovovací okno — data zůstanou, teprve po lhůtě je smaže hard-delete.

## Detail

Když se svět smaže, přejde do 30denního recovery režimu (soft-delete). Pravidla:
- mazat může **PJ/Admin**, ale **obnovit smí jen Admin** (s převzetím = `newOwnerId`),
- po lhůtě `WorldHardDeleteService` kaskádně smaže ~40 kolekcí (+ cron),
- chat je recovery-safe (NE `content:null`).

📚 Obnova opuštěného soft-smazaného světa je **jediná** pravomoc, kterou platform Admin uvnitř světa má — jinak platí [[governance]] R-20 (autorita = PJ).

## Kde se objevuje

- v dokumentaci: [09-svet-vstup-clenstvi.md](docs/funkce/09-svet-vstup-clenstvi.md), [10-nastaveni-hlavni-lista.md](docs/funkce/10-nastaveni-hlavni-lista.md)
- v UI: mazání světa v nastavení, admin obnova

## Nepleť s

- **[[deletion-pending]]** — 30denní hold smazaného **účtu**, ne světa.
