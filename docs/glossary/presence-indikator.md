---
name: presence-indikator
aliases: [presence, online tečka, absence indikátor]
category: chat
related: [[neviditelny-mod]]
status: draft
---

# Presence indikátor

**TL;DR:** Barevná tečka u avataru ukazující stav uživatele — zelená (online), žlutá (idle 5 min), žádná (offline / [[neviditelny-mod]]).

## Detail

Tři stavy:
- **🟢 zelená** — uživatel má platformu otevřenou a je aktivní.
- **🟡 žlutá** — uživatel je přihlášen, ale 5+ minut neudělal akci (idle).
- **(prázdné)** — offline nebo má aktivní [[neviditelny-mod]].

Stav se odvozuje server-side z presence subsystému a propaguje socketem.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/presence/OnlineDot.tsx](../../src/shared/presence/OnlineDot.tsx)
  - [src/shared/presence/usePresence.ts](../../src/shared/presence/usePresence.ts)
  - [src/shared/presence/store.ts](../../src/shared/presence/store.ts)
- v kódu (BE):
  - backend/src/modules/presence/ — presence module
- v dokumentaci:
  - HelpPage PagesSection
- v UI:
  - U každého avataru (sidebar, chat presence panel, member list)

## Nepleť s

- **[[neviditelny-mod]]** — uživatel je technicky online, ale tečka se ostatním nezobrazuje.
