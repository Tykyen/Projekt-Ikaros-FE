---
name: reaktivace
aliases: [reactivation, obnovení účtu]
category: architektura
related: [[deletion-pending]], [[tombstone]]
status: draft
---

# Reaktivace

**TL;DR:** Obnovení smazaného účtu během 30denního [[deletion-pending]] hold režimu — po vypršení už není možná.

## Detail

Pokud se uživatel přihlásí během hold režimu, FE detekuje stav a nabídne reaktivaci přes dedikovaný modal. Po potvrzení se účet vrátí do plně funkčního stavu, profil i data zůstanou nedotčené.

Po 30 dnech reaktivace **už není možná** — účet přechází na [[tombstone]].

## Kde se objevuje

- v kódu (FE):
  - [src/features/auth/components/ReactivateAccountModal.tsx](../../src/features/auth/components/ReactivateAccountModal.tsx)
- v dokumentaci:
  - HelpPage AccountSection + FaqSection
- v UI:
  - Reaktivační modal při přihlášení do účtu v deletion-pending

## Nepleť s

- **[[deletion-pending]]** — stav (časové okno); reaktivace je akce, která ho ukončí.
- **resetování hesla** — jiný workflow (zapomenuté heslo na živém účtu).
