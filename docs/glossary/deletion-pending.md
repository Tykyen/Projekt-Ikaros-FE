---
name: deletion-pending
aliases: [pending deletion, hold režim, 30denní hold]
category: architektura
related: [[reaktivace]], [[tombstone]]
status: draft
---

# Deletion pending

**TL;DR:** Přechodný stav účtu po smazání — 30 dní hold, během kterých se uživatel může přihlásit a účet [[reaktivace|reaktivovat]].

## Detail

Když uživatel smaže účet, nejde rovnou do [[tombstone]] — přejde do `deletion-pending` na 30 dní. Během této doby je účet **nefunkční** (běžné přihlášení blokované), ale data zůstávají.

Pokud se uživatel během 30 dní pokusí přihlásit, nabídne se [[reaktivace]]. Po vypršení 30 dní se účet nevratně přepne na [[tombstone]].

## Kde se objevuje

- v kódu (FE):
  - [src/features/auth/components/ReactivateAccountModal.tsx](../../src/features/auth/components/ReactivateAccountModal.tsx)
  - [src/features/profile/components/DeleteAccountModal.tsx](../../src/features/profile/components/DeleteAccountModal.tsx)
  - [src/features/profile/api/useDeleteAccount.ts](../../src/features/profile/api/useDeleteAccount.ts)
- v dokumentaci:
  - HelpPage AccountSection
- v UI:
  - Profil → Bezpečnost → Smazat účet
  - Reaktivační modal po pokusu o přihlášení

## Nepleť s

- **[[tombstone]]** — finální stav po vypršení 30 dní; deletion-pending je dočasný hold.
- **ban** — administrativní blok; deletion-pending je z vůle uživatele.
