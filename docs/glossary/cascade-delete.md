---
name: cascade-delete
aliases: [cascade delete, kaskádní mazání, event-driven cleanup, cascade]
category: architektura
related: [[soft-delete-sveta], [postava], [self-healing]]
status: draft
---

# Cascade delete

**TL;DR:** Smazání entity spustí úklid všech přidružených dat (subdokumenty, bloby, vazby) — typicky event-driven.

## Detail

Cascade delete zajišťuje, že po smazání [[stranka|stránky]]/[[postava|postavy]]/[[svet|světa]] nezůstanou osiřelá data. Smazání triggeruje cleanup navázaných kolekcí a souborů. U [[soft-delete-sveta|světa]] běží hard-delete přes ~40 kolekcí + cron.

⚠️ Nejednotnost vzorů mazání je předmět auditu (cascade-delete audit) — viz docs.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md), [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)

## Nepleť s

- **[[self-healing]]** — doplňuje chybějící; cascade delete uklízí po smazaném.
- **[[soft-delete-sveta]]** — odložené mazání s obnovou; cascade je samotný úklid.
