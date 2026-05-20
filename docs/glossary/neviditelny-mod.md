---
name: neviditelny-mod
aliases: [neviditelný mód, invisible mode, hidden presence]
category: chat
related: [[presence-indikator]]
status: draft
---

# Neviditelný mód

**TL;DR:** Skrytí vlastního online stavu — uživatel vidí ostatní, ale ostatním se jeví jako offline.

## Detail

Checkbox v profilu (Bezpečnost / Účet). Když je aktivní, [[presence-indikator]] u jména uživatele se ostatním nezobrazuje (tváří se jako trvale offline), ale uživatel sám vidí ostatní normálně.

Neovlivňuje doručování zpráv ani jiné akce — jen vizuální presence.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/presence/](../../src/shared/presence/)
  - [src/features/profile/components/SecuritySection.tsx](../../src/features/profile/components/SecuritySection.tsx)
- v dokumentaci:
  - HelpPage AccountSection
- v UI:
  - Profil → Bezpečnost (checkbox Neviditelný mód)

## Nepleť s

- **offline** — reálný stav (uživatel není přihlášen); neviditelný mód ho jen předstírá.
