---
name: korektor
aliases: [Korektor, proofreader, redactor]
category: role-a-prava
related: [[world-role]]
status: draft
---

# Korektor

**TL;DR:** Redakční světová role (`WorldRole.Korektor = 3`) — smí číst a **upravovat** obsah, ale ne mazat.

## Detail

Korektor je nad běžným [[hrac|Hráčem]], ale pod herními pomocníky ([[pomocny-pj]], [[pan-jeskyne]]). Smí redakčně **upravovat** existující obsah (typo, formulace, drobné edity), ale ne mazat ani přidávat zásadní změny.

⚠️ **Stav TBD** — podle nápovědy je role „v přípravě" a nemá ještě plně reálné chování.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `WorldRole.Korektor = 3`
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx) — PenLine ikona
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts
- v UI:
  - World Settings → Members tab (PenLine ikona)

## Nepleť s

- **[[pomocny-pj]]** — víc pravomocí (i mazání, [[akj-urovne|AKJ úrovně]]); Korektor jen edituje.
- **[[hrac]]** — neupravuje cizí obsah.
