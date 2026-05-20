---
name: theme-adjust
aliases: [themeAdjust, a11y theme tuning]
category: tema-a-skin
related: [[tema]], [[theme-overrides]], [[world-membership]]
status: draft
---

# Theme adjust

**TL;DR:** Strukturované per-uživatelské doladění vzhledu pro přístupnost — brightness, contrast, background dim.

## Detail

Na rozdíl od [[theme-overrides]] **není** volný map tokenů, ale **uzavřená struktura** (`WorldThemeAdjust`). Cíl: a11y úprava bez nutnosti rozumět CSS proměnným.

Drží se per-uživatel × per-svět ve [[world-membership]] (`themeAdjust`).

## Kde se objevuje

- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts — `themeAdjust?: WorldThemeAdjust`
- v kódu (FE):
  - [src/themes/applyTheme.ts](../../src/themes/applyTheme.ts) — aplikuje brightness/contrast/bgDim
- v dokumentaci:
  - [docs/arch/phase-5/spec-5.9-user-theme-a11y.md](../arch/phase-5/spec-5.9-user-theme-a11y.md)
- v UI:
  - Profil → Vzhled → Color Overrides editor (brightness / contrast / background dim)

## Nepleť s

- **[[theme-overrides]]** — libovolný map CSS tokenů; theme-adjust je uzavřená a11y struktura.
