---
name: tombstone
aliases: [tombstone state, smazaný účet]
category: ui
related: [[deletion-pending]], [[reaktivace]]
status: draft
---

# Tombstone

**TL;DR:** Vizuální stav smazaného účtu — černá diagonální páska + šedá maska — identita autora se nevratně skryje, ale jeho obsah v komunitě zůstává.

## Detail

Tombstone se zobrazí, jakmile uživatel definitivně smaže účet (po vypršení [[deletion-pending]] hold režimu). Jméno, avatar a profilové údaje jsou nahrazeny tombstone vrstvou — komunita ale vidí, že tu autor byl a co napsal nebo vytvořil.

Cíl: zachovat soudržnost konverzací a obsahu i po odchodu uživatele.

## Kde se objevuje

- v kódu (FE):
  - [src/features/users/components/PublicProfile/TombstoneBanner.tsx](../../src/features/users/components/PublicProfile/TombstoneBanner.tsx)
- v dokumentaci:
  - HelpPage AccountSection + FaqSection
- v UI:
  - Veřejný profil smazaného uživatele
  - Komentáře, diskuze, seznamy, kde figuruje smazaný autor

## Nepleť s

- **[[deletion-pending]]** — předchozí stav (30 dní hold); tombstone přichází až po jeho vypršení.
- **ban** — administrativní zablokování; tombstone je trvalé smazání identity z vůle uživatele.
