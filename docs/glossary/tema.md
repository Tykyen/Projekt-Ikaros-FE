---
name: tema
aliases: [theme, theme system]
category: tema-a-skin
related: [[skin]]
status: draft
---

# Téma

**TL;DR:** Systém vzhledu — mechanika, která umožňuje přepínat [[skin]]y přes `data-theme` atribut a sadu CSS proměnných.

## Detail

Téma je **abstrakce / systém**, skin je **konkrétní instance**. Theme system definuje:
- jak se aplikuje `data-theme="<id>"` na root,
- jaké CSS proměnné má každý skin definovat (barvy, fonty, ornamenty),
- **theme isolation** — úpravy konkrétního skinu jsou scoped na `[data-theme="<id>"]`, nesahá se do globálních / sdílených stylů bez souhlasu.

## Kde se objevuje

- v kódu (FE):
  - [src/themes/types.ts](../../src/themes/types.ts) — `Theme` typ
  - [src/themes/ThemeProvider.tsx](../../src/themes/ThemeProvider.tsx) — context, aplikuje `data-theme`
  - [src/themes/state.ts](../../src/themes/state.ts) — Jotai atoms (preview, persisted)
  - [src/themes/registry.ts](../../src/themes/registry.ts) — `THEMES` mapa, `DEFAULT_WORLD_THEME = 'ikaros'`
  - [src/themes/useTheme.ts](../../src/themes/useTheme.ts)
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world.interface.ts — `themeId`, [[theme-overrides]], `themeBackgroundUrl`
  - backend/src/modules/worlds/schemas/world.schema.ts
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts — [[theme-adjust]], `themeUserOverrides`
- v dokumentaci:
  - [docs/arch/phase-1/spec-1.2e-theme-sync.md](../arch/phase-1/spec-1.2e-theme-sync.md)
  - [docs/arch/phase-5/spec-5.9-user-theme-a11y.md](../arch/phase-5/spec-5.9-user-theme-a11y.md)
  - [docs/themes/README.md](../themes/README.md)
  - [docs/superpowers/specs/2026-05-07-theme-system-design.md](../superpowers/specs/2026-05-07-theme-system-design.md)
- v UI:
  - Profil → Vzhled (Theme Switcher, [[theme-adjust]] editor)
  - World Settings → Theme tab (preset + [[theme-overrides]])

## Nepleť s

- **[[skin]]** — konkrétní vzhledová varianta (např. „kyberpunk"); téma je systém, který je drží pohromadě.
