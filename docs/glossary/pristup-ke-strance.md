---
name: pristup-ke-strance
aliases: [page access, přístup ke stránce, access requirement, gate stránky]
category: role-a-prava
related: [[stranka], [akj-zalozka], [akj-urovne], [world-role]]
status: draft
---

# Přístup ke stránce

**TL;DR:** Pravidla, kdo [[stranka|stránku]] vidí — kombinace podmínek (UserId, AKJ, Role, AKJ typ) spojených OR logikou.

## Detail

Přístup ke stránce je gate určující viditelnost. Podmínky (access requirement): konkrétní `UserId`, [[akj-urovne|AKJ úroveň]], [[world-role|world role]], AKJ typ. Vyhodnocují se přes OR (stačí splnit jednu).

Liší se od [[akj-zalozka|AKJ záložky]]: přístup ke stránce řeší celou stránku, AKJ záložka jednu sekci v rámci stránky.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v UI: nastavení přístupu na stránce

## Nepleť s

- **[[akj-zalozka]]** — chráněná sekce uvnitř stránky; přístup ke stránce gateuje celek.
