---
name: zpracovat-tab
aliases: [Zpracovat, queue, fronta žádostí]
category: ui
related: [[cooldown]]
status: draft
---

# Zpracovat (tab)

**TL;DR:** Univerzální fronta žádostí napříč moduly — schválení přátelství, změny username, vstupu do světa, obsahu atd. — sdružené v jednom tabu místo rozházených seznamů.

## Detail

Místo samostatných „žádostí" v každém modulu má každý uživatel jeden tab **Zpracovat**, kde se sjednocují všechny položky vyžadující rozhodnutí.

Položky se zobrazují jako karty s akcemi (schválit / odmítnout / odložit) podle typu. Při odmítnutí se obvykle aktivuje [[cooldown]] (např. 24 h u přátelství).

## Kde se objevuje

- v kódu (FE):
  - [src/features/users/components/tabs/ZpracovatTab/](../../src/features/users/components/tabs/ZpracovatTab/)
  - [src/features/users/api/usePendingActions.ts](../../src/features/users/api/usePendingActions.ts)
- v dokumentaci:
  - HelpPage PagesSection + FaqSection
- v UI:
  - Profil → tab „Zpracovat"

## Nepleť s

- **Notifikace** — pasivní informace; Zpracovat vyžaduje akci.
